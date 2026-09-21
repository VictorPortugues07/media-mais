import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notificarTvOffline } from "@/lib/notificacoes";
import { isPontoEmHorarioFuncionamento, getInicioDoDiaBrasilia } from "@/lib/horario";
import { calcularPrecificacaoPonto } from "@/lib/precificacao";
import { NextRequest } from "next/server";

export async function GET(request?: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return Response.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const hoje = getInicioDoDiaBrasilia();

  const [
    totalPontos,
    totalAnunciantes,
    totalAnuncios,
    anunciosPendentes,
    anunciosAtivos,
    anunciosFilaEspera,
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
    prisma.anuncio.count({ where: { status: "FILA_ESPERA" } }),
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
    midiaUrl: string;
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
    emHorarioFuncionamento: boolean;
    ultimaAtividade: Date | null;
    tipoDispositivo?: string | null;
    resolucaoTela?: string | null;
    anunciosAtivos: number;
    totalExibicoes: number;
  }> = [];

  let roleStats: Record<string, unknown> = {};

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
          userId: true,
          nomeEmpresa: true,
          cidade: true,
          uf: true,
          codigoTv: true,
          status: true,
          ultimaAtividade: true,
          tipoDispositivo: true,
          resolucaoTela: true,
          diasFuncionamento: true,
          horarioAbertura: true,
          horarioFechamento: true,
          fluxoDiarioEstimado: true,
          tempoPermanencia: true,
          notaFluxo: true,
          notaTempo: true,
          notaPerfil: true,
          notaExclusividade: true,
          scorePonderado: true,
          tier: true,
          cotaMensal: true,
          maxCotas: true,
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

    // Janela de 12 segundos para considerar online em tempo real (heartbeat é a cada 4s)
    const limiteOnlineAtras = new Date(Date.now() - 12 * 1000);
    // Limite de 10 minutos para disparar alerta
    const dezMinutosAtras = new Date(Date.now() - 10 * 60 * 1000);

    let faturamentoMensalTotal = 0;
    let repasseMensalTotal = 0;
    let receitaMidiaMaisMensal = 0;
    const distribuicaoTiers = {
      Bronze: { pontos: 0, cotasOcupadas: 0, faturamento: 0, repasse: 0, receitaMidiaMais: 0 },
      Prata: { pontos: 0, cotasOcupadas: 0, faturamento: 0, repasse: 0, receitaMidiaMais: 0 },
      Ouro: { pontos: 0, cotasOcupadas: 0, faturamento: 0, repasse: 0, receitaMidiaMais: 0 },
    };

    auditoriaAnuncios = anunciosComMetricas.map((a) => ({
      id: a.id,
      titulo: a.titulo,
      tipoMidia: a.tipoMidia,
      midiaUrl: a.midiaUrl,
      duracaoSegundos: a.duracaoSegundos,
      status: a.status,
      anunciante: a.anunciante.nomeEmpresa,
      ponto: `${a.pontoMidia.nomeEmpresa} (${a.pontoMidia.cidade})`,
      totalExibicoes: a._count.registroExibicoes,
      tempoTotalMinutos: Math.round((a._count.registroExibicoes * a.duracaoSegundos) / 60),
    }));

    statusPontosTv = pontosComAtividade.map((p) => {
      const online = p.ultimaAtividade ? new Date(p.ultimaAtividade) > limiteOnlineAtras : false;
      const emHorario = isPontoEmHorarioFuncionamento(p.diasFuncionamento, p.horarioAbertura, p.horarioFechamento);

      // Se estiver em horário de funcionamento e sem sinal há mais de 10 minutos, dispara notificação
      const semSinal10Min = !p.ultimaAtividade || new Date(p.ultimaAtividade) < dezMinutosAtras;
      if (p.status === "ATIVO" && emHorario && semSinal10Min) {
        notificarTvOffline(p.userId, p.nomeEmpresa).catch((err) => console.error(err));
      }

      const prec = calcularPrecificacaoPonto({
        fluxoDiarioEstimado: p.fluxoDiarioEstimado,
        tempoPermanencia: p.tempoPermanencia,
        notaFluxo: p.notaFluxo,
        notaTempo: p.notaTempo,
        notaPerfil: p.notaPerfil,
        notaExclusividade: p.notaExclusividade,
      });

      const tier = (p.tier || prec.tier) as "Bronze" | "Prata" | "Ouro";
      const cota = p.cotaMensal ?? prec.cotaMensal;
      const cotasAtivas = p._count.anuncios;

      if (p.status === "ATIVO") {
        const fatPonto = cotasAtivas * cota;
        const repPonto = cotasAtivas * (cota * 0.5);
        const recMMPonto = cotasAtivas * (cota * 0.5);

        faturamentoMensalTotal += fatPonto;
        repasseMensalTotal += repPonto;
        receitaMidiaMaisMensal += recMMPonto;

        if (distribuicaoTiers[tier]) {
          distribuicaoTiers[tier].pontos += 1;
          distribuicaoTiers[tier].cotasOcupadas += cotasAtivas;
          distribuicaoTiers[tier].faturamento += fatPonto;
          distribuicaoTiers[tier].repasse += repPonto;
          distribuicaoTiers[tier].receitaMidiaMais += recMMPonto;
        }
      }

      return {
        id: p.id,
        nomeEmpresa: p.nomeEmpresa,
        cidade: `${p.cidade}/${p.uf}`,
        codigoTv: p.codigoTv,
        status: p.status,
        online,
        emHorarioFuncionamento: emHorario,
        ultimaAtividade: p.ultimaAtividade,
        tipoDispositivo: p.tipoDispositivo,
        resolucaoTela: p.resolucaoTela,
        anunciosAtivos: p._count.anuncios,
        totalExibicoes: p._count.registroExibicoes,
        tier,
        cotaMensal: cota,
        scorePonderado: p.scorePonderado ?? prec.scorePonderado,
        maxCotas: p.maxCotas || 8,
      };
    });

    roleStats = {
      financeiro: {
        faturamentoMensalTotal,
        repasseMensalTotal,
        receitaMidiaMaisMensal,
        distribuicaoTiers,
      },
    };
  }

  // Estatísticas específicas de Dono de Ponto
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

      const limiteOnlineAtras = new Date(Date.now() - 12 * 1000);
      const isOnline = ponto.ultimaAtividade ? new Date(ponto.ultimaAtividade) > limiteOnlineAtras : false;
      const emHorario = isPontoEmHorarioFuncionamento(ponto.diasFuncionamento, ponto.horarioAbertura, ponto.horarioFechamento);

      // Validação de alerta 10 min offline em horário comercial
      const dezMinutosAtras = new Date(Date.now() - 10 * 60 * 1000);
      const semSinal10Min = !ponto.ultimaAtividade || new Date(ponto.ultimaAtividade) < dezMinutosAtras;
      if (ponto.status === "ATIVO" && emHorario && semSinal10Min) {
        notificarTvOffline(ponto.userId, ponto.nomeEmpresa).catch((err) => console.error(err));
      }

      const prec = calcularPrecificacaoPonto({
        fluxoDiarioEstimado: ponto.fluxoDiarioEstimado,
        tempoPermanencia: ponto.tempoPermanencia,
        notaFluxo: ponto.notaFluxo,
        notaTempo: ponto.notaTempo,
        notaPerfil: ponto.notaPerfil,
        notaExclusividade: ponto.notaExclusividade,
      });

      const repasseUnitario = ponto.cotaMensal ? ponto.cotaMensal * 0.5 : prec.repasseAoPonto;
      const repasseMensalEstimado = meusAnuncios * repasseUnitario;

      roleStats = {
        meusAnunciosAtivos: meusAnuncios,
        pontoId: ponto.id,
        codigoTv: ponto.codigoTv,
        tvOnline: isOnline,
        emHorarioFuncionamento: emHorario,
        ultimaAtividade: ponto.ultimaAtividade,
        totalExibicoesPonto: ponto._count.registroExibicoes,
        exibicoesPontoHoje,
        horasOnlineEstimadas: ((duracaoTotal._sum.duracaoSegundos || 0) / 3600).toFixed(1),
        maxCotas: ponto.maxCotas || 8,
        financeiro: {
          repasseMensalEstimado,
          repassePorAnunciante: repasseUnitario,
          anunciantesAtivos: meusAnuncios,
        },
      };
    }
  }

  if (session.role === "ANUNCIANTE") {
    const anunciante = await prisma.anunciante.findUnique({
      where: { userId: session.userId },
    });

    if (anunciante) {
      const [meusPendentes, meusAtivos, meusRejeitados, totalReproducoes, meusAnunciosAtivosComPonto] = await Promise.all([
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
        prisma.anuncio.findMany({
          where: { anuncianteId: anunciante.id, status: "ATIVO" },
          include: {
            pontoMidia: {
              select: {
                id: true,
                nomeEmpresa: true,
                cidade: true,
                uf: true,
                tier: true,
                cotaMensal: true,
                fluxoDiarioEstimado: true,
                tempoPermanencia: true,
                notaFluxo: true,
                notaTempo: true,
                notaPerfil: true,
                notaExclusividade: true,
              },
            },
          },
        }),
      ]);

      let gastoMensalTotal = 0;
      const detalhamentoCampanhas = meusAnunciosAtivosComPonto.map((a) => {
        const prec = calcularPrecificacaoPonto({
          fluxoDiarioEstimado: a.pontoMidia.fluxoDiarioEstimado,
          tempoPermanencia: a.pontoMidia.tempoPermanencia,
          notaFluxo: a.pontoMidia.notaFluxo,
          notaTempo: a.pontoMidia.notaTempo,
          notaPerfil: a.pontoMidia.notaPerfil,
          notaExclusividade: a.pontoMidia.notaExclusividade,
        });
        const cota = a.pontoMidia.cotaMensal ?? prec.cotaMensal;
        gastoMensalTotal += cota;

        return {
          anuncioId: a.id,
          titulo: a.titulo,
          pontoId: a.pontoMidia.id,
          pontoNome: a.pontoMidia.nomeEmpresa,
          cidade: `${a.pontoMidia.cidade}/${a.pontoMidia.uf}`,
          tier: a.pontoMidia.tier || prec.tier,
          cotaMensal: cota,
        };
      });

      roleStats = {
        meusPendentes,
        meusAtivos,
        meusRejeitados,
        totalReproducoes,
        financeiro: {
          gastoMensalTotal,
          detalhamentoCampanhas,
        },
      };
    }
  }

  return Response.json({
    totalPontos,
    totalAnunciantes,
    totalAnuncios,
    anunciosPendentes,
    anunciosAtivos,
    anunciosFilaEspera,
    pontosAtivos,
    totalExibicoes,
    totalHorasExibidas: ((totalSegundosExibidos._sum.duracaoSegundos || 0) / 3600).toFixed(1),
    exibicoesHoje,
    auditoriaAnuncios,
    statusPontosTv,
    ...roleStats,
  });
}
