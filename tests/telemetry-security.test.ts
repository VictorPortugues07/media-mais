import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as telemetriaHandler } from "../src/app/api/tv/telemetria/route";
import { POST as publicTelemetryHandler } from "../src/app/api/public/player/telemetry/route";
import { signTVToken } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

describe("Módulo 4: Telemetria e Comprovação de Veiculação Anti-Fraude", () => {
  it("Deve rejeitar requisição de telemetria sem token de TV pareada com 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/tv/telemetria", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pontoId: 1,
        heartbeatOnly: true,
      }),
    });

    const res = await telemetriaHandler(req);
    assert.equal(res.status, 401);

    const data = await res.json();
    assert.ok(data.error.includes("Token de TV pareada é obrigatório"));
  });

  it("Deve rejeitar telemetria se o token pertencer a outro ponto de TV (403)", async () => {
    // Token emitido para o Ponto 1
    const tokenPonto1 = await signTVToken(1);

    // Tentativa de enviar telemetria em nome do Ponto 2 com o token do Ponto 1
    const req = new NextRequest("http://localhost:3000/api/tv/telemetria", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tv-token": tokenPonto1,
      },
      body: JSON.stringify({
        pontoId: 2,
        token: tokenPonto1,
        heartbeatOnly: true,
      }),
    });

    const res = await telemetriaHandler(req);
    assert.equal(res.status, 403);

    const data = await res.json();
    assert.ok(data.error.includes("não corresponde ao ponto"));
  });

  it("Deve rejeitar duração de veiculação inválida (menor que 5s ou maior que 60s)", async () => {
    const tokenPonto1 = await signTVToken(1);

    // 1. Duração absurda de 277 horas (999.999s)
    const reqHuge = new NextRequest("http://localhost:3000/api/tv/telemetria", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tv-token": tokenPonto1,
      },
      body: JSON.stringify({
        pontoId: 1,
        token: tokenPonto1,
        anuncioId: 1,
        duracaoSegundos: 999999,
        tipoMidia: "VIDEO",
      }),
    });

    const resHuge = await telemetriaHandler(reqHuge);
    assert.equal(resHuge.status, 400);

    // 2. Duração negativa
    const reqNegative = new NextRequest("http://localhost:3000/api/tv/telemetria", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tv-token": tokenPonto1,
      },
      body: JSON.stringify({
        pontoId: 1,
        token: tokenPonto1,
        anuncioId: 1,
        duracaoSegundos: -10,
        tipoMidia: "VIDEO",
      }),
    });

    const resNegative = await telemetriaHandler(reqNegative);
    assert.equal(resNegative.status, 400);
  });

  it("Deve rejeitar veiculação se o anúncio pertencer a outro ponto de TV (403)", async () => {
    // 1. Setup: Criar 2 pontos e 1 anúncio cadastrado no Ponto 1
    const userPonto1 = await prisma.user.create({
      data: {
        email: `telem_p1_${Date.now()}@mediamais.com`,
        senha: "hash",
        nome: "Ponto 1",
        whatsapp: "11999990001",
        role: "PONTO",
        ativo: true,
      },
    });

    const ponto1 = await prisma.pontoMidia.create({
      data: {
        userId: userPonto1.id,
        nomeEmpresa: "Ponto 1 Telem",
        responsavel: "Resp 1",
        whatsapp: "11999990001",
        cep: "01001000",
        rua: "Rua 1",
        numero: "1",
        bairro: "Bairro",
        cidade: "SP",
        uf: "SP",
        categoria: "Comércio",
        descricao: "Ponto 1",
        possuiTv: true,
        fluxoDiarioEstimado: "50",
        tempoPermanencia: "15m",
        faixaEtariaPublico: ["Adulto"],
        generoPublico: "Todos",
        status: "ATIVO",
      },
    });

    const userPonto2 = await prisma.user.create({
      data: {
        email: `telem_p2_${Date.now()}@mediamais.com`,
        senha: "hash",
        nome: "Ponto 2",
        whatsapp: "11999990002",
        role: "PONTO",
        ativo: true,
      },
    });

    const ponto2 = await prisma.pontoMidia.create({
      data: {
        userId: userPonto2.id,
        nomeEmpresa: "Ponto 2 Telem",
        responsavel: "Resp 2",
        whatsapp: "11999990002",
        cep: "01001000",
        rua: "Rua 2",
        numero: "2",
        bairro: "Bairro",
        cidade: "SP",
        uf: "SP",
        categoria: "Comércio",
        descricao: "Ponto 2",
        possuiTv: true,
        fluxoDiarioEstimado: "50",
        tempoPermanencia: "15m",
        faixaEtariaPublico: ["Adulto"],
        generoPublico: "Todos",
        status: "ATIVO",
      },
    });

    const userAnu = await prisma.user.create({
      data: {
        email: `telem_anu_${Date.now()}@mediamais.com`,
        senha: "hash",
        nome: "Anunciante Telem",
        whatsapp: "11999990003",
        role: "ANUNCIANTE",
        ativo: true,
      },
    });

    const anunciante = await prisma.anunciante.create({
      data: {
        userId: userAnu.id,
        nomeEmpresa: "Empresa Telem",
        responsavel: "Resp",
        whatsapp: "11999990003",
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

    // Anúncio vinculado ao PONTO 1
    const adPonto1 = await prisma.anuncio.create({
      data: {
        anuncianteId: anunciante.id,
        pontoMidiaId: ponto1.id,
        titulo: "Campanha do Ponto 1",
        descricao: "Desc",
        tipoMidia: "IMAGEM",
        midiaUrl: "/uploads/images/sample.jpg",
        duracaoSegundos: 10,
        status: "ATIVO",
      },
    });

    const tokenPonto2 = await signTVToken(ponto2.id);

    try {
      // Tentativa de fraude: Ponto 2 tenta registrar veiculação do anúncio do Ponto 1
      const req = new NextRequest("http://localhost:3000/api/tv/telemetria", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tv-token": tokenPonto2,
        },
        body: JSON.stringify({
          pontoId: ponto2.id,
          token: tokenPonto2,
          anuncioId: adPonto1.id,
          duracaoSegundos: 10,
          tipoMidia: "IMAGEM",
          deviceType: "SMART_TV",
        }),
      });

      const res = await telemetriaHandler(req);
      assert.equal(res.status, 403, "Telemetria de anúncio de outro ponto deve retornar 403!");

      const data = await res.json();
      assert.ok(data.error.includes("não pertence a este ponto"));
    } finally {
      await prisma.anuncio.delete({ where: { id: adPonto1.id } });
      await prisma.anunciante.delete({ where: { id: anunciante.id } });
      await prisma.pontoMidia.deleteMany({ where: { id: { in: [ponto1.id, ponto2.id] } } });
      await prisma.user.deleteMany({ where: { id: { in: [userPonto1.id, userPonto2.id, userAnu.id] } } });
    }
  });

  it("Deve registrar Proof of Play com sucesso quando todos os dados e token forem válidos", async () => {
    const userPonto = await prisma.user.create({
      data: {
        email: `telem_ok_${Date.now()}@mediamais.com`,
        senha: "hash",
        nome: "Ponto OK",
        whatsapp: "11999990010",
        role: "PONTO",
        ativo: true,
      },
    });

    const ponto = await prisma.pontoMidia.create({
      data: {
        userId: userPonto.id,
        nomeEmpresa: "Ponto OK Telem",
        responsavel: "Resp",
        whatsapp: "11999990010",
        cep: "01001000",
        rua: "Rua",
        numero: "1",
        bairro: "Bairro",
        cidade: "SP",
        uf: "SP",
        categoria: "Comércio",
        descricao: "Ponto OK",
        possuiTv: true,
        fluxoDiarioEstimado: "50",
        tempoPermanencia: "15m",
        faixaEtariaPublico: ["Adulto"],
        generoPublico: "Todos",
        status: "ATIVO",
      },
    });

    const userAnu = await prisma.user.create({
      data: {
        email: `telem_anu_ok_${Date.now()}@mediamais.com`,
        senha: "hash",
        nome: "Anu OK",
        whatsapp: "11999990011",
        role: "ANUNCIANTE",
        ativo: true,
      },
    });

    const anunciante = await prisma.anunciante.create({
      data: {
        userId: userAnu.id,
        nomeEmpresa: "Empresa OK",
        responsavel: "Resp",
        whatsapp: "11999990011",
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

    const anuncio = await prisma.anuncio.create({
      data: {
        anuncianteId: anunciante.id,
        pontoMidiaId: ponto.id,
        titulo: "Campanha Comprovada Legítima",
        descricao: "Desc",
        tipoMidia: "VIDEO",
        midiaUrl: "/uploads/videos/sample.mp4",
        duracaoSegundos: 15,
        status: "ATIVO",
      },
    });

    const token = await signTVToken(ponto.id);

    try {
      const req = new NextRequest("http://localhost:3000/api/tv/telemetria", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tv-token": token,
        },
        body: JSON.stringify({
          pontoId: ponto.id,
          token,
          anuncioId: anuncio.id,
          duracaoSegundos: 15,
          tipoMidia: "VIDEO",
          deviceType: "SMART_TV",
          screenResolution: "1920x1080",
        }),
      });

      const res = await telemetriaHandler(req);
      assert.equal(res.status, 200);

      // Verificar persistência no banco
      const registros = await prisma.registroExibicao.findMany({
        where: { anuncioId: anuncio.id, pontoMidiaId: ponto.id },
      });

      assert.equal(registros.length, 1);
      assert.equal(registros[0]?.duracaoSegundos, 15);
      assert.equal(registros[0]?.tipoMidia, "VIDEO");

      // Limpar registro para poder excluir o anúncio (onDelete: Restrict)
      await prisma.registroExibicao.deleteMany({ where: { anuncioId: anuncio.id } });
    } finally {
      await prisma.anuncio.delete({ where: { id: anuncio.id } });
      await prisma.anunciante.delete({ where: { id: anunciante.id } });
      await prisma.pontoMidia.delete({ where: { id: ponto.id } });
      await prisma.user.deleteMany({ where: { id: { in: [userPonto.id, userAnu.id] } } });
    }
  });

  it("Ao enviar offline: true, deve preservar a data de última atividade para histórico", async () => {
    const userPonto = await prisma.user.create({
      data: {
        email: `telem_off_${Date.now()}@mediamais.com`,
        senha: "hash",
        nome: "Ponto Off",
        whatsapp: "11999990020",
        role: "PONTO",
        ativo: true,
      },
    });

    const ponto = await prisma.pontoMidia.create({
      data: {
        userId: userPonto.id,
        nomeEmpresa: "Ponto Off Telem",
        responsavel: "Resp",
        whatsapp: "11999990020",
        cep: "01001000",
        rua: "Rua",
        numero: "1",
        bairro: "Bairro",
        cidade: "SP",
        uf: "SP",
        categoria: "Comércio",
        descricao: "Ponto Off",
        possuiTv: true,
        fluxoDiarioEstimado: "50",
        tempoPermanencia: "15m",
        faixaEtariaPublico: ["Adulto"],
        generoPublico: "Todos",
        status: "ATIVO",
        ultimaAtividade: new Date(),
      },
    });

    const token = await signTVToken(ponto.id);

    try {
      const req = new NextRequest("http://localhost:3000/api/tv/telemetria", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tv-token": token,
        },
        body: JSON.stringify({
          pontoId: ponto.id,
          token,
          offline: true,
        }),
      });

      const res = await telemetriaHandler(req);
      assert.equal(res.status, 200);

      const pontoAtualizado = await prisma.pontoMidia.findUnique({
        where: { id: ponto.id },
        select: { ultimaAtividade: true },
      });

      assert.ok(
        pontoAtualizado?.ultimaAtividade !== null,
        "A última atividade NÃO DEVE ser nula ao desconectar para manter o histórico de disponibilidade!"
      );
    } finally {
      await prisma.pontoMidia.delete({ where: { id: ponto.id } });
      await prisma.user.delete({ where: { id: userPonto.id } });
    }
  });
});
