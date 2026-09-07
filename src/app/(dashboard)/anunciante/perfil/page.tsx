"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
  CATEGORIAS_ANUNCIANTE,
  CATEGORIAS_ESTABELECIMENTO,
  FAIXAS_ETARIAS,
  GENEROS,
} from "@/lib/options";
import { formatCep, formatPhone, buscarCep } from "@/lib/utils";

export default function AnunciantePerfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    whatsapp: "",
    avatarUrl: "",
    nomeEmpresa: "",
    responsavel: "",
    instagramSite: "",
    logoUrl: "",
    fotos: [] as string[],
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    categoria: "",
    oQueAnunciar: "",
    descricaoAnuncio: "",
    preferenciaLocalizacao: "Mesma cidade",
    distanciaMaxima: "10 km",
    bairrosEspecificos: "",
    categoriasEspecificas: [] as string[],
    faixaEtariaAlvo: [] as string[],
    generoAlvo: "Misto (equilibrado)",
  });

  useEffect(() => {
    async function loadPerfil() {
      try {
        const res = await fetch("/api/anunciante/perfil");
        if (res.ok) {
          const data = await res.json();
          const { user, anunciante } = data;
          setForm({
            nome: user.nome || "",
            email: user.email || "",
            senha: "",
            whatsapp: formatPhone(user.whatsapp || anunciante.whatsapp || ""),
            avatarUrl: user.avatarUrl || "",
            nomeEmpresa: anunciante.nomeEmpresa || "",
            responsavel: anunciante.responsavel || "",
            instagramSite: anunciante.instagramSite || "",
            logoUrl: anunciante.logoUrl || "",
            fotos: anunciante.fotos || [],
            cep: formatCep(anunciante.cep || ""),
            rua: anunciante.rua || "",
            numero: anunciante.numero || "",
            complemento: anunciante.complemento || "",
            bairro: anunciante.bairro || "",
            cidade: anunciante.cidade || "",
            uf: anunciante.uf || "",
            categoria: anunciante.categoria || "",
            oQueAnunciar: anunciante.oQueAnunciar || "",
            descricaoAnuncio: anunciante.descricaoAnuncio || "",
            preferenciaLocalizacao: anunciante.preferenciaLocalizacao || "Mesma cidade",
            distanciaMaxima: anunciante.distanciaMaxima || "10 km",
            bairrosEspecificos: anunciante.bairrosEspecificos || "",
            categoriasEspecificas: anunciante.categoriasEspecificas || [],
            faixaEtariaAlvo: anunciante.faixaEtariaAlvo || [],
            generoAlvo: anunciante.generoAlvo || "Misto (equilibrado)",
          });
        }
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPerfil();
  }, []);

  const handleCepBlur = async () => {
    if (form.cep.replace(/\D/g, "").length === 8) {
      const res = await buscarCep(form.cep);
      if (res && !res.erro) {
        setForm((prev) => ({
          ...prev,
          rua: res.logradouro || prev.rua,
          bairro: res.bairro || prev.bairro,
          cidade: res.localidade || prev.cidade,
          uf: res.uf || prev.uf,
        }));
      }
    }
  };

  const toggleCategoria = (cat: string) => {
    setForm((prev) => {
      const exists = prev.categoriasEspecificas.includes(cat);
      return {
        ...prev,
        categoriasEspecificas: exists
          ? prev.categoriasEspecificas.filter((c) => c !== cat)
          : [...prev.categoriasEspecificas, cat],
      };
    });
  };

  const toggleFaixaEtaria = (faixa: string) => {
    setForm((prev) => {
      const exists = prev.faixaEtariaAlvo.includes(faixa);
      return {
        ...prev,
        faixaEtariaAlvo: exists
          ? prev.faixaEtariaAlvo.filter((f) => f !== faixa)
          : [...prev.faixaEtariaAlvo, faixa],
      };
    });
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
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

      setForm((prev) => ({ ...prev, logoUrl: data.url }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro no upload do logotipo";
      setMessage({ type: "error", text: msg });
    } finally {
      setUploadingLogo(false);
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
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha no upload");

      setForm((prev) => ({
        ...prev,
        fotos: [...prev.fotos, data.url],
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro no upload da imagem";
      setMessage({ type: "error", text: msg });
    } finally {
      setUploadingFoto(false);
    }
  };

  const removeFoto = (index: number) => {
    setForm((prev) => ({
      ...prev,
      fotos: prev.fotos.filter((_, i) => i !== index),
    }));
  };

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
      const res = await fetch("/api/anunciante/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar perfil");
      }

      setMessage({ type: "success", text: "Perfil de anunciante atualizado com sucesso!" });
      setForm((prev) => ({ ...prev, senha: "" }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao atualizar perfil";
      setMessage({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
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
      userName={form.nome || "Anunciante"}
      userEmail={form.email}
      userAvatar={form.avatarUrl || null}
      title="Usuário & Anunciante"
      description="Gerencie seus dados de acesso, foto de perfil e informações da marca"
    >
      <div className="max-w-4xl">
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

          {/* Dados do Usuário & Foto de Perfil */}
          <Card className="border-blue-100 shadow-sm">
            <CardHeader className="bg-blue-50/40">
              <h3 className="font-bold text-slate-900 font-heading">
                Perfil do Usuário & Credenciais de Acesso
              </h3>
              <p className="text-xs text-slate-500">
                Altere sua foto de perfil, dados pessoais e senha de acesso à plataforma
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
                  label="Nome do Responsável"
                  required
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value, responsavel: e.target.value })}
                />
                <Input
                  label="WhatsApp"
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
            </CardBody>
          </Card>

          {/* Logotipo e Fotos da Empresa */}
          <Card>
            <CardHeader>
              <h3 className="font-bold text-slate-900 font-heading">
                Identidade Visual & Fotos da Marca
              </h3>
              <p className="text-xs text-slate-500">
                Logotipo e imagens institucionais da sua empresa
              </p>
            </CardHeader>
            <CardBody className="space-y-6">
              {/* Logotipo */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Logotipo da Marca
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <span className="text-2xl text-slate-400">🏢</span>
                    )}
                  </div>
                  <label className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer border border-slate-200">
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

              {/* Fotos da Empresa */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Fotos e Portfólio da Empresa
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {form.fotos.map((foto, idx) => (
                    <div key={idx} className="relative group rounded-2xl overflow-hidden aspect-video border border-slate-200 shadow-xs bg-slate-900">
                      <img src={foto} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFoto(idx)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition shadow-md cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <label className="flex flex-col items-center justify-center aspect-video rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 transition cursor-pointer p-4 text-center">
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
                        <div className="text-2xl mb-1">📸</div>
                        <span className="text-xs font-bold text-blue-600">Adicionar Foto</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG até 10MB</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Dados da Empresa */}
          <Card>
            <CardHeader>
              <h3 className="font-bold text-slate-900 font-heading">Informações da Empresa</h3>
              <p className="text-xs text-slate-500">Endereço e dados institucionais</p>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nome da Empresa / Marca"
                  required
                  value={form.nomeEmpresa}
                  onChange={(e) => setForm({ ...form, nomeEmpresa: e.target.value })}
                />
                <Select
                  label="Ramo de Atuação"
                  required
                  options={CATEGORIAS_ANUNCIANTE.map((c) => ({ value: c, label: c }))}
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                />
              </div>

              <Input
                label="Instagram ou Site"
                placeholder="@suaempresa ou www.suaempresa.com"
                value={form.instagramSite}
                onChange={(e) => setForm({ ...form, instagramSite: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="CEP"
                  required
                  value={form.cep}
                  onChange={(e) => setForm({ ...form, cep: formatCep(e.target.value) })}
                  onBlur={handleCepBlur}
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Rua / Logradouro"
                    required
                    value={form.rua}
                    onChange={(e) => setForm({ ...form, rua: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Input
                  label="Número"
                  required
                  value={form.numero}
                  onChange={(e) => setForm({ ...form, numero: e.target.value })}
                />
                <Input
                  label="Complemento"
                  value={form.complemento}
                  onChange={(e) => setForm({ ...form, complemento: e.target.value })}
                />
                <Input
                  label="Bairro"
                  required
                  value={form.bairro}
                  onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Cidade"
                    required
                    value={form.cidade}
                    onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                  />
                  <Input
                    label="UF"
                    required
                    maxLength={2}
                    value={form.uf}
                    onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Preferências de Divulgação */}
          <Card>
            <CardHeader>
              <h3 className="font-bold text-slate-900 font-heading">Objetivos de Divulgação</h3>
              <p className="text-xs text-slate-500">Definições para direcionamento de anúncios</p>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label="O que pretende anunciar?"
                value={form.oQueAnunciar}
                onChange={(e) => setForm({ ...form, oQueAnunciar: e.target.value })}
              />

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Descrição da Oferta / Campanha
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                  value={form.descricaoAnuncio}
                  onChange={(e) => setForm({ ...form, descricaoAnuncio: e.target.value })}
                />
              </div>

              <Select
                label="Gênero Alvo Predominante"
                options={GENEROS.map((g) => ({ value: g, label: g }))}
                value={form.generoAlvo}
                onChange={(e) => setForm({ ...form, generoAlvo: e.target.value })}
              />

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Tipos de Estabelecimentos de Interesse
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIAS_ESTABELECIMENTO.map((cat) => {
                    const selected = form.categoriasEspecificas.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => toggleCategoria(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                          selected
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Faixa Etária Alvo
                </label>
                <div className="flex flex-wrap gap-2">
                  {FAIXAS_ETARIAS.map((faixa) => {
                    const selected = form.faixaEtariaAlvo.includes(faixa);
                    return (
                      <button
                        type="button"
                        key={faixa}
                        onClick={() => toggleFaixaEtaria(faixa)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                          selected
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {faixa}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" variant="gradient" loading={saving}>
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
