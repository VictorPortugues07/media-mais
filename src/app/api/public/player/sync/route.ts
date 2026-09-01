import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Headers CORS para permitir que qualquer projeto externo (SPA, Electron, Smart TV app) acesse
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code")?.trim();

  if (!code || code.length !== 6) {
    return NextResponse.json(
      {
        success: false,
        error: "Código de pareamento inválido. Forneça o código numérico de 6 dígitos.",
      },
      { status: 400, headers: corsHeaders() }
    );
  }

  // 1. Buscar ponto de mídia pelo código
  const ponto = await prisma.pontoMidia.findUnique({
    where: { codigoTv: code },
    select: {
      id: true,
      nomeEmpresa: true,
      status: true,
      categoria: true,
      cidade: true,
      uf: true,
      localInstalacao: true,
      fotos: true,
      user: {
        select: {
          ativo: true,
        },
      },
    },
  });

  if (!ponto) {
    return NextResponse.json(
      {
        success: false,
        error: "Nenhum estabelecimento encontrado com este código.",
      },
      { status: 404, headers: corsHeaders() }
    );
  }

  // Verificar se usuário ou ponto está inativo / em moderação
  if (!ponto.user.ativo) {
    return NextResponse.json(
      {
        success: false,
        error: "Acesso da conta deste ponto suspenso pelo administrador.",
        status: "BLOQUEADO",
      },
      { status: 403, headers: corsHeaders() }
    );
  }

  if (ponto.status === "PENDENTE") {
    return NextResponse.json(
      {
        success: false,
        error: "Este ponto de TV está em processo de moderação e validação pela equipe Media+.",
        status: "PENDENTE",
        ponto: {
          id: ponto.id,
          nomeEmpresa: ponto.nomeEmpresa,
          cidade: ponto.cidade,
          uf: ponto.uf,
        },
      },
      { status: 403, headers: corsHeaders() }
    );
  }

  if (ponto.status === "INATIVO") {
    return NextResponse.json(
      {
        success: false,
        error: "Este ponto de TV está inativo no momento.",
        status: "INATIVO",
      },
      { status: 403, headers: corsHeaders() }
    );
  }

  // 2. Atualizar heartbeat da TV
  await prisma.pontoMidia.update({
    where: { id: ponto.id },
    data: { ultimaAtividade: new Date() },
  });

  // 3. Buscar anúncios ativos aprovados para esta TV
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
        select: {
          nomeEmpresa: true,
          categoria: true,
        },
      },
    },
    orderBy: { criadoEm: "asc" },
  });

  return NextResponse.json(
    {
      success: true,
      status: "ATIVO",
      ponto: {
        id: ponto.id,
        nomeEmpresa: ponto.nomeEmpresa,
        categoria: ponto.categoria,
        cidade: ponto.cidade,
        uf: ponto.uf,
      },
      totalAnuncios: anuncios.length,
      anuncios,
      timestamp: new Date().toISOString(),
    },
    { status: 200, headers: corsHeaders() }
  );
}
