"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";

interface AnuncioPonto {
  id: number;
  titulo: string;
  descricao: string;
  tipoMidia: "VIDEO" | "IMAGEM";
  midiaUrl: string;
  duracaoSegundos: number;
  status: "ATIVO" | "PENDENTE" | "PAUSADO" | "REJEITADO";
  criadoEm: string;
  totalExibicoes?: number;
  exibicoesHoje?: number;
  totalMinutosExibidos?: number;
  ultimaExibicao?: string | null;
  anunciante: { nomeEmpresa: string; categoria: string };
}

function statusConfig(status: string) {
  switch (status) {
    case "ATIVO":    return { variant: "success" as const, label: "Ativo na TV" };
    case "PAUSADO":  return { variant: "default" as const, label: "Pausado" };
    case "PENDENTE": return { variant: "warning" as const, label: "Em Moderação" };
    case "REJEITADO":return { variant: "danger" as const,  label: "Rejeitado" };
    default:         return { variant: "default" as const, label: status };
  }
}

export default function PontoAnunciosPage() {
  const [user, setUser] = useState<any>(null);
  const [anuncios, setAnuncios] = useState<AnuncioPonto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterText, setFilterText] = useState("");
  const [previewAd, setPreviewAd] = useState<AnuncioPonto | null>(null);
  const [removalModalOpen, setRemovalModalOpen] = useState(false);
  const [adToRequestRemoval, setAdToRequestRemoval] = useState<AnuncioPonto | null>(null);
  const [motivoRemocao, setMotivoRemocao] = useState("");
  const [requestingRemoval, setRequestingRemoval] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenRemovalModal = (ad: AnuncioPonto) => {
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
        const [userRes, anunciosRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/anuncios"),
        ]);
        if (userRes.ok) setUser((await userRes.json()).user);
        if (anunciosRes.ok) setAnuncios((await anunciosRes.json()).anuncios || []);
      } catch (err) {
        console.error("Load anuncios error:", err);
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

  const filteredAnuncios = anuncios.filter((a) => {
    const matchStatus = filterStatus === "todos" || a.status === filterStatus;
    const matchText =
      a.titulo.toLowerCase().includes(filterText.toLowerCase()) ||
      a.anunciante.nomeEmpresa.toLowerCase().includes(filterText.toLowerCase());
    return matchStatus && matchText;
  });

  const ativos = anuncios.filter((a) => a.status === "ATIVO").length;
  const pontoId = user?.pontoMidia?.id;

  return (
    <DashboardLayout
      role="PONTO"
      userName={user?.nome || "Dono do Ponto"}
      userEmail={user?.email || ""}
      pontoId={pontoId}
      title="Anúncios na TV"
      description="Grade completa de campanhas veiculadas na sua tela"
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 font-heading">
                Grade de Anúncios
                <span className="ml-2 text-sm font-normal text-slate-400">({filteredAnuncios.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{ativos} ativo(s) em loop na tela</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-400 transition cursor-pointer"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="todos">Todos os status</option>
                <option value="ATIVO">Ativos na TV</option>
                <option value="PENDENTE">Em Moderação</option>
                <option value="PAUSADO">Pausados</option>
                <option value="REJEITADO">Rejeitados</option>
              </select>
              <input
                type="text"
                placeholder="Buscar anúncio ou empresa..."
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:border-blue-400 outline-none w-48 transition"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              >
              </input>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {filteredAnuncios.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="Nenhum anúncio encontrado"
                description={anuncios.length === 0 ? "Campanhas aprovadas aparecerão aqui automaticamente." : "Tente ajustar os filtros de busca."}
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredAnuncios.map((anuncio) => {
                const st = statusConfig(anuncio.status);
                return (
                  <div
                    key={anuncio.id}
                    className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50/60 transition"
                  >
                    {/* Thumbnail clicável */}
                    <button
                      type="button"
                      onClick={() => setPreviewAd(anuncio)}
                      title="Visualizar mídia"
                      className="w-16 h-11 bg-slate-900 rounded-xl overflow-hidden shrink-0 shadow-xs relative group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="font-semibold text-slate-800 text-sm truncate hover:text-blue-600 transition text-left cursor-pointer"
                        >
                          {anuncio.titulo}
                        </button>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {anuncio.anunciante.nomeEmpresa} · {anuncio.tipoMidia === "VIDEO" ? `${anuncio.duracaoSegundos}s` : "Imagem"}
                      </p>

                      {/* Métricas compactas */}
                      {anuncio.status === "ATIVO" && (
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[11px] text-slate-500">
                            <strong className="text-slate-700">{anuncio.exibicoesHoje ?? 0}</strong> hoje
                          </span>
                          <span className="text-slate-200">·</span>
                          <span className="text-[11px] text-slate-500">
                            <strong className="text-slate-700">{anuncio.totalExibicoes ?? 0}</strong> total
                          </span>
                          {(anuncio.totalMinutosExibidos ?? 0) > 0 && (
                            <>
                              <span className="text-slate-200">·</span>
                              <span className="text-[11px] text-slate-500">
                                <strong className="text-slate-700">{anuncio.totalMinutosExibidos}</strong> min
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Data e Ações */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-400 hidden sm:block">
                        {new Date(anuncio.criadoEm).toLocaleDateString("pt-BR")}
                      </span>

                      <button
                        type="button"
                        title="Visualizar peça"
                        onClick={() => setPreviewAd(anuncio)}
                        className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        title="Solicitar remoção deste anúncio da sua TV"
                        onClick={() => handleOpenRemovalModal(anuncio)}
                        className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de Pré-visualização da Peça */}
      <Modal
        isOpen={Boolean(previewAd)}
        onClose={() => setPreviewAd(null)}
        title={previewAd?.titulo || "Visualização da Campanha"}
        description={previewAd ? `Anunciante: ${previewAd.anunciante.nomeEmpresa} · Formato: ${previewAd.tipoMidia} (${previewAd.duracaoSegundos}s)` : ""}
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
                <div className="mt-1">
                  <Badge variant={statusConfig(previewAd.status).variant}>{statusConfig(previewAd.status).label}</Badge>
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Duração</span>
                <p className="font-bold text-slate-800 mt-1">{previewAd.duracaoSegundos}s no loop</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Exibições Hoje</span>
                <p className="font-bold text-slate-800 mt-1">{previewAd.exibicoesHoje ?? 0}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Exibições</span>
                <p className="font-bold text-emerald-700 mt-1">{previewAd.totalExibicoes ?? 0}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
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
        title="Solicitar Remoção de Anúncio"
        description="Envie um pedido à administração para remover esta peça da sua tela."
      >
        <div className="space-y-4">
          {requestError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
              {requestError}
            </div>
          )}

          {adToRequestRemoval && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3.5">
              <div className="w-14 h-10 bg-slate-900 rounded-lg overflow-hidden shrink-0">
                {adToRequestRemoval.tipoMidia === "VIDEO" ? (
                  <video src={adToRequestRemoval.midiaUrl} muted className="w-full h-full object-cover" />
                ) : (
                  <img src={adToRequestRemoval.midiaUrl} alt={adToRequestRemoval.titulo} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-sm truncate">{adToRequestRemoval.titulo}</p>
                <p className="text-xs text-slate-500 truncate">
                  Anunciante: {adToRequestRemoval.anunciante.nomeEmpresa}
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Motivo da Solicitação <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
              placeholder="Explique o motivo (ex: conteúdo inadequado para os clientes deste local, marca concorrente direta, imagem ilegível...)"
              value={motivoRemocao}
              onChange={(e) => setMotivoRemocao(e.target.value)}
            />
          </div>

          <p className="text-xs text-slate-500 leading-relaxed bg-amber-50/70 p-3 rounded-xl border border-amber-200/70 text-amber-900">
            <strong>Como funciona:</strong> Como responsável pelo estabelecimento, sua solicitação é enviada diretamente aos administradores da plataforma. Ao ser revisada, a peça é desvinculada da sua TV e você receberá uma confirmação.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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
