"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
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
  anunciante: {
    nomeEmpresa: string;
    categoria: string;
  };
}

interface StatsPonto {
  tvOnline?: boolean;
  ultimaAtividade?: string;
  totalExibicoesPonto?: number;
  exibicoesPontoHoje?: number;
  horasOnlineEstimadas?: string;
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

  useEffect(() => {
    async function loadData() {
      try {
        const [userRes, anunciosRes, statsRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/anuncios?status=ATIVO"),
          fetch("/api/stats"),
        ]);

        if (userRes.ok) {
          const u = await userRes.json();
          setUser(u.user);
        }

        if (anunciosRes.ok) {
          const a = await anunciosRes.json();
          setAnuncios(a.anuncios || []);
        }

        if (statsRes.ok) {
          const s = await statsRes.json();
          setStats(s);
        }

        const appUrl =
          typeof window !== "undefined"
            ? window.location.origin
            : "http://localhost:3000";
        const playerUrl = `${appUrl}/player`;
        QRCode.toDataURL(playerUrl, {
          width: 250,
          margin: 1,
          color: { dark: "#051160", light: "#ffffff" },
        }).then((url) => setQrCodeUrl(url));
      } catch (err) {
        console.error("Ponto dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    // Polling a cada 20s para atualizar status online da TV
    const poll = setInterval(async () => {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          const s = await res.json();
          setStats(s);
        }
      } catch (e) {
        console.error("Poll error:", e);
      }
    }, 20000);

    return () => clearInterval(poll);
  }, []);

