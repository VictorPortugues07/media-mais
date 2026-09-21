import { prisma } from "../lib/prisma";
import { hash } from "bcryptjs";
import { calcularScorePonderado, determinarTier } from "../lib/precificacao";

async function main() {
  console.log("=========================================");
  console.log("  Iniciando Seed da Plataforma Media+   ");
  console.log("=========================================\n");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@mediamais.com";
  const adminRawPassword = process.env.ADMIN_PASSWORD || "mediamais2026";
  const defaultPontoPassword = await hash("ponto123", 12);
  const defaultAnunciantePassword = await hash("anunciante123", 12);

  // ─────────────────────────────────────────────────────────────
  // 1. ADMINISTRADOR
  // ─────────────────────────────────────────────────────────────
  const adminPassword = await hash(adminRawPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      nome: "Administrador Media+",
      ativo: true,
      senha: adminPassword,
    },
    create: {
      email: adminEmail,
      senha: adminPassword,
      nome: "Administrador Media+",
      whatsapp: "(48) 98879-6514",
      role: "ADMIN",
      ativo: true,
    },
  });
  console.log(`[ADMIN] ${admin.email} (Senha: ${adminRawPassword})`);

  // ─────────────────────────────────────────────────────────────
  // 2. DONOS DE PONTO DE MÍDIA (ESTABELECIMENTOS COM SMART TV)
  // ─────────────────────────────────────────────────────────────
  const pontosConfig = [
    {
      email: "academia@exemplo.com",
      nomeUsuario: "Carlos Silva",
      whatsapp: "(48) 99123-4567",
      nomeEmpresa: "Academia Iron Fitness",
      categoria: "Academia / Crossfit",
      cidade: "Florianopolis",
      uf: "SC",
      bairro: "Centro",
      rua: "Av. Mauro Ramos",
      numero: "1200",
      cep: "88015200",
      codigoTv: "100001",
      status: "ATIVO" as const,
      ativo: true,
      descricao: "Academia completa com alto fluxo de jovens e adultos em busca de saúde e nutrição.",
      fluxoDiarioEstimado: "300-500 pessoas",
      tempoPermanencia: "1-2 horas",
      faixaEtariaPublico: ["18-25 anos", "26-35 anos", "36-45 anos"],
      generoPublico: "Misto (equilibrado)",
      fotos: ["/uploads/images/1cc71ba3-9dd5-4d9d-8fd8-57442db3f23f.jpg"],
      lat: -27.5954,
      lng: -48.548,
      notaFluxo: 4.5,
      notaTempo: 4.5,
      notaPerfil: 4.5,
      notaExclusividade: 4.5,
      tipoDispositivo: "SMART_TV",
      resolucaoTela: "1920x1080",
    },
    {
      email: "restaurante@exemplo.com",
      nomeUsuario: "Marcos Oliveira",
      whatsapp: "(48) 99234-5678",
      nomeEmpresa: "Restaurante Villa Gourmet",
      categoria: "Restaurante / Bar",
      cidade: "Florianopolis",
      uf: "SC",
      bairro: "Beira-Mar",
      rua: "Av. Beira Mar Norte",
      numero: "2500",
      cep: "88015400",
      codigoTv: "100002",
      status: "ATIVO" as const,
      ativo: true,
      descricao: "Restaurante executivo com almoço movimentado e happy hour com público qualificado.",
      fluxoDiarioEstimado: "150-300 pessoas",
      tempoPermanencia: "45-60 min",
      faixaEtariaPublico: ["26-35 anos", "36-45 anos", "46+ anos"],
      generoPublico: "Misto (equilibrado)",
      fotos: ["/uploads/images/3d2f7a19-f44f-4990-b5f4-be653f0b5468.jpg"],
      lat: -27.585,
      lng: -48.552,
      notaFluxo: 4.0,
      notaTempo: 3.5,
      notaPerfil: 4.0,
      notaExclusividade: 3.5,
      tipoDispositivo: "SMART_TV",
      resolucaoTela: "1920x1080",
    },
    {
      email: "clinica@exemplo.com",
      nomeUsuario: "Dra. Renata Vasconcelos",
      whatsapp: "(48) 99345-6789",
      nomeEmpresa: "Clínica OdontoCenter Premium",
      categoria: "Clinica Medica / Odonto",
      cidade: "São José",
      uf: "SC",
      bairro: "Campinas",
      rua: "Av. Presidente Kennedy",
      numero: "450",
      cep: "88101000",
      codigoTv: "100003",
      status: "ATIVO" as const,
      ativo: true,
      descricao: "Clínica de estética e odontologia com sala de espera com alto poder aquisitivo.",
      fluxoDiarioEstimado: "50-150 pessoas",
      tempoPermanencia: "30-45 min",
      faixaEtariaPublico: ["26-35 anos", "36-45 anos", "46+ anos"],
      generoPublico: "Maioria feminino",
      fotos: ["/uploads/images/8077e6ea-a004-4805-a1d1-1ce9b255ed72.jpg"],
      lat: -27.592,
      lng: -48.618,
      notaFluxo: 4.5,
      notaTempo: 5.0,
      notaPerfil: 5.0,
      notaExclusividade: 4.0,
      tipoDispositivo: "SMART_TV",
      resolucaoTela: "1920x1080",
    },
    {
      email: "barbearia@exemplo.com",
      nomeUsuario: "Rodrigo Almeida",
      whatsapp: "(48) 99456-7890",
      nomeEmpresa: "Barbearia Don Corleone",
      categoria: "Salao / Barbearia",
      cidade: "Palhoça",
      uf: "SC",
      bairro: "Pagani",
      rua: "Av. Atílio Pedro Pagani",
      numero: "800",
      cep: "88132149",
      codigoTv: "100004",
      status: "ATIVO" as const,
      ativo: true,
      descricao: "Barbearia conceito com jogos, sinuca e público masculino constante durante todo o dia.",
      fluxoDiarioEstimado: "50-150 pessoas",
      tempoPermanencia: "30-45 min",
      faixaEtariaPublico: ["18-25 anos", "26-35 anos", "36-45 anos"],
      generoPublico: "Maioria masculino",
      fotos: ["/uploads/images/b86f67d1-2f7d-4903-89d3-88e5c42139f8.jpg"],
      lat: -27.644,
      lng: -48.669,
      notaFluxo: 3.0,
      notaTempo: 3.0,
      notaPerfil: 3.0,
      notaExclusividade: 3.0,
      tipoDispositivo: "DESKTOP",
      resolucaoTela: "1920x1080",
    },
    {
      email: "cafe@exemplo.com",
      nomeUsuario: "Fernanda Costa",
      whatsapp: "(48) 99567-8901",
      nomeEmpresa: "Café & Bistrô Aroma",
      categoria: "Cafeteria / Padaria",
      cidade: "Florianopolis",
      uf: "SC",
      bairro: "Lagoa da Conceição",
      rua: "Rua Afonso Delambert Neto",
      numero: "310",
      cep: "88062000",
      codigoTv: "100005",
      status: "PENDENTE" as const, // Para testar aprovação pelo Admin
      ativo: true,
      descricao: "Café aconchegante com espaço coworking e turistas ao longo de todo o ano.",
      fluxoDiarioEstimado: "150-300 pessoas",
      tempoPermanencia: "45-60 min",
      faixaEtariaPublico: ["18-25 anos", "26-35 anos", "36-45 anos"],
      generoPublico: "Misto (equilibrado)",
      fotos: ["/uploads/images/ba8a4a0f-be91-4eb1-9090-acee6b130c6d.jpg"],
      lat: -27.604,
      lng: -48.468,
      notaFluxo: 3.2,
      notaTempo: 3.5,
      notaPerfil: 3.5,
      notaExclusividade: 3.0,
      tipoDispositivo: "SMART_TV",
      resolucaoTela: "1920x1080",
    },
    {
      email: "inativo@exemplo.com",
      nomeUsuario: "Luiz Fernando",
      whatsapp: "(48) 99678-9012",
      nomeEmpresa: "Empório Sul Conveniência",
      categoria: "Outros",
      cidade: "Florianopolis",
      uf: "SC",
      bairro: "Estreito",
      rua: "Rua Fúlvio Aducci",
      numero: "600",
      cep: "88075000",
      codigoTv: "100006",
      status: "INATIVO" as const, // Ponto e usuário desativados para testar bloqueios
      ativo: false,
      descricao: "Ponto comercial desativado temporariamente para manutenção.",
      fluxoDiarioEstimado: "Até 50 pessoas",
      tempoPermanencia: "15-30 min",
      faixaEtariaPublico: ["26-35 anos"],
      generoPublico: "Misto (equilibrado)",
      fotos: [],
      lat: -27.587,
      lng: -48.579,
      notaFluxo: 2.5,
      notaTempo: 2.5,
      notaPerfil: 2.5,
      notaExclusividade: 2.5,
      tipoDispositivo: null,
      resolucaoTela: null,
    },
  ];

  const pontosSalvos: Record<string, any> = {};

  for (const p of pontosConfig) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {
        nome: `${p.nomeUsuario} (${p.nomeEmpresa})`,
        whatsapp: p.whatsapp,
        ativo: p.ativo,
        senha: defaultPontoPassword,
      },
      create: {
        email: p.email,
        senha: defaultPontoPassword,
        nome: `${p.nomeUsuario} (${p.nomeEmpresa})`,
        whatsapp: p.whatsapp,
        role: "PONTO",
        ativo: p.ativo,
      },
    });

    const score = calcularScorePonderado(p.notaFluxo, p.notaTempo, p.notaPerfil, p.notaExclusividade);
    const tierInfo = determinarTier(score);

    const ponto = await prisma.pontoMidia.upsert({
      where: { userId: user.id },
      update: {
        nomeEmpresa: p.nomeEmpresa,
        responsavel: p.nomeUsuario,
        whatsapp: p.whatsapp,
        cidade: p.cidade,
        uf: p.uf,
        bairro: p.bairro,
        rua: p.rua,
        numero: p.numero,
        cep: p.cep,
        codigoTv: p.codigoTv,
        status: p.status,
        descricao: p.descricao,
        fluxoDiarioEstimado: p.fluxoDiarioEstimado,
        tempoPermanencia: p.tempoPermanencia,
        faixaEtariaPublico: p.faixaEtariaPublico,
        generoPublico: p.generoPublico,
        fotos: p.fotos,
        lat: p.lat,
        lng: p.lng,
        notaFluxo: p.notaFluxo,
        notaTempo: p.notaTempo,
        notaPerfil: p.notaPerfil,
        notaExclusividade: p.notaExclusividade,
        scorePonderado: score,
        tier: tierInfo.tier,
        cotaMensal: tierInfo.cotaMensal,
        tipoDispositivo: p.tipoDispositivo,
        resolucaoTela: p.resolucaoTela,
        ultimaAtividade: p.status === "ATIVO" ? new Date() : null,
      },
      create: {
        userId: user.id,
        nomeEmpresa: p.nomeEmpresa,
        responsavel: p.nomeUsuario,
        whatsapp: p.whatsapp,
        cidade: p.cidade,
        uf: p.uf,
        bairro: p.bairro,
        rua: p.rua,
        numero: p.numero,
        cep: p.cep,
        categoria: p.categoria,
        codigoTv: p.codigoTv,
        status: p.status,
        descricao: p.descricao,
        possuiTv: true,
        quantidadeTvs: 2,
        localInstalacao: "Salão Principal / Recepção",
        fluxoDiarioEstimado: p.fluxoDiarioEstimado,
        tempoPermanencia: p.tempoPermanencia,
        faixaEtariaPublico: p.faixaEtariaPublico,
        generoPublico: p.generoPublico,
        fotos: p.fotos,
        lat: p.lat,
        lng: p.lng,
        notaFluxo: p.notaFluxo,
        notaTempo: p.notaTempo,
        notaPerfil: p.notaPerfil,
        notaExclusividade: p.notaExclusividade,
        scorePonderado: score,
        tier: tierInfo.tier,
        cotaMensal: tierInfo.cotaMensal,
        tipoDispositivo: p.tipoDispositivo,
        resolucaoTela: p.resolucaoTela,
        ultimaAtividade: p.status === "ATIVO" ? new Date() : null,
      },
    });

    pontosSalvos[p.codigoTv] = ponto;
    console.log(
      `[PONTO] ${ponto.nomeEmpresa} | TV: ${p.codigoTv} | ${tierInfo.tier} (R$ ${tierInfo.cotaMensal}/mês) | Login: ${p.email} (ponto123)`
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. ANUNCIANTES (MARCAS E EMPRESAS)
  // ─────────────────────────────────────────────────────────────
  const anunciantesConfig = [
    {
      email: "suplementos@exemplo.com",
      nomeUsuario: "Juliana Santos",
      whatsapp: "(48) 99876-5432",
      nomeEmpresa: "MegaNutri Suplementos",
      categoria: "Saude e Bem-estar",
      cidade: "Florianopolis",
      uf: "SC",
      bairro: "Centro",
      rua: "Rua Bocaiúva",
      numero: "500",
      cep: "88015100",
      oQueAnunciar: "Desconto de 20% em Whey Protein e Creatina",
      descricaoAnuncio: "Promoção exclusiva para alunos e frequentadores dos estabelecimentos parceiros.",
    },
    {
      email: "concessionaria@exemplo.com",
      nomeUsuario: "Bruno Ferreira",
      whatsapp: "(48) 99789-0123",
      nomeEmpresa: "AutoPrime Veículos Premium",
      categoria: "Automotivo",
      cidade: "Florianopolis",
      uf: "SC",
      bairro: "Capoeiras",
      rua: "Av. Governador Ivo Silveira",
      numero: "1400",
      cep: "88085000",
      oQueAnunciar: "Novo SUV com taxa zero e primeira parcela para 2027",
      descricaoAnuncio: "Condições imperdíveis para compra de veículos seminovos e zero km.",
    },
    {
      email: "farmacia@exemplo.com",
      nomeUsuario: "Patrícia Lima",
      whatsapp: "(48) 99654-3210",
      nomeEmpresa: "Drogaria Bem Estar",
      categoria: "Farmacia / Saude",
      cidade: "São José",
      uf: "SC",
      bairro: "Kobrasol",
      rua: "Rua Koesa",
      numero: "280",
      cep: "88102310",
      oQueAnunciar: "Entrega grátis e descontos em dermocosméticos",
      descricaoAnuncio: "Farmácia de manipulação e drogaria com delivery rápido.",
    },
    {
      email: "novamarca@exemplo.com",
      nomeUsuario: "Thiago Mendes",
      whatsapp: "(48) 99543-2109",
      nomeEmpresa: "Studio Vida Ativa",
      categoria: "Moda e Acessorios",
      cidade: "Florianopolis",
      uf: "SC",
      bairro: "Trindade",
      rua: "Rua Lauro Linhares",
      numero: "700",
      cep: "88036002",
      oQueAnunciar: "Nova coleção fitness com tecnologia dry-fit",
      descricaoAnuncio: "Roupas e acessórios esportivos de alta performance.",
    },
  ];

  const anunciantesSalvos: Record<string, any> = {};

  for (const a of anunciantesConfig) {
    const user = await prisma.user.upsert({
      where: { email: a.email },
      update: {
        nome: `${a.nomeUsuario} (${a.nomeEmpresa})`,
        whatsapp: a.whatsapp,
        ativo: true,
        senha: defaultAnunciantePassword,
      },
      create: {
        email: a.email,
        senha: defaultAnunciantePassword,
        nome: `${a.nomeUsuario} (${a.nomeEmpresa})`,
        whatsapp: a.whatsapp,
        role: "ANUNCIANTE",
        ativo: true,
      },
    });

    const anunciante = await prisma.anunciante.upsert({
      where: { userId: user.id },
      update: {
        nomeEmpresa: a.nomeEmpresa,
        responsavel: a.nomeUsuario,
        whatsapp: a.whatsapp,
        cidade: a.cidade,
        uf: a.uf,
        bairro: a.bairro,
        rua: a.rua,
        numero: a.numero,
        cep: a.cep,
        categoria: a.categoria,
        oQueAnunciar: a.oQueAnunciar,
        descricaoAnuncio: a.descricaoAnuncio,
      },
      create: {
        userId: user.id,
        nomeEmpresa: a.nomeEmpresa,
        responsavel: a.nomeUsuario,
        whatsapp: a.whatsapp,
        cidade: a.cidade,
        uf: a.uf,
        bairro: a.bairro,
        rua: a.rua,
        numero: a.numero,
        cep: a.cep,
        categoria: a.categoria,
        oQueAnunciar: a.oQueAnunciar,
        descricaoAnuncio: a.descricaoAnuncio,
        preferenciaLocalizacao: "Mesma cidade",
        categoriasEspecificas: ["Academia / Crossfit", "Restaurante / Bar", "Clinica Medica / Odonto"],
        faixaEtariaAlvo: ["18-25 anos", "26-35 anos", "36-45 anos"],
        generoAlvo: "Misto (equilibrado)",
      },
    });

    anunciantesSalvos[a.email] = anunciante;
    console.log(`[ANUNCIANTE] ${anunciante.nomeEmpresa} | Login: ${a.email} (anunciante123)`);
  }

  // ─────────────────────────────────────────────────────────────
  // 4. ANÚNCIOS / CAMPANHAS (VÍDEOS E IMAGENS)
  // ─────────────────────────────────────────────────────────────
  const agora = new Date();
  const trintaDias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const anunciosConfig = [
    // 1. MegaNutri na Academia Iron Fitness (Vídeo ATIVO)
    {
      anuncianteId: anunciantesSalvos["suplementos@exemplo.com"].id,
      pontoMidiaId: pontosSalvos["100001"].id,
      titulo: "Whey Protein 100% Pure - 20% OFF",
      descricao: "Apresente a foto desta tela no balcão da MegaNutri e ganhe desconto exclusivo.",
      tipoMidia: "VIDEO" as const,
      midiaUrl: "/uploads/videos/00b239f3-bee2-4118-b0fb-f4b8b81cd180.mp4",
      duracaoSegundos: 15,
      status: "ATIVO" as const,
      dataInicio: agora,
      dataFim: trintaDias,
    },
    // 2. MegaNutri na OdontoCenter (Imagem ATIVO)
    {
      anuncianteId: anunciantesSalvos["suplementos@exemplo.com"].id,
      pontoMidiaId: pontosSalvos["100003"].id,
      titulo: "Colágeno Hidrolisado e Vitaminas",
      descricao: "Cuide da sua saúde e bem-estar todos os dias com produtos MegaNutri.",
      tipoMidia: "IMAGEM" as const,
      midiaUrl: "/uploads/images/daf8e97a-0048-4773-b722-bb21bc2f5158.jpg",
      duracaoSegundos: 10,
      status: "ATIVO" as const,
      dataInicio: agora,
      dataFim: trintaDias,
    },
    // 3. AutoPrime no Restaurante Villa Gourmet (Vídeo ATIVO)
    {
      anuncianteId: anunciantesSalvos["concessionaria@exemplo.com"].id,
      pontoMidiaId: pontosSalvos["100002"].id,
      titulo: "Festival de Seminovos AutoPrime",
      descricao: "Taxa zero em até 36x e primeira parcela para o próximo ano. Agende um test drive!",
      tipoMidia: "VIDEO" as const,
      midiaUrl: "/uploads/videos/c6b20810-f5a6-41db-9557-99be5c071b4e.mp4",
      duracaoSegundos: 15,
      status: "ATIVO" as const,
      dataInicio: agora,
      dataFim: trintaDias,
    },
    // 4. AutoPrime na Barbearia Don Corleone (Imagem ATIVO)
    {
      anuncianteId: anunciantesSalvos["concessionaria@exemplo.com"].id,
      pontoMidiaId: pontosSalvos["100004"].id,
      titulo: "Novo SUV Premium AutoPrime",
      descricao: "Potência, elegância e tecnologia que combinam com o seu estilo.",
      tipoMidia: "IMAGEM" as const,
      midiaUrl: "/uploads/images/ba8a4a0f-be91-4eb1-9090-acee6b130c6d.jpg",
      duracaoSegundos: 10,
      status: "ATIVO" as const,
      dataInicio: agora,
      dataFim: trintaDias,
    },
    // 5. Drogaria Bem Estar na Academia (Vídeo PENDENTE de moderação para o Admin aprovar)
    {
      anuncianteId: anunciantesSalvos["farmacia@exemplo.com"].id,
      pontoMidiaId: pontosSalvos["100001"].id,
      titulo: "Manipulação Esportiva e Drenagem",
      descricao: "Fórmulas personalizadas para atletas e praticantes de musculação.",
      tipoMidia: "VIDEO" as const,
      midiaUrl: "/uploads/videos/6b5e7603-6dff-414c-a72d-b2cea2169986.mp4",
      duracaoSegundos: 20,
      status: "PENDENTE" as const,
      dataInicio: null,
      dataFim: null,
    },
    // 6. Drogaria Bem Estar no Restaurante (Imagem na FILA_ESPERA)
    {
      anuncianteId: anunciantesSalvos["farmacia@exemplo.com"].id,
      pontoMidiaId: pontosSalvos["100002"].id,
      titulo: "Vitaminas Imunidade e Protetor Solar",
      descricao: "Linha completa de cuidados para você e sua família.",
      tipoMidia: "IMAGEM" as const,
      midiaUrl: "/uploads/images/8077e6ea-a004-4805-a1d1-1ce9b255ed72.jpg",
      duracaoSegundos: 10,
      status: "FILA_ESPERA" as const,
      dataInicio: null,
      dataFim: null,
    },
  ];

  for (const an of anunciosConfig) {
    const existe = await prisma.anuncio.findFirst({
      where: {
        anuncianteId: an.anuncianteId,
        pontoMidiaId: an.pontoMidiaId,
        titulo: an.titulo,
      },
    });

    if (existe) {
      await prisma.anuncio.update({
        where: { id: existe.id },
        data: {
          status: an.status,
          tipoMidia: an.tipoMidia,
          midiaUrl: an.midiaUrl,
          duracaoSegundos: an.duracaoSegundos,
          dataInicio: an.dataInicio,
          dataFim: an.dataFim,
        },
      });
      console.log(`[ANÚNCIO ATUALIZADO] "${an.titulo}" -> Status: ${an.status}`);
    } else {
      await prisma.anuncio.create({
        data: {
          anuncianteId: an.anuncianteId,
          pontoMidiaId: an.pontoMidiaId,
          titulo: an.titulo,
          descricao: an.descricao,
          tipoMidia: an.tipoMidia,
          midiaUrl: an.midiaUrl,
          duracaoSegundos: an.duracaoSegundos,
          status: an.status,
          dataInicio: an.dataInicio,
          dataFim: an.dataFim,
        },
      });
      console.log(`[ANÚNCIO CRIADO] "${an.titulo}" -> Status: ${an.status}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 5. NOTIFICAÇÕES DE DEMONSTRAÇÃO
  // ─────────────────────────────────────────────────────────────
  const notificacoes = [
    {
      userId: admin.id,
      tipo: "ANUNCIO_PENDENTE" as const,
      titulo: "Novo Anúncio Aguardando Moderação",
      mensagem: "A empresa 'Drogaria Bem Estar' enviou a campanha 'Manipulação Esportiva' para aprovação.",
    },
    {
      userId: anunciantesSalvos["suplementos@exemplo.com"].userId,
      tipo: "ANUNCIO_APROVADO" as const,
      titulo: "Campanha Aprovada com Sucesso!",
      mensagem: "Seu anúncio 'Whey Protein 100% Pure' foi aprovado e já está sendo veiculado na Academia Iron Fitness.",
    },
    {
      userId: pontosSalvos["100001"].userId,
      tipo: "NOVO_ANUNCIO_TV" as const,
      titulo: "Novo Anunciante na sua TV",
      mensagem: "O anunciante 'MegaNutri Suplementos' começou a veicular hoje na sua tela.",
    },
  ];

  for (const notif of notificacoes) {
    const jaExiste = await prisma.notificacao.findFirst({
      where: {
        userId: notif.userId,
        titulo: notif.titulo,
      },
    });

    if (!jaExiste) {
      await prisma.notificacao.create({
        data: notif,
      });
    }
  }

  console.log("\n=========================================");
  console.log("  Seed Concluído com Sucesso!            ");
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
