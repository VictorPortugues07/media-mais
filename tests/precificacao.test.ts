import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calcularScorePonderado,
  determinarTier,
  calcularPrecificacaoPonto,
  mapearNotaFluxo,
  mapearNotaTempo,
  PESOS_CRITERIOS,
  TIERS,
} from "@/lib/precificacao";

describe("Módulo de Precificação e Scoring (Planilha Media+)", () => {
  it("Deve aplicar os pesos exatos da planilha: 30% fluxo, 35% tempo, 20% perfil, 15% exclusividade", () => {
    assert.equal(PESOS_CRITERIOS.fluxoDiario, 0.30);
    assert.equal(PESOS_CRITERIOS.tempoEspera, 0.35);
    assert.equal(PESOS_CRITERIOS.perfilPublico, 0.20);
    assert.equal(PESOS_CRITERIOS.exclusividade, 0.15);
    const somaPesos =
      PESOS_CRITERIOS.fluxoDiario +
      PESOS_CRITERIOS.tempoEspera +
      PESOS_CRITERIOS.perfilPublico +
      PESOS_CRITERIOS.exclusividade;
    assert.equal(Math.round(somaPesos * 100) / 100, 1.0);
  });

  it("Deve calcular o score exatamente como a planilha para o caso OdontoCenter (Ouro, score 4.75)", () => {
    // OdontoCenter na planilha:
    // Fluxo: 51 a 100 -> 4.5
    // Tempo: Mais de 30 min -> 5.0
    // Perfil: B e C+ -> 4.5
    // Exclusividade: Silencioso / frontal -> 5.0
    // Score esperado: 4.5*0.3 + 5.0*0.35 + 4.5*0.2 + 5.0*0.15 = 1.35 + 1.75 + 0.90 + 0.75 = 4.75
    const score = calcularScorePonderado(4.5, 5.0, 4.5, 5.0);
    assert.equal(score, 4.75);

    const tier = determinarTier(score);
    assert.equal(tier.tier, "Ouro");
    assert.equal(tier.cotaMensal, 249.00);
    assert.equal(tier.repasseAoPonto, 124.50);
    assert.equal(tier.receitaMidiaMais, 124.50);
  });

  it("Deve classificar como Tier Bronze pontos com score entre 2.50 e 3.30", () => {
    const minScore = calcularScorePonderado(2.5, 2.5, 2.5, 2.5);
    assert.equal(minScore, 2.50);
    const tierMin = determinarTier(minScore);
    assert.equal(tierMin.tier, "Bronze");
    assert.equal(tierMin.cotaMensal, 149.00);
    assert.equal(tierMin.repasseAoPonto, 74.50);
    assert.equal(tierMin.receitaMidiaMais, 74.50);

    const maxBronze = determinarTier(3.30);
    assert.equal(maxBronze.tier, "Bronze");
  });

  it("Deve classificar como Tier Prata pontos com score entre 3.31 e 4.20", () => {
    const tierPrataMin = determinarTier(3.31);
    assert.equal(tierPrataMin.tier, "Prata");
    assert.equal(tierPrataMin.cotaMensal, 199.00);
    assert.equal(tierPrataMin.repasseAoPonto, 99.50);
    assert.equal(tierPrataMin.receitaMidiaMais, 99.50);

    const tierPrataMax = determinarTier(4.20);
    assert.equal(tierPrataMax.tier, "Prata");
  });

  it("Deve mapear fluxos e tempos de permanência existentes para notas automáticas", () => {
    assert.equal(mapearNotaFluxo("Até 30 pessoas"), 2.5);
    assert.equal(mapearNotaFluxo("30 a 80 pessoas"), 3.5);
    assert.equal(mapearNotaFluxo("80 a 150 pessoas"), 4.5);
    assert.equal(mapearNotaFluxo("Mais de 300 pessoas"), 5.0);

    assert.equal(mapearNotaTempo("Até 15 min"), 2.5);
    assert.equal(mapearNotaTempo("15 a 30 min"), 3.5);
    assert.equal(mapearNotaTempo("30 a 60 min"), 4.5);
    assert.equal(mapearNotaTempo("Mais de 2 horas"), 5.0);
  });

  it("Deve calcular precificação completa com repasse de 50% sem repassar o valor da cota cheia ao ponto", () => {
    const resultado = calcularPrecificacaoPonto({
      fluxoDiarioEstimado: "51 a 100 pessoas / dia",
      tempoPermanencia: "Mais de 30 minutos",
      notaPerfil: 4.5,
      notaExclusividade: 5.0,
    });

    assert.equal(resultado.scorePonderado, 4.75);
    assert.equal(resultado.tier, "Ouro");
    assert.equal(resultado.cotaMensal, 249.00);
    assert.equal(resultado.repasseAoPonto, 124.50);
    assert.equal(resultado.receitaMidiaMais, 124.50);
    assert.equal(resultado.percentualRepasse, 0.50);
  });
});
