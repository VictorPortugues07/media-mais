"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 pt-3 pb-2 sm:pt-4 sm:pb-3 px-4 pointer-events-none">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between rounded-full px-4 sm:px-6 shadow-sm shadow-slate-900/5 backdrop-blur-md pointer-events-auto transition-all border border-slate-200/80 bg-white/95">
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
            className="hidden sm:inline-flex rounded-full px-4 py-2 transition-all duration-200 font-semibold text-slate-600 hover:text-blue-700 hover:bg-slate-100"
          >
            Player TV 📺
          </Link>

          <Link
            href="/login"
            className="rounded-full px-5 py-2 transition-all duration-200 bg-brand-gradient text-white font-semibold hover:bg-brand-gradient-hover shadow-xs shadow-blue-500/25"
          >
            Entrar
          </Link>
        </nav>
      </div>
    </header>
  );
}
