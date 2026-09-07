import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function PATCH(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const notifId = parseInt(id);

  if (isNaN(notifId)) {
    return Response.json({ error: "ID inválido" }, { status: 400 });
  }

  const where: Record<string, unknown> = { id: notifId };
  if (session.role !== "ADMIN") {
    where.userId = session.userId;
  }

  await prisma.notificacao.updateMany({
    where,
    data: { lida: true },
  });

  return Response.json({ ok: true });
}
