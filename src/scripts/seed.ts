import { prisma } from "../lib/prisma";
import { hash } from "bcryptjs";
import type { TipoNotificacao } from "@prisma/client";
import { calcularScorePonderado, determinarTier } from "../lib/precificacao";
import {
  PONTOS,
  ANUNCIANTES,
  ANUNCIOS,
  SENHA_PONTO,
  SENHA_ANUNCIANTE,
  avatarUrl,
  fotoPontoUrl,
  fotoAnuncianteUrl,
  logoUrl,
  midiaAnuncioUrl,
} from "./demo-data";

/**
 * Seed de DEMONSTRAÇÃO da plataforma Media+.
 *
 * ATENÇÃO: apaga TODOS os dados do banco (usuários, pontos, anunciantes, anúncios,
 * exibições e notificações) e recria um cenário completo para apresentação.
 * As mídias usadas ficam em public/uploads/demo (geradas por `npm run demo:midia`).
 */

const DIA = 24 * 60 * 60 * 1000;
const agora = new Date();
const diasAtras = (d: number, hora = 10) => {
  const dt = new Date(agora.getTime() - d * DIA);
  dt.setHours(hora, 0, 0, 0);
  return dt;
};

// PRNG determinístico: o seed gera sempre os mesmos números
let semente = 20261023;
const aleatorio = () => {
  semente = (semente * 1664525 + 1013904223) % 4294967296;
  return semente / 4294967296;
};
const entre = (min: number, max: number) => Math.floor(min + aleatorio() * (max - min + 1));

