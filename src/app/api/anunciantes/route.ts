import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { NextRequest } from "next/server";

const anuncianteSchema = z.object({
  nomeEmpresa: z.string().min(2),
  responsavel: z.string().min(2),
  whatsapp: z.string().min(10),
  instagramSite: z.string().optional(),
  cep: z.string().min(8),
  rua: z.string().min(2),
  numero: z.string().min(1),
  complemento: z.string().optional(),
  bairro: z.string().min(2),
  cidade: z.string().min(2),
  uf: z.string().length(2),
  categoria: z.string().min(2),
  oQueAnunciar: z.string().min(2),
  descricaoAnuncio: z.string().min(5),
  preferenciaLocalizacao: z.string().min(1),
  distanciaMaxima: z.string().optional(),
  bairrosEspecificos: z.string().optional(),
  categoriasEspecificas: z.array(z.string()),
  faixaEtariaAlvo: z.array(z.string()),
  generoAlvo: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return Response.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const anunciantes = await prisma.anunciante.findMany({
    include: {
      user: { select: { nome: true, email: true } },
      _count: { select: { anuncios: true } },
    },
    orderBy: { criadoEm: "desc" },
  });

  return Response.json({ anunciantes });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ANUNCIANTE") {
      return Response.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const existing = await prisma.anunciante.findUnique({
      where: { userId: session.userId },
    });
    if (existing) {
      return Response.json(
        { error: "Voce ja possui um perfil de anunciante" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = anuncianteSchema.parse(body);

    const anunciante = await prisma.anunciante.create({
      data: {
        ...data,
        userId: session.userId,
      },
    });

    return Response.json({ anunciante }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Create anunciante error:", error);
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
