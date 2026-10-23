"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import {
  Icon,
  StatTile,
  Painel,
  SecaoTitulo,
  HeroNavy,
  PontoVivo,
  Anel,
  Toast,
  PainelCarregando,
  Saudacao,
  primeiroNome,
  moeda,
  type IconName,
} from "@/components/dashboard/ui";

interface PontoData {
  id: number;
  nomeEmpresa: string;
  categoria: string;
  cidade: string;
  uf: string;
  status: "PENDENTE" | "ATIVO" | "INATIVO";
  codigoTv?: string;
  fotos?: string[];
  quantidadeTvs?: number;
}

interface UserData {
  id: number;
  nome: string;
  email: string;
  avatarUrl?: string | null;
  role: "PONTO";
  pontoMidia?: PontoData;
}

interface AnuncioTV {
  id: number;
  titulo: string;
  tipoMidia: "VIDEO" | "IMAGEM";
  midiaUrl: string;
  duracaoSegundos: number;
  status: "ATIVO";
  anunciante: { nomeEmpresa: string; categoria: string };
}

interface StatsPonto {
  tvOnline?: boolean;
  ultimaAtividade?: string;
  totalExibicoesPonto?: number;
  exibicoesPontoHoje?: number;
  horasOnlineEstimadas?: string;
  meusAnunciosAtivos?: number;
  maxCotas?: number;
  financeiro?: {
    repasseMensalEstimado: number;
    repassePorAnunciante: number;
    anunciantesAtivos: number;
  };
}

const CICLO_CODIGO = 30;

const PASSOS_CONEXAO: { icone: IconName; titulo: string; texto: string }[] = [
  { icone: "tv", titulo: "Abra o navegador da TV", texto: "Na Smart TV, acesse o endereço do player." },
  { icone: "qr", titulo: "Ou aponte a câmera", texto: "Use o QR code para abrir o link mais rápido." },
  { icone: "check", titulo: "Digite o código", texto: "Os 6 números ao lado conectam a tela na hora." },
];

function Midia({ ad, className }: { ad: AnuncioTV; className?: string }) {
  return ad.tipoMidia === "VIDEO" ? (
    <video preload="metadata" src={ad.midiaUrl} muted className={className} />
  ) : (
    <img loading="lazy" decoding="async" src={ad.midiaUrl} alt={ad.titulo} className={className} />
  );
}

