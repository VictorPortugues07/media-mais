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
  status: "PENDENTE" | "APROVADO" | "REJEITADO" | "ATIVO" | "PAUSADO";
  totalExibicoes?: number;
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
      if (selectedPonto) {
        setPontos((prev) =>
          prev.map((p) =>
            p.id === selectedPonto.id
              ? {
                  ...p,
                  _count: {
                    anuncios: Math.max(0, (p._count?.anuncios ?? 1) - 1),
                  },
                }
              : p
          )
        );
      }
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
              {filtered.map((ponto) => (
                <div
                  key={ponto.id}
                  className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-900 text-sm">{ponto.nomeEmpresa}</h4>
                      <Badge variant={ponto.status === "ATIVO" ? "success" : ponto.status === "PENDENTE" ? "warning" : "default"}>
                        {ponto.status}
                      </Badge>
                      <Badge variant="brand">{ponto.categoria}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {ponto.responsavel} · {ponto.whatsapp}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      📍 {ponto.cidade}/{ponto.uf} · {ponto.fluxoDiarioEstimado} · {ponto.quantidadeTvs ?? 1} TV(s) · {ponto._count?.anuncios ?? 0} anúncio(s)
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleOpenCampaigns(ponto)}
                      className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-100 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Grade ({ponto._count?.anuncios ?? 0})
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
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de Grade da TV */}
      <Modal
        isOpen={Boolean(selectedPonto)}
        onClose={() => !deleting && setSelectedPonto(null)}
        title={`Grade de TV - ${selectedPonto?.nomeEmpresa || "Ponto"}`}
        description="Campanhas vinculadas para veiculação neste televisor"
        size="lg"
      >
        <div className="space-y-4">
          {loadingCampaigns ? (
            <div className="py-12 flex items-center justify-center">
              <Spinner size="md" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              Nenhuma campanha vinculada a esta tela no momento.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
              {campaigns.map((ad) => (
                <div key={ad.id} className="py-3 flex items-center gap-3.5">
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
                      <Badge variant={ad.status === "ATIVO" ? "success" : ad.status === "PENDENTE" ? "warning" : "default"}>
                        {ad.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      Anunciante: {ad.anunciante.nomeEmpresa} · {ad.duracaoSegundos}s
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {ad.totalExibicoes ?? 0} exibições nesta TV
                    </p>
                  </div>
                  <button
                    type="button"
                    title="Remover/Excluir anúncio da TV"
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
              ))}
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
