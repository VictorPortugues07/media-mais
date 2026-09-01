import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const [
    totalPontos,
    totalAnunciantes,
    totalAnuncios,
    anunciosPendentes,
    anunciosAtivos,
    pontosAtivos,
  ] = await Promise.all([
    prisma.pontoMidia.count(),
    prisma.anunciante.count(),
    prisma.anuncio.count(),
    prisma.anuncio.count({ where: { status: "PENDENTE" } }),
    prisma.anuncio.count({ where: { status: "ATIVO" } }),
    prisma.pontoMidia.count({ where: { status: "ATIVO" } }),
  ]);

  // Role-specific stats
  let roleStats = {};

  if (session.role === "PONTO") {
    const ponto = await prisma.pontoMidia.findUnique({
      where: { userId: session.userId },
    });
    if (ponto) {
      const meusAnuncios = await prisma.anuncio.count({
        where: { pontoMidiaId: ponto.id, status: "ATIVO" },
      });
      roleStats = { meusAnunciosAtivos: meusAnuncios, pontoId: ponto.id };
    }
  }

  if (session.role === "ANUNCIANTE") {
    const anunciante = await prisma.anunciante.findUnique({
      where: { userId: session.userId },
    });
    if (anunciante) {
      const [meusPendentes, meusAtivos, meusRejeitados] = await Promise.all([
        prisma.anuncio.count({
          where: { anuncianteId: anunciante.id, status: "PENDENTE" },
        }),
        prisma.anuncio.count({
          where: { anuncianteId: anunciante.id, status: "ATIVO" },
        }),
        prisma.anuncio.count({
          where: { anuncianteId: anunciante.id, status: "REJEITADO" },
        }),
      ]);
      roleStats = { meusPendentes, meusAtivos, meusRejeitados };
    }
  }

  return Response.json({
    totalPontos,
    totalAnunciantes,
    totalAnuncios,
    anunciosPendentes,
    anunciosAtivos,
    pontosAtivos,
    ...roleStats,
  });
}
