"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 pt-3 pb-2 sm:pt-4 sm:pb-3 px-4 pointer-events-none">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between rounded-full border border-slate-200/80 bg-white/85 px-4 sm:px-6 shadow-sm shadow-slate-900/5 backdrop-blur-md pointer-events-auto transition-all">
        {/* Logo */}
        <Link
          href="/"
          aria-label="Media + — página inicial"
          className="flex items-center shrink-0 transition-opacity hover:opacity-80"
        >
          <Logo className="h-6 sm:h-7 w-auto" />
        </Link>

        {/* Links de Acesso */}
        <nav className="flex items-center gap-1.5 sm:gap-2 text-xs font-medium">
          <Link
            href="/login"
            className={`rounded-full px-4 py-1.5 transition-all duration-200 ${
              pathname === "/login"
                ? "bg-brand-gradient text-white font-semibold shadow-xs shadow-blue-500/25"
                : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/70"
            }`}
          >
            Entrar
          </Link>
          <Link
            href="/cadastro/ponto"
            className="hidden sm:inline-flex rounded-full px-4 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
          >
            Tenho uma TV
          </Link>
          <Link
            href="/cadastro/anunciante"
            className="rounded-full px-4 py-1.5 bg-brand-gradient hover:bg-brand-gradient-hover text-white font-semibold shadow-xs shadow-blue-500/20 transition"
          >
            Quero Anunciar
          </Link>
        </nav>
      </div>
    </header>
  );
}
