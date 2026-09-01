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

  await prisma.notificacao.updateMany({
    where: { id: notifId, userId: session.userId },
    data: { lida: true },
  });

  return Response.json({ ok: true });
}
