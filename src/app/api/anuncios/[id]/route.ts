import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const anuncioId = parseInt(id);

  const anuncio = await prisma.anuncio.findUnique({
    where: { id: anuncioId },
    include: {
      anunciante: true,
      pontoMidia: true,
    },
  });

  if (!anuncio) {
    return Response.json({ error: "Anuncio nao encontrado" }, { status: 404 });
  }

  return Response.json({ anuncio });
}
