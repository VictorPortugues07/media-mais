import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notificarAprovacao } from "@/lib/notificacoes";
import { NextRequest } from "next/server";

export async function PATCH(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return Response.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const anuncioId = parseInt(id);

    const anuncio = await prisma.anuncio.update({
      where: { id: anuncioId },
      data: {
        status: "ATIVO",
        dataInicio: new Date(),
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
