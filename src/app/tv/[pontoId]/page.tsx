"use client";

import React, { useEffect, useState, useRef, use } from "react";
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
}

export default function TVPlayerPage({
  params,
}: {
  params: Promise<{ pontoId: string }>;
}) {
  const { pontoId } = use(params);
  const [ponto, setPonto] = useState<PontoInfo | null>(null);
  const [anuncios, setAnuncios] = useState<TVAnuncio[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const fetchPlaylist = async () => {
    try {
      const res = await fetch(`/api/tv/${pontoId}`);
      if (!res.ok) {
        throw new Error("Ponto inativo ou não encontrado");
      }
      const data = await res.json();
      setPonto(data.ponto);
      setAnuncios(data.anuncios || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar TV";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylist();

    const pollInterval = setInterval(() => {
      fetchPlaylist();
    }, 15000);

    return () => clearInterval(pollInterval);
  }, [pontoId]);

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

  const nextAd = () => {
    if (anuncios.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % anuncios.length);
  };

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (anuncios.length === 0) return;

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
  }, [currentIndex, anuncios]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#051160] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold tracking-widest uppercase text-blue-200">
          Iniciando Canal Media+...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen bg-[#051160] flex flex-col items-center justify-center text-white p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-2xl mb-4 font-black">
          !
        </div>
        <h2 className="text-2xl font-bold font-heading">Transmissão Indisponível</h2>
        <p className="text-sm text-blue-200/80 mt-2 max-w-md">{error}</p>
        <p className="text-xs text-blue-300/50 mt-6">
          Verifique se o ponto está ativo no painel administrativo.
        </p>
      </div>
    );
  }

  // Tela de espera elegante quando ainda não há anúncios aprovados
  if (anuncios.length === 0) {
    return (
      <TVFrame
        nomeEstabelecimento={ponto?.nomeEmpresa || "Ponto de Mídia"}
        pontoId={Number(pontoId)}
        totalAnuncios={0}
        currentIndex={0}
      >
        <div
          onDoubleClick={toggleFullScreen}
          className="w-full h-full flex flex-col items-center justify-center text-white p-6 text-center select-none cursor-pointer"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/10 border border-white/20 text-blue-300 flex items-center justify-center text-3xl mx-auto mb-4 shadow-2xl backdrop-blur-md">
            📺
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-heading">
            Espaço Publicitário Disponível
          </h2>
          <p className="text-xs sm:text-sm text-blue-100/80 mt-2 max-w-lg leading-relaxed">
            Anuncie sua empresa nesta TV e alcance clientes da sua região todos os dias.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Canal Conectado • Duplo clique para tela cheia
          </div>
        </div>
      </TVFrame>
    );
  }

  const currentAd = anuncios[currentIndex];

  return (
    <TVFrame
      nomeEstabelecimento={ponto?.nomeEmpresa || "Ponto de Mídia"}
      pontoId={Number(pontoId)}
      totalAnuncios={anuncios.length}
      currentIndex={currentIndex}
    >
      <div
        onDoubleClick={toggleFullScreen}
        className="w-full h-full flex items-center justify-center relative select-none cursor-pointer"
      >
        {currentAd.tipoMidia === "VIDEO" ? (
          <video
            ref={videoRef}
            key={currentAd.id}
            src={currentAd.midiaUrl}
            autoPlay
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
