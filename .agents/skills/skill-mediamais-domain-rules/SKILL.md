---
name: skill-mediamais-domain-rules
description: Regras de negócio essenciais da Media+ cobrindo matriz de precificação, scoring ponderado, tiers, motor de capacidade de 360s, máquina de estados com faturamento AbacatePay e ciclo de vida de anúncios.
---

# Skill: Regras de Domínio e Negócio (Media+)

Esta skill descreve detalhadamente o conjunto normativo de regras de negócio da plataforma Media+.

## 1. Matriz de Precificação e Scoring

### Pesos Oficiais
A pontuação de um ponto comercial é calculada pela fórmula ponderada:
$$\text{Score} = (\text{NotaFluxo} \times 0.30) + (\text{NotaTempo} \times 0.35) + (\text{NotaPerfil} \times 0.20) + (\text{NotaExclusividade} \times 0.15)$$

Todas as 4 notas variam de **2.5** a **5.0**. O score final é arredondado para 2 casas decimais.

### Mapeamento de Entradas Textuais
- **Fluxo Diário:**
  - `> 100` ou `Mais de 100` ou `150 a 300`: **5.0**
  - `51 a 100` ou `80 a 150`: **4.5**
  - `31 a 50` ou `30 a 80`: **3.5**
  - `Até 30` ou `10 a 30`: **2.5**
- **Tempo de Permanência:**
  - `Mais de 30 minutos` ou `1 a 2 horas`: **5.0**
  - `16 a 30 minutos` ou `30 a 60 min`: **4.5**
  - `6 a 15 minutos`: **3.5**
  - `Até 5 minutos`: **2.5**
- **Perfil do Público:**
  - Premium / Classes A e B: **5.0**
  - Classes B e C+ (consumo ativo): **4.5**
  - Predominância Classe C: **3.5**
  - Classes D / E: **2.5**
- **Exclusividade e Ruído:**
  - Ambiente silencioso / visão frontal total: **5.0**
  - Ambiente agradável / TV centralizada e visível: **4.5**
  - Ruído moderado / TV visível de alguns ângulos: **3.5**
  - Ambiente ruidoso / TV mal posicionada: **2.5**

### Tiers e Faturamento AbacatePay
| Tier | Score Range | Cota Mensal (Cobrança AbacatePay) | Repasse ao Ponto (50%) | Receita Media+ (50%) |
|---|---|---|---|---|
| **Bronze** | 2.50 a 3.30 | R$ 149,00 (14900 centavos) | R$ 74,50 | R$ 74,50 |
| **Prata** | 3.31 a 4.20 | R$ 199,00 (19900 centavos) | R$ 99,50 | R$ 99,50 |
| **Ouro** | 4.21 a 5.00 | R$ 249,00 (24900 centavos) | R$ 124,50 | R$ 124,50 |

---

## 2. Motor de Capacidade e Slot Hold (Grade de 360 Segundos)

- Cada Ponto de Mídia possui um `limiteTempoSegundos` fixado em **360 segundos (6 minutos)** por padrão.
- **Reserva Preventiva (Slot Hold):** Ao aprovar uma campanha, o sistema bloqueia os segundos na grade por 60 minutos (`reservaExpiraEm = now() + 60m`) e emite a fatura Pix.
- **Cálculo da Ocupação:**
  $$\text{TempoOcupado} = \sum \text{duracao}(\text{ATIVO}) + \sum \text{duracao}(\text{AGUARDANDO\_PAGAMENTO com reserva ativa})$$
- Se $\text{TempoOcupado} + \text{duracaoNovoAnuncio} \le \text{limiteTempoSegundos}$:
  - Vaga garantida; gera fatura Pix AbacatePay com certeza de ativação imediata pós-pagamento.
- Se ultrapassar o limite:
  - Anúncio é encaminhado para `FILA_ESPERA` sem cobrança antecipada, abrindo fatura somente quando liberar vaga real.
  - Parâmetro `force = true` é reservado para administradores que desejam flexibilizar o limite intencionalmente.

---

## 3. Máquina de Estados do Anúncio e Ciclo de Faturamento

- Estados possíveis: `PENDENTE`, `APROVADO`, `AGUARDANDO_PAGAMENTO`, `REJEITADO`, `ATIVO`, `PAUSADO`, `EXPIRADO`, `FILA_ESPERA`.
- **Regras de Transição:**
  1. Criação -> `PENDENTE`.
  2. Moderador aprova (com vaga) -> `AGUARDANDO_PAGAMENTO` com Slot Hold de 60m e fatura Pix AbacatePay.
  3. Moderador aprova (sem vaga) -> `FILA_ESPERA` (sem cobrança até liberar vaga).
  4. Moderador rejeita -> `REJEITADO` com justificativa obrigatória.
  5. Webhook AbacatePay confirma `billing.paid` -> `ATIVO` imediato garantido pelo Slot Hold.
  6. Pix não pago dentro de 60m -> `EXPIRADO` / `CANCELADO`, liberando a vaga imediatamente.
  7. Anúncio `REJEITADO` **NÃO** pode ser aprovado diretamente (retornar HTTP 400).
  8. Anúncio da `FILA_ESPERA` é promovido para `AGUARDANDO_PAGAMENTO` assim que vaga é liberada.
  9. Se `dataFim < agora`, o anúncio transiciona para `EXPIRADO` automaticamente.
