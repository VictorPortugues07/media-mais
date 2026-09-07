import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const PAIR_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "mediamais_plataforma_secret_2026"
);

async function signTVToken(pontoId: number): Promise<string> {
  return await new SignJWT({ pontoId, role: "TV_PLAYER" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .setIssuedAt()
    .sign(PAIR_SECRET);
}

async function verifyTVToken(token: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, PAIR_SECRET);
    return (payload as any).pontoId || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const codigo = searchParams.get("codigo")?.trim();
  const pontoIdParam = searchParams.get("pontoId");
  const tvToken = request.headers.get("x-tv-token") || searchParams.get("token");

  // Se já estiver conectado e consultando atualizações da playlist pelo pontoId:
  // Exige token assinado da sessão de pareamento para impedir acesso direto apenas com o id na URL
  if (pontoIdParam) {
    const pontoId = parseInt(pontoIdParam);

    if (!tvToken) {
      return Response.json(
        { error: "Acesso negado. Sessão de TV não autorizada." },
        { status: 401 }
      );
    }

    const tokenPontoId = await verifyTVToken(tvToken);
    if (!tokenPontoId || tokenPontoId !== pontoId) {
      return Response.json(
        { error: "Token de pareamento inválido ou expirado." },
        { status: 403 }
      );
    }

    const ponto = await prisma.pontoMidia.findUnique({
      where: { id: pontoId },
      select: {
        id: true,
        nomeEmpresa: true,
        status: true,
        categoria: true,
        cidade: true,
        uf: true,
      },
    });

    if (!ponto || ponto.status !== "ATIVO") {
      return Response.json({ error: "Ponto não encontrado ou inativo" }, { status: 404 });
    }

    const anuncios = await prisma.anuncio.findMany({
      where: {
        pontoMidiaId: ponto.id,
        status: "ATIVO",
      },
      select: {
        id: true,
        titulo: true,
        tipoMidia: true,
        midiaUrl: true,
        duracaoSegundos: true,
        anunciante: {
          select: { nomeEmpresa: true },
        },
      },
      orderBy: { criadoEm: "asc" },
    });

    return Response.json({ ponto, anuncios });
  }

  if (!codigo || codigo.length !== 6) {
    return Response.json(
      { error: "Código de TV inválido. Digite os 6 números gerados no seu celular." },
      { status: 400 }
    );
  }

  const agora = new Date();

  // 1. Procurar por ponto cujo código rotativo seja igual e ainda esteja válido (dentro do prazo)
  let ponto = await prisma.pontoMidia.findFirst({
    where: {
      codigoRotativo: codigo,
      codigoRotativoExpira: { gte: agora },
    },
    select: {
      id: true,
      nomeEmpresa: true,
      status: true,
      categoria: true,
      cidade: true,
      uf: true,
    },
  });

  // Fallback caso seja o código mestre cadastrado fixo
  if (!ponto) {
    ponto = await prisma.pontoMidia.findUnique({
      where: { codigoTv: codigo },
      select: {
        id: true,
        nomeEmpresa: true,
        status: true,
        categoria: true,
        cidade: true,
        uf: true,
      },
    });
  }

  if (!ponto) {
    return Response.json(
      { error: "Código expirado ou inválido. Gere um novo código de 6 dígitos no seu celular." },
      { status: 404 }
    );
  }

  if (ponto.status !== "ATIVO") {
    return Response.json(
      { error: "Este ponto de TV ainda não está com status ATIVO." },
      { status: 403 }
    );
  }

  // Gera o token de segurança para proteger requisições de sincronização
  const pairToken = await signTVToken(ponto.id);

  // Atualiza a última atividade do ponto
  await prisma.pontoMidia.update({
    where: { id: ponto.id },
    data: { ultimaAtividade: new Date() },
  });

  // Busca anúncios ativos do ponto
  const anuncios = await prisma.anuncio.findMany({
    where: {
      pontoMidiaId: ponto.id,
      status: "ATIVO",
    },
    select: {
      id: true,
      titulo: true,
      tipoMidia: true,
      midiaUrl: true,
      duracaoSegundos: true,
      anunciante: {
        select: { nomeEmpresa: true },
      },
    },
    orderBy: { criadoEm: "asc" },
  });

  return Response.json({
    ponto,
    anuncios,
    token: pairToken,
  });
}
