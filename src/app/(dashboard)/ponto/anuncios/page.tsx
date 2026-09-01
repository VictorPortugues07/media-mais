"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";

interface AnuncioPonto {
  id: number;
  titulo: string;
  descricao: string;
  tipoMidia: "VIDEO" | "IMAGEM";
  midiaUrl: string;
  duracaoSegundos: number;
  status: "ATIVO" | "PENDENTE" | "PAUSADO";
  criadoEm: string;
  anunciante: {
    nomeEmpresa: string;
    categoria: string;
  };
}

export default function PontoAnunciosPage() {
  const [user, setUser] = useState<any>(null);
  const [anuncios, setAnuncios] = useState<AnuncioPonto[]>([]);
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
        console.error("Load anuncios error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const pontoId = user?.pontoMidia?.id;

  return (
    <DashboardLayout
      role="PONTO"
      userName={user?.nome || "Dono do Ponto"}
      userEmail={user?.email || ""}
      pontoId={pontoId}
      title="Anúncios no seu Televisor"
      description="Visualize todos os anúncios ativos e históricos programados para a sua TV"
      actions={
        pontoId && (
          <Link href={/tv/ + pontoId} target="_blank">
            <Button size="sm" variant="success">
              Abrir Player Fullscreen 📺
            </Button>
          </Link>
        )
      }
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">Anúncios na Grade</h3>
              <p className="text-xs text-slate-500">
                Total de {anuncios.length} anúncio(s) cadastrado(s)
              </p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {anuncios.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="Sua grade de TV ainda não tem anúncios"
                description="Novas campanhas aprovadas aparecerão aqui e entrarão na rotação da tela automaticamente."
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {anuncios.map((anuncio) => (
                <div
                  key={anuncio.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-14 bg-black rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
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
                        <Badge
                          variant={anuncio.status === "ATIVO" ? "success" : "warning"}
                        >
                          {anuncio.status === "ATIVO" ? "Ativo na TV" : anuncio.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{anuncio.descricao}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Empresa:{" "}
                        <span className="font-semibold text-slate-700">
                          {anuncio.anunciante.nomeEmpresa}
                        </span>{" "}
                        • Formato: {anuncio.tipoMidia} ({anuncio.duracaoSegundos}s)
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 text-right">
                    Cadastrado em {new Date(anuncio.criadoEm).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </DashboardLayout>
  );
}
