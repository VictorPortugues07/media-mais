"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CountUp } from "@/components/landing/CountUp";

// ─────────────────────────────────────────────────────────────
// Ícones (traço único, 24px) — mesmo estilo em todos os painéis
// ─────────────────────────────────────────────────────────────
const PATHS = {
  tv: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  play: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  chart: "M7 17V13m5 4V9m5 8V5M4 21h16",
  wallet: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  plus: "M12 5v14m7-7H5",
  eye: "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  flag: "M3 21V4m0 0h13l-2 4 2 4H3",
  map: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
  refresh: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  copy: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
  check: "M5 13l4 4L19 7",
  qr: "M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm4 0h2v2h-2v-2z",
  hourglass: "M6 2h12M6 22h12M7 2v4a5 5 0 005 5 5 5 0 005-5V2M7 22v-4a5 5 0 015-5 5 5 0 015 5v4",
  trend: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  arrow: "M5 12h14m-6-6l6 6-6 6",
  link: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
  spark: "M12 3v3m0 12v3m9-9h-3M6 12H3m14.364-6.364l-2.121 2.121M8.757 15.243l-2.121 2.121m12.728 0l-2.121-2.121M8.757 8.757L6.636 6.636",
  info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  x: "M6 18L18 6M6 6l12 12",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "h-5 w-5", strokeWidth = 1.75 }: { name: IconName; className?: string; strokeWidth?: number }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d={PATHS[name]} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Saudação conforme o horário
// ─────────────────────────────────────────────────────────────
export function Saudacao() {
  const h = new Date().getHours();
  // O horário do servidor pode diferir do navegador; o texto do cliente prevalece.
  return <span suppressHydrationWarning>{h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite"}</span>;
}

export const primeiroNome = (nome?: string | null) => (nome || "").split(" ")[0] || "";

export const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ─────────────────────────────────────────────────────────────
// Cartões e blocos
// ─────────────────────────────────────────────────────────────
const TONS = {
  sky: "bg-[#4F93C9]/10 text-[#2F6FA3]",
  teal: "bg-[#8FAE9E]/15 text-[#3E6B57]",
  navy: "bg-[#0E1F66]/[0.07] text-[#0E1F66]",
  amber: "bg-amber-100/70 text-amber-700",
} as const;

export type Tom = keyof typeof TONS;

export function IconBadge({ name, tom = "sky", className }: { name: IconName; tom?: Tom; className?: string }) {
  return (
    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", TONS[tom], className)}>
      <Icon name={name} className="h-[19px] w-[19px]" />
    </span>
  );
}

/** Número-chave com ícone e contagem animada. */
export function StatTile({
  icon,
  tom = "sky",
  label,
  valor,
  prefixo,
  sufixo,
  formatar,
  dica,
  delay = 0,
}: {
  icon: IconName;
  tom?: Tom;
  label: string;
  valor: number;
  prefixo?: string;
  sufixo?: string;
  /** Quando informado, exibe o valor formatado (sem contagem) — ex.: moeda */
  formatar?: (v: number) => string;
  dica?: string;
  delay?: number;
}) {
  return (
    <div
      className="group relative rounded-2xl bg-white p-5 ring-1 ring-[#E4E7EC]/80 shadow-xs transition duration-300 hover:-translate-y-0.5 hover:shadow-md animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-[#667085]">{label}</p>
        <IconBadge name={icon} tom={tom} className="h-9 w-9 transition-transform duration-300 group-hover:scale-105" />
      </div>
      <p className="mt-3 font-heading text-[28px] font-semibold leading-none tracking-tight text-[#0E1F66]">
        {prefixo}
        {formatar ? formatar(valor) : <CountUp value={valor} />}
        {sufixo && <span className="ml-0.5 text-lg text-[#8A93A3]">{sufixo}</span>}
      </p>
      {dica && <p className="mt-2 text-xs text-[#8A93A3]">{dica}</p>}
    </div>
  );
}

export function Painel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-2xl bg-white ring-1 ring-[#E4E7EC]/80 shadow-xs", className)}>{children}</div>;
}

export function SecaoTitulo({ titulo, descricao, acao }: { titulo: string; descricao?: string; acao?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-heading text-lg font-semibold text-[#0E1F66]">{titulo}</h2>
        {descricao && <p className="mt-0.5 text-[13px] text-[#8A93A3]">{descricao}</p>}
      </div>
      {acao}
    </div>
  );
}

/** Fundo navy imersivo usado nos heróis dos painéis (mesma linguagem da home). */
export function HeroNavy({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("relative overflow-hidden rounded-3xl bg-[#0B1A57] text-white shadow-lg animate-fade-in", className)}>
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(80%_90%_at_100%_0%,rgba(79,147,201,0.35),transparent_60%)]" />
      <div aria-hidden="true" className="absolute inset-0 opacity-50 [background-image:radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="relative">{children}</div>
    </section>
  );
}

