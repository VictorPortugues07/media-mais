"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Logo } from "@/components/ui/Logo";

export interface TVFrameProps {
  nomeEstabelecimento: string;
  pontoId: number;
  totalAnuncios: number;
  currentIndex: number;
  children: React.ReactNode;
}

export function TVFrame({
  nomeEstabelecimento,
  pontoId,
  totalAnuncios,
  currentIndex,
  children,
}: TVFrameProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    // 1. Gerar relógio em tempo real para a TV
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // 2. Gerar QR Code apontando para o link de cadastro de anunciante
    const appUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";

    const targetUrl = `${appUrl}/cadastro/anunciante?ponto=${pontoId}`;

    QRCode.toDataURL(targetUrl, {
      width: 140,
      margin: 1,
      color: {
        dark: "#051160",
        light: "#ffffff",
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error("QR Code error:", err));
  }, [pontoId]);

  return (
    <div className="w-screen h-screen bg-[#051160] flex flex-col justify-between overflow-hidden select-none font-sans relative">
      {/* Top Bar Discreta da TV */}
      <header className="h-14 sm:h-16 px-6 sm:px-10 flex items-center justify-between bg-gradient-to-b from-[#030b3d] to-transparent z-20">
        <div className="flex items-center gap-3">
          <Logo className="h-6 sm:h-7 w-auto" whiteText={true} />
          <span className="h-3.5 w-px bg-white/20" />
          <span className="text-xs sm:text-sm font-semibold text-blue-200/90 tracking-wide">
            {nomeEstabelecimento}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-white/90">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] text-blue-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Transmissão Ao Vivo
          </span>
          <span className="text-sm sm:text-base font-bold font-mono tracking-wider text-blue-100">
            {time}
          </span>
        </div>
      </header>

      {/* Área Central Principal do Anúncio (16:9 / Full View) */}
      <main className="flex-1 flex items-center justify-center relative overflow-hidden bg-black/60 mx-4 sm:mx-8 rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl">
        {children}

        {/* Indicador discreto de posição na grade */}
        {totalAnuncios > 1 && (
          <div className="absolute top-4 right-4 z-20 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 text-[11px] font-bold text-white shadow-lg">
            {currentIndex + 1} / {totalAnuncios}
          </div>
        )}
      </main>

      {/* Barra Inferior Comercial Inteligente (Moldura de Conversão Media+) */}
      <footer className="h-20 sm:h-24 px-6 sm:px-10 flex items-center justify-between bg-gradient-to-t from-[#030b3d] via-[#051160]/90 to-transparent z-20">
        {/* Chamada Comercial */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
            📢
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight font-heading">
              Quer ver a sua empresa nesta tela?
            </h4>
            <p className="text-[11px] sm:text-xs text-blue-200/80 mt-0.5 flex items-center gap-2">
              <span>Anuncie para clientes da região</span>
              <span className="w-1 h-1 rounded-full bg-blue-400" />
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                WhatsApp: (48) 8879-6514
              </span>
            </p>
          </div>
        </div>

        {/* QR Code com CTA */}
        {qrCodeDataUrl && (
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 shadow-lg">
            <div className="text-right hidden sm:block">
              <p className="text-[11px] font-bold uppercase tracking-wider text-white">
                Anuncie Aqui
              </p>
              <p className="text-[9px] text-blue-200">Aponte a câmera</p>
            </div>
            <img
              src={qrCodeDataUrl}
              alt="QR Code Anuncie Aqui"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-white p-0.5 object-contain shadow-xs"
            />
          </div>
        )}
      </footer>
    </div>
  );
}
