import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { deleteUploadedFile } from "@/lib/upload";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const anuncioId = parseInt(id);

  const anuncio = await prisma.anuncio.findUnique({
    where: { id: anuncioId },
    include: {
      anunciante: true,
      pontoMidia: true,
    },
  });

  if (!anuncio) {
    return Response.json({ error: "Anuncio nao encontrado" }, { status: 404 });
  }

  // Proteção de acesso direto pela URL:
  // Anunciante só pode ver os seus próprios anúncios
  if (session.role === "ANUNCIANTE" && anuncio.anunciante.userId !== session.userId) {
    return Response.json({ error: "Acesso negado a este anúncio" }, { status: 403 });
  }

  // Ponto de mídia só pode ver anúncios veiculados na sua própria tela
  if (session.role === "PONTO" && anuncio.pontoMidia.userId !== session.userId) {
    return Response.json({ error: "Acesso negado a este anúncio" }, { status: 403 });
  }

  return Response.json({ anuncio });
}

export async function DELETE(
  _request: NextRequest,
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

  const anuncio = await prisma.anuncio.findUnique({
    where: { id: anuncioId },
    include: {
      anunciante: true,
      pontoMidia: true,
    },
  });

  if (!anuncio) {
    return Response.json({ error: "Anúncio não encontrado" }, { status: 404 });
  }

  // Validação de permissões: apenas ADMINISTRADORES podem excluir anúncios da plataforma
  if (session.role !== "ADMIN") {
    return Response.json(
      {
        error: "Apenas administradores podem excluir anúncios do sistema. Utilize a opção de solicitar remoção à moderação.",
      },
      { status: 403 }
    );
  }

  try {
    // 1. Remover arquivo físico do vídeo/imagem do servidor
    if (anuncio.midiaUrl) {
      await deleteUploadedFile(anuncio.midiaUrl);
    }

    // 2. Notificações contextuais disparadas pelo Admin
    await prisma.notificacao.create({
      data: {
        userId: anuncio.anunciante.userId,
        tipo: "SISTEMA",
        titulo: "Anúncio removido pela moderação",
        mensagem: `O anúncio "${anuncio.titulo}" foi removido pela administração da plataforma.`,
      },
    });

    if (anuncio.status === "ATIVO") {
      await prisma.notificacao.create({
        data: {
          userId: anuncio.pontoMidia.userId,
          tipo: "SISTEMA",
          titulo: "Campanha removida da TV",
          mensagem: `O anúncio "${anuncio.titulo}" que estava em exibição no seu ponto foi removido pela administração.`,
        },
      });
    }

    // 3. Excluir do banco de dados (cascade remove registros de exibição associados)
    await prisma.anuncio.delete({
      where: { id: anuncioId },
    });

    return Response.json({
      success: true,
      message: "Anúncio e mídia excluídos com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao excluir anúncio:", error);
    return Response.json({ error: "Erro interno ao excluir anúncio" }, { status: 500 });
  }
}
