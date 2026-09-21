"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import type { NotificationItem } from "@/components/notifications/NotificationBell";

export default function AnuncianteNotificacoesPage() {
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const [userRes, notifsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/notificacoes"),
      ]);
      if (userRes.ok) {
        const u = await userRes.json();
        setUser(u.user);
      }
      if (notifsRes.ok) {
        const n = await notifsRes.json();
        setNotifications(n.notificacoes || []);
      }
    } catch (err) {
      console.error("Notifs error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notificacoes?action=marcar-todas", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <DashboardLayout
      role="ANUNCIANTE"
      userName={user?.nome || "Anunciante"}
      userEmail={user?.email || ""}
      title="Central de Notificações"
      description="Histórico de alertas e avisos de moderação das suas campanhas"
      actions={
        notifications.some((n) => !n.lida) && (
          <Button variant="secondary" size="sm" onClick={markAllRead}>
            Marcar todas como lidas
          </Button>
        )
      }
    >
      <Card>
        <CardHeader>
          <h3 className="font-bold text-[#0E1F66] font-heading">Mensagens Recentes</h3>
        </CardHeader>
        <CardBody className="p-0">
          {notifications.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="Tudo limpo por aqui!"
                description="Você receberá notificações assim que seus anúncios forem aprovados ou receberem atualizações."
              />
            </div>
          ) : (
            <div className="divide-y divide-[#E4E7EC]">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-5 flex items-start gap-4 transition ${
                    !n.lida ? "bg-[#4F93C9]/10" : "hover:bg-[#F7F8FA]"
                  }`}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                      !n.lida ? "bg-[#4F93C9] ring-4 ring-[#4F93C9]/25" : "bg-[#CBD5E1]"
                    }`}
                  />
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-[#0E1F66]">{n.titulo}</h4>
                    <p className="text-xs text-[#344054] mt-1 leading-relaxed">{n.mensagem}</p>
                    <p className="text-[10px] text-[#9AA3AF] mt-2">
                      {new Date(n.criadoEm).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </DashboardLayout>
  );
}
