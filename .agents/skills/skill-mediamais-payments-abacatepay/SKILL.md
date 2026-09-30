---
name: skill-mediamais-payments-abacatepay
description: Integração com a API de pagamentos AbacatePay cobrindo criação de cobranças Pix/Cartão, webhooks com validação de assinatura, split de 50% e ativação de campanhas.
---

# Skill: Pagamentos e Faturamento com AbacatePay (Media+)

Esta skill especifica os fluxos de integração com a API **AbacatePay** para emissão de cobranças, processamento de webhooks e repasse de cotas na Media+.

---

## 1. Visão Geral da AbacatePay no Ecossistema
A AbacatePay é o gateway de pagamentos da plataforma, responsável por:
- Cobrar os anunciantes pelas cotas mensais de veiculação (Bronze: R$ 149,00, Prata: R$ 199,00, Ouro: R$ 249,00).
- Gerar faturas com suporte a **Pix instantâneo (QR Code / Copia e Cola)** e Cartão de Crédito.
- Notificar o backend da Media+ via **Webhooks** em tempo real quando o pagamento for liquidado.
- Viabilizar o controle do split financeiro: 50% de repasse ao dono da Smart TV e 50% de retenção da Media+.

---

## 2. Fluxo de Cobrança da Campanha

```
Anunciante                   Media+ Backend                   AbacatePay API
    │                              │                                │
    │── 1. Submete Campanha ──────>│                                │
    │                              │── 2. POST /v1/billing/create ─>│
    │                              │   (valor, cliente, metadata)   │
    │                              │<── 3. Retorna Pix QR Code ─────│
    │<── 4. Exibe QR Code Pix ─────│                                │
    │                              │                                │
    │── 5. Paga via Pix no Banco ──│───────────────────────────────>│
    │                              │                                │
    │                              │<── 6. Webhook billing.paid ────│
    │                              │   (Assinatura validada)        │
    │                              │── 7. Ativa Anúncio na TV ─────>│
    │<── 8. Notifica "Campanha Ativa"                               │
```

---

## 3. Endpoints e Contratos

### 3.1 Criação de Cobrança (Billing)
- **URL AbacatePay:** `https://api.abacatepay.com/v1/billing/create`
- **Cabeçalhos:**
  - `Authorization: Bearer <ABACATEPAY_API_KEY>`
  - `Content-Type: application/json`
- **Payload Enviado pelo Backend:**
  ```json
  {
    "frequency": "ONE_TIME",
    "methods": ["PIX"],
    "products": [
      {
        "externalId": "CAMPANHA-104",
        "name": "Cota Mensal DOOH - Ponto Café Central (Tier Ouro)",
        "quantity": 1,
        "price": 24900
      }
    ],
    "returnUrl": "https://mediamais.com/anunciante/anuncios/104",
    "completionUrl": "https://mediamais.com/anunciante/anuncios/104?sucesso=true",
    "customerId": "cust_123456",
    "metadata": {
      "anuncioId": 104,
      "pontoMidiaId": 12,
      "anuncianteId": 5
    }
  }
  ```
  *(Nota: Na AbacatePay, valores monetários são enviados em centavos: R$ 249,00 = 24900 centavos).*

### 3.2 Processamento Seguro de Webhook
- **Endpoint do Backend:** `POST /api/webhooks/abacatepay`
- **Validação de Assinatura:**
  - A AbacatePay envia o cabeçalho `abacate-signature`.
  - O backend calcula o hash HMAC-SHA256 do payload cru usando `ABACATEPAY_WEBHOOK_SECRET` e compara de forma segura contra timing attacks (`MessageDigest.isEqual`).
- **Tratamento do Evento `billing.paid`:**
  1. Extrair `metadata.anuncioId` e o identificador da transação.
  2. Verificar idempotência: se a cobrança já foi processada no banco, retornar HTTP 200 imediatamente.
  3. Atualizar o registro da tabela `cobrancas` para `PAGO`.
  4. Executar checagem de capacidade da grade (360 segundos):
     - Se houver espaço: atualizar `anuncio.status = 'ATIVO'`.
     - Se a grade lotou entre o faturamento e a aprovação: atualizar `anuncio.status = 'FILA_ESPERA'`.
  5. Disparar notificações ao anunciante e ao dono da TV.

---

## 4. Diretrizes de Implementação em Java

1. **Client Service:** Criar `AbacatePayClient.java` utilizando Spring `RestClient` com timeout configurado.
2. **Modelo de Cobrança:** Criar entidade JPA `Cobranca` vinculada ao `Anuncio`.
3. **Idempotência:** Campo `transacao_id` com constraint UNIQUE na tabela `cobrancas`.
