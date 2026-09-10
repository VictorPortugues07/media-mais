import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notificarAprovacao } from "@/lib/notificacoes";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const anuncioId = parseInt(id);

    if (isNaN(anuncioId)) {
      return Response.json({ error: "ID inválido" }, { status: 400 });
    }

    const anuncio = await prisma.anuncio.findUnique({
      where: { id: anuncioId },
      include: {
        anunciante: { include: { user: true } },
        pontoMidia: { include: { user: true } },
      },
    });

    if (!anuncio) {
      return Response.json({ error: "Anúncio não encontrado" }, { status: 404 });
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Optional body
    }

    let dataFim = anuncio.dataFim;
    if (body?.diasValidade && typeof body.diasValidade === "number") {
      const fim = new Date();
      fim.setDate(fim.getDate() + body.diasValidade);
      dataFim = fim;
    } else if (body?.dataFim) {
      dataFim = new Date(body.dataFim);
    }

    const updated = await prisma.anuncio.update({
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

    // Notificação especial informando que saiu da fila e entrou na TV
    await prisma.notificacao.create({
      data: {
        userId: updated.anunciante.user.id,
        tipo: "ANUNCIO_APROVADO",
        titulo: "🎉 Vaga Liberada na TV!",
        mensagem: `Sua campanha "${updated.titulo}" saiu da fila de espera e já está sendo transmitida no ponto "${updated.pontoMidia.nomeEmpresa}"!`,
      },
    });

    await prisma.notificacao.create({
      data: {
        userId: updated.pontoMidia.user.id,
        tipo: "NOVO_ANUNCIO_TV",
        titulo: "Novo anúncio ativo na sua TV",
        mensagem: `O anúncio "${updated.titulo}" de "${updated.anunciante.nomeEmpresa}" foi promovido da fila e começou a passar na sua TV.`,
      },
    });

    return Response.json({
      success: true,
      anuncio: updated,
      message: "Anúncio promovido para a TV com sucesso!",
    });
  } catch (error) {
    console.error("Promover fila error:", error);
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
