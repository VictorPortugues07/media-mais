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

  // Proteção: o canal /tv/[pontoId] direto só é acessível pelo próprio dono do ponto ou admin autenticado.
  // Visualizadores externos devem usar o player pareado via código em /player
  const session = await getSession();
  if (!session) {
    return Response.json(
      { error: "Acesso não autorizado. Para conectar uma TV, acesse /player e informe o código." },
      { status: 401 }
    );
  }

  const ponto = await prisma.pontoMidia.findUnique({
    where: { id },
    select: { id: true, nomeEmpresa: true, status: true, userId: true },
  });

  if (!ponto || ponto.status !== "ATIVO") {
    return Response.json({ error: "Ponto nao encontrado ou inativo" }, { status: 404 });
  }

  if (session.role !== "ADMIN" && ponto.userId !== session.userId) {
    return Response.json(
      { error: "Acesso restrito. Não é permitido acessar transmissões de outros pontos pela URL." },
      { status: 403 }
    );
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
