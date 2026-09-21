import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as registerPontoHandler } from "../src/app/api/pontos/route";
import { PATCH as patchPontoHandler } from "../src/app/api/pontos/[id]/route";
import { POST as createAnuncioHandler } from "../src/app/api/anuncios/route";
import { PATCH as aprovarAnuncioHandler } from "../src/app/api/anuncios/[id]/aprovar/route";
import { GET as parearTVHandler } from "../src/app/api/tv/parear/route";
import { POST as telemetriaHandler } from "../src/app/api/tv/telemetria/route";
import { GET as statsHandler } from "../src/app/api/stats/route";
import { generateToken } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

describe("Módulo 6: Fluxo Completo de Ponta a Ponta (End-to-End Business Flow)", () => {
  it("Deve executar com sucesso o ciclo de vida completo: Cadastro -> Moderação -> Pareamento -> Telemetria -> Auditoria", async () => {
    const timestamp = Date.now();

    // 1. Criar Usuário Administrador
    const adminUser = await prisma.user.create({
      data: {
        email: `e2e_admin_${timestamp}@mediamais.com`,
        senha: "hash_admin_e2e",
        nome: "Admin E2E",
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

    // 2. Criar Usuário Dono de Ponto
    const pontoUser = await prisma.user.create({
      data: {
        email: `e2e_ponto_${timestamp}@mediamais.com`,
        senha: "hash_ponto_e2e",
        nome: "Dono Ponto E2E",
        whatsapp: "11999991111",
        role: "PONTO",
        ativo: true,
      },
    });

    const pontoToken = await generateToken({
      userId: pontoUser.id,
      email: pontoUser.email,
      nome: pontoUser.nome,
      role: "PONTO",
    });

    // 3. Cadastrar Ponto de TV via POST /api/pontos
    const reqCreatePonto = new NextRequest("http://localhost:3000/api/pontos", {
      method: "POST",
      headers: {
        Cookie: `mm_session=${pontoToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nomeEmpresa: "Padaria Modelo E2E",
        responsavel: "Manoel Silva",
        whatsapp: "11999991111",
        cep: "01001000",
        rua: "Praça da Sé",
        numero: "100",
        bairro: "Sé",
        cidade: "São Paulo",
        uf: "SP",
        categoria: "Padaria / Confeitaria",
        descricao: "Padaria tradicional com grande fluxo de clientes.",
        possuiTv: true,
        fluxoDiarioEstimado: "500 pessoas",
        tempoPermanencia: "20 minutos",
        faixaEtariaPublico: ["Adultos", "Idosos"],
        generoPublico: "Misto",
      }),
    });

    const resCreatePonto = await registerPontoHandler(reqCreatePonto);
    assert.equal(resCreatePonto.status, 201);
    const dataPonto = await resCreatePonto.json();
    assert.ok(dataPonto.ponto.id > 0);
    assert.equal(dataPonto.ponto.status, "PENDENTE", "Ponto novo deve iniciar como PENDENTE para moderação");
    const pontoId = dataPonto.ponto.id;
    const codigoTv = dataPonto.ponto.codigoTv;

    // 4. Moderação do Administrador: Aprovar Ponto para ATIVO via PATCH /api/pontos/[id]
    const reqAprovarPonto = new NextRequest(`http://localhost:3000/api/pontos/${pontoId}`, {
      method: "PATCH",
      headers: {
        Cookie: `mm_session=${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "ATIVO" }),
    });

    const resAprovarPonto = await patchPontoHandler(reqAprovarPonto, {
      params: Promise.resolve({ id: String(pontoId) }),
    });
    assert.equal(resAprovarPonto.status, 200);

    // 5. Criar Anunciante e Submeter Campanha de 20 segundos
    const anuUser = await prisma.user.create({
      data: {
        email: `e2e_anu_${timestamp}@mediamais.com`,
        senha: "hash_anu_e2e",
        nome: "Anunciante Café E2E",
        whatsapp: "11999992222",
        role: "ANUNCIANTE",
        ativo: true,
      },
    });

    const anuToken = await generateToken({
      userId: anuUser.id,
      email: anuUser.email,
      nome: anuUser.nome,
      role: "ANUNCIANTE",
    });

    const anunciante = await prisma.anunciante.create({
      data: {
        userId: anuUser.id,
        nomeEmpresa: "Café Gourmet Paulista",
        responsavel: "Renata Costa",
        whatsapp: "11999992222",
        cep: "01001000",
        rua: "Rua Direita",
        numero: "50",
        bairro: "Sé",
        cidade: "São Paulo",
        uf: "SP",
        categoria: "Alimentação",
        oQueAnunciar: "Cafés especiais",
        descricaoAnuncio: "Apresente esta tela e ganhe 10% de desconto.",
        preferenciaLocalizacao: "São Paulo",
        generoAlvo: "Todos",
      },
    });

    const reqCreateAd = new NextRequest("http://localhost:3000/api/anuncios", {
      method: "POST",
      headers: {
        Cookie: `mm_session=${anuToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pontoMidiaId: pontoId,
        titulo: "Promoção Café da Manhã E2E",
        descricao: "Desconto especial em combos matinais",
        tipoMidia: "VIDEO",
        midiaUrl: "/uploads/videos/cafe.mp4",
        duracaoSegundos: 20,
      }),
    });

    const resCreateAd = await createAnuncioHandler(reqCreateAd);
    assert.equal(resCreateAd.status, 201);
    const dataAd = await resCreateAd.json();
    assert.equal(dataAd.anuncio.status, "PENDENTE");
    const anuncioId = dataAd.anuncio.id;

    // 6. Moderação do Administrador: Aprovar Campanha na TV
    const reqAprovarAd = new NextRequest(`http://localhost:3000/api/anuncios/${anuncioId}/aprovar`, {
      method: "PATCH",
      headers: {
        Cookie: `mm_session=${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "APROVAR", diasValidade: 30 }),
    });

    const resAprovarAd = await aprovarAnuncioHandler(reqAprovarAd, {
      params: Promise.resolve({ id: String(anuncioId) }),
    });
    assert.equal(resAprovarAd.status, 200);

    // 7. Pareamento da Smart TV com o código de 6 dígitos gerado
    const reqParear = new NextRequest(`http://localhost:3000/api/tv/parear?codigo=${codigoTv}`, {
      method: "GET",
    });

    const resParear = await parearTVHandler(reqParear);
    assert.equal(resParear.status, 200);
    const dataPairing = await resParear.json();
    assert.ok(dataPairing.token, "A TV deve receber um token JWT assinado para transmissões");
    assert.equal(dataPairing.anuncios.length, 1);
    assert.equal(dataPairing.anuncios[0].id, anuncioId);
    const tvToken = dataPairing.token;

    // 8. Envio de Telemetria / Proof of Play da TV
    const reqTelemetry = new NextRequest("http://localhost:3000/api/tv/telemetria", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tv-token": tvToken,
      },
      body: JSON.stringify({
        pontoId,
        token: tvToken,
        anuncioId,
        duracaoSegundos: 20,
        tipoMidia: "VIDEO",
        deviceType: "SMART_TV",
        screenResolution: "1920x1080",
      }),
    });

    const resTelemetry = await telemetriaHandler(reqTelemetry);
    assert.equal(resTelemetry.status, 200);

    // 9. Consulta de Auditoria e Estatísticas (/api/stats)
    const reqStats = new NextRequest("http://localhost:3000/api/stats", {
      method: "GET",
      headers: {
        Cookie: `mm_session=${adminToken}`,
      },
    });

    const resStats = await statsHandler(reqStats);
    assert.equal(resStats.status, 200);
    const dataStats = await resStats.json();

    assert.ok(dataStats.totalExibicoes > 0, "O total de exibições deve contabilizar o Proof of Play");

    // 10. Limpeza completa dos dados de teste
    await prisma.registroExibicao.deleteMany({ where: { pontoMidiaId: pontoId } });
    await prisma.anuncio.deleteMany({ where: { pontoMidiaId: pontoId } });
    await prisma.anunciante.delete({ where: { id: anunciante.id } });
    await prisma.pontoMidia.delete({ where: { id: pontoId } });
    await prisma.notificacao.deleteMany({
      where: { userId: { in: [adminUser.id, pontoUser.id, anuUser.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [adminUser.id, pontoUser.id, anuUser.id] } },
    });
  });
});
