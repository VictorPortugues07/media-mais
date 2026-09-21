"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useNotifications, NotificationItem } from "@/context/NotificationContext";

export type { NotificationItem };

export function NotificationBell({ role }: { role: "PONTO" | "ANUNCIANTE" | "ADMIN" }) {
  const { unreadCount, notifications, loading, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const notificacoesHref =
    role === "ADMIN"
      ? "/admin/notificacoes"
      : role === "PONTO"
      ? "/ponto/notificacoes"
      : "/anunciante/notificacoes";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition"
        title="Notificações"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#4F93C9] text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-xl border border-[#E4E7EC] py-2 z-50 animate-fade-in">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E4E7EC]">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#0E1F66]">
                  Notificações
                </h4>
                {unreadCount > 0 && (
                  <span className="bg-[#4F93C9]/15 text-[#0E1F66] text-xs px-2 py-0.5 rounded-full font-bold">
                    {unreadCount} nova{unreadCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-[#4F93C9] hover:text-[#0E1F66] font-semibold cursor-pointer"
                >
                  Marcar todas lidas
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
              {loading && notifications.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Carregando...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Nenhuma notificação no momento
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`p-3.5 hover:bg-[#F7F8FA] cursor-pointer transition flex items-start gap-3 ${
                      !n.lida ? "bg-[#4F93C9]/5" : ""
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        !n.lida ? "bg-[#4F93C9] ring-4 ring-[#4F93C9]/20" : "bg-transparent"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#0E1F66]">
                        {n.titulo}
                      </p>
                      <p className="text-xs text-[#344054] mt-0.5 leading-relaxed break-words">
                        {n.mensagem}
                      </p>
                      <p className="text-[10px] text-[#9AA3AF] mt-1">
                        {new Date(n.criadoEm).toLocaleDateString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-4 py-2 border-t border-[#E4E7EC] text-center">
              <Link
                href={notificacoesHref}
                onClick={() => setIsOpen(false)}
                className="text-xs font-semibold text-[#4F93C9] hover:text-[#0E1F66]"
              >
                Ver central completa →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
