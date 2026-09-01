"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import {
  CATEGORIAS_ANUNCIANTE,
  CATEGORIAS_ESTABELECIMENTO,
  FAIXAS_ETARIAS,
  GENEROS,
} from "@/lib/options";
import { formatCep, formatPhone, buscarCep } from "@/lib/utils";

export default function CadastroAnunciantePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    oQueAnunciar: "",
    descricaoAnuncio: "",
    preferenciaLocalizacao: "Mesma cidade",
    distanciaMaxima: "10 km",
    bairrosEspecificos: "",
    categoriasEspecificas: [] as string[],
    faixaEtariaAlvo: [] as string[],
    generoAlvo: "Misto (equilibrado)",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Criar usuário
      const regRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          senha: form.senha,
          nome: form.nome,
          whatsapp: form.whatsapp,
          role: "ANUNCIANTE",
        }),
      });

      const regData = await regRes.json();
      if (!regRes.ok) {
        throw new Error(regData.error || "Falha ao criar conta");
      }

      // 2. Criar perfil de anunciante
      const anuRes = await fetch("/api/anunciantes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeEmpresa: form.nomeEmpresa,
          responsavel: form.responsavel || form.nome,
          whatsapp: form.whatsapp,
          instagramSite: form.instagramSite || undefined,
          cep: form.cep.replace(/\D/g, ""),
          rua: form.rua,
          numero: form.numero,
          complemento: form.complemento || undefined,
          bairro: form.bairro,
          cidade: form.cidade,
          uf: form.uf.toUpperCase(),
          categoria: form.categoria,
          oQueAnunciar: form.oQueAnunciar,
          descricaoAnuncio: form.descricaoAnuncio,
          preferenciaLocalizacao: form.preferenciaLocalizacao,
          distanciaMaxima: form.distanciaMaxima,
          bairrosEspecificos: form.bairrosEspecificos || undefined,
          categoriasEspecificas: form.categoriasEspecificas,
          faixaEtariaAlvo: form.faixaEtariaAlvo,
          generoAlvo: form.generoAlvo,
        }),
      });

      const anuData = await anuRes.json();
      if (!anuRes.ok) {
        throw new Error(anuData.error || "Falha ao cadastrar perfil de anunciante");
      }

      window.location.href = "/anunciante/dashboard";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao processar cadastro";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex justify-center transition-opacity hover:opacity-80">
            <Logo className="h-8 w-auto" />
          </Link>
          <h2 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-heading">
            Cadastre-se como Anunciante
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Anuncie seus produtos e serviços em telas de alta atenção na sua região
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm shadow-slate-900/5 border border-slate-200/80">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700 flex flex-col gap-1">
                <span>{error}</span>
                {error.includes("Email ja cadastrado") && (
                  <Link
                    href="/login"
                    className="text-blue-700 font-bold underline hover:text-blue-900 mt-1"
                  >
                    Clique aqui para fazer login com este e-mail →
                  </Link>
                )}
              </div>
            )}

            {/* Acesso */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">1</span>
                Dados de Acesso
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Seu Nome Completo"
                  required
                  value={form.nome}
                  onChange={(e) =>
                    setForm({ ...form, nome: e.target.value, responsavel: e.target.value })
                  }
                />
                <Input
                  label="WhatsApp"
                  required
                  placeholder="(00) 00000-0000"
                  value={form.whatsapp}
                  onChange={(e) =>
                    setForm({ ...form, whatsapp: formatPhone(e.target.value) })
                  }
                />
                <Input
                  label="E-mail de Login"
                  type="email"
                  required
                  placeholder="seu@negocio.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <Input
                  label="Senha"
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Empresa */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">2</span>
                Informações da sua Empresa
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Nome da Empresa / Marca"
                    required
                    value={form.nomeEmpresa}
                    onChange={(e) =>
                      setForm({ ...form, nomeEmpresa: e.target.value })
                    }
                  />
                  <Select
                    label="Ramo de Atuação"
                    required
                    placeholder="Selecione seu ramo..."
                    options={CATEGORIAS_ANUNCIANTE.map((c) => ({
                      value: c,
                      label: c,
                    }))}
                    value={form.categoria}
                    onChange={(e) =>
                      setForm({ ...form, categoria: e.target.value })
                    }
                  />
                </div>

                <Input
                  label="Instagram ou Site"
                  placeholder="@suaempresa ou www.suaempresa.com"
                  value={form.instagramSite}
                  onChange={(e) =>
                    setForm({ ...form, instagramSite: e.target.value })
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="CEP"
                    required
                    placeholder="00000-000"
                    value={form.cep}
                    onChange={(e) =>
                      setForm({ ...form, cep: formatCep(e.target.value) })
                    }
                    onBlur={handleCepBlur}
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label="Rua / Logradouro"
                      required
                      value={form.rua}
                      onChange={(e) =>
                        setForm({ ...form, rua: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Input
                    label="Número"
                    required
                    value={form.numero}
                    onChange={(e) =>
                      setForm({ ...form, numero: e.target.value })
                    }
                  />
                  <Input
                    label="Complemento"
                    value={form.complemento}
                    onChange={(e) =>
                      setForm({ ...form, complemento: e.target.value })
                    }
                  />
                  <Input
                    label="Bairro"
                    required
                    value={form.bairro}
                    onChange={(e) =>
                      setForm({ ...form, bairro: e.target.value })
                    }
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Cidade"
                      required
                      value={form.cidade}
                      onChange={(e) =>
                        setForm({ ...form, cidade: e.target.value })
                      }
                    />
                    <Input
                      label="UF"
                      required
                      maxLength={2}
                      value={form.uf}
                      onChange={(e) =>
                        setForm({ ...form, uf: e.target.value.toUpperCase() })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* O que pretende anunciar */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">3</span>
                Objetivos de Divulgação
              </h3>
              <div className="space-y-4">
                <Input
                  label="O que deseja anunciar?"
                  required
                  placeholder="Ex: Promoções semanais, novos serviços, fortalecimento de marca"
                  value={form.oQueAnunciar}
                  onChange={(e) =>
                    setForm({ ...form, oQueAnunciar: e.target.value })
                  }
                />

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Descrição da Campanha / Oferta
                  </label>
                  <textarea
                    rows={3}
                    required
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                    placeholder="Explique o que gostaria de comunicar nas telas..."
                    value={form.descricaoAnuncio}
                    onChange={(e) =>
                      setForm({ ...form, descricaoAnuncio: e.target.value })
                    }
                  />
                </div>

                <Select
                  label="Gênero Alvo Predominante"
                  options={GENEROS.map((g) => ({ value: g, label: g }))}
                  value={form.generoAlvo}
                  onChange={(e) =>
                    setForm({ ...form, generoAlvo: e.target.value })
                  }
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
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              variant="gradient"
              className="w-full mt-6"
              loading={loading}
            >
              Criar Conta de Anunciante
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Já possui uma conta?{" "}
            <Link href="/login" className="text-blue-600 font-semibold hover:underline">
              Fazer login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
