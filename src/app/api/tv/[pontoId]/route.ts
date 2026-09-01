import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ pontoId: string }> }
) {
  const { pontoId } = await ctx.params;
  const id = parseInt(pontoId);

  if (isNaN(id)) {
    return Response.json({ error: "ID invalido" }, { status: 400 });
  }

  const ponto = await prisma.pontoMidia.findUnique({
    where: { id },
    select: { id: true, nomeEmpresa: true, status: true },
  });

  if (!ponto || ponto.status !== "ATIVO") {
    return Response.json({ error: "Ponto nao encontrado ou inativo" }, { status: 404 });
  }

  const anuncios = await prisma.anuncio.findMany({
    where: {
      pontoMidiaId: id,
      status: "ATIVO",
    },
    select: {
      id: true,
      titulo: true,
      tipoMidia: true,
      midiaUrl: true,
      duracaoSegundos: true,
      anunciante: {
        select: { nomeEmpresa: true },
      },
    },
    orderBy: { criadoEm: "asc" },
  });

  return Response.json({ ponto, anuncios });
}
