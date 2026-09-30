# SPEC-03: Motor de Capacidade e Algoritmo de Precificação

## 1. Visão Geral
Esta especificação detalha o funcionamento matemático e os mecanismos de controle de capacidade da grade de programação (Loop DOOH de 360 segundos), a matriz de precificação/scoring comercial e a geração de cobranças via **AbacatePay**.

---

## 2. Motor de Capacidade (Loop de 360 Segundos)

### 2.1 Conceito da Grade de Programação
- Cada TV opera um loop contínuo de veiculação.
- A duração total padrão do ciclo é de **360 segundos (6 minutos)**.
- O campo `limiteTempoSegundos` da entidade `PontoMidia` define o teto da soma de tempos.
- Cada anúncio tem uma `duracaoSegundos` definida pelo arquivo de vídeo ou estipulada para a imagem (geralmente entre 10s e 30s).

### 2.2 Algoritmo de Validação de Capacidade com Slot Hold
Quando uma operação tenta alocar vaga na grade (Aprovação pelo Admin para gerar fatura ou Ativação direta):
1. **Calcular o tempo ocupado atual (Anúncios Ativos + Reservas de Pix vigentes):**
   ```sql
   SELECT COALESCE(SUM(a.duracao_segundos), 0)
   FROM anuncios a
   WHERE a.ponto_midia_id = :pontoId
     AND a.id != :anuncioId
     AND (
       -- Anúncios atualmente em veiculação
       (a.status = 'ATIVO' AND (a.data_fim IS NULL OR a.data_fim >= NOW()))
       OR
       -- Anúncios aguardando pagamento Pix com reserva dentro do TTL (Slot Hold)
       (a.status = 'AGUARDANDO_PAGAMENTO' AND a.reserva_expira_em > NOW())
     );
   ```
2. **Avaliar disponibilidade:**
   $$\text{TempoOcupado} + \text{duracaoSegundos}(\text{NovoAnuncio}) \le \text{limiteTempoSegundos}$$
3. **Decisão:**
   - Se houver espaço ($\le 360$s):
     - A vaga é travada preventivamente com `reserva_expira_em = NOW() + INTERVAL '60 MINUTES'`.
     - Fatura Pix gerada na AbacatePay com garantia 100% de veiculação imediata pós-pagamento.
   - Se exceder ($> 360$s):
     - Se `force == false` ou omitido: encaminhar para `FILA_ESPERA` sem gerar fatura até que abra espaço real.
     - Se for tentativa direta de forçar aprovação sem vaga: retornar **HTTP 409 Conflict** (`CAPACIDADE_EXCEDIDA`).
   - Se `force == true` (privilégio exclusivo de ADMIN):
     - Ação administrativa especial que flexibiliza o limite intencionalmente.

---

## 3. Matriz de Precificação, Scoring e Faturamento

### 3.1 Fórmula Ponderada Oficial
A nota de qualificação do ponto comercial combina quatro dimensões estratégicas:

| Dimensão | Peso no Score | Campo de Origem |
|---|---|---|
| **Fluxo Diário de Pessoas** | **30%** (0.30) | `PontoMidia.fluxoDiarioEstimado` ou `notaFluxo` |
| **Tempo de Espera / Permanência** | **35%** (0.35) | `PontoMidia.tempoPermanencia` ou `notaTempo` |
| **Perfil Socioeconômico** | **20%** (0.20) | `PontoMidia.faixaEtariaPublico` / `notaPerfil` |
| **Exclusividade / Ambiente da TV** | **15%** (0.15) | `PontoMidia.localInstalacao` / `notaExclusividade` |

$$\text{Score Ponderado} = (N_{\text{fluxo}} \times 0.30) + (N_{\text{tempo}} \times 0.35) + (N_{\text{perfil}} \times 0.20) + (N_{\text{exclusividade}} \times 0.15)$$

Todas as notas pertencem ao intervalo $[2.5, 5.0]$. O resultado é arredondado para 2 casas decimais.

### 3.2 Tabela de Tiers, Fatura AbacatePay e Repasse (Split)

| Tier | Score Range | Cobrança Anunciante (AbacatePay) | Centavos Enviados à API | Repasse Dono TV (50%) | Retenção Media+ (50%) |
|---|---|---|---|---|---|
| **Bronze** | 2.50 até 3.30 | **R$ 149,00** | `14900` | R$ 74,50 (`7450`) | R$ 74,50 (`7450`) |
| **Prata** | 3.31 até 4.20 | **R$ 199,00** | `19900` | R$ 99,50 (`9950`) | R$ 99,50 (`9950`) |
| **Ouro** | 4.21 até 5.00 | **R$ 249,00** | `24900` | R$ 124,50 (`12450`) | R$ 124,50 (`12450`) |

---

## 4. Normalização Heurística de Textos
Se as notas numéricas não forem informadas explicitamente no formulário de onboarding, o backend Java aplica normalização textual:

```java
public double mapearNotaFluxo(String fluxo) {
    if (fluxo == null) return 3.5;
    String f = fluxo.toLowerCase();
    if (f.contains("150 a 300") || f.contains("mais de 100") || f.contains("mais de 300") || f.contains("> 100") || f.contains(">100")) return 5.0;
    if (f.contains("80 a 150") || f.contains("51 a 100")) return 4.5;
    if (f.contains("30 a 80") || f.contains("31 a 50") || f.contains("30-80") || f.contains("31-50")) return 3.5;
    if (f.contains("até 30") || f.contains("10 a 30") || f.contains("menos de 30") || f.contains("10-30")) return 2.5;
    return 3.5;
}

public double mapearNotaTempo(String tempo) {
    if (tempo == null) return 3.5;
    String t = tempo.toLowerCase();
    if (t.contains("até 5") || t.contains("5 min") || t.contains("até 15 min")) return 2.5;
    if (t.contains("6 a 15") || t.contains("15 a 30 min") || t.contains("15-30")) return 3.5;
    if (t.contains("16 a 30") || t.contains("30 a 60 min") || t.contains("30-60")) return 4.5;
    if (t.contains("mais de 30") || t.contains("1 a 2 horas") || t.contains("mais de 2 horas") || t.contains("1-2 horas")) return 5.0;
    return 3.5;
}
```
