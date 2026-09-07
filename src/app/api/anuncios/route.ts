import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { NextRequest } from "next/server";

const anuncioSchema = z.object({
  pontoMidiaId: z.number(),
  titulo: z.string().min(3, "Titulo deve ter no minimo 3 caracteres"),
  descricao: z.string().min(10, "Descricao deve ter no minimo 10 caracteres"),
  tipoMidia: z.enum(["VIDEO", "IMAGEM"]),
  midiaUrl: z.string().min(1, "Midia obrigatoria"),
  duracaoSegundos: z.number().min(5).max(60).optional(),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const pontoId = searchParams.get("pontoId");
  const anuncianteId = searchParams.get("anuncianteId");

  const where: Record<string, unknown> = {};

  if (session.role === "ANUNCIANTE") {
    const anunciante = await prisma.anunciante.findUnique({
      where: { userId: session.userId },
    });
    if (anunciante) where.anuncianteId = anunciante.id;
  } else if (session.role === "PONTO") {
    const ponto = await prisma.pontoMidia.findUnique({
      where: { userId: session.userId },
    });
    if (ponto) where.pontoMidiaId = ponto.id;
  }
  // ADMIN sees all

  if (status) where.status = status;
  if (pontoId) where.pontoMidiaId = parseInt(pontoId);
  if (anuncianteId && session.role === "ADMIN") {
    where.anuncianteId = parseInt(anuncianteId);
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const anuncios = await prisma.anuncio.findMany({
    where,
    include: {
      anunciante: {
        select: { nomeEmpresa: true, categoria: true, userId: true },
      },
      pontoMidia: {
        select: {
          id: true,
          nomeEmpresa: true,
          cidade: true,
          uf: true,
          userId: true,
          ultimaAtividade: true,
          diasFuncionamento: true,
          horarioAbertura: true,
          horarioFechamento: true,
        },
      },
      _count: {
        select: {
          registroExibicoes: true,
        },
      },
    },
    orderBy: { criadoEm: "desc" },
  });

  const doisMinutosAtras = new Date(Date.now() - 2 * 60 * 1000);

  // Buscar contagem de hoje e última exibição para cada anúncio
  const metricasAnuncios = await Promise.all(
    anuncios.map(async (a) => {
      const [exibicoesHoje, ultimaExibicao] = await Promise.all([
        prisma.registroExibicao.count({
          where: {
            anuncioId: a.id,
            exibidoEm: { gte: hoje },
          },
        }),
        prisma.registroExibicao.findFirst({
          where: { anuncioId: a.id },
          orderBy: { exibidoEm: "desc" },
          select: { exibidoEm: true },
        }),
      ]);

      const isOnline = a.pontoMidia.ultimaAtividade
        ? new Date(a.pontoMidia.ultimaAtividade) > doisMinutosAtras
        : false;

      const totalExibicoes = a._count.registroExibicoes;
      const totalSegundos = totalExibicoes * a.duracaoSegundos;
      const totalMinutos = Math.round(totalSegundos / 60);

      return {
        ...a,
        totalExibicoes,
        exibicoesHoje,
        totalMinutosExibidos: totalMinutos,
        ultimaExibicao: ultimaExibicao?.exibidoEm || null,
        pontoMidia: {
          ...a.pontoMidia,
          tvOnline: isOnline,
        },
      };
    })
  );

  return Response.json({ anuncios: metricasAnuncios });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ANUNCIANTE") {
      return Response.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const anunciante = await prisma.anunciante.findUnique({
      where: { userId: session.userId },
    });

    if (!anunciante) {
      return Response.json(
        { error: "Complete seu cadastro de anunciante primeiro" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = anuncioSchema.parse(body);

    // Verify ponto exists and is active
    const ponto = await prisma.pontoMidia.findUnique({
      where: { id: data.pontoMidiaId },
    });

    if (!ponto || ponto.status !== "ATIVO") {
      return Response.json(
        { error: "Ponto de midia nao encontrado ou inativo" },
        { status: 400 }
      );
    }

    const anuncio = await prisma.anuncio.create({
      data: {
        ...data,
        duracaoSegundos: data.duracaoSegundos || 10,
        anuncianteId: anunciante.id,
      },
    });

    // Notify admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
    });

    await prisma.notificacao.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        tipo: "ANUNCIO_PENDENTE" as const,
        titulo: "Novo anuncio para aprovacao",
        mensagem: `"${data.titulo}" de ${anunciante.nomeEmpresa} para ${ponto.nomeEmpresa}`,
      })),
    });

    return Response.json({ anuncio }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Create anuncio error:", error);
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