async function limparBanco() {
  // CASCADE também limpa tabelas dependentes (ex.: cobrancas, se existir)
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE registros_exibicao, notificacoes, anuncios, anunciantes, pontos_midia, users RESTART IDENTITY CASCADE`
  );
}

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.SEED_FORCE !== "1") {
    throw new Error("Seed de demonstração bloqueado em produção (apaga o banco). Use SEED_FORCE=1 se tiver certeza.");
  }

  console.log("=========================================");
  console.log("  Seed de Demonstração — Media+          ");
  console.log("=========================================\n");

  await limparBanco();
  console.log("[RESET] Banco limpo.\n");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@mediamais.com";
  const adminRawPassword = process.env.ADMIN_PASSWORD || "mediamais2026";
  const [senhaAdmin, senhaPonto, senhaAnunciante] = await Promise.all([
    hash(adminRawPassword, 12),
    hash(SENHA_PONTO, 12),
    hash(SENHA_ANUNCIANTE, 12),
  ]);

  // ─────────────────────────────────────────────────────────────
  // 1. ADMINISTRADOR
  // ─────────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      senha: senhaAdmin,
      nome: "Administrador Media+",
      whatsapp: "(48) 98879-6514",
      avatarUrl: avatarUrl("admin"),
      role: "ADMIN",
      criadoEm: diasAtras(90),
    },
  });
  console.log(`[ADMIN] ${admin.email} (senha: ${adminRawPassword})`);

  // ─────────────────────────────────────────────────────────────
  // 2. PONTOS DE MÍDIA
  // ─────────────────────────────────────────────────────────────
  const pontos: Record<string, { id: number; userId: number; nomeEmpresa: string; abertura: number; fechamento: number; fluxo: number }> = {};

  for (const [i, p] of PONTOS.entries()) {
    const [notaFluxo, notaTempo, notaPerfil, notaExclusividade] = p.notas;
    const score = calcularScorePonderado(notaFluxo, notaTempo, notaPerfil, notaExclusividade);
    const tier = determinarTier(score);
    const criadoEm = diasAtras(60 - i * 3);

    const user = await prisma.user.create({
      data: {
        email: p.email,
        senha: senhaPonto,
        nome: p.responsavel,
        whatsapp: p.whatsapp,
        avatarUrl: avatarUrl(p.avatar),
        role: "PONTO",
        ativo: p.status !== "INATIVO",
        criadoEm,
      },
    });

    const ponto = await prisma.pontoMidia.create({
      data: {
        userId: user.id,
        codigoTv: p.codigoTv,
        nomeEmpresa: p.nomeEmpresa,
        responsavel: p.responsavel,
        whatsapp: p.whatsapp,
        instagramSite: p.instagramSite,
        cep: p.cep,
        rua: p.rua,
        numero: p.numero,
        bairro: p.bairro,
        cidade: p.cidade,
        uf: p.uf,
        categoria: p.categoria,
        descricao: p.descricao,
        possuiTv: true,
        quantidadeTvs: p.quantidadeTvs,
        localInstalacao: p.localInstalacao,
        fluxoDiarioEstimado: p.fluxoDiarioEstimado,
        tempoPermanencia: p.tempoPermanencia,
        faixaEtariaPublico: p.faixaEtariaPublico,
        generoPublico: p.generoPublico,
        horariosPico: p.horariosPico,
        horarioAbertura: p.horarioAbertura,
        horarioFechamento: p.horarioFechamento,
        diasFuncionamento: p.diasFuncionamento,
        fotos: p.fotos.map(fotoPontoUrl),
        lat: p.lat,
        lng: p.lng,
        status: p.status,
        aceitaNovosAnuncios: p.status === "ATIVO",
        notaFluxo,
        notaTempo,
        notaPerfil,
        notaExclusividade,
        scorePonderado: score,
        tier: tier.tier,
        cotaMensal: tier.cotaMensal,
        tipoDispositivo: p.tipoDispositivo,
        resolucaoTela: p.tipoDispositivo ? "1920x1080" : null,
        ultimaAtividade: p.status === "ATIVO" ? new Date(agora.getTime() - entre(5, 90) * 60 * 1000) : null,
        criadoEm,
      },
    });

    pontos[p.slug] = {
      id: ponto.id,
      userId: user.id,
      nomeEmpresa: p.nomeEmpresa,
      abertura: parseInt(p.horarioAbertura, 10),
      fechamento: Math.min(parseInt(p.horarioFechamento, 10), 23),
      fluxo: notaFluxo,
    };
    console.log(
      `[PONTO] ${p.nomeEmpresa.padEnd(30)} TV ${p.codigoTv} | ${p.status.padEnd(8)} | ${tier.tier} (R$ ${tier.cotaMensal}/mês) | ${p.email}`
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. ANUNCIANTES
  // ─────────────────────────────────────────────────────────────
  const anunciantes: Record<string, { id: number; userId: number; nomeEmpresa: string }> = {};

  for (const [i, a] of ANUNCIANTES.entries()) {
    const criadoEm = diasAtras(55 - i * 4);
    const user = await prisma.user.create({
      data: {
        email: a.email,
        senha: senhaAnunciante,
        nome: a.responsavel,
        whatsapp: a.whatsapp,
        avatarUrl: avatarUrl(a.avatar),
        role: "ANUNCIANTE",
        criadoEm,
      },
    });

    const anunciante = await prisma.anunciante.create({
      data: {
        userId: user.id,
        nomeEmpresa: a.nomeEmpresa,
        responsavel: a.responsavel,
        whatsapp: a.whatsapp,
        instagramSite: a.instagramSite,
        logoUrl: logoUrl(a.slug),
        fotos: a.fotos.map(fotoAnuncianteUrl),
        cep: a.cep,
        rua: a.rua,
        numero: a.numero,
        bairro: a.bairro,
        cidade: a.cidade,
        uf: a.uf,
        categoria: a.categoria,
        oQueAnunciar: a.oQueAnunciar,
        descricaoAnuncio: a.descricaoAnuncio,
        preferenciaLocalizacao: a.preferenciaLocalizacao,
        categoriasEspecificas: a.categoriasEspecificas,
        faixaEtariaAlvo: a.faixaEtariaAlvo,
        generoAlvo: a.generoAlvo,
        criadoEm,
      },
    });

    anunciantes[a.slug] = { id: anunciante.id, userId: user.id, nomeEmpresa: a.nomeEmpresa };
    console.log(`[ANUNCIANTE] ${a.nomeEmpresa.padEnd(30)} | ${a.email}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 4. ANÚNCIOS + HISTÓRICO DE EXIBIÇÕES
  // ─────────────────────────────────────────────────────────────
  const registros: { anuncioId: number; pontoMidiaId: number; duracaoSegundos: number; tipoMidia: "VIDEO" | "IMAGEM"; exibidoEm: Date }[] = [];
  const contagem: Record<string, number> = {};

  for (const ad of ANUNCIOS) {
    const ponto = pontos[ad.ponto]!;
    const anunciante = anunciantes[ad.anunciante]!;
    const duracaoSegundos = ad.tipoMidia === "VIDEO" ? 15 : 10;

    let dataInicio: Date | null = null;
    let dataFim: Date | null = null;
    let criadoEm = new Date(agora.getTime() - entre(2, 30) * 60 * 60 * 1000);

    if (ad.diasNoAr) {
      dataInicio = diasAtras(ad.diasNoAr, 8);
      dataFim = new Date(dataInicio.getTime() + 30 * DIA);
      criadoEm = new Date(dataInicio.getTime() - DIA);
    }

    const anuncio = await prisma.anuncio.create({
      data: {
        anuncianteId: anunciante.id,
        pontoMidiaId: ponto.id,
        titulo: ad.titulo,
        descricao: ad.descricao,
        tipoMidia: ad.tipoMidia,
        midiaUrl: midiaAnuncioUrl(ad.slug, ad.tipoMidia),
        duracaoSegundos,
        status: ad.status,
        motivoRejeicao: ad.motivoRejeicao ?? null,
        dataInicio,
        dataFim,
        criadoEm,
      },
    });
    contagem[ad.status] = (contagem[ad.status] ?? 0) + 1;

    // Exibições: campanhas que já foram ao ar (ativas, pausadas ou expiradas)
    if (ad.diasNoAr && dataInicio) {
      const ultimoDia = ad.status === "EXPIRADO" ? ad.diasNoAr - 30 : ad.status === "PAUSADO" ? 3 : 0;
      for (let d = ad.diasNoAr; d >= Math.max(ultimoDia, 0); d--) {
        const exibicoesNoDia = Math.round(entre(18, 34) * (ponto.fluxo / 4));
        for (let n = 0; n < exibicoesNoDia; n++) {
          const exibidoEm = diasAtras(d, entre(ponto.abertura, ponto.fechamento - 1));
          exibidoEm.setMinutes(entre(0, 59), entre(0, 59));
          if (exibidoEm > agora) continue;
          registros.push({ anuncioId: anuncio.id, pontoMidiaId: ponto.id, duracaoSegundos, tipoMidia: ad.tipoMidia, exibidoEm });
        }
      }
    }
  }

  for (let i = 0; i < registros.length; i += 2000) {
    await prisma.registroExibicao.createMany({ data: registros.slice(i, i + 2000) });
  }
  console.log(`\n[ANÚNCIOS] ${ANUNCIOS.length} criados →`, contagem);
  console.log(`[EXIBIÇÕES] ${registros.length} registros de exibição gerados`);

  // ─────────────────────────────────────────────────────────────
  // 5. NOTIFICAÇÕES
  // ─────────────────────────────────────────────────────────────
  type Notif = { userId: number; tipo: TipoNotificacao; titulo: string; mensagem: string; lida?: boolean; horasAtras: number };
  const notificacoes: Notif[] = [];

  // Admin
  for (const ad of ANUNCIOS.filter((a) => a.status === "PENDENTE")) {
    notificacoes.push({
      userId: admin.id,
      tipo: "ANUNCIO_PENDENTE",
      titulo: "Novo anúncio aguardando moderação",
      mensagem: `"${ad.titulo}" de ${anunciantes[ad.anunciante]!.nomeEmpresa} para ${pontos[ad.ponto]!.nomeEmpresa}.`,
      horasAtras: entre(1, 20),
    });
  }
  for (const p of PONTOS.filter((p) => p.status === "PENDENTE")) {
    notificacoes.push({
      userId: admin.id,
      tipo: "ALERTA",
      titulo: "Novo estabelecimento cadastrado",
      mensagem: `${p.nomeEmpresa} (${p.bairro}, ${p.cidade}) aguarda aprovação para entrar na rede.`,
      horasAtras: entre(2, 30),
    });
  }
  notificacoes.push(
    { userId: admin.id, tipo: "FILA_ESPERA", titulo: "Anúncios na fila de espera", mensagem: "2 campanhas aguardam liberação de cota em Villa Gourmet e Iron Fitness.", horasAtras: 26, lida: true },
    { userId: admin.id, tipo: "PONTO_DESATIVADO", titulo: "Ponto desativado", mensagem: "Lava-Jato Brilho Total foi desativado temporariamente (TV em manutenção).", horasAtras: 72, lida: true },
    { userId: admin.id, tipo: "COBRANCA", titulo: "Pagamento recebido", mensagem: "AutoPrime Veículos pagou R$ 249,00 via PIX — campanha \"Festival de Seminovos\".", horasAtras: 290, lida: true }
  );

  // Anunciantes
  for (const ad of ANUNCIOS) {
    const userId = anunciantes[ad.anunciante]!.userId;
    const ponto = pontos[ad.ponto]!.nomeEmpresa;
    if (ad.status === "ATIVO") {
      notificacoes.push({ userId, tipo: "ANUNCIO_APROVADO", titulo: "Campanha no ar!", mensagem: `"${ad.titulo}" foi aprovada e está sendo exibida em ${ponto}.`, horasAtras: (ad.diasNoAr ?? 1) * 24, lida: (ad.diasNoAr ?? 0) > 5 });
    } else if (ad.status === "REJEITADO") {
      notificacoes.push({ userId, tipo: "ANUNCIO_REJEITADO", titulo: "Anúncio não aprovado", mensagem: `"${ad.titulo}" para ${ponto}: ${ad.motivoRejeicao}`, horasAtras: 30 });
    } else if (ad.status === "FILA_ESPERA") {
      notificacoes.push({ userId, tipo: "FILA_ESPERA", titulo: "Anúncio na fila de espera", mensagem: `${ponto} está com as cotas ocupadas. "${ad.titulo}" entra no ar assim que abrir uma vaga.`, horasAtras: 26 });
    } else if (ad.status === "APROVADO") {
      notificacoes.push({ userId, tipo: "COBRANCA", titulo: "Anúncio aprovado — pague para ativar", mensagem: `"${ad.titulo}" foi aprovado para ${ponto}. Gere o PIX no painel para colocar no ar.`, horasAtras: 5 });
    } else if (ad.status === "EXPIRADO") {
      notificacoes.push({ userId, tipo: "GERAL", titulo: "Campanha encerrada", mensagem: `"${ad.titulo}" em ${ponto} completou 30 dias e foi encerrada. Que tal renovar?`, horasAtras: 240, lida: true });
    } else if (ad.status === "PENDENTE") {
      notificacoes.push({ userId, tipo: "SISTEMA", titulo: "Anúncio enviado para análise", mensagem: `"${ad.titulo}" foi recebido e será analisado em até 24h.`, horasAtras: entre(1, 20), lida: true });
    }
  }

  // Pontos
  for (const ad of ANUNCIOS.filter((a) => a.status === "ATIVO")) {
    notificacoes.push({
      userId: pontos[ad.ponto]!.userId,
      tipo: "NOVO_ANUNCIO_TV",
      titulo: "Novo anúncio na sua TV",
      mensagem: `${anunciantes[ad.anunciante]!.nomeEmpresa} começou a veicular "${ad.titulo}" na sua tela.`,
      horasAtras: (ad.diasNoAr ?? 1) * 24,
      lida: (ad.diasNoAr ?? 0) > 5,
    });
  }
  for (const p of PONTOS) {
    const userId = pontos[p.slug]!.userId;
    if (p.status === "ATIVO") {
      notificacoes.push({ userId, tipo: "PONTO_ATIVADO", titulo: "Seu ponto foi aprovado!", mensagem: `${p.nomeEmpresa} agora faz parte da rede Media+. Pareie sua TV com o código ${p.codigoTv}.`, horasAtras: 24 * 25, lida: true });
    } else if (p.status === "PENDENTE") {
      notificacoes.push({ userId, tipo: "SISTEMA", titulo: "Cadastro em análise", mensagem: "Recebemos seu cadastro! Nossa equipe vai validar as informações em até 48h.", horasAtras: 20 });
    } else {
      notificacoes.push({ userId, tipo: "PONTO_DESATIVADO", titulo: "Ponto desativado", mensagem: "Seu ponto foi desativado temporariamente. Fale com o suporte para reativar.", horasAtras: 72 });
    }
  }

  await prisma.notificacao.createMany({
    data: notificacoes.map(({ horasAtras, lida, ...n }) => ({
      ...n,
      lida: lida ?? false,
      criadoEm: new Date(agora.getTime() - horasAtras * 60 * 60 * 1000),
    })),
  });
  console.log(`[NOTIFICAÇÕES] ${notificacoes.length} criadas`);

  console.log("\n=========================================");
  console.log("  Seed concluído! Acessos em ACESSOS.md  ");
  console.log("=========================================");
}

main()
  .catch((e) => {
    console.error("Erro fatal no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
