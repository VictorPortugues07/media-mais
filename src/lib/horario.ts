/**
 * Utilitários de cálculo de horários de funcionamento e fusos da Plataforma Media+
 */

export function isPontoEmHorarioFuncionamento(
  diasFuncionamento: string[] | null,
  horarioAbertura: string | null,
  horarioFechamento: string | null,
  dataReferencia: Date = new Date()
): boolean {
  try {
    // Obter hora e dia no fuso de Brasília (America/Sao_Paulo)
    const formatter = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      weekday: "long",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });

    const parts = formatter.formatToParts(dataReferencia);
    const weekdayRaw = parts.find((p) => p.type === "weekday")?.value || "";
    const horaAtual = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
    const minAtualNum = Number(parts.find((p) => p.type === "minute")?.value ?? 0);

    // Normalizar dia: "segunda-feira" -> "Segunda", "sábado" -> "Sábado"
    const diaBase = weekdayRaw.split("-")[0]?.trim() || "";
    const diaHoje = diaBase.charAt(0).toUpperCase() + diaBase.slice(1);

    const dias =
      diasFuncionamento && diasFuncionamento.length > 0
        ? diasFuncionamento
        : ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

    // Tratamento de acentuação para comparação robusta
    const normalizar = (s: string) =>
      s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const diasNormalizados = dias.map(normalizar);
    if (!diasNormalizados.includes(normalizar(diaHoje))) {
      return false;
    }

    const abertura = horarioAbertura || "08:00";
    const fechamento = horarioFechamento || "19:00";

    const [hAbreRaw, mAbreRaw] = abertura.split(":").map(Number);
    const [hFechaRaw, mFechaRaw] = fechamento.split(":").map(Number);

    const horaAbre = !isNaN(hAbreRaw!) ? hAbreRaw! : 8;
    const minAbre = !isNaN(mAbreRaw!) ? mAbreRaw! : 0;
    const horaFecha = !isNaN(hFechaRaw!) ? hFechaRaw! : 19;
    const minFecha = !isNaN(mFechaRaw!) ? mFechaRaw! : 0;

    const minAtual = horaAtual * 60 + minAtualNum;
    const minInicio = horaAbre * 60 + minAbre;
    const minFim = horaFecha * 60 + minFecha;

    // Caso 1: Horário 24 horas (ex: 00:00 às 23:59 ou 00:00 às 00:00)
    if (minInicio === 0 && (minFim >= 1439 || minFim === 0)) {
      return true;
    }

    // Caso 2: Turno noturno que cruza a meia-noite (ex: 18:00 às 02:00)
    if (minFim < minInicio) {
      return minAtual >= minInicio || minAtual <= minFim;
    }

    // Caso 3: Turno diurno no mesmo dia (ex: 08:00 às 19:00)
    return minAtual >= minInicio && minAtual <= minFim;
  } catch {
    return true;
  }
}

/**
 * Retorna o início do dia (00:00:00) no fuso horário oficial de Brasília
 */
export function getInicioDoDiaBrasilia(referencia = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(referencia);

  const ano = Number(parts.find((p) => p.type === "year")?.value);
  const mes = Number(parts.find((p) => p.type === "month")?.value);
  const dia = Number(parts.find((p) => p.type === "day")?.value);

  // Criar data meia noite no fuso local aproximado (UTC-3)
  const inicio = new Date(Date.UTC(ano, mes - 1, dia, 3, 0, 0, 0));
  return inicio;
}
