# Media+ — Documentação Central de Arquitetura, Regras de Negócio e Migração Java

Bem-vindo ao índice mestre da plataforma **Media+** (DOOH — Digital Out-Of-Home).
Este repositório documental foi estruturado para fornecer visão integral, detalhada e padronizada do sistema, permitindo que desenvolvedores e agentes de IA (como OpenCode, Claude, Antigravity) compreendam perfeitamente cada regra, modelo, protocolo e fluxo antes e durante a construção do backend em **Java 21 / Spring Boot 3.3+**.

---

## 🏗️ Pilares da Arquitetura Alvo

- **Linguagem & Framework:** Java 21 LTS + Spring Boot 3.3.x+.
- **Banco de Dados:** PostgreSQL Hospedado em Nuvem (Supabase, Neon, AWS RDS) com migrações gerenciadas via **Flyway** (sem dependência de Prisma).
- **Armazenamento de Vídeos e Imagens:** **Cloudflare R2** (S3-compatible, *zero egress fees*, presigned URLs e CDN global de alta performance para Smart TVs).
- **Autenticação & Segurança:** **OAuth2 / OIDC** (Google, Apple, Provedor OIDC) via Spring Security 6, com protocolo de pareamento de dispositivo via código de 6 dígitos e `pairToken` assinado para o Smart TV Player.
- **Pagamentos & Faturamento:** **API AbacatePay** (Pix instantâneo QR Code / Copia e Cola, cobranças de cotas mensais, webhooks com assinatura HMAC e split de 50% de repasse ao dono da TV).
- **Transmissão & Auditoria:** Loop contínuo de 360 segundos (6 minutos) por TV, batimento cardíaco a cada 4 segundos (tolerância de 12s para TV Offline) e auditoria física imutável (*Proof of Play*).

---

## 🗺️ Mapa de Navegação Rápida

```
docs/
├── README.md                                         # Índice mestre (este arquivo)
├── agents/                                           # Definição e prompts dos Agentes Especializados
│   ├── agent-domain-architect.md                     # Arquiteto de Domínio, Cotas, Tiers e AbacatePay
│   ├── agent-iot-streaming.md                        # Engenheiro de Streaming e Protocolo Smart TV (R2)
│   ├── agent-security-auditor.md                     # Auditor de Segurança, OAuth2, Webhooks e Anti-IDOR
│   └── agent-java-engineer.md                        # Engenheiro de Backend Java 21 & Spring Boot 3
├── skills/ & .agents/skills/                         # Habilidades operacionais padronizadas
│   ├── skill-mediamais-domain-rules/SKILL.md         # Regras de precificação, scoring, capacidade e faturamento
│   ├── skill-mediamais-tv-iot-protocol/SKILL.md      # Pareamento rotativo (30s), telemetria (4s) e Proof of Play
│   ├── skill-mediamais-security-rbac/SKILL.md        # Permissões, isolamento de inquilinos, OAuth2 e webhooks
│   ├── skill-mediamais-cloudflare-r2/SKILL.md        # Presigned URLs S3 e streaming de mídia via Cloudflare R2
│   ├── skill-mediamais-payments-abacatepay/SKILL.md  # Faturamento Pix, webhooks e split de 50% via AbacatePay
│   └── skill-mediamais-java-migration/SKILL.md       # Diretrizes do ecossistema Java, Spring Boot 3 e Flyway
├── specs/                                            # Especificações técnicas e contratos normativos
│   ├── SPEC-01-domain-data-model.md                  # Entidades, enums, índices e DDLs para PostgreSQL hospedado
│   ├── SPEC-02-campaign-lifecycle.md                 # Máquina de estados, moderação, faturamento e expiração
│   ├── SPEC-03-capacity-and-pricing.md               # Motor de 360s, fila de espera e matriz de tiers/preços
│   ├── SPEC-04-tv-pairing-and-telemetry.md           # Protocolo Smart TV, tokens, CDN R2 e heartbeat (4s)
│   ├── SPEC-05-auth-and-security.md                  # OAuth2/OIDC, sessões, HMAC de webhooks e presigned URLs
│   └── SPEC-06-api-catalog-and-events.md             # Catálogo REST, checkout Pix, webhooks e streaming SSE
├── flows/                                            # Fluxos detalhados de ponta a ponta (E2E)
│   ├── FLOW-01-ponto-onboarding.md                   # Cadastro do estabelecimento e configuração da TV
│   ├── FLOW-02-anunciante-campaign.md                # Upload no R2, aprovação, checkout Pix AbacatePay e ativação
│   ├── FLOW-03-smart-tv-runtime.md                   # Experiência de pareamento no player e streaming contínuo
│   └── FLOW-04-admin-moderation-audit.md             # Aprovação de anúncios, faturamento e auditoria Proof of Play
├── migrations/                                       # Scripts DDL para Banco PostgreSQL Hospedado
│   └── V1__initial_schema.sql                        # Script Flyway inicial consolidado e auditado
├── java-architecture-roadmap.md                      # Roteiro técnico, pom.xml, application.yml e SecurityConfig
└── java-engineering-guidelines.md                    # Diretrizes de SOLID, Ports & Adapters e 7 Camadas de Segurança
```

---

## 🧭 Como Agentes e IAs Devem Operar Neste Projeto

1. **Consulta Obrigatória das SPECs:** Antes de propor ou gerar código Java, consulte a respectiva **SPEC** e o **Flow** correspondente.
2. **Invariantes Invioláveis:**
   - **Grade Máxima e Slot Hold:** 360 segundos por tela. Ao gerar Pix de cota na AbacatePay, a vaga é pré-bloqueada por 60 minutos (`reserva_expira_em`), garantindo ativação imediata pós-pagamento sem risco de race condition.
   - **Heartbeat & Anti-Write Bloat:** Pulso de 4 segundos armazenado em Cache (Caffeine/Redis); TV considerada Offline após 12 segundos sem sinal; persistência em banco relacional apenas em transições de conexão ou lote a cada 5 min.
   - **Código Rotativo:** 6 números, expira em 30 segundos.
   - **Proof of Play:** Inserção em lotes (`saveAll()`), imutável, `ON DELETE RESTRICT`, rejeita navegadores mobile.
   - **Mídia:** Presigned URLs para Cloudflare R2 com codificação obrigatória H.264/AAC e faststart para Smart TVs.
   - **Pagamento:** Webhook AbacatePay com validação de assinatura HMAC-SHA256 (`abacate-signature`).
