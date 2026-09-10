"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";

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
              <h3 className="font-bold text-slate-900 font-heading">
                Pontos Cadastrados
                <span className="ml-2 text-sm font-normal text-slate-400">({filtered.length})</span>
              </h3>
              {pendentes > 0 && (
                <p className="text-xs text-amber-600 font-semibold mt-0.5">
                  {pendentes} aguardando aprovação
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-400 transition cursor-pointer"
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
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:border-blue-400 outline-none w-44 transition"
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
            <div className="divide-y divide-slate-100">
              {filtered.map((ponto) => {
                const limite = ponto.limiteTempoSegundos || 360;
                const ocupado = ponto.tempoOcupadoSegundos || 0;
                const perc = Math.min(100, Math.round((ocupado / limite) * 100));

                return (
                  <div
                    key={ponto.id}
                    className="px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60 transition"
                  >
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-sm">{ponto.nomeEmpresa}</h4>
                        <Badge variant={ponto.status === "ATIVO" ? "success" : ponto.status === "PENDENTE" ? "warning" : "default"}>
                          {ponto.status}
                        </Badge>
                        <Badge variant="brand">{ponto.categoria}</Badge>
                        {ponto.tipoDispositivo && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-100">
                            {ponto.tipoDispositivo === "SMART_TV" ? "📺 Smart TV" : ponto.tipoDispositivo === "DESKTOP" ? "🖥️ Monitor / Totem" : ponto.tipoDispositivo}
                            {ponto.resolucaoTela ? ` (${ponto.resolucaoTela})` : ""}
                          </span>
                        )}
                        {!ponto.aceitaNovosAnuncios ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px]">
                            ⛔ Solicitações Bloqueadas
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            ✓ Recebendo Solicitações
                          </span>
                        )}
                        {ponto.quantidadeFilaEspera > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                            ⏳ {ponto.quantidadeFilaEspera} na Fila de Espera
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500">
                        {ponto.responsavel} · {ponto.whatsapp} · 📍 {ponto.cidade}/{ponto.uf} · {ponto.fluxoDiarioEstimado}
                      </p>

                      {/* Medidor do Loop de 6 minutos (360s) */}
                      <div className="max-w-md bg-slate-100 p-2.5 rounded-xl border border-slate-200/80 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-700">
                            Capacidade do Loop da TV (6 min max):
                          </span>
                          <span className="font-extrabold text-slate-800">
                            {ocupado}s / {limite}s ({perc}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              perc >= 100
                                ? "bg-amber-500"
                                : perc > 75
                                ? "bg-blue-600"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${perc}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
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
                        {ponto.aceitaNovosAnuncios ? "🔒 Bloquear Pedidos" : "🔓 Liberar Pedidos"}
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

                      <Link href={`/tv/${ponto.id}`} target="_blank">
                        <Button variant="secondary" size="sm">Ver TV</Button>
                      </Link>

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
                                ? `📅 Saída prevista: ${new Date(ad.dataFim).toLocaleDateString("pt-BR")}`
                                : `📅 Desde ${new Date(ad.criadoEm).toLocaleDateString("pt-BR")}`}
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
                              🚀 Promover para TV
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
