"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { PagamentoPixModal } from "@/components/pagamento/PagamentoPixModal";
import { cn } from "@/lib/utils";
import {
  Icon,
  StatTile,
  Painel,
  SecaoTitulo,
  HeroNavy,
  MiniTv,
  Toast,
  PainelCarregando,
  Saudacao,
  primeiroNome,
  moeda,
} from "@/components/dashboard/ui";

interface UserData {
  id: number;
  nome: string;
  email: string;
  avatarUrl?: string | null;
  role: "ANUNCIANTE";
  anunciante?: { id: number; nomeEmpresa: string; logoUrl?: string | null };
}

type StatusAnuncio = "PENDENTE" | "APROVADO" | "REJEITADO" | "ATIVO" | "PAUSADO" | "FILA_ESPERA" | "EXPIRADO";

interface AnuncioItem {
  id: number;
  titulo: string;
  tipoMidia: "VIDEO" | "IMAGEM";
  midiaUrl: string;
  duracaoSegundos: number;
  status: StatusAnuncio;
  posicaoFila?: number | null;
  motivoRejeicao?: string;
  criadoEm: string;
  totalExibicoes?: number;
  exibicoesHoje?: number;
  totalMinutosExibidos?: number;
  ultimaExibicao?: string | null;
  pontoMidia: {
    id: number;
    nomeEmpresa: string;
    cidade: string;
    uf: string;
    tvOnline?: boolean;
  };
}

interface AnuncianteStats {
  financeiro?: {
    gastoMensalTotal: number;
    detalhamentoCampanhas: Array<{
      anuncioId: number;
      titulo: string;
      pontoId: number;
      pontoNome: string;
      cidade: string;
      tier: string;
      cotaMensal: number;
    }>;
  };
}

const STATUS_VISUAL: Record<StatusAnuncio, { rotulo: string; cor: string; fundo: string; pulsa?: boolean }> = {
  ATIVO: { rotulo: "No ar", cor: "#3E6B57", fundo: "bg-[#D8E8E1]" },
  APROVADO: { rotulo: "Aguardando pagamento", cor: "#047857", fundo: "bg-emerald-50", pulsa: true },
  PENDENTE: { rotulo: "Em análise", cor: "#2F6FA3", fundo: "bg-[#4F93C9]/10" },
  FILA_ESPERA: { rotulo: "Fila de espera", cor: "#B45309", fundo: "bg-amber-50" },
  REJEITADO: { rotulo: "Não aprovado", cor: "#BE123C", fundo: "bg-rose-50" },
  PAUSADO: { rotulo: "Pausado", cor: "#475467", fundo: "bg-[#F4F5F7]" },
  EXPIRADO: { rotulo: "Encerrado", cor: "#667085", fundo: "bg-[#F4F5F7]" },
};

function StatusPill({ status, tvOnline, posicaoFila }: { status: StatusAnuncio; tvOnline?: boolean; posicaoFila?: number | null }) {
  const v = STATUS_VISUAL[status] ?? STATUS_VISUAL.PAUSADO;
  const aoVivo = status === "ATIVO" && tvOnline;
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none backdrop-blur-sm", v.fundo)}
      style={{ color: v.cor }}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", (aoVivo || v.pulsa) && "animate-pulse")} style={{ background: v.cor }} />
      {aoVivo ? "Ao vivo agora" : v.rotulo}
      {status === "FILA_ESPERA" && posicaoFila ? ` · #${posicaoFila}` : ""}
    </span>
  );
}

const FILTROS = [
  { id: "todas", rotulo: "Todas", inclui: () => true },
  { id: "no-ar", rotulo: "No ar", inclui: (s: StatusAnuncio) => s === "ATIVO" },
  { id: "andamento", rotulo: "Em andamento", inclui: (s: StatusAnuncio) => ["PENDENTE", "APROVADO", "FILA_ESPERA"].includes(s) },
  { id: "encerradas", rotulo: "Encerradas", inclui: (s: StatusAnuncio) => ["REJEITADO", "PAUSADO", "EXPIRADO"].includes(s) },
] as const;

