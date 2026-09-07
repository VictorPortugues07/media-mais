"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";

interface NotificacaoItem {
  id: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  criadoEm: string;
  user?: {
    id: number;
    nome: string;
    email: string;
    role: "ADMIN" | "ANUNCIANTE" | "PONTO";
  };
}

function getTipoBadge(tipo: string) {
  switch (tipo) {
    case "ALERTA":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          Alerta / Remoção
        </span>
      );
    case "ANUNCIO_PENDENTE":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Moderação
        </span>
      );
    case "ANUNCIO_APROVADO":
      return <Badge variant="success">Aprovado</Badge>;
    case "ANUNCIO_REJEITADO":
      return <Badge variant="danger">Rejeitado</Badge>;
    case "SISTEMA":
      return <Badge variant="brand">Sistema</Badge>;
    default:
      return <Badge>{tipo}</Badge>;
  }
}

function getRoleBadge(role?: string) {
  switch (role) {
    case "ADMIN":
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-100">Admin</span>;
    case "ANUNCIANTE":
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">Anunciante</span>;
    case "PONTO":
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">TV / Ponto</span>;
    default:
      return null;
  }
}

export default function AdminNotificacoesPage() {
  const [user, setUser] = useState<any>(null);
  const [notificacoes, setNotificacoes] = useState<NotificacaoItem[]>([]);
  const [naoLidasCount, setNaoLidasCount] = useState(0);
  const [alertasCount, setAlertasCount] = useState(0);
  const [pendentesCount, setPendentesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [scope, setScope] = useState<"todas" | "minhas">("todas");
  const [filterTipo, setFilterTipo] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos"); // "todos" | "naoLidas" | "lidas"
  const [filterText, setFilterText] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchNotificacoes = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("scope", scope);
      if (filterTipo !== "todos") params.set("tipo", filterTipo);
      if (filterStatus === "naoLidas") params.set("lida", "false");
      if (filterStatus === "lidas") params.set("lida", "true");

      const [userRes, notifsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch(`/api/notificacoes?${params.toString()}`),
      ]);

      if (userRes.ok) {
        const u = await userRes.json();
        setUser(u.user);
      }

      if (notifsRes.ok) {
        const data = await notifsRes.json();
        setNotificacoes(data.notificacoes || []);
        setNaoLidasCount(data.naoLidas || 0);
        setAlertasCount(data.totalAlertas || 0);
        setPendentesCount(data.totalPendentes || 0);
      }
    } catch (err) {
      console.error("Erro ao carregar notificações:", err);
    } finally {
      setLoading(false);
    }
  }, [scope, filterTipo, filterStatus]);

  useEffect(() => {
    fetchNotificacoes();
  }, [fetchNotificacoes]);

  const handleMarkAsRead = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/notificacoes/${id}/ler`, { method: "PATCH" });
      if (res.ok) {
        setNotificacoes((prev) =>
          prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
        );
        setNaoLidasCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Erro ao marcar lida:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch(`/api/notificacoes?action=marcar-todas&scope=${scope}`, {
        method: "PATCH",
      });
      if (res.ok) {
        setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
        setNaoLidasCount(0);
      }
    } catch (err) {
      console.error("Erro ao marcar todas:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  const notificacoesFiltradas = notificacoes.filter((n) => {
    const text = filterText.toLowerCase();
    const matchText =
      n.titulo.toLowerCase().includes(text) ||
      n.mensagem.toLowerCase().includes(text) ||
      (n.user?.nome && n.user.nome.toLowerCase().includes(text)) ||
      (n.user?.email && n.user.email.toLowerCase().includes(text));
    return matchText;
  });

  return (
    <DashboardLayout
      role="ADMIN"
      userName={user?.nome || "Administrador"}
      userEmail={user?.email || ""}
      title="Central de Notificações"
      description="Supervisão completa de alertas, solicitações de remoção e avisos do sistema"
      actions={
        notificacoesFiltradas.some((n) => !n.lida) && (
          <Button variant="secondary" size="sm" onClick={handleMarkAllAsRead}>
            Marcar todas como lidas
          </Button>
        )
      }
    >
      <div className="space-y-6">

        {/* ── KPIs ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Listadas",
              value: notificacoes.length,
              sub: scope === "todas" ? "todas as contas da rede" : "alertas da sua conta",
              icon: "🔔",
              color: "text-blue-600",
              bg: "bg-blue-50",
              ring: "ring-blue-100",
            },
            {
              label: "Alertas & Remoções",
              value: alertasCount,
              sub: "pedidos de desvinculação",
              icon: "⚠️",
              color: "text-rose-600",
              bg: "bg-rose-50",
              ring: "ring-rose-100",
            },
            {
              label: "Não Lidas",
              value: naoLidasCount,
              sub: "mensagens pendentes de leitura",
              icon: "📬",
              color: "text-amber-600",
              bg: "bg-amber-50",
              ring: "ring-amber-100",
            },
            {
              label: "Moderação Pendente",
              value: pendentesCount,
              sub: "novos anúncios para aprovar",
              icon: "⏳",
              color: "text-indigo-600",
              bg: "bg-indigo-50",
              ring: "ring-indigo-100",
            },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardBody>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                    <p className={`text-3xl font-black font-heading mt-1.5 ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{kpi.sub}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 ${kpi.bg} ring-1 ${kpi.ring}`}>
                    {kpi.icon}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* ── Tabela e Filtros ────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 font-heading">
                    Histórico de Notificações
                    <span className="ml-2 text-sm font-normal text-slate-400">
                      ({notificacoesFiltradas.length})
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {scope === "todas" ? "Visualizando todas as notificações da plataforma" : "Visualizando apenas notificações enviadas à administração"}
                  </p>
                </div>

                {/* Alternador de Escopo */}
                <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-bold shrink-0">
                  <button
                    type="button"
                    onClick={() => setScope("todas")}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      scope === "todas"
                        ? "bg-white text-blue-700 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    🌐 Todas da Rede
                  </button>
                  <button
                    type="button"
                    onClick={() => setScope("minhas")}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      scope === "minhas"
                        ? "bg-white text-blue-700 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    👤 Minhas (Admin)
                  </button>
                </div>
              </div>

              {/* Barra de Filtros */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
                <select
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-400 transition cursor-pointer"
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value)}
                >
                  <option value="todos">Todos os tipos</option>
                  <option value="ALERTA">⚠️ Alertas / Solicitações de Remoção</option>
                  <option value="ANUNCIO_PENDENTE">⏳ Moderação Pendente</option>
                  <option value="ANUNCIO_APROVADO">✅ Anúncio Aprovado</option>
                  <option value="ANUNCIO_REJEITADO">❌ Anúncio Rejeitado</option>
                  <option value="SISTEMA">ℹ️ Sistema</option>
                  <option value="GERAL">📢 Geral</option>
                </select>

                <select
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-400 transition cursor-pointer"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="todos">Todos os status</option>
                  <option value="naoLidas">Não lidas</option>
                  <option value="lidas">Lidas</option>
                </select>

                <input
                  type="text"
                  placeholder="Buscar por texto, título ou usuário..."
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:border-blue-400 outline-none flex-1 min-w-[200px] transition"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>

          <CardBody className="p-0">
            {notificacoesFiltradas.length === 0 ? (
              <div className="p-10">
                <EmptyState
                  title="Nenhuma notificação encontrada"
                  description="Tente ajustar os filtros ou selecionar outro escopo de visualização."
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notificacoesFiltradas.map((notif) => {
                  const isRemovalRequest = notif.tipo === "ALERTA" || notif.titulo.toLowerCase().includes("remoção");

                  return (
                    <div
                      key={notif.id}
                      className={`p-5 flex flex-col sm:flex-row items-start gap-4 transition ${
                        !notif.lida ? "bg-blue-50/30" : "hover:bg-slate-50/60"
                      } ${isRemovalRequest ? "border-l-4 border-l-rose-500" : ""}`}
                    >
                      {/* Indicador de Status */}
                      <div className="pt-0.5 shrink-0">
                        <div
                          className={`w-3 h-3 rounded-full mt-1 ${
                            !notif.lida
                              ? isRemovalRequest
                                ? "bg-rose-500 ring-4 ring-rose-100 animate-pulse"
                                : "bg-blue-600 ring-4 ring-blue-100"
                              : "bg-slate-200"
                          }`}
                        />
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm">{notif.titulo}</h4>
                          {getTipoBadge(notif.tipo)}
                          {notif.user && (
                            <span className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                              <span>Para: <strong>{notif.user.nome}</strong></span>
                              {getRoleBadge(notif.user.role)}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed break-words">
                          {notif.mensagem}
                        </p>

                        <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                          <span>
                            {new Date(notif.criadoEm).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span>·</span>
                          <span>ID #{notif.id}</span>
                        </div>
                      </div>

                      {/* Ações Rápidas */}
                      <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0">
                        {isRemovalRequest && (
                          <Link href="/admin/dashboard">
                            <button className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5 border border-rose-200 cursor-pointer">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Auditoria & Exclusão
                            </button>
                          </Link>
                        )}

                        {notif.tipo === "ANUNCIO_PENDENTE" && (
                          <Link href="/admin/aprovacoes">
                            <button className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition flex items-center gap-1.5 border border-amber-200 cursor-pointer">
                              Moderar Peça
                            </button>
                          </Link>
                        )}

                        {!notif.lida && (
                          <button
                            type="button"
                            title="Marcar como lida"
                            disabled={actionLoading === notif.id}
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer text-xs font-semibold"
                          >
                            ✓ Marcar lida
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}
