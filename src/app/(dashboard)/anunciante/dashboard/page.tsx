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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Ao Vivo
      </span>
    );
  }
  if (status === "ATIVO") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        Ativo
      </span>
    );
  }
  if (status === "FILA_ESPERA") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        Fila de Espera {posicaoFila ? `#${posicaoFila}` : ""}
      </span>
    );
  }
  if (status === "PENDENTE") return <Badge variant="warning">Moderação</Badge>;
  if (status === "REJEITADO") return <Badge variant="danger">Rejeitado</Badge>;
  return <Badge>{status}</Badge>;
}

export default function AnuncianteDashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const [anuncios, setAnuncios] = useState<AnuncioItem[]>([]);
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
        const [userRes, anunciosRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/anuncios"),
        ]);
        if (userRes.ok) setUser((await userRes.json()).user);
        if (anunciosRes.ok) setAnuncios((await anunciosRes.json()).anuncios || []);
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
              icon: "📺", color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-100",
            },
            {
              label: "Fila de Espera", value: naFila.length, sub: "aguardando vagas",
              icon: "⏳", color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-100",
            },
            {
              label: "Em Moderação", value: pendentes.length, sub: "em análise pela equipe",
              icon: "📋", color: "text-indigo-600", bg: "bg-indigo-50", ring: "ring-indigo-100",
            },
            {
              label: "Total Exibições", value: totalExibicoes.toLocaleString("pt-BR"), sub: "reproduções acumuladas",
              icon: "📊", color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-100",
            },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardBody>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                    <p className={`text-3xl font-black font-heading mt-1.5 ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{kpi.sub}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 ${kpi.bg} ring-1 ${kpi.ring}`}>
                    {kpi.icon}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* ── Campanhas ────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 font-heading">Minhas Campanhas</h3>
                <p className="text-xs text-slate-400 mt-0.5">Status de veiculação em cada ponto de TV</p>
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
              <div className="divide-y divide-slate-100">
                {anuncios.map((anuncio) => (
                  <div
                    key={anuncio.id}
                    className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50/70 transition"
                  >
                    {/* Thumbnail clicável para preview */}
                    <button
                      type="button"
                      onClick={() => setPreviewAd(anuncio)}
                      title="Clique para visualizar mídia"
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
                        <StatusPill
                          status={anuncio.status}
                          tvOnline={anuncio.pontoMidia.tvOnline}
                          posicaoFila={anuncio.posicaoFila}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {anuncio.pontoMidia.nomeEmpresa} · {anuncio.pontoMidia.cidade}/{anuncio.pontoMidia.uf}
                      </p>

                      {/* Métricas — só para ativos */}
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
                                <strong className="text-slate-700">{anuncio.totalMinutosExibidos}</strong> min no ar
                              </span>
                            </>
                          )}
                        </div>
                      )}

                      {anuncio.status === "REJEITADO" && anuncio.motivoRejeicao && (
                        <p className="text-[11px] text-red-600 mt-1 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100 inline-block">
                          {anuncio.motivoRejeicao}
                        </p>
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
                        title="Solicitar remoção desta campanha"
                        onClick={() => handleOpenRemovalModal(anuncio)}
                        className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
                <div className="mt-1">
                  <StatusPill status={previewAd.status} tvOnline={previewAd.pontoMidia.tvOnline} />
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Duração</span>
                <p className="font-bold text-slate-800 mt-1">{previewAd.duracaoSegundos} segundos</p>
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

            {previewAd.status === "REJEITADO" && previewAd.motivoRejeicao && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                <strong>Motivo da Recusa:</strong> {previewAd.motivoRejeicao}
              </div>
            )}

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
        title="Solicitar Remoção de Campanha"
        description="Envie um pedido à administração para remover ou desvincular este anúncio."
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
                  Ponto: {adToRequestRemoval.pontoMidia.nomeEmpresa} ({adToRequestRemoval.pontoMidia.cidade})
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
              placeholder="Explique o motivo para remoção (ex: encerramento antecipado da campanha, alteração de material, erro na veiculação...)"
              value={motivoRemocao}
              onChange={(e) => setMotivoRemocao(e.target.value)}
            />
          </div>

          <p className="text-xs text-slate-500 leading-relaxed bg-amber-50/70 p-3 rounded-xl border border-amber-200/70 text-amber-900">
            <strong>Informação importante:</strong> Apenas a administração pode excluir peças ativas da rede. Seu pedido será analisado pela equipe de moderação e a exclusão da mídia e desvinculação da TV serão processadas em seguida.
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
