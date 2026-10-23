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
              {loading ? (
                <span className="inline-flex items-center gap-1.5 text-blue-600">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  Carregando pontos...
                </span>
              ) : (
                `${filteredPontos.length} ponto(s) ativo(s)`
              )}
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
            <Card className="shadow-xs border border-[#E4E7EC]">
              <CardHeader className="bg-[#F7F8FA] border-b border-[#E4E7EC]">
                <div className="flex items-start gap-3">
                  {selectedPonto.fotos && selectedPonto.fotos.length > 0 ? (
                    <img loading="lazy" decoding="async"
                      src={selectedPonto.fotos[0]}
                      alt={selectedPonto.nomeEmpresa}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#0E1F66] text-white flex items-center justify-center font-bold text-base shadow-md shrink-0">
                      {selectedPonto.nomeEmpresa.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="brand">{selectedPonto.categoria}</Badge>
                      {selectedPonto.tier && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                            selectedPonto.tier === "Ouro"
                              ? "bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]"
                              : selectedPonto.tier === "Prata"
                              ? "bg-[#F1F5F9] text-[#334155] border-[#CBD5E1]"
                              : "bg-[#FFEDD5] text-[#9A3412] border-[#FDBA74]"
                          }`}
                        >
                          {selectedPonto.tier}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-[#0E1F66] font-heading mt-1 truncate">
                      {selectedPonto.nomeEmpresa}
                    </h3>
                    <p className="text-xs text-[#9AA3AF] mt-0.5">
                      {selectedPonto.rua}, {selectedPonto.numero} - {selectedPonto.bairro}, {selectedPonto.cidade} - {selectedPonto.uf}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                {/* Bloco de Preço e Cota em Destaque */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#081342] via-[#0E1F66] to-[#081342] text-white shadow-md border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                        Investimento Mensal
                      </span>
                      <p className="text-3xl font-black font-heading text-emerald-400 mt-0.5">
                        {(selectedPonto.cotaMensal ?? 249).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                        <span className="text-xs font-normal text-white/70"> /mês</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-white/60">Classificação</span>
                      <p className="text-sm font-bold text-amber-300">
                        {selectedPonto.tier ?? "Tier Ouro"}
                      </p>
                      <span className="text-[10px] text-white/60">1 cota de veiculação</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-blue-100/80 mt-2 pt-2 border-t border-white/10">
                    ✓ Transmissão contínua em loop no horário comercial · Sem fidelidade
                  </p>
                </div>

                {/* Galeria de Fotos em Destaque Vistoso */}
                {selectedPonto.fotos && selectedPonto.fotos.length > 0 ? (
                  <div>
                    <p className="text-xs font-bold text-[#344054] mb-2">
                      Fotos do Estabelecimento & Posicionamento da TV:
                    </p>
                    {/* Imagem Principal Grande */}
                    <div className="rounded-2xl overflow-hidden aspect-video border border-[#E4E7EC] bg-slate-950 shadow-xs mb-2 group relative">
                      <img loading="lazy" decoding="async"
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
                            className="rounded-xl overflow-hidden aspect-video border border-[#E4E7EC] bg-slate-900 shadow-xs hover:border-[#4F93C9] transition"
                          >
                            <img loading="lazy" decoding="async"
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
                  <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E4E7EC] text-center text-xs text-[#9AA3AF]">
                    Nenhuma foto cadastrada para este ponto ainda.
                  </div>
                )}

                {/* Indicador de Capacidade de Cotas e Fila */}
                {(() => {
                  const maxCotas = selectedPonto.maxCotas || 8;
                  const cotasOcupadas = selectedPonto.cotasOcupadas ?? 0;
                  const cotasDisponiveis = Math.max(0, maxCotas - cotasOcupadas);
                  const isLotado = cotasOcupadas >= maxCotas;
                  const perc = Math.min(100, Math.round((cotasOcupadas / maxCotas) * 100));

                  return (
                    <div className="p-3.5 bg-[#F7F8FA] border border-[#E4E7EC] rounded-xl space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#344054]">
                          Disponibilidade de Cotas ({cotasOcupadas}/{maxCotas}):
                        </span>
                        {selectedPonto.aceitaNovosAnuncios === false ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-extrabold text-[10px]">
                            Solicitações Pausadas
                          </span>
                        ) : isLotado ? (
                          <span className="px-2 py-0.5 rounded-md bg-[#FEF3C7] text-[#92400E] font-extrabold text-[10px] border border-[#FCD34D]">
                            Fila de Espera ({selectedPonto.quantidadeFilaEspera || 0})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-[#D8E8E1] text-[#1E4333] font-extrabold text-[10px] border border-[#8FAE9E]/40">
                            {cotasDisponiveis} cota(s) disponível(is)
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-[#E4E7EC] rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isLotado ? "bg-amber-500" : perc > 75 ? "bg-[#4F93C9]" : "bg-[#8FAE9E]"
                          }`}
                          style={{ width: `${perc}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E4E7EC]">
                    <p className="text-[10px] uppercase font-bold text-[#9AA3AF]">
                      Fluxo Diário
                    </p>
                    <p className="text-sm font-black text-[#0E1F66] mt-0.5 font-heading">
                      {selectedPonto.fluxoDiarioEstimado}
                    </p>
                  </div>
                  <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E4E7EC]">
                    <p className="text-[10px] uppercase font-bold text-[#9AA3AF]">
                      Permanência
                    </p>
                    <p className="text-sm font-black text-[#0E1F66] mt-0.5 font-heading">
                      {selectedPonto.tempoPermanencia}
                    </p>
                  </div>
                </div>

                {selectedPonto.faixaEtariaPublico && selectedPonto.faixaEtariaPublico.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-[#344054] mb-1.5">
                      Público Predominante:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPonto.faixaEtariaPublico.map((f) => (
                        <span
                          key={f}
                          className="bg-[#E0EEF8] text-[#0E1F66] text-xs px-2.5 py-0.5 rounded-full font-semibold border border-[#4F93C9]/30"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  {(() => {
                    const maxCotas = selectedPonto.maxCotas || 8;
                    const cotasOcupadas = selectedPonto.cotasOcupadas ?? 0;
                    const isLotado = cotasOcupadas >= maxCotas;
                    const precoFormatado = (selectedPonto.cotaMensal ?? 249).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    });

                    return (
                      <Link
                        href={`/anunciante/anuncios/novo?pontoId=${selectedPonto.id}`}
                        className="block w-full"
                      >
                        <Button
                          size="lg"
                          variant={selectedPonto.aceitaNovosAnuncios === false ? "secondary" : "primary"}
                          className="w-full"
                          disabled={selectedPonto.aceitaNovosAnuncios === false}
                        >
                          {selectedPonto.aceitaNovosAnuncios === false
                            ? "Solicitações Bloqueadas"
                            : isLotado
                            ? "Entrar na Fila de Espera"
                            : `Anunciar nesta TV · ${precoFormatado}/mês`}
                        </Button>
                      </Link>
                    );
                  })()}
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
