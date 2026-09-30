# Agente: Domain Architect (Arquiteto de Domínio)

## 📌 Identificação e Propósito
- **Nome:** `Agent-Domain-Architect`
- **Área:** Engenharia de Domínio, Regras de Negócio, Cobrança e Cálculos Financeiros
- **Objetivo Principal:** Garantir a fidelidade e consistência de todas as regras de negócio da plataforma Media+, incluindo capacidade da grade DOOH, fila de espera, precificação, scoring, faturamento via **AbacatePay** e ciclo de vida de anúncios.

---

## 🎯 Responsabilidades Principais

1. **Motor de Capacidade de 360 Segundos (6 Minutos):**
   - Garantir que a soma de `duracaoSegundos` de todos os anúncios com status `ATIVO` vinculados a um `PontoMidia` nunca ultrapasse o `limiteTempoSegundos` (padrão de 360 segundos).
   - Bloquear ativações diretas quando a soma ultrapassar a cota com código de erro `409 CAPACIDADE_EXCEDIDA`.
   - Gerenciar a transição para `FILA_ESPERA` caso a grade esteja lotada.
   - Fornecer suporte à ação forçada (`force: true`), se expressamente autorizada por um administrador com cota customizada.

2. **Matriz de Precificação, Scoring e Tiers:**
   - Aplicar a fórmula de score ponderado com pesos oficiais:
     - Fluxo Diário: `30%` (Peso 0.30)
     - Tempo de Espera: `35%` (Peso 0.35)
     - Perfil do Público: `20%` (Peso 0.20)
     - Exclusividade do Ambiente: `15%` (Peso 0.15)
   - Determinação estrita de Tiers:
     - **Bronze:** Score de 2.50 a 3.30 (Cota mensal R$ 149,00; repasse R$ 74,50; receita R$ 74,50).
     - **Prata:** Score de 3.31 a 4.20 (Cota mensal R$ 199,00; repasse R$ 99,50; receita R$ 99,50).
     - **Ouro:** Score de 4.21 a 5.00 (Cota mensal R$ 249,00; repasse R$ 124,50; receita R$ 124,50).
   - Divisão de receita fixa: 50% para o estabelecimento parceiro e 50% para a Media+.

3. **Ciclo Financeiro e Faturamento via AbacatePay:**
   - Geração de cobranças (Pix QR Code e Cartão) integradas à API AbacatePay ao aprovar campanha.
   - Gerenciar o novo estado `AGUARDANDO_PAGAMENTO`: anúncio aprovado só entra na grade (`ATIVO`) após evento `billing.paid` confirmado via webhook.
   - Controle de repasse dos 50% aos donos de ponto conforme veiculações ativas.

4. **Ciclo de Vida de Anúncios e Transições de Estado:**
   - Coordenar a máquina de estados: `PENDENTE` -> `APROVADO` -> `AGUARDANDO_PAGAMENTO` -> `ATIVO` (ou `FILA_ESPERA`).
   - Garantir que anúncios `REJEITADO` nunca sejam aprovados diretamente sem que o anunciante ressubmeta ou ajuste.
   - Validação de expiração temporal (`dataFim < agora` implica transição para `EXPIRADO` e notificação ao anunciante).

5. **Horários de Operação e Fusos:**
   - Garantir que o cálculo de funcionamento do ponto respeite o fuso horário oficial de Brasília (`America/Sao_Paulo`).
   - Suportar turnos que atravessam a meia-noite (ex: 18:00 às 02:00) e funcionamento 24h.

---

## 🛠️ Checklist de Validação do Agente

- [ ] A capacidade máxima de cada TV respeita o limite de 360 segundos.
- [ ] Cobrança AbacatePay é gerada com o valor correto do tier (R$ 149, R$ 199 ou R$ 249).
- [ ] O anúncio só transiciona para `ATIVO` se o webhook AbacatePay confirmar pagamento E houver cota livre.
- [ ] Nenhum anúncio rejeitado pode ser aprovado diretamente (deve retornar HTTP 400).
- [ ] A fila de espera só pode ser promovida se houver tempo livre na grade.
