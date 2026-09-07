"use client";

import React, { useEffect, useState } from "react";
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
  pontoMidia: { nomeEmpresa: string; cidade: string; uf: string };
  criadoEm: string;
}

interface AnuncianteItem {
  id: number;
  nomeEmpresa: string;
  responsavel: string;
  whatsapp: string;
  cidade: string;
  uf: string;
  categoria: string;
  oQueAnunciar: string;
  logoUrl?: string | null;
  criadoEm?: string;
  _count?: { anuncios: number };
}

export default function AdminAnunciantesPage() {
  const [user, setUser] = useState<any>(null);
  const [anunciantes, setAnunciantes] = useState<AnuncianteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");

  // Gestão de campanhas por anunciante
  const [selectedAnunciante, setSelectedAnunciante] = useState<AnuncianteItem | null>(null);
  const [campaigns, setCampaigns] = useState<AnuncioDetail[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [adToDelete, setAdToDelete] = useState<AnuncioDetail | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenCampaigns = async (anu: AnuncianteItem) => {
    setSelectedAnunciante(anu);
    setLoadingCampaigns(true);
    try {
      const res = await fetch(`/api/anuncios?anuncianteId=${anu.id}`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.anuncios || []);
      }
    } catch (err) {
      console.error("Erro ao carregar campanhas:", err);
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
      if (!res.ok) throw new Error(data.error || "Erro ao excluir anúncio");

      setCampaigns((prev) => prev.filter((a) => a.id !== adToDelete.id));
      if (selectedAnunciante) {
        setAnunciantes((prev) =>
          prev.map((anu) =>
            anu.id === selectedAnunciante.id
              ? {
                  ...anu,
                  _count: {
                    anuncios: Math.max(0, (anu._count?.anuncios ?? 1) - 1),
                  },
                }
              : anu
          )
        );
      }
      setAdToDelete(null);
      setToastMessage("Anúncio excluído com sucesso!");
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao excluir anúncio";
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const [uRes, aRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/anunciantes"),
        ]);
        if (uRes.ok) setUser((await uRes.json()).user);
        if (aRes.ok) setAnunciantes((await aRes.json()).anunciantes || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  const filtered = anunciantes.filter(
    (a) =>
      a.nomeEmpresa.toLowerCase().includes(filterText.toLowerCase()) ||
      a.cidade.toLowerCase().includes(filterText.toLowerCase()) ||
      a.categoria.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <DashboardLayout
      role="ADMIN"
      userName={user?.nome || "Administrador"}
      userEmail={user?.email || ""}
      title="Anunciantes"
      description="Empresas e marcas cadastradas na plataforma"
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 font-heading">
                Anunciantes Cadastrados
                <span className="ml-2 text-sm font-normal text-slate-400">({filtered.length})</span>
              </h3>
            </div>
            <input
              type="text"
              placeholder="Buscar empresa, cidade..."
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:border-blue-400 outline-none w-full sm:w-52 transition"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {filtered.length === 0 ? (
            <div className="p-10">
              <EmptyState title="Nenhum anunciante encontrado" description="Tente ajustar a busca." />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((anu) => (
                <div
                  key={anu.id}
                  className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50/60 transition"
                >
                  {/* Avatar / Logo */}
                  {anu.logoUrl ? (
                    <img
                      src={anu.logoUrl}
                      alt={anu.nomeEmpresa}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                      {anu.nomeEmpresa.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-900 text-sm">{anu.nomeEmpresa}</p>
                      <Badge variant="brand">{anu.categoria}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {anu.responsavel} · {anu.whatsapp}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      📍 {anu.cidade}/{anu.uf} · {anu.oQueAnunciar}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-black text-slate-800 text-lg">{anu._count?.anuncios ?? 0}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">campanha(s)</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenCampaigns(anu)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-blue-100"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Ver Campanhas
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de Lista de Campanhas do Anunciante */}
      <Modal
        isOpen={Boolean(selectedAnunciante)}
        onClose={() => !deleting && setSelectedAnunciante(null)}
        title={`Campanhas de ${selectedAnunciante?.nomeEmpresa || "Anunciante"}`}
        description="Visualize e gerencie os anúncios veiculados por esta conta"
        size="lg"
      >
        <div className="space-y-4">
          {loadingCampaigns ? (
            <div className="py-12 flex items-center justify-center">
              <Spinner size="md" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              Nenhuma campanha cadastrada para este anunciante.
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
                      TV: {ad.pontoMidia.nomeEmpresa} ({ad.pontoMidia.cidade}/{ad.pontoMidia.uf}) · {ad.duracaoSegundos}s
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {ad.totalExibicoes ?? 0} exibições acumuladas
                    </p>
                  </div>
                  <button
                    type="button"
                    title="Excluir campanha"
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
            <Button variant="ghost" size="sm" onClick={() => setSelectedAnunciante(null)}>
              Fechar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={Boolean(adToDelete)}
        onClose={() => !deleting && setAdToDelete(null)}
        title="Excluir Campanha Definitivamente"
        description="Esta ação removerá a campanha da plataforma e apagará o arquivo do servidor."
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
                  TV: {adToDelete.pontoMidia.nomeEmpresa} ({adToDelete.pontoMidia.cidade})
                </p>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-600 leading-relaxed">
            Ao confirmar, o anúncio será <strong>apagado permanentemente</strong> do banco de dados e do disco.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setAdToDelete(null)} disabled={deleting}>
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
