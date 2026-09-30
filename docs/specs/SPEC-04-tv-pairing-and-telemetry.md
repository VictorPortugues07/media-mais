# SPEC-04: Protocolo da Smart TV, Streaming R2, Telemetria e Normalização de Mídia

## 1. Visão Geral
Esta especificação define o protocolo de comunicação bidirecional entre o reprodutor web executando em Smart TVs (Tizen, webOS, Android TV, Fire TV) e o backend da Media+. Cobre o pareamento por código rotativo, consumo de streaming via CDN do **Cloudflare R2**, arquitetura de **Heartbeat em Cache** (anti-write-amplification), inserção em lotes de **Proof of Play** e o **Padrão Estrito de Normalização de Vídeo**.

---

## 2. Ciclo de Pareamento (Handshake)

### 2.1 Código Rotativo Temporário de 6 Dígitos
1. No painel do dono do ponto (`/ponto/dashboard`), é gerado um código numérico de 6 dígitos (ex: `849201`).
2. O código é salvo no banco hospedado:
   - `codigoRotativo = "849201"`
   - `codigoRotativoExpira = NOW() + INTERVAL '30 SECONDS'`
3. A cada 30 segundos, o painel do ponto renova o código via `POST /api/ponto/codigo-rotativo`.

### 2.2 Digitação no Player da Smart TV
1. A Smart TV abre `/player` em tela cheia.
2. O operador utiliza o controle remoto:
   - **Teclas físicas (0-9):** capturadas via evento JavaScript `keydown.key`.
   - **Teclado virtual na tela:** navegação por setas (D-pad) com botões numéricos amplos (`focus:ring-4`, contraste elevado).
3. Ao completar 6 números, o player dispara a requisição de pareamento:
   ```http
   GET /api/tv/parear?codigo=849201
   ```

### 2.3 Emissão do `pairToken` (Token de Sessão da TV)
O backend processa a requisição:
1. Localiza o ponto correspondente ao código rotativo não expirado (ou fallback para `codigoTv` mestre fixo).
2. Verifica se o ponto possui `status == 'ATIVO'`. Se inativo, retorna `403 Forbidden`.
3. Executa a limpeza preventiva de anúncios expirados.
4. Assina criptograficamente um token JWT (`pairToken`) com payload `{ pontoId, role: "TV_PLAYER" }`.
5. Retorna o token e a playlist com URLs absolutas apontando para o Cloudflare R2:
   ```json
   {
     "ponto": {
       "id": 12,
       "nomeEmpresa": "Café Central",
       "status": "ATIVO",
       "categoria": "Restaurante",
       "cidade": "Florianópolis",
       "uf": "SC"
     },
     "anuncios": [
       {
         "id": 101,
         "titulo": "Promoção Almoço",
         "tipoMidia": "VIDEO",
         "midiaUrl": "https://media.mediamais.com.br/midias/ad101-cafe.mp4",
         "duracaoSegundos": 15,
         "anunciante": { "nomeEmpresa": "Restaurante Silva" }
       }
     ],
     "token": "eyJhbGciOiJIUzI1NiIsIn..."
   }
   ```
6. O player armazena o token em `localStorage` para reidratação automática ao ligar a TV.

---

## 3. Telemetria e Monitoramento de Conexão em Cache (Anti-Write Amplification)

### 3.1 O Problema da Escrita Contínua em Banco Hospedado
Em uma rede com 500 TVs, pulsos de 4s geram **125 queries `UPDATE` por segundo** no PostgreSQL hospedado. No PostgreSQL, updates frequentes geram acúmulo de tabelas mortas (dead tuples), estresse de WAL e consumo excessivo de IOPS em bancos gerenciados.

### 3.2 Arquitetura de Cache em Memória (Caffeine / Redis)
1. **Pulsos a cada 4 segundos:**
   - A TV envia `POST /api/tv/telemetria` com `heartbeatOnly: true`.
   - O backend Java **NÃO executa UPDATE imediato no PostgreSQL**.
   - O backend grava o batimento em memória ultrarrápida:
     ```java
     // Chave em Cache com TTL de 12 segundos
     tvPresenceCache.put(pontoId, new TvPresence(System.currentTimeMillis(), deviceType, screenResolution));
     ```
