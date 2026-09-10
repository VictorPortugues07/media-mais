"use client";

import React, { useEffect, useState, useRef } from "react";
import { TVFrame } from "@/components/tv/TVFrame";
import { Logo } from "@/components/ui/Logo";

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
  const [pairedCode, setPairedCode] = useState<string>("");
  const [pairToken, setPairToken] = useState<string>("");
  const [codeDigits, setCodeDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [activeDigitIndex, setActiveDigitIndex] = useState<number>(0);
  const [ponto, setPonto] = useState<PontoInfo | null>(null);
  const [anuncios, setAnuncios] = useState<TVAnuncio[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
      setPairedCode(code);
      setPairToken(data.token || "");
      setLoading(false);

      // Envia heartbeat imediato para atualizar status no painel instantaneamente
      const deviceInfo = getDeviceInfo();
      fetch("/api/tv/telemetria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pontoId: data.ponto.id,
          heartbeatOnly: true,
          deviceType: deviceInfo.deviceType,
          screenResolution: deviceInfo.screenResolution,
        }),
      }).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Código inválido ou expirado";
      setErrorMessage(msg);
      setPairedCode("");
      setCodeDigits(["", "", "", "", "", ""]);
      digitInputRefs.current[0]?.focus();
      setActiveDigitIndex(0);
      setLoading(false);
    } finally {
      setConnecting(false);
    }
  };

  // 3. Polling para sincronizar novas campanhas e telemetria / heartbeat contínuo
  useEffect(() => {
    if (!ponto?.id) return;

    // Notificar desconexão imediata ao fechar a janela / sair do player
    const handleUnload = () => {
      if (ponto?.id) {
        navigator.sendBeacon?.(
          "/api/tv/telemetria",
          JSON.stringify({ pontoId: ponto.id, offline: true })
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pontoId: ponto.id,
            heartbeatOnly: true,
            deviceType: deviceInfo.deviceType,
            screenResolution: deviceInfo.screenResolution,
          }),
        });
      } catch (err) {
        console.error("Heartbeat error:", err);
      }
    }, 4000);

    // Polling de sincronização de anúncios a cada 15 segundos
    const syncInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/tv/parear?pontoId=${ponto.id}&token=${encodeURIComponent(pairToken)}`, {
          headers: pairToken ? { "x-tv-token": pairToken } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setAnuncios(data.anuncios || []);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 15000);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      clearInterval(heartbeatInterval);
      clearInterval(syncInterval);
    };
  }, [ponto?.id, pageVisible, pairToken]);

  // 4. Registro de telemetria ao rodar anúncio
  const registrarExibicao = async (ad: TVAnuncio) => {
    if (!ponto?.id) return;
    try {
      const deviceInfo = getDeviceInfo();
      // Não registrar Proof-of-Play se for celular/dispositivo móvel não autorizado
      if (deviceInfo.isMobile) return;

      await fetch("/api/tv/telemetria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pontoId: ponto.id,
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
  const nextAd = () => {
    if (anuncios.length === 0) return;
    const currentAd = anuncios[currentIndex];
    if (currentAd) {
      registrarExibicao(currentAd);
    }

    if (anuncios.length === 1) {
      // Se tiver só 1 vídeo ou imagem, reinicia ele sem travar
      if (currentAd.tipoMidia === "VIDEO" && videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.muted = false;
        videoRef.current.volume = 1;
        videoRef.current.play().catch(() => {});
      } else {
        // Imagem única: aciona timeout novamente
        setCurrentIndex(0);
      }
    } else {
      setCurrentIndex((prev) => (prev + 1) % anuncios.length);
    }
  };

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (anuncios.length === 0 || !ponto) return;

    const currentAd = anuncios[currentIndex];
    if (!currentAd) {
      setCurrentIndex(0);
      return;
    }

    if (currentAd.tipoMidia === "IMAGEM") {
      const durationMs = (currentAd.duracaoSegundos || 10) * 1000;
      timerRef.current = setTimeout(() => {
        nextAd();
      }, durationMs);
    } else if (currentAd.tipoMidia === "VIDEO") {
      // Timeout de segurança caso o evento 'onEnded' do vídeo falhe no navegador da Smart TV
      const maxVideoDurationMs = ((currentAd.duracaoSegundos || 60) + 3) * 1000;
      timerRef.current = setTimeout(() => {
        nextAd();
      }, maxVideoDurationMs);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, anuncios, ponto]);

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

  const desconectarTV = () => {
    if (confirm("Deseja desconectar esta TV e voltar para a tela de digitação do código?")) {
      if (ponto?.id) {
        fetch("/api/tv/telemetria", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pontoId: ponto.id, offline: true }),
        }).catch(() => {});
      }
      setPairedCode("");
      setPairToken("");
      setPonto(null);
      setAnuncios([]);
      setCodeDigits(["", "", "", "", "", ""]);
      setActiveDigitIndex(0);
    }
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
      <div className="w-screen h-screen bg-[#051160] flex flex-col items-center justify-center text-white">
        <div className="w-14 h-14 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4" />
        <Logo className="h-8 w-auto mb-3" whiteText />
        <p className="text-xs font-bold tracking-widest uppercase text-blue-200">
          Iniciando Player Media+...
        </p>
      </div>
    );
  }

  // BLOQUEIO: Dispositivo mobile detectado
  if (isMobileDevice) {
    return (
      <div className="w-screen min-h-screen bg-[#030930] flex flex-col items-center justify-center p-6 text-white select-none">
        <div className="w-full max-w-md flex flex-col items-center text-center">
          <Logo className="h-10 w-auto mb-6" whiteText />

          <div className="bg-[#07154a]/90 backdrop-blur-xl border border-amber-500/30 p-8 rounded-3xl shadow-2xl w-full">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center text-3xl mx-auto mb-4">
              &#128249;
            </div>
            <h1 className="text-xl font-extrabold font-heading text-white tracking-tight">
              Player Exclusivo para Smart TV
            </h1>
            <p className="text-xs text-amber-200/80 mt-3 leading-relaxed">
              Este player foi desenvolvido exclusivamente para ser exibido em Smart TVs e monitores de grande formato.
            </p>
            <p className="text-xs text-blue-200/60 mt-2 leading-relaxed">
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
      <div className="w-screen min-h-screen bg-[#030930] flex flex-col items-center justify-center p-6 text-white select-none">
        <div className="w-full max-w-xl flex flex-col items-center text-center">
          <Logo className="h-10 sm:h-12 w-auto mb-6" whiteText />

          <div className="bg-[#07154a]/90 backdrop-blur-xl border border-blue-500/30 p-8 sm:p-10 rounded-3xl shadow-2xl w-full">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-3">
              📺 Conectar Nova TV
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
              Digite o Código da Sua TV
            </h1>
            <p className="text-xs sm:text-sm text-blue-200/70 mt-2 max-w-md mx-auto">
              Abra o painel do seu estabelecimento no celular ou computador e digite o código de 6 números gerado para sua tela.
            </p>

            {errorMessage && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/40 rounded-2xl text-xs font-bold text-red-300">
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
                        ? "bg-blue-600 text-white border-blue-400 shadow-xl shadow-blue-500/30 scale-100"
                        : isCurrent
                        ? "bg-blue-950/90 text-blue-200 border-sky-400 ring-4 ring-sky-400/30 animate-pulse"
                        : "bg-[#040c30] text-blue-300/40 border-blue-900/60"
                    }`}
                  >
                    {digit ? digit : isCurrent ? "_" : "•"}
                  </div>
                );
              })}
            </div>

            {connecting && (
              <div className="flex items-center justify-center gap-2 text-xs text-blue-300 font-bold mb-4 animate-pulse">
                <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
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
                  className="h-14 sm:h-16 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-blue-600 focus:bg-blue-600 focus:ring-4 focus:ring-sky-400 focus:scale-105 focus:shadow-xl border border-white/15 text-2xl font-black text-white transition-all cursor-pointer flex items-center justify-center outline-none"
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
                className="h-14 sm:h-16 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-blue-600 focus:bg-blue-600 focus:ring-4 focus:ring-sky-400 focus:scale-105 focus:shadow-xl border border-white/15 text-2xl font-black text-white transition-all cursor-pointer flex items-center justify-center outline-none"
              >
                0
              </button>
              <button
                type="button"
                tabIndex={0}
                onClick={() => handleVirtualKey("backspace")}
                className="h-14 sm:h-16 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 focus:bg-amber-600 focus:ring-4 focus:ring-amber-400 focus:scale-105 text-amber-200 focus:text-white border border-amber-400/20 text-xs font-black transition-all cursor-pointer outline-none flex items-center justify-center"
              >
                ⌫ APAGAR
              </button>
            </div>

            {codeDigits.join("").length === 6 && !codeDigits.includes("") && (
              <button
                type="button"
                tabIndex={0}
                onClick={() => connectWithCode(codeDigits.join(""))}
                disabled={connecting}
                className="w-full max-w-xs mx-auto mt-4 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 focus:ring-4 focus:ring-emerald-300 focus:scale-[1.02] font-black text-sm text-white shadow-xl shadow-emerald-500/30 transition-all cursor-pointer outline-none flex items-center justify-center gap-2"
              >
                <span>✓ CONECTAR TV AGORA</span>
              </button>
            )}
          </div>

          <p className="text-xs text-blue-200/60 mt-6 max-w-md mx-auto leading-relaxed">
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
            onClick={(e) => {
              e.stopPropagation();
              desconectarTV();
            }}
            className="absolute top-4 left-4 text-[10px] uppercase font-bold tracking-wider text-white/30 hover:text-white/80 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md transition cursor-pointer"
          >
            ⚙️ Código: {pairedCode} (Trocar)
          </button>

          <div className="w-20 h-20 rounded-3xl bg-blue-600/20 border border-blue-400/30 text-blue-300 flex items-center justify-center text-3xl mx-auto mb-4 shadow-2xl backdrop-blur-md">
            📺
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-heading">
            {ponto.nomeEmpresa}
          </h2>
          <p className="text-xs sm:text-sm text-blue-100/80 mt-2 max-w-lg leading-relaxed">
            Canal de exibição conectado e pronto. Novos anúncios aprovados começarão a ser exibidos automaticamente.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            Transmissão Conectada (Código {pairedCode}) • Duplo clique para tela cheia
          </div>
        </div>
      </TVFrame>
    );
  }

  // TELA 3: Player Ativo com Anúncios
  const currentAd = anuncios[currentIndex];

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
        {/* Botão discreto para gerenciar conexão */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            desconectarTV();
          }}
          className="absolute top-4 left-4 z-30 text-[10px] font-bold text-white/30 hover:text-white bg-black/50 px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/10 opacity-0 hover:opacity-100 transition"
        >
          ⚙️ Pareado: {pairedCode}
        </button>

        {currentAd.tipoMidia === "VIDEO" ? (
          <video
            ref={videoRef}
            key={`${currentAd.id}-${currentIndex}`}
            src={currentAd.midiaUrl}
            autoPlay
            playsInline
            onPlay={() => {
              if (videoRef.current) {
                videoRef.current.muted = false;
                videoRef.current.volume = 1;
              }
            }}
            onEnded={nextAd}
            onError={() => {
              setTimeout(nextAd, 2000);
            }}
            className="w-full h-full object-contain"
          />
        ) : (
          <img
            key={`${currentAd.id}-${currentIndex}`}
            src={currentAd.midiaUrl}
            alt={currentAd.titulo}
            className="w-full h-full object-contain animate-fade-in"
          />
        )}
      </div>
    </TVFrame>
  );
}
