import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { PATCH as aprovarHandler } from "../src/app/api/anuncios/[id]/aprovar/route";
import { POST as promoverFilaHandler } from "../src/app/api/anuncios/[id]/promover-fila/route";
import { PATCH as rejeitarHandler } from "../src/app/api/anuncios/[id]/rejeitar/route";
import { generateToken } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

describe("Módulo 3: Motor de Capacidade de 6 Minutos e Máquina de Estados", () => {
  it("Deve bloquear aprovação que exceda o limite de 360s com status 409 CAPACIDADE_EXCEDIDA", async () => {
    // 1. Setup do ambiente de teste
    const adminUser = await prisma.user.create({
      data: {
        email: `admin_cap_${Date.now()}@mediamais.com`,
        senha: "hash",
        nome: "Admin Cap",
        whatsapp: "11999990000",
        role: "ADMIN",
        ativo: true,
      },
    });

    const adminToken = await generateToken({
      userId: adminUser.id,
      email: adminUser.email,
      nome: adminUser.nome,
      role: "ADMIN",
    });

    const pontoUser = await prisma.user.create({
      data: {
        email: `ponto_cap_${Date.now()}@mediamais.com`,
        senha: "hash",
        nome: "Ponto Cap",
        whatsapp: "11999991111",
        role: "PONTO",
        ativo: true,
      },
    });

    const ponto = await prisma.pontoMidia.create({
      data: {
        userId: pontoUser.id,
        nomeEmpresa: "Ponto Limite 360s",
        responsavel: "Resp",
        whatsapp: "11999991111",
        cep: "01001000",
        rua: "Rua",
        numero: "1",
        bairro: "Bairro",
        cidade: "SP",
        uf: "SP",
        categoria: "Comércio",
        descricao: "Ponto",
        possuiTv: true,
        limiteTempoSegundos: 360,
        maxCotas: 1,
        fluxoDiarioEstimado: "50",
        tempoPermanencia: "10m",
        faixaEtariaPublico: ["Adulto"],
        generoPublico: "Todos",
        status: "ATIVO",
      },
    });

    const anuUser = await prisma.user.create({
      data: {
        email: `anu_cap_${Date.now()}@mediamais.com`,
        senha: "hash",
        nome: "Anu Cap",
        whatsapp: "11999992222",
        role: "ANUNCIANTE",
        ativo: true,
      },
    });

    const anunciante = await prisma.anunciante.create({
      data: {
        userId: anuUser.id,
        nomeEmpresa: "Empresa Cap",
        responsavel: "Resp",
        whatsapp: "11999992222",
        cep: "01001000",
        rua: "Rua",
        numero: "1",
        bairro: "Bairro",
        cidade: "SP",
        uf: "SP",
        categoria: "Comércio",
        oQueAnunciar: "Ads",
        descricaoAnuncio: "Desc",
        preferenciaLocalizacao: "SP",
        generoAlvo: "Todos",
      },
    });

    // Criar anúncio prévio ocupando 350 segundos do ponto
    const adOcupando = await prisma.anuncio.create({
      data: {
        anuncianteId: anunciante.id,
        pontoMidiaId: ponto.id,
        titulo: "Anúncio Ocupando Grade Quase Toda",
        descricao: "350s",
        tipoMidia: "VIDEO",
        midiaUrl: "/uploads/videos/sample.mp4",
        duracaoSegundos: 350,
        status: "ATIVO",
      },
    });

    // Anúncio novo de 30 segundos: 350 + 30 = 380 > 360 -> DEVE SER RECUSADO
    const adNovo = await prisma.anuncio.create({
      data: {
        anuncianteId: anunciante.id,
        pontoMidiaId: ponto.id,
        titulo: "Novo Anúncio Excedente",
        descricao: "30s",
        tipoMidia: "VIDEO",
        midiaUrl: "/uploads/videos/sample2.mp4",
        duracaoSegundos: 30,
        status: "PENDENTE",
      },
    });

    try {
      const req = new NextRequest(`http://localhost:3000/api/anuncios/${adNovo.id}/aprovar`, {
        method: "PATCH",
        headers: {
          Cookie: `mm_session=${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "APROVAR", force: false }),
      });

      const res = await aprovarHandler(req, { params: Promise.resolve({ id: String(adNovo.id) }) });
      assert.equal(res.status, 409, "Aprovação acima do limite de cotas deveria retornar 409!");

      const data = await res.json();
      assert.equal(data.code, "CAPACIDADE_EXCEDIDA");
    } finally {
      await prisma.anuncio.deleteMany({ where: { id: { in: [adOcupando.id, adNovo.id] } } });
      await prisma.anunciante.delete({ where: { id: anunciante.id } });
      await prisma.pontoMidia.delete({ where: { id: ponto.id } });
      await prisma.user.deleteMany({ where: { id: { in: [adminUser.id, pontoUser.id, anuUser.id] } } });
    }
  });

  it("Não deve permitir aprovar diretamente um anúncio com status REJEITADO", async () => {
    const adminUser = await prisma.user.create({
      data: {
        email: `admin_rej_${Date.now()}@mediamais.com`,
        senha: "hash",
        nome: "Admin Rej",
        whatsapp: "11999993333",
        role: "ADMIN",
        ativo: true,
      },
    });

    const adminToken = await generateToken({
      userId: adminUser.id,
      email: adminUser.email,
      nome: adminUser.nome,
      role: "ADMIN",
    });

    const pontoUser = await prisma.user.create({
      data: {
        email: `ponto_rej_${Date.now()}@mediamais.com`,
        senha: "hash",
        nome: "Ponto Rej",
        whatsapp: "11999994444",
        role: "PONTO",
        ativo: true,
      },
    });

    const ponto = await prisma.pontoMidia.create({
      data: {
        userId: pontoUser.id,
        nomeEmpresa: "Ponto Rej",
        responsavel: "Resp",
        whatsapp: "11999994444",
        cep: "01001000",
        rua: "Rua",
        numero: "1",
        bairro: "Bairro",
        cidade: "SP",
        uf: "SP",
        categoria: "Comércio",
        descricao: "Ponto",
        possuiTv: true,
        fluxoDiarioEstimado: "50",
        tempoPermanencia: "10m",
        faixaEtariaPublico: ["Adulto"],
        generoPublico: "Todos",
        status: "ATIVO",
      },
    });

    const anuUser = await prisma.user.create({
      data: {
        email: `anu_rej_${Date.now()}@mediamais.com`,
        senha: "hash",
        nome: "Anu Rej",
        whatsapp: "11999995555",
        role: "ANUNCIANTE",
        ativo: true,
      },
    });

    const anunciante = await prisma.anunciante.create({
      data: {
        userId: anuUser.id,
        nomeEmpresa: "Empresa Rej",
        responsavel: "Resp",
        whatsapp: "11999995555",
        cep: "01001000",
        rua: "Rua",
        numero: "1",
        bairro: "Bairro",
        cidade: "SP",
        uf: "SP",
        categoria: "Comércio",
        oQueAnunciar: "Ads",
        descricaoAnuncio: "Desc",
        preferenciaLocalizacao: "SP",
        generoAlvo: "Todos",
      },
    });

    const adRejeitado = await prisma.anuncio.create({
      data: {
        anuncianteId: anunciante.id,
        pontoMidiaId: ponto.id,
        titulo: "Anúncio Bloqueado por Violação",
        descricao: "Desc",
        tipoMidia: "IMAGEM",
        midiaUrl: "/uploads/images/sample.jpg",
        duracaoSegundos: 10,
        status: "REJEITADO",
        motivoRejeicao: "Conteúdo inadequado",
      },
    });

    try {
      const req = new NextRequest(`http://localhost:3000/api/anuncios/${adRejeitado.id}/aprovar`, {
        method: "PATCH",
        headers: {
          Cookie: `mm_session=${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "APROVAR" }),
      });

      const res = await aprovarHandler(req, { params: Promise.resolve({ id: String(adRejeitado.id) }) });
      assert.equal(res.status, 400, "Tentativa de aprovar anúncio REJEITADO deve retornar 400!");

      const data = await res.json();
      assert.ok(data.error.includes("rejeitados não podem ser aprovados diretamente"));
    } finally {
      await prisma.anuncio.delete({ where: { id: adRejeitado.id } });
      await prisma.anunciante.delete({ where: { id: anunciante.id } });
      await prisma.pontoMidia.delete({ where: { id: ponto.id } });
      await prisma.user.deleteMany({ where: { id: { in: [adminUser.id, pontoUser.id, anuUser.id] } } });
    }
  });

  it("Rejeitar anúncio inexistente deve retornar 404 (e não 500)", async () => {
    const adminUser = await prisma.user.create({
      data: {
        email: `admin_404_${Date.now()}@mediamais.com`,
        senha: "hash",
        nome: "Admin 404",
        whatsapp: "11999996666",
        role: "ADMIN",
        ativo: true,
      },
    });

    const adminToken = await generateToken({
      userId: adminUser.id,
      email: adminUser.email,
      nome: adminUser.nome,
      role: "ADMIN",
    });

    try {
      const req = new NextRequest("http://localhost:3000/api/anuncios/999999/rejeitar", {
        method: "PATCH",
        headers: {
          Cookie: `mm_session=${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ motivo: "Motivo de teste válido" }),
      });

      const res = await rejeitarHandler(req, { params: Promise.resolve({ id: "999999" }) });
      assert.equal(res.status, 404);

      const data = await res.json();
      assert.equal(data.error, "Anúncio não encontrado");
    } finally {
      await prisma.user.delete({ where: { id: adminUser.id } });
    }
  });

  it("promover-fila deve verificar capacidade e barrar se a grade estiver cheia", async () => {
    const adminUser = await prisma.user.create({
      data: {
        email: `admin_prom_${Date.now()}@mediamais.com`,
        senha: "hash",
        nome: "Admin Prom",
        whatsapp: "11999997777",
        role: "ADMIN",
        ativo: true,
      },
    });

    const adminToken = await generateToken({
      userId: adminUser.id,
      email: adminUser.email,
      nome: adminUser.nome,
      role: "ADMIN",
    });

    const pontoUser = await prisma.user.create({
      data: {
        email: `ponto_prom_${Date.now()}@mediamais.com`,
        senha: "hash",
        nome: "Ponto Prom",
        whatsapp: "11999998888",
        role: "PONTO",
        ativo: true,
      },
    });

    const ponto = await prisma.pontoMidia.create({
      data: {
        userId: pontoUser.id,
        nomeEmpresa: "Ponto Fila Cheia",
        responsavel: "Resp",
        whatsapp: "11999998888",
        cep: "01001000",
        rua: "Rua",
        numero: "1",
        bairro: "Bairro",
        cidade: "SP",
        uf: "SP",
        categoria: "Comércio",
        descricao: "Ponto",
        possuiTv: true,
        limiteTempoSegundos: 360,
        maxCotas: 1,
        fluxoDiarioEstimado: "50",
        tempoPermanencia: "10m",
        faixaEtariaPublico: ["Adulto"],
        generoPublico: "Todos",
        status: "ATIVO",
      },
    });

    const anuUser = await prisma.user.create({
      data: {
        email: `anu_prom_${Date.now()}@mediamais.com`,
        senha: "hash",
        nome: "Anu Prom",
        whatsapp: "11999999999",
        role: "ANUNCIANTE",
        ativo: true,
      },
    });

    const anunciante = await prisma.anunciante.create({
      data: {
        userId: anuUser.id,
        nomeEmpresa: "Empresa Prom",
        responsavel: "Resp",
        whatsapp: "11999999999",
        cep: "01001000",
        rua: "Rua",
        numero: "1",
        bairro: "Bairro",
        cidade: "SP",
        uf: "SP",
        categoria: "Comércio",
        oQueAnunciar: "Ads",
        descricaoAnuncio: "Desc",
        preferenciaLocalizacao: "SP",
        generoAlvo: "Todos",
      },
    });

    // Ponto lotado: 360 segundos
    const adLotado = await prisma.anuncio.create({
      data: {
        anuncianteId: anunciante.id,
        pontoMidiaId: ponto.id,
        titulo: "Ocupando 360s",
        descricao: "Desc",
        tipoMidia: "VIDEO",
        midiaUrl: "/uploads/videos/sample.mp4",
        duracaoSegundos: 360,
        status: "ATIVO",
      },
    });

    // Anúncio aguardando na fila
    const adNaFila = await prisma.anuncio.create({
      data: {
        anuncianteId: anunciante.id,
        pontoMidiaId: ponto.id,
        titulo: "Tentando ser promovido sem espaço",
        descricao: "Desc",
        tipoMidia: "IMAGEM",
        midiaUrl: "/uploads/images/sample.jpg",
        duracaoSegundos: 15,
        status: "FILA_ESPERA",
      },
    });

    try {
      const req = new NextRequest(`http://localhost:3000/api/anuncios/${adNaFila.id}/promover-fila`, {
        method: "POST",
        headers: {
          Cookie: `mm_session=${adminToken}`,
          "Content-Type": "application/json",
        },
      });

      const res = await promoverFilaHandler(req, { params: Promise.resolve({ id: String(adNaFila.id) }) });
      assert.equal(res.status, 409, "Promoção de fila com grade lotada deve retornar 409!");

      const data = await res.json();
      assert.equal(data.code, "CAPACIDADE_EXCEDIDA");
    } finally {
      await prisma.anuncio.deleteMany({ where: { id: { in: [adLotado.id, adNaFila.id] } } });
      await prisma.anunciante.delete({ where: { id: anunciante.id } });
      await prisma.pontoMidia.delete({ where: { id: ponto.id } });
      await prisma.user.deleteMany({ where: { id: { in: [adminUser.id, pontoUser.id, anuUser.id] } } });
    }
  });
});
