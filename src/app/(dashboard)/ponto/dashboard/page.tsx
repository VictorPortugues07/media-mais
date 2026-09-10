"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";

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
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
              {label}
            </p>
            <p className={`text-3xl font-black font-heading mt-1.5 ${color}`}>{value}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
          </div>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0 bg-slate-50 ring-1 ring-slate-200/80`}>
            {icon}
          </div>
        </div>
      </CardBody>
    </Card>
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
  const [rotativoSegundos, setRotativoSegundos] = useState<number>(30);
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
      setToastMessage("Solicitação de remoção enviada com sucesso para a moderação!");
      setTimeout(() => setToastMessage(null), 4500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar solicitação";
      setRequestError(msg);
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
        setRotativoSegundos(30);
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

        const appUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
        QRCode.toDataURL(`${appUrl}/player`, {
          width: 250,
          margin: 1,
          color: { dark: "#051160", light: "#ffffff" },
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
        if (prev <= 1) { fetchRotativoCode(); return 30; }
        return prev - 1;
      });
    }, 1000);

    const poll = setInterval(async () => {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) setStats(await res.json());
      } catch {}
    }, 3000);

    return () => { clearInterval(poll); clearInterval(rotativoTimer); };
  }, []);

  const ponto = user?.pontoMidia;
  const playerUrl = typeof window !== "undefined" ? `${window.location.origin}/player` : "/player";

  const handleCopyCode = () => {
    const code = rotativoCode || ponto?.codigoTv;
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(playerUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  const isOnline = stats?.tvOnline ?? false;

  return (
    <DashboardLayout
      role="PONTO"
      userName={user?.nome || "Dono da TV"}
      userEmail={user?.email || ""}
      userAvatar={user?.avatarUrl || null}
      pontoId={ponto?.id}
      title="Painel do Estabelecimento"
      description={ponto?.nomeEmpresa || ""}
    >
      <div className="space-y-6">

        {/* ── Hero de Conexão ─────────────────────────────────────────── */}
        {ponto && (
          <div className="rounded-3xl bg-gradient-to-br from-[#051160] via-[#0d2194] to-[#1a3fbf] text-white shadow-xl overflow-hidden">
            <div className="p-6 sm:p-8 flex flex-col lg:flex-row gap-8">
              {/* Esquerda — Status + instruções */}
              <div className="flex-1 space-y-4">
                <div>
                  {isOnline ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      TV Conectada · Transmitindo Ao Vivo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Aguardando Conexão
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
                    Conecte sua TV à Rede Media+
                  </h2>
                  <p className="text-sm text-blue-100/80 mt-2 leading-relaxed max-w-lg">
                    Abra <strong className="text-white">{playerUrl}</strong> no navegador da Smart TV e digite o código ao lado.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <code className="bg-black/30 px-3 py-1.5 rounded-xl border border-white/10 text-white font-mono text-xs truncate max-w-xs">
                    {playerUrl}
                  </code>
                  <button
                    onClick={handleCopyLink}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition cursor-pointer"
                  >
                    {copiedLink ? "✓ Copiado" : "Copiar"}
                  </button>
                </div>
              </div>

              {/* Direita — Código rotativo */}
              <div className="flex flex-col items-center bg-black/30 border border-white/15 p-5 rounded-2xl shrink-0 w-full lg:w-64 backdrop-blur-sm">
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">
                    Código de Conexão
                  </span>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                    ⏱ {rotativoSegundos}s
                  </span>
                </div>

                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mb-4">
                  <div
                    className="bg-blue-400 h-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(rotativoSegundos / 30) * 100}%` }}
                  />
                </div>

                <span className="text-5xl font-black font-mono tracking-[0.2em] text-white px-4 py-3 bg-[#020d3a] rounded-2xl border-2 border-blue-500/60 shadow-inner">
                  {loadingRotativo ? "······" : (rotativoCode || ponto.codigoTv || "------")}
                </span>
                <p className="text-[10px] text-blue-200/50 mt-2 mb-3 text-center">
                  Renovado automaticamente a cada 30s
                </p>

                <div className="flex items-center gap-2 w-full">
                  <button
                    onClick={handleCopyCode}
                    className="flex-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedCode ? "✓ Copiado!" : "Copiar"}
                  </button>
                  <button
                    onClick={fetchRotativoCode}
                    title="Gerar novo código"
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs transition flex items-center justify-center cursor-pointer"
                  >
                    🔄
                  </button>
                  <button
                    onClick={() => setQrModalOpen(true)}
                    className="px-3 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    QR
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── KPIs ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Exibições Hoje"
            value={stats?.exibicoesPontoHoje ?? 0}
            sub="veiculações no dia"
            icon="📊"
            color="text-emerald-600"
          />
          <KpiCard
            label="Total Acumulado"
            value={stats?.totalExibicoesPonto ?? 0}
            sub="reproduções na TV"
            icon="🎬"
            color="text-blue-600"
          />
          <KpiCard
            label="Tempo no Ar"
            value={`${stats?.horasOnlineEstimadas ?? "0.0"}h`}
            sub="horas transmitidas"
            icon="⏱"
            color="text-sky-600"
          />
          <KpiCard
            label="Anúncios Ativos"
            value={anuncios.length}
            sub="campanhas em loop"
            icon="📺"
            color="text-indigo-600"
          />
        </div>

        {/* ── Playlist atual ───────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 font-heading">Grade de Transmissão</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Anúncios em loop contínuo na sua TV · Loop:{" "}
                  <strong>
                    {anuncios.reduce((acc, a) => acc + (a.duracaoSegundos || 10), 0)}s de 360s (6 min)
                  </strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={anuncios.length > 0 ? "success" : "default"}>
                  {anuncios.length} no ar (
                  {anuncios.reduce((acc, a) => acc + (a.duracaoSegundos || 10), 0)}s)
                </Badge>
                <Link href="/ponto/anuncios">
                  <button className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition px-2 py-1 rounded-lg hover:bg-blue-50 cursor-pointer">
                    Ver todos →
                  </button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {anuncios.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="Nenhum anúncio rodando"
                  description="Quando campanhas forem aprovadas para o seu espaço, elas aparecerão aqui automaticamente."
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {anuncios.map((ad, idx) => (
                  <div key={ad.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50/70 transition">
                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 border border-blue-100">
                      {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewAd(ad)}
                      title="Clique para visualizar mídia"
                      className="w-14 h-10 bg-slate-900 rounded-lg overflow-hidden shrink-0 relative group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {ad.tipoMidia === "VIDEO" ? (
                        <video src={ad.midiaUrl} muted className="w-full h-full object-cover" />
                      ) : (
                        <img src={ad.midiaUrl} alt={ad.titulo} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                    </button>
                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => setPreviewAd(ad)}
                        className="font-semibold text-slate-800 text-sm truncate hover:text-blue-600 transition text-left cursor-pointer"
                      >
                        {ad.titulo}
                      </button>
                      <p className="text-xs text-slate-400 truncate">
                        {ad.anunciante.nomeEmpresa} · {ad.tipoMidia === "VIDEO" ? `${ad.duracaoSegundos}s` : "Imagem"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="success">Ao vivo</Badge>
                      <button
                        type="button"
                        title="Visualizar peça"
                        onClick={() => setPreviewAd(ad)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        title="Solicitar remoção deste anúncio da sua TV"
                        onClick={() => handleOpenRemovalModal(ad)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Modal de Pré-visualização da Peça */}
      <Modal
        isOpen={Boolean(previewAd)}
        onClose={() => setPreviewAd(null)}
        title={previewAd?.titulo || "Visualização da Transmissão"}
        description={previewAd ? `Anunciante: ${previewAd.anunciante.nomeEmpresa} · Formato: ${previewAd.tipoMidia} (${previewAd.duracaoSegundos}s)` : ""}
        size="lg"
      >
        {previewAd && (
          <div className="space-y-4">
            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center relative">
              {previewAd.tipoMidia === "VIDEO" ? (
                <video
                  src={previewAd.midiaUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={previewAd.midiaUrl}
                  alt={previewAd.titulo}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const ad = previewAd;
                  setPreviewAd(null);
                  handleOpenRemovalModal(ad);
                }}
                className="text-amber-700 hover:text-amber-800 hover:bg-amber-50 border-amber-200"
              >
                <svg className="w-4 h-4 mr-1.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Solicitar Remoção à Moderação
              </Button>

              <Button variant="ghost" size="sm" onClick={() => setPreviewAd(null)}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Solicitação de Remoção */}
      <Modal
        isOpen={removalModalOpen}
        onClose={() => !requestingRemoval && setRemovalModalOpen(false)}
        title="Solicitar Remoção de Anúncio"
        description="Envie um pedido à administração para retirar esta campanha da sua TV."
      >
        <div className="space-y-4">
          {requestError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
              {requestError}
            </div>
          )}

          {adToRequestRemoval && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3.5">
              <div className="w-14 h-10 bg-slate-900 rounded-lg overflow-hidden shrink-0">
                {adToRequestRemoval.tipoMidia === "VIDEO" ? (
                  <video src={adToRequestRemoval.midiaUrl} muted className="w-full h-full object-cover" />
                ) : (
                  <img src={adToRequestRemoval.midiaUrl} alt={adToRequestRemoval.titulo} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-sm truncate">{adToRequestRemoval.titulo}</p>
                <p className="text-xs text-slate-500 truncate">
                  Anunciante: {adToRequestRemoval.anunciante.nomeEmpresa}
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Motivo da Solicitação <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
              placeholder="Explique o motivo (ex: conteúdo inadequado para o perfil do seu público, marca concorrente direta, imagem com problema...)"
              value={motivoRemocao}
              onChange={(e) => setMotivoRemocao(e.target.value)}
            />
          </div>

          <p className="text-xs text-slate-500 leading-relaxed bg-amber-50/70 p-3 rounded-xl border border-amber-200/70 text-amber-900">
            <strong>Importante:</strong> Como dono da tela, sua solicitação será avaliada pela equipe administrativa. A peça será removida da transmissão assim que aprovada.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setRemovalModalOpen(false)} disabled={requestingRemoval}>
              Cancelar
            </Button>
            <Button
              variant="gradient"
              loading={requestingRemoval}
              disabled={!motivoRemocao.trim() || motivoRemocao.trim().length < 5}
              onClick={handleConfirmRequestRemoval}
            >
              Enviar Solicitação
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-700 text-white rounded-2xl shadow-xl text-xs font-bold animate-fade-in border border-emerald-500">
          <svg className="w-4 h-4 text-emerald-200 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)} className="ml-2 text-emerald-200 hover:text-white cursor-pointer">✕</button>
        </div>
      )}

      {/* Modal QR Code */}
      <Modal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} title="Abrir Player na Smart TV">
        <div className="flex flex-col items-center text-center gap-4 p-2">
          {qrCodeUrl ? (
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-md">
              <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 object-contain" />
            </div>
          ) : (
            <Spinner size="lg" />
          )}
          <p className="text-xs text-slate-500 max-w-xs">
            Aponte a câmera da TV ou acesse:
          </p>
          <code className="px-3 py-1.5 bg-slate-100 rounded-xl text-blue-900 font-mono text-sm font-bold border border-slate-200">
            {playerUrl}
          </code>
          <p className="text-xs text-slate-400">E digite o código de 6 dígitos exibido na tela.</p>
          <Button variant="secondary" onClick={() => setQrModalOpen(false)}>Fechar</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
