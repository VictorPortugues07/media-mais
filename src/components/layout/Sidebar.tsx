"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export interface SidebarProps {
  role: "PONTO" | "ANUNCIANTE" | "ADMIN";
  userName: string;
  userEmail: string;
  userAvatar?: string | null;
  pontoId?: number;
}

export function Sidebar({ role, userName, userEmail, userAvatar, pontoId }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  const links = {
    ANUNCIANTE: [
      {
        href: "/anunciante/dashboard",
        label: "Dashboard",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
      },
      {
        href: "/anunciante/mapa",
        label: "Mapa de Pontos",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
      {
        href: "/anunciante/anuncios/novo",
        label: "Criar Anúncio",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4v16m8-8H4" />
          </svg>
        ),
      },
      {
        href: "/anunciante/notificacoes",
        label: "Notificações",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        ),
      },
      {
        href: "/anunciante/perfil",
        label: "Usuário",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
      },
    ],
    PONTO: [
      {
        href: "/ponto/dashboard",
        label: "Dashboard",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
      },
      {
        href: "/ponto/anuncios",
        label: "Anúncios na TV",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ),
      },
      {
        href: "/ponto/notificacoes",
        label: "Notificações",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        ),
      },
      {
        href: "/ponto/perfil",
        label: "Usuário",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
      },
    ],
    ADMIN: [
      {
        href: "/admin/dashboard",
        label: "Visão Geral",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      },
      {
        href: "/admin/aprovacoes",
        label: "Aprovações",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        href: "/admin/notificacoes",
        label: "Notificações",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        ),
      },
      {
        href: "/admin/pontos",
        label: "Pontos de TV",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ),
      },
      {
        href: "/admin/anunciantes",
        label: "Anunciantes",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        ),
      },
      {
        href: "/admin/usuarios",
        label: "Gerenciar Usuários",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
      },
      {
        href: "/admin/perfil",
        label: "Usuário",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
      },
    ],
  };

  const navItems = links[role] || [];

  const roleLabel = {
    ANUNCIANTE: "Painel do anunciante",
    PONTO: "Painel do estabelecimento",
    ADMIN: "Administração",
  }[role];

  return (
    <>
      {/* Mobile Topbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white/85 backdrop-blur-lg z-30 px-3 flex items-center justify-between border-b border-[#E4E7EC]/80">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Abrir menu"
            className="p-2 rounded-lg text-[#344054] hover:bg-[#0E1F66]/[0.05] cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 7h16M4 12h16M4 17h10" />
            </svg>
          </button>
          <Logo className="h-6 w-auto" whiteText={false} />
        </div>
        <NotificationBell role={role} />
      </div>

      {/* Backdrop for Mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-[#0A1240]/40 backdrop-blur-[2px] z-40 animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — Brand Navy */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 w-64 bg-[#0B1A57] text-white/80 z-50 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_60%_at_0%_0%,rgba(79,147,201,0.18),transparent_60%)]"
        />

        {/* Marca */}
        <div className="relative px-6 pt-6 pb-5">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Logo className="h-7 w-auto" whiteText={true} />
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Fechar menu"
              className="lg:hidden p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-3 text-[11px] font-medium text-white/45">{roleLabel}</p>
        </div>

        {/* Navegação */}
        <nav className="relative flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                target={(item as { target?: string }).target}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors duration-150 relative [&_svg]:w-[18px] [&_svg]:h-[18px]",
                  isActive
                    ? "bg-white/[0.09] text-white"
                    : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                )}
              >
                <span
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[#4F93C9] transition-opacity",
                    isActive ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className={cn(isActive ? "text-[#8EC3EA]" : "text-white/45 group-hover:text-white/80")}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Usuário */}
        <div className="relative p-3 border-t border-white/[0.08]">
          <div className="flex items-center gap-3 px-2 py-2">
            {userAvatar ? (
              <img loading="lazy" decoding="async"
                src={userAvatar}
                alt={userName}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-white/10 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold text-white/80 shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-white truncate">{userName}</p>
              <p className="text-[11px] text-white/45 truncate">{userEmail}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sair da conta"
              aria-label="Sair da conta"
              className="p-2 rounded-lg text-white/45 hover:text-[#F7A895] hover:bg-white/[0.06] transition cursor-pointer"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