2. **Avaliação de Status Online:**
   - As consultas de status de TVs (feitas pelo painel `/ponto/dashboard` ou `/admin/dashboard`) consultam primeiramente o Cache:
     $$\text{isOnline} = (agora - \text{presence.timestamp} \le 12.000\text{ms})$$
3. **Persistência Periódica e Transições de Estado:**
   - Um worker assíncrono (Virtual Thread no Java 21) sincroniza o timestamp `ultimaAtividade` no PostgreSQL apenas:
     - Quando a TV passa de `OFFLINE` para `ONLINE` (transição de conexão).
     - Quando a TV envia o sinal de desconexão graciosa (`offline: true`).
     - Em lote (batch) a cada 5 minutos para auditoria histórica.
   - **Economia de 98% em escritas de banco.**

---

## 4. Auditoria Física de Veiculação (*Proof of Play*) em Lotes (Batch Insert)

### 4.1 Envio de Comprovação
Ao finalizar a reprodução de cada item da playlist, o player dispara:
```http
POST /api/tv/telemetria
Content-Type: application/json
x-tv-token: eyJhbGciOiJIUzI1NiIsIn...

{
  "pontoId": 12,
  "anuncioId": 101,
  "duracaoSegundos": 15,
  "tipoMidia": "VIDEO",
  "deviceType": "SMART_TV"
}
```

### 4.2 Buffer em Memória e Escrita em Lote (Batch Insert)
1. O controller valida o token e os parâmetros.
2. Em vez de abrir uma transação JDBC individual por vídeo, o registro é adicionado a uma fila concorrente (`BlockingQueue<RegistroExibicao>` em memória).
3. A cada **5 segundos** ou quando a fila atinge 100 registros, um agendador executa `registroExibicaoRepository.saveAll(lote)` em uma única instrução SQL `INSERT INTO registros_exibicao VALUES (...), (...), (...)`.
4. Garante throughput altíssimo sem sobrecarregar o pool de conexões HikariCP.

---

## 5. Padrão Estrito de Normalização de Vídeo para Smart TVs

Smart TVs utilizam decodificadores de hardware estritos. Arquivos codificados fora do padrão causam tela preta ou erro `MEDIA_ERR_DECODE`.

### 5.1 Especificação Obrigatória do Arquivo
| Parâmetro | Padrão Obrigatório Media+ | Motivo Técnico |
|---|---|---|
| **Formato / Contêiner** | **MP4** (`.mp4`) | Suporte universal em 100% dos navegadores de TV |
| **Codec de Vídeo** | **H.264 / AVC** | Compatível com Tizen (Samsung), webOS (LG) e Android TV |
| **Perfil H.264** | **Main ou High Profile, Level 4.1** | Decodificação nativa por hardware econômico |
| **Resolução Máxima** | **1920x1080 (1080p)** | Resolução nativa padrão dos painéis DOOH |
| **Taxa de Quadros (FPS)**| **30 fps** (ou 29.97 fps) | Estabilidade térmica do processador da TV |
| **Bitrate Máximo** | **4.000 a 6.000 kbps (4 a 6 Mbps)** | Streaming fluido sem buffering em Wi-Fi comercial |
| **Codec de Áudio** | **AAC-LC (Stereo)** | Suporte nativo ao decodificador de áudio da TV |
| **Sample Rate Áudio** | **44.1 kHz ou 48 kHz** | Evita distorções de resampling no chip de som |
| **Faststart Atom** | **Ativado (`+faststart`)** | Move o `moov atom` para o início do arquivo |

### 5.2 Comando Canônico de Transcodificação FFmpeg
Caso o anunciante submeta um vídeo em formato não compatível, o pipeline de transcodificação aplica:
```bash
ffmpeg -i input_video.mp4 \
  -c:v libx264 -profile:v main -level:v 4.1 -pix_fmt yuv420p \
  -b:v 4500k -maxrate 5000k -bufsize 9000k \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
  -r 30 \
  -c:a aac -b:a 128k -ar 48000 -ac 2 \
  -movflags +faststart \
  output_normalizado.mp4
```
Este arquivo normalizado é o que é enviado ao bucket Cloudflare R2 e transmitido às TVs.
