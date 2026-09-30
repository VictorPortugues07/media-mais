# SPEC-06: Catálogo de APIs, Contratos e Eventos em Tempo Real

## 1. Visão Geral
Esta especificação consolida os contratos de endpoints REST, a recepção de webhooks do **AbacatePay**, a emissão de Presigned URLs do **Cloudflare R2** e o canal de streaming por Server-Sent Events (SSE).

---

## 2. Autenticação e OAuth2

### 2.1 Iniciar Login OAuth2 (Google / OIDC)
- **URL:** `GET /oauth2/authorization/google`
- **Acesso:** Público
- **Fluxo:** Redireciona o usuário para consentimento no provedor de identidade.

### 2.2 Callback OAuth2
- **URL:** `GET /login/oauth2/code/google`
- **Acesso:** Provedor Externo
- **Efeito:** Valida o token, cadastra ou associa o usuário na tabela `users` e emite o cookie seguro de sessão `mm_session`.

### 2.3 Obter Usuário Atual
- **Método / URL:** `GET /api/auth/me`
- **Acesso:** Autenticado
- **Response `200 OK`:** Perfil detalhado com papéis e dados vinculados (`pontoMidia` ou `anunciante`).

---

## 3. Upload de Mídia via Cloudflare R2

### 3.1 Obter Presigned URL para Upload
- **Método / URL:** `POST /api/upload/presign`
- **Acesso:** Autenticado (`ANUNCIANTE` ou `PONTO`)
- **Request Body:**
  ```json
  {
    "nomeOriginal": "campanha_natal.mp4",
    "contentType": "video/mp4",
    "tamanhoBytes": 25000000
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "uploadUrl": "https://<account_id>.r2.cloudflarestorage.com/mediamais/midias/82e4...mp4?X-Amz-Signature=...",
    "r2Key": "midias/82e4-campanha_natal.mp4",
    "publicUrl": "https://media.mediamais.com.br/midias/82e4-campanha_natal.mp4",
    "expiraEmSegundos": 600
  }
  ```

---

## 4. Pagamentos e Faturamento com AbacatePay

### 4.1 Gerar Cobrança Pix da Campanha
- **Método / URL:** `POST /api/anuncios/{id}/faturar`
- **Acesso:** `ANUNCIANTE` (dono da campanha) ou `ADMIN`
- **Response `200 OK`:**
  ```json
  {
    "cobrancaId": 14,
    "valorReais": 249.00,
    "pixQrCodeUrl": "https://api.abacatepay.com/qr/...",
    "pixCopiaCola": "00020126580014br.gov.bcb.pix...",
    "urlCheckout": "https://abacatepay.com/pay/bill_123"
  }
  ```

### 4.2 Webhook do Gateway AbacatePay
- **Método / URL:** `POST /api/webhooks/abacatepay`
- **Acesso:** Aberto (protegido por assinatura de cabeçalho `abacate-signature`)
- **Request Body:**
  ```json
  {
    "event": "billing.paid",
    "data": {
      "id": "bill_123456",
      "transactionId": "tx_987654321",
      "status": "PAID",
      "amount": 24900,
      "metadata": {
        "anuncioId": 104
      }
    }
  }
  ```
- **Responses:**
  - `200 OK`: Cobrança processada, anúncio ativado na TV e notificações enviadas.
  - `401 Unauthorized`: Assinatura HMAC inválida.

---

## 5. TV Player e Telemetria

### 5.1 Parear ou Consultar Playlist da TV
- **Método / URL:** `GET /api/tv/parear`
- **Parâmetros:** `codigo=849201` OU `pontoId=12&token=<pairToken>`
- **Response `200 OK`:**
  ```json
  {
    "ponto": { "id": 12, "nomeEmpresa": "Café Central", "status": "ATIVO" },
    "anuncios": [
      {
        "id": 101,
        "titulo": "Café Gourmet",
        "tipoMidia": "VIDEO",
        "midiaUrl": "https://media.mediamais.com.br/midias/cafe.mp4",
        "duracaoSegundos": 15
      }
    ],
    "token": "eyJhbGciOiJIUzI1NiIsIn..."
  }
  ```

### 5.2 Heartbeat e Proof of Play
- **Método / URL:** `POST /api/tv/telemetria`
- **Cabeçalho:** `x-tv-token: <pairToken>`
- **Request Body:**
  ```json
  {
    "pontoId": 12,
    "anuncioId": 101,
    "duracaoSegundos": 15,
    "tipoMidia": "VIDEO",
    "deviceType": "SMART_TV"
  }
  ```

---

## 6. Eventos em Tempo Real (Server-Sent Events)

### 6.1 Canal SSE de Notificações
- **Método / URL:** `GET /api/notificacoes/stream`
- **Acesso:** Autenticado
- **Streaming:** Emite eventos `notification` e `heartbeat` em tempo real para os painéis web.
