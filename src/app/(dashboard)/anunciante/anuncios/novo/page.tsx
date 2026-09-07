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

          if (duration > 60) {
            setError(
              `O vídeo selecionado tem ${duration}s de duração. O limite máximo permitido por anúncio é de 60 segundos.`
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

              <Select
                label="Ponto de TV para Veiculação"
                required
                options={pontos.map((p) => ({
                  value: String(p.id),
                  label: p.nomeEmpresa + " - " + p.categoria + " (" + p.cidade + "/" + p.uf + ")",
                }))}
                value={selectedPontoId}
                onChange={(e) => setSelectedPontoId(e.target.value)}
              />

              <Input
                label="Título do Anúncio / Campanha"
                required
                placeholder="Ex: Promoção de Inverno 2026"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Descrição detalhada da peça
                </label>
                <textarea
                  rows={3}
                  required
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                  placeholder="Explique o objetivo da campanha, público-alvo, ofertas em destaque..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Arquivo de Mídia (Proporção recomendada: 16:9 Paisagem)
                </label>

                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-blue-500 transition bg-slate-50/50">
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
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 ring-1 ring-blue-100">
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
                    <span className="text-sm font-bold text-blue-600">
                      {file ? file.name : "Clique para selecionar seu vídeo ou imagem"}
                    </span>
                    <span className="text-xs text-slate-400 mt-1">
                      Formatos aceitos: MP4, WebM, JPG, PNG (Máx 50MB)
                    </span>
                  </label>
                </div>

                {file && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3 p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-blue-900">
                        {tipoMidia === "VIDEO" ? "🎬 Vídeo Selecionado:" : "🖼️ Imagem Selecionada:"}
                      </span>
                      <span className="text-slate-700 font-semibold truncate">{file.name}</span>
                      <span className="text-slate-400 shrink-0">
                        ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveSelectedFile}
                      className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs transition cursor-pointer self-start sm:self-auto flex items-center gap-1 shrink-0"
                    >
                      ✕ Remover arquivo
                    </button>
                  </div>
                )}

                {previewUrl && (
                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Pré-visualização na Proporção da TV (16:9):
                    </p>
                    <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                      {tipoMidia === "VIDEO" ? (
                        <video
                          src={previewUrl}
                          controls
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <img
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
                <Button type="submit" size="lg" variant="gradient" loading={submitting}>
                  Enviar para Moderação 🚀
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
