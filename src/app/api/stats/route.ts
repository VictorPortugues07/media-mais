import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const [
    totalPontos,
    totalAnunciantes,
    totalAnuncios,
    anunciosPendentes,
    anunciosAtivos,
    pontosAtivos,
    totalExibicoes,
    totalSegundosExibidos,
    exibicoesHoje,
  ] = await Promise.all([
    prisma.pontoMidia.count(),
    prisma.anunciante.count(),
    prisma.anuncio.count(),
    prisma.anuncio.count({ where: { status: "PENDENTE" } }),
    prisma.anuncio.count({ where: { status: "ATIVO" } }),
    prisma.pontoMidia.count({ where: { status: "ATIVO" } }),
    prisma.registroExibicao.count(),
    prisma.registroExibicao.aggregate({
      _sum: { duracaoSegundos: true },
    }),
    prisma.registroExibicao.count({
      where: { exibidoEm: { gte: hoje } },
    }),
  ]);

  // Auditoria detalhada por campanha / anúncio para o admin
  let auditoriaAnuncios: Array<{
    id: number;
    titulo: string;
    tipoMidia: string;
    duracaoSegundos: number;
    status: string;
    anunciante: string;
    ponto: string;
    totalExibicoes: number;
    tempoTotalMinutos: number;
  }> = [];

  let statusPontosTv: Array<{
    id: number;
    nomeEmpresa: string;
    cidade: string;
    codigoTv: string | null;
    status: string;
    online: boolean;
    ultimaAtividade: Date | null;
    anunciosAtivos: number;
    totalExibicoes: number;
  }> = [];

  if (session.role === "ADMIN") {
    const [anunciosComMetricas, pontosComAtividade] = await Promise.all([
      prisma.anuncio.findMany({
        include: {
          anunciante: { select: { nomeEmpresa: true } },
          pontoMidia: { select: { nomeEmpresa: true, cidade: true } },
          _count: { select: { registroExibicoes: true } },
        },
        orderBy: { criadoEm: "desc" },
      }),
      prisma.pontoMidia.findMany({
        select: {
          id: true,
          nomeEmpresa: true,
          cidade: true,
          uf: true,
          codigoTv: true,
          status: true,
          ultimaAtividade: true,
          _count: {
            select: {
              anuncios: { where: { status: "ATIVO" } },
              registroExibicoes: true,
            },
          },
        },
        orderBy: { nomeEmpresa: "asc" },
      }),
    ]);

    // Calcular tempo total e status em tempo real
    const doisMinutosAtras = new Date(Date.now() - 2 * 60 * 1000);

    auditoriaAnuncios = anunciosComMetricas.map((a) => ({
      id: a.id,
      titulo: a.titulo,
      tipoMidia: a.tipoMidia,
      duracaoSegundos: a.duracaoSegundos,
      status: a.status,
      anunciante: a.anunciante.nomeEmpresa,
      ponto: `${a.pontoMidia.nomeEmpresa} (${a.pontoMidia.cidade})`,
      totalExibicoes: a._count.registroExibicoes,
      tempoTotalMinutos: Math.round((a._count.registroExibicoes * a.duracaoSegundos) / 60),
    }));

    statusPontosTv = pontosComAtividade.map((p) => {
      const online = p.ultimaAtividade ? new Date(p.ultimaAtividade) > doisMinutosAtras : false;
      return {
        id: p.id,
        nomeEmpresa: p.nomeEmpresa,
        cidade: `${p.cidade}/${p.uf}`,
        codigoTv: p.codigoTv,
        status: p.status,
        online,
        ultimaAtividade: p.ultimaAtividade,
        anunciosAtivos: p._count.anuncios,
        totalExibicoes: p._count.registroExibicoes,
      };
    });
  }

  // Estatísticas específicas de Dono de Ponto
  let roleStats = {};

  if (session.role === "PONTO") {
    const ponto = await prisma.pontoMidia.findUnique({
      where: { userId: session.userId },
      include: {
        _count: {
          select: {
            registroExibicoes: true,
          },
        },
      },
    });

    if (ponto) {
      const [meusAnuncios, exibicoesPontoHoje, duracaoTotal] = await Promise.all([
        prisma.anuncio.count({
          where: { pontoMidiaId: ponto.id, status: "ATIVO" },
        }),
        prisma.registroExibicao.count({
          where: { pontoMidiaId: ponto.id, exibidoEm: { gte: hoje } },
        }),
        prisma.registroExibicao.aggregate({
          where: { pontoMidiaId: ponto.id },
          _sum: { duracaoSegundos: true },
        }),
      ]);

      const cincoMinutosAtras = new Date(Date.now() - 5 * 60 * 1000);
      const isOnline = ponto.ultimaAtividade ? new Date(ponto.ultimaAtividade) > cincoMinutosAtras : false;

      roleStats = {
        meusAnunciosAtivos: meusAnuncios,
        pontoId: ponto.id,
        codigoTv: ponto.codigoTv,
        tvOnline: isOnline,
        ultimaAtividade: ponto.ultimaAtividade,
        totalExibicoesPonto: ponto._count.registroExibicoes,
        exibicoesPontoHoje,
        horasOnlineEstimadas: ((duracaoTotal._sum.duracaoSegundos || 0) / 3600).toFixed(1),
      };
    }
  }

  if (session.role === "ANUNCIANTE") {
    const anunciante = await prisma.anunciante.findUnique({
      where: { userId: session.userId },
    });

    if (anunciante) {
      const [meusPendentes, meusAtivos, meusRejeitados, totalReproducoes] = await Promise.all([
        prisma.anuncio.count({
          where: { anuncianteId: anunciante.id, status: "PENDENTE" },
        }),
        prisma.anuncio.count({
          where: { anuncianteId: anunciante.id, status: "ATIVO" },
        }),
        prisma.anuncio.count({
          where: { anuncianteId: anunciante.id, status: "REJEITADO" },
        }),
        prisma.registroExibicao.count({
          where: { anuncio: { anuncianteId: anunciante.id } },
        }),
      ]);

      roleStats = {
        meusPendentes,
        meusAtivos,
        meusRejeitados,
        totalReproducoes,
      };
    }
  }

  return Response.json({
    totalPontos,
    totalAnunciantes,
    totalAnuncios,
    anunciosPendentes,
    anunciosAtivos,
    pontosAtivos,
    totalExibicoes,
    totalHorasExibidas: ((totalSegundosExibidos._sum.duracaoSegundos || 0) / 3600).toFixed(1),
    exibicoesHoje,
    auditoriaAnuncios,
    statusPontosTv,
    ...roleStats,
  });
}
