/**
 * Dados da demonstração da plataforma Media+.
 * Usado por `gerar-midia-demo.ts` (gera as imagens/vídeos) e por `seed.ts` (popula o banco).
 *
 * Fotos de estabelecimentos/anúncios: Unsplash (licença livre). Fotos de perfil: pravatar.cc.
 * Todas as empresas e pessoas são fictícias.
 */

export const DEMO_DIR = "/uploads/demo";

export const SENHA_PONTO = "ponto123";
export const SENHA_ANUNCIANTE = "anunciante123";

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?w=1920&q=85&fm=jpg&fit=crop&crop=entropy`;
const pravatar = (n: number) => `https://i.pravatar.cc/400?img=${n}`;

/** Fotos de origem (baixadas uma vez pelo gerador). */
export const FOTOS: Record<string, string> = {
  gym1: unsplash("1534438327276-14e5300c3a48"),
  gym3: unsplash("1540497077202-7c8a3999166f"),
  gym4: unsplash("1517836357463-d25dfeac3438"),
  rest1: unsplash("1517248135467-4c7edcad34c4"),
  rest2: unsplash("1414235077428-338989a2e8c0"),
  rest3: unsplash("1552566626-52f8b828add9"),
  cafe1: unsplash("1554118811-1e0d58224f24"),
  cafe2: unsplash("1501339847302-ac426a4a7cbb"),
  cafe3: unsplash("1445116572660-236099ec97a0"),
  barb1: unsplash("1503951914875-452162b0f3f1"),
  barb2: unsplash("1585747860715-2ba37e788b70"),
  barb3: unsplash("1621605815971-fbc98d665033"),
  dent1: unsplash("1629909613654-28e377c37b09"),
  dent2: unsplash("1588776814546-1ffcf47267a5"),
  dent3: unsplash("1606811971618-4486d14f3f99"),
  pet1: unsplash("1548199973-03cce0bbc87b"),
  pet2: unsplash("1583337130417-3346a1be7dee"),
  hotel1: unsplash("1566073771259-6a8506099945"),
  cowork1: unsplash("1497366216548-37526070297c"),
  cowork2: unsplash("1497366811353-6870744d04b2"),
  bake1: unsplash("1509440159596-0249088772ff"),
  bake2: unsplash("1555507036-ab1f4038808a"),
  salon1: unsplash("1560066984-138dadb4c035"),
  beauty1: unsplash("1570172619644-dfd03ed5d881"),
  market1: unsplash("1542838132-92c53300491e"),
  market2: unsplash("1604719312566-8912e9227c6a"),
  wash1: unsplash("1520340356584-f9917d1eea6f"),
  wash2: unsplash("1607860108855-64acf2078ed9"),
  school1: unsplash("1580582932707-520aed937b7b"),
  edu1: unsplash("1523240795612-9a054b0db644"),
  supl1: unsplash("1593095948071-474c5cc2989d"),
  supl2: unsplash("1579722820308-d74e571900a9"),
  car1: unsplash("1503376780353-7e6692767b70"),
  car3: unsplash("1533473359331-0135ef1b58bf"),
  skin2: unsplash("1631549916768-4119b2e5f926"),
  fit1: unsplash("1518310383802-640c2de311b2"),
  fit2: unsplash("1571019613454-1cb2f99b2d8b"),
  pizza1: unsplash("1513104890138-7c749659a591"),
  burger1: unsplash("1568901346375-23c9450c58cd"),
  house1: unsplash("1600596542815-ffad4c1539a9"),
  house2: unsplash("1600585154340-be6161a56a0c"),
  fin1: unsplash("1554224155-6726b3ff858f"),
  optic1: unsplash("1574258495973-f010dfbb5371"),
  tech1: unsplash("1519389950473-47ba0277781c"),
};

export const AVATARES: Record<string, string> = {
  carlos: pravatar(13),
  marcos: pravatar(18),
  renata: pravatar(36),
  rodrigo: pravatar(11),
  fernanda: pravatar(26),
  aline: pravatar(44),
  jorge: pravatar(17),
  lucas: pravatar(12),
  antonio: pravatar(70),
  ricardo: pravatar(68),
  camila: pravatar(16),
  diego: pravatar(60),
  helena: pravatar(45),
  juliana: pravatar(32),
  bruno: pravatar(51),
  patricia: pravatar(28),
  thiago: pravatar(53),
  giovanni: pravatar(14),
  rafael: pravatar(59),
  mariana: pravatar(49),
  sandra: pravatar(34),
  pedro: pravatar(8),
  eduardo: pravatar(57),
};

export const avatarUrl = (slug: string) => `${DEMO_DIR}/avatars/${slug}.webp`;
export const fotoPontoUrl = (foto: string) => `${DEMO_DIR}/pontos/${foto}.webp`;
export const fotoAnuncianteUrl = (foto: string) => `${DEMO_DIR}/anunciantes/${foto}.webp`;
export const logoUrl = (slug: string) => `${DEMO_DIR}/logos/${slug}.webp`;
export const midiaAnuncioUrl = (slug: string, tipo: "VIDEO" | "IMAGEM") =>
  tipo === "VIDEO" ? `${DEMO_DIR}/videos/${slug}.mp4` : `${DEMO_DIR}/anuncios/${slug}.webp`;

// ─────────────────────────────────────────────────────────────
// PONTOS DE MÍDIA (estabelecimentos com TV)
// ─────────────────────────────────────────────────────────────
export type DemoPonto = {
  slug: string;
  email: string;
  avatar: string;
  responsavel: string;
  whatsapp: string;
  nomeEmpresa: string;
  categoria: string;
  instagramSite: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  lat: number;
  lng: number;
  descricao: string;
  quantidadeTvs: number;
  localInstalacao: string;
  fluxoDiarioEstimado: string;
  tempoPermanencia: string;
  faixaEtariaPublico: string[];
  generoPublico: string;
  horariosPico: string;
  horarioAbertura: string;
  horarioFechamento: string;
  diasFuncionamento: string[];
  fotos: string[];
  codigoTv: string;
  status: "ATIVO" | "PENDENTE" | "INATIVO";
  notas: [number, number, number, number]; // fluxo, tempo, perfil, exclusividade
  tipoDispositivo: string | null;
};

const SEG_SEX = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
const SEG_SAB = [...SEG_SEX, "Sábado"];
const TODOS = [...SEG_SAB, "Domingo"];

