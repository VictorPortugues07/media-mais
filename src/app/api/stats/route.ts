import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notificarTvOffline } from "@/lib/notificacoes";

function isPontoEmHorarioFuncionamento(
  diasFuncionamento: string[] | null,
  horarioAbertura: string | null,
  horarioFechamento: string | null
): boolean {
  try {
    const agora = new Date();
    // Dias em português indexados por getDay() [0: Domingo, 1: Segunda...]
    const diasMap = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const diaHoje = diasMap[agora.getDay()];

    const dias = diasFuncionamento && diasFuncionamento.length > 0
      ? diasFuncionamento
      : ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

    if (!dias.includes(diaHoje)) {
      return false;
    }

    const abertura = horarioAbertura || "08:00";
    const fechamento = horarioFechamento || "19:00";

    const [horaAbre, minAbre] = abertura.split(":").map(Number);
    const [horaFecha, minFecha] = fechamento.split(":").map(Number);

    const minAtual = agora.getHours() * 60 + agora.getMinutes();
    const minInicio = (horaAbre || 8) * 60 + (minAbre || 0);
    const minFim = (horaFecha || 19) * 60 + (minFecha || 0);

    return minAtual >= minInicio && minAtual <= minFim;
  } catch {
    return true;
  }
}

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

      const limiteOnlineAtras = new Date(Date.now() - 12 * 1000);
      const isOnline = ponto.ultimaAtividade ? new Date(ponto.ultimaAtividade) > limiteOnlineAtras : false;
      const emHorario = isPontoEmHorarioFuncionamento(ponto.diasFuncionamento, ponto.horarioAbertura, ponto.horarioFechamento);

      // Validação de alerta 10 min offline em horário comercial
      const dezMinutosAtras = new Date(Date.now() - 10 * 60 * 1000);
      const semSinal10Min = !ponto.ultimaAtividade || new Date(ponto.ultimaAtividade) < dezMinutosAtras;
      if (ponto.status === "ATIVO" && emHorario && semSinal10Min) {
        notificarTvOffline(ponto.userId, ponto.nomeEmpresa).catch((err) => console.error(err));
      }

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
