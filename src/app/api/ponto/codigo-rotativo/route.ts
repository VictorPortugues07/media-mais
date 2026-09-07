import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (!session || (session.role !== "PONTO" && session.role !== "ADMIN")) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const ponto = await prisma.pontoMidia.findUnique({
    where: { userId: session.userId },
  });

  if (!ponto) {
    return Response.json({ error: "Ponto não encontrado" }, { status: 404 });
  }

  // Gera código numérico de 6 dígitos aleatório
  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
  // Expira em 30 segundos (adicionando margem de segurança de 2s para latência de rede = 32s)
  const expira = new Date(Date.now() + 32 * 1000);

  await prisma.pontoMidia.update({
    where: { id: ponto.id },
    data: {
      codigoRotativo: codigo,
      codigoRotativoExpira: expira,
    },
  });

  return Response.json({
    codigo,
    expiraEmSegundos: 30,
    expiraEmTimestamp: expira.getTime(),
  });
}
