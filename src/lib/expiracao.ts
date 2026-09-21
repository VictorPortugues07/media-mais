import { prisma } from "./prisma";
import type { PrismaClient } from "@prisma/client";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Verifica anúncios ativos cuja data de término já expirou,
 * atualiza seu status para EXPIRADO e notifica os anunciantes.
 */
export async function processarExpiracaoAnuncios(
  pontoMidiaId?: number,
  tx?: TxClient
): Promise<number> {
  const db = tx ?? prisma;
  const agora = new Date();

  const whereClause: Record<string, unknown> = {
    status: "ATIVO",
    dataFim: { lt: agora },
  };

  if (pontoMidiaId) {
    whereClause.pontoMidiaId = pontoMidiaId;
  }

  // Buscar anúncios vencidos
  const vencidos = await db.anuncio.findMany({
    where: whereClause,
    include: {
      anunciante: { include: { user: true } },
      pontoMidia: true,
    },
  });

  if (vencidos.length === 0) return 0;

  for (const ad of vencidos) {
    await db.anuncio.update({
      where: { id: ad.id },
      data: { status: "EXPIRADO" },
    });

    // Notificar anunciante
    await db.notificacao.create({
      data: {
        userId: ad.anunciante.user.id,
        tipo: "SISTEMA",
        titulo: "Campanha Concluída",
        mensagem: `Sua campanha "${ad.titulo}" atingiu a data final de veiculação no ponto "${ad.pontoMidia.nomeEmpresa}" e foi finalizada com sucesso.`,
      },
    });
  }

  return vencidos.length;
}

/**
 * Retorna filtro do Prisma para selecionar apenas anúncios estritamente ativos e não expirados
 */
export function filtroAnunciosAtivosNaoExpirados(agora = new Date()) {
  return {
    status: "ATIVO" as const,
    OR: [{ dataFim: null }, { dataFim: { gte: agora } }],
  };
}
