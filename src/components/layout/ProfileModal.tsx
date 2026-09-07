"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: "PONTO" | "ANUNCIANTE" | "ADMIN";
  userName: string;
  userEmail: string;
  userAvatar?: string | null;
}

type TabKey = "dados" | "empresa" | "fotos";

export function ProfileModal({
  isOpen,
  onClose,
  role,
  userName,
  userEmail,
  userAvatar,
}: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("dados");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Campos compartilhados
  const [form, setForm] = useState<Record<string, any>>({
    nome: "",
    email: "",
    senha: "",
    whatsapp: "",
    nomeEmpresa: "",
    responsavel: "",
    instagramSite: "",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    categoria: "",
    descricao: "",
    fotos: [] as string[],
    logoUrl: "",
    // Ponto-specific
    horarioAbertura: "08:00",
    horarioFechamento: "19:00",
  });

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setMessage(null);

    const endpoint =
      role === "PONTO"
        ? "/api/ponto/perfil"
        : role === "ANUNCIANTE"
        ? "/api/anunciante/perfil"
        : "/api/auth/me";

    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        if (role === "PONTO") {
          const { user, ponto } = data;
          setForm({
            nome: user?.nome || "",
            email: user?.email || "",
            senha: "",
            whatsapp: user?.whatsapp || ponto?.whatsapp || "",
            nomeEmpresa: ponto?.nomeEmpresa || "",
            responsavel: ponto?.responsavel || "",
            instagramSite: ponto?.instagramSite || "",
            cep: ponto?.cep || "",
            rua: ponto?.rua || "",
            numero: ponto?.numero || "",
            complemento: ponto?.complemento || "",
            bairro: ponto?.bairro || "",
            cidade: ponto?.cidade || "",
            uf: ponto?.uf || "",
            categoria: ponto?.categoria || "",
            descricao: ponto?.descricao || "",
            fotos: ponto?.fotos || [],
            logoUrl: "",
            horarioAbertura: ponto?.horarioAbertura || "08:00",
            horarioFechamento: ponto?.horarioFechamento || "19:00",
          });
        } else if (role === "ANUNCIANTE") {
          const { user, anunciante } = data;
          setForm({
            nome: user?.nome || "",
            email: user?.email || "",
            senha: "",
            whatsapp: user?.whatsapp || anunciante?.whatsapp || "",
            nomeEmpresa: anunciante?.nomeEmpresa || "",
            responsavel: anunciante?.responsavel || "",
            instagramSite: anunciante?.instagramSite || "",
            cep: anunciante?.cep || "",
            rua: anunciante?.rua || "",
            numero: anunciante?.numero || "",
            complemento: anunciante?.complemento || "",
            bairro: anunciante?.bairro || "",
            cidade: anunciante?.cidade || "",
            uf: anunciante?.uf || "",
            categoria: anunciante?.categoria || "",
            descricao: "",
            fotos: anunciante?.fotos || [],
            logoUrl: anunciante?.logoUrl || "",
            horarioAbertura: "08:00",
            horarioFechamento: "19:00",
          });
        } else {
          // Admin
          const user = data?.user;
          setForm({
            nome: user?.nome || "",
            email: user?.email || "",
            senha: "",
            whatsapp: user?.whatsapp || "",
            nomeEmpresa: "",
            responsavel: "",
            instagramSite: "",
            cep: "",
            rua: "",
            numero: "",
            complemento: "",
            bairro: "",
            cidade: "",
            uf: "",
            categoria: "",
            descricao: "",
            fotos: [],
            logoUrl: "",
            horarioAbertura: "08:00",
            horarioFechamento: "19:00",
          });
        }
      })
      .catch(() => {
        setMessage({ type: "error", text: "Erro ao carregar dados do perfil." });
      })
      .finally(() => setLoading(false));
  }, [isOpen, role]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    const endpoint =
      role === "PONTO"
        ? "/api/ponto/perfil"
        : role === "ANUNCIANTE"
        ? "/api/anunciante/perfil"
        : null;

    if (!endpoint) {
      setMessage({ type: "error", text: "Editar perfil admin n\u00e3o dispon\u00edvel nesta vers\u00e3o." });
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar.");

      setMessage({ type: "success", text: "Perfil atualizado com sucesso!" });
      setForm((prev: Record<string, any>) => ({ ...prev, senha: "" }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar perfil";
      setMessage({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFoto(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha no upload");

      setForm((prev: Record<string, any>) => ({
        ...prev,
        fotos: [...(prev.fotos || []), data.url],
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar imagem";
      setMessage({ type: "error", text: msg });
    } finally {
      setUploadingFoto(false);
      e.target.value = "";
    }
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha no upload");

      setForm((prev: Record<string, any>) => ({ ...prev, logoUrl: data.url }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar logotipo";
      setMessage({ type: "error", text: msg });
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const removeFoto = (index: number) => {
    setForm((prev: Record<string, any>) => ({
      ...prev,
      fotos: (prev.fotos || []).filter((_: string, i: number) => i !== index),
    }));
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  if (!isOpen) return null;

  const tabs: { key: TabKey; label: string; icon: string }[] =
    role === "ADMIN"
      ? [{ key: "dados", label: "Minha Conta", icon: "person" }]
      : [
          { key: "dados", label: "Dados Pessoais", icon: "person" },
          {
            key: "empresa",
            label: role === "PONTO" ? "Estabelecimento" : "Empresa",
            icon: "business",
          },
          { key: "fotos", label: "Fotos", icon: "photo" },
        ];

  const roleLabels = {
    PONTO: "Dono de TV",
    ANUNCIANTE: "Anunciante",
    ADMIN: "Administrador",
  };

  const roleBadgeClass = {
    PONTO: "bg-emerald-100 text-emerald-700 border-emerald-200",
    ANUNCIANTE: "bg-blue-100 text-blue-700 border-blue-200",
    ADMIN: "bg-rose-100 text-rose-700 border-rose-200",
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-end p-0">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="relative z-10 w-full max-w-md h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-slide-in-right overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Meu Perfil</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Summary */}
          <div className="flex items-center gap-3">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="w-12 h-12 rounded-full object-cover border-2 border-blue-200 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm shrink-0">
                {userName.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 truncate">
                {form.nome || userName}
              </p>
              <p className="text-xs text-slate-500 truncate">{form.email || userEmail}</p>
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1",
                  roleBadgeClass[role]
                )}
              >
                {roleLabels[role]}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        {tabs.length > 1 && (
          <div className="flex border-b border-slate-100 px-6 shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setMessage(null);
                }}
                className={cn(
                  "flex-1 py-3 text-xs font-semibold transition border-b-2 cursor-pointer",
                  activeTab === tab.key
                    ? "text-blue-600 border-blue-600"
                    : "text-slate-400 border-transparent hover:text-slate-600"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {message && (
                <div
                  className={cn(
                    "p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 mb-4",
                    message.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-red-50 text-red-800 border-red-200"
                  )}
                >
                  <span>{message.type === "success" ? "\u2713" : "!"}</span>
                  <span>{message.text}</span>
                </div>
              )}

              {/* Tab: Dados Pessoais */}
              {activeTab === "dados" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Nome do Respons\u00e1vel
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                      value={form.nome}
                      onChange={(e) =>
                        setForm((prev: Record<string, any>) => ({
                          ...prev,
                          nome: e.target.value,
                          responsavel: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      E-mail de Login
                    </label>
                    <input
                      type="email"
                      disabled
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                      value={form.email}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      WhatsApp
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                      value={form.whatsapp}
                      onChange={(e) =>
                        setForm((prev: Record<string, any>) => ({
                          ...prev,
                          whatsapp: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Nova Senha (deixe em branco para n\u00e3o alterar)
                    </label>
                    <input
                      type="password"
                      placeholder="M\u00ednimo 6 caracteres"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                      value={form.senha}
                      onChange={(e) =>
                        setForm((prev: Record<string, any>) => ({
                          ...prev,
                          senha: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              )}

              {/* Tab: Empresa / Estabelecimento */}
              {activeTab === "empresa" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      {role === "PONTO" ? "Nome do Estabelecimento" : "Nome da Empresa / Marca"}
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                      value={form.nomeEmpresa}
                      onChange={(e) =>
                        setForm((prev: Record<string, any>) => ({
                          ...prev,
                          nomeEmpresa: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Instagram ou Site
                    </label>
                    <input
                      type="text"
                      placeholder="@seuinstagram ou www.site.com"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                      value={form.instagramSite}
                      onChange={(e) =>
                        setForm((prev: Record<string, any>) => ({
                          ...prev,
                          instagramSite: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        CEP
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                        value={form.cep}
                        onChange={(e) =>
                          setForm((prev: Record<string, any>) => ({
                            ...prev,
                            cep: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Rua
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                        value={form.rua}
                        onChange={(e) =>
                          setForm((prev: Record<string, any>) => ({
                            ...prev,
                            rua: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        N\u00famero
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                        value={form.numero}
                        onChange={(e) =>
                          setForm((prev: Record<string, any>) => ({
                            ...prev,
                            numero: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Bairro
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                        value={form.bairro}
                        onChange={(e) =>
                          setForm((prev: Record<string, any>) => ({
                            ...prev,
                            bairro: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Cidade / UF
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                          value={form.cidade}
                          onChange={(e) =>
                            setForm((prev: Record<string, any>) => ({
                              ...prev,
                              cidade: e.target.value,
                            }))
                          }
                        />
                        <input
                          type="text"
                          maxLength={2}
                          className="w-14 rounded-xl border border-slate-200 px-2 py-2.5 text-sm text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                          value={form.uf}
                          onChange={(e) =>
                            setForm((prev: Record<string, any>) => ({
                              ...prev,
                              uf: e.target.value.toUpperCase(),
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {role === "PONTO" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                          Abertura
                        </label>
                        <input
                          type="time"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                          value={form.horarioAbertura}
                          onChange={(e) =>
                            setForm((prev: Record<string, any>) => ({
                              ...prev,
                              horarioAbertura: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                          Fechamento
                        </label>
                        <input
                          type="time"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                          value={form.horarioFechamento}
                          onChange={(e) =>
                            setForm((prev: Record<string, any>) => ({
                              ...prev,
                              horarioFechamento: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Fotos */}
              {activeTab === "fotos" && (
                <div className="space-y-5">
                  {/* Logotipo - apenas Anunciante */}
                  {role === "ANUNCIANTE" && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                        Logotipo da Marca
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                          {form.logoUrl ? (
                            <img
                              src={form.logoUrl}
                              alt="Logo"
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <span className="text-xl text-slate-400">
                              &#127970;
                            </span>
                          )}
                        </div>
                        <label className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer border border-slate-200">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleUploadLogo}
                            disabled={uploadingLogo}
                            className="hidden"
                          />
                          {uploadingLogo ? "Enviando..." : "Alterar Logotipo"}
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Fotos */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      {role === "PONTO"
                        ? "Fotos do Estabelecimento"
                        : "Fotos da Empresa"}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(form.fotos || []).map((foto: string, idx: number) => (
                        <div
                          key={idx}
                          className="relative group rounded-xl overflow-hidden aspect-video border border-slate-200 shadow-xs bg-slate-900"
                        >
                          <img
                            src={foto}
                            alt={`Foto ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeFoto(idx)}
                            className="absolute top-1.5 right-1.5 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition shadow-md cursor-pointer"
                          >
                            &#10005;
                          </button>
                        </div>
                      ))}

                      <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 transition cursor-pointer p-3 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadFoto}
                          disabled={uploadingFoto}
                          className="hidden"
                        />
                        {uploadingFoto ? (
                          <Spinner size="sm" />
                        ) : (
                          <>
                            <div className="text-xl mb-0.5">
                              &#128248;
                            </div>
                            <span className="text-[10px] font-bold text-blue-600">
                              Adicionar Foto
                            </span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 space-y-2">
          {role !== "ADMIN" && (
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Salvando..." : "Salvar Altera\u00e7\u00f5es"}
            </button>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition border border-rose-200 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sair da conta
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.25s ease-out;
        }
      `}</style>
    </div>,
    document.body
  );
}
