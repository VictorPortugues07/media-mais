"use client";

import React from "react";
import Link from "next/link";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "@/components/notifications/NotificationBell";

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
  const perfilHref =
    role === "PONTO"
      ? "/ponto/perfil"
      : role === "ANUNCIANTE"
      ? "/anunciante/perfil"
      : "/admin/perfil";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        role={role}
        userName={userName}
        userEmail={userEmail}
        userAvatar={userAvatar}
        pontoId={pontoId}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        {/* Desktop Top Navbar */}
        <header className="hidden lg:flex h-16 bg-white border-b border-slate-200/80 px-8 items-center justify-between sticky top-0 z-20 shadow-xs">
          <div>
            {title && (
              <h1 className="text-lg font-bold text-slate-900">{title}</h1>
            )}
            {description && (
              <p className="text-xs text-slate-500">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-3.5">
            {actions}

            <NotificationBell role={role} />

            {/* Foto de Perfil e Acesso do Usuário (Sem bolinha azul de iniciais) */}
            <Link
              href={perfilHref}
              className="flex items-center gap-2.5 pl-2 border-l border-slate-200 hover:opacity-85 transition group cursor-pointer"
              title="Acessar edições de usuário e perfil"
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-xs group-hover:border-blue-500 transition"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-blue-50 border border-dashed border-slate-300 group-hover:border-blue-400 text-slate-400 group-hover:text-blue-600 flex items-center justify-center transition shadow-2xs"
                  title="Clique para adicionar foto de perfil"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              )}
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-700 max-w-[120px] truncate group-hover:text-blue-600 transition">
                  {userName}
                </span>
                {!userAvatar && (
                  <span className="text-[10px] text-blue-600 font-semibold leading-none">
                    + Foto
                  </span>
                )}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0 max-w-7xl w-full mx-auto">
          {/* Mobile title if any */}
          {title && (
            <div className="lg:hidden mb-6">
              <h1 className="text-xl font-bold text-slate-900">{title}</h1>
              {description && (
                <p className="text-xs text-slate-500 mt-0.5">{description}</p>
              )}
              {actions && <div className="mt-3">{actions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
