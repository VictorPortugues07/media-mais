import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const anuncioId = parseInt(id);

  if (isNaN(anuncioId)) {
    return Response.json({ error: "ID inválido" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const motivo = typeof body.motivo === "string" ? body.motivo.trim() : "";

  if (!motivo || motivo.length < 5) {
    return Response.json(
      { error: "Informe um motivo detalhado para a solicitação de remoção (mínimo 5 caracteres)." },
      { status: 400 }
    );
  }

  const anuncio = await prisma.anuncio.findUnique({
    where: { id: anuncioId },
    include: {
      anunciante: { select: { id: true, userId: true, nomeEmpresa: true } },
      pontoMidia: { select: { id: true, userId: true, nomeEmpresa: true, cidade: true, uf: true } },
    },
  });

  if (!anuncio) {
    return Response.json({ error: "Anúncio não encontrado" }, { status: 404 });
  }

  // Tanto o anunciante (criador da peça), quanto o dono do ponto (TV onde veicula) ou ADMIN podem solicitar
  const isOwner = session.role === "ANUNCIANTE" && anuncio.anunciante.userId === session.userId;
  const isPonto = session.role === "PONTO" && anuncio.pontoMidia.userId === session.userId;
  const isAdmin = session.role === "ADMIN";

  if (!isOwner && !isPonto && !isAdmin) {
    return Response.json(
      { error: "Você não tem permissão para solicitar a remoção deste anúncio." },
      { status: 403 }
    );
  }

  try {
    const solicitanteDesc = isOwner
      ? `O anunciante "${anuncio.anunciante.nomeEmpresa}" solicitou a remoção de sua campanha "${anuncio.titulo}" (TV: ${anuncio.pontoMidia.nomeEmpresa})`
      : `O estabelecimento "${anuncio.pontoMidia.nomeEmpresa}" (${anuncio.pontoMidia.cidade}/${anuncio.pontoMidia.uf}) solicitou a remoção do anúncio "${anuncio.titulo}" de ${anuncio.anunciante.nomeEmpresa}`;

    // 1. Notificar todos os administradores da plataforma com alerta prioritário
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notificacao.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          tipo: "ALERTA" as const,
          titulo: `Solicitação de remoção de anúncio: "${anuncio.titulo}"`,
          mensagem: `${solicitanteDesc}. Motivo: "${motivo}"`,
        })),
      });
    }

    // 2. Notificar o próprio solicitante confirmando o recebimento
    await prisma.notificacao.create({
      data: {
        userId: session.userId,
        tipo: "SISTEMA",
        titulo: "Solicitação de remoção enviada",
        mensagem: `Sua solicitação de remoção do anúncio "${anuncio.titulo}" foi enviada para análise da moderação com sucesso.`,
      },
    });

    return Response.json({
      success: true,
      message: "Solicitação de remoção enviada com sucesso para a moderação da plataforma.",
    });
  } catch (error) {
    console.error("Erro ao solicitar remoção de anúncio:", error);
    return Response.json({ error: "Erro interno ao enviar solicitação" }, { status: 500 });
  }
}
