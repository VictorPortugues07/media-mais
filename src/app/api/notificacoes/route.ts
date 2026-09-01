import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const notificacoes = await prisma.notificacao.findMany({
    where: { userId: session.userId },
    orderBy: { criadoEm: "desc" },
    take: 50,
  });

  const naoLidas = await prisma.notificacao.count({
    where: { userId: session.userId, lida: false },
  });

  return Response.json({ notificacoes, naoLidas });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const action = searchParams.get("action");

  if (action === "marcar-todas") {
    await prisma.notificacao.updateMany({
      where: { userId: session.userId, lida: false },
      data: { lida: true },
    });
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Acao invalida" }, { status: 400 });
}
