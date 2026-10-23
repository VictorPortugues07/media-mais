"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { NotificationProvider } from "@/context/NotificationContext";

export interface DashboardLayoutProps {
  role: "PONTO" | "ANUNCIANTE" | "ADMIN";
  userName: string;
  userEmail: string;
  userAvatar?: string | null;
  pontoId?: number;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardLayout({
  role,
  userName,
  userEmail,
  userAvatar,
  pontoId,
  title,
  description,
  actions,
  children,
}: DashboardLayoutProps) {
  // Páginas que não informam a foto (undefined) buscam a do usuário logado,
  // para o avatar aparecer de forma consistente em todo o painel.
  const [avatarBuscado, setAvatarBuscado] = useState<string | null>(null);
  useEffect(() => {
    if (userAvatar !== undefined) return;
    let ativo = true;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (ativo && data?.user?.avatarUrl) setAvatarBuscado(data.user.avatarUrl);
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [userAvatar]);
  const avatar = userAvatar ?? avatarBuscado;

  const perfilHref =
    role === "PONTO"
      ? "/ponto/perfil"
      : role === "ANUNCIANTE"
      ? "/anunciante/perfil"
      : "/admin/perfil";

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-[#F7F8FA] flex">
        {/* Sidebar */}
        <Sidebar
          role={role}
          userName={userName}
          userEmail={userEmail}
          userAvatar={avatar}
          pontoId={pontoId}
        />

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
          {/* Desktop Top Navbar */}
          <header className="hidden lg:flex h-[72px] bg-[#F7F8FA]/80 backdrop-blur-lg border-b border-[#E4E7EC]/70 px-8 items-center justify-between sticky top-0 z-20">
            <div>
              {title && (
                <h1 className="text-[19px] font-semibold text-[#0E1F66] font-heading leading-tight">{title}</h1>
              )}
              {description && (
                <p className="text-[13px] text-[#8A93A3] mt-0.5">{description}</p>
              )}
            </div>
            <div className="flex items-center gap-3.5">
              {actions}

              <NotificationBell role={role} />

              {/* Foto de Perfil e Acesso do Usuário */}
              <Link
                href={perfilHref}
                className="flex items-center gap-2.5 pl-4 ml-1 border-l border-[#E4E7EC] transition group cursor-pointer"
                title="Acessar edições de usuário e perfil"
              >
                {avatar ? (
                  <img loading="lazy" decoding="async"
                    src={avatar}
                    alt={userName}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm group-hover:ring-[#4F93C9]/30 transition"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full bg-[#F7F8FA] hover:bg-[#4F93C9]/10 border border-dashed border-[#E4E7EC] group-hover:border-[#4F93C9] text-[#9AA3AF] group-hover:text-[#4F93C9] flex items-center justify-center transition shadow-2xs"
                    title="Clique para adicionar foto de perfil"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                )}
                <div className="flex flex-col text-left">
                  <span className="text-[13px] font-medium text-[#344054] max-w-[140px] truncate group-hover:text-[#0E1F66] transition">
                    {userName}
                  </span>
                  {!avatar && (
                    <span className="text-[10px] text-[#4F93C9] font-semibold leading-none">
                      + Foto
                    </span>
                  )}
                </div>
              </Link>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8 mt-14 lg:mt-0 max-w-[1320px] w-full mx-auto animate-fade-in">
            {/* Mobile title if any */}
            {title && (
              <div className="lg:hidden mb-6">
                <h1 className="text-xl font-semibold text-[#0E1F66] font-heading">{title}</h1>
                {description && (
                  <p className="text-[13px] text-[#8A93A3] mt-0.5">{description}</p>
                )}
                {actions && <div className="mt-3">{actions}</div>}
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}