  const ponto = user?.pontoMidia;
  const playerUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/player`
      : "/player";

  const handleCopyCode = () => {
    if (!ponto?.codigoTv) return;
    navigator.clipboard.writeText(ponto.codigoTv);
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
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <DashboardLayout
      role="PONTO"
      userName={user?.nome || "Dono da TV"}
      userEmail={user?.email || ""}
      pontoId={ponto?.id}
      title="Painel do Estabelecimento"
      description={"Gerencie suas telas e veiculação de anúncios em " + (ponto?.nomeEmpresa || "")}
      actions={
        <div className="flex items-center gap-2">
          <Link href="/ponto/perfil">
            <Button size="sm" variant="secondary">
              ⚙️ Editar Perfil & Fotos
            </Button>
          </Link>
          <Link href="/player" target="_blank">
            <Button size="sm" variant="gradient">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Abrir Player TV 📺
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* CARD PRINCIPAL DE CONEXÃO & PAREAMENTO POR CÓDIGO */}
        {ponto && (
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#051160] via-[#0d2194] to-[#1e40af] text-white shadow-xl flex flex-col gap-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  {stats?.tvOnline ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-md">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      TV Conectada & Transmitindo Ao Vivo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30 backdrop-blur-md">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      Aguardando Conexão da TV
                    </span>
                  )}
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
                  Conecte sua Smart TV à Rede Media+
                </h3>
                <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed">
                  1. Abra o navegador da Smart TV e acesse: <strong className="text-white underline">{playerUrl}</strong><br/>
                  2. Digite na TV o código numérico exclusivo de 6 dígitos exibido ao lado.<br/>
                  3. Os anúncios começarão a rodar na hora em loop contínuo!
                </p>
              </div>

              {/* Bloco do Código Numérico em Destaque */}
              <div className="flex flex-col items-center bg-black/40 border border-white/20 p-5 sm:p-6 rounded-3xl backdrop-blur-md shrink-0 w-full lg:w-auto">
                <span className="text-[10px] uppercase font-bold tracking-widest text-blue-300 mb-1">
                  Código de Pareamento da TV
                </span>
                <div className="flex items-center gap-3 my-2">
                  <span className="text-4xl sm:text-5xl font-black font-mono tracking-widest text-white px-4 py-2 bg-blue-950/80 rounded-2xl border-2 border-blue-400 shadow-inner">
                    {ponto.codigoTv || "------"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 w-full">
                  <button
                    onClick={handleCopyCode}
                    className="flex-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedCode ? "✓ Código Copiado!" : "📋 Copiar Código"}
                  </button>
                  <button
                    onClick={() => setQrModalOpen(true)}
                    className="px-3 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs transition flex items-center justify-center gap-1 shadow-md cursor-pointer"
                  >
                    📲 QR Code
                  </button>
                </div>
              </div>
            </div>

            {/* Rodapé do Card com Link Rápido */}
            <div className="pt-4 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="font-bold text-blue-200 uppercase tracking-wider text-[10px]">
                  Página do Player:
                </span>
                <code className="bg-black/30 px-3 py-1.5 rounded-xl border border-white/10 text-white font-mono text-xs truncate max-w-md">
                  {playerUrl}
                </code>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition cursor-pointer"
                >
                  {copiedLink ? "✓ Link Copiado" : "Copiar Link"}
                </button>
                <Link href="/player" target="_blank">
                  <button className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition shadow-sm cursor-pointer">
                    Abrir no Navegador 📺
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* METRIFICAÇÃO E TELEMETRIA DA TV */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="border-l-4 border-l-emerald-500">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Exibições Hoje
                  </p>
                  <h3 className="text-3xl font-black text-slate-900 font-heading mt-1">
                    {stats?.exibicoesPontoHoje || 0}
                  </h3>
                  <span className="text-[11px] text-emerald-600 font-bold">
                    veiculações no dia
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl ring-1 ring-emerald-100">
                  📊
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border-l-4 border-l-blue-600">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Acumulado
                  </p>
                  <h3 className="text-3xl font-black text-slate-900 font-heading mt-1">
                    {stats?.totalExibicoesPonto || 0}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    reproduções na TV
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl ring-1 ring-blue-100">
                  🎬
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border-l-4 border-l-sky-500">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Tempo no Ar
                  </p>
                  <h3 className="text-3xl font-black text-slate-900 font-heading mt-1">
                    {stats?.horasOnlineEstimadas || "0.0"}h
                  </h3>
                  <span className="text-[11px] text-sky-600 font-bold">
                    horas transmitidas
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xl ring-1 ring-sky-100">
                  ⏱️
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="border-l-4 border-l-indigo-500">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Anúncios Rodando
                  </p>
                  <h3 className="text-3xl font-black text-slate-900 font-heading mt-1">
                    {anuncios.length}
                  </h3>
                  <span className="text-[11px] text-indigo-600 font-bold">
                    campanhas ativas
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl ring-1 ring-indigo-100">
                  📺
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* GRADE DE TRANSMISSÃO E PLAYLIST ATUAL */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 font-heading">
                  Grade de Transmissão da Sua TV
                </h3>
                <p className="text-xs text-slate-500">
                  Estes são os anúncios que estão passando no televisor agora em loop sequencial
                </p>
              </div>
              <Badge variant="brand">{anuncios.length} no ar</Badge>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {anuncios.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="Nenhum anúncio rodando no momento"
                  description="Assim que empresas parceiras criarem campanhas para o seu espaço e forem aprovadas pela moderação, elas começarão a passar automaticamente na sua tela."
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {anuncios.map((anuncio, idx) => (
                  <div
                    key={anuncio.id}
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 border border-blue-100">
                        {"#" + (idx + 1)}
                      </span>
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
                        <h4 className="font-bold text-slate-900 text-sm">
                          {anuncio.titulo}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Anunciante: <span className="font-semibold text-slate-700">{anuncio.anunciante.nomeEmpresa}</span> • Formato: <span className="font-semibold text-slate-700">{anuncio.tipoMidia} ({anuncio.duracaoSegundos}s)</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant="success">Passando na TV 🟢</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* FOTOS DO ESTABELECIMENTO */}
        {ponto?.fotos && ponto.fotos.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 font-heading">
                    Fotos do Estabelecimento Cadastradas
                  </h3>
                  <p className="text-xs text-slate-500">
                    Imagens exibidas para os anunciantes no mapa interativo
                  </p>
                </div>
                <Link href="/ponto/perfil">
                  <Button size="sm" variant="secondary">
                    Gerenciar Fotos
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {ponto.fotos.map((foto, idx) => (
                  <div key={idx} className="rounded-2xl overflow-hidden aspect-video border border-slate-200 shadow-xs bg-slate-900">
                    <img src={foto} alt={`Estabelecimento ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Modal QR Code */}
      <Modal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title="Abrir Player na Smart TV"
        description="Acesse o endereço da TV ou aponte a câmera para abrir direto"
      >
        <div className="flex flex-col items-center justify-center p-4 text-center">
          {qrCodeUrl ? (
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-md mb-4">
              <img
                src={qrCodeUrl}
                alt="QR Code Player TV"
                className="w-52 h-52 object-contain"
              />
            </div>
          ) : (
            <Spinner size="lg" />
          )}
          <p className="text-xs text-slate-600 max-w-sm leading-relaxed">
            No navegador da sua TV abra:
          </p>
          <code className="mt-2 px-3 py-1.5 bg-slate-100 rounded-xl text-blue-900 font-mono text-sm font-bold border border-slate-200">
            {playerUrl}
          </code>
          <p className="text-xs text-slate-500 mt-3">
            E digite o código: <strong className="text-slate-900 font-mono text-base">{ponto?.codigoTv}</strong>
          </p>
          <div className="mt-6 flex justify-center">
            <Button variant="secondary" onClick={() => setQrModalOpen(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
