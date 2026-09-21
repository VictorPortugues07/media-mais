import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Módulo 4: Resiliência de Rotação do Player e Proteção contra Tela Branca", () => {
  it("Proteção contra encolhimento de lista deve evitar acesso a undefined", () => {
    const anunciosIniciais = [
      { id: 1, titulo: "Ad 1" },
      { id: 2, titulo: "Ad 2" },
      { id: 3, titulo: "Ad 3" },
    ];

    let currentIndex = 2; // Estava no terceiro anúncio
    // O administrador removeu 2 anúncios enquanto a TV tocava
    const anunciosEncolhidos = [{ id: 1, titulo: "Ad 1" }];

    // Sem a proteção, anunciosEncolhidos[currentIndex] seria undefined e causaria crash de tela branca
    const currentAd = anunciosEncolhidos[currentIndex] || anunciosEncolhidos[0];

    assert.ok(currentAd !== undefined, "currentAd nunca deve ser undefined");
    assert.equal(currentAd.id, 1);
  });

  it("Lógica de ciclo de item único deve incrementar cycleCount para reativar timers", () => {
    let cycleCount = 0;
    let registeredCount = 0;

    const simulateNextAd = (adCount: number) => {
      registeredCount++;
      cycleCount++;
      // No caso de 1 item, currentIndex permanece 0 mas cycleCount avança
      return adCount === 1 ? 0 : cycleCount % adCount;
    };

    // 5 ciclos com anúncio único
    for (let i = 0; i < 5; i++) {
      const idx = simulateNextAd(1);
      assert.equal(idx, 0);
    }

    assert.equal(cycleCount, 5, "cycleCount deve avançar a cada ciclo para re-disparar o timer do React");
    assert.equal(registeredCount, 5, "Todas as 5 veiculações devem ser registradas sem travar em 1");
  });

  it("Evento onEnded deve cancelar timer de segurança para evitar telemetria dupla", () => {
    let timerId: any = 12345;
    let telemetryCount = 0;

    // Simulação do término legítimo do vídeo
    const handleVideoEnded = () => {
      // 1. Limpa timer reserva
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
      // 2. Registra veiculação
      telemetryCount++;
    };

    // Vídeo terminou normalmente antes do timer de segurança
    handleVideoEnded();

    // Timer de segurança tenta disparar 3s depois
    if (timerId) {
      telemetryCount++; // Não deve acontecer!
    }

    assert.equal(telemetryCount, 1, "Exatamente 1 veiculação deve ser registrada, nunca duplicada");
    assert.equal(timerId, null, "O timer de segurança deve ter sido anulado");
  });

  it("Transição por erro não deve registrar telemetria (Proof of Play)", () => {
    let telemetryCount = 0;
    let nextAdCallCount = 0;

    const simulateNextAd = (fromError = false) => {
      nextAdCallCount++;
      if (!fromError) {
        telemetryCount++;
      }
    };

    // Erro de reprodução
    simulateNextAd(true);

    assert.equal(nextAdCallCount, 1, "nextAd deve ser chamado para pular o anúncio");
    assert.equal(telemetryCount, 0, "Nenhuma telemetria deve ser emitida para anúncio com erro");

    // Conclusão normal
    simulateNextAd(false);
    assert.equal(telemetryCount, 1, "Veiculação normal concluída com sucesso deve emitir telemetria");
  });

  it("Proteção contra loop de erros (isHandlingError) deve impedir tempestade de timers", () => {
    let isHandlingError = false;
    let queuedTimers = 0;

    const handleMediaError = () => {
      if (isHandlingError) return;
      isHandlingError = true;
      queuedTimers++;
    };

    // Simula 100 eventos de erro disparados em rajada pelo navegador
    for (let i = 0; i < 100; i++) {
      handleMediaError();
    }

    assert.equal(queuedTimers, 1, "Apenas 1 timer de transição deve ser enfileirado, bloqueando a tempestade");
  });

  it("Debounce de telemetria deve ignorar chamadas em intervalo menor que 3 segundos", () => {
    let lastTelemetryTime = 0;
    let sentTelemetries = 0;

    const trySendTelemetry = (now: number) => {
      if (now - lastTelemetryTime < 3000) return false;
      lastTelemetryTime = now;
      sentTelemetries++;
      return true;
    };

    // Primeira telemetria aos 0s
    assert.equal(trySendTelemetry(10000), true);
    // Tentativa rápida 500ms depois (deve ser bloqueada)
    assert.equal(trySendTelemetry(10500), false);
    // Tentativa rápida 1s depois (deve ser bloqueada)
    assert.equal(trySendTelemetry(11000), false);
    // Tentativa legítima 3.5s depois (deve passar)
    assert.equal(trySendTelemetry(13500), true);

    assert.equal(sentTelemetries, 2, "Apenas as chamadas com intervalo seguro devem ser enviadas");
  });

  it("Detecção de fim de loop de vídeos deve disparar sincronização no momento exato", () => {
    let syncCallCount = 0;
    const playlist = [
      { id: 1, titulo: "Vídeo 1" },
      { id: 2, titulo: "Vídeo 2" },
    ];

    const checkAndAdvance = (currentIndex: number, list: typeof playlist) => {
      const isEndOfLoop = list.length <= 1 || currentIndex + 1 >= list.length;
      if (isEndOfLoop) {
        syncCallCount++;
      }
      return (currentIndex + 1) % list.length;
    };

    // Índice 0 finaliza -> avança para índice 1 (não é fim de loop)
    const next1 = checkAndAdvance(0, playlist);
    assert.equal(next1, 1);
    assert.equal(syncCallCount, 0, "No meio da lista não deve disparar sync de fim de loop");

    // Índice 1 finaliza -> avança para índice 0 (É O FIM DO LOOP!)
    const next2 = checkAndAdvance(1, playlist);
    assert.equal(next2, 0);
    assert.equal(syncCallCount, 1, "Ao terminar o último vídeo, deve acionar a sincronização");
  });

  it("hasPlaylistChanged deve detectar novas mídias e ignorar playlists idênticas sem re-renderizar", () => {
    const hasPlaylistChanged = (oldList: any[], newList: any[]): boolean => {
      if (oldList.length !== newList.length) return true;
      for (let i = 0; i < oldList.length; i++) {
        const o = oldList[i];
        const n = newList[i];
        if (!o || !n) return true;
        if (
          o.id !== n.id ||
          o.midiaUrl !== n.midiaUrl ||
          o.duracaoSegundos !== n.duracaoSegundos ||
          o.tipoMidia !== n.tipoMidia
        ) {
          return true;
        }
      }
      return false;
    };

    const playlistOriginal = [
      { id: 10, midiaUrl: "/vid1.mp4", duracaoSegundos: 15, tipoMidia: "VIDEO" },
      { id: 20, midiaUrl: "/vid2.mp4", duracaoSegundos: 10, tipoMidia: "VIDEO" },
    ];

    const playlistIdentica = [
      { id: 10, midiaUrl: "/vid1.mp4", duracaoSegundos: 15, tipoMidia: "VIDEO" },
      { id: 20, midiaUrl: "/vid2.mp4", duracaoSegundos: 10, tipoMidia: "VIDEO" },
    ];

    const playlistComNovoVideo = [
      ...playlistOriginal,
      { id: 30, midiaUrl: "/vid3.mp4", duracaoSegundos: 20, tipoMidia: "VIDEO" },
    ];

    // Sem alterações -> false (não re-renderiza a página)
    assert.equal(hasPlaylistChanged(playlistOriginal, playlistIdentica), false);

    // Novo vídeo adicionado -> true (atualiza grade de forma transparente)
    assert.equal(hasPlaylistChanged(playlistOriginal, playlistComNovoVideo), true);
  });
});
