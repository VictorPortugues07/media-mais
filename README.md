# Media+ — Plataforma de Mídia Indoor Inteligente

Plataforma completa de publicidade indoor digital (Digital Out-Of-Home / DOOH) desenvolvida em **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4** e **Prisma ORM 7** com **PostgreSQL**. Conecta comércios físicos que possuem televisores a anunciantes locais, permitindo veiculação de anúncios em loop contínuo, com som ativo e auditoria em tempo real (*Proof of Play*).

---

## Sumário

1. [Visão Geral e Proposta de Valor](#visão-geral)
2. [Stack Tecnológica](#stack-tecnológica)
3. [Perfis de Usuários e Permissões](#perfis-de-usuários)
4. [Mapa Completo de Rotas](#mapa-de-rotas)
   - [Páginas Públicas e Autenticação](#páginas-públicas)
   - [Painel do Anunciante](#painel-do-anunciante)
   - [Painel do Dono de TV (Ponto)](#painel-do-dono-de-tv)
   - [Painel do Administrador](#painel-do-administrador)
   - [Endpoints de API (Backend)](#endpoints-de-api)
5. [Fluxos do Sistema](#fluxos-do-sistema)
   - [Fluxo 1: Quem Quer Anunciar (Anunciante)](#fluxo-anunciante)
   - [Fluxo 2: Quem Tem TV (Dono de Ponto)](#fluxo-ponto)
   - [Fluxo 3: Player da Smart TV & Pareamento](#fluxo-player)
   - [Fluxo 4: Moderação e Auditoria (Admin)](#fluxo-admin)
6. [Regras de Negócio e Diferenciais Técnicos](#diferenciais-técnicos)
7. [Modelo de Banco de Dados (Prisma)](#modelo-de-dados)
8. [Configuração, Variáveis de Ambiente e Instalação](#instalação)

---

## 1. Visão Geral <a id="visão-geral"></a>

A **Media+** atende dois públicos principais sem atritos e sem cobrança de mensalidades fixas de adesão:
- **Anunciantes / Marcas:** encontram estabelecimentos estratégicos no mapa (restaurantes, cafés, clínicas, academias, etc.), enviam suas peças publicitárias (vídeo com áudio ou imagem) e acompanham em tempo real o total de exibições e o tempo acumulado no ar.
- **Estabelecimentos / Donos de TV:** integram suas Smart TVs à rede diretamente pelo navegador web da própria televisão em 30 segundos, sem necessidade de comprar nenhum hardware externo, reprodutor ou TV Box.

---

## 2. Stack Tecnológica <a id="stack-tecnológica"></a>

| Camada | Tecnologia | Detalhes |
|---|---|---|
| **Framework Full-Stack** | Next.js 16.3.3 (App Router & Turbopack) | Server Actions, Route Handlers, Middlewares |
| **Biblioteca de Interface** | React 19.2.8 | Client Components reativos com hooks modernos |
| **Estilização** | Tailwind CSS v4 | Tokens `@theme inline`, design system próprio |
| **ORM / Banco de Dados** | Prisma 7.10.0 (`@prisma/adapter-pg`) | PostgreSQL nativo com pool de conexões `pg` |
| **Autenticação & Segurança** | Jose (JWT) + BcryptJS | Tokens assinados com expiração e cookies `HttpOnly` |
| **Mapas Interativos** | Leaflet 1.9.4 + OpenStreetMap | Marcadores customizados de fotos dos estabelecimentos |
| **Geração de QR Code** | qrcode 1.5.4 | QR codes dinâmicos para pareamento e conversão na TV |
| **Processamento de Mídia** | Sharp 0.35.4 | Processamento e otimização de imagens |
| **Validação de Schemas** | Zod 4.5.4 | Validação estrita de entradas em todas as rotas de API |

---

## 3. Perfis de Usuários e Permissões <a id="perfis-de-usuários"></a>

O sistema opera com autenticação JWT baseada em cookies seguros (`mm_session`) e verificação em nível de middleware (`src/proxy.ts`):

1. **`ANUNCIANTE`:**
   - Visualiza dashboard com contagem de anúncios ativos, pendentes e rejeitados.
   - Acessa o mapa interativo de pontos e filtra por cidade/bairro.
   - Cria novos anúncios vinculados a pontos específicos (upload de vídeo ou imagem).
   - Gerencia suas notificações em tempo real.
   - Acessa a aba **Usuário** na barra lateral para editar foto de perfil, dados de contato e senha.

2. **`PONTO` (Dono do Estabelecimento com TV):**
   - Visualiza dashboard com código temporário de 6 dígitos renovado a cada 30 segundos.
   - Acompanha o status online/offline da TV em tempo real (tolerância calibrada para 12s).
   - Visualiza a grade de anúncios que estão passando na sua tela.
   - Acessa a aba **Usuário** na barra lateral para alterar dados de acesso, foto de perfil, horários de funcionamento e fotos do espaço.

3. **`ADMIN`:**
   - Acesso irrestrito a todos os dados da plataforma.
   - Painel com KPIs gerais, monitor de telas em tempo real e auditoria *Proof of Play*.
   - Fila de moderação para aprovar ou rejeitar anúncios com justificativa obrigatória.
   - Gestão de estabelecimentos (aprovação, ativação e desativação de pontos).
   - Gestão de anunciantes e controle de usuários cadastrados (bloqueio/desbloqueio e envio de notificações manuais).
   - Acessa a aba **Usuário** na barra lateral para gerenciar suas credenciais de administrador.

4. **`TV_PLAYER` (Sessão Pareada na TV):**
   - Dispositivo pareado via código de 6 números que recebe token assinado de sessão (`pairToken`).
   - Não requer login convencional de usuário.
   - Envia telemetria contínua a cada 4 segundos e consome a playlist do ponto.

---

## 4. Mapa Completo de Rotas <a id="mapa-de-rotas"></a>

### Páginas Públicas e Autenticação <a id="páginas-públicas"></a>
- `/` — Página inicial (Landing Page com diferenciação clara dos dois perfis e moldura padrão do player).
- `/login` — Tela de autenticação unificada com redirecionamento automático por perfil.
- `/cadastro/anunciante` — Formulário de registro para marcas e empresas anunciantes.
- `/cadastro/ponto` — Formulário de registro para estabelecimentos que possuem televisores.
- `/player` — Player oficial da Smart TV (tela de digitação por controle remoto e exibição em tela cheia).
- `/tv/[pontoId]` — Canal de transmissão direto (protegido por sessão do proprietário ou admin).

### Painel do Anunciante (`/anunciante/*`) <a id="painel-do-anunciante"></a>
- `/anunciante/dashboard` — Métricas de campanhas ativas, em moderação, rejeitadas e total de exibições.
- `/anunciante/mapa` — Mapa interativo com todas as TVs parceiras ativas, fotos do espaço e dados de público.
- `/anunciante/anuncios/novo` — Formulário de envio de novas campanhas (tempo detectado automaticamente).
- `/anunciante/notificacoes` — Central completa de notificações da conta.
- `/anunciante/perfil` — Aba **Usuário** na barra lateral com foto de perfil, credenciais e dados da marca.

### Painel do Dono de TV (`/ponto/*`) <a id="painel-do-dono-de-tv"></a>
- `/ponto/dashboard` — Central da TV com código rotativo de 30s, QR code, status online ao vivo e KPIs.
- `/ponto/anuncios` — Lista completa das campanhas ativas veiculadas na tela do televisor.
- `/ponto/notificacoes` — Mensagens de sistema, avisos de conexão e novidades.
- `/ponto/perfil` — Aba **Usuário** na barra lateral com foto de perfil, senha, horários de funcionamento e fotos do ponto.

### Painel do Administrador (`/admin/*`) <a id="painel-do-administrador"></a>
- `/admin/dashboard` — Auditoria geral da rede, monitor de telas em tempo real e relatório de campanhas.
- `/admin/aprovacoes` — Fila de moderação de anúncios pendentes com preview em vídeo e aprovação protegida.
- `/admin/pontos` — Listagem, filtro e ativação/desativação de estabelecimentos parceiros.
- `/admin/anunciantes` — Listagem com contagem de campanhas e contato de anunciantes.
- `/admin/usuarios` — Gestão de todas as contas da plataforma, suspensão e notificações manuais.
- `/admin/perfil` — Aba **Usuário** na barra lateral para edição de acesso e foto de perfil do administrador.

### Endpoints de API (Backend) <a id="endpoints-de-api"></a>

#### Autenticação & Perfil
- `POST /api/auth/register` — Criação de conta com hash bcrypt.
- `POST /api/auth/login` — Autenticação e emissão de cookie JWT `mm_session`.
- `POST /api/auth/logout` — Destruição da sessão e limpeza de cookies.
- `GET /api/auth/me` — Dados do usuário logado (nome, email, avatarUrl, dados vinculados).
- `PUT /api/auth/me` — Atualização de dados de acesso e foto de perfil (`avatarUrl`).

#### Transmissão & Smart TV Player
- `GET /api/tv/parear` — Valida o código numérico de 6 dígitos, gera o `pairToken` e entrega a playlist. Com `token`, entrega atualizações seguras de playlist.
- `POST /api/tv/telemetria` — Recebe heartbeat (a cada 4s), registro de exibição finalizada (*Proof of Play*) ou sinal de `offline: true` (via `navigator.sendBeacon` ao fechar a tela).
- `POST /api/ponto/codigo-rotativo` — Gera e armazena novo código temporário de 6 dígitos com expiração de 30s.
- `GET /api/tv/[pontoId]` — Canal protegido para visualização da grade pelo proprietário ou administrador.

#### Campanhas & Anúncios
- `GET /api/anuncios` — Lista anúncios filtrados por perfil do usuário logado.
- `POST /api/anuncios` — Cria novo anúncio vinculado a um ponto e notifica os administradores.
- `GET /api/anuncios/[id]` — Detalhes do anúncio com proteção estrita de acesso por URL.
- `PATCH /api/anuncios/[id]/aprovar` — Aprovação do anúncio pelo administrador (dispara notificações para ambas as partes).
- `PATCH /api/anuncios/[id]/rejeitar` — Rejeição do anúncio com registro de justificativa.

#### Estabelecimentos & Dados
- `GET /api/pontos` — Lista estabelecimentos ativos para o mapa com geolocalização.
- `PATCH /api/pontos/[id]` — Atualização de status do ponto (`ATIVO`, `INATIVO`, `PENDENTE`).
- `GET /api/ponto/perfil` & `PUT /api/ponto/perfil` — Leitura e edição de dados do estabelecimento e usuário.
- `GET /api/anunciante/perfil` & `PUT /api/anunciante/perfil` — Leitura e edição de dados do anunciante e usuário.

#### Estatísticas & Notificações
- `GET /api/stats` — Métricas calculadas sob medida para o perfil do usuário logado.
- `GET /api/notificacoes` — Histórico de mensagens do usuário.
- `PATCH /api/notificacoes/[id]/ler` — Marcação de leitura individual.
- `GET /api/notificacoes/stream` — Conexão SSE (*Server-Sent Events*) para entrega de notificações em tempo real.
- `POST /api/upload` — Upload seguro de arquivos (vídeos MP4/WebM e imagens PNG/JPG/WebP).

---

## 5. Fluxos do Sistema <a id="fluxos-do-sistema"></a>

### Fluxo do Anunciante <a id="fluxo-anunciante"></a>
```
Cadastro / Login
       │
       ▼
Explora o Mapa de Telas (/anunciante/mapa)
  • Filtra por cidade e bairro
  • Avalia fotos do espaço e perfil do público
       │
       ▼
Cria a Campanha (/anunciante/anuncios/novo)
  • Seleciona vídeo ou imagem
  • Duração calculada automaticamente pelo arquivo
       │
       ▼
Fila de Moderação da Media+ (Status: PENDENTE)
       │
       ├──────────────────────────────┐
       ▼                              ▼
Aprovado pelo Admin          Rejeitado com Motivo
  • Entra na transmissão da TV   • Anunciante avisado para corrigir
  • Status: Tocando Ao Vivo
```

### Fluxo do Dono de Ponto <a id="fluxo-ponto"></a>
```
Cadastro do Estabelecimento (/cadastro/ponto)
       │
       ▼
Acessa o Painel do Ponto (/ponto/dashboard)
  • Vê o Código de Conexão (renovado a cada 30s)
  • Acompanha status da TV em tempo real (Ao Vivo vs Aguardando)
       │
       ▼
Abre a Smart TV
  • No navegador da TV acessa: /player
  • Digita os 6 números com o controle remoto
       │
       ▼
TV Conectada e Transmitindo
  • Rotação sequencial contínua com som ativo
  • Heartbeat a cada 4s mantém o painel atualizado sem delay
```

### Fluxo do Player da Smart TV <a id="fluxo-player"></a>
1. **Abertura:** O estabelecimento abre o navegador nativo da Smart TV (Tizen, webOS, Android TV, Fire TV) na URL `/player`.
2. **Entrada de Dígitos por Controle Remoto:**
   - **Teclas numéricas físicas:** Pressionar `0 a 9` no controle remoto preenche os números instantaneamente via listener global.
   - **Navegação por setas (D-pad):** Teclado virtual na tela com foco ampliado (`focus:ring-4 focus:bg-blue-600 focus:scale-105`) e botão de confirmação.
   - **Prevenção de teclado nativo:** Exibição em caixas grandes de leitura à distância sem abrir o teclado virtual invasivo da TV.
3. **Conexão:** Envio do código de 6 dígitos para `/api/tv/parear`, recebimento da playlist e do `pairToken`.
4. **Reprodução & Áudio:**
   - A tag `<video>` reproduz com som habilitado nativamente (`volume = 1`, `muted = false`).
   - Destravamento contínuo em qualquer clique ou interação caso o navegador da TV exija política de *Autoplay*.
   - Resiliência automática: se houver apenas 1 anúncio, ele reinicia em loop contínuo sem travar. Se houver múltiplos, alternam no término ou por tempo configurado.
5. **Telemetria Instantânea:**
   - Heartbeat contínuo a cada 4 segundos.
   - Se o player for fechado ou a TV desligada, o evento `beforeunload` dispara `navigator.sendBeacon` com `offline: true`, atualizando o status no painel imediatamente.

---

## 6. Regras de Negócio e Diferenciais Técnicos <a id="diferenciais-técnicos"></a>

- **Sem Referências a Qualidade de Vídeo:** O foco do produto é na simplicidade, áudio contínuo e transmissão garantida, sem jargões de resolução.
- **Proteção Estrita de Links e URLs:** Não é possível acessar anúncios ou canais de TV alterando o ID na URL. O sistema valida posse por ID de usuário e exige `pairToken` assinado para sincronização.
- **Detecção de TV Online Sem Delay:** O backend considera o televisor online dentro de uma janela de 12 segundos (baseada nos heartbeats de 4s). O painel do estabelecimento consulta o status a cada 3 segundos.
- **Abas "Usuário" Dedicadas:** Todas as edições de acesso, dados cadastrais e upload de foto de perfil ficam centralizadas na opção **Usuário** da barra de navegação lateral.
- **Suporte ao Cliente:** Canal direto via WhatsApp integrado no rodapé da TV e na plataforma: `(48) 98879-6514`.

---

## 7. Modelo de Banco de Dados (Prisma) <a id="modelo-de-dados"></a>

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  senha     String
  nome      String
  whatsapp  String
  avatarUrl String?  @map("avatar_url")
  role      UserRole // ADMIN, PONTO, ANUNCIANTE
  ativo     Boolean  @default(true)
  criadoEm  DateTime @default(now())

  pontoMidia   PontoMidia?
  anunciante   Anunciante?
  notificacoes Notificacao[]
}

model PontoMidia {
  id                   Int         @id @default(autoincrement())
  userId               Int         @unique
  codigoTv             String?     @unique
  nomeEmpresa          String
  responsavel          String
  whatsapp             String
  cep                  String
  rua, numero, bairro  String
  cidade, uf           String
  categoria, descricao String
  quantidadeTvs        Int?
  fluxoDiarioEstimado  String
  tempoPermanencia     String
  faixaEtariaPublico   String[]
  generoPublico        String
  horarioAbertura      String?     @default("08:00")
  horarioFechamento    String?     @default("19:00")
  diasFuncionamento    String[]
  codigoRotativo       String?
  codigoRotativoExpira DateTime?
  fotos                String[]
  lat, lng             Float?
  status               StatusPonto // PENDENTE, ATIVO, INATIVO
  ultimaAtividade      DateTime?

  anuncios          Anuncio[]
  registroExibicoes RegistroExibicao[]
}

model Anunciante {
  id          Int      @id @default(autoincrement())
  userId      Int      @unique
  nomeEmpresa String
  responsavel String
  whatsapp    String
  logoUrl     String?
  fotos       String[]
  cidade, uf  String
  categoria   String
  anuncios    Anuncio[]
}

model Anuncio {
  id              Int           @id @default(autoincrement())
  anuncianteId    Int
  pontoMidiaId    Int
  titulo          String
  descricao       String
  tipoMidia       TipoMidia     // VIDEO, IMAGEM
  midiaUrl        String
  duracaoSegundos Int           @default(10)
  status          StatusAnuncio // PENDENTE, ATIVO, PAUSADO, REJEITADO
  motivoRejeicao  String?
  criadoEm        DateTime      @default(now())

  registroExibicoes RegistroExibicao[]
}

model RegistroExibicao {
  id              Int       @id @default(autoincrement())
  anuncioId       Int
  pontoMidiaId    Int
  duracaoSegundos Int
  tipoMidia       TipoMidia
  exibidoEm       DateTime  @default(now())
}
```

---

## 8. Configuração, Variáveis de Ambiente e Instalação <a id="instalação"></a>

### Pré-requisitos
- Node.js 18+ (recomendado Node 20 LTS).
- Banco de dados PostgreSQL (local ou em nuvem).

### Arquivo de Configuração (`.env`)
Crie ou edite o arquivo `.env` na raiz do projeto:
```env
# Conexão com o PostgreSQL
DATABASE_URL="postgresql://usuario:senha@localhost:5432/mediamais?schema=public"

# Chave secreta para assinatura dos tokens de sessão e Smart TV
AUTH_SECRET="mediamais_plataforma_secret_2026_super_seguro"

# Ambiente
NODE_ENV="development"
```

### Comandos de Instalação e Execução

```bash
# 1. Instalar dependências
npm install

# 2. Sincronizar o banco de dados com o schema do Prisma
npx prisma db push

# 3. Executar o servidor de desenvolvimento
npm run dev

# 4. Executar verificação estática de tipos
npx tsc --noEmit

# 5. Criar build otimizado de produção
npm run build

# 6. Iniciar servidor em produção
npm run start
```

---

## 9. Pipeline de Segurança (DevSecOps) <a id="devsecops"></a>

O arquivo `script.sh` na raiz executa a esteira de verificação de segurança do
projeto. Todas as ferramentas rodam em container com tag fixa — nada é
instalado na máquina. O único pré-requisito é Docker em execução e `jq`.

```bash
./script.sh                    # esteira completa (as 5 etapas)
./script.sh --skip-dast        # rápido: sem subir banco nem compilar a aplicação
./script.sh --stage sast,deps  # apenas as etapas indicadas
./script.sh --dast-full        # varredura ativa do ZAP (lenta, envia payloads reais)
./script.sh --help             # todas as opções
```

### Etapas e ferramentas

| Etapa | Ferramenta | O que cobre |
|---|---|---|
| `secrets` | **Gitleaks** | Credenciais no código e em todo o histórico do Git |
| `sast` | **Semgrep** | Análise estática: 10 conjuntos públicos + regras próprias do projeto |
| `deps` | **npm audit**, **OSV-Scanner**, **Trivy** | Vulnerabilidades em dependências, segredos e má configuração |
| `sbom` | **Syft** + **Grype** | Inventário de componentes (CycloneDX e SPDX) e vulnerabilidades nele |
| `dast` | **OWASP ZAP** | Varredura da aplicação em execução, contra um banco efêmero |

Todas são de código aberto.

### Regras específicas do projeto

As regras padrão das ferramentas não detectam os defeitos próprios desta base
de código — por exemplo, o segredo de assinatura embutido não tem formato de
credencial conhecida e passa despercebido por qualquer varredura genérica.
Por isso há dois arquivos de configuração dedicados:

- **`.security/gitleaks.toml`** — segredo de sessão embutido, string de conexão
  com credenciais, senhas de seed e o padrão `process.env.X || "literal"`.
- **`.security/semgrep-mediamais.yml`** — 10 regras, cada uma correspondente a
  um defeito real encontrado na auditoria de risco: `$executeRawUnsafe`, HTML
  interpolado injetado no DOM, extensão de arquivo controlada pelo cliente,
  `<video autoPlay>` sem `muted`, `onDelete: Cascade` na tabela de comprovação
  de veiculação, bloco `catch` vazio, entre outros.

O objetivo dessas regras é impedir que esses defeitos voltem em alterações
futuras. Ao corrigir um deles, a regra correspondente passa a proteger a
correção.

### Relatórios

```
security-reports/<timestamp>/   # saídas brutas por ferramenta (JSON/SARIF/HTML)
security-reports/latest/        # link para a execução mais recente
security-reports/latest/summary.md     # resumo consolidado legível
security-reports/latest/summary.json   # resumo consolidado para automação
```

O diretório é ignorado pelo Git. O `semgrep.sarif` pode ser enviado a qualquer
ferramenta de code scanning, e o SBOM sai em CycloneDX e SPDX.

### Códigos de saída

| Código | Significado |
|--:|---|
| `0` | Todas as etapas executaram e não houve achado no nível de reprovação |
| `1` | Achados no nível de `--fail-on` ou acima (padrão: `high`) |
| `2` | Uma etapa **falhou ao executar** — a varredura não aconteceu |
| `3` | Alguma etapa foi pulada e `--require-all` estava ativo |

O código `2` é intencionalmente distinto de `1`: ferramenta que não rodou nunca
é tratada como aprovação. Pela mesma razão, a etapa de análise estática reprova
quando algum arquivo não pôde ser analisado — cobertura parcial não é sucesso.

Em automação, use `--require-all` para que etapa pulada também reprove.

---

## Suporte

Para dúvidas sobre a plataforma, parcerias ou suporte de Smart TVs:
- **WhatsApp Oficial:** `(48) 98879-6514`
- **Atendimento:** Segunda a Sexta-feira em horário comercial
