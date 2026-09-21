"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface NotificationItem {
  id: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  criadoEm: string;
}

interface NotificationContextValue {
  unreadCount: number;
  notifications: NotificationItem[];
  loading: boolean;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchNotifications();

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/notificacoes/stream");

      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "update") {
            setUnreadCount(typeof data.naoLidas === "number" ? data.naoLidas : 0);
            if (Array.isArray(data.latest) && data.latest.length > 0) {
              setNotifications((prev) => {
                const map = new Map<number, NotificationItem>();
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

      eventSource.onerror = () => {
        // EventSource reconecta automaticamente
      };
    } catch {
      // ignore
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [fetchNotifications]);

  const markAsRead = async (id: number) => {
    const item = notifications.find((n) => n.id === id);
    // Se já estiver lida, não altera o contador
    if (!item || item.lida) return;

    // Atualização otimista
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const res = await fetch(`/api/notificacoes/${id}/ler`, { method: "PATCH" });
      if (!res.ok) {
        // Reverter em caso de falha no backend
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, lida: false } : n))
        );
        setUnreadCount((prev) => prev + 1);
      }
    } catch {
      // Reverter em caso de erro de rede
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lida: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
    }
  };

  const markAllAsRead = async () => {
    const prevNotifications = [...notifications];
    const prevUnreadCount = unreadCount;

    setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })));
    setUnreadCount(0);

    try {
      const res = await fetch("/api/notificacoes?action=marcar-todas", { method: "PATCH" });
      if (!res.ok) {
        // Reverter em caso de falha
        setNotifications(prevNotifications);
        setUnreadCount(prevUnreadCount);
      }
    } catch {
      setNotifications(prevNotifications);
      setUnreadCount(prevUnreadCount);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        loading,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications deve ser usado dentro de um NotificationProvider");
  }
  return context;
}
