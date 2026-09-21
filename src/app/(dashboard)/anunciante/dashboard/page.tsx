"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";

interface UserData {
  id: number;
  nome: string;
  email: string;
  avatarUrl?: string | null;
  role: "ANUNCIANTE";
  anunciante?: { id: number; nomeEmpresa: string; logoUrl?: string | null };
}

interface AnuncioItem {
  id: number;
  titulo: string;
  tipoMidia: "VIDEO" | "IMAGEM";
  midiaUrl: string;
  duracaoSegundos: number;
  status: "PENDENTE" | "APROVADO" | "REJEITADO" | "ATIVO" | "PAUSADO" | "FILA_ESPERA";
  posicaoFila?: number | null;
  motivoRejeicao?: string;
  criadoEm: string;
  totalExibicoes?: number;
  exibicoesHoje?: number;
  totalMinutosExibidos?: number;
  ultimaExibicao?: string | null;
  pontoMidia: {
    id: number;
    nomeEmpresa: string;
    cidade: string;
    uf: string;
    tvOnline?: boolean;
  };
}

function StatusPill({
  status,
  tvOnline,
  posicaoFila,
}: {
  status: string;
  tvOnline?: boolean;
  posicaoFila?: number | null;
}) {
  if (status === "ATIVO" && tvOnline) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D8E8E1] text-[#1E4333] border border-[#8FAE9E]/50">
        <span className="w-1.5 h-1.5 rounded-full bg-[#8FAE9E] animate-pulse" />
        Ao Vivo
      </span>
    );
  }
  if (status === "ATIVO") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Ativo
      </span>
    );
  }
  if (status === "FILA_ESPERA") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] animate-pulse" />
        Fila de Espera {posicaoFila ? `#${posicaoFila}` : ""}
      </span>
    );
  }
  if (status === "PENDENTE") return <Badge variant="info">Moderação</Badge>;
  if (status === "REJEITADO") return <Badge variant="danger">Rejeitado</Badge>;
  return <Badge>{status}</Badge>;
}

interface AnuncianteStats {
  financeiro?: {
    gastoMensalTotal: number;
    detalhamentoCampanhas: Array<{
      anuncioId: number;
      titulo: string;
      pontoId: number;
      pontoNome: string;
      cidade: string;
      tier: string;
      cotaMensal: number;
    }>;
  };
}

