# SPEC-02: Máquina de Estados, Reserva de Vagas (Slot Hold) e Faturamento

## 1. Visão Geral
Esta especificação define a máquina de estados que governa as campanhas publicitárias (`Anuncio`) na Media+, incluindo as etapas de moderação, **Reserva Preventiva de Vaga (Slot Hold)**, emissão e liquidação de faturas via **AbacatePay**, controle de capacidade da grade de 360 segundos e expiração automática.

---

## 2. Diagrama de Estados do Anúncio com Slot Hold

```
       [ Criação pelo Anunciante ]
                    │
                    ▼
              ┌───────────┐
              │ PENDENTE  │
              └─────┬─────┘
                    │
        ┌───────────┴───────────────────────────┐
        │ Moderador                             │ Moderador
        │ APROVA                                │ REJEITA (com motivo)
        ▼                                       ▼
  [ Checagem Grade 360s ]                 ┌───────────┐
   │                 │                    │ REJEITADO │
   │ Cabe Vaga       │ Grade Cheia        └───────────┘
   ▼                 ▼                          ▲
┌─────────────────────────┐ ┌──────────────┐    │
│  AGUARDANDO_PAGAMENTO   │ │ FILA_ESPERA  │    │
│ (Slot Hold: TTL 60 min) │ │ (Sem Fatura) │    │
└───────────┬─────────────┘ └──────┬───────┘    │
            │                      │            │
            ├──────────────────────┤ Vaga abre  │
            │ Pix Não Pago (TTL)   │ no ponto   │
            ▼                      ▼            │
     [ Libera Reserva ]     [ Promove e Gera ]  │
     (Cancela Fatura)       [ Fatura Pix 60m ]  │
            │                                   │
            │ Webhook AbacatePay                │
            │ billing.paid (Confirmado)         │
            ▼                                   │
      ┌───────────┐                             │
      │   ATIVO   │                             │
      │  (Na TV)  │                             │
      └─────┬─────┘                             │
            │                                   │
            ├───────────────────────────────────┘
            │
            │ Pausa manual ou Expiração temporal (dataFim < agora)
            ▼
      ┌───────────┐
      │  PAUSADO  │ ou EXPIRADO
      └───────────┘
```

---

## 3. Mecanismo de Reserva Preventiva de Vaga (Slot Hold)

### 3.1 O Problema da Concorrência Comercial
Em um sistema DOOH com faturamento Pix, se um anunciante recebe o Pix de R$ 249,00 e a vaga só for disputada no momento da confirmação do pagamento, um segundo anunciante que pagar segundos antes pode roubar o último slot de 15 segundos da TV. O primeiro anunciante pagou, mas seu anúncio ficaria bloqueado.

### 3.2 A Solução: Slot Hold com TTL de 60 Minutos
1. **No Momento da Aprovação pelo Moderador:**
   - O sistema calcula a capacidade ocupada considerando:
     $$\text{TempoOcupado} = \sum \text{duracao}(\text{ATIVOS}) + \sum \text{duracao}(\text{AGUARDANDO\_PAGAMENTO com reserva\_expira\_em} > \text{now()})$$
   - Se $\text{TempoOcupado} + \text{duracaoNovo} \le \text{limiteTempoSegundos}$ (360s):
     - O anúncio entra em `AGUARDANDO_PAGAMENTO`.
     - Grava `reserva_expira_em = now() + INTERVAL '60 MINUTES'`.
     - Gera a fatura Pix na AbacatePay com validade de 60 minutos.
     - **A vaga está garantida e bloqueada para qualquer outro anunciante.**
   - Se a grade já estiver no teto de 360s:
     - O anúncio vai para `FILA_ESPERA`. Nenhuma fatura é cobrada enquanto não houver garantia física de exibição.

2. **No Recebimento do Webhook `billing.paid`:**
   - Como a vaga já estava reservada com o Slot Hold, a transição para `ATIVO` é **imediata e 100% garantida**, sem risco de surpresas.
   - O campo `data_inicio` é setado para `now()` e `data_fim = now() + INTERVAL '30 DAYS'`.

3. **Se o Pix Não For Pago Dentro dos 60 Minutos:**
   - A fatura na AbacatePay expira.
   - Um job agendado no backend identifica `reserva_expira_em < now()`, atualiza a fatura para `CANCELADO`, limpa a reserva e libera os segundos na grade para a `FILA_ESPERA`.

---

## 4. Matriz de Transições de Estado

| Estado Atual | Ação Disparadora | Estado Alvo | Condições de Guarda (Guards) | Efeitos Colaterais (Side Effects) |
|---|---|---|---|---|
| *(Novo)* | Submeter anúncio | `PENDENTE` | Arquivo no R2 válido, duração > 0, ponto ativo | Notificar ADMINs: `ANUNCIO_PENDENTE` |
| `PENDENTE` | Admin Aprovar (Com Vaga) | `AGUARDANDO_PAGAMENTO` | `TempoOcupado + duracao <= 360s` | Cria fatura Pix. Define `reserva_expira_em = now() + 60m`. Notifica Anunciante. |
| `PENDENTE` | Admin Aprovar (Sem Vaga) | `FILA_ESPERA` | `TempoOcupado + duracao > 360s` | Não cobra Pix ainda. Notifica Anunciante: aguardando vaga na grade. |
| `PENDENTE` | Admin Rejeitar | `REJEITADO` | Justificativa preenchida ($\ge 5$ caracteres) | Grava `motivo_rejeicao`. Notifica Anunciante: `ANUNCIO_REJEITADO`. |
| `REJEITADO` | Admin Aprovar | *(BLOQUEADO)* | **Regra Absoluta:** Retorna HTTP 400. Rejeitado não vira ativo direto. | N/A |
| `AGUARDANDO_PAGAMENTO` | Webhook `billing.paid` | `ATIVO` | Assinatura HMAC válida E dentro do TTL de reserva | Atualiza fatura para `PAGO`. Ativa na TV. Notifica Anunciante e Dono da TV. |
| `AGUARDANDO_PAGAMENTO` | Expiração do Pix (TTL 60m) | `EXPIRADO` / `CANCELADO` | `reserva_expira_em < now()` sem pagamento | Libera segundos reservados. Cancela fatura. Notifica Anunciante. |
| `FILA_ESPERA` | Vaga Liberada no Ponto | `AGUARDANDO_PAGAMENTO` | `TempoOcupado + duracao <= 360s` | Reserva a nova vaga por 60m e gera fatura Pix AbacatePay. |
| `ATIVO` | Pausar | `PAUSADO` | Anunciante proprietário ou ADMIN | Libera tempo na grade de veiculação. |
| `PAUSADO` | Reativar | `ATIVO` | `TempoOcupado + duracao <= 360s` | Ocupa tempo na grade. |
| `ATIVO` | Expiração Temporal | `EXPIRADO` | `dataFim != null` E `dataFim < now()` | Notifica Anunciante: `SISTEMA` ("Campanha Concluída"). Libera tempo na grade. |
