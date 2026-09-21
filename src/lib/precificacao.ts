/**
 * Módulo de Precificação e Scoring da Rede Media+
 * Baseado na matriz de precificação (Precificacao_Media_+.xlsx)
 */

export const PESOS_CRITERIOS = {
  fluxoDiario: 0.30,
  tempoEspera: 0.35,
  perfilPublico: 0.20,
  exclusividade: 0.15,
} as const;

export type TierType = "Bronze" | "Prata" | "Ouro";

export interface TierInfo {
  tier: TierType;
  scoreMin: number;
  scoreMax: number;
  cotaMensal: number;
  percentualRepasse: number;
  percentualMidiaMais: number;
  repasseAoPonto: number;
  receitaMidiaMais: number;
}

export const TIERS: Record<TierType, TierInfo> = {
  Bronze: {
    tier: "Bronze",
    scoreMin: 2.50,
    scoreMax: 3.30,
    cotaMensal: 149.00,
    percentualRepasse: 0.50,
    percentualMidiaMais: 0.50,
    repasseAoPonto: 74.50,
    receitaMidiaMais: 74.50,
  },
  Prata: {
    tier: "Prata",
    scoreMin: 3.31,
    scoreMax: 4.20,
    cotaMensal: 199.00,
    percentualRepasse: 0.50,
    percentualMidiaMais: 0.50,
    repasseAoPonto: 99.50,
    receitaMidiaMais: 99.50,
  },
  Ouro: {
    tier: "Ouro",
    scoreMin: 4.21,
    scoreMax: 5.00,
    cotaMensal: 249.00,
    percentualRepasse: 0.50,
    percentualMidiaMais: 0.50,
    repasseAoPonto: 124.50,
    receitaMidiaMais: 124.50,
  },
};

export const OPCOES_PERFIL_PUBLICO = [
  { label: "Predominância Classes D / E", nota: 2.5 },
  { label: "Predominância Classe C", nota: 3.5 },
  { label: "Classes B e C+ (consumo ativo)", nota: 4.5 },
  { label: "Público Premium / Classes A e B", nota: 5.0 },
] as const;

export const OPCOES_EXCLUSIVIDADE = [
  { label: "Ambiente ruidoso / TV mal posicionada", nota: 2.5 },
  { label: "Ruído moderado / TV visível de alguns ângulos", nota: 3.5 },
  { label: "Ambiente agradável / TV centralizada e visível", nota: 4.5 },
  { label: "Ambiente silencioso / visão frontal total", nota: 5.0 },
] as const;

export const OPCOES_FLUXO_DIARIO = [
  { label: "10 a 30 pessoas / dia", nota: 2.5 },
  { label: "31 a 50 pessoas / dia", nota: 3.5 },
  { label: "51 a 100 pessoas / dia", nota: 4.5 },
  { label: "Mais de 100 pessoas / dia", nota: 5.0 },
] as const;

export const OPCOES_TEMPO_ESPERA = [
  { label: "Até 5 minutos", nota: 2.5 },
  { label: "6 a 15 minutos", nota: 3.5 },
  { label: "16 a 30 minutos", nota: 4.5 },
  { label: "Mais de 30 minutos", nota: 5.0 },
] as const;

/**
 * Mapeia texto de fluxo diário existente para uma nota (2.5 a 5.0).
 */
export function mapearNotaFluxo(fluxo?: string | null): number {
  if (!fluxo) return 3.5;
  const f = fluxo.toLowerCase();
  if (f.includes("150 a 300") || f.includes("mais de 100") || f.includes("mais de 300") || f.includes("> 100") || f.includes(">100")) return 5.0;
  if (f.includes("80 a 150") || f.includes("51 a 100")) return 4.5;
  if (f.includes("30 a 80") || f.includes("31 a 50") || f.includes("30-80") || f.includes("31-50")) return 3.5;
  if (f.includes("até 30") || f.includes("10 a 30") || f.includes("menos de 30") || f.includes("10-30")) return 2.5;
  return 3.5;
}

/**
 * Mapeia texto de tempo de permanência existente para uma nota (2.5 a 5.0).
 */
export function mapearNotaTempo(tempo?: string | null): number {
  if (!tempo) return 3.5;
  const t = tempo.toLowerCase();
  if (t.includes("até 5") || t.includes("5 min") || t.includes("até 15 min")) return 2.5;
  if (t.includes("6 a 15") || t.includes("15 a 30 min") || t.includes("15-30")) return 3.5;
  if (t.includes("16 a 30") || t.includes("30 a 60 min") || t.includes("30-60")) return 4.5;
  if (t.includes("mais de 30") || t.includes("1 a 2 horas") || t.includes("mais de 2 horas") || t.includes("1-2 horas")) return 5.0;
  return 3.5;
}

/**
 * Calcula o score ponderado baseado nas 4 notas (2.5 a 5.0).
 */
export function calcularScorePonderado(
  notaFluxo: number,
  notaTempo: number,
  notaPerfil: number,
  notaExclusividade: number
): number {
  const score =
    notaFluxo * PESOS_CRITERIOS.fluxoDiario +
    notaTempo * PESOS_CRITERIOS.tempoEspera +
    notaPerfil * PESOS_CRITERIOS.perfilPublico +
    notaExclusividade * PESOS_CRITERIOS.exclusividade;

  return Math.round(score * 100) / 100;
}

/**
 * Determina o tier correspondente ao score ponderado.
 */
export function determinarTier(score: number): TierInfo {
  if (score >= 4.21) return TIERS.Ouro;
  if (score >= 3.31) return TIERS.Prata;
  return TIERS.Bronze;
}

/**
 * Calcula os valores completos de precificação para um ponto de mídia.
 */
export function calcularPrecificacaoPonto(dados: {
  fluxoDiarioEstimado?: string | null;
  tempoPermanencia?: string | null;
  notaFluxo?: number | null;
  notaTempo?: number | null;
  notaPerfil?: number | null;
  notaExclusividade?: number | null;
}) {
  const notaFluxo = dados.notaFluxo ?? mapearNotaFluxo(dados.fluxoDiarioEstimado);
  const notaTempo = dados.notaTempo ?? mapearNotaTempo(dados.tempoPermanencia);
  const notaPerfil = dados.notaPerfil ?? 3.5;
  const notaExclusividade = dados.notaExclusividade ?? 3.5;

  const scorePonderado = calcularScorePonderado(
    notaFluxo,
    notaTempo,
    notaPerfil,
    notaExclusividade
  );

  const tierInfo = determinarTier(scorePonderado);

  return {
    notaFluxo,
    notaTempo,
    notaPerfil,
    notaExclusividade,
    scorePonderado,
    tier: tierInfo.tier,
    cotaMensal: tierInfo.cotaMensal,
    repasseAoPonto: tierInfo.repasseAoPonto,
    receitaMidiaMais: tierInfo.receitaMidiaMais,
    percentualRepasse: tierInfo.percentualRepasse,
  };
}

/**
 * Formata valor em moeda BRL (ex: R$ 249,00).
 */
export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
