"use client";

import React, { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const DEMO = "/uploads/demo";

// ─────────────────────────────────────────────────────────────
// Mini-ilustrações de cada passo (interfaces simplificadas da plataforma)
// ─────────────────────────────────────────────────────────────

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-52 overflow-hidden rounded-2xl bg-gradient-to-br from-[#F4F7FB] to-[#EAF1F8] ring-1 ring-[#E4E7EC]/80">
      <div aria-hidden="true" className="absolute inset-0 bg-dot-grid opacity-60" />
      <div className="relative flex h-full items-center justify-center p-5">{children}</div>
    </div>
  );
}

function Pino({ className, ativo = false, delay = "0s" }: { className: string; ativo?: boolean; delay?: string }) {
  return (
    <span className={cn("absolute", className)}>
      {ativo && (
        <span className="absolute inset-0 rounded-full bg-[#4F93C9]/40 animate-signal" style={{ animationDelay: delay }} />
      )}
      <span
        className={cn(
          "relative block h-3 w-3 rounded-full ring-[3px] ring-white shadow-sm",
          ativo ? "bg-[#4F93C9]" : "bg-[#0E1F66]/30"
        )}
      />
    </span>
  );
}

/** Anunciante 1 — mapa com telas disponíveis */
function IlustracaoMapa() {
  return (
    <Moldura>
      {/* "ruas" do mapa */}
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full text-white" preserveAspectRatio="none" viewBox="0 0 300 200">
        <path d="M-10 140 C 60 120, 110 160, 180 120 S 280 90, 320 110" stroke="currentColor" strokeWidth="10" fill="none" />
        <path d="M90 -10 C 100 60, 70 120, 110 210" stroke="currentColor" strokeWidth="8" fill="none" />
        <path d="M210 -10 C 200 70, 240 130, 220 210" stroke="currentColor" strokeWidth="6" fill="none" />
      </svg>
      <Pino className="left-[18%] top-[30%]" />
      <Pino className="left-[42%] top-[62%]" ativo delay="0.6s" />
      <Pino className="left-[72%] top-[24%]" />
      <Pino className="left-[80%] top-[70%]" />

      {/* cartão do ponto selecionado */}
      <div className="absolute right-4 top-5 w-40 rounded-xl bg-white p-2 shadow-lg ring-1 ring-[#0E1F66]/[0.06] animate-float-slow">
        <img src={`${DEMO}/pontos/gym1.webp`} alt="" className="h-16 w-full rounded-lg object-cover" loading="lazy" />
        <p className="mt-2 truncate text-[11px] font-semibold text-[#0E1F66]">Academia Iron Fitness</p>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[10px] text-[#8A93A3]">+300 pessoas/dia</span>
          <span className="rounded-full bg-[#FEF3C7]/80 px-1.5 py-0.5 text-[9px] font-semibold text-[#92400E]">Ouro</span>
        </div>
      </div>
    </Moldura>
  );
}

/** Anunciante 2 — envio e otimização do anúncio */
function IlustracaoUpload() {
  return (
    <Moldura>
      <div className="w-full max-w-[230px] rounded-xl bg-white p-3 shadow-lg ring-1 ring-[#0E1F66]/[0.06]">
        <div className="relative overflow-hidden rounded-lg">
          <img src={`${DEMO}/anuncios/meganutri-creatina.webp`} alt="" className="aspect-video w-full object-cover" loading="lazy" />
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-medium text-white">0:15</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-[10px]">
          <span className="font-medium text-[#344054]">anuncio-creatina.mp4</span>
          <span className="text-[#6F9483] font-semibold">Otimizado</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#EEF0F3]">
          <span className="block h-full origin-left rounded-full bg-gradient-to-r from-[#4F93C9] to-[#8FAE9E] [animation:progress_2.4s_var(--ease-out-soft)_infinite]" />
        </div>
        <p className="mt-1.5 text-[10px] text-[#8A93A3]">
          5,4 MB <span className="mx-0.5">→</span> <span className="font-semibold text-[#0E1F66]">666 KB</span>
        </p>
      </div>
    </Moldura>
  );
}

/** Anunciante 3 — acompanhamento das exibições */
function IlustracaoMetricas() {
  const barras = [38, 52, 44, 66, 58, 74, 88];
  return (
    <Moldura>
      <div className="w-full max-w-[230px] rounded-xl bg-white p-3.5 shadow-lg ring-1 ring-[#0E1F66]/[0.06]">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium text-[#8A93A3]">Exibições na semana</p>
          <span className="inline-flex items-center gap-1 text-[9px] font-medium text-[#1E4333]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#6F9483] animate-pulse" /> no ar
          </span>
        </div>
        <p className="mt-1 font-heading text-xl font-semibold text-[#0E1F66]">1.556</p>
        <div className="mt-3 flex h-16 items-end gap-1.5">
          {barras.map((h, i) => (
            <span
              key={i}
              className={cn("flex-1 rounded-t-[4px] origin-bottom", i === barras.length - 1 ? "bg-[#4F93C9]" : "bg-[#4F93C9]/25")}
              style={{ height: `${h}%`, animation: `wordIn 0.6s var(--ease-out-soft) ${i * 70}ms both` }}
            />
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[8px] text-[#AEB6C4]">
          {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
            <span key={i} className="flex-1 text-center">{d}</span>
          ))}
        </div>
      </div>
    </Moldura>
  );
}

/** Estabelecimento 1 — perfil do espaço */
function IlustracaoPerfil() {
  return (
    <Moldura>
      <div className="w-full max-w-[230px] rounded-xl bg-white p-3 shadow-lg ring-1 ring-[#0E1F66]/[0.06]">
        <div className="grid h-[88px] grid-cols-3 grid-rows-2 gap-1.5">
          <img src={`${DEMO}/pontos/cafe1.webp`} alt="" className="col-span-2 row-span-2 h-full w-full rounded-lg object-cover" loading="lazy" />
          <img src={`${DEMO}/pontos/cafe2.webp`} alt="" className="h-full w-full rounded-lg object-cover" loading="lazy" />
          <img src={`${DEMO}/pontos/cafe3.webp`} alt="" className="h-full w-full rounded-lg object-cover" loading="lazy" />
        </div>
        <p className="mt-2.5 text-[11px] font-semibold text-[#0E1F66]">Café & Bistrô Aroma</p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {["150–300/dia", "30–60 min", "18–45 anos"].map((t) => (
            <span key={t} className="rounded-full bg-[#F4F5F7] px-1.5 py-0.5 text-[9px] text-[#475467]">{t}</span>
          ))}
        </div>
      </div>
    </Moldura>
  );
}

/** Estabelecimento 2 — pareamento da TV com código */
function IlustracaoCodigo() {
  return (
    <Moldura>
      <div className="w-full max-w-[240px]">
        <div className="rounded-xl bg-[#0A0F2C] p-1.5 shadow-lg">
          <div className="flex aspect-video flex-col items-center justify-center rounded-lg bg-gradient-to-br from-[#0E1F66] to-[#0B1A57]">
            <p className="text-[9px] text-white/60">Digite o código da sua TV</p>
            <div className="mt-2 flex gap-1">
              {"100001".split("").map((n, i) => (
                <span
                  key={i}
                  className="flex h-6 w-5 items-center justify-center rounded bg-white/10 font-mono text-[11px] font-semibold text-white ring-1 ring-white/15"
                  style={{ animation: `wordIn 0.4s var(--ease-out-soft) ${300 + i * 160}ms both` }}
                >
                  {n}
                </span>
              ))}
            </div>
            <p
              className="mt-2 inline-flex items-center gap-1 text-[9px] font-medium text-[#8FAE9E]"
              style={{ animation: "wordIn 0.5s var(--ease-out-soft) 1.4s both" }}
            >
              <span className="h-1 w-1 rounded-full bg-[#8FAE9E]" /> Conectada
            </p>
          </div>
        </div>
        <div className="mx-auto h-1.5 w-16 rounded-b-md bg-[#0A0F2C]/80" />
      </div>
    </Moldura>
  );
}

/** Estabelecimento 3 — aprovação e repasse */
function IlustracaoRepasse() {
  return (
    <Moldura>
      <div className="w-full max-w-[230px] space-y-2">
        <div className="flex items-center gap-2.5 rounded-xl bg-white p-2.5 shadow-md ring-1 ring-[#0E1F66]/[0.06]">
          <img src={`${DEMO}/logos/burger-house.webp`} alt="" className="h-8 w-8 rounded-lg" loading="lazy" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-[#0E1F66]">Burger House 48</p>
            <p className="text-[9px] text-[#8A93A3]">quer anunciar na sua TV</p>
          </div>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6F9483] text-white">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </span>
        </div>
        <div className="rounded-xl bg-[#0E1F66] p-3 text-white shadow-lg animate-float-slow">
          <p className="text-[10px] text-white/60">Seu repasse este mês</p>
          <p className="mt-0.5 font-heading text-xl font-semibold">R$ 398,00</p>
          <p className="mt-1 text-[9px] text-[#8EC3EA]">4 cotas × R$ 99,50</p>
        </div>
      </div>
    </Moldura>
  );
}

// ─────────────────────────────────────────────────────────────

const PERFIS = {
  anunciante: {
    rotulo: "Para anunciantes",
    passos: [
      { titulo: "Escolha as telas", texto: "Veja no mapa as TVs da sua região, com fotos, público e fluxo de cada local.", Ilustracao: IlustracaoMapa },
      { titulo: "Envie seu anúncio", texto: "Vídeo de até 30 segundos ou imagem. O arquivo é otimizado para rodar liso em qualquer TV.", Ilustracao: IlustracaoUpload },
      { titulo: "Acompanhe ao vivo", texto: "Depois da aprovação, sua marca entra no loop e cada exibição fica registrada no painel.", Ilustracao: IlustracaoMetricas },
    ],
    cta: { href: "/cadastro/anunciante", label: "Criar conta de anunciante" },
  },
  estabelecimento: {
    rotulo: "Para estabelecimentos",
    passos: [
      { titulo: "Cadastre seu espaço", texto: "Conte como é seu público e o movimento, e adicione fotos do ambiente e da TV.", Ilustracao: IlustracaoPerfil },
      { titulo: "Conecte a TV", texto: "Abra o player no navegador da Smart TV e digite o código. Sem aplicativo nem aparelho extra.", Ilustracao: IlustracaoCodigo },
      { titulo: "Receba por cota", texto: "Você aprova quem aparece na sua tela e fica com 50% do valor de cada anúncio.", Ilustracao: IlustracaoRepasse },
    ],
    cta: { href: "/cadastro/ponto", label: "Cadastrar minha TV" },
  },
} as const;

type Perfil = keyof typeof PERFIS;

export function AudienceTabs() {
  const [perfil, setPerfil] = useState<Perfil>("anunciante");
  const dados = PERFIS[perfil];

  return (
    <div>
      <div className="flex justify-center">
        <div role="tablist" className="inline-flex rounded-full bg-[#0E1F66]/[0.05] p-1">
          {(Object.keys(PERFIS) as Perfil[]).map((p) => (
            <button
              key={p}
              role="tab"
              aria-selected={perfil === p}
              onClick={() => setPerfil(p)}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 cursor-pointer",
                perfil === p ? "bg-white text-[#0E1F66] shadow-sm" : "text-[#667085] hover:text-[#0E1F66]"
              )}
            >
              {PERFIS[p].rotulo}
            </button>
          ))}
        </div>
      </div>

      <ol key={perfil} className="mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
        {dados.passos.map(({ titulo, texto, Ilustracao }, i) => (
          <li key={titulo} className="animate-fade-in" style={{ animationDelay: `${i * 110}ms` }}>
            <Ilustracao />
            <div className="mt-5 flex items-start gap-3 px-1">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0E1F66] text-[11px] font-medium text-white">
                {i + 1}
              </span>
              <div>
                <h3 className="text-[17px] font-semibold text-[#0E1F66]">{titulo}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-[#667085]">{texto}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-12 flex justify-center">
        <Link
          href={dados.cta.href}
          className="group inline-flex items-center gap-2 rounded-full bg-[#0E1F66] px-6 py-3 text-sm font-medium text-white shadow-md transition hover:bg-[#16297A]"
        >
          {dados.cta.label}
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>
    </div>
  );
}
