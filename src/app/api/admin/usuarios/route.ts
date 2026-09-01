import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { NextRequest } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      nome: true,
      whatsapp: true,
      role: true,
      ativo: true,
      criadoEm: true,
      pontoMidia: {
        select: {
          id: true,
          nomeEmpresa: true,
          status: true,
          codigoTv: true,
          ultimaAtividade: true,
        },
      },
      anunciante: {
        select: {
          id: true,
          nomeEmpresa: true,
          categoria: true,
        },
      },
    },
    orderBy: { criadoEm: "desc" },
  });

  return Response.json({ users });
}

// Alternar status ativo/inativo do usuário
const toggleUserSchema = z.object({
  userId: z.number(),
  ativo: z.boolean(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const data = toggleUserSchema.parse(body);

    if (data.userId === session.userId) {
      return Response.json(
        { error: "Você não pode desativar o seu próprio usuário administrador." },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: data.userId },
      data: { ativo: data.ativo },
      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true,
      },
    });

    return Response.json({ success: true, user: updatedUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Patch user error:", error);
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
