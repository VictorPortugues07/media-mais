import { prisma } from "./prisma";
import type { TipoNotificacao } from "@prisma/client";

export async function criarNotificacao(
  userId: number,
  tipo: TipoNotificacao,
  titulo: string,
  mensagem: string
) {
  return prisma.notificacao.create({
    data: { userId, tipo, titulo, mensagem },
  });
}

export async function notificarAprovacao(
  anuncianteUserId: number,
  pontoUserId: number,
  tituloAnuncio: string,
  nomeAnunciante: string,
  nomePonto: string
) {
  await Promise.all([
    criarNotificacao(
      anuncianteUserId,
      "ANUNCIO_APROVADO",
      "Anuncio Aprovado!",
      `Seu anuncio "${tituloAnuncio}" foi aprovado e ja esta ativo no ponto "${nomePonto}".`
    ),
    criarNotificacao(
      pontoUserId,
      "NOVO_ANUNCIO_TV",
      "Novo Anuncio na sua TV!",
      `O anuncio "${tituloAnuncio}" de "${nomeAnunciante}" foi aprovado e vai comecar a passar na sua TV.`
    ),
  ]);
}

export async function notificarRejeicao(
  anuncianteUserId: number,
  tituloAnuncio: string,
  motivo: string
) {
  await criarNotificacao(
    anuncianteUserId,
    "ANUNCIO_REJEITADO",
    "Anuncio Rejeitado",
    `Seu anuncio "${tituloAnuncio}" foi rejeitado. Motivo: ${motivo}`
  );
}