type FiltroId = (typeof FILTROS)[number]["id"];

const TIER_CLASSE: Record<string, string> = {
  Ouro: "bg-[#FEF3C7]/80 text-[#92400E]",
  Prata: "bg-[#F1F5F9] text-[#334155]",
  Bronze: "bg-[#FFEDD5]/80 text-[#9A3412]",
};

function Midia({ anuncio, className }: { anuncio: AnuncioItem; className?: string }) {
  return anuncio.tipoMidia === "VIDEO" ? (
    <video preload="metadata" src={anuncio.midiaUrl} muted className={className} />
  ) : (
    <img loading="lazy" decoding="async" src={anuncio.midiaUrl} alt={anuncio.titulo} className={className} />
  );
}

export default function AnuncianteDashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const [anuncios, setAnuncios] = useState<AnuncioItem[]>([]);
  const [stats, setStats] = useState<AnuncianteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<FiltroId>("todas");
  const [previewAd, setPreviewAd] = useState<AnuncioItem | null>(null);
  const [removalModalOpen, setRemovalModalOpen] = useState(false);
  const [adToRequestRemoval, setAdToRequestRemoval] = useState<AnuncioItem | null>(null);
  const [motivoRemocao, setMotivoRemocao] = useState("");
  const [requestingRemoval, setRequestingRemoval] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pagandoId, setPagandoId] = useState<number | null>(null);

  const handleOpenRemovalModal = (ad: AnuncioItem) => {
    setAdToRequestRemoval(ad);
    setMotivoRemocao("");
    setRequestError("");
    setRemovalModalOpen(true);
  };

  const handleConfirmRequestRemoval = async () => {
    if (!adToRequestRemoval || !motivoRemocao.trim()) return;
    setRequestingRemoval(true);
    setRequestError("");

    try {
      const res = await fetch(`/api/anuncios/${adToRequestRemoval.id}/solicitar-remocao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: motivoRemocao }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao enviar solicitação");

      setRemovalModalOpen(false);
      setAdToRequestRemoval(null);
      setMotivoRemocao("");
      setPreviewAd(null);
      setToastMessage("Solicitação de remoção enviada para a moderação.");
      setTimeout(() => setToastMessage(null), 4500);
    } catch (err: unknown) {
      setRequestError(err instanceof Error ? err.message : "Erro ao enviar solicitação");
    } finally {
      setRequestingRemoval(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [userRes, anunciosRes, statsRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/anuncios"),
          fetch("/api/stats"),
        ]);
        if (userRes.ok) setUser((await userRes.json()).user);
        if (anunciosRes.ok) setAnuncios((await anunciosRes.json()).anuncios || []);
        if (statsRes.ok) setStats(await statsRes.json());
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const ativos = useMemo(() => anuncios.filter((a) => a.status === "ATIVO"), [anuncios]);
  const aguardandoPagamento = anuncios.filter((a) => a.status === "APROVADO");
  const emAndamento = anuncios.filter((a) => ["PENDENTE", "FILA_ESPERA"].includes(a.status));
  const exibicoesHoje = anuncios.reduce((s, a) => s + (a.exibicoesHoje ?? 0), 0);
  const totalExibicoes = anuncios.reduce((s, a) => s + (a.totalExibicoes ?? 0), 0);
  const investimento = stats?.financeiro?.gastoMensalTotal ?? 0;
  const filtroAtual = FILTROS.find((f) => f.id === filtro)!;
  const visiveis = anuncios.filter((a) => filtroAtual.inclui(a.status));
  const telas = new Set(ativos.map((a) => a.pontoMidia.id)).size;

  return (
    <DashboardLayout
      role="ANUNCIANTE"
      userName={user?.nome || "Anunciante"}
      userEmail={user?.email || ""}
      userAvatar={user?.avatarUrl || null}
      title="Visão geral"
      description={user?.anunciante?.nomeEmpresa}
      actions={
        <Link href="/anunciante/anuncios/novo">
          <Button size="sm" variant="navy">
            <Icon name="plus" className="h-4 w-4" strokeWidth={2} />
            Nova campanha
          </Button>
        </Link>
      }
    >
      {loading ? (
        <PainelCarregando />
      ) : (
        <div className="space-y-8">
          {/* ── Destaque ─────────────────────────────────────── */}
          <HeroNavy>
            <div className="grid items-center gap-8 p-7 sm:p-9 lg:grid-cols-[1.25fr_1fr]">
              <div>
                <p className="text-sm text-white/60">
                  <Saudacao />, {primeiroNome(user?.nome)}
                </p>
                <h2 className="mt-2 font-heading text-[28px] sm:text-[34px] font-semibold leading-[1.12] tracking-tight">
                  {ativos.length > 0 ? (
                    <>
                      Sua marca está no ar em{" "}
                      <span className="text-[#8EC3EA]">{telas === 1 ? "1 tela" : `${telas} telas`}</span>.
                    </>
                  ) : (
                    "Vamos colocar sua marca no ar?"
                  )}
                </h2>
                <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/65">
                  {ativos.length > 0
                    ? `Hoje seus anúncios já foram exibidos ${exibicoesHoje.toLocaleString("pt-BR")} vezes. Acompanhe cada campanha abaixo.`
                    : "Escolha uma tela no mapa, envie seu anúncio e acompanhe cada exibição por aqui."}
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href="/anunciante/anuncios/novo"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#0E1F66] shadow-md transition hover:bg-[#EEF4FB]"
                  >
                    <Icon name="plus" className="h-4 w-4" strokeWidth={2} />
                    Nova campanha
                  </Link>
                  <Link
                    href="/anunciante/mapa"
                    className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white ring-1 ring-white/25 transition hover:bg-white/10"
                  >
                    <Icon name="map" className="h-4 w-4" />
                    Explorar telas
                  </Link>
                </div>
              </div>

              <MiniTv
                legenda="Exibindo em"
                itens={ativos.map((a) => ({
                  midiaUrl: a.midiaUrl,
                  tipoMidia: a.tipoMidia,
                  titulo: a.titulo,
                  local: `${a.pontoMidia.nomeEmpresa} · ${a.pontoMidia.cidade}`,
                }))}
              />
            </div>
          </HeroNavy>

          {/* ── Ação pendente ─────────────────────────────────── */}
          {aguardandoPagamento.length > 0 && (
            <div className="flex flex-col gap-4 rounded-2xl bg-emerald-50/70 p-5 ring-1 ring-emerald-200/70 sm:flex-row sm:items-center animate-fade-in">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Icon name="check" className="h-5 w-5" strokeWidth={2} />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-900">
                  {aguardandoPagamento.length === 1
                    ? `"${aguardandoPagamento[0]!.titulo}" foi aprovada!`
                    : `${aguardandoPagamento.length} campanhas foram aprovadas!`}
                </p>
                <p className="text-[13px] text-emerald-800/70">Faça o pagamento via PIX para colocar no ar.</p>
              </div>
              <Button variant="success" size="sm" onClick={() => setPagandoId(aguardandoPagamento[0]!.id)}>
                Pagar e ativar
                <Icon name="arrow" className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* ── Números ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile icon="play" tom="sky" label="Exibições hoje" valor={exibicoesHoje} dica="em todas as telas" delay={0} />
            <StatTile icon="chart" tom="teal" label="Exibições no total" valor={totalExibicoes} dica="desde o início" delay={70} />
            <StatTile icon="tv" tom="navy" label="Campanhas no ar" valor={ativos.length} dica={emAndamento.length ? `${emAndamento.length} em andamento` : "nenhuma pendente"} delay={140} />
            <StatTile icon="wallet" tom="amber" label="Investimento mensal" valor={investimento} formatar={moeda} dica="cota fixa, sem fidelidade" delay={210} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            {/* ── Campanhas ─────────────────────────────────── */}
            <div className="space-y-5">
              <SecaoTitulo
                titulo="Suas campanhas"
                descricao="Clique em uma campanha para ver a peça e os detalhes."
                acao={
                  <div className="inline-flex rounded-full bg-[#0E1F66]/[0.05] p-1">
                    {FILTROS.map((f) => {
                      const qtd = anuncios.filter((a) => f.inclui(a.status)).length;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFiltro(f.id)}
                          className={cn(
                            "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition cursor-pointer",
                            filtro === f.id ? "bg-white text-[#0E1F66] shadow-sm" : "text-[#667085] hover:text-[#0E1F66]"
                          )}
                        >
                          {f.rotulo}
                          <span className="ml-1.5 text-[11px] text-[#AEB6C4]">{qtd}</span>
                        </button>
                      );
                    })}
                  </div>
                }
              />

              {anuncios.length === 0 ? (
                <EmptyState
                  icon={<Icon name="tv" className="h-7 w-7" />}
                  title="Nenhuma campanha ainda"
                  description="Explore as telas disponíveis no mapa e escolha onde exibir seu primeiro anúncio."
                  action={
                    <Link href="/anunciante/mapa">
                      <Button variant="navy">Ver mapa de telas</Button>
                    </Link>
                  }
                />
              ) : visiveis.length === 0 ? (
                <p className="rounded-2xl bg-white px-6 py-10 text-center text-sm text-[#8A93A3] ring-1 ring-[#E4E7EC]/80">
                  Nenhuma campanha neste filtro.
                </p>
              ) : (
                <div key={filtro} className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                  {visiveis.map((anuncio, i) => (
                    <article
                      key={anuncio.id}
                      className="group overflow-hidden rounded-2xl bg-white ring-1 ring-[#E4E7EC]/80 shadow-xs transition duration-300 hover:-translate-y-0.5 hover:shadow-lg animate-fade-in"
                      style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewAd(anuncio)}
                        className="relative block aspect-video w-full overflow-hidden bg-[#0E1F66] cursor-pointer"
                        title="Ver peça"
                      >
                        <Midia
                          anuncio={anuncio}
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                        />
                        <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                        <span className="absolute left-3 top-3 rounded-full bg-white/95 shadow-sm">
                          <StatusPill status={anuncio.status} tvOnline={anuncio.pontoMidia.tvOnline} posicaoFila={anuncio.posicaoFila} />
                        </span>
                        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 text-[11px] font-medium text-white/90">
                          <Icon name={anuncio.tipoMidia === "VIDEO" ? "play" : "eye"} className="h-3.5 w-3.5" />
                          {anuncio.tipoMidia === "VIDEO" ? `Vídeo · ${anuncio.duracaoSegundos}s` : `Imagem · ${anuncio.duracaoSegundos}s`}
                        </span>
                        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#0E1F66] shadow-lg">
                            <Icon name="eye" className="h-5 w-5" />
                          </span>
                        </span>
                      </button>

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="line-clamp-1 text-[15px] font-semibold text-[#0E1F66]">{anuncio.titulo}</h3>
                          <button
                            type="button"
                            title="Solicitar remoção"
                            onClick={() => handleOpenRemovalModal(anuncio)}
                            className="-mr-1 -mt-1 rounded-lg p-1.5 text-[#AEB6C4] opacity-0 transition hover:bg-amber-50 hover:text-amber-600 group-hover:opacity-100 cursor-pointer"
                          >
                            <Icon name="flag" className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="mt-1 truncate text-[13px] text-[#8A93A3]">
                          {anuncio.pontoMidia.nomeEmpresa} · {anuncio.pontoMidia.cidade}/{anuncio.pontoMidia.uf}
                        </p>

                        {anuncio.status === "ATIVO" && (
                          <div className="mt-4 flex items-center gap-5 border-t border-[#EEF0F3] pt-3.5 text-[13px]">
                            <span className="text-[#667085]">
                              <strong className="font-semibold text-[#0E1F66]">{(anuncio.exibicoesHoje ?? 0).toLocaleString("pt-BR")}</strong> hoje
                            </span>
                            <span className="text-[#667085]">
                              <strong className="font-semibold text-[#0E1F66]">{(anuncio.totalExibicoes ?? 0).toLocaleString("pt-BR")}</strong> no total
                            </span>
                          </div>
                        )}
                        {anuncio.status === "APROVADO" && (
                          <button
                            type="button"
                            onClick={() => setPagandoId(anuncio.id)}
                            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-[13px] font-medium text-white transition hover:bg-emerald-700 cursor-pointer"
                          >
                            Pagar e ativar
                            <Icon name="arrow" className="h-4 w-4" />
                          </button>
                        )}
                        {anuncio.status === "REJEITADO" && anuncio.motivoRejeicao && (
                          <p className="mt-3 line-clamp-2 rounded-lg bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-700">
                            {anuncio.motivoRejeicao}
                          </p>
                        )}
                        {(anuncio.status === "PENDENTE" || anuncio.status === "FILA_ESPERA") && (
                          <p className="mt-4 flex items-center gap-1.5 border-t border-[#EEF0F3] pt-3.5 text-xs text-[#8A93A3]">
                            <Icon name="hourglass" className="h-3.5 w-3.5" />
                            {anuncio.status === "PENDENTE" ? "Análise em até 24h" : "Entra no ar quando abrir uma vaga"}
                          </p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* ── Coluna lateral ────────────────────────────── */}
            <aside className="space-y-5">
              <Painel className="p-5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium text-[#667085]">Investimento mensal</p>
                  <span className="text-[11px] text-[#AEB6C4]">cotas ativas</span>
                </div>
                <p className="mt-2 font-heading text-3xl font-semibold tracking-tight text-[#0E1F66]">{moeda(investimento)}</p>

                {stats?.financeiro?.detalhamentoCampanhas?.length ? (
                  <ul className="mt-5 space-y-3 border-t border-[#EEF0F3] pt-4">
                    {stats.financeiro.detalhamentoCampanhas.map((item) => (
                      <li key={item.anuncioId} className="flex items-center gap-3">
                        <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold", TIER_CLASSE[item.tier] ?? TIER_CLASSE.Bronze)}>
                          {item.tier}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-[#344054]">{item.pontoNome}</p>
                          <p className="truncate text-[11px] text-[#AEB6C4]">{item.titulo}</p>
                        </div>
                        <span className="text-[13px] font-medium text-[#0E1F66]">{moeda(item.cotaMensal)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 border-t border-[#EEF0F3] pt-4 text-[13px] text-[#8A93A3]">Nenhuma cota ativa no momento.</p>
                )}
              </Painel>

              <Link
                href="/anunciante/mapa"
                className="group relative block overflow-hidden rounded-2xl bg-[#0E1F66] p-5 text-white shadow-md animate-fade-in"
                style={{ animationDelay: "120ms" }}
              >
                <div className="absolute -right-6 -top-6 flex rotate-6 gap-2 opacity-60 transition duration-500 group-hover:opacity-80 group-hover:rotate-3">
                  {["gym1", "rest1", "dent1"].map((f) => (
                    <img key={f} src={`/uploads/demo/pontos/${f}.webp`} alt="" className="h-20 w-16 rounded-lg object-cover" loading="lazy" />
                  ))}
                </div>
                <div className="relative mt-14">
                  <p className="font-heading text-lg font-semibold">Encontre novas telas</p>
                  <p className="mt-1 text-[13px] text-white/65">Academias, clínicas, restaurantes e mais na sua região.</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#8EC3EA]">
                    Abrir mapa
                    <Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </aside>
          </div>
        </div>
      )}

      {/* Modal de pré-visualização da peça */}
      <Modal
        isOpen={Boolean(previewAd)}
        onClose={() => setPreviewAd(null)}
        title={previewAd?.titulo || "Campanha"}
        description={previewAd ? `${previewAd.pontoMidia.nomeEmpresa} · ${previewAd.pontoMidia.cidade}/${previewAd.pontoMidia.uf}` : ""}
        size="lg"
      >
        {previewAd && (
          <div className="space-y-5">
            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-black">
              {previewAd.tipoMidia === "VIDEO" ? (
                <video src={previewAd.midiaUrl} controls autoPlay className="h-full w-full object-contain" />
              ) : (
                <img src={previewAd.midiaUrl} alt={previewAd.titulo} className="h-full w-full object-contain" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { rotulo: "Status", valor: <StatusPill status={previewAd.status} tvOnline={previewAd.pontoMidia.tvOnline} /> },
                { rotulo: "Duração", valor: `${previewAd.duracaoSegundos}s` },
                { rotulo: "Exibições hoje", valor: (previewAd.exibicoesHoje ?? 0).toLocaleString("pt-BR") },
                { rotulo: "No total", valor: (previewAd.totalExibicoes ?? 0).toLocaleString("pt-BR") },
              ].map((d) => (
                <div key={d.rotulo} className="rounded-xl bg-[#F7F8FA] px-3.5 py-3">
                  <p className="text-[11px] text-[#8A93A3]">{d.rotulo}</p>
                  <div className="mt-1 text-sm font-semibold text-[#0E1F66]">{d.valor}</div>
                </div>
              ))}
            </div>

            {previewAd.status === "REJEITADO" && previewAd.motivoRejeicao && (
              <div className="rounded-xl bg-rose-50 p-3.5 text-[13px] text-rose-700">
                <strong className="font-semibold">Motivo:</strong> {previewAd.motivoRejeicao}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-[#EEF0F3] pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const ad = previewAd;
                  setPreviewAd(null);
                  handleOpenRemovalModal(ad);
                }}
                className="text-amber-700 hover:bg-amber-50 hover:text-amber-800"
              >
                <Icon name="flag" className="h-4 w-4" />
                Solicitar remoção
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setPreviewAd(null)}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de solicitação de remoção */}
      <Modal
        isOpen={removalModalOpen}
        onClose={() => !requestingRemoval && setRemovalModalOpen(false)}
        title="Solicitar remoção"
        description="A equipe de moderação vai analisar o pedido e remover a peça da tela."
      >
        <div className="space-y-4">
          {requestError && <div className="rounded-xl bg-rose-50 p-3 text-[13px] text-rose-700">{requestError}</div>}

          {adToRequestRemoval && (
            <div className="flex items-center gap-3.5 rounded-2xl bg-[#F7F8FA] p-3">
              <div className="h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-[#0E1F66]">
                <Midia anuncio={adToRequestRemoval} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#0E1F66]">{adToRequestRemoval.titulo}</p>
                <p className="truncate text-xs text-[#8A93A3]">
                  {adToRequestRemoval.pontoMidia.nomeEmpresa} · {adToRequestRemoval.pontoMidia.cidade}
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#344054]">
              Motivo <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              className="w-full rounded-xl border border-[#E4E7EC] p-3 text-sm text-[#101828] placeholder:text-[#9AA3AF] outline-none transition focus:border-[#4F93C9] focus:ring-4 focus:ring-[#4F93C9]/15"
              placeholder="Ex.: encerramento antecipado, troca de material, erro na veiculação..."
              value={motivoRemocao}
              onChange={(e) => setMotivoRemocao(e.target.value)}
            />
          </div>

          <p className="flex gap-2.5 rounded-xl bg-[#4F93C9]/[0.07] p-3 text-xs leading-relaxed text-[#1F5A8A]">
            <Icon name="info" className="h-4 w-4 shrink-0" />
            Apenas a administração remove peças ativas. Você será notificado assim que o pedido for processado.
          </p>

          <div className="flex items-center justify-end gap-2 border-t border-[#EEF0F3] pt-4">
            <Button variant="ghost" onClick={() => setRemovalModalOpen(false)} disabled={requestingRemoval}>
              Cancelar
            </Button>
            <Button
              variant="navy"
              loading={requestingRemoval}
              disabled={!motivoRemocao.trim() || motivoRemocao.trim().length < 5}
              onClick={handleConfirmRequestRemoval}
            >
              Enviar solicitação
            </Button>
          </div>
        </div>
      </Modal>

      {pagandoId !== null && (
        <PagamentoPixModal anuncioId={pagandoId} onClose={() => setPagandoId(null)} onPago={() => window.location.reload()} />
      )}

      {toastMessage && <Toast mensagem={toastMessage} onClose={() => setToastMessage(null)} />}
    </DashboardLayout>
  );
}
