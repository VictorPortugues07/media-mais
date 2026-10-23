import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { processarExpiracaoAnuncios } from "@/lib/expiracao";
import { criarNotificacao } from "@/lib/notificacoes";
import { z } from "zod";
import { NextRequest } from "next/server";

// diasValidade/dataFim continuam aceitos por compatibilidade, mas a veiculação
// paga sempre dura 30 dias a partir da ativação.
const promoverFilaSchema = z.object({
  diasValidade: z.number().int().positive().optional(),
  dataFim: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
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
        { status: 400 },
      );
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

      // Já pagou? (PIX confirmado enquanto aguardava vaga)
      const pagamentoConfirmado = await tx.cobranca.findFirst({
        where: { anuncioId, status: "PAGO" },
        select: { id: true },
      });

      if (!pagamentoConfirmado) {
        // Ainda não pagou: libera para pagamento (o PIX ativa o anúncio automaticamente)
        const aguardando = await tx.anuncio.update({
          where: { id: anuncioId },
          data: { status: "APROVADO" },
          include: {
            anunciante: { include: { user: true } },
            pontoMidia: { include: { user: true } },
          },
        });

        await criarNotificacao(
          aguardando.anunciante.user.id,
          "COBRANCA",
          "Vaga liberada — falta o pagamento",
          `Abriu uma vaga na TV "${aguardando.pontoMidia.nomeEmpresa}" para a campanha "${aguardando.titulo}". Pague o PIX no seu painel para colocá-la no ar.`,
        );

        return {
          success: true,
          anuncio: aguardando,
          message:
            "Vaga liberada. O anunciante foi avisado para efetuar o pagamento.",
          status: 200,
        };
      }

      // Já pagou: entra no ar agora, com 30 dias de veiculação
      const agora = new Date();
      const updated = await tx.anuncio.update({
        where: { id: anuncioId },
        data: {
          status: "ATIVO",
          dataInicio: agora,
          dataFim: new Date(agora.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
        include: {
          anunciante: { include: { user: true } },
          pontoMidia: { include: { user: true } },
        },
      });

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
          mensagem: `O anúncio "${updated.titulo}" de "${updated.anunciante.nomeEmpresa}" foi promovido da fila de espera e já está na sua TV.`,
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
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
