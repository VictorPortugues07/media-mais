import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notificarAprovacao } from "@/lib/notificacoes";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return Response.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const anuncioId = parseInt(id);

    const anuncioExistente = await prisma.anuncio.findUnique({
      where: { id: anuncioId },
      include: {
        anunciante: { include: { user: true } },
        pontoMidia: { include: { user: true } },
      },
    });

    if (!anuncioExistente) {
      return Response.json({ error: "Anúncio não encontrado" }, { status: 404 });
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
    }

    // Ação específica: mover para a Fila de Espera
    if (body?.action === "FILA_ESPERA") {
      const anuncio = await prisma.anuncio.update({
        where: { id: anuncioId },
        data: { status: "FILA_ESPERA" },
        include: {
          anunciante: { include: { user: true } },
          pontoMidia: { include: { user: true } },
        },
      });

      await prisma.notificacao.create({
        data: {
          userId: anuncio.anunciante.user.id,
          tipo: "FILA_ESPERA",
          titulo: "Campanha na Fila de Espera",
          mensagem: `Seu anúncio "${anuncio.titulo}" foi validado pela moderação e posicionado na Fila de Espera para o ponto "${anuncio.pontoMidia.nomeEmpresa}".`,
        },
      });

      return Response.json({ anuncio, mensagem: "Anúncio movido para a Fila de Espera." });
    }

    // Verificar tempo da TV antes de ativar
    const outrosAtivos = await prisma.anuncio.findMany({
      where: {
        pontoMidiaId: anuncioExistente.pontoMidiaId,
        status: "ATIVO",
        id: { not: anuncioId },
      },
      select: { duracaoSegundos: true },
    });

    const tempoOcupadoAtual = outrosAtivos.reduce(
      (sum, item) => sum + (item.duracaoSegundos || 10),
      0
    );
    const limiteLoop = anuncioExistente.pontoMidia.limiteTempoSegundos || 360;
    const duracaoAnuncio = anuncioExistente.duracaoSegundos || 10;

    if (tempoOcupadoAtual + duracaoAnuncio > limiteLoop && !body?.force) {
      return Response.json(
        {
          error: `A TV já possui ${tempoOcupadoAtual}s ocupados do limite de ${limiteLoop}s (6 min). Adicionar ${duracaoAnuncio}s excederia a capacidade. Deseja forçar a inclusão ou mover para a Fila de Espera?`,
          code: "CAPACIDADE_EXCEDIDA",
          tempoOcupadoAtual,
          limiteLoop,
          duracaoAnuncio,
        },
        { status: 409 }
      );
    }

    // Configurar data de fim (se informada) ou manter existente
    let dataFim = anuncioExistente.dataFim;
    if (body?.diasValidade && typeof body.diasValidade === "number") {
      const fim = new Date();
      fim.setDate(fim.getDate() + body.diasValidade);
      dataFim = fim;
    } else if (body?.dataFim) {
      dataFim = new Date(body.dataFim);
    }

    const anuncio = await prisma.anuncio.update({
      where: { id: anuncioId },
      data: {
        status: "ATIVO",
        dataInicio: new Date(),
        dataFim: dataFim,
      },
      include: {
        anunciante: { include: { user: true } },
        pontoMidia: { include: { user: true } },
      },
    });

    await notificarAprovacao(
      anuncio.anunciante.user.id,
      anuncio.pontoMidia.user.id,
      anuncio.titulo,
      anuncio.anunciante.nomeEmpresa,
      anuncio.pontoMidia.nomeEmpresa
    );

    return Response.json({ anuncio });
  } catch (error) {
    console.error("Aprovar error:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
