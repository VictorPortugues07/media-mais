"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  calcularScorePonderado,
  determinarTier,
  formatarMoeda,
  OPCOES_FLUXO_DIARIO,
  OPCOES_TEMPO_ESPERA,
  OPCOES_PERFIL_PUBLICO,
  OPCOES_EXCLUSIVIDADE,
} from "@/lib/precificacao";

interface AnuncioDetail {
  id: number;
  titulo: string;
  tipoMidia: "VIDEO" | "IMAGEM";
  midiaUrl: string;
  duracaoSegundos: number;
  status: "PENDENTE" | "APROVADO" | "REJEITADO" | "ATIVO" | "PAUSADO" | "FILA_ESPERA";
  totalExibicoes?: number;
  dataInicio?: string | null;
  dataFim?: string | null;
  posicaoFila?: number | null;
  anunciante: { nomeEmpresa: string; categoria: string };
  criadoEm: string;
}

interface PontoAdminItem {
  id: number;
  nomeEmpresa: string;
  responsavel: string;
  whatsapp: string;
  cidade: string;
  uf: string;
  categoria: string;
  fluxoDiarioEstimado: string;
  tempoPermanencia?: string;
  status: "PENDENTE" | "ATIVO" | "INATIVO";
  quantidadeTvs: number;
  aceitaNovosAnuncios: boolean;
  tempoOcupadoSegundos: number;
  tempoDisponivelSegundos: number;
  limiteTempoSegundos: number;
  porcentagemOcupada: number;
  quantidadeFilaEspera: number;
  proximaLiberacao?: string | null;
  tipoDispositivo?: string | null;
  resolucaoTela?: string | null;
  criadoEm: string;
  _count?: { anuncios: number };
  maxCotas?: number;
  cotasOcupadas?: number;
  cotasDisponiveis?: number;
  tier?: string;
  cotaMensal?: number;
  scorePonderado?: number;
  notaFluxo?: number;
  notaTempo?: number;
  notaPerfil?: number;
  notaExclusividade?: number;
}

