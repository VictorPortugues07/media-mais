import { prisma } from "./prisma";
import { consultarStatusPix } from "./abacatepay";
import { processarExpiracaoAnuncios } from "./expiracao";

const DIAS_VEICULACAO = 30; // cota mensal

export type ResultadoConfirmacao =
  | "nao_encontrada"
  | "ja_pago"
  | "pendente"
  | "expirada"
  | "cancelada"
  | "ativado"
  | "fila_espera"
  | "pago_sem_alteracao";

/**
 * Confirma o pagamento de uma cobrança consultando a AbacatePay (não confia só no payload
 * do webhook) e, se estiver paga, ativa o anúncio. É idempotente: pode ser chamada pelo
 * webhook, pelo polling da tela e por retentativas sem efeito duplicado.
 */
export async function confirmarPagamento(
  abacateId: string,
): Promise<ResultadoConfirmacao> {
  const cobranca = await prisma.cobranca.findUnique({ where: { abacateId } });
  if (!cobranca) return "nao_encontrada";
  if (cobranca.status === "PAGO") return "ja_pago";

  const statusRemoto = await consultarStatusPix(abacateId);

  if (statusRemoto === "EXPIRED" || statusRemoto === "CANCELLED") {
    await prisma.cobranca.updateMany({
      where: { id: cobranca.id, status: "PENDENTE" },
      data: { status: statusRemoto === "EXPIRED" ? "EXPIRADO" : "CANCELADO" },
    });
    return statusRemoto === "EXPIRED" ? "expirada" : "cancelada";
  }
  if (statusRemoto !== "PAID") return "pendente";

  return prisma.$transaction(async (tx): Promise<ResultadoConfirmacao> => {
    // Trava otimista: só uma execução consegue marcar como PAGO
    const marcou = await tx.cobranca.updateMany({
      where: { id: cobranca.id, status: { not: "PAGO" } },
      data: { status: "PAGO", pagoEm: new Date() },
    });
    if (marcou.count === 0) return "ja_pago";

    const anuncio = await tx.anuncio.findUnique({
      where: { id: cobranca.anuncioId },
      include: { anunciante: true, pontoMidia: true },
    });
    if (!anuncio || anuncio.status !== "APROVADO") return "pago_sem_alteracao";

    await processarExpiracaoAnuncios(anuncio.pontoMidiaId, tx);

    const ocupadas = await tx.anuncio.count({
      where: { pontoMidiaId: anuncio.pontoMidiaId, status: "ATIVO" },
    });
    const lotado = ocupadas >= (anuncio.pontoMidia.maxCotas || 8);

    const agora = new Date();
    const fim = new Date(
      agora.getTime() + DIAS_VEICULACAO * 24 * 60 * 60 * 1000,
    );

    await tx.anuncio.update({
      where: { id: anuncio.id },
      data: lotado
        ? { status: "FILA_ESPERA" }
        : { status: "ATIVO", dataInicio: agora, dataFim: fim },
    });

    await tx.notificacao.create({
      data: {
        userId: anuncio.anunciante.userId,
        tipo: lotado ? "FILA_ESPERA" : "COBRANCA",
        titulo: lotado
          ? "Pagamento confirmado — fila de espera"
          : "Pagamento confirmado!",
        mensagem: lotado
          ? `Recebemos o pagamento de "${anuncio.titulo}". As cotas da TV lotaram e seu anúncio entrou na fila de espera; ele entra no ar assim que houver vaga.`
          : `Recebemos o pagamento de "${anuncio.titulo}". Seu anúncio já está no ar em "${anuncio.pontoMidia.nomeEmpresa}".`,
      },
    });

    if (!lotado) {
      await tx.notificacao.create({
        data: {
          userId: anuncio.pontoMidia.userId,
          tipo: "NOVO_ANUNCIO_TV",
          titulo: "Novo anúncio na sua TV!",
          mensagem: `O anúncio "${anuncio.titulo}" de "${anuncio.anunciante.nomeEmpresa}" foi ativado na sua TV.`,
        },
      });
    }

    return lotado ? "fila_espera" : "ativado";
  });
}
