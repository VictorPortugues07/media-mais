"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Slide = { midia: string; local: string; bairro: string; anunciante: string };

const SLIDES: Slide[] = [
  { midia: "/uploads/demo/anuncios/meganutri-creatina.webp", local: "Academia Iron Fitness", bairro: "Centro · Florianópolis", anunciante: "MegaNutri Suplementos" },
  { midia: "/uploads/demo/anuncios/ilha-prime-jurere.webp", local: "Restaurante Villa Gourmet", bairro: "Agronômica · Florianópolis", anunciante: "Ilha Prime Imóveis" },
  { midia: "/uploads/demo/anuncios/visao-clara-exame.webp", local: "Clínica OdontoCenter", bairro: "Campinas · São José", anunciante: "Ótica Visão Clara" },
  { midia: "/uploads/demo/anuncios/autoprime-suv.webp", local: "Barbearia Don Corleone", bairro: "Pagani · Palhoça", anunciante: "AutoPrime Veículos" },
  { midia: "/uploads/demo/anuncios/codelab-bootcamp.webp", local: "Hub Coworking Ilha", bairro: "Trindade · Florianópolis", anunciante: "CodeLab Cursos" },
  { midia: "/uploads/demo/anuncios/forno-napoli-pousada.webp", local: "Pousada Mar Azul", bairro: "Ingleses · Florianópolis", anunciante: "Forno di Napoli" },
];

const DURACAO = 5000;

/** Mockup de TV que reproduz anúncios reais da rede, como o player faz nos estabelecimentos. */
export function TvShowcase() {
  const [atual, setAtual] = useState(0);
  const [hora, setHora] = useState("");
  const [exibicoes, setExibicoes] = useState(1284);

  useEffect(() => {
    const timer = setInterval(() => {
      setAtual((i) => (i + 1) % SLIDES.length);
      setExibicoes((n) => n + 1);
    }, DURACAO);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const atualizar = () =>
      setHora(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    atualizar();
    const timer = setInterval(atualizar, 15000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[atual]!;

  return (
    <div className="relative mx-auto max-w-4xl">
      {/* Luz ambiente da tela */}
      <div
        aria-hidden="true"
        className="absolute -inset-x-10 -top-6 bottom-10 rounded-[48px] bg-[#4F93C9]/20 blur-3xl"
      />

      {/* TV */}
      <div className="relative rounded-[22px] sm:rounded-[28px] bg-[#0A0F2C] p-1.5 sm:p-2.5 shadow-2xl ring-1 ring-white/10">
        <div className="relative aspect-video overflow-hidden rounded-[16px] sm:rounded-[20px] bg-black">
          {SLIDES.map((s, i) => (
            <div
              key={s.midia}
              className={cn(
                "absolute inset-0 transition-opacity duration-1000 ease-out",
                i === atual ? "opacity-100" : "opacity-0"
              )}
            >
              <img
                src={s.midia}
                alt={`Anúncio de ${s.anunciante}`}
                className={cn("h-full w-full object-cover", i === atual && "animate-ken-burns")}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                key={i === atual ? `on-${atual}` : "off"}
              />
            </div>
          ))}

          {/* Barra superior do player */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3 sm:px-5 pt-2.5 sm:pt-4 pb-8 bg-gradient-to-b from-black/55 to-transparent text-white">
            <div className="flex items-center gap-2 min-w-0">
              <img src="/logo.svg" alt="" className="h-4 sm:h-5 w-auto brightness-0 invert" />
              <span className="hidden sm:block h-3 w-px bg-white/25" />
              <span key={slide.local} className="hidden sm:block text-xs font-medium text-white/85 truncate animate-fade-in">
                {slide.local}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-[10px] sm:text-xs font-medium">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 sm:px-2.5 sm:py-1 backdrop-blur-md">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#8FAE9E] animate-ping opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#8FAE9E]" />
                </span>
                Ao vivo
              </span>
              <span className="font-mono tabular-nums text-white/85">{hora}</span>
            </div>
          </div>

          {/* Progresso do loop de anúncios */}
          <div className="absolute inset-x-3 sm:inset-x-5 bottom-2.5 sm:bottom-4 flex gap-1.5">
            {SLIDES.map((s, i) => (
              <span key={s.midia} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
                <span
                  key={i === atual ? `p-${atual}-${exibicoes}` : `p-${i}`}
                  className={cn(
                    "block h-full origin-left rounded-full bg-white",
                    i < atual ? "scale-x-100" : i === atual ? "" : "scale-x-0"
                  )}
                  style={i === atual ? { animation: `progress ${DURACAO}ms linear both` } : undefined}
                />
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Pé da TV */}
      <div aria-hidden="true" className="relative mx-auto h-3 w-40 sm:w-56 rounded-b-xl bg-gradient-to-b from-[#0A0F2C] to-[#1B2350]" />
      <div aria-hidden="true" className="relative mx-auto mt-1 h-1.5 w-56 sm:w-80 rounded-full bg-[#0E1F66]/10 blur-[2px]" />

      {/* Cartões flutuantes */}
      <div className="hidden xl:block absolute -left-52 top-[28%] animate-float-slow">
        <div className="glass-pill rounded-2xl px-4 py-3 w-60">
          <p className="text-[11px] font-medium text-[#8A93A3]">Exibindo agora em</p>
          <div key={slide.local} className="animate-fade-in">
            <p className="mt-0.5 text-sm font-semibold text-[#0E1F66]">{slide.local}</p>
            <p className="text-xs text-[#667085]">{slide.bairro}</p>
          </div>
        </div>
      </div>

      <div className="hidden xl:block absolute -right-52 bottom-[26%] animate-float-reverse">
        <div className="glass-pill rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8FAE9E]/15 text-[#1E4333]">
            <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <div>
            <p className="text-[11px] font-medium text-[#8A93A3]">Exibições registradas hoje</p>
            <p key={exibicoes} className="text-sm font-semibold text-[#0E1F66] tabular-nums animate-fade-in">
              {exibicoes.toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
