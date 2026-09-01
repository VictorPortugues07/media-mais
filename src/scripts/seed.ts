import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:root@localhost:5432/mediamais?schema=public";

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Iniciando Seed...");

  // 1. Criar Administrador Padrão
  const adminPassword = await hash("mediamais2026", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@mediamais.com" },
    update: {},
    create: {
      email: "admin@mediamais.com",
      senha: adminPassword,
      nome: "Administrador Media+",
      whatsapp: "(48) 98879-6514",
      role: "ADMIN",
    },
  });
  console.log("Admin criado/atualizado:", admin.email);

  // 2. Criar Dono de Ponto de Demonstração
  const pontoPassword = await hash("ponto123", 12);
  const userPonto = await prisma.user.upsert({
    where: { email: "academia@exemplo.com" },
    update: {},
    create: {
      email: "academia@exemplo.com",
      senha: pontoPassword,
      nome: "Carlos Silva (Academia)",
      whatsapp: "(48) 99123-4567",
      role: "PONTO",
    },
  });

  const ponto = await prisma.pontoMidia.upsert({
    where: { userId: userPonto.id },
    update: {},
    create: {
      userId: userPonto.id,
      nomeEmpresa: "Academia Iron Fitness",
      responsavel: "Carlos Silva",
      whatsapp: "(48) 99123-4567",
      instagramSite: "@ironfitnessfloripa",
      cep: "88015200",
      rua: "Av. Mauro Ramos",
      numero: "1200",
      bairro: "Centro",
      cidade: "Florianopolis",
      uf: "SC",
      categoria: "Academia / Crossfit",
      descricao: "Academia com alto fluxo de pessoas jovens e adultas em busca de saúde e nutrição.",
      possuiTv: true,
      quantidadeTvs: 3,
      localInstalacao: "Recepcao / Entrada",
      fluxoDiarioEstimado: "150-300 pessoas",
      tempoPermanencia: "1-2 horas",
      faixaEtariaPublico: ["18-25 anos", "26-35 anos", "36-45 anos"],
      generoPublico: "Misto (equilibrado)",
      lat: -27.5954,
      lng: -48.548,
      status: "ATIVO",
    },
  });
  console.log("Ponto de Mídia criado:", ponto.nomeEmpresa);

  // 3. Criar Anunciante de Demonstração
  const anunciantePassword = await hash("anunciante123", 12);
  const userAnunciante = await prisma.user.upsert({
    where: { email: "suplementos@exemplo.com" },
    update: {},
    create: {
      email: "suplementos@exemplo.com",
      senha: anunciantePassword,
      nome: "Juliana Santos",
      whatsapp: "(48) 99876-5432",
      role: "ANUNCIANTE",
    },
  });

  const anunciante = await prisma.anunciante.upsert({
    where: { userId: userAnunciante.id },
    update: {},
    create: {
      userId: userAnunciante.id,
      nomeEmpresa: "MegaNutri Suplementos",
      responsavel: "Juliana Santos",
      whatsapp: "(48) 99876-5432",
      instagramSite: "@meganutrisuplementos",
      cep: "88015100",
      rua: "Rua Bocaiuva",
      numero: "500",
      bairro: "Centro",
      cidade: "Florianopolis",
      uf: "SC",
      categoria: "Saude e Bem-estar",
      oQueAnunciar: "Desconto de 20% em Whey Protein e Creatina",
      descricaoAnuncio: "Promoção exclusiva para alunos de academias parceiras.",
      preferenciaLocalizacao: "Mesma cidade",
      categoriasEspecificas: ["Academia / Crossfit"],
      faixaEtariaAlvo: ["18-25 anos", "26-35 anos"],
      generoAlvo: "Misto (equilibrado)",
    },
  });
  console.log("Anunciante criado:", anunciante.nomeEmpresa);

  console.log("Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
