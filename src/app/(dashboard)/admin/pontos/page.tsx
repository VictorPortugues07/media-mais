"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

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
  _count?: {
    anuncios: number;
  };
}

export default function AdminPontosPage() {
  const [user, setUser] = useState<any>(null);
  const [pontos, setPontos] = useState<PontoAdminItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPontos = async () => {
    try {
      const [userRes, pontosRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/pontos?status="),
      ]);

      if (userRes.ok) {
        const u = await userRes.json();
        setUser(u.user);
      }
      if (pontosRes.ok) {
        const p = await pontosRes.json();
        setPontos(p.pontos || []);
      }
    } catch (err) {
      console.error("Load pontos admin error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPontos();
  }, []);

  const handleUpdateStatus = async (id: number, nextStatus: "PENDENTE" | "ATIVO" | "INATIVO") => {
    try {
      const res = await fetch(`/api/pontos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setPontos((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: nextStatus } : p))
        );
      }
    } catch (err) {
      console.error("Update status error:", err);
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
      title="Gestão de Pontos de TV"
      description="Todos os estabelecimentos com telas integradas à plataforma Media+"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 font-heading">
                Pontos Cadastrados ({pontos.length})
              </h3>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <div className="divide-y divide-slate-200">
            {pontos.map((ponto) => (
              <div
                key={ponto.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">
                      {ponto.nomeEmpresa}
                    </h4>
                    <Badge variant={ponto.status === "ATIVO" ? "success" : "default"}>
                      {ponto.status}
                    </Badge>
                    <Badge variant="brand">{ponto.categoria}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Responsável: <span className="font-semibold text-slate-700">{ponto.responsavel}</span> • WhatsApp: {ponto.whatsapp}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    📍 {ponto.cidade}/{ponto.uf} • Fluxo diário: {ponto.fluxoDiarioEstimado} • {ponto.quantidadeTvs || 1} TV(s)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/tv/${ponto.id}`} target="_blank">
                    <Button variant="secondary" size="sm">
                      Abrir TV 📺
                    </Button>
                  </Link>

                  {ponto.status === "PENDENTE" && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleUpdateStatus(ponto.id, "ATIVO")}
                    >
                      Aprovar Ponto ✓
                    </Button>
                  )}

                  {ponto.status === "ATIVO" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpdateStatus(ponto.id, "INATIVO")}
                    >
                      Desativar
                    </Button>
                  )}

                  {ponto.status === "INATIVO" && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleUpdateStatus(ponto.id, "ATIVO")}
                    >
                      Reativar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </DashboardLayout>
  );
}
