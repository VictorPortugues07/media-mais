"use client";

import React, { useEffect, useState, useRef } from "react";
import { Logo } from "@/components/ui/Logo";
import { PlayerErrorBoundary } from "@/components/tv/PlayerErrorBoundary";
import { HouseSlot, HOUSE_SLOT_SEGUNDOS } from "@/components/tv/HouseSlot";

// A cada ~2 minutos de anúncios pagos, entra o bloco institucional (local + "Anuncie aqui").
const INTERVALO_CASA_SEGUNDOS = 120;

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
  const [slotCasa, setSlotCasa] = useState(false);
  const [controlesVisiveis, setControlesVisiveis] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHandlingErrorRef = useRef(false);
  const lastTelemetryTimeRef = useRef(0);
  const anunciosRef = useRef<TVAnuncio[]>(anuncios);
  const isSyncingRef = useRef(false);
  const segundosDesdeCasaRef = useRef(0);
  const controlesTimerRef = useRef<NodeJS.Timeout | null>(null);

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

    // Programa o bloco institucional após ~2 min de anúncios pagos exibidos
    if (currentAd && !fromError) {
      segundosDesdeCasaRef.current += currentAd.duracaoSegundos || 10;
    }
    if (segundosDesdeCasaRef.current >= INTERVALO_CASA_SEGUNDOS) {
      segundosDesdeCasaRef.current = 0;
      setSlotCasa(true);
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

    // Durante o bloco institucional, a mídia paga fica pausada (sem timers nem telemetria)
    if (slotCasa) return;
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
  }, [currentIndex, cycleCount, anuncios, ponto, slotCasa]);

  // Encerra o bloco institucional e devolve a tela aos anúncios pagos
  useEffect(() => {
    if (!slotCasa) return;
    const timer = setTimeout(() => setSlotCasa(false), HOUSE_SLOT_SEGUNDOS * 1000);
    return () => clearTimeout(timer);
  }, [slotCasa]);

  // Controles de operação (pareamento, posição no loop) só aparecem ao mexer no mouse/controle remoto
  useEffect(() => {
    if (!ponto) return;
    const mostrar = () => {
      setControlesVisiveis(true);
      if (controlesTimerRef.current) clearTimeout(controlesTimerRef.current);
      controlesTimerRef.current = setTimeout(() => setControlesVisiveis(false), 4000);
    };
    window.addEventListener("mousemove", mostrar);
    window.addEventListener("keydown", mostrar);
    window.addEventListener("touchstart", mostrar);
    return () => {
      window.removeEventListener("mousemove", mostrar);
      window.removeEventListener("keydown", mostrar);
      window.removeEventListener("touchstart", mostrar);
      if (controlesTimerRef.current) clearTimeout(controlesTimerRef.current);
    };
  }, [ponto]);

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

  // Fundo padrão das telas do player (mesma linguagem da home e dos painéis)
  const fundoMarca = (
    <>
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(70%_80%_at_85%_10%,rgba(79,147,201,0.32),transparent_60%)]" />
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(50%_60%_at_0%_100%,rgba(143,174,158,0.16),transparent_60%)]" />
      <div aria-hidden="true" className="absolute inset-0 opacity-50 [background-image:radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px]" />
    </>
  );

  const modalDesconexao = showDisconnectModal ? (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#05092A]/80 backdrop-blur-md p-6 animate-fade-in"
    >
      <div className="w-full max-w-sm rounded-3xl bg-[#0E1F66] p-8 text-center shadow-2xl ring-1 ring-white/10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F2795C]/15 text-[#F7A895]">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </span>
        <h3 className="mt-5 font-heading text-xl font-semibold text-white">Desconectar esta TV?</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          A transmissão será encerrada e a tela voltará a pedir um código de conexão.
        </p>
        <div className="mt-7 grid grid-cols-2 gap-3">
          <button
            type="button"
            tabIndex={0}
            onClick={() => setShowDisconnectModal(false)}
            className="rounded-xl bg-white/10 py-3 text-sm font-medium text-white outline-none transition hover:bg-white/15 focus:bg-white focus:text-[#0E1F66] cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            tabIndex={0}
            onClick={executarDesconexao}
            className="rounded-xl bg-rose-600 py-3 text-sm font-medium text-white outline-none transition hover:bg-rose-500 focus:ring-4 focus:ring-rose-400/40 cursor-pointer"
          >
            Desconectar
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // Carregando verificação inicial
  if (loading) {
    return (
      <div className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-[#0B1A57] text-white">
        {fundoMarca}
        <div className="relative flex flex-col items-center animate-fade-in">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <span className="absolute inset-0 rounded-full border border-white/15 animate-signal" />
            <span className="absolute inset-0 rounded-full border border-white/15 animate-signal" style={{ animationDelay: "0.8s" }} />
            <img src="/logo.svg" alt="Media+" className="relative h-10 w-auto" />
          </div>
          <p className="mt-6 text-sm text-white/60">Iniciando o player…</p>
        </div>
      </div>
    );
  }

  // BLOQUEIO: dispositivo móvel detectado
  if (isMobileDevice) {
    return (
      <div className="relative flex min-h-screen w-screen flex-col items-center justify-center overflow-hidden bg-[#0B1A57] p-6 text-white select-none">
        {fundoMarca}
        <div className="relative w-full max-w-sm text-center animate-fade-in">
          <Logo className="mx-auto h-8 w-auto" whiteText />
          <div className="mt-8 rounded-3xl bg-white/[0.06] p-8 ring-1 ring-white/10 backdrop-blur-sm">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4F93C9]/15 text-[#8EC3EA]">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            <h1 className="mt-5 font-heading text-xl font-semibold">Abra este link na sua TV</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              O player foi feito para Smart TVs e monitores. No navegador da TV, acesse este mesmo endereço e digite o código
              de 6 números do seu painel.
            </p>
            <p className="mt-5 rounded-xl bg-white/[0.06] px-3 py-2 font-mono text-xs text-white/70">
              {typeof window !== "undefined" ? `${window.location.host}/player` : "/player"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // TELA 1: Pareamento por código numérico
  if (!ponto) {
    const codigoCompleto = codeDigits.join("").length === 6 && !codeDigits.includes("");
    const passos = [
      { titulo: "Abra o painel do estabelecimento", texto: "No celular ou computador, entre na sua conta Media+." },
      { titulo: "Veja o código de conexão", texto: "São 6 números que se renovam a cada 30 segundos." },
      { titulo: "Digite o código aqui", texto: "Use os números do controle remoto ou o teclado ao lado." },
    ];
    const teclaBase =
      "flex h-[clamp(52px,6.2vh,72px)] items-center justify-center rounded-2xl text-[clamp(20px,2.4vh,28px)] font-medium outline-none transition-all duration-150 cursor-pointer focus:scale-105 focus:ring-4 active:scale-95";

    return (
      <div className="relative min-h-screen w-screen overflow-hidden bg-[#0B1A57] text-white select-none">
        {fundoMarca}

        <div className="relative mx-auto grid min-h-screen max-w-[1400px] items-center gap-12 px-8 py-10 lg:grid-cols-[1fr_minmax(420px,520px)] lg:gap-20 lg:px-16">
          {/* Orientações */}
          <div className="animate-fade-in">
            <Logo className="h-9 w-auto" whiteText />
            <p className="mt-12 text-sm font-medium text-[#8EC3EA]">Player da TV</p>
            <h1 className="mt-3 font-heading text-[clamp(32px,4.4vw,60px)] font-semibold leading-[1.05] tracking-tight">
              Conecte esta TV
              <br />à rede Media+
            </h1>
            <p className="mt-5 max-w-md text-[clamp(15px,1.25vw,18px)] leading-relaxed text-white/60">
              Em poucos segundos sua tela começa a exibir os anúncios aprovados para o seu estabelecimento.
            </p>

            <ol className="mt-10 space-y-5">
              {passos.map((p, i) => (
                <li
                  key={p.titulo}
                  className="flex items-start gap-4"
                  style={{ animation: `wordIn 0.6s var(--ease-out-soft) ${200 + i * 120}ms both` }}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-sm font-semibold text-white ring-1 ring-white/15">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-[clamp(15px,1.2vw,18px)] font-medium text-white">{p.titulo}</p>
                    <p className="mt-0.5 text-sm text-white/50">{p.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Entrada do código */}
          <div
            className="rounded-[28px] bg-white/[0.06] p-7 ring-1 ring-white/10 backdrop-blur-md sm:p-9"
            style={{ animation: "wordIn 0.8s var(--ease-out-soft) 0.15s both" }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white/85">Código de conexão</p>
              <span className="inline-flex items-center gap-1.5 text-xs text-white/45">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                renova a cada 30s
              </span>
            </div>

            {/* 6 dígitos — mesmo visual do painel do estabelecimento */}
            <div className="mt-6 flex gap-2 sm:gap-2.5">
              {codeDigits.map((digit, idx) => {
                const atual = activeDigitIndex === idx && !digit;
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveDigitIndex(idx)}
                    className={`relative flex h-[clamp(64px,8.5vh,92px)] flex-1 items-center justify-center rounded-2xl font-mono text-[clamp(28px,4vh,44px)] font-semibold transition-all duration-200 cursor-pointer ${
                      digit
                        ? "bg-white text-[#0E1F66] shadow-lg shadow-[#4F93C9]/20"
                        : atual
                        ? "bg-[#05092A]/60 ring-2 ring-[#4F93C9]"
                        : "bg-[#05092A]/60 ring-1 ring-white/10"
                    }`}
                  >
                    {digit ? (
                      <span key={digit + idx} className="animate-word-in">{digit}</span>
                    ) : atual ? (
                      <span className="h-[40%] w-[3px] rounded-full bg-[#8EC3EA] animate-pulse" />
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 min-h-[44px]">
              {errorMessage ? (
                <p className="flex items-center gap-2 rounded-xl bg-rose-500/15 px-3.5 py-2.5 text-sm text-rose-200 animate-fade-in">
                  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errorMessage}
                </p>
              ) : connecting ? (
                <p className="flex items-center gap-2.5 px-1 py-2.5 text-sm text-[#8EC3EA] animate-fade-in">
                  <span className="h-4 w-4 rounded-full border-2 border-[#8EC3EA] border-t-transparent animate-spin" />
                  Conectando à rede Media+…
                </p>
              ) : null}
            </div>

            {/* Teclado para controle remoto */}
            <div className="grid grid-cols-3 gap-2.5">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  tabIndex={0}
                  onClick={() => handleVirtualKey(num)}
                  className={`${teclaBase} bg-white/[0.07] text-white ring-1 ring-white/10 hover:bg-white/[0.12] focus:bg-white focus:text-[#0E1F66] focus:ring-[#4F93C9]/50`}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                tabIndex={0}
                onClick={() => handleVirtualKey("clear")}
                className={`${teclaBase} text-[clamp(13px,1.5vh,15px)] text-white/60 hover:bg-white/[0.06] focus:bg-white/15 focus:text-white focus:ring-white/20`}
              >
                Limpar
              </button>
              <button
                type="button"
                tabIndex={0}
                onClick={() => handleVirtualKey("0")}
                className={`${teclaBase} bg-white/[0.07] text-white ring-1 ring-white/10 hover:bg-white/[0.12] focus:bg-white focus:text-[#0E1F66] focus:ring-[#4F93C9]/50`}
              >
                0
              </button>
              <button
                type="button"
                tabIndex={0}
                aria-label="Apagar"
                onClick={() => handleVirtualKey("backspace")}
                className={`${teclaBase} text-white/60 hover:bg-white/[0.06] focus:bg-white/15 focus:text-white focus:ring-white/20`}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414-6.414a2 2 0 011.414-.586H19a2 2 0 012 2v10a2 2 0 01-2 2h-7.172a2 2 0 01-1.414-.586L3 12z" />
                </svg>
              </button>
            </div>

            <button
              type="button"
              tabIndex={0}
              onClick={() => connectWithCode(codeDigits.join(""))}
              disabled={!codigoCompleto || connecting}
              className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-medium outline-none transition-all duration-300 focus:ring-4 focus:ring-[#4F93C9]/40 ${
                codigoCompleto
                  ? "bg-white text-[#0E1F66] shadow-xl shadow-[#4F93C9]/25 hover:bg-[#EEF4FB] cursor-pointer"
                  : "bg-white/[0.06] text-white/35 cursor-not-allowed"
              }`}
            >
              {codigoCompleto ? "Conectar TV" : "Digite os 6 números"}
              {codigoCompleto && (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-6-6l6 6-6 6" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // TELA 2: TV conectada, ainda sem anúncios ativos
  if (anuncios.length === 0) {
    return (
      <div
        onDoubleClick={toggleFullScreen}
        className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-[#0B1A57] text-white select-none"
        style={{ cursor: controlesVisiveis ? "pointer" : "none" }}
      >
        {fundoMarca}

        <div aria-hidden="true" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {[0, 0.9, 1.8].map((d) => (
            <span
              key={d}
              className="absolute left-1/2 top-1/2 h-[46vh] w-[46vh] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.07] animate-signal"
              style={{ animationDelay: `${d}s` }}
            />
          ))}
        </div>

        <div className="relative px-6 text-center animate-fade-in">
          <img src="/logo.svg" alt="Media+" className="mx-auto h-[5vh] min-h-8 w-auto" />
          <p className="mt-[5vh] inline-flex items-center gap-2 rounded-full bg-[#8FAE9E]/15 px-4 py-1.5 text-[clamp(13px,1.6vh,18px)] text-[#CFE6DB]">
            <span className="h-2 w-2 rounded-full bg-[#8FAE9E] animate-pulse" />
            TV conectada
          </p>
          <h1 className="mt-[3vh] font-heading text-[clamp(32px,6vh,72px)] font-semibold leading-tight tracking-tight">
            {ponto.nomeEmpresa}
          </h1>
          <p className="mx-auto mt-[2vh] max-w-xl text-[clamp(15px,2vh,22px)] leading-relaxed text-white/60">
            Tudo pronto. Assim que um anúncio for aprovado para esta tela, ele começa a ser exibido automaticamente.
          </p>
        </div>

        <div
          className={`absolute left-4 top-4 z-30 transition-opacity duration-300 focus-within:opacity-100 ${
            controlesVisiveis ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            type="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              desconectarTV();
            }}
            className="rounded-xl bg-black/50 px-3 py-1.5 text-[11px] font-medium text-white/80 outline-none ring-1 ring-white/15 backdrop-blur-md transition hover:text-white focus:bg-[#4F93C9] focus:text-white cursor-pointer"
          >
            Pareado: {pairedCode} · trocar
          </button>
        </div>

        {modalDesconexao}
      </div>
    );
  }

  // TELA 3: Player Ativo — anúncios pagos em tela cheia, sem moldura.
  // As informações do local e o "Anuncie aqui" ficam no bloco institucional (HouseSlot).
  const currentAd = anuncios[currentIndex] || anuncios[0];
  const totalMarcas = new Set(anuncios.map((a) => a.anunciante.nomeEmpresa)).size;

  return (
    <div
      onDoubleClick={toggleFullScreen}
      className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans"
      style={{ cursor: controlesVisiveis ? "pointer" : "none" }}
    >
      {slotCasa ? (
        <HouseSlot
          pontoId={ponto.id}
          nomeEstabelecimento={ponto.nomeEmpresa}
          categoria={ponto.categoria}
          cidade={ponto.cidade}
          uf={ponto.uf}
          totalMarcas={totalMarcas}
        />
      ) : currentAd?.tipoMidia === "VIDEO" ? (
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
          className="absolute inset-0 w-full h-full object-contain animate-fade-in"
        />
      ) : currentAd ? (
        <div key={`${currentAd.id}-${cycleCount}`} className="absolute inset-0 animate-fade-in">
          {/* Preenchimento desfocado para artes fora do 16:9 (evita faixas pretas) */}
          <img
            src={currentAd.midiaUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-3xl opacity-50"
          />
          <img
            src={currentAd.midiaUrl}
            alt={currentAd.titulo}
            onError={() => {
              handleMediaError(currentAd.titulo, currentAd.id);
            }}
            className="relative w-full h-full object-contain"
          />
        </div>
      ) : null}

      {/* Selo discreto da rede (identificação padrão em mídia indoor) */}
      {!slotCasa && (
        <div className="pointer-events-none absolute bottom-[2.4vh] right-[1.6vw] z-10 flex items-center gap-[0.5vw] rounded-full bg-black/25 px-[0.8vw] py-[0.45vw] backdrop-blur-sm opacity-70">
          <img src="/logo.svg" alt="Media+" className="h-[1.3vw] min-h-3 w-auto brightness-0 invert" />
        </div>
      )}

      {/* Controles de operação — ocultos para o público, aparecem com mouse/controle remoto */}
      <div
        className={`absolute top-4 left-4 z-30 flex items-center gap-2 transition-opacity duration-300 focus-within:opacity-100 ${
          controlesVisiveis ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          type="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            desconectarTV();
          }}
          className="text-[11px] font-medium text-white/80 hover:text-white focus:text-white bg-black/60 focus:bg-[#4F93C9] px-3 py-1.5 rounded-xl backdrop-blur-md ring-1 ring-white/15 focus:ring-2 focus:ring-[#4F93C9] transition cursor-pointer outline-none flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5 text-[#8EC3EA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Pareado: {pairedCode}</span>
        </button>
        <span className="text-[11px] font-medium text-white/70 bg-black/60 px-3 py-1.5 rounded-xl backdrop-blur-md ring-1 ring-white/15">
          {ponto.nomeEmpresa} · {slotCasa ? "Bloco institucional" : `Anúncio ${currentIndex + 1} de ${anuncios.length}`}
        </span>
      </div>

      {modalDesconexao}
    </div>
  );
}
