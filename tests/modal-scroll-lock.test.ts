import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Módulo 5: Trava de Rolagem de Múltiplos Modais (Scroll Lock)", () => {
  it("Deve manter rolagem travada (hidden) enquanto houver pelo menos 1 modal aberto", () => {
    let activeModalsCount = 0;
    let bodyOverflow = "unset";

    const openModal = () => {
      activeModalsCount++;
      bodyOverflow = "hidden";
    };

    const closeModal = () => {
      activeModalsCount = Math.max(0, activeModalsCount - 1);
      if (activeModalsCount === 0) {
        bodyOverflow = "unset";
      }
    };

    // 1. Abre primeiro modal (ex: detalhes da campanha)
    openModal();
    assert.equal(activeModalsCount, 1);
    assert.equal(bodyOverflow, "hidden");

    // 2. Abre segundo modal por cima (ex: confirmação de exclusão)
    openModal();
    assert.equal(activeModalsCount, 2);
    assert.equal(bodyOverflow, "hidden");

    // 3. Fecha o segundo modal (de confirmação)
    closeModal();
    assert.equal(activeModalsCount, 1);
    // IMPORTANTE: bodyOverflow AINDA deve ser 'hidden' porque o primeiro modal continua aberto!
    assert.equal(bodyOverflow, "hidden", "O primeiro modal ainda está aberto, o scroll não pode ser liberado!");

    // 4. Fecha o primeiro modal
    closeModal();
    assert.equal(activeModalsCount, 0);
    assert.equal(bodyOverflow, "unset", "Todos os modais foram fechados, o scroll deve ser liberado");
  });
});
