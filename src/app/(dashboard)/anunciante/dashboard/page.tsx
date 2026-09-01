"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";

interface UserData {
  id: number;
  nome: string;
  email: string;
  role: "ANUNCIANTE";
}

interface AnuncioItem {
  id: number;
  titulo: string;
  tipoMidia: "VIDEO" | "IMAGEM";
  midiaUrl: string;
  duracaoSegundos: number;
  status: "PENDENTE" | "APROVADO" | "REJEITADO" | "ATIVO" | "PAUSADO";
  motivoRejeicao?: string;
  criadoEm: string;
  pontoMidia: {
    nomeEmpresa: string;
    cidade: string;
    uf: string;
  };
}

export default function AnuncianteDashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const [anuncios, setAnuncios] = useState<AnuncioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [userRes, anunciosRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/anuncios"),
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
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <Spinner size="lg" />
      </div>
    );
  }

  const ativos = anuncios.filter((a) => a.status === "ATIVO");
  const pendentes = anuncios.filter((a) => a.status === "PENDENTE");

  const statusBadge = (status: string) => {
    switch (status) {
      case "ATIVO":
        return <Badge variant="success">Rodando na TV 📺</Badge>;
      case "PENDENTE":
        return <Badge variant="warning">Em Moderação ⏳</Badge>;
      case "REJEITADO":
        return <Badge variant="danger">Rejeitado ❌</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <DashboardLayout
      role="ANUNCIANTE"
      userName={user?.nome || "Anunciante"}
      userEmail={user?.email || ""}
      title="Painel do Anunciante"
      description="Gerencie seus anúncios e acompanhe o status nas telas"
      actions={
        <Link href="/anunciante/mapa">
          <Button size="sm" variant="gradient">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Explorar Pontos no Mapa
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card className="border-l-4 border-l-blue-600">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Anúncios Ativos
                  </p>
                  <h3 className="text-3xl font-black text-slate-900 font-heading mt-1">
                    {ativos.length}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg ring-1 ring-blue-100">
                  📺
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Em Moderação
                  </p>
                  <h3 className="text-3xl font-black text-slate-900 font-heading mt-1">
                    {pendentes.length}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg ring-1 ring-amber-100">
                  ⏳
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border-l-4 border-l-slate-300">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total de Campanhas
                  </p>
                  <h3 className="text-3xl font-black text-slate-900 font-heading mt-1">
                    {anuncios.length}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-lg">
                  📊
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 font-heading">Minhas Campanhas</h3>
                <p className="text-xs text-slate-500">
                  Histórico e status de veiculação em cada ponto de TV
                </p>
              </div>
              <Link href="/anunciante/mapa">
                <Button variant="secondary" size="sm">
                  Novo Anúncio
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {anuncios.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="Nenhum anúncio criado ainda"
                  description="Explore os pontos disponíveis no mapa interativo e escolha onde deseja divulgar seu negócio."
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
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-12 bg-slate-900 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-white text-xs shadow-xs">
                        {anuncio.tipoMidia === "VIDEO" ? (
                          <video
                            src={anuncio.midiaUrl}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={anuncio.midiaUrl}
                            alt={anuncio.titulo}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">
                            {anuncio.titulo}
                          </h4>
                          {statusBadge(anuncio.status)}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Ponto: <span className="font-semibold text-slate-700">{anuncio.pontoMidia.nomeEmpresa}</span> ({anuncio.pontoMidia.cidade}/{anuncio.pontoMidia.uf}) • Formato: <span className="font-semibold text-slate-700">{anuncio.tipoMidia} ({anuncio.duracaoSegundos}s)</span>
                        </p>
                        {anuncio.status === "REJEITADO" && anuncio.motivoRejeicao && (
                          <div className="mt-2 p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                            <strong>Motivo da rejeição:</strong> {anuncio.motivoRejeicao}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 text-right">
                      {new Date(anuncio.criadoEm).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}
