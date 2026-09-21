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
        <h2 className="mt-5 text-2xl font-black tracking-tight text-[#0E1F66] font-heading">
          Acesse a plataforma
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-[#344054]">
          Entre com seu e-mail e senha cadastrados
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xs sm:rounded-2xl border border-[#E4E7EC]">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700">
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
                <div className="w-full border-t border-[#E4E7EC]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-[#9AA3AF] font-semibold tracking-wider text-[10px]">
                  Ainda não possui conta?
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link
                href="/cadastro/ponto"
                className="flex items-center justify-center px-3 py-2 border border-[#E4E7EC] rounded-xl text-xs font-semibold text-[#344054] hover:bg-[#F7F8FA] hover:text-[#0E1F66] transition text-center"
              >
                Cadastrar TV
              </Link>
              <Link
                href="/cadastro/anunciante"
                className="flex items-center justify-center px-3 py-2 border border-[#4F93C9]/40 bg-[#4F93C9]/10 rounded-xl text-xs font-semibold text-[#0E1F66] hover:bg-[#4F93C9]/20 transition text-center"
              >
                Quero Anunciar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
