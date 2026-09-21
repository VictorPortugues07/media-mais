"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";

export function Header() {
  return (
    <header className="sticky top-0 z-50 pt-3 pb-2 sm:pt-4 sm:pb-3 px-4 pointer-events-none">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between rounded-full px-4 sm:px-6 shadow-xs shadow-slate-900/5 backdrop-blur-md pointer-events-auto transition-all border border-[#E4E7EC] bg-white/95">
        {/* Logo destacado sobre fundo branco */}
        <Link
          href="/"
          aria-label="Media + — página inicial"
          className="flex items-center shrink-0 transition-opacity hover:opacity-80"
        >
          <Logo className="h-6 sm:h-7 w-auto" whiteText={false} />
        </Link>

        {/* Links de Acesso */}
        <nav className="flex items-center gap-2 text-xs font-medium">
          <Link
            href="/player"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-4 py-2 transition-all duration-200 font-semibold text-[#344054] hover:text-[#0E1F66] hover:bg-[#F7F8FA]"
          >
            <svg className="w-3.5 h-3.5 text-[#4F93C9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Reprodutor TV</span>
          </Link>

          <Link
            href="/login"
            className="rounded-full px-5 py-2 transition-all duration-200 bg-[#4F93C9] hover:bg-[#3D82B5] text-white font-semibold shadow-xs shadow-[#4F93C9]/30"
          >
            Entrar
          </Link>
        </nav>
      </div>
    </header>
  );
}
