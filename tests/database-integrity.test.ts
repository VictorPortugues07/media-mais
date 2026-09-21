import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";

describe("Módulo 2: Integridade de Dados e Proteção de Faturamento", () => {
  it("Deve impedir exclusão de Anúncio que possui registros de comprovação de veiculação (onDelete: Restrict)", async () => {
    // 1. Criar usuário e dados de teste temporários
    const testUser = await prisma.user.create({
      data: {
        email: `test_integrity_${Date.now()}@mediamais.com`,
        senha: "hash_de_teste_segura",
        nome: "Usuário Integridade",
        whatsapp: "11999999999",
        role: "PONTO",
      },
    });

    const testPonto = await prisma.pontoMidia.create({
      data: {
        userId: testUser.id,
        nomeEmpresa: "Ponto Teste Integridade",
        responsavel: "Responsável",
        whatsapp: "11999999999",
        cep: "01001000",
        rua: "Praça da Sé",
        numero: "1",
        bairro: "Centro",
        cidade: "São Paulo",
        uf: "SP",
        categoria: "Comércio",
        descricao: "Ponto para teste de integridade",
        possuiTv: true,
        fluxoDiarioEstimado: "100",
        tempoPermanencia: "15m",
        faixaEtariaPublico: ["Adulto"],
        generoPublico: "Todos",
        status: "ATIVO",
      },
    });

    const testAnuncianteUser = await prisma.user.create({
      data: {
        email: `test_anunciante_${Date.now()}@mediamais.com`,
        senha: "hash_de_teste_segura",
        nome: "Anunciante Integridade",
        whatsapp: "11988888888",
        role: "ANUNCIANTE",
      },
    });

    const testAnunciante = await prisma.anunciante.create({
      data: {
        userId: testAnuncianteUser.id,
        nomeEmpresa: "Empresa Anunciante Teste",
        responsavel: "Responsável",
        whatsapp: "11988888888",
        cep: "01001000",
        rua: "Praça da Sé",
        numero: "2",
        bairro: "Centro",
        cidade: "São Paulo",
        uf: "SP",
        categoria: "Comércio",
        oQueAnunciar: "Produtos",
        descricaoAnuncio: "Descrição",
        preferenciaLocalizacao: "Centro",
        generoAlvo: "Todos",
      },
    });

    const testAnuncio = await prisma.anuncio.create({
      data: {
        anuncianteId: testAnunciante.id,
        pontoMidiaId: testPonto.id,
        titulo: "Campanha Comprovada",
        descricao: "Campanha com telemetria ativa",
        tipoMidia: "IMAGEM",
        midiaUrl: "/uploads/images/sample.jpg",
        duracaoSegundos: 15,
        status: "ATIVO",
      },
    });

    // 2. Registrar comprovação de exibição (Proof of Play)
    const registro = await prisma.registroExibicao.create({
      data: {
        anuncioId: testAnuncio.id,
        pontoMidiaId: testPonto.id,
        duracaoSegundos: 15,
        tipoMidia: "IMAGEM",
      },
    });

    assert.ok(registro.id > 0);

    // 3. Tentar excluir fisicamente o anúncio: DEVE FALHAR devido a onDelete: Restrict
    let exclusaoFalhou = false;
    try {
      await prisma.anuncio.delete({
        where: { id: testAnuncio.id },
      });
    } catch (err: any) {
      exclusaoFalhou = true;
      // Prisma error P2003: Foreign key constraint failed on the field
      assert.ok(
        err.code === "P2003" || err.message.includes("Foreign key constraint"),
        `Erro esperado P2003 / Foreign key constraint, mas recebeu: ${err.message}`
      );
    }

    assert.equal(
      exclusaoFalhou,
      true,
      "O anúncio com histórico de veiculação NÃO DEVERIA ter sido excluído fisicamente!"
    );

    // Cleanup: remover registro de exibição primeiro, depois as entidades de teste
    await prisma.registroExibicao.delete({ where: { id: registro.id } });
    await prisma.anuncio.delete({ where: { id: testAnuncio.id } });
    await prisma.anunciante.delete({ where: { id: testAnunciante.id } });
    await prisma.pontoMidia.delete({ where: { id: testPonto.id } });
    await prisma.user.deleteMany({
      where: { id: { in: [testUser.id, testAnuncianteUser.id] } },
    });
  });
});
