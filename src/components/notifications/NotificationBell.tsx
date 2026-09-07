"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export interface NotificationItem {
  id: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  criadoEm: string;
}

export function NotificationBell({ role }: { role: "PONTO" | "ANUNCIANTE" | "ADMIN" }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notificacoes");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notificacoes || []);
        setUnreadCount(data.naoLidas || 0);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/notificacoes/stream");
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "update") {
            setUnreadCount(data.naoLidas);
            if (data.latest && data.latest.length > 0) {
              setNotifications((prev) => {
                const map = new Map();
                data.latest.forEach((n: NotificationItem) => map.set(n.id, n));
                prev.forEach((n) => {
                  if (!map.has(n.id)) map.set(n.id, n);
                });
                return Array.from(map.values()).slice(0, 20);
              });
            }
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/notificacoes/${id}/ler`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notificacoes?action=marcar-todas", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

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
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-xs">
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
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-xl border border-slate-100 py-2 z-50 animate-fade-in">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  Notificações
                </h4>
                {unreadCount > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">
                    {unreadCount} nova{unreadCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
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
                    className={`p-3.5 hover:bg-slate-50 cursor-pointer transition flex items-start gap-3 ${
                      !n.lida ? "bg-blue-50/40" : ""
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        !n.lida ? "bg-blue-600 ring-4 ring-blue-100" : "bg-transparent"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800">
                        {n.titulo}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed break-words">
                        {n.mensagem}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
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

            <div className="px-4 py-2 border-t border-slate-100 text-center">
              <Link
                href={notificacoesHref}
                onClick={() => setIsOpen(false)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
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
