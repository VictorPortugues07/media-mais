import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { criarNotificacao } from "@/lib/notificacoes";
import { processarExpiracaoAnuncios } from "@/lib/expiracao";
import { z } from "zod";
import { NextRequest } from "next/server";

const aprovarSchema = z.object({
  action: z.enum(["APROVAR", "FILA_ESPERA"]).optional().default("APROVAR"),
  force: z.boolean().optional().default(false),
  diasValidade: z
    .number()
    .int("Dias de validade deve ser um número inteiro")
    .positive("Dias de validade deve ser positivo")
    .optional(),
  dataFim: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession(request);
    if (!session || session.role !== "ADMIN") {
      return Response.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const anuncioId = parseInt(id);
    if (isNaN(anuncioId)) {
      return Response.json({ error: "ID inválido" }, { status: 400 });
    }

    const rawBody = await request.json().catch(() => ({}));
    const parseResult = aprovarSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return Response.json(
        { error: parseResult.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 },
      );
    }
    const body = parseResult.data;

    // Transação atômica para validação e atualização
    const resultado = await prisma.$transaction(async (tx) => {
      const anuncioExistente = await tx.anuncio.findUnique({
        where: { id: anuncioId },
        include: {
          anunciante: { include: { user: true } },
          pontoMidia: { include: { user: true } },
        },
      });

      if (!anuncioExistente) {
        return { error: "Anúncio não encontrado", status: 404 };
      }

      // Máquina de estados: validação de pré-condições
      if (anuncioExistente.status === "REJEITADO") {
        return {
          error:
            "Anúncios rejeitados não podem ser aprovados diretamente. É necessária nova submissão pelo anunciante.",
          status: 400,
        };
      }

      if (anuncioExistente.status === "APROVADO") {
        return {
          error:
            "Este anúncio já foi aprovado e está aguardando o pagamento do anunciante.",
          status: 400,
        };
      }

      if (anuncioExistente.status === "ATIVO") {
        return {
          error:
            "Este anúncio já está ativo. Para alterar sua data ou duração, pause a veiculação primeiro.",
          status: 400,
        };
      }

      // Ação: mover para a Fila de Espera
      if (body.action === "FILA_ESPERA") {
        const anuncioFila = await tx.anuncio.update({
          where: { id: anuncioId },
          data: { status: "FILA_ESPERA" },
          include: {
            anunciante: { include: { user: true } },
            pontoMidia: { include: { user: true } },
          },
        });

        await tx.notificacao.create({
          data: {
            userId: anuncioFila.anunciante.user.id,
            tipo: "FILA_ESPERA",
            titulo: "Campanha na Fila de Espera",
            mensagem: `Seu anúncio "${anuncioFila.titulo}" foi validado pela moderação e posicionado na Fila de Espera para o ponto "${anuncioFila.pontoMidia.nomeEmpresa}".`,
          },
        });

        return {
          success: true,
          anuncio: anuncioFila,
          mensagem: "Anúncio movido para a Fila de Espera com sucesso.",
          status: 200,
        };
      }

      // Expirar anúncios vencidos neste ponto antes de calcular a capacidade
      await processarExpiracaoAnuncios(anuncioExistente.pontoMidiaId, tx);

      // Calcular cotas ocupadas pelos anúncios ativos no momento (dentro da transação)
      const cotasOcupadas = await tx.anuncio.count({
        where: {
          pontoMidiaId: anuncioExistente.pontoMidiaId,
          status: "ATIVO",
          id: { not: anuncioId },
        },
      });

      const maxCotas = anuncioExistente.pontoMidia.maxCotas || 8;

      if (cotasOcupadas >= maxCotas && !body.force) {
        return {
          error: `A TV já possui todas as ${maxCotas} cotas ocupadas (${cotasOcupadas}/${maxCotas}).`,
          code: "CAPACIDADE_EXCEDIDA",
          cotasOcupadas,
          maxCotas,
          tempoOcupadoAtual: cotasOcupadas,
          limiteLoop: maxCotas,
          status: 409,
        };
      }

      // Aprovar NÃO ativa mais o anúncio: ele fica APROVADO aguardando o PIX.
      // A ativação (e a data final de 30 dias) acontece quando o pagamento é confirmado.
      const anuncioAprovado = await tx.anuncio.update({
        where: { id: anuncioId },
        data: { status: "APROVADO" },
        include: {
          anunciante: { include: { user: true } },
          pontoMidia: { include: { user: true } },
        },
      });

      await criarNotificacao(
        anuncioAprovado.anunciante.user.id,
        "COBRANCA",
        "Anúncio aprovado — falta o pagamento",
        `Seu anúncio "${anuncioAprovado.titulo}" foi aprovado para "${anuncioAprovado.pontoMidia.nomeEmpresa}". Pague o PIX no seu painel para colocá-lo no ar.`,
      );

      return {
        success: true,
        anuncio: anuncioAprovado,
        status: 200,
      };
    });

    if ("error" in resultado) {
      return Response.json(resultado, { status: resultado.status });
    }

    return Response.json(resultado, { status: 200 });
  } catch (error) {
    console.error("Aprovar error:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
