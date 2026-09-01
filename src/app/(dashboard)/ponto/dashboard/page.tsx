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

export default function PontoDashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const [anuncios, setAnuncios] = useState<AnuncioTV[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [userRes, anunciosRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/anuncios?status=ATIVO"),
        ]);

        if (userRes.ok) {
          const u = await userRes.json();
          setUser(u.user);

          if (u.user?.pontoMidia?.id) {
            const appUrl =
              typeof window !== "undefined"
                ? window.location.origin
                : "http://localhost:3000";
            const tvUrl = `${appUrl}/tv/${u.user.pontoMidia.id}`;
            QRCode.toDataURL(tvUrl, {
              width: 250,
              margin: 1,
              color: { dark: "#051160", light: "#ffffff" },
            }).then((url) => setQrCodeUrl(url));
          }
        }

        if (anunciosRes.ok) {
          const a = await anunciosRes.json();
          setAnuncios(a.anuncios || []);
        }
      } catch (err) {
        console.error("Ponto dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const ponto = user?.pontoMidia;
  const tvUrl = ponto
    ? typeof window !== "undefined"
      ? `${window.location.origin}/tv/${ponto.id}`
      : `/tv/${ponto.id}`
    : "";

  const handleCopyLink = () => {
    if (!tvUrl) return;
    navigator.clipboard.writeText(tvUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
      userName={user?.nome || "Dono do Ponto"}
      userEmail={user?.email || ""}
      pontoId={ponto?.id}
      title="Painel do Estabelecimento"
      description={"Gerencie a exibição e os anúncios ativos no seu espaço (" + (ponto?.nomeEmpresa || "") + ")"}
      actions={
        ponto && (
          <Link href={"/tv/" + ponto.id} target="_blank">
            <Button size="sm" variant="gradient">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Abrir Player TV 📺
            </Button>
          </Link>
        )
      }
    >
      <div className="space-y-6">
        {ponto && (
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#051160] via-[#0d2194] to-[#2563eb] text-white shadow-xl flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/20 mb-3 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Pronto para Transmissão
                </span>
                <h3 className="text-xl sm:text-2xl font-bold font-heading">
                  Conecte esta tela ao seu televisor
                </h3>
                <p className="text-xs sm:text-sm text-blue-100/80 mt-1.5 max-w-xl leading-relaxed">
                  Abra o link no navegador da Smart TV ou em qualquer TV Box via HDMI. A tela roda em loop contínuo e sincroniza novos anúncios em tempo real.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Button
                  size="lg"
                  onClick={() => setQrModalOpen(true)}
                  className="bg-white/15 hover:bg-white/25 text-white font-bold border border-white/20 backdrop-blur-md shadow-sm cursor-pointer"
                >
                  Ver QR Code 📲
                </Button>
                <Link href={"/tv/" + ponto.id} target="_blank">
                  <Button size="lg" className="bg-white hover:bg-slate-100 text-blue-950 font-bold shadow-md">
                    Iniciar na TV 📺
                  </Button>
                </Link>
              </div>
            </div>

            {/* Caixa com Link Copiável */}
            <div className="pt-4 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="font-bold text-blue-200 uppercase tracking-wider text-[10px]">
                  Link da TV:
                </span>
                <code className="bg-black/30 px-3 py-1.5 rounded-xl border border-white/10 text-white font-mono text-xs truncate max-w-md">
                  {tvUrl}
                </code>
              </div>
              <button
                onClick={handleCopyLink}
                className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copied ? (
                  <>
                    <span className="text-emerald-400">✓</span> Link Copiado!
                  </>
                ) : (
                  <>
                    <span>📋</span> Copiar Link
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card className="border-l-4 border-l-emerald-500">
            <CardBody>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Anúncios Rodando Agora
              </p>
              <h3 className="text-3xl font-black text-slate-900 font-heading mt-1">
                {anuncios.length}
              </h3>
            </CardBody>
          </Card>

          <Card className="border-l-4 border-l-blue-600">
            <CardBody>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Status do Ponto
              </p>
              <div className="mt-2">
                {ponto?.status === "ATIVO" ? (
                  <Badge variant="success" size="md">Ativo no Mapa</Badge>
                ) : (
                  <Badge variant="warning" size="md">Em Validação</Badge>
                )}
              </div>
            </CardBody>
          </Card>

          <Card className="border-l-4 border-l-sky-500">
            <CardBody>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                TVs Cadastradas
              </p>
              <h3 className="text-3xl font-black text-slate-900 font-heading mt-1">
                {ponto?.quantidadeTvs || 1}
              </h3>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 font-heading">
                  Grade de Exibição da Sua TV (Playlist Atual)
                </h3>
                <p className="text-xs text-slate-500">
                  Estes são os anúncios que estão passando no televisor neste momento
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {anuncios.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="Nenhum anúncio rodando no momento"
                  description="Assim que novos anúncios forem enviados por empresas parceiras e aprovados pelos administradores, eles começarão a ser exibidos automaticamente na sua TV."
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
                      <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100">
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
                          Anunciante: <span className="font-semibold text-slate-700">{anuncio.anunciante.nomeEmpresa}</span> ({anuncio.anunciante.categoria}) • Duração: <span className="font-semibold text-slate-700">{anuncio.duracaoSegundos}s</span>
                        </p>
                      </div>
                    </div>

                    <Badge variant="success">Passando na TV</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Modal QR Code de Acesso Fácil na Smart TV */}
      <Modal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title="Abrir Player na Smart TV"
        description="Aponte a câmera do celular para testar ou escaneie o código no navegador da TV"
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
            Abra o navegador da sua TV e acerte o endereço:
          </p>
          <code className="mt-2 px-3 py-1 bg-slate-100 rounded-lg text-slate-900 font-mono text-xs font-bold border border-slate-200">
            {tvUrl}
          </code>
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
