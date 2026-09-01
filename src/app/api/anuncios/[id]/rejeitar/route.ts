import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notificarRejeicao } from "@/lib/notificacoes";
import { z } from "zod";
import { NextRequest } from "next/server";

const rejeicaoSchema = z.object({
  motivo: z.string().min(5, "Motivo deve ter no minimo 5 caracteres"),
});

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return Response.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const anuncioId = parseInt(id);
    const body = await request.json();
    const { motivo } = rejeicaoSchema.parse(body);

    const anuncio = await prisma.anuncio.update({
      where: { id: anuncioId },
      data: {
        status: "REJEITADO",
        motivoRejeicao: motivo,
      },
      include: {
        anunciante: { include: { user: true } },
      },
    });

    await notificarRejeicao(
      anuncio.anunciante.user.id,
      anuncio.titulo,
      motivo
    );

    return Response.json({ anuncio });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Rejeitar error:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
