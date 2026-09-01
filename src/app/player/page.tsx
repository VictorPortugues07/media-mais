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
  const [codeDigits, setCodeDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [activeDigitIndex, setActiveDigitIndex] = useState<number>(0);
  const [ponto, setPonto] = useState<PontoInfo | null>(null);
  const [anuncios, setAnuncios] = useState<TVAnuncio[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 1. Carregar código salvo no LocalStorage
  useEffect(() => {
    const savedCode = localStorage.getItem("mediamais_tv_code");
    if (savedCode && savedCode.length === 6) {
      setPairedCode(savedCode);
      connectWithCode(savedCode);
    } else {
      setLoading(false);
    }
  }, []);

  // 2. Conectar à API com o código
  const connectWithCode = async (code: string) => {
    setConnecting(true);
    setErrorMessage("");
    try {
      const res = await fetch(`/api/tv/parear?codigo=${code}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao conectar TV");
      }

      setPonto(data.ponto);
      setAnuncios(data.anuncios || []);
      setPairedCode(code);
      localStorage.setItem("mediamais_tv_code", code);
      setLoading(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Código inválido";
      setErrorMessage(msg);
      setPairedCode("");
      localStorage.removeItem("mediamais_tv_code");
      setLoading(false);
    } finally {
      setConnecting(false);
    }
  };

  // 3. Polling para atualizar a playlist e manter telemetria / heartbeat
  useEffect(() => {
    if (!ponto?.id) return;

    const interval = setInterval(async () => {
      try {
        if (pairedCode) {
          const res = await fetch(`/api/tv/parear?codigo=${pairedCode}`);
          if (res.ok) {
            const data = await res.json();
            setAnuncios(data.anuncios || []);
          }
        }
        // Heartbeat
        await fetch("/api/tv/telemetria", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pontoId: ponto.id, heartbeatOnly: true }),
        });
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [ponto?.id, pairedCode]);

  // 4. Registro de telemetria ao rodar anúncio
  const registrarExibicao = async (ad: TVAnuncio) => {
    if (!ponto?.id) return;
    try {
      await fetch("/api/tv/telemetria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pontoId: ponto.id,
          anuncioId: ad.id,
          duracaoSegundos: ad.duracaoSegundos || 10,
          tipoMidia: ad.tipoMidia,
        }),
      });
    } catch (err) {
      console.error("Erro ao registrar telemetria:", err);
    }
  };

  // 5. Rotação de anúncios
  const nextAd = () => {
    if (anuncios.length === 0) return;
    const currentAd = anuncios[currentIndex];
    if (currentAd) {
      registrarExibicao(currentAd);
    }
    setCurrentIndex((prev) => (prev + 1) % anuncios.length);
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
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, anuncios, ponto]);

  // Teclado numérico / input handlers
  const handleDigitChange = (index: number, val: string) => {
    const numeric = val.replace(/\D/g, "").slice(-1);
    const newDigits = [...codeDigits];
    newDigits[index] = numeric;
    setCodeDigits(newDigits);

    if (numeric && index < 5) {
      digitInputRefs.current[index + 1]?.focus();
      setActiveDigitIndex(index + 1);
    }

    const fullCode = newDigits.join("");
    if (fullCode.length === 6 && !newDigits.includes("")) {
      connectWithCode(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
      setActiveDigitIndex(index - 1);
    }
  };

  const handleVirtualKey = (num: string) => {
    if (num === "clear") {
      setCodeDigits(["", "", "", "", "", ""]);
      digitInputRefs.current[0]?.focus();
      setActiveDigitIndex(0);
      return;
    }
    if (num === "backspace") {
      const idx = activeDigitIndex > 0 && !codeDigits[activeDigitIndex] ? activeDigitIndex - 1 : activeDigitIndex;
      const newDigits = [...codeDigits];
      newDigits[idx] = "";
      setCodeDigits(newDigits);
      digitInputRefs.current[idx]?.focus();
      setActiveDigitIndex(idx);
      return;
    }

    // Achar primeiro dígito vazio
    const emptyIdx = codeDigits.findIndex((d) => d === "");
    const targetIdx = emptyIdx !== -1 ? emptyIdx : 5;

    const newDigits = [...codeDigits];
    newDigits[targetIdx] = num;
    setCodeDigits(newDigits);

    if (targetIdx < 5) {
      digitInputRefs.current[targetIdx + 1]?.focus();
      setActiveDigitIndex(targetIdx + 1);
    }

    const fullCode = newDigits.join("");
    if (fullCode.length === 6 && !newDigits.includes("")) {
      connectWithCode(fullCode);
    }
  };

  const desconectarTV = () => {
    if (confirm("Deseja realmente desconectar esta TV e trocar o código?")) {
      localStorage.removeItem("mediamais_tv_code");
      setPairedCode("");
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

            {/* Inputs de 6 Dígitos */}
            <div className="flex justify-center gap-2 sm:gap-3 my-8">
              {codeDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    digitInputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  disabled={connecting}
                  onFocus={() => setActiveDigitIndex(idx)}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`w-12 h-16 sm:w-16 sm:h-20 text-2xl sm:text-3xl font-black text-center rounded-2xl border-2 outline-none transition-all ${
                    digit
                      ? "bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/30"
                      : activeDigitIndex === idx
                      ? "bg-blue-950/80 text-white border-blue-400 ring-4 ring-blue-500/20"
                      : "bg-[#050e38] text-blue-200 border-blue-900/60"
                  }`}
                />
              ))}
            </div>

            {connecting && (
              <div className="flex items-center justify-center gap-2 text-xs text-blue-300 font-bold mb-4 animate-pulse">
                <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
                Validando conexão com a rede Media+...
              </div>
            )}

            {/* Teclado Virtual Numérico em Tela (Fácil para Smart TV e Controle Remoto) */}
            <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleVirtualKey(num.toString())}
                  className="h-14 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-blue-600 border border-white/15 text-xl font-bold text-white transition cursor-pointer flex items-center justify-center"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleVirtualKey("clear")}
                className="h-14 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/20 text-xs font-bold transition cursor-pointer"
              >
                LIMPAR
              </button>
              <button
                type="button"
                onClick={() => handleVirtualKey("0")}
                className="h-14 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-blue-600 border border-white/15 text-xl font-bold text-white transition cursor-pointer flex items-center justify-center"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleVirtualKey("backspace")}
                className="h-14 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/20 text-xs font-bold transition cursor-pointer"
              >
                ⌫ APAGAR
              </button>
            </div>
          </div>

          <p className="text-xs text-blue-300/50 mt-6">
            Dica: Uma vez pareada, esta TV guardará o código e iniciará automaticamente sempre que ligada.
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
            key={currentAd.id}
            src={currentAd.midiaUrl}
            autoPlay
            muted
            playsInline
            onEnded={nextAd}
            onError={() => {
              setTimeout(nextAd, 2000);
            }}
            className="w-full h-full object-contain"
          />
        ) : (
          <img
            key={currentAd.id}
            src={currentAd.midiaUrl}
            alt={currentAd.titulo}
            className="w-full h-full object-contain animate-fade-in"
          />
        )}
      </div>
    </TVFrame>
  );
}
