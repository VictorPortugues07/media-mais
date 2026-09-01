import { prisma } from "@/lib/prisma";
import { generateToken, createSessionResponse } from "@/lib/auth";
import { compare } from "bcryptjs";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  senha: z.string().min(1, "Senha obrigatoria"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Email ou senha incorretos" },
        { status: 401 }
      );
    }

    if (!user.ativo) {
      return NextResponse.json(
        { error: "Sua conta foi suspensa ou desativada pelo administrador. Entre em contato com o suporte." },
        { status: 403 }
      );
    }

    const valid = await compare(data.senha, user.senha);
    if (!valid) {
      return NextResponse.json(
        { error: "Email ou senha incorretos" },
        { status: 401 }
      );
    }

    const token = await generateToken({
      userId: user.id,
      email: user.email,
      nome: user.nome,
      role: user.role,
    });

    return createSessionResponse(
      {
        user: { id: user.id, email: user.email, nome: user.nome, role: user.role },
      },
      token,
      200
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Login error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
