import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const codigo = searchParams.get("codigo")?.trim();

  if (!codigo || codigo.length !== 6) {
    return Response.json(
      { error: "Código de TV inválido. Digite os 6 números." },
      { status: 400 }
    );
  }

  const ponto = await prisma.pontoMidia.findUnique({
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

  if (!ponto) {
    return Response.json(
      { error: "Nenhum ponto de TV encontrado com este código." },
      { status: 404 }
    );
  }

  if (ponto.status !== "ATIVO") {
    return Response.json(
      { error: "Este ponto de TV ainda não está com status ATIVO." },
      { status: 403 }
    );
  }

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
  });
}
