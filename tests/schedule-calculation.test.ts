import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isPontoEmHorarioFuncionamento, getInicioDoDiaBrasilia } from "../src/lib/horario";

describe("Módulo 3: Cálculos de Horário e Fuso Horário de Brasília", () => {
  it("Deve calcular corretamente início do dia em Brasília (meia-noite local)", () => {
    const dataRef = new Date("2026-09-11T12:00:00Z");
    const inicioDia = getInicioDoDiaBrasilia(dataRef);

    assert.equal(inicioDia.getUTCHours(), 3, "00:00 em Brasília (UTC-3) corresponde a 03:00 UTC");
  });

  it("Estabelecimento 24 horas (00:00 às 23:59) deve ser considerado aberto a qualquer hora do dia", () => {
    const dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

    // Horários no mesmo dia da semana
    const dataMeiaNoite = new Date("2026-09-11T03:15:00Z"); // ~00:15 em SP
    const dataMadrugada = new Date("2026-09-11T07:00:00Z"); // ~04:00 em SP
    const dataTarde = new Date("2026-09-11T17:00:00Z");     // ~14:00 em SP

    assert.equal(isPontoEmHorarioFuncionamento(dias, "00:00", "23:59", dataMeiaNoite), true);
    assert.equal(isPontoEmHorarioFuncionamento(dias, "00:00", "23:59", dataMadrugada), true);
    assert.equal(isPontoEmHorarioFuncionamento(dias, "00:00", "23:59", dataTarde), true);
  });

  it("Estabelecimento com turno noturno (18:00 às 02:00) deve ser considerado aberto antes e depois da meia-noite", () => {
    const dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

    // 23:30 em SP (UTC 02:30 dia seguinte)
    const dataNoite = new Date("2026-09-12T02:30:00Z");
    assert.equal(isPontoEmHorarioFuncionamento(dias, "18:00", "02:00", dataNoite), true);

    // 01:15 em SP (UTC 04:15)
    const dataMadrugada = new Date("2026-09-12T04:15:00Z");
    assert.equal(isPontoEmHorarioFuncionamento(dias, "18:00", "02:00", dataMadrugada), true);

    // 10:00 da manhã em SP (UTC 13:00) -> deve estar fechado
    const dataManha = new Date("2026-09-11T13:00:00Z");
    assert.equal(isPontoEmHorarioFuncionamento(dias, "18:00", "02:00", dataManha), false);
  });

  it("Horário de abertura 00:00 não deve ser convertido erroneamente para 08:00", () => {
    const dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
    // 04:00 em SP
    const dataMadrugada = new Date("2026-09-11T07:00:00Z");

    // Das 00:00 às 12:00 -> às 04:00 DEVE estar aberto
    assert.equal(isPontoEmHorarioFuncionamento(dias, "00:00", "12:00", dataMadrugada), true);
  });
});