export const PONTOS: DemoPonto[] = [
  {
    slug: "iron-fitness",
    email: "academia@exemplo.com",
    avatar: "carlos",
    responsavel: "Carlos Silva",
    whatsapp: "(48) 99123-4567",
    nomeEmpresa: "Academia Iron Fitness",
    categoria: "Academia / Crossfit",
    instagramSite: "@ironfitness.floripa",
    cep: "88015200", rua: "Av. Mauro Ramos", numero: "1200", bairro: "Centro", cidade: "Florianópolis", uf: "SC",
    lat: -27.5954, lng: -48.548,
    descricao: "Academia completa com musculação, funcional e cross. Alto fluxo de jovens e adultos focados em saúde, estética e nutrição.",
    quantidadeTvs: 3,
    localInstalacao: "Salao principal",
    fluxoDiarioEstimado: "Mais de 300 pessoas",
    tempoPermanencia: "1-2 horas",
    faixaEtariaPublico: ["18-25 anos", "26-35 anos", "36-45 anos"],
    generoPublico: "Misto (equilibrado)",
    horariosPico: "06h-09h e 17h-21h",
    horarioAbertura: "06:00", horarioFechamento: "23:00", diasFuncionamento: SEG_SAB,
    fotos: ["gym1", "gym3", "gym4"],
    codigoTv: "100001",
    status: "ATIVO",
    notas: [5, 4.5, 4.5, 4],
    tipoDispositivo: "SMART_TV",
  },
  {
    slug: "villa-gourmet",
    email: "restaurante@exemplo.com",
    avatar: "marcos",
    responsavel: "Marcos Oliveira",
    whatsapp: "(48) 99234-5678",
    nomeEmpresa: "Restaurante Villa Gourmet",
    categoria: "Restaurante / Lanchonete",
    instagramSite: "@villagourmet",
    cep: "88015400", rua: "Av. Beira Mar Norte", numero: "2500", bairro: "Agronômica", cidade: "Florianópolis", uf: "SC",
    lat: -27.585, lng: -48.552,
    descricao: "Restaurante executivo com almoço movimentado e happy hour com público qualificado, de profissionais liberais a empresários.",
    quantidadeTvs: 2,
    localInstalacao: "Area de refeicoes",
    fluxoDiarioEstimado: "150-300 pessoas",
    tempoPermanencia: "30-60 minutos",
    faixaEtariaPublico: ["26-35 anos", "36-45 anos", "46-60 anos"],
    generoPublico: "Misto (equilibrado)",
    horariosPico: "11h30-14h e 18h-22h",
    horarioAbertura: "11:00", horarioFechamento: "23:00", diasFuncionamento: TODOS,
    fotos: ["rest1", "rest2", "rest3"],
    codigoTv: "100002",
    status: "ATIVO",
    notas: [4, 4, 4.5, 3.5],
    tipoDispositivo: "SMART_TV",
  },
  {
    slug: "odontocenter",
    email: "clinica@exemplo.com",
    avatar: "renata",
    responsavel: "Dra. Renata Vasconcelos",
    whatsapp: "(48) 99345-6789",
    nomeEmpresa: "Clínica OdontoCenter Premium",
    categoria: "Clinica Odontologica",
    instagramSite: "@odontocenterpremium",
    cep: "88101000", rua: "Av. Presidente Kennedy", numero: "450", bairro: "Campinas", cidade: "São José", uf: "SC",
    lat: -27.592, lng: -48.618,
    descricao: "Clínica de odontologia e estética facial. Sala de espera confortável com público de alto poder aquisitivo e longa permanência.",
    quantidadeTvs: 1,
    localInstalacao: "Sala de espera",
    fluxoDiarioEstimado: "80-150 pessoas",
    tempoPermanencia: "30-60 minutos",
    faixaEtariaPublico: ["26-35 anos", "36-45 anos", "46-60 anos"],
    generoPublico: "Feminino",
    horariosPico: "09h-11h e 14h-18h",
    horarioAbertura: "08:00", horarioFechamento: "19:00", diasFuncionamento: SEG_SEX,
    fotos: ["dent1", "dent2", "dent3"],
    codigoTv: "100003",
    status: "ATIVO",
    notas: [4, 5, 5, 4.5],
    tipoDispositivo: "SMART_TV",
  },
  {
    slug: "don-corleone",
    email: "barbearia@exemplo.com",
    avatar: "rodrigo",
    responsavel: "Rodrigo Almeida",
    whatsapp: "(48) 99456-7890",
    nomeEmpresa: "Barbearia Don Corleone",
    categoria: "Barbearia / Salao de Beleza",
    instagramSite: "@doncorleone.barber",
    cep: "88132149", rua: "Av. Atílio Pedro Pagani", numero: "800", bairro: "Pagani", cidade: "Palhoça", uf: "SC",
    lat: -27.644, lng: -48.669,
    descricao: "Barbearia conceito com sinuca, chopp e videogame. Público majoritariamente masculino durante todo o dia.",
    quantidadeTvs: 2,
    localInstalacao: "Sala de espera",
    fluxoDiarioEstimado: "80-150 pessoas",
    tempoPermanencia: "30-60 minutos",
    faixaEtariaPublico: ["18-25 anos", "26-35 anos", "36-45 anos"],
    generoPublico: "Masculino",
    horariosPico: "17h-21h e sábados",
    horarioAbertura: "09:00", horarioFechamento: "21:00", diasFuncionamento: SEG_SAB,
    fotos: ["barb2", "barb1", "barb3"],
    codigoTv: "100004",
    status: "ATIVO",
    notas: [3.5, 4, 3.5, 3.5],
    tipoDispositivo: "DESKTOP",
  },
  {
    slug: "cafe-aroma",
    email: "cafe@exemplo.com",
    avatar: "fernanda",
    responsavel: "Fernanda Costa",
    whatsapp: "(48) 99567-8901",
    nomeEmpresa: "Café & Bistrô Aroma",
    categoria: "Padaria / Cafeteria",
    instagramSite: "@cafearoma.lagoa",
    cep: "88062000", rua: "Rua Afonso Delambert Neto", numero: "310", bairro: "Lagoa da Conceição", cidade: "Florianópolis", uf: "SC",
    lat: -27.604, lng: -48.468,
    descricao: "Café aconchegante com espaço de coworking. Recebe moradores, nômades digitais e turistas ao longo de todo o ano.",
    quantidadeTvs: 1,
    localInstalacao: "Area de atendimento",
    fluxoDiarioEstimado: "150-300 pessoas",
    tempoPermanencia: "30-60 minutos",
    faixaEtariaPublico: ["18-25 anos", "26-35 anos", "36-45 anos"],
    generoPublico: "Misto (equilibrado)",
    horariosPico: "08h-10h e 15h-18h",
    horarioAbertura: "07:30", horarioFechamento: "20:00", diasFuncionamento: TODOS,
    fotos: ["cafe1", "cafe2", "cafe3"],
    codigoTv: "100005",
    status: "PENDENTE", // aguardando aprovação do admin
    notas: [3.5, 4, 4, 3],
    tipoDispositivo: "SMART_TV",
  },
  {
    slug: "amigo-fiel",
    email: "petshop@exemplo.com",
    avatar: "aline",
    responsavel: "Aline Rocha",
    whatsapp: "(48) 99611-2233",
    nomeEmpresa: "Pet Shop & Vet Amigo Fiel",
    categoria: "Clinica Veterinaria / Pet Shop",
    instagramSite: "@amigofiel.pet",
    cep: "88034000", rua: "Rua Deputado Antônio Edu Vieira", numero: "1050", bairro: "Pantanal", cidade: "Florianópolis", uf: "SC",
    lat: -27.6105, lng: -48.5195,
    descricao: "Clínica veterinária com banho e tosa. Tutores aguardam em média 40 minutos na recepção durante os atendimentos.",
    quantidadeTvs: 1,
    localInstalacao: "Recepcao / Entrada",
    fluxoDiarioEstimado: "30-80 pessoas",
    tempoPermanencia: "30-60 minutos",
    faixaEtariaPublico: ["26-35 anos", "36-45 anos", "46-60 anos"],
    generoPublico: "Misto (equilibrado)",
    horariosPico: "Sábados pela manhã",
    horarioAbertura: "08:00", horarioFechamento: "19:00", diasFuncionamento: SEG_SAB,
    fotos: ["pet1", "pet2"],
    codigoTv: "100006",
    status: "ATIVO",
    notas: [3, 4, 4, 3.5],
    tipoDispositivo: "SMART_TV",
  },
  {
    slug: "mar-azul",
    email: "pousada@exemplo.com",
    avatar: "jorge",
    responsavel: "Jorge Pereira",
    whatsapp: "(48) 99722-3344",
    nomeEmpresa: "Pousada Mar Azul",
    categoria: "Hotel / Pousada",
    instagramSite: "pousadamarazul.com.br",
    cep: "88058000", rua: "Rua das Gaivotas", numero: "88", bairro: "Ingleses", cidade: "Florianópolis", uf: "SC",
    lat: -27.4352, lng: -48.3962,
    descricao: "Pousada pé na areia com 32 suítes. TV no lobby e no restaurante do café da manhã, com turistas de todo o Brasil e Mercosul.",
    quantidadeTvs: 2,
    localInstalacao: "Recepcao / Entrada",
    fluxoDiarioEstimado: "80-150 pessoas",
    tempoPermanencia: "15-30 minutos",
    faixaEtariaPublico: ["26-35 anos", "36-45 anos", "46-60 anos", "Acima de 60"],
    generoPublico: "Misto (equilibrado)",
    horariosPico: "07h-10h (café da manhã)",
    horarioAbertura: "06:00", horarioFechamento: "23:59", diasFuncionamento: TODOS,
    fotos: ["hotel1"],
    codigoTv: "100007",
    status: "ATIVO",
    notas: [3.5, 3, 4.5, 4],
    tipoDispositivo: "SMART_TV",
  },
  {
    slug: "hub-ilha",
    email: "coworking@exemplo.com",
    avatar: "lucas",
    responsavel: "Lucas Martins",
    whatsapp: "(48) 99833-4455",
    nomeEmpresa: "Hub Coworking Ilha",
    categoria: "Escritorio / Coworking",
    instagramSite: "hubilha.com.br",
    cep: "88036001", rua: "Rua Lauro Linhares", numero: "2010", bairro: "Trindade", cidade: "Florianópolis", uf: "SC",
    lat: -27.5878, lng: -48.5222,
    descricao: "Coworking com 180 estações e salas de reunião, perto da UFSC. Startups, devs e profissionais de tecnologia o dia inteiro.",
    quantidadeTvs: 3,
    localInstalacao: "Area de refeicoes",
    fluxoDiarioEstimado: "150-300 pessoas",
    tempoPermanencia: "Mais de 2 horas",
    faixaEtariaPublico: ["18-25 anos", "26-35 anos", "36-45 anos"],
    generoPublico: "Misto (equilibrado)",
    horariosPico: "12h-14h (copa)",
    horarioAbertura: "07:00", horarioFechamento: "22:00", diasFuncionamento: SEG_SEX,
    fotos: ["cowork2", "cowork1"],
    codigoTv: "100008",
    status: "ATIVO",
    notas: [4, 5, 4.5, 4.5],
    tipoDispositivo: "DESKTOP",
  },
  {
    slug: "pao-dourado",
    email: "padaria@exemplo.com",
    avatar: "antonio",
    responsavel: "Antônio Souza",
    whatsapp: "(48) 99944-5566",
    nomeEmpresa: "Padaria Pão Dourado",
    categoria: "Padaria / Cafeteria",
    instagramSite: "@paodourado.kobrasol",
    cep: "88102000", rua: "Rua Adhemar da Silva", numero: "990", bairro: "Kobrasol", cidade: "São José", uf: "SC",
    lat: -27.5975, lng: -48.6125,
    descricao: "Padaria tradicional de bairro com confeitaria e café colonial aos domingos. Fluxo constante de famílias.",
    quantidadeTvs: 1,
    localInstalacao: "Area de atendimento",
    fluxoDiarioEstimado: "Mais de 300 pessoas",
    tempoPermanencia: "Ate 15 minutos",
    faixaEtariaPublico: ["26-35 anos", "36-45 anos", "46-60 anos", "Acima de 60"],
    generoPublico: "Misto (equilibrado)",
    horariosPico: "06h30-09h e 17h-19h",
    horarioAbertura: "06:00", horarioFechamento: "20:30", diasFuncionamento: TODOS,
    fotos: ["bake1", "bake2"],
    codigoTv: "100009",
    status: "ATIVO",
    notas: [5, 2.5, 3.5, 3],
    tipoDispositivo: "DESKTOP",
  },
  {
    slug: "bom-preco",
    email: "mercado@exemplo.com",
    avatar: "ricardo",
    responsavel: "Ricardo Nunes",
    whatsapp: "(48) 99155-6677",
    nomeEmpresa: "Supermercado Bom Preço",
    categoria: "Supermercado / Mercearia",
    instagramSite: "@bompreco.sc",
    cep: "88131000", rua: "Av. Barão do Rio Branco", numero: "1500", bairro: "Centro", cidade: "Palhoça", uf: "SC",
    lat: -27.6447, lng: -48.6378,
    descricao: "Supermercado de bairro com TV nos caixas. Grande volume de clientes diários de todas as idades.",
    quantidadeTvs: 4,
    localInstalacao: "Area de atendimento",
    fluxoDiarioEstimado: "Mais de 300 pessoas",
    tempoPermanencia: "15-30 minutos",
    faixaEtariaPublico: ["26-35 anos", "36-45 anos", "46-60 anos"],
    generoPublico: "Misto (equilibrado)",
    horariosPico: "18h-20h e fins de semana",
    horarioAbertura: "07:00", horarioFechamento: "22:00", diasFuncionamento: TODOS,
    fotos: ["market1", "market2"],
    codigoTv: "100010",
    status: "ATIVO",
    notas: [5, 3, 3, 3],
    tipoDispositivo: "SMART_TV",
  },
  {
    slug: "bella-estetica",
    email: "estetica@exemplo.com",
    avatar: "camila",
    responsavel: "Camila Duarte",
    whatsapp: "(48) 99266-7788",
    nomeEmpresa: "Studio Bella Estética",
    categoria: "Barbearia / Salao de Beleza",
    instagramSite: "@studiobella.estetica",
    cep: "88070000", rua: "Rua Santos Saraiva", numero: "430", bairro: "Estreito", cidade: "Florianópolis", uf: "SC",
    lat: -27.5905, lng: -48.5812,
    descricao: "Salão de beleza e estética avançada. Clientes permanecem bastante tempo em procedimentos de cabelo, unhas e pele.",
    quantidadeTvs: 2,
    localInstalacao: "Area de atendimento",
    fluxoDiarioEstimado: "30-80 pessoas",
    tempoPermanencia: "1-2 horas",
    faixaEtariaPublico: ["18-25 anos", "26-35 anos", "36-45 anos", "46-60 anos"],
    generoPublico: "Feminino",
    horariosPico: "Quintas a sábados",
    horarioAbertura: "09:00", horarioFechamento: "20:00", diasFuncionamento: SEG_SAB,
    fotos: ["salon1", "beauty1"],
    codigoTv: "100011",
    status: "ATIVO",
    notas: [3, 5, 4.5, 4],
    tipoDispositivo: "SMART_TV",
  },
  {
    slug: "brilho-total",
    email: "lavajato@exemplo.com",
    avatar: "diego",
    responsavel: "Diego Ramos",
    whatsapp: "(48) 99377-8899",
    nomeEmpresa: "Lava-Jato Brilho Total",
    categoria: "Oficina Mecanica / Lava-Jato",
    instagramSite: "@brilhototal.lavajato",
    cep: "88104000", rua: "Rua Pedro Bunn", numero: "220", bairro: "Barreiros", cidade: "São José", uf: "SC",
    lat: -27.5765, lng: -48.6205,
    descricao: "Lava-jato e estética automotiva. Ponto temporariamente desativado (TV em manutenção).",
    quantidadeTvs: 1,
    localInstalacao: "Sala de espera",
    fluxoDiarioEstimado: "30-80 pessoas",
    tempoPermanencia: "30-60 minutos",
    faixaEtariaPublico: ["26-35 anos", "36-45 anos"],
    generoPublico: "Masculino",
    horariosPico: "Sábados",
    horarioAbertura: "08:00", horarioFechamento: "18:00", diasFuncionamento: SEG_SAB,
    fotos: ["wash2", "wash1"],
    codigoTv: "100012",
    status: "INATIVO", // ponto e usuário desativados para testar bloqueios
    notas: [2.5, 3.5, 3, 3],
    tipoDispositivo: null,
  },
  {
    slug: "colegio-saber",
    email: "escola@exemplo.com",
    avatar: "helena",
    responsavel: "Helena Prado",
    whatsapp: "(48) 99488-9900",
    nomeEmpresa: "Colégio e Cursos Saber",
    categoria: "Escola / Curso",
    instagramSite: "colegiosaber.com.br",
    cep: "88020300", rua: "Rua Esteves Júnior", numero: "160", bairro: "Centro", cidade: "Florianópolis", uf: "SC",
    lat: -27.5918, lng: -48.5532,
    descricao: "Colégio com cursinho pré-vestibular. TV na recepção onde pais e alunos aguardam atendimento.",
    quantidadeTvs: 2,
    localInstalacao: "Recepcao / Entrada",
    fluxoDiarioEstimado: "150-300 pessoas",
    tempoPermanencia: "15-30 minutos",
    faixaEtariaPublico: ["Ate 18 anos", "36-45 anos", "46-60 anos"],
    generoPublico: "Misto (equilibrado)",
    horariosPico: "07h-08h, 12h e 18h",
    horarioAbertura: "07:00", horarioFechamento: "22:00", diasFuncionamento: SEG_SEX,
    fotos: ["school1", "edu1"],
    codigoTv: "100013",
    status: "PENDENTE", // aguardando aprovação do admin
    notas: [4, 3, 3.5, 3.5],
    tipoDispositivo: "SMART_TV",
  },
];

