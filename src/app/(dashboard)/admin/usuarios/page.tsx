"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";

interface UserItem {
  id: number;
  nome: string;
  email: string;
  whatsapp: string;
  role: "ADMIN" | "PONTO" | "ANUNCIANTE";
  ativo: boolean;
  criadoEm: string;
  pontoMidia?: {
    id: number;
    nomeEmpresa: string;
    status: "PENDENTE" | "ATIVO" | "INATIVO";
    codigoTv?: string;
  };
  anunciante?: {
    id: number;
    nomeEmpresa: string;
    categoria: string;
  };
}

export default function AdminUsuariosPage() {
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [filterSearch, setFilterSearch] = useState<string>("");

  // Modal Notificar / Cobrança / Alerta
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [notifyForm, setNotifyForm] = useState({
    tipo: "ALERTA" as "GERAL" | "ALERTA" | "COBRANCA" | "SISTEMA",
    titulo: "",
    mensagem: "",
  });
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notifySuccessMessage, setNotifySuccessMessage] = useState("");

  const loadUsers = async () => {
    try {
      const [uRes, listRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/admin/usuarios"),
      ]);
      if (uRes.ok) setUser((await uRes.json()).user);
      if (listRes.ok) setUsers((await listRes.json()).users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleAtivo = async (u: UserItem) => {
    const nextState = !u.ativo;
    const confirmMsg = nextState
      ? `Deseja reativar o acesso de ${u.nome}?`
      : `Deseja realmente inativar o usuário ${u.nome}? Ele não conseguirá mais fazer login.`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id, ativo: nextState }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((item) => (item.id === u.id ? { ...item, ativo: nextState } : item))
        );
      }
    } catch (err) {
      console.error("Toggle user ativo error:", err);
    }
  };

  const handleOpenNotifyModal = (u: UserItem) => {
    setSelectedUser(u);
    setNotifyForm({
      tipo: "ALERTA",
      titulo: "",
      mensagem: "",
    });
    setNotifySuccessMessage("");
    setNotifyModalOpen(true);
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !notifyForm.titulo || !notifyForm.mensagem) return;

    setSendingNotification(true);
    setNotifySuccessMessage("");

    try {
      const res = await fetch("/api/admin/usuarios/notificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          tipo: notifyForm.tipo,
          titulo: notifyForm.titulo,
          mensagem: notifyForm.mensagem,
        }),
      });

      if (res.ok) {
        setNotifySuccessMessage("Notificação enviada com sucesso!");
        setTimeout(() => {
          setNotifyModalOpen(false);
          setNotifySuccessMessage("");
        }, 1500);
      }
    } catch (err) {
      console.error("Erro ao enviar notificacao:", err);
    } finally {
      setSendingNotification(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <Spinner size="lg" />
      </div>
    );
  }

  const filteredUsers = users.filter((u) => {
    const matchesRole = filterRole === "ALL" || u.role === filterRole;
    const matchesSearch =
      u.nome.toLowerCase().includes(filterSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(filterSearch.toLowerCase()) ||
      (u.pontoMidia?.nomeEmpresa || "").toLowerCase().includes(filterSearch.toLowerCase()) ||
      (u.anunciante?.nomeEmpresa || "").toLowerCase().includes(filterSearch.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <DashboardLayout
      role="ADMIN"
      userName={user?.nome || "Administrador"}
      userEmail={user?.email || ""}
      title="Gestão de Usuários & Contas"
      description="Gerencie acessos, ative/desative contas e envie notificações, alertas e cobranças"
    >
      <div className="space-y-6">
        {/* FILTROS E PESQUISA */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterRole("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterRole === "ALL"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Todos ({users.length})
            </button>
            <button
              onClick={() => setFilterRole("PONTO")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterRole === "PONTO"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Donos de TV ({users.filter((u) => u.role === "PONTO").length})
            </button>
            <button
              onClick={() => setFilterRole("ANUNCIANTE")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterRole === "ANUNCIANTE"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Anunciantes ({users.filter((u) => u.role === "ANUNCIANTE").length})
            </button>
          </div>

          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou empresa..."
            className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 shadow-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none w-full sm:w-72 transition"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />
        </div>

        {/* TABELA DE USUÁRIOS */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 font-heading">
                  Usuários Encontrados ({filteredUsers.length})
                </h3>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-200">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className={`p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition ${
                    !u.ativo ? "bg-red-50/40" : "hover:bg-slate-50/70"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{u.nome}</h4>
                      <Badge
                        variant={
                          u.role === "ADMIN"
                            ? "danger"
                            : u.role === "PONTO"
                            ? "success"
                            : "brand"
                        }
                      >
                        {u.role}
                      </Badge>

                      {/* Status da Conta */}
                      {u.ativo ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Conta Ativa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Inativo / Bloqueado
                        </span>
                      )}

                      {/* Status de Moderação do Ponto se for dono de TV */}
                      {u.pontoMidia?.status === "PENDENTE" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          ⏳ Ponto em Moderação
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mt-1">
                      E-mail: <strong className="text-slate-800">{u.email}</strong> • WhatsApp: {u.whatsapp}
                    </p>

                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>
                        Vinculado a:{" "}
                        <strong className="text-slate-700">
                          {u.pontoMidia?.nomeEmpresa || u.anunciante?.nomeEmpresa || "Acesso Administrativo"}
                        </strong>
                      </span>
                      {u.pontoMidia?.codigoTv && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-700 border border-slate-200">
                          Código TV: {u.pontoMidia.codigoTv}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Ações Administrativas */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenNotifyModal(u)}
                    >
                      ✉️ Notificar / Cobrar
                    </Button>

                    {u.role !== "ADMIN" && (
                      <Button
                        variant={u.ativo ? "danger" : "success"}
                        size="sm"
                        onClick={() => handleToggleAtivo(u)}
                      >
                        {u.ativo ? "Inativar" : "Reativar Conta"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* MODAL DE ENVIO DE NOTIFICAÇÕES, ALERTAS E COBRANÇAS */}
      <Modal
        isOpen={notifyModalOpen}
        onClose={() => setNotifyModalOpen(false)}
        title={`Enviar Mensagem para ${selectedUser?.nome || "Usuário"}`}
        description="Esta notificação será exibida instantaneamente no painel do usuário"
      >
        <form onSubmit={handleSendNotification} className="space-y-4">
          {notifySuccessMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
              {notifySuccessMessage}
            </div>
          )}

          <Select
            label="Tipo de Notificação"
            required
            options={[
              { value: "ALERTA", label: "⚠️ Alerta / Aviso Operacional" },
              { value: "COBRANCA", label: "💳 Cobrança / Financeiro" },
              { value: "SISTEMA", label: "⚙️ Mensagem do Sistema" },
              { value: "GERAL", label: "ℹ️ Informativo Geral" },
            ]}
            value={notifyForm.tipo}
            onChange={(e) =>
              setNotifyForm({ ...notifyForm, tipo: e.target.value as any })
            }
          />

          <Input
            label="Título do Alerta / Notificação"
            required
            placeholder="Ex: Fatura disponível, Atualização de anúncio, Aviso importante"
            value={notifyForm.titulo}
            onChange={(e) => setNotifyForm({ ...notifyForm, titulo: e.target.value })}
          />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Mensagem Detalhada
            </label>
            <textarea
              rows={4}
              required
              className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
              placeholder="Escreva a mensagem que o usuário visualizará na central de notificações..."
              value={notifyForm.mensagem}
              onChange={(e) => setNotifyForm({ ...notifyForm, mensagem: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setNotifyModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="gradient"
              loading={sendingNotification}
              disabled={!notifyForm.titulo || !notifyForm.mensagem}
            >
              Enviar Notificação 🚀
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