export default function AnuncianteDashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const [anuncios, setAnuncios] = useState<AnuncioItem[]>([]);
  const [stats, setStats] = useState<AnuncianteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewAd, setPreviewAd] = useState<AnuncioItem | null>(null);
  const [removalModalOpen, setRemovalModalOpen] = useState(false);
  const [adToRequestRemoval, setAdToRequestRemoval] = useState<AnuncioItem | null>(null);
  const [motivoRemocao, setMotivoRemocao] = useState("");
  const [requestingRemoval, setRequestingRemoval] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenRemovalModal = (ad: AnuncioItem) => {
    setAdToRequestRemoval(ad);
    setMotivoRemocao("");
    setRequestError("");
    setRemovalModalOpen(true);
  };

  const handleConfirmRequestRemoval = async () => {
    if (!adToRequestRemoval || !motivoRemocao.trim()) return;
    setRequestingRemoval(true);
    setRequestError("");

    try {
      const res = await fetch(`/api/anuncios/${adToRequestRemoval.id}/solicitar-remocao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: motivoRemocao }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao enviar solicitação");

      setRemovalModalOpen(false);
      setAdToRequestRemoval(null);
      setMotivoRemocao("");
      setPreviewAd(null);
      setToastMessage("Solicitação de remoção enviada com sucesso para a moderação!");
      setTimeout(() => setToastMessage(null), 4500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar solicitação";
      setRequestError(msg);
    } finally {
      setRequestingRemoval(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [userRes, anunciosRes, statsRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/anuncios"),
          fetch("/api/stats"),
        ]);
        if (userRes.ok) setUser((await userRes.json()).user);
        if (anunciosRes.ok) setAnuncios((await anunciosRes.json()).anuncios || []);
        if (statsRes.ok) setStats(await statsRes.json());
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  const ativos = anuncios.filter((a) => a.status === "ATIVO");
  const pendentes = anuncios.filter((a) => a.status === "PENDENTE");
  const naFila = anuncios.filter((a) => a.status === "FILA_ESPERA");
  const rejeitados = anuncios.filter((a) => a.status === "REJEITADO");
  const totalExibicoes = anuncios.reduce((sum, a) => sum + (a.totalExibicoes ?? 0), 0);

  return (
    <DashboardLayout
      role="ANUNCIANTE"
      userName={user?.nome || "Anunciante"}
      userEmail={user?.email || ""}
      userAvatar={user?.avatarUrl || null}
      title="Painel do Anunciante"
      description="Acompanhe suas campanhas e métricas de veiculação"
      actions={
        <Link href="/anunciante/anuncios/novo">
          <Button size="sm" variant="gradient">
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Campanha
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">

        {/* ── KPIs ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Ativos", value: ativos.length, sub: "veiculando nas TVs",
              icon: (
                <svg className="w-5 h-5 text-[#4F93C9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              ),
              color: "text-[#0E1F66]", bg: "bg-[#4F93C9]/10", ring: "ring-[#4F93C9]/20",
            },
            {
              label: "Fila de Espera", value: naFila.length, sub: "aguardando vagas",
              icon: (
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-100",
            },
            {
              label: "Em Moderação", value: pendentes.length, sub: "em análise pela equipe",
              icon: (
                <svg className="w-5 h-5 text-[#0E1F66]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              ),
              color: "text-[#0E1F66]", bg: "bg-slate-100", ring: "ring-slate-200",
            },
            {
              label: "Total Exibições", value: totalExibicoes.toLocaleString("pt-BR"), sub: "reproduções acumuladas",
              icon: (
                <svg className="w-5 h-5 text-[#8FAE9E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
              color: "text-[#0E1F66]", bg: "bg-[#D8E8E1]", ring: "ring-[#8FAE9E]/30",
            },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardBody>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#9AA3AF] uppercase tracking-wider">{kpi.label}</p>
                    <p className={`text-3xl font-black font-heading mt-1.5 ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-[11px] text-[#9AA3AF] mt-0.5 leading-tight">{kpi.sub}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${kpi.bg} ring-1 ${kpi.ring}`}>
                    {kpi.icon}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* ── Resumo Financeiro & Faturamento ─────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#0E1F66] font-heading">
                Resumo do Faturamento & Investimento
              </h3>
              <p className="text-xs text-[#9AA3AF]">
                Valor mensal correspondente às cotas das suas campanhas ativas
              </p>
            </div>
            <span className="text-[11px] font-semibold text-[#344054] bg-[#F7F8FA] border border-[#E4E7EC] px-2.5 py-1 rounded-lg">
              Pagamento online via API em breve
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-[#4F93C9]">
              <CardBody>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#9AA3AF] uppercase tracking-wider">
                      Investimento Mensal
                    </p>
                    <p className="text-2xl sm:text-3xl font-black font-heading text-[#0E1F66] mt-1">
                      {(stats?.financeiro?.gastoMensalTotal ?? 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                    <p className="text-[11px] text-[#9AA3AF] mt-0.5">
                      total de cotas ativas no ar
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#4F93C9]/10 text-[#4F93C9] flex items-center justify-center font-bold text-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="border-l-4 border-l-[#8FAE9E]">
              <CardBody>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#9AA3AF] uppercase tracking-wider">
                      Cotas em Transmissão
                    </p>
                    <p className="text-2xl sm:text-3xl font-black font-heading text-[#1E4333] mt-1">
                      {ativos.length}
                    </p>
                    <p className="text-[11px] text-[#9AA3AF] mt-0.5">
                      {ativos.length === 1 ? "1 TV veiculando" : `${ativos.length} TVs veiculando`}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#D8E8E1] text-[#1E4333] flex items-center justify-center font-bold text-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="border-l-4 border-l-[#0E1F66]">
              <CardBody>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#9AA3AF] uppercase tracking-wider">
                      Modelo de Cobrança
                    </p>
                    <p className="text-base font-bold text-[#0E1F66] mt-1.5 font-heading">
                      Cota Fixa Mensal
                    </p>
                    <p className="text-[11px] text-[#9AA3AF] mt-0.5">
                      Sem taxa de adesão ou fidelidade
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#0E1F66]/10 text-[#0E1F66] flex items-center justify-center font-bold text-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Detalhamento por Campanha Ativa */}
          {stats?.financeiro?.detalhamentoCampanhas && stats.financeiro.detalhamentoCampanhas.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E4E7EC] p-4 space-y-2">
              <p className="text-xs font-bold text-[#344054]">Detalhamento das cotas ativas:</p>
              <div className="divide-y divide-[#E4E7EC]">
                {stats.financeiro.detalhamentoCampanhas.map((item) => (
                  <div key={item.anuncioId} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-[#0E1F66] truncate">{item.titulo}</span>
                      <span className="text-[#9AA3AF]">em</span>
                      <span className="text-[#344054] truncate">
                        {item.pontoNome} ({item.cidade})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                          item.tier === "Ouro"
                            ? "bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]"
                            : item.tier === "Prata"
                            ? "bg-[#F1F5F9] text-[#334155] border-[#CBD5E1]"
                            : "bg-[#FFEDD5] text-[#9A3412] border-[#FDBA74]"
                        }`}
                      >
                        {item.tier}
                      </span>
                      <span className="font-bold text-[#1E4333]">
                        {item.cotaMensal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Campanhas ────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#0E1F66] font-heading">Minhas Campanhas</h3>
                <p className="text-xs text-[#9AA3AF] mt-0.5">Status de veiculação em cada ponto de TV</p>
              </div>
              <Link href="/anunciante/mapa">
                <Button variant="secondary" size="sm">Explorar Pontos</Button>
              </Link>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {anuncios.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="Nenhuma campanha criada"
                  description="Explore os pontos disponíveis no mapa e escolha onde exibir seu anúncio."
                  action={
                    <Link href="/anunciante/mapa">
                      <Button variant="gradient">Ver Mapa de Pontos</Button>
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="divide-y divide-[#E4E7EC]">
                {anuncios.map((anuncio) => (
                  <div
                    key={anuncio.id}
                    className="px-5 py-4 flex items-center gap-4 hover:bg-[#F7F8FA] transition"
                  >
                    {/* Thumbnail clicável para preview */}
                    <button
                      type="button"
                      onClick={() => setPreviewAd(anuncio)}
                      title="Clique para visualizar mídia"
                      className="w-16 h-11 bg-[#0E1F66] rounded-xl overflow-hidden shrink-0 shadow-xs relative group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4F93C9]"
                    >
                      {anuncio.tipoMidia === "VIDEO" ? (
                        <video src={anuncio.midiaUrl} muted className="w-full h-full object-cover" />
                      ) : (
                        <img src={anuncio.midiaUrl} alt={anuncio.titulo} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setPreviewAd(anuncio)}
                          className="font-semibold text-[#0E1F66] text-sm truncate hover:text-[#4F93C9] transition text-left cursor-pointer"
                        >
                          {anuncio.titulo}
                        </button>
                        <StatusPill
                          status={anuncio.status}
                          tvOnline={anuncio.pontoMidia.tvOnline}
                          posicaoFila={anuncio.posicaoFila}
                        />
                      </div>
                      <p className="text-xs text-[#9AA3AF] mt-0.5 truncate">
                        {anuncio.pontoMidia.nomeEmpresa} · {anuncio.pontoMidia.cidade}/{anuncio.pontoMidia.uf}
                      </p>

                      {/* Métricas — só para ativos */}
                      {anuncio.status === "ATIVO" && (
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[11px] text-[#344054]">
                            <strong className="text-[#0E1F66]">{anuncio.exibicoesHoje ?? 0}</strong> hoje
                          </span>
                          <span className="text-[#CBD5E1]">·</span>
                          <span className="text-[11px] text-[#344054]">
                            <strong className="text-[#0E1F66]">{anuncio.totalExibicoes ?? 0}</strong> total
                          </span>
                          {(anuncio.totalMinutosExibidos ?? 0) > 0 && (
                            <>
                              <span className="text-[#CBD5E1]">·</span>
                              <span className="text-[11px] text-[#344054]">
                                <strong className="text-[#0E1F66]">{anuncio.totalMinutosExibidos}</strong> min no ar
                              </span>
                            </>
                          )}
                        </div>
                      )}

                      {anuncio.status === "REJEITADO" && anuncio.motivoRejeicao && (
                        <p className="text-[11px] text-rose-700 mt-1 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200 inline-block">
                          {anuncio.motivoRejeicao}
                        </p>
                      )}
                    </div>

                    {/* Data e Ações */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-[#9AA3AF] hidden sm:block">
                        {new Date(anuncio.criadoEm).toLocaleDateString("pt-BR")}
                      </span>

                      <button
                        type="button"
                        title="Visualizar peça"
                        onClick={() => setPreviewAd(anuncio)}
                        className="p-2 rounded-xl text-[#9AA3AF] hover:text-[#4F93C9] hover:bg-[#4F93C9]/10 transition cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        title="Solicitar remoção desta campanha"
                        onClick={() => handleOpenRemovalModal(anuncio)}
                        className="p-2 rounded-xl text-[#9AA3AF] hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Modal de Pré-visualização da Peça */}
      <Modal
        isOpen={Boolean(previewAd)}
        onClose={() => setPreviewAd(null)}
        title={previewAd?.titulo || "Visualização da Campanha"}
        description={previewAd ? `Exibição programada para: ${previewAd.pontoMidia.nomeEmpresa} (${previewAd.pontoMidia.cidade}/${previewAd.pontoMidia.uf})` : ""}
        size="lg"
      >
        {previewAd && (
          <div className="space-y-4">
            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center relative">
              {previewAd.tipoMidia === "VIDEO" ? (
                <video
                  src={previewAd.midiaUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={previewAd.midiaUrl}
                  alt={previewAd.titulo}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#F7F8FA] rounded-2xl border border-[#E4E7EC] text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#9AA3AF]">Status</span>
                <div className="mt-1">
                  <StatusPill status={previewAd.status} tvOnline={previewAd.pontoMidia.tvOnline} />
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#9AA3AF]">Duração</span>
                <p className="font-bold text-[#0E1F66] mt-1">{previewAd.duracaoSegundos} segundos</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#9AA3AF]">Exibições Hoje</span>
                <p className="font-bold text-[#0E1F66] mt-1">{previewAd.exibicoesHoje ?? 0}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#9AA3AF]">Total Exibições</span>
                <p className="font-bold text-[#1E4333] mt-1">{previewAd.totalExibicoes ?? 0}</p>
              </div>
            </div>

            {previewAd.status === "REJEITADO" && previewAd.motivoRejeicao && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                <strong>Motivo da Recusa:</strong> {previewAd.motivoRejeicao}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[#E4E7EC]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const ad = previewAd;
                  setPreviewAd(null);
                  handleOpenRemovalModal(ad);
                }}
                className="text-amber-700 hover:text-amber-800 hover:bg-amber-50 border-amber-200"
              >
                <svg className="w-4 h-4 mr-1.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Solicitar Remoção à Moderação
              </Button>

              <Button variant="ghost" size="sm" onClick={() => setPreviewAd(null)}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Solicitação de Remoção */}
      <Modal
        isOpen={removalModalOpen}
        onClose={() => !requestingRemoval && setRemovalModalOpen(false)}
        title="Solicitar Remoção de Campanha"
        description="Envie um pedido à administração para remover ou desvincular este anúncio."
      >
        <div className="space-y-4">
          {requestError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
              {requestError}
            </div>
          )}

          {adToRequestRemoval && (
            <div className="p-3.5 bg-[#F7F8FA] border border-[#E4E7EC] rounded-2xl flex items-center gap-3.5">
              <div className="w-14 h-10 bg-[#0E1F66] rounded-lg overflow-hidden shrink-0">
                {adToRequestRemoval.tipoMidia === "VIDEO" ? (
                  <video src={adToRequestRemoval.midiaUrl} muted className="w-full h-full object-cover" />
                ) : (
                  <img src={adToRequestRemoval.midiaUrl} alt={adToRequestRemoval.titulo} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[#0E1F66] text-sm truncate">{adToRequestRemoval.titulo}</p>
                <p className="text-xs text-[#9AA3AF] truncate">
                  Ponto: {adToRequestRemoval.pontoMidia.nomeEmpresa} ({adToRequestRemoval.pontoMidia.cidade})
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#344054] mb-1.5">
              Motivo da Solicitação <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              className="w-full rounded-xl border border-[#E4E7EC] p-3 text-xs text-[#0E1F66] placeholder:text-[#9AA3AF] focus:border-[#4F93C9] focus:ring-2 focus:ring-[#4F93C9]/20 outline-none transition"
              placeholder="Explique o motivo para remoção (ex: encerramento antecipado da campanha, alteração de material, erro na veiculação...)"
              value={motivoRemocao}
              onChange={(e) => setMotivoRemocao(e.target.value)}
            />
          </div>

          <p className="text-xs text-[#92400E] leading-relaxed bg-[#FEF3C7] p-3 rounded-xl border border-[#FCD34D]">
            <strong>Informação importante:</strong> Apenas a administração pode excluir peças ativas da rede. Seu pedido será analisado pela equipe de moderação e a exclusão da mídia e desvinculação da TV serão processadas em seguida.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E4E7EC]">
            <Button variant="ghost" onClick={() => setRemovalModalOpen(false)} disabled={requestingRemoval}>
              Cancelar
            </Button>
            <Button
              variant="gradient"
              loading={requestingRemoval}
              disabled={!motivoRemocao.trim() || motivoRemocao.trim().length < 5}
              onClick={handleConfirmRequestRemoval}
            >
              Enviar Solicitação
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-700 text-white rounded-2xl shadow-xl text-xs font-bold animate-fade-in border border-emerald-500">
          <svg className="w-4 h-4 text-emerald-200 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)} className="ml-2 text-emerald-200 hover:text-white cursor-pointer">✕</button>
        </div>
      )}
    </DashboardLayout>
  );
}
