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
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    email: "",
    whatsapp: "",
    avatarUrl: "",
    senha: "",
  });

  const loadAdminUser = async () => {
    try {
      setLoading(true);
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
          setLoadError(false);
        } else {
          setLoadError(true);
        }
      } else {
        setLoadError(true);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do admin:", err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
    if (loadError) return;
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
          {loadError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2 font-medium">
                <svg className="w-5 h-5 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p>
                  Falha ao carregar dados do administrador. A gravação foi bloqueada para proteger o cadastro.
                </p>
              </div>
              <button
                type="button"
                onClick={loadAdminUser}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition shrink-0 cursor-pointer"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {message && (
            <div
              className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-3 ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              <span>{message.type === "success" ? "✓" : "!"}</span>
              <span>{message.text}</span>
            </div>
          )}

          <Card className="border-[#E4E7EC] shadow-xs">
            <CardHeader className="bg-[#F7F8FA]">
              <h3 className="font-bold text-[#0E1F66] font-heading">
                Perfil do Administrador & Credenciais de Acesso
              </h3>
              <p className="text-xs text-[#9AA3AF]">
                Altere sua foto de perfil, dados de contato e senha de acesso ao painel
              </p>
            </CardHeader>
            <CardBody className="space-y-6">
              {/* Foto de Perfil */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#344054] mb-2">
                  Foto de Perfil do Usuário
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC]">
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
                    <p className="text-xs font-bold text-[#0E1F66]">
                      {form.avatarUrl ? "Foto atual configurada" : "Nenhuma foto de perfil adicionada"}
                    </p>
                    <p className="text-[11px] text-[#9AA3AF]">
                      Recomendado: imagem quadrada (JPG, PNG ou WebP até 5MB)
                    </p>
                    <div className="flex items-center gap-2 justify-center sm:justify-start pt-1">
                      <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#4F93C9] hover:bg-[#3D82B5] text-white font-bold text-xs shadow-xs transition cursor-pointer">
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
                          className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-semibold text-xs transition cursor-pointer"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Campos de Acesso */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E4E7EC]">
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

              <div className="pt-4 border-t border-[#E4E7EC] flex justify-end">
                <Button
                  variant="gradient"
                  size="lg"
                  loading={saving}
                  disabled={loading || saving || loadError}
                  type="submit"
                >
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
