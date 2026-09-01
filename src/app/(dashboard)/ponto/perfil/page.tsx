"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
  CATEGORIAS_ESTABELECIMENTO,
  FLUXO_DIARIO,
  TEMPO_PERMANENCIA,
  LOCAIS_INSTALACAO,
  FAIXAS_ETARIAS,
  GENEROS,
} from "@/lib/options";
import { formatCep, formatPhone, buscarCep } from "@/lib/utils";

export default function PontoPerfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
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
    possuiTv: true,
    quantidadeTvs: 1,
    localInstalacao: "",
    fluxoDiarioEstimado: "",
    tempoPermanencia: "",
    faixaEtariaPublico: [] as string[],
    generoPublico: "",
    horariosPico: "",
    fotos: [] as string[],
  });

  useEffect(() => {
    async function loadPerfil() {
      try {
        const res = await fetch("/api/ponto/perfil");
        if (res.ok) {
          const data = await res.json();
          const { user, ponto } = data;
          setForm({
            nome: user.nome || "",
            email: user.email || "",
            senha: "",
            whatsapp: formatPhone(user.whatsapp || ponto.whatsapp || ""),
            nomeEmpresa: ponto.nomeEmpresa || "",
            responsavel: ponto.responsavel || "",
            instagramSite: ponto.instagramSite || "",
            cep: formatCep(ponto.cep || ""),
            rua: ponto.rua || "",
            numero: ponto.numero || "",
            complemento: ponto.complemento || "",
            bairro: ponto.bairro || "",
            cidade: ponto.cidade || "",
            uf: ponto.uf || "",
            categoria: ponto.categoria || "",
            descricao: ponto.descricao || "",
            possuiTv: ponto.possuiTv ?? true,
            quantidadeTvs: ponto.quantidadeTvs || 1,
            localInstalacao: ponto.localInstalacao || "",
            fluxoDiarioEstimado: ponto.fluxoDiarioEstimado || "",
            tempoPermanencia: ponto.tempoPermanencia || "",
            faixaEtariaPublico: ponto.faixaEtariaPublico || [],
            generoPublico: ponto.generoPublico || "",
            horariosPico: ponto.horariosPico || "",
            fotos: ponto.fotos || [],
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

  const toggleFaixaEtaria = (faixa: string) => {
    setForm((prev) => {
      const exists = prev.faixaEtariaPublico.includes(faixa);
      return {
        ...prev,
        faixaEtariaPublico: exists
          ? prev.faixaEtariaPublico.filter((f) => f !== faixa)
          : [...prev.faixaEtariaPublico, faixa],
      };
    });
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
      const msg = err instanceof Error ? err.message : "Erro ao enviar imagem";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/ponto/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar dados.");
      }

      setMessage({ type: "success", text: "Perfil e dados do estabelecimento atualizados com sucesso!" });
      setForm((prev) => ({ ...prev, senha: "" }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar perfil";
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
      role="PONTO"
      userName={form.nome || "Dono da TV"}
      userEmail={form.email}
      title="Meu Perfil & Estabelecimento"
      description="Edite os dados da sua empresa, perfil de audiência e adicione fotos do espaço"
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

          {/* Fotos do Estabelecimento */}
          <Card>
            <CardHeader>
              <h3 className="font-bold text-slate-900 font-heading">
                Fotos do Estabelecimento & Posicionamento da TV
              </h3>
              <p className="text-xs text-slate-500">
                Adicione fotos do seu espaço, fachada e da TV instalada para que anunciantes vejam a qualidade do ponto.
              </p>
            </CardHeader>
            <CardBody className="space-y-4">
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

                {/* Upload Button */}
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
            </CardBody>
          </Card>

          {/* Dados de Acesso */}
          <Card>
            <CardHeader>
              <h3 className="font-bold text-slate-900 font-heading">Dados de Acesso</h3>
              <p className="text-xs text-slate-500">Credenciais e contatos do responsável</p>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nome do Responsável"
                  required
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value, responsavel: e.target.value })}
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
                />
                <Input
                  label="Nova Senha (deixe em branco se não quiser alterar)"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                />
              </div>
            </CardBody>
          </Card>

          {/* Dados do Estabelecimento */}
          <Card>
            <CardHeader>
              <h3 className="font-bold text-slate-900 font-heading">Informações da Empresa & Endereço</h3>
              <p className="text-xs text-slate-500">Dados do ponto comercial e localização no mapa</p>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nome da Empresa / Espaço"
                  required
                  value={form.nomeEmpresa}
                  onChange={(e) => setForm({ ...form, nomeEmpresa: e.target.value })}
                />
                <Select
                  label="Categoria"
                  required
                  options={CATEGORIAS_ESTABELECIMENTO.map((c) => ({ value: c, label: c }))}
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                />
              </div>

              <Input
                label="Instagram ou Site"
                placeholder="@seuinstagram ou www.site.com"
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

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Descrição do Espaço
                </label>
                <textarea
                  rows={3}
                  required
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                />
              </div>
            </CardBody>
          </Card>

          {/* Perfil de Audiência e TVs */}
          <Card>
            <CardHeader>
              <h3 className="font-bold text-slate-900 font-heading">Estrutura de TVs e Perfil de Audiência</h3>
              <p className="text-xs text-slate-500">Métricas de público para atrair os anunciantes certos</p>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Quantidade de TVs"
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={form.quantidadeTvs}
                  onChange={(e) => setForm({ ...form, quantidadeTvs: Number(e.target.value) })}
                />
                <Select
                  label="Local de Instalação"
                  options={LOCAIS_INSTALACAO.map((l) => ({ value: l, label: l }))}
                  value={form.localInstalacao}
                  onChange={(e) => setForm({ ...form, localInstalacao: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Fluxo Diário Estimado"
                  options={FLUXO_DIARIO.map((f) => ({ value: f, label: f }))}
                  value={form.fluxoDiarioEstimado}
                  onChange={(e) => setForm({ ...form, fluxoDiarioEstimado: e.target.value })}
                />
                <Select
                  label="Tempo Médio de Permanência"
                  options={TEMPO_PERMANENCIA.map((t) => ({ value: t, label: t }))}
                  value={form.tempoPermanencia}
                  onChange={(e) => setForm({ ...form, tempoPermanencia: e.target.value })}
                />
              </div>

              <Select
                label="Predominância de Gênero"
                options={GENEROS.map((g) => ({ value: g, label: g }))}
                value={form.generoPublico}
                onChange={(e) => setForm({ ...form, generoPublico: e.target.value })}
              />

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Faixa Etária Predominante
                </label>
                <div className="flex flex-wrap gap-2">
                  {FAIXAS_ETARIAS.map((faixa) => {
                    const selected = form.faixaEtariaPublico.includes(faixa);
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
