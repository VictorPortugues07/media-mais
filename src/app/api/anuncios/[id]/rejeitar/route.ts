import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notificarRejeicao } from "@/lib/notificacoes";
import { z } from "zod";
import { NextRequest } from "next/server";

const rejeicaoSchema = z.object({
  motivo: z.string().min(5, "Motivo deve ter no mínimo 5 caracteres"),
});

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request);
    if (!session || session.role !== "ADMIN") {
      return Response.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const anuncioId = parseInt(id);
    if (isNaN(anuncioId)) {
      return Response.json({ error: "ID inválido" }, { status: 400 });
    }

    const rawBody = await request.json().catch(() => null);
    if (!rawBody) {
      return Response.json({ error: "Corpo da requisição ausente ou inválido" }, { status: 400 });
    }

    const { motivo } = rejeicaoSchema.parse(rawBody);

    const anuncioExistente = await prisma.anuncio.findUnique({
      where: { id: anuncioId },
      include: {
        anunciante: { include: { user: true } },
      },
    });

    if (!anuncioExistente) {
      return Response.json({ error: "Anúncio não encontrado" }, { status: 404 });
    }

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
      return Response.json({ error: error.issues[0]?.message || "Erro de validação" }, { status: 400 });
    }
    console.error("Rejeitar error:", error);
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