export default function AdminPontosPage() {
  const [user, setUser] = useState<any>(null);
  const [pontos, setPontos] = useState<PontoAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterText, setFilterText] = useState("");

  // Gestão de anúncios por ponto
  const [selectedPonto, setSelectedPonto] = useState<PontoAdminItem | null>(null);
  const [campaigns, setCampaigns] = useState<AnuncioDetail[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [actionAdLoading, setActionAdLoading] = useState<number | null>(null);
  const [adToDelete, setAdToDelete] = useState<AnuncioDetail | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal de Scoring & Precificação
  const [scoringModalOpen, setScoringModalOpen] = useState(false);
  const [pontoForScoring, setPontoForScoring] = useState<PontoAdminItem | null>(null);
  const [notaFluxo, setNotaFluxo] = useState<number>(3.5);
  const [notaTempo, setNotaTempo] = useState<number>(3.5);
  const [notaPerfil, setNotaPerfil] = useState<number>(3.5);
  const [notaExclusividade, setNotaExclusividade] = useState<number>(3.5);
  const [maxCotasInput, setMaxCotasInput] = useState<number>(8);
  const [savingScoring, setSavingScoring] = useState(false);

  const handleOpenScoring = (p: PontoAdminItem) => {
    setPontoForScoring(p);
    setNotaFluxo(p.notaFluxo ?? 3.5);
    setNotaTempo(p.notaTempo ?? 3.5);
    setNotaPerfil(p.notaPerfil ?? 3.5);
    setNotaExclusividade(p.notaExclusividade ?? 3.5);
    setMaxCotasInput(p.maxCotas ?? 8);
    setScoringModalOpen(true);
  };

  const handleSaveScoring = async () => {
    if (!pontoForScoring) return;
    setSavingScoring(true);
    try {
      const res = await fetch(`/api/pontos/${pontoForScoring.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notaFluxo,
          notaTempo,
          notaPerfil,
          notaExclusividade,
          maxCotas: maxCotasInput,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPontos((prev) =>
          prev.map((p) => (p.id === pontoForScoring.id ? { ...p, ...data.ponto } : p))
        );
        setScoringModalOpen(false);
        setToastMessage(`Precificação atualizada com sucesso para ${pontoForScoring.nomeEmpresa}!`);
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (e) {
      console.error("Erro ao salvar scoring:", e);
    } finally {
      setSavingScoring(false);
    }
  };

  const handleOpenCampaigns = async (p: PontoAdminItem) => {
    setSelectedPonto(p);
    setLoadingCampaigns(true);
    try {
      const res = await fetch(`/api/anuncios?pontoId=${p.id}`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.anuncios || []);
      }
    } catch (err) {
      console.error("Erro ao carregar anúncios da TV:", err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleToggleAceitaNovos = async (ponto: PontoAdminItem) => {
    const nextVal = !ponto.aceitaNovosAnuncios;
    try {
      const res = await fetch(`/api/pontos/${ponto.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aceitaNovosAnuncios: nextVal }),
      });
      if (res.ok) {
        setPontos((prev) =>
          prev.map((p) => (p.id === ponto.id ? { ...p, aceitaNovosAnuncios: nextVal } : p))
        );
        setToastMessage(
          nextVal
            ? `Solicitações LIBERADAS para ${ponto.nomeEmpresa}!`
            : `Solicitações BLOQUEADAS para ${ponto.nomeEmpresa}. Nenhum novo anúncio poderá ser enviado até o desbloqueio.`
        );
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error("Toggle aceitaNovos error:", err);
    }
  };

  const handlePromoverFila = async (anuncioId: number) => {
    setActionAdLoading(anuncioId);
    try {
      const res = await fetch(`/api/anuncios/${anuncioId}/promover-fila`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diasValidade: 30 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao promover anúncio da fila");

      setCampaigns((prev) =>
        prev.map((a) => (a.id === anuncioId ? { ...a, status: "ATIVO" as const } : a))
      );
      loadPontos();
      setToastMessage("Campanha promovida da fila para a grade ativa com sucesso!");
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao promover";
      alert(msg);
    } finally {
      setActionAdLoading(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!adToDelete) return;
    setDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch(`/api/anuncios/${adToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao remover anúncio da TV");

      setCampaigns((prev) => prev.filter((a) => a.id !== adToDelete.id));
      loadPontos();
      setAdToDelete(null);
      setToastMessage("Anúncio removido da grade com sucesso!");
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao remover anúncio";
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  };

  const loadPontos = async () => {
    try {
      const [userRes, pontosRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/pontos?status="),
      ]);
      if (userRes.ok) setUser((await userRes.json()).user);
      if (pontosRes.ok) setPontos((await pontosRes.json()).pontos || []);
    } catch (err) {
      console.error("Load pontos admin error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPontos(); }, []);

  const handleUpdateStatus = async (id: number, nextStatus: "PENDENTE" | "ATIVO" | "INATIVO") => {
    try {
      const res = await fetch(`/api/pontos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) setPontos((prev) => prev.map((p) => (p.id === id ? { ...p, status: nextStatus } : p)));
    } catch (err) {
      console.error("Update status error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  const filtered = pontos.filter((p) => {
    const matchStatus = filterStatus === "todos" || p.status === filterStatus;
    const matchText =
      p.nomeEmpresa.toLowerCase().includes(filterText.toLowerCase()) ||
      p.cidade.toLowerCase().includes(filterText.toLowerCase()) ||
      p.categoria.toLowerCase().includes(filterText.toLowerCase());
    return matchStatus && matchText;
  });

  const pendentes = pontos.filter((p) => p.status === "PENDENTE").length;

  return (
    <DashboardLayout
      role="ADMIN"
      userName={user?.nome || "Administrador"}
      userEmail={user?.email || ""}
      title="Pontos de TV"
      description="Estabelecimentos com telas integradas à plataforma"
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-[#0E1F66] font-heading">
                Pontos Cadastrados
                <span className="ml-2 text-sm font-normal text-[#9AA3AF]">({filtered.length})</span>
              </h3>
              {pendentes > 0 && (
                <p className="text-xs text-amber-700 font-semibold mt-0.5">
                  {pendentes} aguardando aprovação
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select
                className="bg-[#F7F8FA] border border-[#E4E7EC] rounded-xl px-2.5 py-1.5 text-xs text-[#344054] outline-none focus:border-[#4F93C9] transition cursor-pointer"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="PENDENTE">Pendentes</option>
                <option value="ATIVO">Ativos</option>
                <option value="INATIVO">Inativos</option>
              </select>
              <input
                type="text"
                placeholder="Buscar ponto, cidade..."
                className="bg-[#F7F8FA] border border-[#E4E7EC] rounded-xl px-3 py-1.5 text-xs text-[#0E1F66] placeholder:text-[#9AA3AF] focus:border-[#4F93C9] outline-none w-44 transition"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {filtered.length === 0 ? (
            <div className="p-10">
              <EmptyState title="Nenhum ponto encontrado" description="Tente ajustar os filtros." />
            </div>
          ) : (
            <div className="divide-y divide-[#E4E7EC]">
              {filtered.map((ponto) => {
                const maxCotas = ponto.maxCotas || 8;
                const cotasOcupadas = ponto.cotasOcupadas || 0;
                const percCotas = Math.min(100, Math.round((cotasOcupadas / maxCotas) * 100));

                return (
                  <div
                    key={ponto.id}
                    className="px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#F7F8FA] transition"
                  >
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-[#0E1F66] text-sm">{ponto.nomeEmpresa}</h4>
                        <Badge variant={ponto.status === "ATIVO" ? "success" : ponto.status === "PENDENTE" ? "warning" : "default"}>
                          {ponto.status}
                        </Badge>
                        <Badge variant="brand">{ponto.categoria}</Badge>
                        {ponto.tier && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold border ${
                              ponto.tier === "Ouro"
                                ? "bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]"
                                : ponto.tier === "Prata"
                                ? "bg-[#F1F5F9] text-[#334155] border-[#CBD5E1]"
                                : "bg-[#FFEDD5] text-[#9A3412] border-[#FDBA74]"
                            }`}
                          >
                            {ponto.tier} · R$ {ponto.cotaMensal?.toFixed(2).replace(".", ",")}/mês
                          </span>
                        )}
                        {ponto.scorePonderado && (
                          <span className="px-2 py-0.5 rounded-md bg-[#4F93C9]/10 text-[#0E1F66] font-bold text-[10px] border border-[#4F93C9]/30">
                            Score: {ponto.scorePonderado.toFixed(2)}
                          </span>
                        )}
                        {ponto.tipoDispositivo && (
                          <span className="px-2 py-0.5 rounded-md bg-[#4F93C9]/10 text-[#0E1F66] font-bold text-[10px] border border-[#4F93C9]/30">
                            {ponto.tipoDispositivo === "SMART_TV" ? "Smart TV" : ponto.tipoDispositivo === "DESKTOP" ? "Monitor / Totem" : ponto.tipoDispositivo}
                            {ponto.resolucaoTela ? ` (${ponto.resolucaoTela})` : ""}
                          </span>
                        )}
                        {!ponto.aceitaNovosAnuncios ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px]">
                            Solicitações Bloqueadas
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-[#D8E8E1] text-[#1E4333] font-bold text-[10px] border border-[#8FAE9E]/40">
                            Recebendo Solicitações
                          </span>
                        )}
                        {ponto.quantidadeFilaEspera > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D] font-bold text-[10px]">
                            {ponto.quantidadeFilaEspera} na Fila de Espera
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#9AA3AF]">
                        {ponto.responsavel} · {ponto.whatsapp} · {ponto.cidade}/{ponto.uf} · Fluxo: {ponto.fluxoDiarioEstimado}
                      </p>

                      {/* Medidor de Cotas (1 anunciante ativo = 1 cota) */}
                      <div className="max-w-md bg-[#F7F8FA] p-2.5 rounded-xl border border-[#E4E7EC] space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-[#344054]">
                            Capacidade de Cotas (Máx {maxCotas}):
                          </span>
                          <span className="font-extrabold text-[#0E1F66]">
                            {cotasOcupadas} / {maxCotas} cotas ocupadas ({percCotas}%)
                          </span>
                        </div>
                        <div className="w-full bg-[#E4E7EC] rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              percCotas >= 100
                                ? "bg-amber-500"
                                : percCotas > 75
                                ? "bg-[#4F93C9]"
                                : "bg-[#8FAE9E]"
                            }`}
                            style={{ width: `${percCotas}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {/* Botão de Ajuste de Precificação e Scoring */}
                      <button
                        type="button"
                        onClick={() => handleOpenScoring(ponto)}
                        className="px-2.5 py-1.5 rounded-xl bg-[#4F93C9]/10 hover:bg-[#4F93C9]/20 text-[#0E1F66] font-bold text-xs border border-[#4F93C9]/30 transition cursor-pointer flex items-center gap-1.5"
                        title="Configurar notas e critérios de precificação"
                      >
                        <svg className="w-3.5 h-3.5 text-[#4F93C9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                        <span>Precificação</span>
                      </button>

                      {/* Botão de Bloqueio / Desbloqueio Manual de Novas Solicitações */}
                      <button
                        type="button"
                        onClick={() => handleToggleAceitaNovos(ponto)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition cursor-pointer flex items-center gap-1.5 ${
                          ponto.aceitaNovosAnuncios
                            ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                        }`}
                        title={
                          ponto.aceitaNovosAnuncios
                            ? "Bloquear novas solicitações para este ponto"
                            : "Liberar novas solicitações para este ponto"
                        }
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {ponto.aceitaNovosAnuncios ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                          )}
                        </svg>
                        <span>{ponto.aceitaNovosAnuncios ? "Bloquear Pedidos" : "Liberar Pedidos"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenCampaigns(ponto)}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-100 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Grade ({ponto._count?.anuncios ?? 0})
                        {ponto.quantidadeFilaEspera > 0 && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        )}
                      </button>

                      {ponto.status === "PENDENTE" && (
                        <Button variant="success" size="sm" onClick={() => handleUpdateStatus(ponto.id, "ATIVO")}>
                          Aprovar
                        </Button>
                      )}
                      {ponto.status === "ATIVO" && (
                        <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(ponto.id, "INATIVO")}>
                          Desativar
                        </Button>
                      )}
                      {ponto.status === "INATIVO" && (
                        <Button variant="success" size="sm" onClick={() => handleUpdateStatus(ponto.id, "ATIVO")}>
                          Reativar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de Grade da TV */}
      <Modal
        isOpen={Boolean(selectedPonto)}
        onClose={() => !deleting && setSelectedPonto(null)}
        title={`Grade de TV - ${selectedPonto?.nomeEmpresa || "Ponto"}`}
        description="Campanhas em veiculação e lista de espera para este televisor"
        size="lg"
      >
        <div className="space-y-4">
          {/* Resumo da Grade */}
          {selectedPonto && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-800">
                  Loop da TV (Limite 6 min / 360s):
                </span>
                <p className="text-slate-500 mt-0.5">
                  {campaigns.filter((c) => c.status === "ATIVO").reduce((s, c) => s + (c.duracaoSegundos || 10), 0)}s ocupados no loop contínuo
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold">
                  {campaigns.filter((c) => c.status === "ATIVO").length} Anúncio(s) Ativo(s)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold">
                  {campaigns.filter((c) => c.status === "FILA_ESPERA").length} na Fila
                </span>
              </div>
            </div>
          )}

          {loadingCampaigns ? (
            <div className="py-12 flex items-center justify-center">
              <Spinner size="md" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              Nenhuma campanha cadastrada para esta tela no momento.
            </div>
          ) : (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
              {/* Seção 1: Campanhas Ativas */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Campanhas Ativas na TV ({campaigns.filter((c) => c.status === "ATIVO").length})
                </h4>

                {campaigns.filter((c) => c.status === "ATIVO").length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 bg-slate-50 rounded-xl text-center">
                    Nenhum anúncio rodando nesta TV atualmente.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl bg-white overflow-hidden">
                    {campaigns
                      .filter((c) => c.status === "ATIVO")
                      .map((ad) => (
                        <div key={ad.id} className="p-3 flex items-center gap-3.5 hover:bg-slate-50/50 transition">
                          <div className="w-16 h-11 bg-slate-900 rounded-xl overflow-hidden shrink-0 shadow-xs">
                            {ad.tipoMidia === "VIDEO" ? (
                              <video src={ad.midiaUrl} muted className="w-full h-full object-cover" />
                            ) : (
                              <img src={ad.midiaUrl} alt={ad.titulo} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 text-xs truncate">{ad.titulo}</p>
                              <Badge variant="success">ATIVO</Badge>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                              Anunciante: <strong>{ad.anunciante.nomeEmpresa}</strong> · {ad.duracaoSegundos}s no loop
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {ad.dataFim
                                ? `Saída prevista: ${new Date(ad.dataFim).toLocaleDateString("pt-BR")}`
                                : `Desde ${new Date(ad.criadoEm).toLocaleDateString("pt-BR")}`}
                              {" · "}{ad.totalExibicoes ?? 0} exibições
                            </p>
                          </div>
                          <button
                            type="button"
                            title="Remover anúncio da TV"
                            onClick={() => {
                              setAdToDelete(ad);
                              setDeleteError("");
                            }}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Seção 2: Fila de Espera */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Fila de Espera ({campaigns.filter((c) => c.status === "FILA_ESPERA").length})
                </h4>

                {campaigns.filter((c) => c.status === "FILA_ESPERA").length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 bg-slate-50 rounded-xl text-center">
                    Nenhum anunciante na fila de espera deste ponto.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-amber-100 rounded-2xl bg-amber-50/20 overflow-hidden">
                    {campaigns
                      .filter((c) => c.status === "FILA_ESPERA")
                      .map((ad, idx) => (
                        <div key={ad.id} className="p-3 flex items-center gap-3.5 hover:bg-amber-50/40 transition">
                          <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-900 text-xs font-black flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <div className="w-16 h-11 bg-slate-900 rounded-xl overflow-hidden shrink-0 shadow-xs">
                            {ad.tipoMidia === "VIDEO" ? (
                              <video src={ad.midiaUrl} muted className="w-full h-full object-cover" />
                            ) : (
                              <img src={ad.midiaUrl} alt={ad.titulo} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 text-xs truncate">{ad.titulo}</p>
                              <Badge variant="warning">FILA DE ESPERA</Badge>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                              Anunciante: <strong>{ad.anunciante.nomeEmpresa}</strong> · {ad.duracaoSegundos}s solicitados
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Aguardando desde {new Date(ad.criadoEm).toLocaleDateString("pt-BR")}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="success"
                              size="sm"
                              loading={actionAdLoading === ad.id}
                              onClick={() => handlePromoverFila(ad.id)}
                            >
                              Promover para TV
                            </Button>
                            <button
                              type="button"
                              title="Remover anúncio da fila"
                              onClick={() => {
                                setAdToDelete(ad);
                                setDeleteError("");
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setSelectedPonto(null)}>
              Fechar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={Boolean(adToDelete)}
        onClose={() => !deleting && setAdToDelete(null)}
        title="Remover Anúncio da TV"
        description="Esta ação removerá a campanha desta tela e apagará o registro da plataforma."
      >
        <div className="space-y-4">
          {deleteError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
              {deleteError}
            </div>
          )}

          {adToDelete && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3.5">
              <div className="w-14 h-10 bg-slate-900 rounded-lg overflow-hidden shrink-0">
                {adToDelete.tipoMidia === "VIDEO" ? (
                  <video src={adToDelete.midiaUrl} muted className="w-full h-full object-cover" />
                ) : (
                  <img src={adToDelete.midiaUrl} alt={adToDelete.titulo} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 text-sm truncate">{adToDelete.titulo}</p>
                <p className="text-xs text-slate-500 truncate">
                  Anunciante: {adToDelete.anunciante.nomeEmpresa}
                </p>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-600 leading-relaxed">
            Ao confirmar, esta campanha será <strong>removida da transmissão</strong> do estabelecimento.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setAdToDelete(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleConfirmDelete}>
              Confirmar Remoção
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Precificação e Scoring */}
      <Modal
        isOpen={scoringModalOpen}
        onClose={() => !savingScoring && setScoringModalOpen(false)}
        title={pontoForScoring ? `Precificação & Scoring: ${pontoForScoring.nomeEmpresa}` : "Precificação do Ponto"}
        description="Ajuste as notas dos critérios ponderados para calcular o Tier e o valor da cota mensal."
        size="lg"
      >
        {pontoForScoring && (() => {
          const scoreCalc = calcularScorePonderado(notaFluxo, notaTempo, notaPerfil, notaExclusividade);
          const tierCalc = determinarTier(scoreCalc);

          return (
            <div className="space-y-4">
              {/* Resultado em Destaque */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 text-white shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                      Resultado Calculado
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-3xl font-black font-heading text-amber-400">
                        {tierCalc.tier}
                      </span>
                      <span className="text-sm font-semibold text-blue-200">
                        Score: <strong>{scoreCalc.toFixed(2)}</strong> pts
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-blue-300">Cota Mensal</span>
                    <p className="text-2xl font-black font-heading text-white mt-0.5">
                      {formatarMoeda(tierCalc.cotaMensal)}
                    </p>
                    <span className="text-[10px] text-blue-200/70">por anunciante / mês</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-blue-300/80">Repasse ao Ponto (50%):</span>
                    <p className="font-bold text-amber-300">{formatarMoeda(tierCalc.repasseAoPonto)}/cota</p>
                  </div>
                  <div className="text-right">
                    <span className="text-blue-300/80">Receita Mídia+ (50%):</span>
                    <p className="font-bold text-emerald-400">{formatarMoeda(tierCalc.receitaMidiaMais)}/cota</p>
                  </div>
                </div>
              </div>

              {/* Critérios com Seletores */}
              <div className="space-y-3 text-xs">
                {/* 1. Volume de Fluxo Diário (30%) */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700">
                      1. Fluxo Diário <span className="text-slate-400 font-normal">(Peso 30%)</span>
                    </label>
                    <span className="font-extrabold text-blue-600">Nota: {notaFluxo}</span>
                  </div>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    value={notaFluxo}
                    onChange={(e) => setNotaFluxo(Number(e.target.value))}
                  >
                    {OPCOES_FLUXO_DIARIO.map((op) => (
                      <option key={op.nota} value={op.nota}>
                        {op.label} (Nota {op.nota})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Tempo Médio de Espera (35%) */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700">
                      2. Tempo Médio de Espera <span className="text-slate-400 font-normal">(Peso 35%)</span>
                    </label>
                    <span className="font-extrabold text-blue-600">Nota: {notaTempo}</span>
                  </div>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    value={notaTempo}
                    onChange={(e) => setNotaTempo(Number(e.target.value))}
                  >
                    {OPCOES_TEMPO_ESPERA.map((op) => (
                      <option key={op.nota} value={op.nota}>
                        {op.label} (Nota {op.nota})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Poder Aquisitivo / Perfil (20%) */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700">
                      3. Poder Aquisitivo / Perfil do Público <span className="text-slate-400 font-normal">(Peso 20%)</span>
                    </label>
                    <span className="font-extrabold text-blue-600">Nota: {notaPerfil}</span>
                  </div>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    value={notaPerfil}
                    onChange={(e) => setNotaPerfil(Number(e.target.value))}
                  >
                    {OPCOES_PERFIL_PUBLICO.map((op) => (
                      <option key={op.nota} value={op.nota}>
                        {op.label} (Nota {op.nota})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Exclusividade / Ruído Visual (15%) */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700">
                      4. Exclusividade e Ruído Visual <span className="text-slate-400 font-normal">(Peso 15%)</span>
                    </label>
                    <span className="font-extrabold text-blue-600">Nota: {notaExclusividade}</span>
                  </div>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    value={notaExclusividade}
                    onChange={(e) => setNotaExclusividade(Number(e.target.value))}
                  >
                    {OPCOES_EXCLUSIVIDADE.map((op) => (
                      <option key={op.nota} value={op.nota}>
                        {op.label} (Nota {op.nota})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Capacidade de Cotas */}
                <div className="pt-1">
                  <label className="font-bold text-slate-700 block mb-1">
                    Capacidade Máxima de Cotas <span className="text-slate-400 font-normal">(Padrão: 8)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-blue-500"
                    value={maxCotasInput}
                    onChange={(e) => setMaxCotasInput(Math.max(1, Number(e.target.value)))}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Cada anunciante ativo ocupa 1 cota. Ao atingir este número, novos anúncios entram na fila de espera.
                  </p>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="ghost" onClick={() => setScoringModalOpen(false)} disabled={savingScoring}>
                  Cancelar
                </Button>
                <Button variant="gradient" loading={savingScoring} onClick={handleSaveScoring}>
                  Salvar Precificação
                </Button>
              </div>
            </div>
          );
        })()}
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
