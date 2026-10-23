"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface PontoOption {
  id: number;
  nomeEmpresa: string;
  categoria: string;
  cidade: string;
  uf: string;
  aceitaNovosAnuncios: boolean;
  tempoOcupadoSegundos: number;
  tempoDisponivelSegundos: number;
  limiteTempoSegundos: number;
  porcentagemOcupada: number;
  quantidadeFilaEspera: number;
  proximaLiberacao?: string | null;
  maxCotas?: number;
  cotasOcupadas?: number;
  cotasDisponiveis?: number;
  tier?: string;
  cotaMensal?: number;
}

function NovoAnuncioForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedPontoId = searchParams.get("pontoId");

  const [user, setUser] = useState<any>(null);
  const [pontos, setPontos] = useState<PontoOption[]>([]);
  const [selectedPontoId, setSelectedPontoId] = useState<string>(
    preSelectedPontoId || ""
  );
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [duracaoSegundos, setDuracaoSegundos] = useState(10);
  const [tipoMidia, setTipoMidia] = useState<"VIDEO" | "IMAGEM">("IMAGEM");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function init() {
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
          if (!selectedPontoId && p.pontos && p.pontos.length > 0) {
            setSelectedPontoId(String(p.pontos[0].id));
          }
        }
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [selectedPontoId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setError("");

      if (selectedFile.type.startsWith("video/")) {
        const tempVideo = document.createElement("video");
        tempVideo.preload = "metadata";
        tempVideo.src = URL.createObjectURL(selectedFile);

        tempVideo.onloadedmetadata = () => {
          window.URL.revokeObjectURL(tempVideo.src);
          const duration = Math.round(tempVideo.duration);

          if (duration > 30) {
            setError(
              `O vídeo selecionado tem ${duration}s de duração. O limite máximo permitido por vídeo/anúncio é de 30 segundos.`
            );
            setFile(null);
            setPreviewUrl(null);
            return;
          }

          setTipoMidia("VIDEO");
          setDuracaoSegundos(duration > 0 ? duration : 15);
          setFile(selectedFile);
          const objectUrl = URL.createObjectURL(selectedFile);
          setPreviewUrl(objectUrl);
        };
      } else {
        setTipoMidia("IMAGEM");
        setDuracaoSegundos(10);
        setFile(selectedFile);
        const objectUrl = URL.createObjectURL(selectedFile);
        setPreviewUrl(objectUrl);
      }
    }
  };

  const handleRemoveSelectedFile = () => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setTipoMidia("IMAGEM");
    setDuracaoSegundos(10);
    setError("");
  };

  const selectedPonto = pontos.find((p) => String(p.id) === selectedPontoId);
  const isPontoBloqueado = selectedPonto ? !selectedPonto.aceitaNovosAnuncios : false;
  const maxCotasPonto = selectedPonto?.maxCotas || 8;
  const cotasOcupadasPonto = selectedPonto?.cotasOcupadas ?? 0;
  const cotasLotadas = selectedPonto ? cotasOcupadasPonto >= maxCotasPonto : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Por favor, selecione um arquivo de vídeo ou imagem para a TV");
      return;
    }
    if (!selectedPontoId) {
      setError("Por favor, selecione onde quer veicular o anúncio");
      return;
    }
    if (isPontoBloqueado) {
      setError("Este estabelecimento está temporariamente com solicitações pausadas pela moderação.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "Falha ao enviar arquivo de mídia");
      }

      const anuncioRes = await fetch("/api/anuncios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pontoMidiaId: Number(selectedPontoId),
          titulo,
          descricao,
          tipoMidia: uploadData.type,
          midiaUrl: uploadData.url,
          duracaoSegundos: Number(duracaoSegundos),
        }),
      });

      const anuncioData = await anuncioRes.json();
      if (!anuncioRes.ok) {
        throw new Error(anuncioData.error || "Falha ao registrar anúncio");
      }

      router.push("/anunciante/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao enviar anúncio";
      setError(message);
    } finally {
      setSubmitting(false);
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
      role="ANUNCIANTE"
      userName={user?.nome || "Anunciante"}
      userEmail={user?.email || ""}
      title="Criar Novo Anúncio"
      description="Envie sua peça promocional para aprovação e veiculação na TV escolhida"
    >
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-sm">
          <CardHeader>
            <h3 className="text-base font-bold text-slate-900 font-heading">
              Configurar Campanha
            </h3>
            <p className="text-xs text-slate-500">
              O anúncio passará por moderação antes de entrar na transmissão.
            </p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700">
                  {error}
                </div>
              )}

              <div>
                <Select
                  label="Ponto de TV para Veiculação"
                  required
                  options={pontos.map((p) => {
                    const isBloq = !p.aceitaNovosAnuncios;
                    const maxCotas = p.maxCotas || 8;
                    const ocupadas = p.cotasOcupadas || 0;
                    const isLotado = ocupadas >= maxCotas;
                    const preco = (p.cotaMensal ?? 249).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    });
                    let tag = "";
                    if (isBloq) tag = " [Pausado]";
                    else if (isLotado) tag = ` [Fila: ${p.quantidadeFilaEspera} aguardando]`;
                    else tag = ` [${maxCotas - ocupadas} cotas livres]`;

                    return {
                      value: String(p.id),
                      label: `${p.nomeEmpresa} (${p.cidade}) · ${p.tier ?? "Tier"} ${preco}/mês${tag}`,
                    };
                  })}
                  value={selectedPontoId}
                  onChange={(e) => setSelectedPontoId(e.target.value)}
                />

                {/* Card Informativo de Precificação, Cotas e Fila do Ponto Selecionado */}
                {selectedPonto && (() => {
                  const maxCotas = selectedPonto.maxCotas || 8;
                  const cotasOcupadas = selectedPonto.cotasOcupadas || 0;
                  const cotasDisponiveis = Math.max(0, maxCotas - cotasOcupadas);
                  const perc = Math.min(100, Math.round((cotasOcupadas / maxCotas) * 100));
                  const precoFormatado = (selectedPonto.cotaMensal ?? 249).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  });

                  return (
                    <div className="mt-3 p-4 bg-[#F7F8FA] border border-[#E4E7EC] rounded-2xl text-xs space-y-3">
                      {/* Banner do Preço da Cota */}
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#E4E7EC] shadow-xs">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9AA3AF]">
                            Investimento da Cota
                          </span>
                          <p className="text-xl font-black font-heading text-emerald-600">
                            {precoFormatado}
                            <span className="text-xs font-normal text-[#9AA3AF]"> /mês</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black border ${
                              selectedPonto.tier === "Ouro"
                                ? "bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]"
                                : selectedPonto.tier === "Prata"
                                ? "bg-[#F1F5F9] text-[#334155] border-[#CBD5E1]"
                                : "bg-[#FFEDD5] text-[#9A3412] border-[#FDBA74]"
                            }`}
                          >
                            {selectedPonto.tier ?? "Tier Ouro"}
                          </span>
                          <p className="text-[10px] text-[#9AA3AF] mt-0.5">1 cota no loop da TV</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-bold text-[#344054]">
                          Ocupação de Cotas ({cotasOcupadas}/{maxCotas}):
                        </span>
                        {isPontoBloqueado ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-extrabold text-[11px]">
                            Novas Solicitações Pausadas
                          </span>
                        ) : cotasLotadas ? (
                          <span className="px-2 py-0.5 rounded-md bg-[#FEF3C7] text-[#92400E] font-extrabold text-[11px] border border-[#FCD34D]">
                            Entrará na Fila de Espera
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-[#D8E8E1] text-[#1E4333] font-extrabold text-[11px] border border-[#8FAE9E]/40">
                            {cotasDisponiveis} cota(s) disponível(is)
                          </span>
                        )}
                      </div>

                      {/* Barra de Progresso de Cotas */}
                      <div className="w-full bg-[#E4E7EC] rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            cotasLotadas
                              ? "bg-amber-500"
                              : perc > 75
                              ? "bg-[#4F93C9]"
                              : "bg-[#8FAE9E]"
                          }`}
                          style={{ width: `${perc}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#9AA3AF]">
                        <span>
                          Cotas ativas: <strong className="text-[#0E1F66]">{cotasOcupadas}</strong> de {maxCotas} ({perc}%)
                        </span>
                        <span>
                          Fila de espera: <strong className="text-[#0E1F66]">{selectedPonto.quantidadeFilaEspera}</strong> na fila
                        </span>
                      </div>

                      {isPontoBloqueado ? (
                        <p className="text-[11px] text-rose-700 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                          O administrador deste estabelecimento pausou temporariamente o recebimento de novas campanhas. Por favor, escolha outro ponto na lista.
                        </p>
                      ) : cotasLotadas ? (
                        <p className="text-[11px] text-[#92400E] font-medium bg-[#FEF3C7] p-2.5 rounded-xl border border-[#FCD34D]">
                          Todas as {maxCotas} cotas desta TV estão preenchidas. Seu anúncio será aprovado pela moderação e colocado na <strong>Fila de Espera</strong>. Assim que uma empresa concluir a veiculação, seu anúncio começará a passar na TV automaticamente!
                        </p>
                      ) : null}
                    </div>
                  );
                })()}
              </div>

              <Input
                label="Título do Anúncio / Campanha"
                required
                placeholder="Ex: Promoção de Inverno 2026"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#344054] mb-1.5">
                  Descrição detalhada da peça
                </label>
                <textarea
                  rows={3}
                  required
                  className="w-full rounded-xl border border-[#E4E7EC] p-3 text-sm text-[#0E1F66] placeholder:text-[#9AA3AF] focus:border-[#4F93C9] focus:ring-2 focus:ring-[#4F93C9]/20 outline-none transition"
                  placeholder="Explique o objetivo da campanha, público-alvo, ofertas em destaque..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#344054] mb-2">
                  Arquivo de Mídia (Proporção recomendada: 16:9 Paisagem)
                </label>

                <div className="border-2 border-dashed border-[#E4E7EC] rounded-2xl p-6 text-center hover:border-[#4F93C9] transition bg-[#F7F8FA]/60">
                  <input
                    type="file"
                    id="media-upload"
                    accept="video/mp4,video/webm,image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor="media-upload"
                    className="cursor-pointer flex flex-col items-center justify-center"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#4F93C9]/10 text-[#4F93C9] flex items-center justify-center mb-3 border border-[#4F93C9]/20">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-[#4F93C9]">
                      {file ? file.name : "Clique para selecionar seu vídeo ou imagem"}
                    </span>
                    <span className="text-xs text-[#9AA3AF] mt-1">
                      Formatos aceitos: MP4, WebM, JPG, PNG (Máx 30s para vídeos, máx 50MB)
                    </span>
                  </label>
                </div>

                {file && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3 p-3 bg-[#4F93C9]/10 border border-[#4F93C9]/30 rounded-xl text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-[#0E1F66]">
                        {tipoMidia === "VIDEO" ? `Vídeo Selecionado (${duracaoSegundos}s):` : "Imagem Selecionada:"}
                      </span>
                      <span className="text-[#344054] font-semibold truncate">{file.name}</span>
                      <span className="text-[#9AA3AF] shrink-0">
                        ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveSelectedFile}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition cursor-pointer self-start sm:self-auto flex items-center gap-1 shrink-0 border border-rose-200"
                    >
                      Remover arquivo
                    </button>
                  </div>
                )}

                {previewUrl && (
                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#0E1F66] mb-2">
                      Pré-visualização na Proporção da TV (16:9):
                    </p>
                    <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                      {tipoMidia === "VIDEO" ? (
                        <video preload="metadata"
                          src={previewUrl}
                          controls
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <img loading="lazy" decoding="async"
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Link href="/anunciante/dashboard">
                  <Button variant="ghost" type="button">
                    Cancelar
                  </Button>
                </Link>
                <Button
                  type="submit"
                  size="lg"
                  variant="primary"
                  loading={submitting}
                  disabled={isPontoBloqueado}
                >
                  {isPontoBloqueado
                    ? "Solicitações Bloqueadas"
                    : cotasLotadas
                    ? "Enviar para Fila de Espera"
                    : "Enviar para Moderação"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function NovoAnuncioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-ink">
          <Spinner size="lg" />
        </div>
      }
    >
      <NovoAnuncioForm />
    </Suspense>
  );
}
