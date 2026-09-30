---
name: skill-mediamais-java-migration
description: Guia de arquitetura e padrões para desenvolvimento do backend da Media+ em Java 21 com Spring Boot 3.3, Flyway, PostgreSQL hospedado, Cloudflare R2, AbacatePay e OAuth2.
---

# Skill: Arquitetura e Engenharia Java 21 (Media+)

Esta skill documenta as diretrizes arquiteturais para o backend da Media+ no ecossistema Java moderno.

## 1. Stack Tecnológica Alvo

- **Linguagem:** Java 21 LTS (Records, Pattern Matching, Virtual Threads / Loom).
- **Framework:** Spring Boot 3.3.x+.
- **Persistência:** Spring Data JPA + Hibernate 6 + HikariCP.
- **Banco de Dados:** PostgreSQL Hospedado (Supabase, Neon, AWS RDS, etc.).
- **Versionamento de Banco:** Flyway (scripts `V1__init.sql`, etc. sem Prisma).
- **Segurança:** Spring Security 6 (OAuth2 Client, OIDC, JWT Resource Server).
- **Storage de Mídia:** AWS S3 SDK v2 (`software.amazon.awssdk:s3`) integrado ao **Cloudflare R2**.
- **Pagamentos:** Spring `RestClient` consumindo a API **AbacatePay**.
- **Eventos em Tempo Real:** Spring WebMVC `SseEmitter` para notificações ao vivo.
- **Testes:** JUnit 5, Mockito, AssertJ, Testcontainers (PostgreSQL).

---

## 2. Estrutura Canônica de Pacotes

```
com.mediamais.platform/
├── config/                  # SecurityConfig, R2Config, AbacatePayConfig, WebMvcConfig
├── domain/                  # Entidades JPA e Enums
│   ├── enums/               # UserRole, StatusPonto, StatusAnuncio, StatusCobranca, TipoMidia
│   └── model/               # User, PontoMidia, Anunciante, Anuncio, Cobranca, RegistroExibicao, Notificacao
├── repository/              # Spring Data JPA Repositories
├── service/                 # Regras de negócio, faturamento, transações e scoring
│   ├── PricingService.java
│   ├── CapacityEngine.java
│   ├── PairingService.java
│   ├── CampaignService.java
│   ├── AbacatePayService.java
│   ├── R2StorageService.java
│   └── TelemetryService.java
├── controller/              # RestControllers REST
│   ├── AuthController.java
│   ├── PontoController.java
│   ├── AnuncioController.java
│   ├── TvPlayerController.java
│   ├── WebhookAbacatePayController.java
│   ├── UploadR2Controller.java
│   └── NotificationController.java
├── dto/                     # Java Records para Request e Response
└── security/                # OAuth2 UserService, JWT Filters, SecurityContext
```

---

## 3. Diretrizes de Transposição Técnica

1. **Persistência com Flyway:**
   - Todos os scripts DDL residirão em `src/main/resources/db/migration/`.
   - Compatibilidade total com PostgreSQL hospedado.
2. **Concorrência e Capacidade de Grade (360s):**
   - Transação isolada `@Transactional(isolation = Isolation.REPEATABLE_READ)`.
   - Bloqueio pessimista `@Lock(LockModeType.PESSIMISTIC_WRITE)` sobre a TV durante ativação de campanhas.
3. **Smart TV Device Token:**
   - Para o player web das TVs, manter o `pairToken` gerado no pareamento com chave HMAC-SHA256, consumido via header `x-tv-token`.
4. **Streaming de Vídeo:**
   - Todas as URLs de vídeo entregues pelo backend apontam para a CDN da Cloudflare vinculada ao bucket R2, garantindo streaming sem custo de tráfego de saída.