export default function PontoDashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const [anuncios, setAnuncios] = useState<AnuncioTV[]>([]);
  const [stats, setStats] = useState<StatsPonto | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [rotativoCode, setRotativoCode] = useState<string>("");
  const [rotativoSegundos, setRotativoSegundos] = useState<number>(CICLO_CODIGO);
  const [loadingRotativo, setLoadingRotativo] = useState<boolean>(false);
  const [previewAd, setPreviewAd] = useState<AnuncioTV | null>(null);
  const [removalModalOpen, setRemovalModalOpen] = useState(false);
  const [adToRequestRemoval, setAdToRequestRemoval] = useState<AnuncioTV | null>(null);
  const [motivoRemocao, setMotivoRemocao] = useState("");
  const [requestingRemoval, setRequestingRemoval] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenRemovalModal = (ad: AnuncioTV) => {
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

  const fetchRotativoCode = async () => {
    try {
      setLoadingRotativo(true);
      const res = await fetch("/api/ponto/codigo-rotativo", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setRotativoCode(data.codigo);
        setRotativoSegundos(CICLO_CODIGO);
      }
    } catch (e) {
      console.error("Erro ao gerar código rotativo:", e);
    } finally {
      setLoadingRotativo(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [userRes, anunciosRes, statsRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/anuncios?status=ATIVO"),
          fetch("/api/stats"),
        ]);

        if (userRes.ok) setUser((await userRes.json()).user);
        if (anunciosRes.ok) setAnuncios((await anunciosRes.json()).anuncios || []);
        if (statsRes.ok) setStats(await statsRes.json());

        QRCode.toDataURL(`${window.location.origin}/player`, {
          width: 280,
          margin: 1,
          color: { dark: "#0B1A57", light: "#ffffff" },
        }).then(setQrCodeUrl);

        fetchRotativoCode();
      } catch (err) {
        console.error("Ponto dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    const rotativoTimer = setInterval(() => {
      setRotativoSegundos((prev) => {
        if (prev <= 1) {
          fetchRotativoCode();
          return CICLO_CODIGO;
        }
        return prev - 1;
      });
    }, 1000);

    const poll = setInterval(async () => {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) setStats(await res.json());
      } catch {}
    }, 3000);

    return () => {
      clearInterval(poll);
      clearInterval(rotativoTimer);
    };
  }, []);

  const ponto = user?.pontoMidia;
  const playerUrl = typeof window !== "undefined" ? `${window.location.origin}/player` : "/player";
  const codigo = rotativoCode || ponto?.codigoTv || "";

  const handleCopyCode = () => {
    if (!codigo) return;
    navigator.clipboard.writeText(codigo);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(playerUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const isOnline = stats?.tvOnline ?? false;
  const maxCotas = stats?.maxCotas || 8;
  const repasse = stats?.financeiro?.repasseMensalEstimado ?? 0;
  const porMarca = stats?.financeiro?.repassePorAnunciante ?? 0;
  const exibicoesHoje = stats?.exibicoesPontoHoje ?? 0;

  return (
    <DashboardLayout
      role="PONTO"
      userName={user?.nome || "Estabelecimento"}
      userEmail={user?.email || ""}
      userAvatar={user?.avatarUrl || null}
      pontoId={ponto?.id}
      title="Visão geral"
      description={ponto?.nomeEmpresa || ""}
    >
      {loading ? (
        <PainelCarregando />
      ) : (
        <div className="space-y-8">
          {/* ── Destaque: status da TV + código de conexão ─── */}
          {ponto && (
            <HeroNavy>
              <div className="grid items-center gap-8 p-7 sm:p-9 lg:grid-cols-[1.2fr_1fr]">
                <div>
                  <p className="text-sm text-white/60">
                    <Saudacao />, {primeiroNome(user?.nome)}
                  </p>

                  <span
                    className={cn(
                      "mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
                      isOnline ? "bg-[#8FAE9E]/20 text-[#CFE6DB]" : "bg-[#F2795C]/15 text-[#F7B8A6]"
                    )}
                  >
                    {isOnline ? <PontoVivo /> : <span className="h-2 w-2 rounded-full bg-[#F2795C]" />}
                    {isOnline ? "TV conectada · transmitindo agora" : "TV desconectada"}
                  </span>

                  <h2 className="mt-4 font-heading text-[28px] sm:text-[34px] font-semibold leading-[1.12] tracking-tight">
                    {isOnline ? (
                      <>
                        Sua tela já exibiu{" "}
                        <span className="text-[#8EC3EA]">{exibicoesHoje.toLocaleString("pt-BR")} anúncios</span> hoje.
                      </>
                    ) : (
                      "Conecte sua TV para começar a exibir."
                    )}
                  </h2>
                  <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/65">
                    {isOnline
                      ? `${anuncios.length} ${anuncios.length === 1 ? "marca está" : "marcas estão"} no loop da sua TV agora. Você acompanha tudo por aqui.`
                      : "Abra o player no navegador da Smart TV e digite o código ao lado. Leva menos de um minuto."}
                  </p>

                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleCopyLink}
                      className="group inline-flex items-center gap-2.5 rounded-full bg-white/[0.08] py-2 pl-4 pr-2 text-sm text-white/85 ring-1 ring-white/15 transition hover:bg-white/[0.12] cursor-pointer"
                    >
                      <Icon name="link" className="h-4 w-4 text-[#8EC3EA]" />
                      <span className="font-mono text-[13px]">{playerUrl.replace(/^https?:\/\//, "")}</span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#0E1F66]">
                        {copiedLink ? "Copiado!" : "Copiar"}
                      </span>
                    </button>
                    <button
                      onClick={() => setQrModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/25 transition hover:bg-white/10 cursor-pointer"
                    >
                      <Icon name="qr" className="h-4 w-4" />
                      QR code
                    </button>
                  </div>
                </div>

                {/* Código rotativo */}
                <div className="rounded-2xl bg-white/[0.06] p-6 ring-1 ring-white/10 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-white/85">Código de conexão</p>
                      <p className="mt-0.5 text-xs text-white/45">Digite na tela do player</p>
                    </div>
                    <Anel progresso={rotativoSegundos / CICLO_CODIGO} tamanho={46} espessura={4} cor="#8EC3EA" trilha="rgba(255,255,255,0.12)">
                      <span className="text-xs font-medium tabular-nums text-white/85">{rotativoSegundos}s</span>
                    </Anel>
                  </div>

                  <div key={codigo} className="mt-6 flex justify-between gap-1.5 sm:gap-2">
                    {(loadingRotativo && !codigo ? "······" : codigo.padEnd(6, "·")).split("").map((d, i) => (
                      <span
                        key={i}
                        className="flex h-14 flex-1 items-center justify-center rounded-xl bg-[#05092A]/60 font-mono text-[26px] font-semibold text-white ring-1 ring-white/10"
                        style={{ animation: `wordIn 0.45s var(--ease-out-soft) ${i * 55}ms both` }}
                      >
                        {d}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
                    <button
                      onClick={handleCopyCode}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-medium text-[#0E1F66] transition hover:bg-[#EEF4FB] cursor-pointer"
                    >
                      <Icon name={copiedCode ? "check" : "copy"} className="h-4 w-4" />
                      {copiedCode ? "Copiado!" : "Copiar código"}
                    </button>
                    <button
                      onClick={fetchRotativoCode}
                      title="Gerar novo código"
                      className="inline-flex items-center justify-center rounded-xl px-3 text-white ring-1 ring-white/20 transition hover:bg-white/10 cursor-pointer"
                    >
                      <Icon name="refresh" className={cn("h-4 w-4", loadingRotativo && "animate-spin")} />
                    </button>
                  </div>
                </div>
              </div>
            </HeroNavy>
          )}

          {/* ── Números ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile icon="play" tom="sky" label="Exibições hoje" valor={exibicoesHoje} dica="na sua tela" delay={0} />
            <StatTile icon="chart" tom="teal" label="Exibições no total" valor={stats?.totalExibicoesPonto ?? 0} dica="desde a conexão" delay={70} />
            <StatTile
              icon="clock"
              tom="navy"
              label="Tempo no ar"
              valor={Number(stats?.horasOnlineEstimadas ?? 0)}
              formatar={(v) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
              sufixo="h"
              dica="de anúncios exibidos"
              delay={140}
            />
            <StatTile icon="wallet" tom="amber" label="Repasse do mês" valor={repasse} formatar={moeda} dica="estimado" delay={210} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            {/* ── Programação da tela ──────────────────────── */}
            <div className="space-y-5">
              <SecaoTitulo
                titulo="Na sua tela agora"
                descricao={`${anuncios.length} de ${maxCotas} cotas ocupadas · os anúncios giram em sequência`}
                acao={
                  <Link
                    href="/ponto/anuncios"
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#2F6FA3] transition hover:text-[#0E1F66]"
                  >
                    Ver todos
                    <Icon name="arrow" className="h-4 w-4" />
                  </Link>
                }
              />

              {anuncios.length === 0 ? (
                <EmptyState
                  icon={<Icon name="tv" className="h-7 w-7" />}
                  title="Nenhum anúncio no ar ainda"
                  description="Quando uma marca for aprovada para a sua tela, ela aparece aqui automaticamente."
                />
              ) : (
                <ol className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                  {anuncios.map((ad, idx) => (
                    <li
                      key={ad.id}
                      className="group overflow-hidden rounded-2xl bg-white ring-1 ring-[#E4E7EC]/80 shadow-xs transition duration-300 hover:-translate-y-0.5 hover:shadow-lg animate-fade-in"
                      style={{ animationDelay: `${Math.min(idx, 8) * 50}ms` }}
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewAd(ad)}
                        className="relative block aspect-video w-full overflow-hidden bg-[#0E1F66] cursor-pointer"
                        title="Ver peça"
                      >
                        <Midia ad={ad} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
                        <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                        <span className="absolute left-3 top-3 flex h-7 min-w-7 items-center justify-center rounded-full bg-white/95 px-2 text-xs font-semibold text-[#0E1F66] shadow-sm">
                          {idx + 1}º
                        </span>
                        {isOnline && (
                          <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                            <PontoVivo className="h-1.5 w-1.5" />
                            No loop
                          </span>
                        )}
                        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 text-[11px] font-medium text-white/90">
                          <Icon name={ad.tipoMidia === "VIDEO" ? "play" : "eye"} className="h-3.5 w-3.5" />
                          {ad.tipoMidia === "VIDEO" ? "Vídeo" : "Imagem"} · {ad.duracaoSegundos}s
                        </span>
                        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#0E1F66] shadow-lg">
                            <Icon name="eye" className="h-5 w-5" />
                          </span>
                        </span>
                      </button>
                      <div className="flex items-start justify-between gap-2 p-4">
                        <div className="min-w-0">
                          <h3 className="truncate text-[15px] font-semibold text-[#0E1F66]">{ad.anunciante.nomeEmpresa}</h3>
                          <p className="mt-0.5 truncate text-[13px] text-[#8A93A3]">{ad.titulo}</p>
                        </div>
                        <button
                          type="button"
                          title="Solicitar remoção da sua TV"
                          onClick={() => handleOpenRemovalModal(ad)}
                          className="-mr-1 rounded-lg p-1.5 text-[#AEB6C4] opacity-0 transition hover:bg-amber-50 hover:text-amber-600 group-hover:opacity-100 cursor-pointer"
                        >
                          <Icon name="flag" className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* ── Coluna lateral ────────────────────────────── */}
            <aside className="space-y-5">
              <Painel className="p-5 animate-fade-in">
                <p className="text-[13px] font-medium text-[#667085]">Seus ganhos este mês</p>
                <p className="mt-2 font-heading text-3xl font-semibold tracking-tight text-[#0E1F66]">{moeda(repasse)}</p>

                <div className="mt-5 flex items-center gap-4 border-t border-[#EEF0F3] pt-5">
                  <Anel progresso={anuncios.length / maxCotas} tamanho={68} espessura={7} cor="#6F9483">
                    <span className="text-sm font-semibold text-[#0E1F66]">
                      {anuncios.length}/{maxCotas}
                    </span>
                  </Anel>
                  <div>
                    <p className="text-[13px] font-medium text-[#344054]">Cotas ocupadas</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#8A93A3]">
                      {maxCotas - anuncios.length > 0
                        ? `Ainda cabem ${maxCotas - anuncios.length} marcas na sua tela.`
                        : "Sua tela está com todas as cotas ocupadas."}
                    </p>
                  </div>
                </div>

                {porMarca > 0 && (
                  <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#8FAE9E]/10 p-3.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#8FAE9E]/20 text-[#3E6B57]">
                      <Icon name="trend" className="h-4 w-4" />
                    </span>
                    <p className="text-[13px] leading-snug text-[#1E4333]">
                      <strong className="font-semibold">+ {moeda(porMarca)}</strong> por mês a cada nova marca na sua tela.
                    </p>
                  </div>
                )}
              </Painel>

              {!isOnline && (
                <Painel className="p-5 animate-fade-in" >
                  <p className="text-[13px] font-medium text-[#667085]">Como conectar a TV</p>
                  <ol className="mt-4 space-y-4">
                    {PASSOS_CONEXAO.map((p, i) => (
                      <li key={p.titulo} className="flex gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#4F93C9]/10 text-[#2F6FA3]">
                          <Icon name={p.icone} className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-[13px] font-medium text-[#0E1F66]">
                            {i + 1}. {p.titulo}
                          </p>
                          <p className="text-xs text-[#8A93A3]">{p.texto}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </Painel>
              )}
            </aside>
          </div>
        </div>
      )}

      {/* Modal de pré-visualização da peça */}
      <Modal
        isOpen={Boolean(previewAd)}
        onClose={() => setPreviewAd(null)}
        title={previewAd?.titulo || "Anúncio"}
        description={previewAd ? `${previewAd.anunciante.nomeEmpresa} · ${previewAd.tipoMidia === "VIDEO" ? "Vídeo" : "Imagem"} de ${previewAd.duracaoSegundos}s` : ""}
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
        title="Retirar anúncio da sua TV"
        description="A equipe de moderação avalia o pedido e retira a peça da transmissão."
      >
        <div className="space-y-4">
          {requestError && <div className="rounded-xl bg-rose-50 p-3 text-[13px] text-rose-700">{requestError}</div>}

          {adToRequestRemoval && (
            <div className="flex items-center gap-3.5 rounded-2xl bg-[#F7F8FA] p-3">
              <div className="h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-[#0E1F66]">
                <Midia ad={adToRequestRemoval} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#0E1F66]">{adToRequestRemoval.titulo}</p>
                <p className="truncate text-xs text-[#8A93A3]">{adToRequestRemoval.anunciante.nomeEmpresa}</p>
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
              placeholder="Ex.: não combina com o perfil do seu público, concorrente direto, imagem com problema..."
              value={motivoRemocao}
              onChange={(e) => setMotivoRemocao(e.target.value)}
            />
          </div>

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

      {/* Modal QR code */}
      <Modal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} title="Abrir o player na TV" size="sm">
        <div className="flex flex-col items-center gap-4 text-center">
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="QR code do player" className="h-52 w-52 rounded-2xl p-2 ring-1 ring-[#E4E7EC]" />
          ) : (
            <Spinner size="lg" />
          )}
          <p className="text-sm text-[#667085]">Aponte a câmera ou acesse</p>
          <code className="rounded-xl bg-[#F4F5F7] px-3 py-1.5 font-mono text-sm text-[#0E1F66]">{playerUrl}</code>
          <p className="text-xs text-[#8A93A3]">Depois, digite o código de 6 números que aparece no painel.</p>
        </div>
      </Modal>

      {toastMessage && <Toast mensagem={toastMessage} onClose={() => setToastMessage(null)} />}
    </DashboardLayout>
  );
}
