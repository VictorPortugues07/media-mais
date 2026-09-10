import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { geocodeAddress } from "@/lib/geocode";
import { z } from "zod";
import { NextRequest } from "next/server";

const pontoSchema = z.object({
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
  descricao: z.string().min(10),
  possuiTv: z.boolean(),
  quantidadeTvs: z.number().optional(),
  localInstalacao: z.string().optional(),
  fluxoDiarioEstimado: z.string().min(1),
  tempoPermanencia: z.string().min(1),
  faixaEtariaPublico: z.array(z.string()),
  generoPublico: z.string().min(1),
  horariosPico: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const cidade = searchParams.get("cidade");
  const categoria = searchParams.get("categoria");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (cidade) where.cidade = { contains: cidade, mode: "insensitive" };
  if (categoria) where.categoria = categoria;
  if (status) where.status = status;
  else where.status = "ATIVO";

  const pontos = await prisma.pontoMidia.findMany({
    where,
    include: {
      user: { select: { nome: true, email: true, avatarUrl: true } },
      anuncios: {
        where: { status: { in: ["ATIVO", "FILA_ESPERA"] } },
        select: {
          id: true,
          status: true,
          duracaoSegundos: true,
          dataFim: true,
        },
      },
      _count: {
        select: {
          anuncios: { where: { status: "ATIVO" } },
        },
      },
    },
    orderBy: { criadoEm: "desc" },
  });

  const pontosComMetricas = pontos.map((p) => {
    const ativos = p.anuncios.filter((a) => a.status === "ATIVO");
    const fila = p.anuncios.filter((a) => a.status === "FILA_ESPERA");
    const tempoOcupadoSegundos = ativos.reduce(
      (acc, a) => acc + (a.duracaoSegundos || 10),
      0
    );
    const limiteTempoSegundos = p.limiteTempoSegundos || 360;
    const tempoDisponivelSegundos = Math.max(0, limiteTempoSegundos - tempoOcupadoSegundos);
    const porcentagemOcupada = Math.min(
      100,
      Math.round((tempoOcupadoSegundos / limiteTempoSegundos) * 100)
    );

    // Encontrar data de término mais próxima entre anúncios ativos
    const datasFim = ativos
      .map((a) => a.dataFim)
      .filter((d): d is Date => d !== null)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const proximaLiberacao = datasFim[0] || null;

    // Remover lista de anúncios interna para resposta mais limpa
    const { anuncios: _a, ...resto } = p;

    return {
      ...resto,
      tempoOcupadoSegundos,
      tempoDisponivelSegundos,
      limiteTempoSegundos,
      porcentagemOcupada,
      quantidadeFilaEspera: fila.length,
      proximaLiberacao,
    };
  });

  return Response.json({ pontos: pontosComMetricas });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "PONTO") {
      return Response.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const existing = await prisma.pontoMidia.findUnique({
      where: { userId: session.userId },
    });
    if (existing) {
      return Response.json(
        { error: "Voce ja possui um ponto de midia cadastrado" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = pontoSchema.parse(body);

    let geo = null;
    try {
      geo = await geocodeAddress(
        data.rua,
        data.numero,
        data.bairro,
        data.cidade,
        data.uf
      );
    } catch {
      // Ignore geocode errors if Nominatim fails or times out
    }

  // Gerar código único de 6 dígitos para o novo ponto
  let codigoTv = "";
  let isUnique = false;
  while (!isUnique) {
    codigoTv = Math.floor(100000 + Math.random() * 900000).toString();
    const exists = await prisma.pontoMidia.findFirst({ where: { codigoTv } });
    if (!exists) isUnique = true;
  }

  const ponto = await prisma.pontoMidia.create({
    data: {
      ...data,
      userId: session.userId,
      codigoTv,
      lat: geo?.lat ?? null,
      lng: geo?.lng ?? null,
      status: "ATIVO",
    },
  });

    return Response.json({ ponto }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Create ponto error:", error);
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