// ─────────────────────────────────────────────────────────────
// ANUNCIANTES
// ─────────────────────────────────────────────────────────────
export type DemoAnunciante = {
  slug: string;
  email: string;
  avatar: string;
  responsavel: string;
  whatsapp: string;
  nomeEmpresa: string;
  /** Sigla exibida no logotipo gerado */
  sigla: string;
  cor: string;
  corDestaque: string;
  categoria: string;
  instagramSite: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  oQueAnunciar: string;
  descricaoAnuncio: string;
  preferenciaLocalizacao: string;
  categoriasEspecificas: string[];
  faixaEtariaAlvo: string[];
  generoAlvo: string;
  fotos: string[];
};

export const ANUNCIANTES: DemoAnunciante[] = [
  {
    slug: "meganutri",
    email: "suplementos@exemplo.com",
    avatar: "juliana",
    responsavel: "Juliana Santos",
    whatsapp: "(48) 99876-5432",
    nomeEmpresa: "MegaNutri Suplementos",
    sigla: "MN", cor: "#0F3D2E", corDestaque: "#7CFC5A",
    categoria: "Saude e Bem-estar",
    instagramSite: "@meganutri",
    cep: "88015100", rua: "Rua Bocaiúva", numero: "500", bairro: "Centro", cidade: "Florianópolis", uf: "SC",
    oQueAnunciar: "Whey Protein, creatina e vitaminas com desconto para alunos de academia",
    descricaoAnuncio: "Loja de suplementos com entrega no mesmo dia na Grande Florianópolis.",
    preferenciaLocalizacao: "Mesma cidade",
    categoriasEspecificas: ["Academia / Crossfit", "Clinica Odontologica", "Barbearia / Salao de Beleza"],
    faixaEtariaAlvo: ["18-25 anos", "26-35 anos", "36-45 anos"],
    generoAlvo: "Misto (equilibrado)",
    fotos: ["supl2", "supl1"],
  },
  {
    slug: "autoprime",
    email: "concessionaria@exemplo.com",
    avatar: "bruno",
    responsavel: "Bruno Ferreira",
    whatsapp: "(48) 99789-0123",
    nomeEmpresa: "AutoPrime Veículos",
    sigla: "AP", cor: "#111827", corDestaque: "#F5B700",
    categoria: "Automotivo",
    instagramSite: "autoprimeveiculos.com.br",
    cep: "88085000", rua: "Av. Governador Ivo Silveira", numero: "1400", bairro: "Capoeiras", cidade: "Florianópolis", uf: "SC",
    oQueAnunciar: "Seminovos com taxa zero e SUVs 0 km com primeira parcela para 2027",
    descricaoAnuncio: "Concessionária multimarcas com mais de 200 veículos em estoque.",
    preferenciaLocalizacao: "Grande Florianópolis",
    categoriasEspecificas: ["Restaurante / Lanchonete", "Barbearia / Salao de Beleza", "Escritorio / Coworking"],
    faixaEtariaAlvo: ["26-35 anos", "36-45 anos", "46-60 anos"],
    generoAlvo: "Misto (equilibrado)",
    fotos: ["car1", "car3"],
  },
  {
    slug: "bem-estar",
    email: "farmacia@exemplo.com",
    avatar: "patricia",
    responsavel: "Patrícia Lima",
    whatsapp: "(48) 99654-3210",
    nomeEmpresa: "Drogaria Bem Estar",
    sigla: "BE", cor: "#0B4F8A", corDestaque: "#4FD1C5",
    categoria: "Saude e Bem-estar",
    instagramSite: "@drogariabemestar",
    cep: "88102310", rua: "Rua Koesa", numero: "280", bairro: "Kobrasol", cidade: "São José", uf: "SC",
    oQueAnunciar: "Entrega grátis e descontos em dermocosméticos e vitaminas",
    descricaoAnuncio: "Farmácia de manipulação e drogaria com delivery em até 40 minutos.",
    preferenciaLocalizacao: "Grande Florianópolis",
    categoriasEspecificas: ["Clinica Odontologica", "Supermercado / Mercearia", "Clinica Veterinaria / Pet Shop"],
    faixaEtariaAlvo: ["26-35 anos", "36-45 anos", "46-60 anos", "Acima de 60"],
    generoAlvo: "Misto (equilibrado)",
    fotos: ["skin2"],
  },
  {
    slug: "vida-ativa",
    email: "novamarca@exemplo.com",
    avatar: "thiago",
    responsavel: "Thiago Mendes",
    whatsapp: "(48) 99543-2109",
    nomeEmpresa: "Studio Vida Ativa",
    sigla: "VA", cor: "#4C1D95", corDestaque: "#F472B6",
    categoria: "Moda e Vestuario",
    instagramSite: "@vidaativa.wear",
    cep: "88036002", rua: "Rua Lauro Linhares", numero: "700", bairro: "Trindade", cidade: "Florianópolis", uf: "SC",
    oQueAnunciar: "Nova coleção fitness com tecnologia dry-fit",
    descricaoAnuncio: "Roupas e acessórios esportivos de alta performance, feitos em SC.",
    preferenciaLocalizacao: "Mesma cidade",
    categoriasEspecificas: ["Academia / Crossfit", "Barbearia / Salao de Beleza"],
    faixaEtariaAlvo: ["18-25 anos", "26-35 anos"],
    generoAlvo: "Feminino",
    fotos: ["fit1", "fit2"],
  },
  {
    slug: "forno-di-napoli",
    email: "pizzaria@exemplo.com",
    avatar: "giovanni",
    responsavel: "Giovanni Russo",
    whatsapp: "(48) 99101-2020",
    nomeEmpresa: "Pizzaria Forno di Napoli",
    sigla: "FN", cor: "#7F1D1D", corDestaque: "#FBBF24",
    categoria: "Alimentacao",
    instagramSite: "@fornodinapoli",
    cep: "88010400", rua: "Rua Felipe Schmidt", numero: "1220", bairro: "Centro", cidade: "Florianópolis", uf: "SC",
    oQueAnunciar: "Pizza napolitana em forno a lenha com delivery",
    descricaoAnuncio: "Pizzaria artesanal com massa de fermentação natural de 48 horas.",
    preferenciaLocalizacao: "Mesma cidade",
    categoriasEspecificas: ["Escritorio / Coworking", "Hotel / Pousada", "Academia / Crossfit"],
    faixaEtariaAlvo: ["18-25 anos", "26-35 anos", "36-45 anos"],
    generoAlvo: "Misto (equilibrado)",
    fotos: ["pizza1"],
  },
  {
    slug: "burger-house",
    email: "hamburgueria@exemplo.com",
    avatar: "rafael",
    responsavel: "Rafael Costa",
    whatsapp: "(48) 99202-3030",
    nomeEmpresa: "Burger House 48",
    sigla: "B48", cor: "#1F1A17", corDestaque: "#FF7A00",
    categoria: "Alimentacao",
    instagramSite: "@burgerhouse48",
    cep: "88036100", rua: "Rua Deputado Antônio Edu Vieira", numero: "300", bairro: "Pantanal", cidade: "Florianópolis", uf: "SC",
    oQueAnunciar: "Combo smash burger + fritas + refri por R$ 34,90",
    descricaoAnuncio: "Hamburgueria artesanal com blend da casa e pão brioche.",
    preferenciaLocalizacao: "Mesma cidade",
    categoriasEspecificas: ["Escritorio / Coworking", "Barbearia / Salao de Beleza", "Academia / Crossfit"],
    faixaEtariaAlvo: ["18-25 anos", "26-35 anos"],
    generoAlvo: "Misto (equilibrado)",
    fotos: ["burger1"],
  },
  {
    slug: "ilha-prime",
    email: "imobiliaria@exemplo.com",
    avatar: "mariana",
    responsavel: "Mariana Alves",
    whatsapp: "(48) 99303-4040",
    nomeEmpresa: "Ilha Prime Imóveis",
    sigla: "IP", cor: "#0E1F66", corDestaque: "#97BAB0",
    categoria: "Imobiliario",
    instagramSite: "ilhaprimeimoveis.com.br",
    cep: "88015600", rua: "Av. Rio Branco", numero: "404", bairro: "Centro", cidade: "Florianópolis", uf: "SC",
    oQueAnunciar: "Lançamentos de alto padrão em Jurerê e Campeche",
    descricaoAnuncio: "Imobiliária especializada em imóveis de alto padrão no litoral catarinense.",
    preferenciaLocalizacao: "Grande Florianópolis",
    categoriasEspecificas: ["Restaurante / Lanchonete", "Clinica Odontologica", "Hotel / Pousada"],
    faixaEtariaAlvo: ["36-45 anos", "46-60 anos", "Acima de 60"],
    generoAlvo: "Misto (equilibrado)",
    fotos: ["house1", "house2"],
  },
  {
    slug: "visao-clara",
    email: "otica@exemplo.com",
    avatar: "sandra",
    responsavel: "Sandra Melo",
    whatsapp: "(48) 99404-5050",
    nomeEmpresa: "Ótica Visão Clara",
    sigla: "VC", cor: "#134E4A", corDestaque: "#5A9BD3",
    categoria: "Saude e Bem-estar",
    instagramSite: "@oticavisaoclara",
    cep: "88101100", rua: "Av. Lédio João Martins", numero: "650", bairro: "Kobrasol", cidade: "São José", uf: "SC",
    oQueAnunciar: "Exame de vista grátis na compra de óculos completos",
    descricaoAnuncio: "Ótica com laboratório próprio e óculos prontos em 1 hora.",
    preferenciaLocalizacao: "Grande Florianópolis",
    categoriasEspecificas: ["Clinica Odontologica", "Padaria / Cafeteria"],
    faixaEtariaAlvo: ["36-45 anos", "46-60 anos", "Acima de 60"],
    generoAlvo: "Misto (equilibrado)",
    fotos: ["optic1"],
  },
  {
    slug: "codelab",
    email: "cursos@exemplo.com",
    avatar: "pedro",
    responsavel: "Pedro Henrique",
    whatsapp: "(48) 99505-6060",
    nomeEmpresa: "CodeLab Cursos de Tecnologia",
    sigla: "</>", cor: "#0B1220", corDestaque: "#22D3EE",
    categoria: "Educacao",
    instagramSite: "codelab.dev.br",
    cep: "88040000", rua: "Rua Delfino Conti", numero: "100", bairro: "Trindade", cidade: "Florianópolis", uf: "SC",
    oQueAnunciar: "Bootcamp de programação com empregabilidade garantida",
    descricaoAnuncio: "Escola de programação, dados e UX com turmas presenciais e online.",
    preferenciaLocalizacao: "Mesma cidade",
    categoriasEspecificas: ["Escritorio / Coworking", "Academia / Crossfit", "Escola / Curso"],
    faixaEtariaAlvo: ["18-25 anos", "26-35 anos"],
    generoAlvo: "Misto (equilibrado)",
    fotos: ["tech1"],
  },
  {
    slug: "credilha",
    email: "cooperativa@exemplo.com",
    avatar: "eduardo",
    responsavel: "Eduardo Lins",
    whatsapp: "(48) 99606-7070",
    nomeEmpresa: "Credilha Cooperativa",
    sigla: "CI", cor: "#064E3B", corDestaque: "#A3E635",
    categoria: "Financeiro",
    instagramSite: "credilha.coop.br",
    cep: "88010001", rua: "Rua Trajano", numero: "80", bairro: "Centro", cidade: "Florianópolis", uf: "SC",
    oQueAnunciar: "Crédito para pequenas empresas com as menores taxas da região",
    descricaoAnuncio: "Cooperativa de crédito com conta PJ gratuita e consultoria financeira.",
    preferenciaLocalizacao: "Grande Florianópolis",
    categoriasEspecificas: ["Supermercado / Mercearia", "Escritorio / Coworking", "Barbearia / Salao de Beleza"],
    faixaEtariaAlvo: ["26-35 anos", "36-45 anos", "46-60 anos"],
    generoAlvo: "Misto (equilibrado)",
    fotos: ["fin1"],
  },
];

