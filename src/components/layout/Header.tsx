"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/#onde-aparece", label: "Onde aparece" },
  { href: "/#planos", label: "Planos" },
];

export function Header() {
  const [rolou, setRolou] = useState(false);

  useEffect(() => {
    const onScroll = () => setRolou(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 px-4 pt-3">
      <div
        className={cn(
          "mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full px-4 sm:px-5 transition-all duration-300",
          rolou ? "glass-pill ring-1 ring-[#0E1F66]/[0.06]" : "bg-transparent"
        )}
      >
        <Link href="/" aria-label="Media+ — página inicial" className="flex items-center shrink-0 transition-opacity hover:opacity-80">
          <Logo className="h-6 sm:h-7 w-auto" whiteText={false} />
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-[#475467] transition-colors hover:text-[#0E1F66]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 text-sm">
          <Link
            href="/player"
            className="hidden sm:inline-flex rounded-full px-4 py-2 text-[#475467] transition-colors hover:text-[#0E1F66]"
          >
            Player da TV
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-[#0E1F66] px-5 py-2 font-medium text-white shadow-sm transition hover:bg-[#16297A]"
          >
            Entrar
          </Link>
        </div>
      </div>
    </header>
  );
}
