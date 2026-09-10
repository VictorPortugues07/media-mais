"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";

interface AnuncioPendente {
  id: number;
  titulo: string;
  descricao: string;
  tipoMidia: "VIDEO" | "IMAGEM";
  midiaUrl: string;
  duracaoSegundos: number;
  status: "PENDENTE" | "ATIVO" | "REJEITADO" | "FILA_ESPERA";
  posicaoFila?: number | null;
  criadoEm: string;
  anunciante: {
    nomeEmpresa: string;
    categoria: string;
    userId: number;
  };
  pontoMidia: {
    nomeEmpresa: string;
    cidade: string;
    uf: string;
    userId: number;
  };
}

export default function AdminAprovacoesPage() {
  const [user, setUser] = useState<any>(null);
  const [anuncios, setAnuncios] = useState<AnuncioPendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"PENDENTES" | "FILA_ESPERA">("PENDENTES");

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [adToDelete, setAdToDelete] = useState<AnuncioPendente | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [selectedAdId, setSelectedAdId] = useState<number | null>(null);
  const [diasValidade, setDiasValidade] = useState<number>(30);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadAnuncios = async () => {
    try {
      const [userRes, pendentesRes, filaRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/anuncios?status=PENDENTE"),
        fetch("/api/anuncios?status=FILA_ESPERA"),
      ]);

      if (userRes.ok) {
        const u = await userRes.json();
        setUser(u.user);
      }

      const pData = pendentesRes.ok ? await pendentesRes.json() : { anuncios: [] };
      const fData = filaRes.ok ? await filaRes.json() : { anuncios: [] };

      setAnuncios([...(pData.anuncios || []), ...(fData.anuncios || [])]);
    } catch (err) {
      console.error("Load pendentes error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnuncios();
  }, []);

  const handleAprovar = async (id: number, force = false) => {
    setActionLoading(id);
    setApproveError(null);
    try {
      const res = await fetch(`/api/anuncios/${id}/aprovar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diasValidade, force }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.code === "CAPACIDADE_EXCEDIDA") {
          setApproveError(data.error);
          return;
        }
        throw new Error(data.error || "Erro ao aprovar anúncio");
      }

      setAnuncios((prev) => prev.filter((a) => a.id !== id));
      setApproveModalOpen(false);
      setSelectedAdId(null);
      setToastMessage("Campanha aprovada e liberada na TV com sucesso!");
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao aprovar";
      setApproveError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMoverParaFila = async (id: number) => {
    setActionLoading(id);
    setApproveError(null);
    try {
      const res = await fetch(`/api/anuncios/${id}/aprovar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "FILA_ESPERA" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao mover para a fila");

      setAnuncios((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "FILA_ESPERA" as const } : a))
      );
      setApproveModalOpen(false);
      setSelectedAdId(null);
      setToastMessage("Anúncio movido para a Fila de Espera com sucesso!");
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao mover para a fila";
      setApproveError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenApprove = (id: number) => {
    setSelectedAdId(id);
    setDiasValidade(30);
    setApproveError(null);
    setApproveModalOpen(true);
  };

  const handleOpenReject = (id: number) => {
    setSelectedAdId(id);
    setMotivoRejeicao("");
    setRejectModalOpen(true);
  };

  const handleOpenDelete = (ad: AnuncioPendente) => {
    setAdToDelete(ad);
    setDeleteError("");
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!adToDelete) return;

    setActionLoading(adToDelete.id);
    setDeleteError("");
    try {
      const res = await fetch(`/api/anuncios/${adToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir anúncio");

      setAnuncios((prev) => prev.filter((a) => a.id !== adToDelete.id));
      setDeleteModalOpen(false);
      setAdToDelete(null);
      setToastMessage("Anúncio excluído definitivamente com sucesso!");
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao excluir anúncio";
      setDeleteError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedAdId || !motivoRejeicao.trim()) return;

    setActionLoading(selectedAdId);
    try {
      const res = await fetch(`/api/anuncios/${selectedAdId}/rejeitar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: motivoRejeicao }),
      });
      if (res.ok) {
        setAnuncios((prev) => prev.filter((a) => a.id !== selectedAdId));
        setRejectModalOpen(false);
        setToastMessage("Campanha recusada e anunciante notificado!");
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error("Rejeitar error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <Spinner size="lg" />
      </div>
    );
  }

  const pendentesList = anuncios.filter((a) => a.status === "PENDENTE");
  const filaList = anuncios.filter((a) => a.status === "FILA_ESPERA");
  const currentList = activeTab === "PENDENTES" ? pendentesList : filaList;

  return (
    <DashboardLayout
      role="ADMIN"
      userName={user?.nome || "Administrador"}
      userEmail={user?.email || ""}
      title="Fila de Moderação e Auditoria"
      description="Revise peças de mídia antes de liberá-las para os televisores ou organize a fila de espera"
    >
      <div className="space-y-6">
        {/* Abas de Navegação */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("PENDENTES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === "PENDENTES"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>📋 Moderação Pendente</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === "PENDENTES" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-800"
            }`}>
              {pendentesList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("FILA_ESPERA")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === "FILA_ESPERA"
                ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>⏳ Fila de Espera dos Pontos</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === "FILA_ESPERA" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-800"
            }`}>
              {filaList.length}
            </span>
          </button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 font-heading">
                  {activeTab === "PENDENTES"
                    ? `Campanhas Aguardando Avaliação (${pendentesList.length})`
                    : `Empresas na Fila de Espera (${filaList.length})`}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeTab === "PENDENTES"
                    ? "Valide o conteúdo antes de liberar na grade de 6 minutos da TV."
                    : "Empresas aguardando abertura de novas vagas nos estabelecimentos selecionados."}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {currentList.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  title={
                    activeTab === "PENDENTES"
                      ? "Fila de aprovação zerada! 🎉"
                      : "Nenhuma empresa na fila de espera no momento."
                  }
                  description={
                    activeTab === "PENDENTES"
                      ? "Todas as peças enviadas já foram moderadas pela equipe."
                      : "Todas as solicitações de anúncios estão acomodadas ou já foram avaliadas."
                  }
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {currentList.map((anuncio, idx) => (
                  <div
                    key={anuncio.id}
                    className="p-6 flex flex-col lg:flex-row gap-6 hover:bg-slate-50/50 transition"
                  >
                    <div className="w-full lg:w-80 shrink-0">
                      <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-sm flex items-center justify-center relative">
                        {anuncio.tipoMidia === "VIDEO" ? (
                          <video
                            src={anuncio.midiaUrl}
                            controls
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <img
                            src={anuncio.midiaUrl}
                            alt={anuncio.titulo}
                            className="w-full h-full object-contain"
                          />
                        )}
                        <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-xs">
                          {anuncio.tipoMidia} • {anuncio.duracaoSegundos}s
                        </span>
                        {anuncio.status === "FILA_ESPERA" && (
                          <span className="absolute bottom-2 left-2 bg-amber-600/90 text-white text-[10px] font-black px-2 py-0.5 rounded-lg backdrop-blur-xs">
                            Fila #{anuncio.posicaoFila || idx + 1}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-900 font-heading">
                            {anuncio.titulo}
                          </h4>
                          <Badge variant={anuncio.status === "FILA_ESPERA" ? "warning" : "default"}>
                            {anuncio.status === "FILA_ESPERA" ? "Fila de Espera" : "Aguardando Moderação"}
                          </Badge>
                        </div>

                        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                          {anuncio.descricao}
                        </p>

                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                          <div>
                            <span className="font-bold text-slate-400 uppercase text-[10px]">
                              Anunciante
                            </span>
                            <p className="font-bold text-slate-900 mt-0.5">
                              {anuncio.anunciante.nomeEmpresa}
                            </p>
                            <p className="text-slate-500">{anuncio.anunciante.categoria}</p>
                          </div>
                          <div>
                            <span className="font-bold text-slate-400 uppercase text-[10px]">
                              TV de Destino
                            </span>
                            <p className="font-bold text-slate-900 mt-0.5">
                              {anuncio.pontoMidia.nomeEmpresa}
                            </p>
                            <p className="text-slate-500">
                              {anuncio.pontoMidia.cidade} - {anuncio.pontoMidia.uf}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center gap-3 flex-wrap">
                        <Button
                          variant="success"
                          size="md"
                          loading={actionLoading === anuncio.id}
                          onClick={() => handleOpenApprove(anuncio.id)}
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {anuncio.status === "FILA_ESPERA" ? "Liberar na TV Agora" : "Aprovar e Liberar na TV"}
                        </Button>

                        {anuncio.status === "PENDENTE" && (
                          <Button
                            variant="secondary"
                            size="md"
                            disabled={actionLoading === anuncio.id}
                            onClick={() => handleMoverParaFila(anuncio.id)}
                          >
                            ⏳ Mover para Fila
                          </Button>
                        )}

                        <Button
                          variant="danger"
                          size="md"
                          disabled={actionLoading === anuncio.id}
                          onClick={() => handleOpenReject(anuncio.id)}
                        >
                          Rejeitar Peça
                        </Button>

                        <button
                          type="button"
                          title="Excluir campanha definitivamente"
                          disabled={actionLoading === anuncio.id}
                          onClick={() => handleOpenDelete(anuncio)}
                          className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Modal de Aprovação com Definição de Período da Campanha */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="Confirmar Aprovação da Campanha"
        description="Defina o período de veiculação na grade de 6 minutos da TV."
      >
        <div className="space-y-4">
          {approveError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-800 space-y-2">
              <p>{approveError}</p>
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => selectedAdId && handleMoverParaFila(selectedAdId)}
                >
                  Mover para Fila de Espera
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => selectedAdId && handleAprovar(selectedAdId, true)}
                >
                  Forçar Inclusão na Grade
                </Button>
              </div>
            </div>
          )}

          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed">
            Ao aprovar, a peça entrará no loop de exibição da TV imediatamente. Anunciante e dono da tela serão notificados.
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Tempo de Contrato / Veiculação da Campanha
            </label>
            <select
              value={diasValidade}
              onChange={(e) => setDiasValidade(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 bg-white outline-none focus:border-blue-500 transition"
            >
              <option value={15}>15 dias (Campanha curta)</option>
              <option value={30}>30 dias / 1 mês (Padrão)</option>
              <option value={60}>60 dias / 2 meses</option>
              <option value={90}>90 dias / 3 meses (Trimestral)</option>
              <option value={180}>180 dias / 6 meses (Semestral)</option>
              <option value={365}>365 dias / 1 ano (Anual)</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              O sistema registrará a data de término prevista para organizar a entrada de novas empresas na fila de espera.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setApproveModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="success"
              loading={actionLoading === selectedAdId}
              onClick={() => selectedAdId && handleAprovar(selectedAdId)}
            >
              Confirmar e Liberar na TV
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Rejeitar Campanha"
        description="Explique o motivo para que o anunciante possa corrigir e reenviar a peça."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Motivo da Recusa
            </label>
            <textarea
              rows={4}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition"
              placeholder="Ex: A resolução do vídeo está baixa, áudio com direitos autorais, texto ilegível para TV..."
              value={motivoRejeicao}
              onChange={(e) => setMotivoRejeicao(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setRejectModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              disabled={!motivoRejeicao.trim()}
              loading={actionLoading === selectedAdId}
              onClick={handleConfirmReject}
            >
              Confirmar Rejeição
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Exclusão Definitiva */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => actionLoading !== adToDelete?.id && setDeleteModalOpen(false)}
        title="Excluir Campanha Definitivamente"
        description="Esta ação apagará permanentemente o anúncio e a mídia do servidor."
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
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-sm truncate">{adToDelete.titulo}</p>
                <p className="text-xs text-slate-500 truncate">
                  {adToDelete.anunciante.nomeEmpresa} → {adToDelete.pontoMidia.nomeEmpresa}
                </p>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-600 leading-relaxed">
            O arquivo físico de mídia será apagado do servidor e o registro do anúncio será excluído. O anunciante será notificado sobre a remoção.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setDeleteModalOpen(false)} disabled={actionLoading === adToDelete?.id}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={actionLoading === adToDelete?.id}
              onClick={handleConfirmDelete}
            >
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
