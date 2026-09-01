"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import type { NotificationItem } from "@/components/notifications/NotificationBell";

export default function PontoNotificacoesPage() {
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
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const pontoId = user?.pontoMidia?.id;

  return (
    <DashboardLayout
      role="PONTO"
      userName={user?.nome || "Dono do Ponto"}
      userEmail={user?.email || ""}
      pontoId={pontoId}
      title="Central de Notificações"
      description="Histórico de avisos sobre novos anúncios na sua TV e atualizações do sistema"
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
          <h3 className="font-bold text-slate-900">Mensagens Recebidas</h3>
        </CardHeader>
        <CardBody className="p-0">
          {notifications.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="Nenhum aviso no momento"
                description="Você receberá notificações sempre que um novo anúncio for aprovado para passar na sua TV."
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-5 flex items-start gap-4 transition ${
                    !n.lida ? "bg-purple-50/50" : "hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${
                      !n.lida ? "bg-purple-600 ring-4 ring-purple-100" : "bg-slate-300"
                    }`}
                  />
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-900">{n.titulo}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.mensagem}</p>
                    <p className="text-[10px] text-slate-400 mt-2">
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
