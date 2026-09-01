import { prisma } from "@/lib/prisma";
import { generateToken, createSessionResponse } from "@/lib/auth";
import { hash } from "bcryptjs";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const registerSchema = z.object({
  email: z.string().email("Email invalido"),
  senha: z.string().min(6, "Senha deve ter no minimo 6 caracteres"),
  nome: z.string().min(2, "Nome deve ter no minimo 2 caracteres"),
  whatsapp: z.string().min(10, "WhatsApp invalido"),
  role: z.enum(["PONTO", "ANUNCIANTE"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email ja cadastrado no sistema" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(data.senha, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        senha: hashedPassword,
        nome: data.nome,
        whatsapp: data.whatsapp,
        role: data.role,
      },
    });

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
      201
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Register error:", error);
    const msg = error instanceof Error ? error.message : "Erro interno do servidor";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
