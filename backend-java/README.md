# Media+ — Backend API (Java 21 & Spring Boot 3.3+)

Backend oficial da plataforma **Media+** (DOOH — Digital Out-Of-Home), projetado sob o paradigma de **Monólito Modular Hexagonal (Ports & Adapters)** com **Java 21 LTS**, **Spring Boot 3.3.4**, **Spring Security 6**, **Cloudflare R2** e **API AbacatePay**.

---

## 🏛️ Destaques da Arquitetura & Blindagens

1. **Monólito Modular Hexagonal (DDD):**
   - Contextos delimitados: `identity`, `establishment`, `campaign`, `streaming`, `billing`, `notification`.
   - Regras de negócio 100% desacopladas de fornecedores via Portas (`PaymentGateway`, `StorageService`).
2. **Motor de Capacidade DOOH (Loop de 360s & Slot Hold):**
   - Garante que nenhuma TV exceda 6 minutos de anúncios em loop contínuo.
   - **Slot Hold de 60 min:** Pré-reserva de vaga enquanto o anunciante realiza o Pix, eliminando o risco de pagar e cair na fila de espera por concorrência.
3. **Smart TV IoT & Streaming R2:**
   - Pareamento simplificado por controle remoto com código rotativo de 6 dígitos (30s) e token JWT (`pairToken`).
   - Heartbeat a cada 4s mantido em **Cache em Memória (Caffeine)** com tolerância de 12s, reduzindo 98% das escritas no PostgreSQL hospedado.
   - **Proof of Play em Lote:** Inserções de comprovação de veiculação descarregadas em lotes a cada 5 segundos via Virtual Threads (`saveAll()`).
   - Mídias entregues pela CDN do **Cloudflare R2** com taxa zero de saída de dados (*zero egress*).
4. **Faturamento & Split com AbacatePay:**
   - Faturas Pix automáticas nos Tiers: Bronze (R$ 149), Prata (R$ 199) e Ouro (R$ 249).
   - Validação de webhooks com assinatura criptográfica HMAC-SHA256 em tempo constante (`MessageDigest.isEqual`) contra timing attacks.
5. **Autenticação Federada com OAuth2/OIDC:**
   - Spring Security 6 com suporte a Google Identity, cookies seguros `HttpOnly` e isolamento anti-IDOR.

---

## 🚀 Como Executar

### Pré-requisitos
- JDK 21 LTS instalado.
- Banco de Dados PostgreSQL 14+ (local ou hospedado no Supabase/Neon/AWS RDS).

### 1. Variáveis de Ambiente
Configure no seu `.env` ou nas variáveis do sistema:

```bash
# Banco de Dados Hospedado
DATABASE_URL="jdbc:postgresql://localhost:5432/mediamais?currentSchema=public"
DATABASE_USER="postgres"
DATABASE_PASSWORD="suasenhadobanco"

# Cloudflare R2 (S3 API)
R2_ACCOUNT_ID="seu-account-id-cloudflare"
R2_ACCESS_KEY="sua-access-key-r2"
R2_SECRET_KEY="sua-secret-key-r2"
R2_BUCKET_NAME="mediamais-midias"
R2_CDN_URL="https://media.mediamais.com.br"

# Gateway AbacatePay
ABACATEPAY_API_KEY="seu-api-key-abacatepay"
ABACATEPAY_WEBHOOK_SECRET="seu-webhook-secret-abacatepay"

# OAuth2 (Google)
GOOGLE_CLIENT_ID="seu-google-client-id"
GOOGLE_CLIENT_SECRET="seu-google-client-secret"

# Segredos JWT (Mínimo de 32 caracteres)
TV_JWT_SECRET="mediamais_super_tv_secret_2026_super_seguro_min_32_chars"
SESSION_JWT_SECRET="mediamais_super_user_secret_2026_super_seguro_min_32_chars"
```

### 2. Execução com Maven
```bash
# Compilar e empacotar
mvn clean package -DskipTests

# Executar a aplicação
mvn spring-boot:run
```

A API iniciará na porta `8080`.
O Flyway aplicará automaticamente a migração inicial `V1__initial_schema.sql`.

---

## 📁 Estrutura de Pacotes

```text
com.mediamais.platform/
├── common/             # BaseEntity, GlobalExceptionHandler, ApiResponse, SecurityUtils
├── config/             # SecurityConfig (Spring Security 6), CacheConfig, S3R2Config, AbacatePayConfig
├── infrastructure/     # CloudflareR2StorageAdapter, UploadR2Controller
└── modules/
    ├── identity/       # Users, UserRole, UserRepository
    ├── establishment/  # PontoMidia, Anunciante, PricingScoringService
    ├── campaign/       # Anuncio, StatusAnuncio, CapacityEngine, AnuncioController
    ├── streaming/      # RegistroExibicao, TvPairingService, HeartbeatCacheService, BatchBuffer, TvPlayerController
    ├── billing/        # Cobranca, AbacatePayGatewayAdapter, WebhookAbacatePayController
    └── notification/   # Notificacao, NotificationEmitterService (SSE)
```
