import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const scope = searchParams.get("scope"); // "todas" | "minhas"
  const tipo = searchParams.get("tipo");
  const lida = searchParams.get("lida");

  const where: Record<string, unknown> = {};

  // Se for ADMIN e pedir "todas", vê notificações de todo o sistema
  if (session.role === "ADMIN" && scope === "todas") {
    // Vê todas
  } else {
    where.userId = session.userId;
  }

  if (tipo && tipo !== "todos") {
    where.tipo = tipo;
  }

  if (lida === "true") {
    where.lida = true;
  } else if (lida === "false") {
    where.lida = false;
  }

  const [notificacoes, naoLidas, totalAlertas, totalPendentes] = await Promise.all([
    prisma.notificacao.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { criadoEm: "desc" },
      take: 100,
    }),
    prisma.notificacao.count({
      where: session.role === "ADMIN" && scope === "todas"
        ? { lida: false }
        : { userId: session.userId, lida: false },
    }),
    prisma.notificacao.count({
      where: session.role === "ADMIN" && scope === "todas"
        ? { tipo: "ALERTA" }
        : { userId: session.userId, tipo: "ALERTA" },
    }),
    prisma.notificacao.count({
      where: session.role === "ADMIN" && scope === "todas"
        ? { tipo: "ANUNCIO_PENDENTE" }
        : { userId: session.userId, tipo: "ANUNCIO_PENDENTE" },
    }),
  ]);

  return Response.json({
    notificacoes,
    naoLidas,
    totalAlertas,
    totalPendentes,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const action = searchParams.get("action");
  const scope = searchParams.get("scope");

  if (action === "marcar-todas") {
    const where: Record<string, unknown> = { lida: false };
    if (!(session.role === "ADMIN" && scope === "todas")) {
      where.userId = session.userId;
    }

    await prisma.notificacao.updateMany({
      where,
      data: { lida: true },
    });
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Ação inválida" }, { status: 400 });
}
