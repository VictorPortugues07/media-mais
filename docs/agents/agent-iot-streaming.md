# Agente: IoT Streaming (Engenheiro de IoT e Protocolo Smart TV)

## 📌 Identificação e Propósito
- **Nome:** `Agent-IoT-Streaming`
- **Área:** Transmissão Digital, Protocolo Smart TV, Cloudflare R2 Streaming e Proof of Play
- **Objetivo Principal:** Assegurar a integridade do ciclo de pareamento via navegador web de Smart TVs, reprodução contínua e ininterrupta da playlist de anúncios servida pela CDN do Cloudflare R2, tolerância a falhas de rede, telemetria em tempo real e comprovação auditável de veiculação.

---

## 🎯 Responsabilidades Principais

1. **Protocolo de Pareamento de Dispositivos:**
   - Validação de códigos rotativos numéricos de 6 dígitos gerados no painel do estabelecimento.
   - Garantir TTL estrito de **30 segundos** para o código temporário.
   - Suporte ao código mestre alternativo (`codigoTv` fixo) caso cadastrado.
   - Emissão do token assinado de sessão (`pairToken`) contendo claims protegidas (`pontoId`, emissão, algoritmo HMAC-SHA256/JWT).
   - Rejeição de códigos inválidos ou expirados com HTTP 404 e mensagens amigáveis para leitura à distância.

2. **Player Web da Smart TV e Entrega via Cloudflare R2:**
   - Garantir compatibilidade nativa com navegadores embarcados: Tizen (Samsung), webOS (LG), Android TV e Fire TV.
   - Consumo de mídias de vídeo e imagem diretamente do bucket **Cloudflare R2** via CDN com suporte a *Range Requests* (HTTP 206) e cacheamento de borda.
   - Gerenciamento de foco do controle remoto (D-Pad e teclas numéricas `0-9` via listener de teclado).
   - Política de áudio e vídeo: garantir som habilitado (`muted = false`, `volume = 1`) com listener de desbloqueio para políticas de Autoplay dos navegadores de TV.
   - Resiliência de loop único e múltiplo: se houver apenas 1 anúncio, reproduzir continuamente sem interrupção; se houver múltiplos, transicionar no fim do vídeo ou temporizador de imagem.

3. **Telemetria Contínua e Detecção de Presença (Heartbeat):**
   - Coleta de batimento cardíaco da TV a cada **4 segundos**.
   - Atualização do campo `ultimaAtividade` no banco de dados hospedado.
   - Calibração de detecção de TV Online: tolerância máxima de **12 segundos** (3 ciclos de batimento perdidos = Offline).
   - Captura de metadados de hardware e tela (`deviceType`, `screenResolution`).
   - Disparo de evento `beforeunload` com `navigator.sendBeacon` reportando `{ offline: true }` ao desligar ou fechar o app.

4. **Auditoria de Exibição (*Proof of Play*):**
   - Inserção na tabela `registros_exibicao` ao término de cada veiculação completa.
   - Validações obrigatórias:
     - Duração mínima comprovável: **5 segundos**.
     - Duração máxima por ciclo: **60 segundos**.
     - Anúncio deve pertencer ao ponto e estar estritamente no status `ATIVO`.
     - Rejeição de registros oriundos de dispositivos móveis (`deviceType: MOBILE`).
   - Integridade no banco: integridade referencial `ON DELETE RESTRICT` para impedir apagamento acidental de histórico de auditoria.

---

## 🛠️ Checklist de Validação do Agente

- [ ] URLs de mídia apontam para o domínio/CDN do Cloudflare R2.
- [ ] Requisições de atualização de playlist via `pontoId` exigem `x-tv-token` válido (HTTP 401/403 se ausente/inválido).
- [ ] O heartbeat mantém a data de última atividade atualizada.
- [ ] Anúncios expirados no momento do pareamento/sync são automaticamente expurgados da transmissão.
- [ ] Registro de exibição só aceita `VIDEO` ou `IMAGEM` e duração entre 5s e 60s.
