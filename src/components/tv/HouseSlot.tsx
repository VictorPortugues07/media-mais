"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

export const HOUSE_SLOT_SEGUNDOS = 10;

/**
 * Anúncio institucional da rede ("house ad"), exibido em tela cheia entre os
 * anúncios pagos. Concentra as informações do local e a chamada "Anuncie aqui",
 * para que os anúncios pagos possam ocupar 100% da tela sem molduras.
 */
export function HouseSlot({
  pontoId,
  nomeEstabelecimento,
  categoria,
  cidade,
  uf,
  totalMarcas,
}: {
  pontoId: number;
  nomeEstabelecimento: string;
  categoria: string;
  cidade: string;
  uf: string;
  totalMarcas: number;
}) {
  const [qr, setQr] = useState("");
  // Só é renderizado no cliente (após o pareamento da TV), então pode iniciar com a hora atual
  const [agora, setAgora] = useState(() => new Date());

  useEffect(() => {
    const url = `${window.location.origin}/cadastro/anunciante?ponto=${pontoId}`;
    QRCode.toDataURL(url, { width: 360, margin: 1, color: { dark: "#0B1A57", light: "#ffffff" } })
      .then(setQr)
      .catch(() => {});
  }, [pontoId]);

  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  const hora = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const data = agora.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0B1A57] text-white animate-fade-in">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(70%_80%_at_100%_50%,rgba(79,147,201,0.32),transparent_65%)]" />
      <div aria-hidden="true" className="absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:2.2vw_2.2vw]" />

      <div className="relative grid h-full grid-cols-[1.15fr_1fr] items-center gap-[5vw] px-[7vw]">
        {/* Local + horário */}
        <div>
          <img
            src="/logo.svg"
            alt="Media+"
            className="h-[3.2vw] w-auto"
            style={{ animation: "wordIn 0.7s var(--ease-out-soft) 0.1s both" }}
          />
          <p className="mt-[5vh] text-[1.5vw] text-white/60" style={{ animation: "wordIn 0.7s var(--ease-out-soft) 0.25s both" }}>
            Você está em
          </p>
          <h1
            className="mt-[1vh] font-heading text-[4.6vw] font-semibold leading-[1.05] tracking-tight"
            style={{ animation: "wordIn 0.8s var(--ease-out-soft) 0.35s both" }}
          >
            {nomeEstabelecimento}
          </h1>
          <p className="mt-[1.5vh] text-[1.5vw] text-[#8EC3EA]" style={{ animation: "wordIn 0.7s var(--ease-out-soft) 0.5s both" }}>
            {categoria} · {cidade}/{uf}
          </p>

          <div className="mt-[7vh] flex items-end gap-[1.6vw]" style={{ animation: "wordIn 0.7s var(--ease-out-soft) 0.65s both" }}>
            <span className="font-heading text-[6vw] font-semibold leading-none tabular-nums">{hora}</span>
            <span className="pb-[0.8vw] text-[1.4vw] text-white/55 first-letter:uppercase">{data}</span>
          </div>
        </div>

        {/* Chamada comercial */}
        <div
          className="justify-self-end w-full max-w-[34vw] rounded-[2vw] bg-white p-[2.6vw] text-[#0E1F66] shadow-2xl"
          style={{ animation: "wordIn 0.9s var(--ease-out-soft) 0.5s both" }}
        >
          <p className="text-[1.2vw] font-medium text-[#4F93C9]">Anuncie nesta tela</p>
          <h2 className="mt-[0.6vw] font-heading text-[2.5vw] font-semibold leading-[1.1] tracking-tight">
            Sua marca para quem está aqui agora.
          </h2>
          <div className="mt-[1.8vw] flex items-center gap-[1.6vw]">
            {qr ? (
              <img src={qr} alt="QR Code para anunciar" className="h-[11vw] w-[11vw] rounded-[0.8vw] ring-1 ring-[#E4E7EC]" />
            ) : (
              <div className="h-[11vw] w-[11vw] rounded-[0.8vw] bg-[#F4F5F7]" />
            )}
            <div className="text-[1.15vw] leading-relaxed text-[#5B6578]">
              <p className="font-medium text-[#0E1F66]">Aponte a câmera</p>
              <p>ou chame no WhatsApp</p>
              <p className="mt-[0.4vw] font-semibold text-[#0E1F66]">(48) 98879-6514</p>
            </div>
          </div>
          {totalMarcas > 0 && (
            <p className="mt-[1.8vw] border-t border-[#EEF0F3] pt-[1.2vw] text-[1vw] text-[#8A93A3]">
              {totalMarcas === 1 ? "1 marca já anuncia aqui" : `${totalMarcas} marcas já anunciam aqui`}
            </p>
          )}
        </div>
      </div>

      {/* Tempo restante do bloco institucional */}
      <div className="absolute inset-x-0 bottom-0 h-[0.35vh] bg-white/10">
        <span
          className="block h-full origin-left bg-[#4F93C9]"
          style={{ animation: `progress ${HOUSE_SLOT_SEGUNDOS}s linear both` }}
        />
      </div>
    </div>
  );
}
