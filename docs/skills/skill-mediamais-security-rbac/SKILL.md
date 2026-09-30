---
name: skill-mediamais-security-rbac
description: Diretrizes de segurança, controle de acesso baseado em funções (RBAC), autenticação OAuth2/OIDC, validação de webhooks AbacatePay e presigned URLs Cloudflare R2.
---

# Skill: Segurança, RBAC, OAuth2 & Webhooks (Media+)

Esta skill orienta o desenvolvimento e auditoria de segurança da plataforma Media+, com foco em autenticação moderna, controle de acesso e proteção de integrações externas.

## 1. Perfis de Usuário (RBAC) e Permissões

- **`ADMIN`:** Acesso irrestrito a aprovações, relatórios financeiros, gestão de pontos e usuários.
- **`ANUNCIANTE`:** Gestão de suas próprias marcas, envio de anúncios, visualização de cobranças Pix e relatórios de suas campanhas.
- **`PONTO`:** Gestão de seu estabelecimento, visualização de código rotativo (30s) e relatórios de repasse financeiro (50%).
- **`TV_PLAYER`:** Sessão restrita da Smart TV autenticada por `pairToken`.

---

## 2. Autenticação Federada com OAuth2 / OIDC

- **Provedores Suportados:** Google Identity Services, Apple Sign-In, Microsoft ou Provedor OIDC compatível.
- **Fluxo:** OAuth2 Authorization Code Grant com PKCE.
- **Spring Security 6:**
  - `http.oauth2Login()` para login interativo e onboarding automático do usuário (`users.provider` e `users.provider_id`).
  - `http.oauth2ResourceServer(oauth2 -> oauth2.jwt())` para validação de tokens Bearer em requisições de API móvel/externa.
- **Smart TV (Device Pairing):** O player da TV não requer redirect OAuth2 de navegador; utiliza o protocolo de pareamento por código de 6 dígitos emitindo o `pairToken` assinado.

---

## 3. Segurança de Webhooks (AbacatePay)

- **Validação Criptográfica de Assinatura:**
  - O cabeçalho `abacate-signature` é verificado obrigatoriamente usando chave secreta HMAC-SHA256.
  - Implementação segura em Java:
    ```java
    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
    byte[] hash = mac.doFinal(rawPayload.getBytes(StandardCharsets.UTF_8));
    String expectedSignature = HexFormat.of().formatHex(hash);
    if (!MessageDigest.isEqual(expectedSignature.getBytes(), receivedSignature.getBytes())) {
        throw new SecurityException("Assinatura de Webhook Inválida!");
    }
    ```
- **Idempotência Estrita:**
  - Toda notificação processada verifica a existência da transação na tabela `cobrancas` antes de aplicar qualquer efeito colateral.

---

## 4. Presigned URLs no Cloudflare R2

- O backend Java nunca recebe o fluxo de bytes do vídeo em memória; ele gera Presigned URLs S3 temporárias (TTL máximo: 10 minutos).
- Apenas uploads com MIME types estritos são autorizados:
  - Vídeos: `video/mp4`, `video/webm`
  - Imagens: `image/jpeg`, `image/png`, `image/webp`
- As chaves de objeto no bucket R2 usam UUID criptográfico para evitar Enumeração ou Path Traversal.
