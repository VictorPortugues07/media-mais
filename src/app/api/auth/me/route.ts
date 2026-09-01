import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ user: null }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      nome: true,
      whatsapp: true,
      role: true,
      criadoEm: true,
      pontoMidia: { select: { id: true, nomeEmpresa: true, status: true } },
      anunciante: { select: { id: true, nomeEmpresa: true } },
    },
  });

  if (!user) {
    return Response.json({ user: null }, { status: 401 });
  }

  return Response.json({ user });
}