// ─────────────────────────────────────────────────────────────
// ANÚNCIOS / CAMPANHAS
// ─────────────────────────────────────────────────────────────
export type StatusDemo = "ATIVO" | "PENDENTE" | "APROVADO" | "FILA_ESPERA" | "REJEITADO" | "PAUSADO" | "EXPIRADO";

export type DemoAnuncio = {
  slug: string;
  anunciante: string; // slug do anunciante
  ponto: string; // slug do ponto
  titulo: string;
  descricao: string;
  tipoMidia: "VIDEO" | "IMAGEM";
  status: StatusDemo;
  motivoRejeicao?: string;
  /** Dias desde o início da veiculação (para ATIVO/PAUSADO/EXPIRADO) */
  diasNoAr?: number;
  /** Arte: foto de fundo + textos */
  arte: {
    foto: string;
    chamada: string; // linha pequena acima do título
    titulo: string[]; // até 2 linhas
    subtitulo: string;
    oferta: string; // selo de destaque
    cta: string;
  };
};

export const ANUNCIOS: DemoAnuncio[] = [
  // ── ATIVOS ────────────────────────────────────────────────
  {
    slug: "meganutri-whey", anunciante: "meganutri", ponto: "iron-fitness", tipoMidia: "VIDEO", status: "ATIVO", diasNoAr: 14,
    titulo: "Whey Protein 100% Pure - 20% OFF",
    descricao: "Mostre esta tela no balcão da MegaNutri e ganhe 20% de desconto no Whey Protein.",
    arte: { foto: "supl2", chamada: "EXCLUSIVO PARA ALUNOS", titulo: ["Whey Protein", "100% Pure"], subtitulo: "Mais proteína, menos açúcar. Resultado de verdade.", oferta: "20% OFF", cta: "Mostre esta tela no balcão" },
  },
  {
    slug: "meganutri-creatina", anunciante: "meganutri", ponto: "iron-fitness", tipoMidia: "IMAGEM", status: "ATIVO", diasNoAr: 9,
    titulo: "Creatina Monohidratada Pura",
    descricao: "Creatina 300g com entrega no mesmo dia.",
    arte: { foto: "supl1", chamada: "FORÇA E PERFORMANCE", titulo: ["Creatina", "Monohidratada"], subtitulo: "300g pura, sem aditivos. Entrega no mesmo dia.", oferta: "R$ 79,90", cta: "Peça pelo WhatsApp (48) 99876-5432" },
  },
  {
    slug: "vida-ativa-colecao", anunciante: "vida-ativa", ponto: "iron-fitness", tipoMidia: "VIDEO", status: "ATIVO", diasNoAr: 6,
    titulo: "Coleção Fitness Verão 2027",
    descricao: "Nova coleção dry-fit com 15% de desconto na primeira compra.",
    arte: { foto: "fit1", chamada: "NOVA COLEÇÃO", titulo: ["Treine com", "estilo"], subtitulo: "Tecnologia dry-fit que acompanha cada movimento.", oferta: "15% OFF", cta: "Use o cupom IRON15" },
  },
  {
    slug: "autoprime-seminovos", anunciante: "autoprime", ponto: "villa-gourmet", tipoMidia: "VIDEO", status: "ATIVO", diasNoAr: 12,
    titulo: "Festival de Seminovos AutoPrime",
    descricao: "Taxa zero em até 36x e primeira parcela só em 2027. Agende seu test drive.",
    arte: { foto: "car1", chamada: "FESTIVAL DE SEMINOVOS", titulo: ["Taxa zero", "em até 36x"], subtitulo: "Primeira parcela só em 2027. Mais de 200 carros no estoque.", oferta: "TAXA 0%", cta: "Agende seu test drive" },
  },
  {
    slug: "ilha-prime-jurere", anunciante: "ilha-prime", ponto: "villa-gourmet", tipoMidia: "IMAGEM", status: "ATIVO", diasNoAr: 20,
    titulo: "Lançamento Jurerê Residence",
    descricao: "Casas de alto padrão a 300m do mar em Jurerê Internacional.",
    arte: { foto: "house1", chamada: "LANÇAMENTO", titulo: ["Jurerê", "Residence"], subtitulo: "Casas de 4 suítes a 300m do mar.", oferta: "A partir de R$ 3,2 mi", cta: "Agende uma visita" },
  },
  {
    slug: "visao-clara-exame", anunciante: "visao-clara", ponto: "odontocenter", tipoMidia: "IMAGEM", status: "ATIVO", diasNoAr: 8,
    titulo: "Exame de Vista Grátis",
    descricao: "Na compra de óculos completos, o exame de vista é por nossa conta.",
    arte: { foto: "optic1", chamada: "CUIDE DOS SEUS OLHOS", titulo: ["Exame de vista", "grátis"], subtitulo: "Na compra de óculos completos. Prontos em 1 hora.", oferta: "GRÁTIS", cta: "Kobrasol • (48) 99404-5050" },
  },
  {
    slug: "bem-estar-dermo", anunciante: "bem-estar", ponto: "odontocenter", tipoMidia: "VIDEO", status: "ATIVO", diasNoAr: 11,
    titulo: "Semana do Dermocosmético",
    descricao: "Até 30% de desconto em dermocosméticos e entrega grátis.",
    arte: { foto: "skin2", chamada: "SEMANA DO DERMO", titulo: ["Sua pele", "merece mais"], subtitulo: "Até 30% OFF nas melhores marcas. Entrega grátis.", oferta: "ATÉ 30% OFF", cta: "Delivery em até 40 min" },
  },
  {
    slug: "ilha-prime-campeche", anunciante: "ilha-prime", ponto: "odontocenter", tipoMidia: "VIDEO", status: "ATIVO", diasNoAr: 4,
    titulo: "Campeche Garden - Últimas unidades",
    descricao: "Casas com jardim e piscina no Campeche. Entrada facilitada.",
    arte: { foto: "house2", chamada: "ÚLTIMAS UNIDADES", titulo: ["Campeche", "Garden"], subtitulo: "Casas com jardim e piscina. Entrada facilitada.", oferta: "ENTRADA 10%", cta: "ilhaprimeimoveis.com.br" },
  },
  {
    slug: "autoprime-suv", anunciante: "autoprime", ponto: "don-corleone", tipoMidia: "IMAGEM", status: "ATIVO", diasNoAr: 10,
    titulo: "SUV 0 km AutoPrime",
    descricao: "SUV completo com primeira parcela para 2027.",
    arte: { foto: "car3", chamada: "SUV 0 KM", titulo: ["Espaço para", "toda aventura"], subtitulo: "Completo, automático e com garantia de 5 anos.", oferta: "1ª PARCELA EM 2027", cta: "Av. Ivo Silveira, 1400" },
  },
  {
    slug: "burger-combo", anunciante: "burger-house", ponto: "don-corleone", tipoMidia: "VIDEO", status: "ATIVO", diasNoAr: 7,
    titulo: "Combo Smash R$ 34,90",
    descricao: "Smash burger + fritas + refri. Peça pelo app ou WhatsApp.",
    arte: { foto: "burger1", chamada: "COMBO DA SEMANA", titulo: ["Smash Burger", "+ fritas + refri"], subtitulo: "Blend da casa no pão brioche. Delivery rápido.", oferta: "R$ 34,90", cta: "Peça: (48) 99202-3030" },
  },
  {
    slug: "forno-napoli-coworking", anunciante: "forno-di-napoli", ponto: "hub-ilha", tipoMidia: "VIDEO", status: "ATIVO", diasNoAr: 13,
    titulo: "Pizza Napolitana - Happy Hour",
    descricao: "Segunda pizza com 50% de desconto de segunda a quinta.",
    arte: { foto: "pizza1", chamada: "HAPPY HOUR", titulo: ["Pizza napolitana", "no forno a lenha"], subtitulo: "Massa de fermentação natural de 48 horas.", oferta: "2ª PIZZA 50% OFF", cta: "Seg a qui • @fornodinapoli" },
  },
  {
    slug: "codelab-bootcamp", anunciante: "codelab", ponto: "hub-ilha", tipoMidia: "IMAGEM", status: "ATIVO", diasNoAr: 5,
    titulo: "Bootcamp Full Stack",
    descricao: "Bootcamp de 6 meses com empregabilidade garantida.",
    arte: { foto: "tech1", chamada: "INSCRIÇÕES ABERTAS", titulo: ["Bootcamp", "Full Stack"], subtitulo: "6 meses, projetos reais e empregabilidade garantida.", oferta: "VAGAS LIMITADAS", cta: "codelab.dev.br" },
  },
  {
    slug: "burger-coworking", anunciante: "burger-house", ponto: "hub-ilha", tipoMidia: "IMAGEM", status: "ATIVO", diasNoAr: 3,
    titulo: "Almoço Burger House",
    descricao: "Entrega grátis para o Hub Coworking no horário de almoço.",
    arte: { foto: "burger1", chamada: "ALMOÇO SEM FILA", titulo: ["Entrega grátis", "aqui no Hub"], subtitulo: "Peça até 11h30 e receba na copa.", oferta: "FRETE GRÁTIS", cta: "@burgerhouse48" },
  },
  {
    slug: "forno-napoli-pousada", anunciante: "forno-di-napoli", ponto: "mar-azul", tipoMidia: "IMAGEM", status: "ATIVO", diasNoAr: 15,
    titulo: "Delivery para hóspedes",
    descricao: "Pizza napolitana entregue na sua suíte.",
    arte: { foto: "pizza1", chamada: "PARA HÓSPEDES", titulo: ["Pizza quentinha", "na sua suíte"], subtitulo: "Entregamos nos Ingleses em até 35 minutos.", oferta: "10% OFF", cta: "Cupom MARAZUL" },
  },
  {
    slug: "bem-estar-mercado", anunciante: "bem-estar", ponto: "bom-preco", tipoMidia: "IMAGEM", status: "ATIVO", diasNoAr: 9,
    titulo: "Vitaminas e Imunidade",
    descricao: "Linha completa de vitaminas com entrega grátis.",
    arte: { foto: "skin2", chamada: "IMUNIDADE EM DIA", titulo: ["Vitaminas para", "toda a família"], subtitulo: "Linha completa com entrega grátis em São José e Palhoça.", oferta: "LEVE 3 PAGUE 2", cta: "@drogariabemestar" },
  },
  {
    slug: "credilha-capital", anunciante: "credilha", ponto: "bom-preco", tipoMidia: "VIDEO", status: "ATIVO", diasNoAr: 16,
    titulo: "Crédito para seu negócio",
    descricao: "Capital de giro com as menores taxas da região.",
    arte: { foto: "fin1", chamada: "PARA PEQUENAS EMPRESAS", titulo: ["Capital de giro", "sem burocracia"], subtitulo: "As menores taxas da região e conta PJ gratuita.", oferta: "TAXAS DESDE 0,99%", cta: "credilha.coop.br" },
  },
  {
    slug: "vida-ativa-estetica", anunciante: "vida-ativa", ponto: "bella-estetica", tipoMidia: "IMAGEM", status: "ATIVO", diasNoAr: 6,
    titulo: "Leggings Dry-Fit",
    descricao: "Leggings com compressão e proteção UV.",
    arte: { foto: "fit2", chamada: "MAIS VENDIDA", titulo: ["Legging", "Dry-Fit Pro"], subtitulo: "Compressão, proteção UV e não fica transparente.", oferta: "R$ 129,90", cta: "@vidaativa.wear" },
  },
  {
    slug: "bem-estar-pet", anunciante: "bem-estar", ponto: "amigo-fiel", tipoMidia: "IMAGEM", status: "ATIVO", diasNoAr: 2,
    titulo: "Cuidado para toda a família",
    descricao: "Farmácia com entrega grátis no Pantanal.",
    arte: { foto: "skin2", chamada: "ENTREGA GRÁTIS", titulo: ["Saúde para", "toda a família"], subtitulo: "Delivery em até 40 minutos no Pantanal e região.", oferta: "FRETE GRÁTIS", cta: "(48) 99654-3210" },
  },
  {
    slug: "visao-clara-padaria", anunciante: "visao-clara", ponto: "pao-dourado", tipoMidia: "IMAGEM", status: "ATIVO", diasNoAr: 12,
    titulo: "Óculos prontos em 1 hora",
    descricao: "Laboratório próprio no Kobrasol.",
    arte: { foto: "optic1", chamada: "AQUI PERTINHO", titulo: ["Óculos prontos", "em 1 hora"], subtitulo: "Laboratório próprio, a 2 quadras daqui.", oferta: "10x SEM JUROS", cta: "Av. Lédio João Martins, 650" },
  },

  // ── EM MODERAÇÃO / OUTROS STATUS ─────────────────────────
  {
    slug: "codelab-academia", anunciante: "codelab", ponto: "iron-fitness", tipoMidia: "VIDEO", status: "PENDENTE",
    titulo: "Aprenda a programar em 6 meses",
    descricao: "Bootcamp de programação com turmas noturnas.",
    arte: { foto: "tech1", chamada: "TURMAS NOTURNAS", titulo: ["Mude de carreira", "em 6 meses"], subtitulo: "Aprenda programação do zero com mentoria.", oferta: "BOLSAS DE 40%", cta: "codelab.dev.br" },
  },
  {
    slug: "ilha-prime-pousada", anunciante: "ilha-prime", ponto: "mar-azul", tipoMidia: "IMAGEM", status: "PENDENTE",
    titulo: "Seu imóvel na Ilha",
    descricao: "Imóveis de alto padrão no litoral catarinense para quem se apaixonou por Floripa.",
    arte: { foto: "house1", chamada: "APAIXONOU POR FLORIPA?", titulo: ["Seu imóvel", "na Ilha"], subtitulo: "Casas e apartamentos de alto padrão perto do mar.", oferta: "CONSULTORIA GRÁTIS", cta: "ilhaprimeimoveis.com.br" },
  },
  {
    slug: "meganutri-barbearia", anunciante: "meganutri", ponto: "don-corleone", tipoMidia: "IMAGEM", status: "PENDENTE",
    titulo: "Kit Hipertrofia MegaNutri",
    descricao: "Whey + creatina + coqueteleira com preço especial.",
    arte: { foto: "supl1", chamada: "KIT HIPERTROFIA", titulo: ["Whey + Creatina", "+ Coqueteleira"], subtitulo: "Tudo o que você precisa para evoluir no treino.", oferta: "R$ 199,90", cta: "@meganutri" },
  },
  {
    slug: "autoprime-coworking", anunciante: "autoprime", ponto: "hub-ilha", tipoMidia: "IMAGEM", status: "APROVADO",
    titulo: "Seminovos para quem trabalha na Trindade",
    descricao: "Condições especiais para profissionais do Hub. Aguardando pagamento PIX.",
    arte: { foto: "car1", chamada: "CONDIÇÃO ESPECIAL", titulo: ["Seu próximo carro", "está aqui"], subtitulo: "Avaliamos seu usado na hora. Taxa zero em 36x.", oferta: "TAXA 0%", cta: "autoprimeveiculos.com.br" },
  },
  {
    slug: "bem-estar-restaurante", anunciante: "bem-estar", ponto: "villa-gourmet", tipoMidia: "IMAGEM", status: "FILA_ESPERA",
    titulo: "Protetor Solar com 25% OFF",
    descricao: "Linha completa de proteção solar para o verão.",
    arte: { foto: "skin2", chamada: "VERÃO 2027", titulo: ["Proteja sua pele", "neste verão"], subtitulo: "Linha completa de protetores solares.", oferta: "25% OFF", cta: "@drogariabemestar" },
  },
  {
    slug: "credilha-academia", anunciante: "credilha", ponto: "iron-fitness", tipoMidia: "IMAGEM", status: "FILA_ESPERA",
    titulo: "Conta PJ gratuita",
    descricao: "Abra sua conta PJ sem tarifas.",
    arte: { foto: "fin1", chamada: "PARA EMPREENDEDORES", titulo: ["Conta PJ", "sem tarifas"], subtitulo: "Pix ilimitado, boletos e maquininha com taxa baixa.", oferta: "TARIFA ZERO", cta: "credilha.coop.br" },
  },
  {
    slug: "forno-napoli-restaurante", anunciante: "forno-di-napoli", ponto: "villa-gourmet", tipoMidia: "IMAGEM", status: "REJEITADO",
    motivoRejeicao: "O estabelecimento não aceita anúncios de restaurantes concorrentes na mesma região.",
    titulo: "Rodízio de Pizza",
    descricao: "Rodízio de pizza napolitana todas as noites.",
    arte: { foto: "pizza1", chamada: "TODAS AS NOITES", titulo: ["Rodízio de", "pizza napolitana"], subtitulo: "Mais de 25 sabores no forno a lenha.", oferta: "R$ 69,90", cta: "@fornodinapoli" },
  },
  {
    slug: "credilha-barbearia", anunciante: "credilha", ponto: "don-corleone", tipoMidia: "IMAGEM", status: "PAUSADO", diasNoAr: 10,
    titulo: "Maquininha com taxa baixa",
    descricao: "Maquininha para autônomos com taxa a partir de 0,99%.",
    arte: { foto: "fin1", chamada: "PARA AUTÔNOMOS", titulo: ["Maquininha", "com taxa baixa"], subtitulo: "Receba no mesmo dia, sem aluguel.", oferta: "DESDE 0,99%", cta: "credilha.coop.br" },
  },
  {
    slug: "meganutri-restaurante", anunciante: "meganutri", ponto: "villa-gourmet", tipoMidia: "IMAGEM", status: "EXPIRADO", diasNoAr: 40,
    titulo: "Vitaminas MegaNutri",
    descricao: "Campanha de vitaminas encerrada.",
    arte: { foto: "supl1", chamada: "SAÚDE EM DIA", titulo: ["Multivitamínico", "MegaNutri"], subtitulo: "Energia e imunidade para o dia a dia.", oferta: "R$ 49,90", cta: "@meganutri" },
  },
];
