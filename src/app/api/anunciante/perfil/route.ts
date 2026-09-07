import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { NextRequest } from "next/server";

const perfilAnuncianteSchema = z.object({
  nome: z.string().min(2),
  whatsapp: z.string().min(10),
  senha: z.string().min(6).optional().or(z.literal("")),
  avatarUrl: z.string().optional().nullable(),
  nomeEmpresa: z.string().min(2),
  responsavel: z.string().min(2),
  instagramSite: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  fotos: z.array(z.string()).optional(),
  cep: z.string().min(8),
  rua: z.string().min(2),
  numero: z.string().min(1),
  complemento: z.string().optional().nullable(),
  bairro: z.string().min(2),
  cidade: z.string().min(2),
  uf: z.string().length(2),
  categoria: z.string().min(2),
  oQueAnunciar: z.string().min(2),
  descricaoAnuncio: z.string().min(5),
  preferenciaLocalizacao: z.string().min(1),
  distanciaMaxima: z.string().optional().nullable(),
  bairrosEspecificos: z.string().optional().nullable(),
  categoriasEspecificas: z.array(z.string()),
  faixaEtariaAlvo: z.array(z.string()),
  generoAlvo: z.string().min(1),
});

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "ANUNCIANTE" && session.role !== "ADMIN")) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      anunciante: true,
    },
  });

  if (!user || !user.anunciante) {
    return Response.json({ error: "Perfil não encontrado" }, { status: 404 });
  }

  return Response.json({
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      whatsapp: user.whatsapp,
      avatarUrl: user.avatarUrl,
    },
    anunciante: user.anunciante,
  });
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ANUNCIANTE" && session.role !== "ADMIN")) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const data = perfilAnuncianteSchema.parse(body);

    const userAnunciante = await prisma.anunciante.findUnique({
      where: { userId: session.userId },
    });

    if (!userAnunciante) {
      return Response.json({ error: "Perfil de anunciante não encontrado" }, { status: 404 });
    }

    // 1. Atualizar dados do usuário
    const userUpdateData: Record<string, unknown> = {
      nome: data.nome,
      whatsapp: data.whatsapp,
    };

    if (data.avatarUrl !== undefined) {
      userUpdateData.avatarUrl = data.avatarUrl;
    }

    if (data.senha && data.senha.trim().length >= 6) {
      const bcrypt = await import("bcryptjs");
      userUpdateData.senha = await bcrypt.hash(data.senha, 10);
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: userUpdateData,
    });

    // 2. Atualizar dados do Anunciante
    const updatedAnunciante = await prisma.anunciante.update({
      where: { id: userAnunciante.id },
      data: {
        nomeEmpresa: data.nomeEmpresa,
        responsavel: data.responsavel,
        whatsapp: data.whatsapp,
        instagramSite: data.instagramSite,
        logoUrl: data.logoUrl,
        fotos: data.fotos || userAnunciante.fotos,
        cep: data.cep.replace(/\D/g, ""),
        rua: data.rua,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        cidade: data.cidade,
        uf: data.uf.toUpperCase(),
        categoria: data.categoria,
        oQueAnunciar: data.oQueAnunciar,
        descricaoAnuncio: data.descricaoAnuncio,
        preferenciaLocalizacao: data.preferenciaLocalizacao,
        distanciaMaxima: data.distanciaMaxima,
        bairrosEspecificos: data.bairrosEspecificos,
        categoriasEspecificas: data.categoriasEspecificas,
        faixaEtariaAlvo: data.faixaEtariaAlvo,
        generoAlvo: data.generoAlvo,
      },
    });

    return Response.json({ success: true, anunciante: updatedAnunciante });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Update perfil anunciante error:", error);
    return Response.json({ error: "Erro interno ao atualizar perfil" }, { status: 500 });
  }
}
