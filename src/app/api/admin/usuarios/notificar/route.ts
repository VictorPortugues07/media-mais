import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { NextRequest } from "next/server";

const notificarUsuarioSchema = z.object({
  userId: z.number(),
  tipo: z.enum(["GERAL", "ALERTA", "COBRANCA", "SISTEMA"]),
  titulo: z.string().min(2),
  mensagem: z.string().min(5),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const data = notificarUsuarioSchema.parse(body);

    const notificacao = await prisma.notificacao.create({
      data: {
        userId: data.userId,
        tipo: data.tipo,
        titulo: data.titulo,
        mensagem: data.mensagem,
      },
    });

    return Response.json({ success: true, notificacao }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Notificar usuario error:", error);
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
