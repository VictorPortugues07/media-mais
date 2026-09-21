import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET as getAnunciosHandler } from "../src/app/api/anuncios/route";
import { generateToken } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

describe("Módulo 1: Isolamento Multitenant em Anúncios", () => {
  it("GET /api/anuncios deve rejeitar requisição sem autenticação com 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/anuncios", {
      method: "GET",
    });

    const res = await getAnunciosHandler(req);
    assert.equal(res.status, 401);

    const data = await res.json();
    assert.equal(data.error, "Nao autorizado");
  });

  it("Anunciante recém-cadastrado sem perfil concluído não deve receber anúncios de terceiros", async () => {
    // 1. Criar usuário anunciante temporário sem perfil em Anunciante
    const newUser = await prisma.user.create({
      data: {
        email: `anunciante_sem_perfil_${Date.now()}@mediamais.com`,
        senha: "hash_de_teste_segura",
        nome: "Anunciante Sem Perfil",
        whatsapp: "11977777777",
        role: "ANUNCIANTE",
        ativo: true,
      },
    });

    const token = await generateToken({
      userId: newUser.id,
      email: newUser.email,
      nome: newUser.nome,
      role: newUser.role,
    });

    try {
      const req = new NextRequest("http://localhost:3000/api/anuncios", {
        method: "GET",
        headers: {
          Cookie: `mm_session=${token}`,
        },
      });

      const res = await getAnunciosHandler(req);
      assert.equal(res.status, 200);

      const data = await res.json();
      assert.ok(Array.isArray(data.anuncios));
      assert.equal(
        data.anuncios.length,
        0,
        "Anunciante sem perfil NUNCA deve receber anúncios de outros clientes!"
      );
    } finally {
      await prisma.user.delete({ where: { id: newUser.id } });
    }
  });

  it("Dono de Ponto não pode acessar campanhas de concorrentes via parâmetro ?pontoId=", async () => {
    // Criar dois pontos distintos
    const userPonto1 = await prisma.user.create({
      data: {
        email: `ponto1_${Date.now()}@mediamais.com`,
        senha: "hash",
        nome: "Dono Ponto 1",
        whatsapp: "11911111111",
        role: "PONTO",
        ativo: true,
      },
    });

    const ponto1 = await prisma.pontoMidia.create({
      data: {
        userId: userPonto1.id,
        nomeEmpresa: "Bar Ponto 1",
        responsavel: "Dono 1",
        whatsapp: "11911111111",
        cep: "01001000",
        rua: "Rua 1",
        numero: "1",
        bairro: "Centro",
        cidade: "SP",
        uf: "SP",
        categoria: "Bar",
        descricao: "Ponto 1",
        possuiTv: true,
        fluxoDiarioEstimado: "50",
        tempoPermanencia: "1h",
        faixaEtariaPublico: ["Adulto"],
        generoPublico: "Todos",
        status: "ATIVO",
      },
    });

    const tokenPonto1 = await generateToken({
      userId: userPonto1.id,
      email: userPonto1.email,
      nome: userPonto1.nome,
      role: userPonto1.role,
    });

    try {
      // Tentativa de ataque: Ponto 1 tenta forçar ?pontoId=9999 na query string
      const req = new NextRequest("http://localhost:3000/api/anuncios?pontoId=9999", {
        method: "GET",
        headers: {
          Cookie: `mm_session=${tokenPonto1}`,
        },
      });

      const res = await getAnunciosHandler(req);
      assert.equal(res.status, 200);

      const data = await res.json();
      assert.ok(Array.isArray(data.anuncios));
      // Todos os anúncios retornados DEVEM pertencer ao Ponto 1, nunca ao 9999
      for (const anuncio of data.anuncios) {
        assert.equal(anuncio.pontoMidiaId, ponto1.id);
      }
    } finally {
      await prisma.pontoMidia.delete({ where: { id: ponto1.id } });
      await prisma.user.delete({ where: { id: userPonto1.id } });
    }
  });
});
