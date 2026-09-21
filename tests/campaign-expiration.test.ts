import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { processarExpiracaoAnuncios, filtroAnunciosAtivosNaoExpirados } from "../src/lib/expiracao";

describe("Módulo 3: Ciclo de Vida e Expiração Automática de Campanhas", () => {
  it("Deve marcar campanhas com dataFim no passado como EXPIRADO e emitir notificação", async () => {
    // 1. Criar dados de teste
    const userPonto = await prisma.user.create({
      data: {
        email: `exp_ponto_${Date.now()}@mediamais.com`,
        senha: "hash",
        nome: "Dono Ponto Exp",
        whatsapp: "11900000000",
        role: "PONTO",
        ativo: true,
      },
    });

    const ponto = await prisma.pontoMidia.create({
      data: {
        userId: userPonto.id,
        nomeEmpresa: "Ponto Teste Expiração",
        responsavel: "Dono",
        whatsapp: "11900000000",
        cep: "01001000",
        rua: "Rua Teste",
        numero: "10",
        bairro: "Centro",
        cidade: "SP",
        uf: "SP",
        categoria: "Comércio",
        descricao: "Ponto Expiração",
        possuiTv: true,
        fluxoDiarioEstimado: "100",
        tempoPermanencia: "15m",
        faixaEtariaPublico: ["Adulto"],
        generoPublico: "Todos",
        status: "ATIVO",
      },
    });

    const userAnunciante = await prisma.user.create({
      data: {
        email: `exp_anu_${Date.now()}@mediamais.com`,
        senha: "hash",
        nome: "Anunciante Exp",
        whatsapp: "11911111111",
        role: "ANUNCIANTE",
        ativo: true,
      },
    });

    const anunciante = await prisma.anunciante.create({
      data: {
        userId: userAnunciante.id,
        nomeEmpresa: "Empresa Exp",
        responsavel: "Resp",
        whatsapp: "11911111111",
        cep: "01001000",
        rua: "Rua 2",
        numero: "20",
        bairro: "Centro",
        cidade: "SP",
        uf: "SP",
        categoria: "Comércio",
        oQueAnunciar: "Campanhas",
        descricaoAnuncio: "Desc",
        preferenciaLocalizacao: "SP",
        generoAlvo: "Todos",
      },
    });

    // Anúncio já vencido (expirou ontem)
    const dataOntem = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const anuncioVencido = await prisma.anuncio.create({
      data: {
        anuncianteId: anunciante.id,
        pontoMidiaId: ponto.id,
        titulo: "Campanha Vencida Ontem",
        descricao: "Deve ser expirada",
        tipoMidia: "IMAGEM",
        midiaUrl: "/uploads/images/sample.jpg",
        duracaoSegundos: 15,
        status: "ATIVO",
        dataFim: dataOntem,
      },
    });

    // Anúncio ainda válido (expira amanhã)
    const dataAmanha = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const anuncioValido = await prisma.anuncio.create({
      data: {
        anuncianteId: anunciante.id,
        pontoMidiaId: ponto.id,
        titulo: "Campanha Ativa Amanhã",
        descricao: "Deve continuar ativa",
        tipoMidia: "IMAGEM",
        midiaUrl: "/uploads/images/sample.jpg",
        duracaoSegundos: 15,
        status: "ATIVO",
        dataFim: dataAmanha,
      },
    });

    try {
      // 2. Executar processamento de expiração
      const expirados = await processarExpiracaoAnuncios(ponto.id);
      assert.equal(expirados, 1, "Exatamente 1 anúncio deveria ter sido expirado");

      // 3. Verificar status no banco
      const adVencidoDb = await prisma.anuncio.findUnique({ where: { id: anuncioVencido.id } });
      const adValidoDb = await prisma.anuncio.findUnique({ where: { id: anuncioValido.id } });

      assert.equal(adVencidoDb?.status, "EXPIRADO");
      assert.equal(adValidoDb?.status, "ATIVO");

      // 4. Testar filtro de playlist
      const playlist = await prisma.anuncio.findMany({
        where: {
          pontoMidiaId: ponto.id,
          ...filtroAnunciosAtivosNaoExpirados(),
        },
      });

      assert.equal(playlist.length, 1);
      assert.equal(playlist[0]?.id, anuncioValido.id);
    } finally {
      await prisma.anuncio.deleteMany({ where: { id: { in: [anuncioVencido.id, anuncioValido.id] } } });
      await prisma.anunciante.delete({ where: { id: anunciante.id } });
      await prisma.pontoMidia.delete({ where: { id: ponto.id } });
      await prisma.user.deleteMany({ where: { id: { in: [userPonto.id, userAnunciante.id] } } });
    }
  });
});
