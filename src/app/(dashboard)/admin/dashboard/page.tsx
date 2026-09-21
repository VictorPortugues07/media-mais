"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";

interface AuditoriaAnuncio {
  id: number;
  titulo: string;
  tipoMidia: "VIDEO" | "IMAGEM";
  midiaUrl?: string;
  duracaoSegundos: number;
  status: string;
  anunciante: string;
  ponto: string;
  totalExibicoes: number;
  tempoTotalMinutos: number;
}

interface StatusPontoTv {
  id: number;
  nomeEmpresa: string;
  cidade: string;
  codigoTv: string;
  status: string;
  online: boolean;
  ultimaAtividade: string | null;
  tipoDispositivo?: string | null;
  resolucaoTela?: string | null;
  anunciosAtivos: number;
  totalExibicoes: number;
  tier?: string;
  cotaMensal?: number;
  scorePonderado?: number;
  maxCotas?: number;
}

interface TierDistItem {
  pontos: number;
  cotasOcupadas: number;
  faturamento: number;
  repasse: number;
  receitaMidiaMais: number;
}

interface FinanceiroData {
  faturamentoMensalTotal: number;
  repasseMensalTotal: number;
  receitaMidiaMaisMensal: number;
  distribuicaoTiers: {
    Bronze: TierDistItem;
    Prata: TierDistItem;
    Ouro: TierDistItem;
  };
}

interface StatsData {
  totalPontos: number;
  totalAnunciantes: number;
  totalAnuncios: number;
  anunciosPendentes: number;
  anunciosAtivos: number;
  anunciosFilaEspera?: number;
  pontosAtivos: number;
  totalExibicoes: number;
  totalHorasExibidas: string;
  exibicoesHoje: number;
  auditoriaAnuncios?: AuditoriaAnuncio[];
  statusPontosTv?: StatusPontoTv[];
  financeiro?: FinanceiroData;
}

function TVStatusBadge({ ponto }: { ponto: StatusPontoTv }) {
  if (ponto.status === "PENDENTE") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4F93C9]/15 text-[#0E1F66] border border-[#4F93C9]/35">
        <span className="w-1.5 h-1.5 rounded-full bg-[#4F93C9] animate-pulse" />
        Moderação
      </span>
    );
  }
  if (ponto.status === "INATIVO") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
        Inativo
      </span>
    );
  }
  if (ponto.online) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D8E8E1] text-[#1E4333] border border-[#8FAE9E]/50">
        <span className="w-1.5 h-1.5 rounded-full bg-[#8FAE9E] animate-pulse" />
        Ao Vivo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F7F8FA] text-[#9AA3AF] border border-[#E4E7EC]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1]" />
      Offline
    </span>
  );
}

