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

export async function notificarTvOffline(
  pontoUserId: number,
  nomeEmpresa: string
) {
  // Evitar floodar notificações se já foi emitida uma nos últimos 30 minutos
  const trintaMinAtras = new Date(Date.now() - 30 * 60 * 1000);
  const recente = await prisma.notificacao.findFirst({
    where: {
      userId: pontoUserId,
      tipo: "ALERTA",
      criadoEm: { gte: trintaMinAtras },
    },
  });

  if (recente) return;

  // Notificar dono do ponto
  await criarNotificacao(
    pontoUserId,
    "ALERTA",
    "Atenção: TV Desconectada em Horário de Funcionamento",
    `A TV do estabelecimento "${nomeEmpresa}" está há mais de 10 minutos sem transmitir anúncios. Por favor, acesse o reprodutor e reconecte para manter as veiculações ativas.`
  );

  // Notificar administradores
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  for (const admin of admins) {
    await criarNotificacao(
      admin.id,
      "ALERTA",
      `Alerta de TV Offline: ${nomeEmpresa}`,
      `O ponto "${nomeEmpresa}" está em horário de funcionamento mas não transmite sinal há mais de 10 minutos.`
    );
  }
}
