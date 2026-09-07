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
      avatarUrl: true,
      role: true,
      ativo: true,
      criadoEm: true,
      pontoMidia: {
        select: {
          id: true,
          nomeEmpresa: true,
          status: true,
          codigoTv: true,
          fotos: true,
          ultimaAtividade: true,
        },
      },
      anunciante: {
        select: {
          id: true,
          nomeEmpresa: true,
          logoUrl: true,
          fotos: true,
        },
      },
    },
  });

  if (!user || !user.ativo) {
    return Response.json({ user: null, error: "Usuário inativo" }, { status: 401 });
  }

  return Response.json({ user });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (typeof body.nome === "string" && body.nome.trim().length >= 2) {
      updateData.nome = body.nome.trim();
    }
    if (typeof body.whatsapp === "string") {
      updateData.whatsapp = body.whatsapp.trim();
    }
    if (typeof body.avatarUrl === "string" || body.avatarUrl === null) {
      updateData.avatarUrl = body.avatarUrl;
    }
    if (typeof body.senha === "string" && body.senha.trim().length >= 6) {
      const bcrypt = await import("bcryptjs");
      updateData.senha = await bcrypt.hash(body.senha.trim(), 10);
    }

    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        nome: true,
        whatsapp: true,
        avatarUrl: true,
        role: true,
      },
    });

    return Response.json({ user: updated, success: true });
  } catch (err: unknown) {
    console.error("Erro ao atualizar usuário:", err);
    return Response.json({ error: "Erro ao atualizar dados" }, { status: 500 });
  }
}
