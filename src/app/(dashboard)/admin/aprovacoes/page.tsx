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
  status: "PENDENTE" | "ATIVO" | "REJEITADO";
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

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedAdId, setSelectedAdId] = useState<number | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");

  const loadAnuncios = async () => {
    try {
      const [userRes, anunciosRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/anuncios?status=PENDENTE"),
      ]);

      if (userRes.ok) {
        const u = await userRes.json();
        setUser(u.user);
      }
      if (anunciosRes.ok) {
        const a = await anunciosRes.json();
        setAnuncios(a.anuncios || []);
      }
    } catch (err) {
      console.error("Load pendentes error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnuncios();
  }, []);

  const handleAprovar = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/anuncios/${id}/aprovar`, {
        method: "PATCH",
      });
      if (res.ok) {
        setAnuncios((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error("Aprovar error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenReject = (id: number) => {
    setSelectedAdId(id);
    setMotivoRejeicao("");
    setRejectModalOpen(true);
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

  return (
    <DashboardLayout
      role="ADMIN"
      userName={user?.nome || "Administrador"}
      userEmail={user?.email || ""}
      title="Fila de Moderação e Aprovação"
      description="Revise peças de mídia antes de liberá-las para os televisores"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 font-heading">
                  Campanhas Pendentes ({anuncios.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Ao aprovar, a TV começará a exibir a peça imediatamente e ambos os usuários serão notificados.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {anuncios.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  title="Fila de aprovação vazia! 🎉"
                  description="Todas as peças enviadas já foram moderadas e estão ativas na rede."
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {anuncios.map((anuncio) => (
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
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-900 font-heading">
                            {anuncio.titulo}
                          </h4>
                          <Badge variant="warning">Aguardando Avaliação</Badge>
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

                      <div className="mt-6 flex items-center gap-3">
                        <Button
                          variant="success"
                          size="md"
                          loading={actionLoading === anuncio.id}
                          onClick={() => handleAprovar(anuncio.id)}
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Aprovar e Liberar na TV
                        </Button>

                        <Button
                          variant="danger"
                          size="md"
                          disabled={actionLoading === anuncio.id}
                          onClick={() => handleOpenReject(anuncio.id)}
                        >
                          Rejeitar Peça
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

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
    </DashboardLayout>
  );
}
