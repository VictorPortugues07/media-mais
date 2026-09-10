import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
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

  // Proteção: o canal /tv/[pontoId] direto é exclusivo para administradores autenticados (inspeção).
  // Qualquer outro usuário, Smart TV ou visualizador deve usar o reprodutor oficial pareado via código em /player.
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return Response.json(
      {
        error:
          "Acesso restrito a administradores. Para conectar uma Smart TV ou reproduzir o canal, acesse /player e digite o código de pareamento de 6 dígitos.",
      },
      { status: 403 }
    );
  }

  const ponto = await prisma.pontoMidia.findUnique({
    where: { id },
    select: { id: true, nomeEmpresa: true, status: true, userId: true },
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
