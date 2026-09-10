"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import type { PontoMapItem } from "@/components/maps/PointsMap";

const PointsMap = dynamic(() => import("@/components/maps/PointsMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[550px] flex flex-col items-center justify-center bg-slate-100 rounded-2xl gap-3">
      <Spinner size="lg" />
      <p className="text-xs text-slate-500 font-medium">Carregando mapa…</p>
    </div>
  ),
});

export default function AnuncianteMapaPage() {
  const [user, setUser] = useState<any>(null);
  const [pontos, setPontos] = useState<PontoMapItem[]>([]);
  const [selectedPonto, setSelectedPonto] = useState<PontoMapItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterCidade, setFilterCidade] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [userRes, pontosRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/pontos?status=ATIVO"),
        ]);

        if (userRes.ok) {
          const u = await userRes.json();
          setUser(u.user);
        }
        if (pontosRes.ok) {
          const p = await pontosRes.json();
          setPontos(p.pontos || []);
          if (p.pontos && p.pontos.length > 0) {
            setSelectedPonto(p.pontos[0]);
          }
        }
      } catch (err) {
        console.error("Map load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredPontos = pontos.filter((p) =>
    filterCidade
      ? p.cidade.toLowerCase().includes(filterCidade.toLowerCase())
      : true
  );

  return (
    <DashboardLayout
      role="ANUNCIANTE"
      userName={user?.nome || "Anunciante"}
      userEmail={user?.email || ""}
      title="Mapa de Telas Disponíveis"
      description="Selecione um estabelecimento para visualizar a audiência e enviar seu anúncio"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Filtrar por cidade..."
              className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 shadow-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none w-full sm:w-64 transition"
              value={filterCidade}
              onChange={(e) => setFilterCidade(e.target.value)}
            />
            <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">
              {filteredPontos.length} ponto(s) ativo(s)
            </span>
          </div>

          <div className="h-[550px] w-full">
            <PointsMap
              pontos={filteredPontos}
              selectedPontoId={selectedPonto?.id}
              onSelectPonto={(p) => setSelectedPonto(p)}
            />
          </div>
        </div>

        <div className="lg:col-span-5 xl:col-span-4">
          {selectedPonto ? (
            <Card className="shadow-md border-blue-100">
              <CardHeader className="bg-blue-50/50">
                <div className="flex items-start gap-3">
                  {selectedPonto.fotos && selectedPonto.fotos.length > 0 ? (
                    <img
                      src={selectedPonto.fotos[0]}
                      alt={selectedPonto.nomeEmpresa}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-md shrink-0">
                      {selectedPonto.nomeEmpresa.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Badge variant="brand">{selectedPonto.categoria}</Badge>
                    <h3 className="text-lg font-bold text-slate-900 font-heading mt-1 truncate">
                      {selectedPonto.nomeEmpresa}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      📍 {selectedPonto.rua}, {selectedPonto.numero} - {selectedPonto.bairro}, {selectedPonto.cidade} - {selectedPonto.uf}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                {/* Galeria de Fotos em Destaque Vistoso */}
                {selectedPonto.fotos && selectedPonto.fotos.length > 0 ? (
                  <div>
                    <p className="text-xs font-bold text-slate-700 mb-2">
                      Fotos do Estabelecimento & Posicionamento da TV:
                    </p>
                    {/* Imagem Principal Grande */}
                    <div className="rounded-2xl overflow-hidden aspect-video border border-slate-200 bg-slate-950 shadow-sm mb-2 group relative">
                      <img
                        src={selectedPonto.fotos[0]}
                        alt="Foto Principal"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <span className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                        Foto Principal da TV
                      </span>
                    </div>

                    {/* Miniaturas Adicionais */}
                    {selectedPonto.fotos.length > 1 && (
                      <div className="grid grid-cols-3 gap-2">
                        {selectedPonto.fotos.slice(1, 4).map((foto, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl overflow-hidden aspect-video border border-slate-200 bg-slate-900 shadow-xs hover:border-blue-500 transition"
                          >
                            <img
                              src={foto}
                              alt={`Espaço ${idx + 2}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
                    Nenhuma foto cadastrada para este ponto ainda.
                  </div>
                )}

                {/* Indicador de Capacidade do Loop e Fila */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Loop da TV (Máx 6 min):</span>
                    {selectedPonto.aceitaNovosAnuncios === false ? (
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-extrabold text-[10px]">
                        ⛔ Solicitações Pausadas
                      </span>
                    ) : (selectedPonto.tempoOcupadoSegundos || 0) >= (selectedPonto.limiteTempoSegundos || 360) ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-extrabold text-[10px]">
                        ⏳ Fila de Espera ({selectedPonto.quantidadeFilaEspera || 0})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                        ✓ {selectedPonto.tempoDisponivelSegundos || 360}s disponíveis
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, selectedPonto.porcentagemOcupada || 0)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400">
                      Fluxo Diário
                    </p>
                    <p className="text-sm font-black text-slate-800 mt-0.5 font-heading">
                      {selectedPonto.fluxoDiarioEstimado}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400">
                      Permanência
                    </p>
                    <p className="text-sm font-black text-slate-800 mt-0.5 font-heading">
                      {selectedPonto.tempoPermanencia}
                    </p>
                  </div>
                </div>

                {selectedPonto.faixaEtariaPublico && selectedPonto.faixaEtariaPublico.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-700 mb-1.5">
                      Público Predominante:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPonto.faixaEtariaPublico.map((f) => (
                        <span
                          key={f}
                          className="bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-100"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <Link
                    href={`/anunciante/anuncios/novo?pontoId=${selectedPonto.id}`}
                    className="block w-full"
                  >
                    <Button
                      size="lg"
                      variant={selectedPonto.aceitaNovosAnuncios === false ? "secondary" : "gradient"}
                      className="w-full"
                      disabled={selectedPonto.aceitaNovosAnuncios === false}
                    >
                      {selectedPonto.aceitaNovosAnuncios === false
                        ? "Solicitações Bloqueadas"
                        : (selectedPonto.tempoOcupadoSegundos || 0) >= (selectedPonto.limiteTempoSegundos || 360)
                        ? "Entrar na Fila de Espera ⏳"
                        : "Anunciar nesta TV 🚀"}
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody className="text-center p-8 text-slate-500 text-xs">
                Selecione um ponto no mapa para ver os dados detalhados.
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
