import { prisma } from "../lib/prisma";
import { hash } from "bcryptjs";

async function testFlow() {
  console.log("--- TESTANDO CONEXAO E FLUXO ---");

  // Teste 1: Conexão direta com Prisma
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
  console.log("1. Conexao Prisma OK. Usuarios existentes:", users);

  // Teste 2: Criar novo usuário Ponto direto
  const emailTest = `teste_ponto_${Date.now()}@teste.com`;
  const hashedPass = await hash("senha123", 12);
  const newUser = await prisma.user.create({
    data: {
      email: emailTest,
      senha: hashedPass,
      nome: "Dono Teste",
      whatsapp: "(48) 99999-8888",
      role: "PONTO",
    },
  });
  console.log("2. Usuario criado:", newUser.id, newUser.email);

  // Teste 3: Criar ponto de midia vinculado
  const newPonto = await prisma.pontoMidia.create({
    data: {
      userId: newUser.id,
      nomeEmpresa: "Barbearia Teste Flow",
      responsavel: "Dono Teste",
      whatsapp: "(48) 99999-8888",
      cep: "88015200",
      rua: "Rua Bocaiuva",
      numero: "100",
      bairro: "Centro",
      cidade: "Florianopolis",
      uf: "SC",
      categoria: "Barbearia / Salao de Beleza",
      descricao: "Espaço moderno com alta rotatividade de clientes",
      possuiTv: true,
      quantidadeTvs: 2,
      localInstalacao: "Sala de espera",
      fluxoDiarioEstimado: "30-80 pessoas",
      tempoPermanencia: "30-60 minutos",
      faixaEtariaPublico: ["18-25 anos", "26-35 anos"],
      generoPublico: "Masculino",
      status: "ATIVO",
    },
  });
  console.log("3. Ponto criado:", newPonto.id, newPonto.nomeEmpresa);

  // Teste 4: Criar anunciante
  const emailAnu = `teste_anu_${Date.now()}@teste.com`;
  const newAnuUser = await prisma.user.create({
    data: {
      email: emailAnu,
      senha: hashedPass,
      nome: "Anunciante Teste",
      whatsapp: "(48) 99999-7777",
      role: "ANUNCIANTE",
    },
  });

  const newAnu = await prisma.anunciante.create({
    data: {
      userId: newAnuUser.id,
      nomeEmpresa: "Lava Jato Express",
      responsavel: "Anunciante Teste",
      whatsapp: "(48) 99999-7777",
      cep: "88015100",
      rua: "Av Mauro Ramos",
      numero: "50",
      bairro: "Centro",
      cidade: "Florianopolis",
      uf: "SC",
      categoria: "Automotivo",
      oQueAnunciar: "Lavagem completa e polimento",
      descricaoAnuncio: "Desconto especial de 15% para clientes da rede",
      preferenciaLocalizacao: "Mesma cidade",
      categoriasEspecificas: ["Barbearia / Salao de Beleza"],
      faixaEtariaAlvo: ["18-25 anos", "26-35 anos"],
      generoAlvo: "Masculino",
    },
  });
  console.log("4. Anunciante criado:", newAnu.id, newAnu.nomeEmpresa);

  // Teste 5: Criar anúncio do anunciante para o ponto
  const newAd = await prisma.anuncio.create({
    data: {
      anuncianteId: newAnu.id,
      pontoMidiaId: newPonto.id,
      titulo: "Lavagem Express com 15% OFF",
      descricao: "Apresente esta tela e ganhe desconto na lavagem do seu carro.",
      tipoMidia: "IMAGEM",
      midiaUrl: "/uploads/images/sample.jpg",
      duracaoSegundos: 10,
      status: "ATIVO",
    },
  });
  console.log("5. Anuncio criado e ativo:", newAd.id, newAd.titulo);

  // Cleanup
  await prisma.anuncio.delete({ where: { id: newAd.id } });
  await prisma.anunciante.delete({ where: { id: newAnu.id } });
  await prisma.user.delete({ where: { id: newAnuUser.id } });
  await prisma.pontoMidia.delete({ where: { id: newPonto.id } });
  await prisma.user.delete({ where: { id: newUser.id } });
  console.log("6. Limpeza concluida. Fluxo do banco 100% validado!");
}

testFlow()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
