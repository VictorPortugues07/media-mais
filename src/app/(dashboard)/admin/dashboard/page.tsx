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
  anunciosAtivos: number;
  totalExibicoes: number;
}

interface StatsData {
  totalPontos: number;
  totalAnunciantes: number;
  totalAnuncios: number;
  anunciosPendentes: number;
  anunciosAtivos: number;
  pontosAtivos: number;
  totalExibicoes: number;
  totalHorasExibidas: string;
  exibicoesHoje: number;
  auditoriaAnuncios?: AuditoriaAnuncio[];
  statusPontosTv?: StatusPontoTv[];
}

function TVStatusBadge({ ponto }: { ponto: StatusPontoTv }) {
  if (ponto.status === "PENDENTE") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
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
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Ao Vivo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
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
              icon: "⏱", color: "text-emerald-600",
            },
            {
              label: "Reproduções Totais",
              value: (stats?.totalExibicoes ?? 0).toLocaleString("pt-BR"),
              sub: "proof of play acumulado",
              icon: "🎬", color: "text-blue-600",
            },
            {
              label: "Aguardando Moderação",
              value: stats?.anunciosPendentes ?? 0,
              sub: "campanhas pendentes",
              icon: "⏳", color: stats?.anunciosPendentes ? "text-amber-600" : "text-slate-600",
            },
            {
              label: "TVs na Rede",
              value: stats?.totalPontos ?? 0,
              sub: `${tvOnlineCount} online agora`,
              icon: "📺", color: "text-sky-600",
            },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardBody>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider leading-tight">{kpi.label}</p>
                    <p className={`text-3xl font-black font-heading mt-1.5 ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{kpi.sub}</p>
                  </div>
                  <span className="text-2xl shrink-0 mt-0.5">{kpi.icon}</span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* ── Monitor de TVs em Grid ────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 font-heading">Monitor de Telas</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Status em tempo real · {tvOnlineCount} de {tvs.length} online
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-600">{tvOnlineCount} ao vivo</span>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-4">
            {tvs.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-8">Nenhuma TV cadastrada ainda.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {tvs.map((tv) => (
                  <div
                    key={tv.id}
                    className={`rounded-2xl border p-4 flex flex-col gap-3 transition ${
                      tv.online
                        ? "border-emerald-200 bg-emerald-50/40"
                        : "border-slate-200 bg-white hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{tv.nomeEmpresa}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">📍 {tv.cidade}</p>
                      </div>
                      <TVStatusBadge ponto={tv} />
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="px-2 py-0.5 bg-slate-100 font-mono font-black text-slate-700 rounded-lg border border-slate-200">
                        {tv.codigoTv || "N/A"}
                      </span>
                      <span className="text-slate-400">
                        {tv.ultimaAtividade
                          ? new Date(tv.ultimaAtividade).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                          : "Nunca conectou"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        <strong className="text-slate-800">{tv.anunciosAtivos}</strong> anúncio(s) ·{" "}
                        <strong className="text-slate-800">{tv.totalExibicoes}</strong> exib.
                      </span>
                      <Link href={`/tv/${tv.id}`} target="_blank">
                        <button className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg border border-blue-100 text-[11px] transition cursor-pointer">
                          Ver TV
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
                <h3 className="font-bold text-slate-900 font-heading">
                  Auditoria de Campanhas
                  <span className="ml-2 text-sm font-normal text-slate-400">
                    ({auditoriaFiltrada.length})
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Veiculações e tempo no ar por campanha</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-400 transition cursor-pointer"
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
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 outline-none w-full sm:w-56 transition"
                  value={filterCampanha}
                  onChange={(e) => setFilterCampanha(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-y border-slate-100">
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
                <tbody className="divide-y divide-slate-100">
                  {auditoriaFiltrada.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                        Nenhum registro encontrado.
                      </td>
                    </tr>
                  ) : (
                    auditoriaFiltrada.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-5 py-3">
                          <button
                            type="button"
                            onClick={() => setPreviewAd(item)}
                            className="font-semibold text-slate-800 hover:text-blue-600 transition text-left cursor-pointer"
                          >
                            {item.titulo}
                          </button>
                        </td>
                        <td className="px-5 py-3 text-slate-600">{item.anunciante}</td>
                        <td className="px-5 py-3 text-slate-500 text-[11px] max-w-[140px] truncate">{item.ponto}</td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-bold border border-blue-100">
                            {item.tipoMidia}
                          </span>
                          <span className="ml-1 text-slate-400">{item.duracaoSegundos}s</span>
                        </td>
                        <td className="px-5 py-3 text-right font-black text-slate-800">{item.totalExibicoes}</td>
                        <td className="px-5 py-3 text-right font-semibold text-emerald-700">{item.tempoTotalMinutos} min</td>
                        <td className="px-5 py-3 text-right">
                          {item.status === "ATIVO" ? (
                            <Badge variant="success">Ativo</Badge>
                          ) : item.status === "PENDENTE" ? (
                            <Badge variant="warning">Pendente</Badge>
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
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
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
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
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
