"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { formatPhone } from "@/lib/utils";

export default function AdminPerfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    nome: "",
    email: "",
    whatsapp: "",
    avatarUrl: "",
    senha: "",
  });

  useEffect(() => {
    async function loadAdminUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setForm({
              nome: data.user.nome || "",
              email: data.user.email || "",
              whatsapp: formatPhone(data.user.whatsapp || ""),
              avatarUrl: data.user.avatarUrl || "",
              senha: "",
            });
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados do admin:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAdminUser();
  }, []);

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha no upload");

      setForm((prev) => ({
        ...prev,
        avatarUrl: data.url,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar imagem";
      setMessage({ type: "error", text: msg });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = () => {
    setForm((prev) => ({ ...prev, avatarUrl: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          whatsapp: form.whatsapp,
          avatarUrl: form.avatarUrl || null,
          senha: form.senha ? form.senha : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar perfil");
      }

      setMessage({ type: "success", text: "Credenciais de administrador atualizadas com sucesso!" });
      setForm((prev) => ({ ...prev, senha: "" }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao atualizar dados";
      setMessage({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <DashboardLayout
      role="ADMIN"
      userName={form.nome || "Administrador"}
      userEmail={form.email}
      userAvatar={form.avatarUrl || null}
      title="Usuário & Acesso"
      description="Gerencie seus dados de acesso, foto de perfil e credenciais administrativas"
    >
      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {message && (
            <div
              className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-3 ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}
            >
              <span>{message.type === "success" ? "✓" : "!"}</span>
              <span>{message.text}</span>
            </div>
          )}

          <Card className="border-blue-100 shadow-sm">
            <CardHeader className="bg-blue-50/40">
              <h3 className="font-bold text-slate-900 font-heading">
                Perfil do Administrador & Credenciais de Acesso
              </h3>
              <p className="text-xs text-slate-500">
                Altere sua foto de perfil, dados de contato e senha de acesso ao painel
              </p>
            </CardHeader>
            <CardBody className="space-y-6">
              {/* Foto de Perfil */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Foto de Perfil do Usuário
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="relative">
                    {form.avatarUrl ? (
                      <img
                        src={form.avatarUrl}
                        alt="Foto de Perfil"
                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center border-2 border-dashed border-slate-300">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <p className="text-xs font-bold text-slate-800">
                      {form.avatarUrl ? "Foto atual configurada" : "Nenhuma foto de perfil adicionada"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Recomendado: imagem quadrada (JPG, PNG ou WebP até 5MB)
                    </p>
                    <div className="flex items-center gap-2 justify-center sm:justify-start pt-1">
                      <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadAvatar}
                          disabled={uploadingAvatar}
                          className="hidden"
                        />
                        {uploadingAvatar ? (
                          <Spinner size="sm" />
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span>{form.avatarUrl ? "Trocar Foto" : "Enviar Foto de Perfil"}</span>
                          </>
                        )}
                      </label>

                      {form.avatarUrl && (
                        <button
                          type="button"
                          onClick={removeAvatar}
                          className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-red-50 hover:text-red-700 text-slate-700 font-semibold text-xs transition cursor-pointer"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Campos de Acesso */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <Input
                  label="Nome Completo"
                  required
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
                <Input
                  label="WhatsApp de Contato"
                  required
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: formatPhone(e.target.value) })}
                />
                <Input
                  label="E-mail de Login"
                  type="email"
                  disabled
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  helperText="O e-mail de acesso não pode ser alterado diretamente."
                />
                <Input
                  label="Nova Senha (deixe em branco para não alterar)"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button variant="gradient" size="lg" loading={saving} type="submit">
                  Salvar Alterações
                </Button>
              </div>
            </CardBody>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