export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterCampanha, setFilterCampanha] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [adToDelete, setAdToDelete] = useState<AuditoriaAnuncio | null>(null);
  const [previewAd, setPreviewAd] = useState<AuditoriaAnuncio | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    if (!adToDelete) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/anuncios/${adToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir anúncio");

      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          totalAnuncios: Math.max(0, prev.totalAnuncios - 1),
          anunciosAtivos: adToDelete.status === "ATIVO" ? Math.max(0, prev.anunciosAtivos - 1) : prev.anunciosAtivos,
          anunciosPendentes: adToDelete.status === "PENDENTE" ? Math.max(0, prev.anunciosPendentes - 1) : prev.anunciosPendentes,
          auditoriaAnuncios: (prev.auditoriaAnuncios || []).filter((a) => a.id !== adToDelete.id),
        };
      });
      setDeleteModalOpen(false);
      setAdToDelete(null);
      setPreviewAd(null);
      setToastMessage("Campanha e arquivos físicos excluídos com sucesso!");
      setTimeout(() => setToastMessage(null), 4000);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao excluir anúncio";
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  };

  const loadData = async () => {
    try {
      const [userRes, statsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/stats"),
      ]);
      if (userRes.ok) setUser((await userRes.json()).user);
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      console.error("Admin stats error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 12000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  const tvs = stats?.statusPontosTv || [];
  const tvOnlineCount = tvs.filter((p) => p.online).length;

  const auditoriaFiltrada = (stats?.auditoriaAnuncios || []).filter((a) => {
    const matchText =
      a.titulo.toLowerCase().includes(filterCampanha.toLowerCase()) ||
      a.anunciante.toLowerCase().includes(filterCampanha.toLowerCase()) ||
      a.ponto.toLowerCase().includes(filterCampanha.toLowerCase());
    const matchStatus = filterStatus === "todos" || a.status === filterStatus;
    return matchText && matchStatus;
  });

  return (
    <DashboardLayout
      role="ADMIN"
      userName={user?.nome || "Administrador"}
      userEmail={user?.email || ""}
      title="Painel de Controle"
      description="Supervisão em tempo real da rede de TVs e veiculações"
      actions={
        <Link href="/admin/aprovacoes">
          <Button size="sm" variant="gradient">
            Moderação
            {stats && stats.anunciosPendentes > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-amber-400 text-slate-900 rounded-full text-[10px] font-black">
                {stats.anunciosPendentes}
              </span>
            )}
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">

        {/* ── KPIs ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Horas Veiculadas",
              value: `${stats?.totalHorasExibidas ?? "0.0"}h`,
              sub: `${stats?.exibicoesHoje ?? 0} reproduções hoje`,
              icon: (
                <svg className="w-5 h-5 text-[#8FAE9E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              color: "text-[#0E1F66]",
            },
            {
              label: "Reproduções Totais",
              value: (stats?.totalExibicoes ?? 0).toLocaleString("pt-BR"),
              sub: "proof of play acumulado",
              icon: (
                <svg className="w-5 h-5 text-[#4F93C9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              color: "text-[#0E1F66]",
            },
            {
              label: "Aguardando Moderação",
              value: stats?.anunciosPendentes ?? 0,
              sub: "campanhas pendentes",
              icon: (
                <svg className="w-5 h-5 text-[#F2795C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ),
              color: stats?.anunciosPendentes ? "text-[#F2795C]" : "text-[#344054]",
            },
            {
              label: "TVs na Rede",
              value: stats?.totalPontos ?? 0,
              sub: `${tvOnlineCount} online agora`,
              icon: (
                <svg className="w-5 h-5 text-[#0E1F66]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              ),
              color: "text-[#0E1F66]",
            },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardBody>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#9AA3AF] uppercase tracking-wider leading-tight">{kpi.label}</p>
                    <p className={`text-3xl font-black font-heading mt-1.5 ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-[11px] text-[#9AA3AF] mt-0.5 leading-tight">{kpi.sub}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-[#F7F8FA] border border-[#E4E7EC] shrink-0 mt-0.5">{kpi.icon}</div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* ── Resumo Financeiro da Rede ─────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#0E1F66] font-heading">
                Resumo Financeiro da Rede
              </h3>
              <p className="text-xs text-[#9AA3AF]">
                Indicadores calculados a partir dos pontos ativos e cotas veiculadas
              </p>
            </div>
            <span className="text-[11px] font-semibold text-[#344054] bg-[#F7F8FA] border border-[#E4E7EC] px-2.5 py-1 rounded-lg">
              Divisão 50% / 50%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-[#4F93C9]">
              <CardBody>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#9AA3AF] uppercase tracking-wider">
                      Faturamento Mensal (Cotas)
                    </p>
                    <p className="text-2xl sm:text-3xl font-black font-heading text-[#0E1F66] mt-1">
                      {(stats?.financeiro?.faturamentoMensalTotal ?? 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                    <p className="text-[11px] text-[#9AA3AF] mt-0.5">
                      receita bruta de todas as cotas ativas
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#4F93C9]/10 text-[#4F93C9] flex items-center justify-center font-bold text-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="border-l-4 border-l-[#F2795C]">
              <CardBody>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#9AA3AF] uppercase tracking-wider">
                      Repasse Mensal aos Pontos
                    </p>
                    <p className="text-2xl sm:text-3xl font-black font-heading text-[#9C3218] mt-1">
                      {(stats?.financeiro?.repasseMensalTotal ?? 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                    <p className="text-[11px] text-[#9AA3AF] mt-0.5">
                      50% repassado aos donos de TV
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#F2795C]/15 text-[#9C3218] flex items-center justify-center font-bold text-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
                      Receita Mensal Mídia+
                    </p>
                    <p className="text-2xl sm:text-3xl font-black font-heading text-[#1E4333] mt-1">
                      {(stats?.financeiro?.receitaMidiaMaisMensal ?? 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                    <p className="text-[11px] text-[#9AA3AF] mt-0.5">
                      50% margem líquida da plataforma
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#D8E8E1] text-[#1E4333] flex items-center justify-center font-bold text-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Distribuição por Categoria / Tier */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {[
              {
                tier: "Tier Bronze",
                preco: "R$ 149,00/mês",
                badge: "bg-[#FFEDD5] text-[#9A3412] border-[#FDBA74]",
                corTexto: "text-[#9A3412]",
                dados: stats?.financeiro?.distribuicaoTiers?.Bronze,
              },
              {
                tier: "Tier Prata",
                preco: "R$ 199,00/mês",
                badge: "bg-[#F1F5F9] text-[#334155] border-[#CBD5E1]",
                corTexto: "text-[#334155]",
                dados: stats?.financeiro?.distribuicaoTiers?.Prata,
              },
              {
                tier: "Tier Ouro",
                preco: "R$ 249,00/mês",
                badge: "bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]",
                corTexto: "text-[#92400E]",
                dados: stats?.financeiro?.distribuicaoTiers?.Ouro,
              },
            ].map((t) => (
              <div
                key={t.tier}
                className="bg-white rounded-2xl border border-[#E4E7EC] p-3.5 flex flex-col justify-between shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${t.badge}`}>
                    {t.tier}
                  </span>
                  <span className="text-[11px] font-semibold text-[#9AA3AF]">{t.preco}</span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <div>
                    <span className="text-xl font-black font-heading text-[#0E1F66]">
                      {t.dados?.pontos ?? 0}
                    </span>
                    <span className="text-xs text-[#9AA3AF] ml-1">pontos</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#344054]">
                      {t.dados?.cotasOcupadas ?? 0} cotas
                    </span>
                    <p className={`text-xs font-extrabold ${t.corTexto}`}>
                      {(t.dados?.receitaMidiaMais ?? 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Monitor de TVs em Grid ────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#0E1F66] font-heading">Monitor de Telas</h3>
                <p className="text-xs text-[#9AA3AF] mt-0.5">
                  Status em tempo real · {tvOnlineCount} de {tvs.length} online
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8FAE9E] animate-pulse" />
                <span className="text-xs font-bold text-[#1E4333]">{tvOnlineCount} ao vivo</span>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-4">
            {tvs.length === 0 ? (
              <p className="text-center text-[#9AA3AF] text-sm py-8">Nenhuma TV cadastrada ainda.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {tvs.map((tv) => (
                  <div
                    key={tv.id}
                    className={`rounded-2xl border p-4 flex flex-col gap-3 transition ${
                      tv.online
                        ? "border-[#8FAE9E]/50 bg-[#D8E8E1]/25"
                        : "border-[#E4E7EC] bg-white hover:bg-[#F7F8FA]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-[#0E1F66] text-sm truncate">{tv.nomeEmpresa}</p>
                        <p className="text-[11px] text-[#9AA3AF] mt-0.5 flex items-center gap-1">
                          <svg className="w-3 h-3 text-[#4F93C9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{tv.cidade}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {tv.tier && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                              tv.tier === "Ouro"
                                ? "bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]"
                                : tv.tier === "Prata"
                                ? "bg-[#F1F5F9] text-[#334155] border-[#CBD5E1]"
                                : "bg-[#FFEDD5] text-[#9A3412] border-[#FDBA74]"
                            }`}
                          >
                            {tv.tier}
                          </span>
                        )}
                        <TVStatusBadge ponto={tv} />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="px-2 py-0.5 bg-[#F7F8FA] font-mono font-black text-[#0E1F66] rounded-lg border border-[#E4E7EC]">
                        {tv.codigoTv || "N/A"}
                      </span>
                      {tv.cotaMensal && (
                        <span className="px-2 py-0.5 bg-[#D8E8E1] text-[#1E4333] font-bold rounded-lg border border-[#8FAE9E]/40 text-[10px]">
                          {tv.cotaMensal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/cota
                        </span>
                      )}
                      {tv.tipoDispositivo && (
                        <span className="px-2 py-0.5 bg-[#4F93C9]/10 text-[#0E1F66] font-bold rounded-lg border border-[#4F93C9]/30 text-[10px]">
                          {tv.tipoDispositivo === "SMART_TV" ? "Smart TV" : tv.tipoDispositivo === "DESKTOP" ? "Monitor / Totem" : tv.tipoDispositivo}
                          {tv.resolucaoTela ? ` (${tv.resolucaoTela})` : ""}
                        </span>
                      )}
                      <span className="text-[#9AA3AF]">
                        {tv.ultimaAtividade
                          ? new Date(tv.ultimaAtividade).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                          : "Nunca conectou"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#344054]">
                        <strong className="text-[#0E1F66]">{tv.anunciosAtivos}</strong> anúncio(s) ·{" "}
                        <strong className="text-[#0E1F66]">{tv.totalExibicoes}</strong> exib.
                      </span>
                      <Link href="/admin/pontos">
                        <button className="px-2.5 py-1 bg-[#4F93C9]/10 hover:bg-[#4F93C9]/20 text-[#0E1F66] font-bold rounded-lg border border-[#4F93C9]/30 text-[11px] transition cursor-pointer">
                          Ver Ponto
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* ── Auditoria de Campanhas ────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-[#0E1F66] font-heading">
                  Auditoria de Campanhas
                  <span className="ml-2 text-sm font-normal text-[#9AA3AF]">
                    ({auditoriaFiltrada.length})
                  </span>
                </h3>
                <p className="text-xs text-[#9AA3AF] mt-0.5">Veiculações e tempo no ar por campanha</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  className="bg-[#F7F8FA] border border-[#E4E7EC] rounded-xl px-2.5 py-1.5 text-xs text-[#344054] outline-none focus:border-[#4F93C9] transition cursor-pointer"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="todos">Todos</option>
                  <option value="ATIVO">Ativos</option>
                  <option value="PENDENTE">Pendentes</option>
                  <option value="REJEITADO">Rejeitados</option>
                </select>
                <input
                  type="text"
                  placeholder="Buscar campanha, anunciante ou ponto..."
                  className="bg-[#F7F8FA] border border-[#E4E7EC] rounded-xl px-3 py-1.5 text-xs text-[#0E1F66] placeholder:text-[#9AA3AF] focus:border-[#4F93C9] focus:ring-1 focus:ring-[#4F93C9]/20 outline-none w-full sm:w-56 transition"
                  value={filterCampanha}
                  onChange={(e) => setFilterCampanha(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F8FA] text-[#9AA3AF] font-bold uppercase tracking-wider border-y border-[#E4E7EC]">
                  <tr>
                    <th className="px-5 py-3">Campanha</th>
                    <th className="px-5 py-3">Anunciante</th>
                    <th className="px-5 py-3">TV</th>
                    <th className="px-5 py-3">Formato</th>
                    <th className="px-5 py-3 text-right">Exibições</th>
                    <th className="px-5 py-3 text-right">Tempo</th>
                    <th className="px-5 py-3 text-right">Status</th>
                    <th className="px-5 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E7EC]">
                  {auditoriaFiltrada.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-[#9AA3AF]">
                        Nenhum registro encontrado.
                      </td>
                    </tr>
                  ) : (
                    auditoriaFiltrada.map((item) => (
                      <tr key={item.id} className="hover:bg-[#F7F8FA] transition">
                        <td className="px-5 py-3">
                          <button
                            type="button"
                            onClick={() => setPreviewAd(item)}
                            className="font-semibold text-[#0E1F66] hover:text-[#4F93C9] transition text-left cursor-pointer"
                          >
                            {item.titulo}
                          </button>
                        </td>
                        <td className="px-5 py-3 text-[#344054]">{item.anunciante}</td>
                        <td className="px-5 py-3 text-[#9AA3AF] text-[11px] max-w-[140px] truncate">{item.ponto}</td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 bg-[#4F93C9]/10 text-[#0E1F66] rounded font-bold border border-[#4F93C9]/30">
                            {item.tipoMidia}
                          </span>
                          <span className="ml-1 text-[#9AA3AF]">{item.duracaoSegundos}s</span>
                        </td>
                        <td className="px-5 py-3 text-right font-black text-[#0E1F66]">{item.totalExibicoes}</td>
                        <td className="px-5 py-3 text-right font-semibold text-[#1E4333]">{item.tempoTotalMinutos} min</td>
                        <td className="px-5 py-3 text-right">
                          {item.status === "ATIVO" ? (
                            <Badge variant="success">Ativo</Badge>
                          ) : item.status === "PENDENTE" ? (
                            <Badge variant="info">Pendente</Badge>
                          ) : item.status === "FILA_ESPERA" ? (
                            <Badge variant="fila">Fila de Espera</Badge>
                          ) : item.status === "REJEITADO" ? (
                            <Badge variant="danger">Rejeitado</Badge>
                          ) : (
                            <Badge>{item.status}</Badge>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              title="Visualizar mídia"
                              onClick={() => setPreviewAd(item)}
                              className="p-1.5 rounded-lg text-[#9AA3AF] hover:text-[#4F93C9] hover:bg-[#4F93C9]/10 transition cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              title="Excluir campanha"
                              onClick={() => {
                                setAdToDelete(item);
                                setDeleteError("");
                                setDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-[#9AA3AF] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

      </div>

      {/* Modal de Pré-visualização da Peça */}
      <Modal
        isOpen={Boolean(previewAd)}
        onClose={() => setPreviewAd(null)}
        title={previewAd?.titulo || "Visualização da Campanha"}
        description={previewAd ? `Anunciante: ${previewAd.anunciante} · Ponto: ${previewAd.ponto}` : ""}
        size="lg"
      >
        {previewAd && (
          <div className="space-y-4">
            {previewAd.midiaUrl ? (
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
            ) : (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border">
                Arquivo de mídia não encontrado para reprodução direta.
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
                <p className="font-bold text-slate-800 mt-1">{previewAd.status}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Duração</span>
                <p className="font-bold text-slate-800 mt-1">{previewAd.duracaoSegundos}s</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Exibições</span>
                <p className="font-bold text-slate-800 mt-1">{previewAd.totalExibicoes}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Tempo Total</span>
                <p className="font-bold text-emerald-700 mt-1">{previewAd.tempoTotalMinutos} min</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  const ad = previewAd;
                  setPreviewAd(null);
                  setAdToDelete(ad);
                  setDeleteError("");
                  setDeleteModalOpen(true);
                }}
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Excluir Campanha
              </Button>

              <Button variant="ghost" size="sm" onClick={() => setPreviewAd(null)}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Exclusão Definitiva */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => !deleting && setDeleteModalOpen(false)}
        title="Excluir Campanha do Sistema"
        description="Esta ação apagará permanentemente a campanha e seus arquivos."
      >
        <div className="space-y-4">
          {deleteError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
              {deleteError}
            </div>
          )}

          {adToDelete && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3.5">
              {adToDelete.midiaUrl ? (
                <div className="w-14 h-10 bg-slate-900 rounded-lg overflow-hidden shrink-0">
                  {adToDelete.tipoMidia === "VIDEO" ? (
                    <video src={adToDelete.midiaUrl} muted className="w-full h-full object-cover" />
                  ) : (
                    <img src={adToDelete.midiaUrl} alt={adToDelete.titulo} className="w-full h-full object-cover" />
                  )}
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 text-sm truncate">{adToDelete.titulo}</p>
                <p className="text-xs text-slate-500 truncate">
                  {adToDelete.anunciante} · TV: {adToDelete.ponto}
                </p>
              </div>
              <Badge variant={adToDelete.status === "ATIVO" ? "success" : "default"}>{adToDelete.status}</Badge>
            </div>
          )}

          <p className="text-xs text-slate-600 leading-relaxed">
            A peça será <strong>removida permanentemente</strong> da plataforma, o arquivo de mídia apagado e as partes envolvidas notificadas.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleConfirmDelete}>
              Confirmar Exclusão
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
