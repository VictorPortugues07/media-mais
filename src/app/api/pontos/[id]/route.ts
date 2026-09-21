import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { calcularPrecificacaoPonto } from "@/lib/precificacao";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession(request);
  const { id } = await ctx.params;
  const pontoId = parseInt(id);

  if (isNaN(pontoId)) {
    return Response.json({ error: "ID invalido" }, { status: 400 });
  }

  const ponto = await prisma.pontoMidia.findUnique({
    where: { id: pontoId },
    include: {
      user: { select: { nome: true } },
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

  // Cotas (1 anunciante ativo = 1 cota)
  const maxCotas = ponto.maxCotas || 8;
  const cotasOcupadas = ativos.length;
  const cotasDisponiveis = Math.max(0, maxCotas - cotasOcupadas);

  const precificacao = calcularPrecificacaoPonto({
    fluxoDiarioEstimado: ponto.fluxoDiarioEstimado,
    tempoPermanencia: ponto.tempoPermanencia,
    notaFluxo: ponto.notaFluxo,
    notaTempo: ponto.notaTempo,
    notaPerfil: ponto.notaPerfil,
    notaExclusividade: ponto.notaExclusividade,
  });

  const tempoOcupadoSegundos = ativos.reduce(
    (acc, a) => acc + (a.duracaoSegundos || 10),
    0
  );
  const limiteTempoSegundos = ponto.limiteTempoSegundos || 360;
  const tempoDisponivelSegundos = Math.max(0, limiteTempoSegundos - tempoOcupadoSegundos);

  // Apenas admins ou o próprio dono do ponto podem ver códigos de pareamento
  const isAdmin = session?.role === "ADMIN";
  const isOwner = session?.role === "PONTO" && session?.userId === ponto.userId;
  const podeVerCodigos = isAdmin || isOwner;

  const { codigoTv, codigoRotativo, codigoRotativoExpira, ...restoPonto } = ponto;

  return Response.json({
    ponto: {
      ...restoPonto,
      ...(podeVerCodigos ? { codigoTv, codigoRotativo, codigoRotativoExpira } : {}),
      anunciosAtivos: ativos,
      anunciosFilaEspera: filaEspera,
      maxCotas,
      cotasOcupadas,
      cotasDisponiveis,
      porcentagemOcupada: Math.min(
        100,
        Math.round((cotasOcupadas / maxCotas) * 100)
      ),
      tier: ponto.tier || precificacao.tier,
      cotaMensal: ponto.cotaMensal ?? precificacao.cotaMensal,
      scorePonderado: ponto.scorePonderado ?? precificacao.scorePonderado,
      repasseAoPonto: precificacao.repasseAoPonto,
      tempoOcupadoSegundos,
      tempoDisponivelSegundos,
      limiteTempoSegundos,
    },
  });
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request);
    if (!session || session.role !== "ADMIN") {
      return Response.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const pontoId = parseInt(id);
    if (isNaN(pontoId)) {
      return Response.json({ error: "ID inválido" }, { status: 400 });
    }

    const pontoAtual = await prisma.pontoMidia.findUnique({
      where: { id: pontoId },
    });
    if (!pontoAtual) {
      return Response.json({ error: "Ponto não encontrado" }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return Response.json({ error: "Corpo da requisição inválido" }, { status: 400 });
    }

    const dataToUpdate: Record<string, unknown> = {};

    if (body.status !== undefined) {
      const statusValidos = ["PENDENTE", "ATIVO", "INATIVO"];
      if (!statusValidos.includes(body.status)) {
        return Response.json(
          { error: "Status inválido. Permitidos: PENDENTE, ATIVO, INATIVO" },
          { status: 400 }
        );
      }
      dataToUpdate.status = body.status;
    }

    if (body.aceitaNovosAnuncios !== undefined) {
      dataToUpdate.aceitaNovosAnuncios = Boolean(body.aceitaNovosAnuncios);
    }

    if (body.maxCotas !== undefined) {
      const maxCotas = Number(body.maxCotas);
      if (isNaN(maxCotas) || maxCotas <= 0) {
        return Response.json({ error: "maxCotas deve ser um número positivo" }, { status: 400 });
      }
      dataToUpdate.maxCotas = maxCotas;
    }

    if (body.limiteTempoSegundos !== undefined) {
      const limite = Number(body.limiteTempoSegundos);
      if (isNaN(limite) || limite <= 0) {
        return Response.json({ error: "Limite de tempo deve ser um número positivo" }, { status: 400 });
      }
      dataToUpdate.limiteTempoSegundos = limite;
    }

    // Atualização de notas e recálculo de precificação
    const hasNotasUpdate =
      body.notaFluxo !== undefined ||
      body.notaTempo !== undefined ||
      body.notaPerfil !== undefined ||
      body.notaExclusividade !== undefined;

    if (hasNotasUpdate) {
      const notaFluxo = body.notaFluxo !== undefined ? Number(body.notaFluxo) : pontoAtual.notaFluxo;
      const notaTempo = body.notaTempo !== undefined ? Number(body.notaTempo) : pontoAtual.notaTempo;
      const notaPerfil = body.notaPerfil !== undefined ? Number(body.notaPerfil) : pontoAtual.notaPerfil;
      const notaExclusividade = body.notaExclusividade !== undefined ? Number(body.notaExclusividade) : pontoAtual.notaExclusividade;

      const calc = calcularPrecificacaoPonto({
        fluxoDiarioEstimado: pontoAtual.fluxoDiarioEstimado,
        tempoPermanencia: pontoAtual.tempoPermanencia,
        notaFluxo,
        notaTempo,
        notaPerfil,
        notaExclusividade,
      });

      dataToUpdate.notaFluxo = calc.notaFluxo;
      dataToUpdate.notaTempo = calc.notaTempo;
      dataToUpdate.notaPerfil = calc.notaPerfil;
      dataToUpdate.notaExclusividade = calc.notaExclusividade;
      dataToUpdate.scorePonderado = calc.scorePonderado;
      dataToUpdate.tier = calc.tier;
      dataToUpdate.cotaMensal = calc.cotaMensal;
    }

    const ponto = await prisma.pontoMidia.update({
      where: { id: pontoId },
      data: dataToUpdate,
    });

    return Response.json({ ponto });
  } catch (error) {
    console.error("Update ponto error:", error);
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
