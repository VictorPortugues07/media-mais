# FLOW-03: Ciclo de Execução do Player da Smart TV

## 1. Contexto e Personas
- **Ator Principal:** Dispositivo Smart TV (`TV_PLAYER`).
- **Atores Secundários:** Dono do Ponto Comercial, Motor de Exibição Contínua.
- **Objetivo:** Estabelecer a conexão segura via navegador da televisão, reproduzir a grade contínua de anúncios com som e resiliência a falhas, enviar batimentos cardíacos (heartbeat a cada 4s) e registrar a comprovação de veiculação física (*Proof of Play*).

---

## 2. Diagrama de Sequência do Ciclo de Reprodução

```
Navegador Smart TV                    Media+ Backend                     Banco de Dados
        │                                   │                                  │
        │── 1. GET /player ────────────────>│                                  │
        │<── 2. Renderiza UI de Dígitos ────│                                  │
        │                                   │                                  │
        │── 3. GET /api/tv/parear?codigo=X ─>│                                  │
        │                                   │── 4. Valida Código & Cria JWT ──>│
        │<── 5. Playlist + pairToken ───────│                                  │
        │                                   │                                  │
        │── 6. Inicia Reprodução de Vídeo ──│                                  │
        │   (Loop contínuo com som ativo)   │                                  │
        │                                   │                                  │
        │── 7. POST /api/tv/telemetria ─────>│ (Heartbeat a cada 4 segundos)    │
        │   (heartbeatOnly: true)           │── 8. UPDATE ultimaAtividade ────>│
        │<── 9. { success: true } ──────────│                                  │
        │                                   │                                  │
        │── 10. Vídeo Termina Exibição ─────>│ (Proof of Play)                  │
        │   (anuncioId: 10, duracao: 15s)   │── 11. INSERT registroExibicao ──>│
        │<── 12. Comprovado ────────────────│                                  │
```

---

## 3. Passo a Passo Detalhado

### Passo 1: Inicialização e Interface do Controle Remoto
1. O dono do estabelecimento abre o navegador integrado da Smart TV (Tizen, webOS, Android TV, Fire TV) na URL `/player`.
2. A tela exibe:
   - 6 caixas numéricas visíveis à distância.
   - Teclado virtual numérico na tela otimizado para navegação por setas (D-pad) com botões grandes e destaque de foco visual (`focus:ring-4 focus:bg-blue-600 focus:scale-105`).
   - Listener global de teclas físicas (`0-9`), permitindo que controles remotos convencionais preencham os números imediatamente sem acionar o teclado nativo invasivo do sistema operacional da TV.
3. Se já houver um `pairToken` válido gravado no `localStorage`, o player pula a tela de código e inicia imediatamente a sincronização da playlist.

### Passo 2: Pareamento e Obtenção do Token de Transmissão
1. Ao completar o sexto número, o player chama:
   ```http
   GET /api/tv/parear?codigo=123456
   ```
2. O backend valida:
   - Código rotativo não expirado (janela de 30s) ou código mestre.
   - Estabelecimento com `status == 'ATIVO'`.
3. O backend gera o `pairToken` criptografado contendo o `pontoId`.
4. O player grava o token em memória e no armazenamento local (`localStorage.setItem('tv_pair_token', token)`).

### Passo 3: Execução de Mídia e Política de Áudio
1. A tag `<video>` carrega o primeiro anúncio da playlist.
2. **Propriedades de Áudio:**
   - O player inicializa com áudio ativado: `video.muted = false` e `video.volume = 1.0`.
   - Se o navegador bloquear o som devido à política de Autoplay, o player mantém a imagem rodando e vincula listeners nos eventos `keydown`, `click` ou `pointerdown` para desmutar no primeiro toque do controle remoto.
3. **Resiliência de Playlist:**
   - **Caso de Anúncio Único:** Se houver apenas 1 campanha na grade, o player reinicia o mesmo item no evento `ended` em loop contínuo sem piscar ou travar a tela.
   - **Caso de Múltiplos Anúncios:** Alterna sequencialmente no término de cada vídeo ou após o tempo estipulado da imagem.
   - **Tratamento de Erros de Rede:** Se um vídeo falhar ao carregar (`video.onerror`), o player aguarda 2 segundos e avança para o próximo anúncio da fila, evitando congelamentos de tela preta.

### Passo 4: Telemetria de Presença (Heartbeat Contínuo)
1. A cada **4 segundos**, o player executa:
   ```javascript
   fetch('/api/tv/telemetria', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'x-tv-token': tvToken
     },
     body: JSON.stringify({
       pontoId: ponto.id,
       heartbeatOnly: true,
       deviceType: 'SMART_TV',
       screenResolution: `${window.innerWidth}x${window.innerHeight}`
     })
   });
   ```
2. O backend atualiza `pontoMidia.ultimaAtividade = now()`.
3. Essa frequência garante que o painel do dono da TV saiba em tempo quase real que a tela está conectada e viva.

### Passo 5: Registro de Comprovação Física (*Proof of Play*)
1. Ao término exato de cada veiculação completa de um anúncio, o player envia a requisição de auditoria:
   - `anuncioId`, `pontoId`, `duracaoSegundos` e `tipoMidia`.
2. O backend audita a validade, confirma que não se trata de um dispositivo móvel fraudulento (`MOBILE`), e persiste o registro imutável em `registros_exibicao`.
3. Essa métrica alimenta os relatórios contratuais de veiculação e o dashboard do anunciante.

### Passo 6: Encerramento e Desconexão Graciosa (Graceful Exit)
1. Se o estabelecimento fechar o navegador ou desligar o aparelho:
2. O evento de navegador `beforeunload` aciona:
   ```javascript
   navigator.sendBeacon('/api/tv/telemetria', JSON.stringify({
     pontoId: ponto.id,
     token: tvToken,
     offline: true
   }));
   ```
3. O backend grava o encerramento do sinal, e no próximo intervalo de verificação (janela de 12 segundos), o painel reflete o televisor como **Aguardando Sinal / Offline**.
