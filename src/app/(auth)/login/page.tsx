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
    <div className="min-h-screen bg-ink flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex justify-center transition-opacity hover:opacity-80">
          <Logo className="h-8 w-auto" />
        </Link>
        <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 font-heading">
          Acesse a plataforma
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-600">
          Entre com seu e-mail e senha cadastrados
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm shadow-slate-900/5 sm:rounded-2xl border border-slate-200/80">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="gradient"
              className="w-full py-2.5 mt-2"
              loading={loading}
            >
              Entrar na plataforma
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400 font-semibold tracking-wider text-[10px]">
                  Ainda não possui conta?
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link
                href="/cadastro/ponto"
                className="flex items-center justify-center px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition text-center"
              >
                Cadastrar TV 📺
              </Link>
              <Link
                href="/cadastro/anunciante"
                className="flex items-center justify-center px-3 py-2 border border-blue-200 bg-blue-50/60 rounded-xl text-xs font-semibold text-blue-700 hover:bg-blue-50 transition text-center"
              >
                Quero Anunciar 🚀
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
