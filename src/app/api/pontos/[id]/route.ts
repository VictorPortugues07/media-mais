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
        where: { status: { in: ["ATIVO", "FILA_ESPERA"] } },
        select: {
          id: true,
          titulo: true,
          tipoMidia: true,
          midiaUrl: true,
          duracaoSegundos: true,
          status: true,
          dataInicio: true,
          dataFim: true,
          criadoEm: true,
          anunciante: {
            select: { nomeEmpresa: true, categoria: true },
          },
        },
        orderBy: { criadoEm: "asc" },
      },
    },
  });

  if (!ponto) {
    return Response.json({ error: "Ponto nao encontrado" }, { status: 404 });
  }

  const ativos = ponto.anuncios.filter((a) => a.status === "ATIVO");
  const filaEspera = ponto.anuncios.filter((a) => a.status === "FILA_ESPERA");
  const tempoOcupadoSegundos = ativos.reduce(
    (acc, a) => acc + (a.duracaoSegundos || 10),
    0
  );
  const limiteTempoSegundos = ponto.limiteTempoSegundos || 360;
  const tempoDisponivelSegundos = Math.max(0, limiteTempoSegundos - tempoOcupadoSegundos);

  return Response.json({
    ponto: {
      ...ponto,
      anunciosAtivos: ativos,
      anunciosFilaEspera: filaEspera,
      tempoOcupadoSegundos,
      tempoDisponivelSegundos,
      limiteTempoSegundos,
      porcentagemOcupada: Math.min(
        100,
        Math.round((tempoOcupadoSegundos / limiteTempoSegundos) * 100)
      ),
    },
  });
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

    const dataToUpdate: Record<string, unknown> = {};
    if (body.status !== undefined) dataToUpdate.status = body.status;
    if (body.aceitaNovosAnuncios !== undefined)
      dataToUpdate.aceitaNovosAnuncios = Boolean(body.aceitaNovosAnuncios);
    if (body.limiteTempoSegundos !== undefined)
      dataToUpdate.limiteTempoSegundos = Number(body.limiteTempoSegundos);

    const ponto = await prisma.pontoMidia.update({
      where: { id: pontoId },
      data: dataToUpdate,
    });

    return Response.json({ ponto });
  } catch (error) {
    console.error("Update ponto error:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
