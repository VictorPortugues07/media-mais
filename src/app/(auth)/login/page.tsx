"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha ao entrar");
      }

      if (data.user.role === "ADMIN") {
        window.location.href = "/admin/dashboard";
      } else if (data.user.role === "PONTO") {
        window.location.href = "/ponto/dashboard";
      } else {
        window.location.href = "/anunciante/dashboard";
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao conectar";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1.05fr] bg-white">
      {/* Formulário */}
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link href="/" className="inline-flex w-fit transition-opacity hover:opacity-80">
          <Logo className="h-7 w-auto" />
        </Link>

        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-sm py-12 animate-fade-in">
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-[#0E1F66]">
              Bem-vindo de volta
            </h1>
            <p className="mt-2 text-[15px] text-[#667085]">Entre para acompanhar suas telas e campanhas.</p>

            <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
              )}

              <Input
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              <Input
                label="Senha"
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
                required
              />

              <Button type="submit" variant="navy" size="lg" className="w-full" loading={loading}>
                Entrar
              </Button>
            </form>

            <p className="mt-10 text-sm text-[#667085]">Ainda não tem conta?</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Link
                href="/cadastro/anunciante"
                className="rounded-xl px-3 py-2.5 text-center text-sm font-medium text-[#0E1F66] ring-1 ring-[#E4E7EC] transition hover:bg-[#F7F8FA] hover:ring-[#D5DAE3]"
              >
                Quero anunciar
              </Link>
              <Link
                href="/cadastro/ponto"
                className="rounded-xl px-3 py-2.5 text-center text-sm font-medium text-[#0E1F66] ring-1 ring-[#E4E7EC] transition hover:bg-[#F7F8FA] hover:ring-[#D5DAE3]"
              >
                Tenho uma TV
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Painel da marca */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#0B1A57] p-12 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(90%_70%_at_100%_0%,rgba(79,147,201,0.35),transparent_60%)]" />
        <div aria-hidden="true" className="absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:22px_22px]" />

        <p className="relative text-sm text-white/60">Rede Media+</p>

        <div className="relative">
          <div className="rounded-2xl bg-[#05092A] p-2 shadow-2xl ring-1 ring-white/10 animate-float-slow">
            <div className="relative aspect-video overflow-hidden rounded-xl">
              <img
                src="/uploads/demo/anuncios/meganutri-creatina.webp"
                alt="Anúncio exibido na rede Media+"
                className="h-full w-full object-cover"
              />
              <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-[#8FAE9E] animate-pulse" />
                Ao vivo
              </span>
            </div>
          </div>
          <h2 className="mt-12 font-heading text-4xl font-semibold leading-[1.1] tracking-tight">
            Sua marca onde as pessoas estão.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/65">
            Acompanhe exibições, aprove anúncios e gerencie suas telas em um só lugar.
          </p>
        </div>

        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} Media+</p>
      </div>
    </div>
  );
}
