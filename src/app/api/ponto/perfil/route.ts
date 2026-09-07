import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { geocodeAddress } from "@/lib/geocode";
import { z } from "zod";
import { NextRequest } from "next/server";

const perfilPontoSchema = z.object({
  nome: z.string().min(2),
  whatsapp: z.string().min(10),
  senha: z.string().min(6).optional().or(z.literal("")),
  avatarUrl: z.string().optional().nullable(),
  nomeEmpresa: z.string().min(2),
  responsavel: z.string().min(2),
  instagramSite: z.string().optional().nullable(),
  cep: z.string().min(8),
  rua: z.string().min(2),
  numero: z.string().min(1),
  complemento: z.string().optional().nullable(),
  bairro: z.string().min(2),
  cidade: z.string().min(2),
  uf: z.string().length(2),
  categoria: z.string().min(2),
  descricao: z.string().min(5),
  possuiTv: z.boolean(),
  quantidadeTvs: z.number().min(1),
  localInstalacao: z.string().optional().nullable(),
  fluxoDiarioEstimado: z.string().min(1),
  tempoPermanencia: z.string().min(1),
  faixaEtariaPublico: z.array(z.string()),
  generoPublico: z.string().min(1),
  horariosPico: z.string().optional().nullable(),
  horarioAbertura: z.string().optional().nullable(),
  horarioFechamento: z.string().optional().nullable(),
  diasFuncionamento: z.array(z.string()).optional(),
  fotos: z.array(z.string()).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "PONTO" && session.role !== "ADMIN")) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      pontoMidia: true,
    },
  });

  if (!user || !user.pontoMidia) {
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
    ponto: user.pontoMidia,
  });
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "PONTO" && session.role !== "ADMIN")) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const data = perfilPontoSchema.parse(body);

    const userPonto = await prisma.pontoMidia.findUnique({
      where: { userId: session.userId },
    });

    if (!userPonto) {
      return Response.json({ error: "Ponto não encontrado" }, { status: 404 });
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

    // 2. Geocodificar se endereço mudou
    let geo = { lat: userPonto.lat, lng: userPonto.lng };
    if (
      data.rua !== userPonto.rua ||
      data.numero !== userPonto.numero ||
      data.bairro !== userPonto.bairro ||
      data.cidade !== userPonto.cidade ||
      data.uf !== userPonto.uf
    ) {
      try {
        const resGeo = await geocodeAddress(
          data.rua,
          data.numero,
          data.bairro,
          data.cidade,
          data.uf
        );
        if (resGeo) {
          geo = resGeo;
        }
      } catch {
        // Mantém as coordenadas anteriores
      }
    }

    // 3. Atualizar dados do Ponto
    const updatedPonto = await prisma.pontoMidia.update({
      where: { id: userPonto.id },
      data: {
        nomeEmpresa: data.nomeEmpresa,
        responsavel: data.responsavel,
        whatsapp: data.whatsapp,
        instagramSite: data.instagramSite,
        cep: data.cep.replace(/\D/g, ""),
        rua: data.rua,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        cidade: data.cidade,
        uf: data.uf.toUpperCase(),
        categoria: data.categoria,
        descricao: data.descricao,
        possuiTv: data.possuiTv,
        quantidadeTvs: data.quantidadeTvs,
        localInstalacao: data.localInstalacao,
        fluxoDiarioEstimado: data.fluxoDiarioEstimado,
        tempoPermanencia: data.tempoPermanencia,
        faixaEtariaPublico: data.faixaEtariaPublico,
        generoPublico: data.generoPublico,
        horariosPico: data.horariosPico,
        horarioAbertura: data.horarioAbertura || userPonto.horarioAbertura,
        horarioFechamento: data.horarioFechamento || userPonto.horarioFechamento,
        diasFuncionamento: data.diasFuncionamento || userPonto.diasFuncionamento,
        fotos: data.fotos || userPonto.fotos,
        lat: geo.lat,
        lng: geo.lng,
      },
    });

    return Response.json({ success: true, ponto: updatedPonto });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Update perfil ponto error:", error);
    return Response.json({ error: "Erro interno ao atualizar perfil" }, { status: 500 });
  }
}
