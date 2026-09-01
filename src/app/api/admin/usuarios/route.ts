import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return Response.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      nome: true,
      whatsapp: true,
      role: true,
      criadoEm: true,
      pontoMidia: { select: { id: true, nomeEmpresa: true } },
      anunciante: { select: { id: true, nomeEmpresa: true } },
    },
    orderBy: { criadoEm: "desc" },
  });

  return Response.json({ users });
}