export function PontoVivo({ cor = "#8FAE9E", className }: { cor?: string; className?: string }) {
  return (
    <span className={cn("relative flex h-2 w-2", className)}>
      <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: cor }} />
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: cor }} />
    </span>
  );
}

/** Anel de progresso (SVG). */
export function Anel({ progresso, tamanho = 64, espessura = 6, cor = "#4F93C9", trilha = "rgba(14,31,102,0.08)", children }: {
  progresso: number;
  tamanho?: number;
  espessura?: number;
  cor?: string;
  trilha?: string;
  children?: React.ReactNode;
}) {
  const r = (tamanho - espessura) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progresso));
  return (
    <div className="relative shrink-0" style={{ width: tamanho, height: tamanho }}>
      <svg width={tamanho} height={tamanho} className="-rotate-90">
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} stroke={trilha} strokeWidth={espessura} fill="none" />
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={r}
          stroke={cor}
          strokeWidth={espessura}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}

/** Mini TV que alterna as mídias ativas — dá a sensação de "ao vivo" no painel. */
export function MiniTv({
  itens,
  legenda,
  intervalo = 4500,
}: {
  itens: { midiaUrl: string; tipoMidia: "VIDEO" | "IMAGEM"; titulo: string; local: string }[];
  legenda?: string;
  intervalo?: number;
}) {
  const [atual, setAtual] = useState(0);

  useEffect(() => {
    if (itens.length <= 1) return;
    const t = setInterval(() => setAtual((i) => (i + 1) % itens.length), intervalo);
    return () => clearInterval(t);
  }, [itens.length, intervalo]);

  const item = itens[atual % Math.max(itens.length, 1)];

  return (
    <div className="w-full">
      <div className="rounded-2xl bg-[#05092A] p-1.5 shadow-2xl ring-1 ring-white/10">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-[#0A0F2C]">
          {itens.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-white/40">
              <Icon name="tv" className="h-8 w-8" />
              <span className="text-xs">Nenhum anúncio no ar</span>
            </div>
          ) : (
            itens.map((it, i) => (
              <div
                key={`${it.midiaUrl}-${i}`}
                className={cn("absolute inset-0 transition-opacity duration-1000", i === atual ? "opacity-100" : "opacity-0")}
              >
                {it.tipoMidia === "VIDEO" ? (
                  i === atual ? (
                    <video src={it.midiaUrl} autoPlay muted loop playsInline className="h-full w-full object-cover" />
                  ) : null
                ) : (
                  <img src={it.midiaUrl} alt="" className={cn("h-full w-full object-cover", i === atual && "animate-ken-burns")} />
                )}
              </div>
            ))
          )}
          {item && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium backdrop-blur-md">
              <PontoVivo className="h-1.5 w-1.5" />
              Ao vivo
            </span>
          )}
          {itens.length > 1 && (
            <div className="absolute inset-x-3 bottom-2.5 flex gap-1">
              {itens.map((it, i) => (
                <span key={`${it.midiaUrl}-p${i}`} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
                  <span
                    key={i === atual ? `on-${atual}` : "off"}
                    className={cn("block h-full origin-left rounded-full bg-white", i < atual ? "scale-x-100" : i === atual ? "" : "scale-x-0")}
                    style={i === atual ? { animation: `progress ${intervalo}ms linear both` } : undefined}
                  />
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {item && (
        <div key={atual} className="mt-3 animate-fade-in">
          <p className="truncate text-sm font-medium text-white">{item.titulo}</p>
          <p className="truncate text-xs text-white/55">{legenda ? `${legenda} ` : ""}{item.local}</p>
        </div>
      )}
    </div>
  );
}

/** Toast de confirmação (padrão dos painéis). */
export function Toast({ mensagem, onClose }: { mensagem: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-[#0E1F66] px-4 py-3 text-sm text-white shadow-xl animate-fade-in">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#8FAE9E]/25 text-[#BFE0D0]">
        <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
      <span>{mensagem}</span>
      <button type="button" onClick={onClose} aria-label="Fechar" className="ml-1 text-white/50 hover:text-white cursor-pointer">
        <Icon name="x" className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Esqueleto de carregamento com o mesmo formato do painel. */
export function PainelCarregando() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-56 rounded-3xl bg-[#0E1F66]/[0.08]" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-white ring-1 ring-[#E4E7EC]/80" />
        ))}
      </div>
      <div className="h-72 rounded-2xl bg-white ring-1 ring-[#E4E7EC]/80" />
    </div>
  );
}
