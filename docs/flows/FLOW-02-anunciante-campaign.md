# FLOW-02: Compra, Upload e Submissão de Campanhas pelo Anunciante

## 1. Contexto e Personas
- **Ator Principal:** Anunciante / Marca (`ANUNCIANTE`).
- **Atores Secundários:** Administrador da Plataforma (`ADMIN`), Cloudflare R2 (Storage), Gateway AbacatePay.
- **Objetivo:** Encontrar estabelecimentos no mapa, realizar upload direto no Cloudflare R2 via Presigned URL, passar pela moderação e liquidar a cota mensal via Pix no AbacatePay para colocar a campanha no ar.

---

## 2. Diagrama de Sequência do Fluxo

```
Anunciante                 Media+ Backend              Cloudflare R2         AbacatePay
    │                            │                           │                    │
    │── 1. GET /api/pontos ─────>│                           │                    │
    │<── 2. Lista com GPS e Tiers│                           │                    │
    │                            │                           │                    │
    │── 3. POST /upload/presign ─>│                          │                    │
    │<── 4. Retorna Presigned URL│                           │                    │
    │                            │                           │                    │
    │── 5. PUT direto do vídeo ──┼──────────────────────────>│                    │
    │<── 6. 200 OK ──────────────┼───────────────────────────│                    │
    │                            │                           │                    │
    │── 7. POST /api/anuncios ──>│                           │                    │
    │   (Status: PENDENTE)       │── 8. Notifica Admin ──────┼───────────────────>│
    │                            │                           │                    │
    │                            │<── 9. Admin Aprova ───────┼────────────────────│
    │                            │   (Gera Fatura Pix)       │                    │
    │                            │── 10. POST /v1/billing ───┼───────────────────>│
    │                            │<── 11. Pix Copia e Cola ──┼────────────────────│
    │<── 12. Pagar com Pix ──────│                           │                    │
    │                            │                           │                    │
    │── 13. Paga no Banco ───────┼───────────────────────────┼───────────────────>│
    │                            │<── 14. Webhook billing.paid ───────────────────│
    │                            │    (Status -> ATIVO na TV)                     │
    │<── 15. Notifica Campanha Ativa                         │                    │
```

---

## 3. Passo a Passo Detalhado

### Passo 1: Descoberta de Telas no Mapa
1. O anunciante autentica-se via **OAuth2** e acessa `/anunciante/mapa`.
2. Filtra por cidade, bairro, categoria e tier do ponto (Bronze, Prata, Ouro).
3. Avalia o fluxo diário e as fotos do estabelecimento (hospedadas no R2).
4. Clica em **"Anunciar Neste Ponto"**.

### Passo 2: Upload Direto no Cloudflare R2
1. O anunciante seleciona a peça de vídeo (.mp4 ou .webm) ou imagem.
2. O navegador solicita uma Presigned URL ao backend (`POST /api/upload/presign`).
3. O backend Java valida o tipo MIME e emite a URL assinada com expiração de 10 minutos.
4. O navegador realiza o upload do arquivo binário diretamente para o bucket Cloudflare R2 via HTTP PUT.
5. Zero consumo de banda e zero sobrecarga de processamento no servidor backend.

### Passo 3: Criação da Campanha
1. O anunciante envia `POST /api/anuncios` com o título, duração e a chave/URL do arquivo no R2.
2. O sistema grava o anúncio como `PENDENTE`.
3. Os administradores recebem notificação de novo anúncio aguardando moderação.

### Passo 4: Moderação e Emissão de Fatura AbacatePay
1. O moderador analisa o vídeo no painel.
2. Ao aprovar, o status da campanha transiciona para `AGUARDANDO_PAGAMENTO`.
3. O backend chama a API AbacatePay e cria a cobrança com o valor do tier (ex: R$ 249,00).
4. O anunciante visualiza na tela o QR Code Pix e a chave Pix Copia e Cola.

### Passo 5: Confirmação de Pagamento via Webhook
1. O anunciante efetua o pagamento no aplicativo do seu banco.
2. A AbacatePay envia o webhook `POST /api/webhooks/abacatepay` com assinatura HMAC-SHA256 válida.
3. O backend verifica a assinatura, marca a cobrança como `PAGO` e confere a capacidade de 360 segundos:
   - Se houver espaço: o anúncio muda para `ATIVO` e entra imediatamente na transmissão da TV.
   - Se a grade estiver lotada: o anúncio muda para `FILA_ESPERA`.
4. O anunciante é avisado em tempo real via notificação SSE.
