# FLOW-04: Moderação Administrativa, Faturamento e Auditoria

## 1. Contexto e Personas
- **Ator Principal:** Administrador Geral (`ADMIN`).
- **Atores Secundários:** Anunciante, Dono do Ponto, Gateway AbacatePay.
- **Objetivo:** Moderar campanhas pendentes, disparar o faturamento AbacatePay, auditar o Proof of Play nas Smart TVs e monitorar a disponibilidade de telas em tempo real.

---

## 2. Passo a Passo Detalhado

### Passo 1: Fila de Moderação (`/admin/aprovacoes`)
1. O administrador acessa o painel de aprovações.
2. A tela exibe todas as campanhas no status `PENDENTE`.
3. Para cada campanha, são exibidos:
   - Preview interativo do vídeo ou imagem transmitido via CDN do Cloudflare R2 com som ativo.
   - Nome da marca anunciante e contato.
   - Ponto de mídia de destino, cidade e categoria.
   - Duração da peça (ex: 15 segundos).
   - Ocupação atual da grade do ponto (ex: "310s de 360s ocupados").

### Passo 2: Decisão de Moderação

#### Opção A: Aprovação de Conteúdo
1. O administrador clica em **"Aprovar Campanha"**.
2. O backend atualiza o status para `AGUARDANDO_PAGAMENTO`.
3. Dispara a criação da cobrança Pix na API **AbacatePay**.
4. O anunciante é notificado com o QR Code Pix para liquidação da cota mensal.
5. Quando o webhook confirmar o pagamento, o sistema confere a trava de 360s e ativa na TV.

#### Opção B: Rejeição com Motivo Obrigatório
1. Caso o conteúdo viole políticas ou tenha baixa legibilidade, o administrador clica em **"Rejeitar"**.
2. Um modal exige o preenchimento de justificativa detalhada (mínimo de 5 caracteres).
3. O backend executa:
   ```http
   PATCH /api/anuncios/{id}/rejeitar
   Content-Type: application/json

   { "motivo": "A arte possui fontes pequenas de difícil leitura a 3 metros de distância da TV." }
   ```
4. O status é atualizado para `REJEITADO`.
5. Uma notificação do tipo `ANUNCIO_REJEITADO` é enviada ao anunciante com o motivo da recusa.
6. **Invariante:** Uma vez rejeitado, este anúncio nunca poderá ser aprovado diretamente (deve retornar HTTP 400).

### Passo 3: Monitor de Telas e Auditoria em Tempo Real (`/admin/dashboard`)
1. O painel central exibe indicadores chave de performance (KPIs):
   - Total de TVs na rede (Online vs Offline ao vivo via batimento de 4s).
   - Total de campanhas ativas veiculando.
   - Total acumulado de veiculações (*Proof of Play*) e horas de transmissão.
2. **Auditoria de Proof of Play:**
   - Visualização dos registros de veiculação por anúncio e TV.
   - Proteção estrita `ON DELETE RESTRICT` no PostgreSQL hospedado.
