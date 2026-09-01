"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface StatsData {
  totalPontos: number;
  totalAnunciantes: number;
  totalAnuncios: number;
  anunciosPendentes: number;
  anunciosAtivos: number;
  pontosAtivos: number;
}

export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [userRes, statsRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/stats"),
        ]);

        if (userRes.ok) {
          const u = await userRes.json();
          setUser(u.user);
        }
        if (statsRes.ok) {
          const s = await statsRes.json();
          setStats(s);
        }
      } catch (err) {
        console.error("Admin stats error:", err);
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

  return (
    <DashboardLayout
      role="ADMIN"
      userName={user?.nome || "Administrador"}
      userEmail={user?.email || ""}
      title="Painel de Controle Geral"
      description="Supervisão de rede, métricas de crescimento e moderação de conteúdo"
      actions={
        <Link href="/admin/aprovacoes">
          <Button size="sm" variant="gradient">
            Fila de Moderação
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="border-l-4 border-l-amber-500">
            <CardBody>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Aguardando Aprovação
              </p>
              <div className="flex items-baseline justify-between mt-1">
                <h3 className="text-3xl font-black text-amber-600 font-heading">
                  {stats?.anunciosPendentes || 0}
                </h3>
                <span className="text-xs text-slate-400">campanhas</span>
              </div>
            </CardBody>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardBody>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Anúncios no Ar
              </p>
              <div className="flex items-baseline justify-between mt-1">
                <h3 className="text-3xl font-black text-slate-900 font-heading">
                  {stats?.anunciosAtivos || 0}
                </h3>
                <span className="text-xs text-emerald-600 font-bold">ativos nas TVs</span>
              </div>
            </CardBody>
          </Card>

          <Card className="border-l-4 border-l-blue-600">
            <CardBody>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pontos de TV
              </p>
              <div className="flex items-baseline justify-between mt-1">
                <h3 className="text-3xl font-black text-slate-900 font-heading">
                  {stats?.totalPontos || 0}
                </h3>
                <span className="text-xs text-blue-600 font-bold">
                  {stats?.pontosAtivos || 0} ativos
                </span>
              </div>
            </CardBody>
          </Card>

          <Card className="border-l-4 border-l-sky-500">
            <CardBody>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Anunciantes Cadastrados
              </p>
              <div className="flex items-baseline justify-between mt-1">
                <h3 className="text-3xl font-black text-slate-900 font-heading">
                  {stats?.totalAnunciantes || 0}
                </h3>
                <span className="text-xs text-slate-400">empresas</span>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:border-blue-300 transition group">
            <CardBody className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition ring-1 ring-amber-100">
                  ⚖️
                </div>
                <h4 className="font-bold text-slate-900 text-base font-heading">
                  Fila de Moderação
                </h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Avalie vídeos e imagens enviados por anunciantes. Aprove para disparar para as TVs ou rejeite com justificativa.
                </p>
              </div>
              <Link href="/admin/aprovacoes" className="mt-6 block">
                <Button variant="secondary" size="sm" className="w-full">
                  Gerenciar Moderações →
                </Button>
              </Link>
            </CardBody>
          </Card>

          <Card className="hover:border-blue-300 transition group">
            <CardBody className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition ring-1 ring-blue-100">
                  📺
                </div>
                <h4 className="font-bold text-slate-900 text-base font-heading">
                  Gestão de Pontos de TV
                </h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Consulte os estabelecimentos cadastrados, ative novos pontos no mapa ou acesse o player direto de qualquer TV.
                </p>
              </div>
              <Link href="/admin/pontos" className="mt-6 block">
                <Button variant="secondary" size="sm" className="w-full">
                  Ver Pontos de TV →
                </Button>
              </Link>
            </CardBody>
          </Card>

          <Card className="hover:border-blue-300 transition group">
            <CardBody className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition ring-1 ring-sky-100">
                  👥
                </div>
                <h4 className="font-bold text-slate-900 text-base font-heading">
                  Anunciantes e Usuários
                </h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Visualize a base completa de anunciantes, ramos de atuação e gerencie as contas de acesso da plataforma.
                </p>
              </div>
              <Link href="/admin/anunciantes" className="mt-6 block">
                <Button variant="secondary" size="sm" className="w-full">
                  Ver Anunciantes →
                </Button>
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
