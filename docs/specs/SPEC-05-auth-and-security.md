# SPEC-05: Autenticação, OAuth2, RBAC e Segurança de Acesso

## 1. Visão Geral
Esta especificação define os requisitos de segurança de software da plataforma Media+, com ênfase em **autenticação federada OAuth2/OIDC**, controle de acesso baseado em papéis (RBAC), isolamento multi-tenant, validação criptográfica de webhooks do **AbacatePay** e upload seguro via **Presigned URLs do Cloudflare R2**.

---

## 2. Autenticação Federada (OAuth2 / OIDC) e Sessões

### 2.1 Fluxo de Login OAuth2
- Provedores: Google, Apple ou Provedor OIDC corporativo.
- Padrão: **OAuth2 Authorization Code Flow com PKCE**.
- Processo de Onboarding no Primeiro Login:
  1. O usuário autentica no provedor externo.
  2. O backend Java recebe o `code`, troca por ID Token/Access Token.
  3. Consulta se já existe usuário com o e-mail ou `provider_id`.
  4. Se não existir, cadastra automaticamente na tabela `users` definindo o papel inicial (`ANUNCIANTE` ou `PONTO`).
  5. Emite a sessão segura do usuário via Cookie `HttpOnly` ou Token Bearer.

### 2.2 Atributos do Cookie de Sessão
```http
Set-Cookie: mm_session=<JWT_TOKEN>; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=2592000
```

### 2.3 Sessão da Smart TV (Dispositivo)
- As Smart TVs não realizam redirecionamento interativo OAuth2.
- A TV utiliza o fluxo de pareamento por código numérico de 6 dígitos (30s) e recebe o `pairToken` assinado (HMAC-SHA256), transmitido no cabeçalho `x-tv-token`.

---

## 3. Segurança de Integração: Webhook AbacatePay

- **Endpoint de Recepção:** `POST /api/webhooks/abacatepay`
- **Validação de Integridade e Autenticidade:**
  - O cabeçalho `abacate-signature` deve ser validado contra o HMAC-SHA256 do corpo cru da requisição usando a chave secreta `ABACATEPAY_WEBHOOK_SECRET`.
  - Comparação estrita contra ataques de timing (`MessageDigest.isEqual`).
- **Prevenção de Replay e Idempotência:**
  - Gravação única da transação (`UNIQUE(transacao_id)`). Notificações duplicadas são respondidas com `200 OK` sem reprocessar regras de negócio.

---

## 4. Upload Seguro via Presigned URLs (Cloudflare R2)

- O servidor backend não deve ser o gargalo de tráfego de arquivos de mídia grandes (vídeos de até 100MB).
- O cliente solicita ao backend uma URL pré-assinada:
  ```http
  POST /api/upload/presign
  Content-Type: application/json

  {
    "tipo": "VIDEO",
    "contentType": "video/mp4",
    "tamanhoBytes": 45000000
  }
  ```
- O backend valida a extensão, tipo MIME e quota, e gera uma Presigned PUT URL S3 com validade máxima de 10 minutos.
- O cliente envia o binário diretamente ao bucket Cloudflare R2 via HTTP PUT.
- Nenhuma execução de arquivo é permitida no storage, neutralizando ataques de execução remota de código (RCE).

---

## 5. Matriz de Autorização por Papel (RBAC)

| Rota / Operação | `ADMIN` | `PONTO` | `ANUNCIANTE` | `TV_PLAYER` |
|---|:---:|:---:|:---:|:---:|
| `GET /api/pontos` | Todos | Próprio | Leitura Pública | Leitura |
| `POST /api/anuncios` | Bloqueado | Bloqueado | Permitido | Bloqueado |
| `POST /api/upload/presign` | Permitido | Permitido | Permitido | Bloqueado |
| `PATCH /api/anuncios/[id]/aprovar` | Permitido | Bloqueado | Bloqueado | Bloqueado |
| `POST /api/webhooks/abacatepay` | Gateway | Gateway | Gateway | Gateway (Validado) |
| `GET /api/tv/parear` | Permitido | Bloqueado | Bloqueado | Permitido |
| `POST /api/tv/telemetria` | Permitido | Bloqueado | Bloqueado | Permitido |
