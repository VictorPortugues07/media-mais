---
name: skill-mediamais-tv-iot-protocol
description: Protocolo de comunicação IoT para Smart TVs da Media+ cobrindo pareamento por código rotativo de 30s, TV token, telemetria contínua a cada 4s e auditoria Proof of Play.
---

# Skill: Protocolo IoT & Smart TV (Media+)

Esta skill especifica os detalhes operacionais do protocolo entre o player web executando nas Smart TVs e o backend da Media+.

## 1. Ciclo de Pareamento do Televisor

1. **Geração do Código:**
   - O estabelecimento gera no painel web (`/ponto/dashboard`) um código numérico de **6 dígitos**.
   - O código possui validade estrita de **30 segundos** (`codigoRotativoExpira = agora + 30s`).
2. **Entrada na TV:**
   - O televisor acessa `/player`.
   - O operador digita os 6 dígitos através do controle remoto (teclas numéricas físicas ou D-Pad com teclado em tela).
3. **Handshake e Troca de Chaves:**
   - A TV envia `GET /api/tv/parear?codigo=123456`.
   - O backend valida a existência e expiração do código (ou fallback para `codigoTv` mestre fixo).
   - O backend verifica se o ponto está `ATIVO`.
   - O backend assina e retorna um **`pairToken`** (JWT com payload `{ pontoId }`) e a playlist de anúncios ativos.
4. **Sincronização Subsequente:**
   - Todas as requisições posteriores de consulta de playlist devem enviar o cabeçalho `x-tv-token: <pairToken>` ou o query param `?pontoId=X&token=<pairToken>`.
   - Tentativa de consulta sem token ou com token de outro ponto resulta em `401 Unauthorized` ou `403 Forbidden`.

---

## 2. Telemetria e Monitoramento de Conexão (Heartbeat)

- **Periodicidade:** A TV envia requisições a cada **4 segundos** para `POST /api/tv/telemetria`.
- **Payload do Heartbeat:**
  ```json
  {
    "pontoId": 12,
    "token": "eyJhbG...",
    "heartbeatOnly": true,
    "deviceType": "SMART_TV",
    "screenResolution": "1920x1080"
  }
  ```
- **Atualização com Cache em Memória (Anti-Write Bloat):**
  - O backend Java armazena o pulso de 4s em cache de memória (Caffeine / Redis com TTL de 12s), evitando queries `UPDATE` contínuas no PostgreSQL hospedado.
  - O PostgreSQL só é atualizado na mudança de status (conectou/desconectou) ou em sincronização periódica a cada 5 minutos.
- **Detecção de TV Online/Offline:**
  - Tolerância de leitura: **12 segundos** via cache.
  - Se `(agora - presence.timestamp) <= 12s`, a TV é considerada **ONLINE / AO VIVO**.
  - Se `> 12s`, a TV é considerada **OFFLINE / AGUARDANDO**.
- **Desconexão Graciosa (Graceful Exit):**
  - No evento `beforeunload` da janela da Smart TV, o player envia `navigator.sendBeacon` com payload:
    `{ "pontoId": 12, "token": "...", "offline": true }`.
  - O backend invalida o cache e registra o evento preservando o timestamp de auditoria.

---

## 3. Comprovação de Veiculação (*Proof of Play*) com Batch Insert

- Sempre que um anúncio termina de ser exibido na tela, a Smart TV dispara a telemetria com os dados do anúncio:
  ```json
  {
    "pontoId": 12,
    "token": "eyJhbG...",
    "anuncioId": 45,
    "duracaoSegundos": 15,
    "tipoMidia": "VIDEO",
    "deviceType": "SMART_TV"
  }
  ```
- **Processamento em Buffer / Batch Insert:**
  - O backend enfileira as comprovações em memória e as persiste em lotes no PostgreSQL a cada 5 segundos via Virtual Threads (`saveAll()`), reduzindo o consumo de conexões JDBC em 90%.
- **Validações de Auditoria no Backend:**
  1. `deviceType` NÃO pode ser `MOBILE` nem nulo (prevenção de fraude via smartphones).
  2. `duracaoSegundos` deve ser entre 5 e 60 segundos.
  3. `anuncioId` deve existir, pertencer àquele `pontoId` e estar no status `ATIVO`.
  4. Inserção atômica na tabela `registros_exibicao` (`id`, `anuncioId`, `pontoMidiaId`, `duracaoSegundos`, `tipoMidia`, `exibidoEm`).
  5. Imutabilidade: registros de exibição nunca são deletados em cascata.
