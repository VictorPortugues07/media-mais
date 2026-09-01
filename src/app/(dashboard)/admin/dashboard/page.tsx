"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface AuditoriaAnuncio {
  id: number;
  titulo: string;
  tipoMidia: "VIDEO" | "IMAGEM";
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

export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterCampanha, setFilterCampanha] = useState("");

  const loadData = async () => {
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
  };

  useEffect(() => {
    loadData();

    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <Spinner size="lg" />
      </div>
    );
  }

  const auditoriaFiltrada = (stats?.auditoriaAnuncios || []).filter(
    (a) =>
      a.titulo.toLowerCase().includes(filterCampanha.toLowerCase()) ||
      a.anunciante.toLowerCase().includes(filterCampanha.toLowerCase()) ||
      a.ponto.toLowerCase().includes(filterCampanha.toLowerCase())
  );

  return (
    <DashboardLayout
      role="ADMIN"
      userName={user?.nome || "Administrador"}
      userEmail={user?.email || ""}
      title="Auditoria Geral & Painel de Controle"
      description="Supervisão em tempo real da rede de TVs, telemetria de veiculações e moderação de conteúdo"
      actions={
        <div className="flex items-center gap-2">
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
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI CARDS COM METRIFICAÇÃO EM TEMPO REAL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="border-l-4 border-l-emerald-500">
            <CardBody>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Horas Veiculadas na Rede
              </p>
              <div className="flex items-baseline justify-between mt-1">
                <h3 className="text-3xl font-black text-slate-900 font-heading">
                  {stats?.totalHorasExibidas || "0.0"}h
                </h3>
                <span className="text-xs text-emerald-600 font-bold">
                  {stats?.exibicoesHoje || 0} hoje
                </span>
              </div>
            </CardBody>
          </Card>

          <Card className="border-l-4 border-l-blue-600">
            <CardBody>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total de Reproduções (Proof of Play)
              </p>
              <div className="flex items-baseline justify-between mt-1">
                <h3 className="text-3xl font-black text-slate-900 font-heading">
                  {stats?.totalExibicoes || 0}
                </h3>
                <span className="text-xs text-blue-600 font-bold">
                  comprovadas
                </span>
              </div>
            </CardBody>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardBody>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Aguardando Moderação
              </p>
              <div className="flex items-baseline justify-between mt-1">
                <h3 className="text-3xl font-black text-amber-600 font-heading">
                  {stats?.anunciosPendentes || 0}
                </h3>
                <span className="text-xs text-slate-400">campanhas</span>
              </div>
            </CardBody>
          </Card>

          <Card className="border-l-4 border-l-sky-500">
            <CardBody>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pontos de TV & Telas
              </p>
              <div className="flex items-baseline justify-between mt-1">
                <h3 className="text-3xl font-black text-slate-900 font-heading">
                  {stats?.totalPontos || 0}
                </h3>
                <span className="text-xs text-sky-600 font-bold">
                  {stats?.statusPontosTv?.filter((p) => p.online).length || 0} online agora
                </span>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* STATUS DAS TVS EM TEMPO REAL */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 font-heading">
                  Monitor de Telas & Telemetria em Tempo Real
                </h3>
                <p className="text-xs text-slate-500">
                  Status de conexão, código de pareamento e atividade de cada Smart TV na rede
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-700">
                  {stats?.statusPontosTv?.filter((p) => p.online).length || 0} de {stats?.totalPontos || 0} TVs Online
                </span>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-y border-slate-100">
                  <tr>
                    <th className="p-4">Estabelecimento / Ponto</th>
                    <th className="p-4">Código TV</th>
                    <th className="p-4">Status da Tela</th>
                    <th className="p-4">Último Sinal (Heartbeat)</th>
                    <th className="p-4">Anúncios Ativos</th>
                    <th className="p-4">Exibições Registradas</th>
                    <th className="p-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(stats?.statusPontosTv || []).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4">
                        <span className="font-bold text-slate-900 block text-sm">
                          {p.nomeEmpresa}
                        </span>
                        <span className="text-slate-400 text-[11px]">📍 {p.cidade}</span>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-slate-100 font-mono font-black text-slate-800 rounded-lg border border-slate-200 text-xs">
                          {p.codigoTv || "N/A"}
                        </span>
                      </td>
                      <td className="p-4">
                        {p.status === "PENDENTE" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            Em Moderação
                          </span>
                        ) : p.status === "INATIVO" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            Ponto Inativo
                          </span>
                        ) : p.online ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Transmitindo Ao Vivo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            TV Desconectada
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-500 font-mono">
                        {p.ultimaAtividade
                          ? new Date(p.ultimaAtividade).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })
                          : "Nunca"}
                      </td>
                      <td className="p-4 font-bold text-slate-800">
                        {p.anunciosAtivos} campanha(s)
                      </td>
                      <td className="p-4">
                        <span className="font-black text-blue-600">{p.totalExibicoes}</span> execuções
                      </td>
                      <td className="p-4 text-right">
                        <Link href={`/tv/${p.id}`} target="_blank">
                          <button className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg border border-blue-200 transition cursor-pointer">
                            Ver Tela 📺
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* AUDITORIA COMPLETA DE VEICULAÇÃO DE ANÚNCIOS (COMPROVAÇÃO DE ACORDOS) */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 font-heading">
                  Auditoria de Campanhas & Cumprimento de Acordos
                </h3>
                <p className="text-xs text-slate-500">
                  Relatório metrificado de tempo de exibição e número de veiculações por anunciante
                </p>
              </div>
              <input
                type="text"
                placeholder="Buscar anúncio, empresa ou ponto..."
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 shadow-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none w-full sm:w-64 transition"
                value={filterCampanha}
                onChange={(e) => setFilterCampanha(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-y border-slate-100">
                  <tr>
                    <th className="p-4">Campanha</th>
                    <th className="p-4">Anunciante</th>
                    <th className="p-4">TV Alvo</th>
                    <th className="p-4">Formato / Duração</th>
                    <th className="p-4">Total Exibições</th>
                    <th className="p-4">Tempo Total no Ar</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditoriaFiltrada.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Nenhum registro de veiculação encontrado.
                      </td>
                    </tr>
                  ) : (
                    auditoriaFiltrada.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4">
                          <span className="font-bold text-slate-900 text-sm block">
                            {item.titulo}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-slate-700">
                          {item.anunciante}
                        </td>
                        <td className="p-4 text-slate-600">
                          {item.ponto}
                        </td>
                        <td className="p-4 text-slate-600">
                          <Badge variant="brand">{item.tipoMidia}</Badge> {item.duracaoSegundos}s
                        </td>
                        <td className="p-4">
                          <span className="font-black text-slate-900 text-sm">
                            {item.totalExibicoes}
                          </span>
                          <span className="text-slate-400 text-[11px] block">veiculações</span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-emerald-600 text-sm">
                            {item.tempoTotalMinutos} min
                          </span>
                          <span className="text-slate-400 text-[11px] block">tempo acumulado</span>
                        </td>
                        <td className="p-4">
                          {item.status === "ATIVO" ? (
                            <Badge variant="success">Rodando 🟢</Badge>
                          ) : item.status === "PENDENTE" ? (
                            <Badge variant="warning">Em Aprovação</Badge>
                          ) : (
                            <Badge>{item.status}</Badge>
                          )}
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
    </DashboardLayout>
  );
}
