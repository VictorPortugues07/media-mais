"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import {
  CATEGORIAS_ESTABELECIMENTO,
  FLUXO_DIARIO,
  TEMPO_PERMANENCIA,
  LOCAIS_INSTALACAO,
  FAIXAS_ETARIAS,
  GENEROS,
} from "@/lib/options";
import { formatCep, formatPhone, buscarCep } from "@/lib/utils";

export default function CadastroPontoPage() {
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
    descricao: "",
    possuiTv: true,
    quantidadeTvs: 1,
    localInstalacao: "",
    fluxoDiarioEstimado: "",
    tempoPermanencia: "",
    faixaEtariaPublico: [] as string[],
    generoPublico: "",
    horariosPico: "",
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
          role: "PONTO",
        }),
      });

      const regData = await regRes.json();
      if (!regRes.ok) {
        throw new Error(regData.error || "Falha ao criar conta");
      }

      // 2. Criar ponto de mídia
      const pontoRes = await fetch("/api/pontos", {
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
          descricao: form.descricao,
          possuiTv: form.possuiTv,
          quantidadeTvs: Number(form.quantidadeTvs),
          localInstalacao: form.localInstalacao,
          fluxoDiarioEstimado: form.fluxoDiarioEstimado,
          tempoPermanencia: form.tempoPermanencia,
          faixaEtariaPublico: form.faixaEtariaPublico,
          generoPublico: form.generoPublico,
          horariosPico: form.horariosPico || undefined,
        }),
      });

      const pontoData = await pontoRes.json();
      if (!pontoRes.ok) {
        throw new Error(pontoData.error || "Falha ao cadastrar ponto de TV");
      }

      window.location.href = "/ponto/dashboard";
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
            Cadastre seu Estabelecimento com TV
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Conecte sua tela à rede e receba anúncios automaticamente
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm shadow-slate-900/5 border border-slate-200/80">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            {/* Dados de Acesso */}
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
                  placeholder="seu@email.com"
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

            {/* Dados do Estabelecimento */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">2</span>
                Informações do Estabelecimento
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Nome da Empresa / Espaço"
                    required
                    placeholder="Ex: Academia Fit Life"
                    value={form.nomeEmpresa}
                    onChange={(e) =>
                      setForm({ ...form, nomeEmpresa: e.target.value })
                    }
                  />
                  <Select
                    label="Categoria"
                    required
                    placeholder="Selecione o ramo..."
                    options={CATEGORIAS_ESTABELECIMENTO.map((c) => ({
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
                  placeholder="@seuinstagram ou www.site.com"
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

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Descrição do Espaço
                  </label>
                  <textarea
                    rows={3}
                    required
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                    placeholder="Descreva o perfil do seu público, ambiente, visibilidade da TV..."
                    value={form.descricao}
                    onChange={(e) =>
                      setForm({ ...form, descricao: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* TVs e Audiência */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">3</span>
                TVs e Perfil de Audiência
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Quantidade de TVs"
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={form.quantidadeTvs}
                    onChange={(e) =>
                      setForm({ ...form, quantidadeTvs: Number(e.target.value) })
                    }
                  />
                  <Select
                    label="Local de Instalação"
                    required
                    placeholder="Onde fica a tela?"
                    options={LOCAIS_INSTALACAO.map((l) => ({
                      value: l,
                      label: l,
                    }))}
                    value={form.localInstalacao}
                    onChange={(e) =>
                      setForm({ ...form, localInstalacao: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Fluxo Diário Estimado"
                    required
                    placeholder="Pessoas por dia"
                    options={FLUXO_DIARIO.map((f) => ({
                      value: f,
                      label: f,
                    }))}
                    value={form.fluxoDiarioEstimado}
                    onChange={(e) =>
                      setForm({ ...form, fluxoDiarioEstimado: e.target.value })
                    }
                  />
                  <Select
                    label="Tempo Médio de Permanência"
                    required
                    placeholder="Quanto tempo ficam?"
                    options={TEMPO_PERMANENCIA.map((t) => ({
                      value: t,
                      label: t,
                    }))}
                    value={form.tempoPermanencia}
                    onChange={(e) =>
                      setForm({ ...form, tempoPermanencia: e.target.value })
                    }
                  />
                </div>

                <Select
                  label="Predominância de Gênero"
                  required
                  placeholder="Perfil do público..."
                  options={GENEROS.map((g) => ({
                    value: g,
                    label: g,
                  }))}
                  value={form.generoPublico}
                  onChange={(e) =>
                    setForm({ ...form, generoPublico: e.target.value })
                  }
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
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              variant="gradient"
              className="w-full mt-6"
              loading={loading}
            >
              Concluir Cadastro do Ponto
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
