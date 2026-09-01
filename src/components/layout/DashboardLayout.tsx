"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export interface DashboardLayoutProps {
  role: "PONTO" | "ANUNCIANTE" | "ADMIN";
  userName: string;
  userEmail: string;
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
  pontoId,
  title,
  description,
  actions,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        role={role}
        userName={userName}
        userEmail={userEmail}
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
          <div className="flex items-center gap-4">
            {actions}
            <div className="h-6 w-px bg-slate-200" />
            <NotificationBell role={role} />
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
