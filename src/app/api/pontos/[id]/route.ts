import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const pontoId = parseInt(id);

  if (isNaN(pontoId)) {
    return Response.json({ error: "ID invalido" }, { status: 400 });
  }

  const ponto = await prisma.pontoMidia.findUnique({
    where: { id: pontoId },
    include: {
      user: { select: { nome: true, email: true } },
      anuncios: {
        where: { status: "ATIVO" },
        select: {
          id: true,
          titulo: true,
          tipoMidia: true,
          status: true,
          anunciante: {
            select: { nomeEmpresa: true },
          },
        },
      },
    },
  });

  if (!ponto) {
    return Response.json({ error: "Ponto nao encontrado" }, { status: 404 });
  }

  return Response.json({ ponto });
}

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
    const pontoId = parseInt(id);
    const body = await request.json();

    const ponto = await prisma.pontoMidia.update({
      where: { id: pontoId },
      data: { status: body.status },
    });

    return Response.json({ ponto });
  } catch (error) {
    console.error("Update ponto error:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
