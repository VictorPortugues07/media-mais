import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { processarExpiracaoAnuncios } from "@/lib/expiracao";
import { calcularPrecificacaoPonto } from "@/lib/precificacao";
import { z } from "zod";
import { NextRequest } from "next/server";

const promoverFilaSchema = z.object({
  diasValidade: z
    .number()
    .int("Dias de validade deve ser um número inteiro")
    .positive("Dias de validade deve ser positivo")
    .optional(),
  dataFim: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request);
    if (!session || session.role !== "ADMIN") {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const anuncioId = parseInt(id);
    if (isNaN(anuncioId)) {
      return Response.json({ error: "ID inválido" }, { status: 400 });
    }

    const rawBody = await request.json().catch(() => ({}));
    const parseResult = promoverFilaSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return Response.json(
        { error: parseResult.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }
    const body = parseResult.data;

    let calculatedDataFim: Date | null = null;
    if (body.diasValidade) {
      const fim = new Date();
      fim.setDate(fim.getDate() + body.diasValidade);
      calculatedDataFim = fim;
    } else if (body.dataFim) {
      const parsedDate = new Date(body.dataFim);
      if (isNaN(parsedDate.getTime()) || parsedDate <= new Date()) {
        return Response.json(
          { error: "A data final deve ser uma data futura válida" },
          { status: 400 }
        );
      }
      calculatedDataFim = parsedDate;
    }

    // Transação atômica para verificar capacidade e promover
    const resultado = await prisma.$transaction(async (tx) => {
      const anuncio = await tx.anuncio.findUnique({
        where: { id: anuncioId },
        include: {
          anunciante: { include: { user: true } },
          pontoMidia: { include: { user: true } },
        },
      });

      if (!anuncio) {
        return { error: "Anúncio não encontrado", status: 404 };
      }

      if (anuncio.status !== "FILA_ESPERA") {
        return {
          error: `Apenas anúncios com status 'FILA_ESPERA' podem ser promovidos. Status atual: ${anuncio.status}`,
          status: 400,
        };
      }

      // Expirar anúncios vencidos primeiro
      await processarExpiracaoAnuncios(anuncio.pontoMidiaId, tx);

      // 1. Verificar se cabe nas cotas da TV
      const cotasOcupadas = await tx.anuncio.count({
        where: {
          pontoMidiaId: anuncio.pontoMidiaId,
          status: "ATIVO",
          id: { not: anuncioId },
        },
      });

      const maxCotas = anuncio.pontoMidia.maxCotas || 8;

      if (cotasOcupadas >= maxCotas) {
        return {
          error: `Não há cotas disponíveis na TV. Todas as ${maxCotas} cotas estão ocupadas (${cotasOcupadas}/${maxCotas}).`,
          code: "CAPACIDADE_EXCEDIDA",
          cotasOcupadas,
          maxCotas,
          tempoOcupadoAtual: cotasOcupadas,
          limiteLoop: maxCotas,
          status: 409,
        };
      }

      const finalDataFim = calculatedDataFim ?? anuncio.dataFim;

      const updated = await tx.anuncio.update({
        where: { id: anuncioId },
        data: {
          status: "ATIVO",
          dataInicio: new Date(),
          dataFim: finalDataFim,
        },
        include: {
          anunciante: { include: { user: true } },
          pontoMidia: { include: { user: true } },
        },
      });

      const precificacao = calcularPrecificacaoPonto({
        fluxoDiarioEstimado: updated.pontoMidia.fluxoDiarioEstimado,
        tempoPermanencia: updated.pontoMidia.tempoPermanencia,
        notaFluxo: updated.pontoMidia.notaFluxo,
        notaTempo: updated.pontoMidia.notaTempo,
        notaPerfil: updated.pontoMidia.notaPerfil,
        notaExclusividade: updated.pontoMidia.notaExclusividade,
      });
      const repasseValor = updated.pontoMidia.cotaMensal 
        ? updated.pontoMidia.cotaMensal * 0.5 
        : precificacao.repasseAoPonto;

      // Notificações
      await tx.notificacao.create({
        data: {
          userId: updated.anunciante.user.id,
          tipo: "ANUNCIO_APROVADO",
          titulo: "Vaga Liberada na TV!",
          mensagem: `Sua campanha "${updated.titulo}" saiu da fila de espera e já está sendo transmitida no ponto "${updated.pontoMidia.nomeEmpresa}"!`,
        },
      });

      await tx.notificacao.create({
        data: {
          userId: updated.pontoMidia.user.id,
          tipo: "NOVO_ANUNCIO_TV",
          titulo: "Novo anúncio ativo na sua TV",
          mensagem: `Novo anunciante na sua TV! O anúncio "${updated.titulo}" de "${updated.anunciante.nomeEmpresa}" foi promovido da fila de espera. Você começará a receber + ${repasseValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} mensais na sua conta.`,
        },
      });

      return {
        success: true,
        anuncio: updated,
        message: "Anúncio promovido para a TV com sucesso!",
        status: 200,
      };
    });

    if ("error" in resultado) {
      return Response.json(resultado, { status: resultado.status });
    }

    return Response.json(resultado, { status: 200 });
  } catch (error) {
    console.error("Promover fila error:", error);
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
