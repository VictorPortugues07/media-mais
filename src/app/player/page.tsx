"use client";

import React, { useEffect, useState, useRef } from "react";
import { TVFrame } from "@/components/tv/TVFrame";
import { Logo } from "@/components/ui/Logo";
import { PlayerErrorBoundary } from "@/components/tv/PlayerErrorBoundary";

interface TVAnuncio {
  id: number;
  titulo: string;
  tipoMidia: "VIDEO" | "IMAGEM";
  midiaUrl: string;
  duracaoSegundos: number;
  anunciante: {
    nomeEmpresa: string;
  };
}

interface PontoInfo {
  id: number;
  nomeEmpresa: string;
  status: string;
  categoria: string;
  cidade: string;
  uf: string;
}

export default function StandaloneTVPlayerPage() {
  return (
    <PlayerErrorBoundary>
      <StandaloneTVPlayerInner />
    </PlayerErrorBoundary>
  );
}

function StandaloneTVPlayerInner() {
  const [pairedCode, setPairedCode] = useState<string>("");
  const [pairToken, setPairToken] = useState<string>("");
  const [codeDigits, setCodeDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [activeDigitIndex, setActiveDigitIndex] = useState<number>(0);
  const [ponto, setPonto] = useState<PontoInfo | null>(null);
  const [anuncios, setAnuncios] = useState<TVAnuncio[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHandlingErrorRef = useRef(false);
  const lastTelemetryTimeRef = useRef(0);
  const anunciosRef = useRef<TVAnuncio[]>(anuncios);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    anunciosRef.current = anuncios;
  }, [anuncios]);

  // Detectar tipo de dispositivo, hardware de Smart TV e resolução
  const getDeviceInfo = () => {
    if (typeof window === "undefined") {
      return {
        deviceType: "SMART_TV" as const,
        deviceLabel: "Smart TV",
        screenResolution: "1920x1080",
        isPortrait: false,
        isMobile: false,
        isTV: true,
        userAgent: "",
      };
    }

    const ua = navigator.userAgent || "";
    const screenW = window.screen.width;
    const screenH = window.screen.height;
    const isPortrait = screenH > screenW;

    // Detectar assinaturas nativas de Smart TVs
    const isTizen = /Tizen|SMART-TV|Maple/i.test(ua);
    const isWebOS = /webOS|Web0S|NetCast/i.test(ua);
    const isAndroidTV = /GoogleTV|Android TV|MiTV|BRAVIA|AFTT|AFTM|Fire TV/i.test(ua);
    const isRoku = /Roku/i.test(ua);
    const isAppleTV = /AppleTV/i.test(ua);
    const isGenericSmartTV = /SmartTV|Smart-TV|HbbTV|Vewd|Opera TV|CrKey/i.test(ua);

    const isTV = isTizen || isWebOS || isAndroidTV || isRoku || isAppleTV || isGenericSmartTV;

    // Detectar celulares e smartphones de mão
    const isPhoneUA = /iPhone|iPod|Android.*Mobile|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTouchPhone = typeof navigator !== "undefined" && navigator.maxTouchPoints > 1 && (screenW < 900 || screenH < 900) && isPortrait;
    const isMobile = (isPhoneUA || isTouchPhone) && !isTV;

    let deviceType: "SMART_TV" | "DESKTOP" | "TABLET" | "MOBILE" = "SMART_TV";
    let deviceLabel = "Smart TV";

    if (isTizen) {
      deviceType = "SMART_TV";
      deviceLabel = "Smart TV Samsung (Tizen)";
    } else if (isWebOS) {
      deviceType = "SMART_TV";
      deviceLabel = "Smart TV LG (webOS)";
    } else if (isAndroidTV) {
      deviceType = "SMART_TV";
      deviceLabel = "Android TV / Google TV";
    } else if (isRoku) {
      deviceType = "SMART_TV";
      deviceLabel = "Roku TV";
    } else if (isAppleTV) {
      deviceType = "SMART_TV";
      deviceLabel = "Apple TV";
    } else if (isGenericSmartTV) {
      deviceType = "SMART_TV";
      deviceLabel = "Smart TV Integrada";
    } else if (isMobile) {
      deviceType = "MOBILE";
      deviceLabel = "Smartphone / Celular";
    } else if (/iPad|Android(?!.*Mobile)/i.test(ua) || (navigator.maxTouchPoints > 1 && screenW >= 768)) {
      deviceType = "TABLET";
      deviceLabel = "Tablet Comercial";
    } else {
      deviceType = "DESKTOP";
      deviceLabel = "Totem / Mini PC (1080p)";
    }

    return {
      deviceType,
      deviceLabel,
      screenResolution: `${screenW}x${screenH}`,
      isPortrait,
      isMobile,
      isTV,
      userAgent: ua.substring(0, 200),
    };
  };

  // Detectar visibilidade da pagina (minimizado, troca de app, etc)
  useEffect(() => {
    const handleVisibilityChange = () => {
      setPageVisible(!document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Desbloquear audio em caso de restricao de autoplay do navegador
  useEffect(() => {
    const unlockAudio = () => {
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.volume = 1;
        videoRef.current.play().catch(() => {});
      }
    };
    window.addEventListener("click", unlockAudio, { once: true });
    window.addEventListener("touchstart", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  // Detectar dispositivo e ativar Wake Lock para manter a TV sempre ligada
  useEffect(() => {
    const info = getDeviceInfo();
    // Bloquear se for dispositivo mobile (celular/smartphone em modo retrato ou tela pequena)
    if (info.isMobile || (info.isPortrait && !info.isTV)) {
      setIsMobileDevice(true);
    }
    setLoading(false);

    // Screen Wake Lock API para evitar descanso de tela na TV
    if (typeof navigator !== "undefined" && "wakeLock" in navigator && !info.isMobile) {
      try {
        (navigator as any).wakeLock?.request("screen").catch(() => {});
      } catch {}
    }
  }, []);

  // 2. Conectar à API com o código rotativo
  const connectWithCode = async (code: string) => {
    setConnecting(true);
    setErrorMessage("");
    try {
      const res = await fetch(`/api/tv/parear?codigo=${code}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Código expirado ou inválido.");
      }

      setPonto(data.ponto);
      setAnuncios(data.anuncios || []);
      anunciosRef.current = data.anuncios || [];
      setPairedCode(code);
      setPairToken(data.token || "");
      setLoading(false);

      // Envia heartbeat imediato para atualizar status no painel instantaneamente com token
      const deviceInfo = getDeviceInfo();
      fetch("/api/tv/telemetria", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tv-token": data.token || "",
        },
        body: JSON.stringify({
          pontoId: data.ponto.id,
          token: data.token || "",
          heartbeatOnly: true,
          deviceType: deviceInfo.deviceType,
          screenResolution: deviceInfo.screenResolution,
        }),
      }).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Código inválido ou expirado";
      setErrorMessage(msg);
      setPairedCode("");
      setPairToken("");
      setCodeDigits(["", "", "", "", "", ""]);
      digitInputRefs.current[0]?.focus();
      setActiveDigitIndex(0);
      setLoading(false);
    } finally {
      setConnecting(false);
    }
  };

  // Comparação profunda de playlist para evitar re-renderizações desnecessárias
  const hasPlaylistChanged = (oldList: TVAnuncio[], newList: TVAnuncio[]): boolean => {
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

  // Sincronização inteligente em segundo plano no fim de cada loop
  // Atualiza novos vídeos/imagens sem piscar a tela e sem recarregar a página
  const syncPlaylistInBackground = async () => {
    if (!ponto?.id || !pairToken || isSyncingRef.current) return;
    isSyncingRef.current = true;
    try {
      const res = await fetch(
        `/api/tv/parear?pontoId=${ponto.id}&token=${encodeURIComponent(pairToken)}&_t=${Date.now()}`,
        {
          headers: { "x-tv-token": pairToken },
          cache: "no-store",
        }
      );
      if (res.ok) {
        const data = await res.json();
        const novasCampanhas: TVAnuncio[] = data.anuncios || [];
        if (hasPlaylistChanged(anunciosRef.current, novasCampanhas)) {
          console.log(
            `[Player] Nova mídia detectada no final do loop! Inserindo ${novasCampanhas.length} anúncio(s) na grade.`
          );
          anunciosRef.current = novasCampanhas;
          setAnuncios(novasCampanhas);
          setCurrentIndex((curr) => (curr >= novasCampanhas.length ? 0 : curr));
        }
      }
    } catch (err) {
      console.error("[Player] Falha na checagem silenciosa da playlist:", err);
    } finally {
      isSyncingRef.current = false;
    }
  };

  // 3. Polling para sincronizar novas campanhas e telemetria / heartbeat contínuo
  useEffect(() => {
    if (!ponto?.id || !pairToken) return;

    // Notificar desconexão imediata ao fechar a janela / sair do player
    const handleUnload = () => {
      if (ponto?.id && pairToken) {
        navigator.sendBeacon?.(
          `/api/tv/telemetria?token=${encodeURIComponent(pairToken)}`,
          JSON.stringify({ pontoId: ponto.id, token: pairToken, offline: true })
        );
      }
    };
    window.addEventListener("beforeunload", handleUnload);

    // Heartbeat a cada 4 segundos para status em tempo real sem delay
    const heartbeatInterval = setInterval(async () => {
      if (!pageVisible) return;
      try {
        const deviceInfo = getDeviceInfo();
        await fetch("/api/tv/telemetria", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tv-token": pairToken,
          },
          body: JSON.stringify({
            pontoId: ponto.id,
            token: pairToken,
            heartbeatOnly: true,
            deviceType: deviceInfo.deviceType,
            screenResolution: deviceInfo.screenResolution,
          }),
        });
      } catch (err) {
        console.error("Heartbeat error:", err);
      }
    }, 4000);

    // Polling de fallback em segundo plano (caso a tela esteja ociosa ou sem anúncios)
    const syncInterval = setInterval(() => {
      if (pageVisible) {
        syncPlaylistInBackground();
      }
    }, 30000);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      clearInterval(heartbeatInterval);
      clearInterval(syncInterval);
    };
  }, [ponto?.id, pageVisible, pairToken]);

  // 4. Registro de telemetria ao rodar anúncio (com token de TV pareada)
  const registrarExibicao = async (ad: TVAnuncio) => {
    if (!ponto?.id || !pairToken) return;

    const now = Date.now();
    // Proteção contra bursts e telemetria disparada em intervalos inválidos (mínimo de 3s)
    if (now - lastTelemetryTimeRef.current < 3000) return;
    lastTelemetryTimeRef.current = now;

    try {
      const deviceInfo = getDeviceInfo();
      // Não registrar Proof-of-Play se for celular/dispositivo móvel não autorizado
      if (deviceInfo.isMobile) return;

      await fetch("/api/tv/telemetria", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tv-token": pairToken,
        },
        body: JSON.stringify({
          pontoId: ponto.id,
          token: pairToken,
          anuncioId: ad.id,
          duracaoSegundos: ad.duracaoSegundos || 10,
          tipoMidia: ad.tipoMidia,
          deviceType: deviceInfo.deviceType,
          deviceLabel: deviceInfo.deviceLabel,
          screenResolution: deviceInfo.screenResolution,
        }),
      });
    } catch (err) {
      console.error("Erro ao registrar telemetria:", err);
    }
  };

  // 5. Rotação de anúncios contínua e resiliente (suporta 1 único anúncio ou múltiplos em loop)
  const nextAd = (fromError = false) => {
    if (anuncios.length === 0) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
    isHandlingErrorRef.current = false;

    const currentList = anunciosRef.current.length > 0 ? anunciosRef.current : anuncios;
    const isEndOfLoop = currentList.length <= 1 || currentIndex + 1 >= currentList.length;

    // Mini recarregada em segundo plano no término do loop para checar e inserir novos vídeos automaticamente sem piscar
    if (isEndOfLoop) {
      syncPlaylistInBackground();
    }

    const currentAd = currentList[currentIndex] || currentList[0];
    // Registra telemetria apenas quando a exibição foi completada com sucesso (sem erro)
    if (currentAd && !fromError) {
      registrarExibicao(currentAd);
    }

    setCycleCount((c) => c + 1);

    if (currentList.length === 1) {
      // Se tiver só 1 vídeo ou imagem, reinicia ele sem travar
      if (currentAd?.tipoMidia === "VIDEO" && videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    } else {
      setCurrentIndex((prev) => (prev + 1) % currentList.length);
    }
  };

  const handleMediaError = (adTitle: string, adId: number) => {
    // Evita loop de erros repetidos disparados pelo elemento de mídia do navegador
    if (isHandlingErrorRef.current) return;
    isHandlingErrorRef.current = true;

    console.warn(`[Player] Falha ao reproduzir anúncio "${adTitle}" (ID: ${adId}). Pulando com segurança...`);

    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
    }

    errorTimerRef.current = setTimeout(() => {
      nextAd(true);
    }, 2000);
  };

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
    isHandlingErrorRef.current = false;

    if (anuncios.length === 0 || !ponto) return;

    const currentAd = anuncios[currentIndex] || anuncios[0];
    if (!currentAd) {
      setCurrentIndex(0);
      return;
    }

    if (currentAd.tipoMidia === "IMAGEM") {
      const durationMs = (currentAd.duracaoSegundos || 10) * 1000;
      timerRef.current = setTimeout(() => {
        nextAd(false);
      }, durationMs);
    } else if (currentAd.tipoMidia === "VIDEO") {
      // Timeout de segurança caso o evento 'onEnded' do vídeo falhe no navegador da Smart TV
      const maxVideoDurationMs = ((currentAd.duracaoSegundos || 60) + 3) * 1000;
      timerRef.current = setTimeout(() => {
        nextAd(false);
      }, maxVideoDurationMs);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
        errorTimerRef.current = null;
      }
    };
  }, [currentIndex, cycleCount, anuncios, ponto]);

  // Teclado numérico / input handlers com suporte a controle remoto de Smart TV
  const handleVirtualKey = (num: string) => {
    if (connecting) return;

    if (num === "clear") {
      setCodeDigits(["", "", "", "", "", ""]);
      setActiveDigitIndex(0);
      return;
    }
    if (num === "backspace") {
      const lastFilledIdx = [...codeDigits].reverse().findIndex((d) => d !== "");
      if (lastFilledIdx !== -1) {
        const realIdx = 5 - lastFilledIdx;
        const newDigits = [...codeDigits];
        newDigits[realIdx] = "";
        setCodeDigits(newDigits);
        setActiveDigitIndex(realIdx);
      }
      return;
    }

    // Achar primeiro dígito vazio
    const emptyIdx = codeDigits.findIndex((d) => d === "");
    if (emptyIdx === -1) return; // Já tem 6 dígitos

    const newDigits = [...codeDigits];
    newDigits[emptyIdx] = num;
    setCodeDigits(newDigits);
    setActiveDigitIndex(emptyIdx < 5 ? emptyIdx + 1 : 5);

    const fullCode = newDigits.join("");
    if (fullCode.length === 6 && !newDigits.includes("")) {
      connectWithCode(fullCode);
    }
  };

  // Suporte global para controle remoto de Smart TV (teclas numéricas físicas 0-9)
  useEffect(() => {
    if (ponto) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (connecting) return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleVirtualKey(e.key);
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        handleVirtualKey("backspace");
      } else if (e.key === "Enter") {
        const fullCode = codeDigits.join("");
        if (fullCode.length === 6 && !codeDigits.includes("")) {
          e.preventDefault();
          connectWithCode(fullCode);
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [ponto, codeDigits, connecting]);

  const executarDesconexao = () => {
    if (ponto?.id && pairToken) {
      fetch("/api/tv/telemetria", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tv-token": pairToken,
        },
        body: JSON.stringify({ pontoId: ponto.id, token: pairToken, offline: true }),
      }).catch(() => {});
    }
    setPairedCode("");
    setPairToken("");
    setPonto(null);
    setAnuncios([]);
    setCodeDigits(["", "", "", "", "", ""]);
    setActiveDigitIndex(0);
    setShowDisconnectModal(false);
  };

  const desconectarTV = () => {
    setShowDisconnectModal(true);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullScreen(false);
    }
  };

  // Se estiver carregando verificação inicial
  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#0E1F66] flex flex-col items-center justify-center text-white">
        <div className="w-14 h-14 border-4 border-[#4F93C9] border-t-transparent rounded-full animate-spin mb-4" />
        <Logo className="h-8 w-auto mb-3" whiteText />
        <p className="text-xs font-bold tracking-widest uppercase text-white/80">
          Iniciando Player Media+...
        </p>
      </div>
    );
  }

  // BLOQUEIO: Dispositivo mobile detectado
  if (isMobileDevice) {
    return (
      <div className="w-screen min-h-screen bg-[#081342] flex flex-col items-center justify-center p-6 text-white select-none">
        <div className="w-full max-w-md flex flex-col items-center text-center">
          <Logo className="h-10 w-auto mb-6" whiteText />

          <div className="bg-[#0E1F66]/95 backdrop-blur-xl border border-amber-500/30 p-8 rounded-3xl shadow-2xl w-full">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center text-3xl mx-auto mb-4">
              &#128249;
            </div>
            <h1 className="text-xl font-extrabold font-heading text-white tracking-tight">
              Player Exclusivo para Smart TV
            </h1>
            <p className="text-xs text-amber-200/80 mt-3 leading-relaxed">
              Este player foi desenvolvido exclusivamente para ser exibido em Smart TVs e monitores de grande formato.
            </p>
            <p className="text-xs text-blue-100/70 mt-2 leading-relaxed">
              Para conectar sua TV, acesse este link diretamente no navegador da sua Smart TV e digite o codigo de 6 digitos gerado no seu painel.
            </p>

            <div className="mt-5 p-3 bg-amber-500/10 border border-amber-400/20 rounded-xl">
              <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                Dispositivo detectado: Celular
              </p>
              <p className="text-[10px] text-amber-200/60 mt-1">
                Resolucao: {typeof window !== "undefined" ? `${window.screen.width}x${window.screen.height}` : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // TELA 1: Pareamento por Código Numérico
  if (!ponto) {
    return (
      <div className="w-screen min-h-screen bg-[#081342] flex flex-col items-center justify-center p-6 text-white select-none">
        <div className="w-full max-w-xl flex flex-col items-center text-center">
          <Logo className="h-10 sm:h-12 w-auto mb-6" whiteText />

          <div className="bg-[#0E1F66]/95 backdrop-blur-xl border border-[#4F93C9]/30 p-8 sm:p-10 rounded-3xl shadow-2xl w-full">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#4F93C9]/20 text-[#8ec3ea] border border-[#4F93C9]/30 mb-3">
              <svg className="w-3.5 h-3.5 text-[#4F93C9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Conectar Nova TV</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
              Digite o Código da Sua TV
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/80 mt-2 max-w-md mx-auto">
              Abra o painel do seu estabelecimento no celular ou computador e digite o código de 6 números gerado para sua tela.
            </p>

            {errorMessage && (
              <div className="mt-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-xs font-bold text-rose-300">
                {errorMessage}
              </div>
            )}

            {/* Visualização dos 6 Dígitos em Destaque para Leitura à Distância na TV */}
            <div className="flex justify-center gap-2 sm:gap-3.5 my-6 sm:my-8">
              {codeDigits.map((digit, idx) => {
                const isCurrent = activeDigitIndex === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveDigitIndex(idx)}
                    className={`w-12 h-16 sm:w-16 sm:h-22 text-3xl sm:text-4xl font-black font-mono flex items-center justify-center rounded-2xl border-2 transition-all cursor-pointer ${
                      digit
                        ? "bg-[#4F93C9] text-white border-white shadow-xl shadow-[#4F93C9]/40 scale-100"
                        : isCurrent
                        ? "bg-[#0A174E] text-white border-[#4F93C9] ring-4 ring-[#4F93C9]/30 animate-pulse"
                        : "bg-[#081342] text-white/30 border-white/15"
                    }`}
                  >
                    {digit ? digit : isCurrent ? "_" : "•"}
                  </div>
                );
              })}
            </div>

            {connecting && (
              <div className="flex items-center justify-center gap-2 text-xs text-[#4F93C9] font-bold mb-4 animate-pulse">
                <div className="w-4 h-4 border-2 border-[#4F93C9] border-t-transparent rounded-full animate-spin" />
                Validando conexão com a rede Media+...
              </div>
            )}

            {/* Teclado Virtual Numérico em Tela com foco ampliado para Controle Remoto D-pad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  tabIndex={0}
                  onClick={() => handleVirtualKey(num.toString())}
                  className="h-14 sm:h-16 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-[#4F93C9] focus:bg-[#4F93C9] focus:ring-4 focus:ring-[#4F93C9]/50 focus:scale-105 focus:shadow-xl border border-white/15 text-2xl font-black text-white transition-all cursor-pointer flex items-center justify-center outline-none"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                tabIndex={0}
                onClick={() => handleVirtualKey("clear")}
                className="h-14 sm:h-16 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 focus:bg-rose-600 focus:ring-4 focus:ring-rose-400 focus:scale-105 text-rose-200 focus:text-white border border-rose-400/20 text-xs font-black transition-all cursor-pointer outline-none flex items-center justify-center"
              >
                LIMPAR
              </button>
              <button
                type="button"
                tabIndex={0}
                onClick={() => handleVirtualKey("0")}
                className="h-14 sm:h-16 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-[#4F93C9] focus:bg-[#4F93C9] focus:ring-4 focus:ring-[#4F93C9]/50 focus:scale-105 focus:shadow-xl border border-white/15 text-2xl font-black text-white transition-all cursor-pointer flex items-center justify-center outline-none"
              >
                0
              </button>
              <button
                type="button"
                tabIndex={0}
                onClick={() => handleVirtualKey("backspace")}
                className="h-14 sm:h-16 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 focus:bg-amber-600 focus:ring-4 focus:ring-amber-400 focus:scale-105 text-amber-200 focus:text-white border border-amber-400/20 text-xs font-black transition-all cursor-pointer outline-none flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414-6.414a2 2 0 011.414-.586H19a2 2 0 012 2v10a2 2 0 01-2 2h-7.172a2 2 0 01-1.414-.586L3 12z" />
                </svg>
                <span>APAGAR</span>
              </button>
            </div>

            {codeDigits.join("").length === 6 && !codeDigits.includes("") && (
              <button
                type="button"
                tabIndex={0}
                onClick={() => connectWithCode(codeDigits.join(""))}
                disabled={connecting}
                className="w-full max-w-xs mx-auto mt-4 py-3.5 rounded-2xl bg-gradient-to-r from-[#8FAE9E] to-[#4F93C9] hover:brightness-110 focus:ring-4 focus:ring-[#4F93C9]/40 focus:scale-[1.02] font-black text-sm text-white shadow-xl shadow-[#4F93C9]/30 transition-all cursor-pointer outline-none flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>CONECTAR TV AGORA</span>
              </button>
            )}
          </div>

          <p className="text-xs text-blue-100/60 mt-6 max-w-md mx-auto leading-relaxed">
            Dica para Smart TV: você pode digitar os números (0 a 9) diretamente no teclado do seu controle remoto ou usar as setas e o botão OK.
          </p>
        </div>
      </div>
    );
  }

  // TELA 2: TV Sem anúncios ativos ainda
  if (anuncios.length === 0) {
    return (
      <TVFrame
        nomeEstabelecimento={ponto.nomeEmpresa}
        pontoId={ponto.id}
        totalAnuncios={0}
        currentIndex={0}
      >
        <div
          onDoubleClick={toggleFullScreen}
          className="w-full h-full flex flex-col items-center justify-center text-white p-6 text-center select-none cursor-pointer relative"
        >
          {/* Botão sutil para desconectar caso queira */}
          <button
            type="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              desconectarTV();
            }}
            className="absolute top-4 left-4 text-[11px] uppercase font-bold tracking-wider text-white/70 hover:text-white focus:text-white bg-black/60 focus:bg-[#4F93C9] px-3 py-1.5 rounded-xl border border-white/20 focus:ring-2 focus:ring-[#4F93C9] backdrop-blur-md transition cursor-pointer outline-none flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 text-[#4F93C9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Código: {pairedCode} (Trocar)</span>
          </button>

          <div className="w-20 h-20 rounded-3xl bg-[#4F93C9]/20 border border-[#4F93C9]/30 text-[#4F93C9] flex items-center justify-center mx-auto mb-4 shadow-2xl backdrop-blur-md">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-heading">
            {ponto.nomeEmpresa}
          </h2>
          <p className="text-xs sm:text-sm text-blue-100/80 mt-2 max-w-lg leading-relaxed">
            Canal de exibição conectado e pronto. Novos anúncios aprovados começarão a ser exibidos automaticamente.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8FAE9E] animate-pulse" />
            Transmissão Conectada (Código {pairedCode}) • Duplo clique para tela cheia
          </div>

          {/* Modal de confirmação de desconexão */}
          {showDisconnectModal && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in"
            >
              <div className="bg-[#0E1F66] border border-white/20 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center text-3xl mx-auto mb-4 border border-rose-400/30">
                  <svg className="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-black text-white font-heading">
                  Desconectar esta TV?
                </h3>
                <p className="text-xs text-blue-100/80 mt-2 leading-relaxed">
                  A transmissão atual será encerrada e a tela voltará a solicitar um novo código de pareamento.
                </p>
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <button
                    type="button"
                    tabIndex={0}
                    onClick={() => setShowDisconnectModal(false)}
                    className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 focus:bg-white/30 text-white text-xs font-bold transition outline-none cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    tabIndex={0}
                    onClick={executarDesconexao}
                    className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 focus:bg-rose-700 text-white text-xs font-bold transition outline-none cursor-pointer shadow-lg shadow-rose-600/30"
                  >
                    Desconectar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </TVFrame>
    );
  }

  // TELA 3: Player Ativo com Anúncios
  const currentAd = anuncios[currentIndex] || anuncios[0];

  return (
    <TVFrame
      nomeEstabelecimento={ponto.nomeEmpresa}
      pontoId={ponto.id}
      totalAnuncios={anuncios.length}
      currentIndex={currentIndex}
    >
      <div
        onDoubleClick={toggleFullScreen}
        className="w-full h-full flex items-center justify-center relative select-none cursor-pointer"
      >
        {/* Botão para gerenciar conexão acessível via controle remoto */}
        <button
          type="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            desconectarTV();
          }}
          className="absolute top-4 left-4 z-30 text-[11px] font-bold text-white/70 hover:text-white focus:text-white bg-black/60 focus:bg-[#4F93C9] px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/20 focus:ring-2 focus:ring-[#4F93C9] transition cursor-pointer outline-none flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5 text-[#4F93C9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Pareado: {pairedCode}</span>
        </button>

        {currentAd?.tipoMidia === "VIDEO" ? (
          <video
            ref={videoRef}
            key={`${currentAd.id}-${cycleCount}`}
            src={currentAd.midiaUrl}
            autoPlay
            playsInline
            muted
            onEnded={() => {
              if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
              }
              nextAd(false);
            }}
            onError={() => {
              handleMediaError(currentAd.titulo, currentAd.id);
            }}
            className="w-full h-full object-contain"
          />
        ) : currentAd ? (
          <img
            key={`${currentAd.id}-${cycleCount}`}
            src={currentAd.midiaUrl}
            alt={currentAd.titulo}
            onError={() => {
              handleMediaError(currentAd.titulo, currentAd.id);
            }}
            className="w-full h-full object-contain animate-fade-in"
          />
        ) : null}

        {/* Modal de confirmação de desconexão */}
        {showDisconnectModal && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in"
          >
            <div className="bg-[#0E1F66] border border-white/20 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center text-3xl mx-auto mb-4 border border-rose-400/30">
                <svg className="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-white font-heading">
                Desconectar esta TV?
              </h3>
              <p className="text-xs text-blue-200/80 mt-2 leading-relaxed">
                A transmissão atual será encerrada e a tela voltará a solicitar um novo código de pareamento.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  type="button"
                  tabIndex={0}
                  onClick={() => setShowDisconnectModal(false)}
                  className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 focus:bg-white/30 text-white text-xs font-bold transition outline-none cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  tabIndex={0}
                  onClick={executarDesconexao}
                  className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 focus:bg-rose-700 text-white text-xs font-bold transition outline-none cursor-pointer shadow-lg shadow-rose-600/30"
                >
                  Desconectar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TVFrame>
  );
}
