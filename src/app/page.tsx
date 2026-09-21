"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { Header } from "@/components/layout/Header";
import { Logo } from "@/components/ui/Logo";

export default function HomePage() {
  const [timeString, setTimeString] = useState("14:30");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const appUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";

    QRCode.toDataURL(`${appUrl}/cadastro/anunciante`, {
      width: 140,
      margin: 1,
      color: { dark: "#051160", light: "#ffffff" },
    })
      .then(setQrCodeUrl)
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#344054] selection:bg-[#4F93C9] selection:text-white font-sans">
      <Header />

      {/* ── HERO SECTION COM FUNDO CLARO E LOGO EM DESTAQUE ───────────────── */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 bg-gradient-to-b from-[#F7F8FA] via-white to-[#F7F8FA]">
        {/* Glows suaves em tons da marca */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-[#4F93C9]/10 blur-[130px] rounded-full"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/3 -right-48 w-[400px] h-[400px] bg-[#8FAE9E]/15 blur-[100px] rounded-full"
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          {/* Tag de destaque */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#4F93C9]/30 bg-white px-4 py-1.5 text-xs font-bold text-[#0E1F66] shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8FAE9E] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8FAE9E]" />
              </span>
              <span>Rede de Mídia Indoor Inteligente · Ao Vivo</span>
            </div>
          </div>

          {/* Título Principal */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl lg:text-[72px] font-black tracking-tight text-[#0E1F66] font-heading leading-[1.05]">
              Sua marca onde as pessoas{" "}
              <span className="text-brand-gradient">
                estão.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl mx-auto text-base sm:text-xl text-[#344054] leading-relaxed font-normal">
              Conectamos comércios com televisores a empresas que desejam anunciar.
              Uma rede digital direta, com som ativo e sem intermediários.
            </p>

            {/* CTAs com distinção imediata dos 2 fluxos */}
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
              <Link
                href="/cadastro/anunciante"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-extrabold text-white bg-[#4F93C9] hover:bg-[#3D82B5] shadow-lg shadow-[#4F93C9]/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                <span>Quero Anunciar Meu Negócio</span>
                <span>→</span>
              </Link>

              <Link
                href="/cadastro/ponto"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-extrabold text-[#0E1F66] bg-white hover:bg-[#F7F8FA] border border-[#E4E7EC] hover:border-[#4F93C9]/50 shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4 text-[#4F93C9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Tenho TV no Meu Estabelecimento</span>
                <span className="text-[#4F93C9]">→</span>
              </Link>
            </div>

            <div className="mt-4 flex items-center justify-center gap-6 text-[12px] text-[#9AA3AF] font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8FAE9E]" /> Sem mensalidade fixa
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8FAE9E]" /> Setup direto na Smart TV
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8FAE9E]" /> Transmissão com som ativo
              </span>
            </div>
          </div>

          {/* ── MOLDURA PADRÃO DO PLAYER (TVFRAME OFICIAL MEDIA+) ─────────── */}
          <div className="mt-14 sm:mt-18 relative max-w-4xl mx-auto">
            {/* Sombra suave de projeção da tela */}
            <div
              aria-hidden="true"
              className="absolute -inset-4 sm:-inset-6 bg-[#4F93C9]/15 blur-2xl rounded-3xl -z-10"
            />

            {/* Container da TV com as exatas dimensões e proporção da tela */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-[#081342] bg-[#0E1F66] text-white flex flex-col justify-between aspect-video select-none">
              
              {/* Top Bar Oficial da TV (TVFrame) */}
              <header className="h-12 sm:h-14 px-4 sm:px-8 flex items-center justify-between bg-gradient-to-b from-[#081342] to-transparent z-20">
                <div className="flex items-center gap-3">
                  <Logo className="h-5 sm:h-6 w-auto" whiteText={true} />
                  <span className="h-3.5 w-px bg-white/20" />
                  <span className="text-xs sm:text-sm font-semibold text-blue-200/90 tracking-wide truncate max-w-[180px] sm:max-w-none">
                    Ponto de Mídia Parceiro · Florianópolis/SC
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-semibold text-white/90">
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] text-[#8FAE9E]">
                    <span className="w-2 h-2 rounded-full bg-[#8FAE9E] animate-pulse" />
                    Transmissão Ao Vivo
                  </span>
                  <span className="text-xs sm:text-sm font-bold font-mono tracking-wider text-blue-100">
                    {timeString}
                  </span>
                </div>
              </header>

              {/* Área Central Principal (Sem anúncios de terceiros) */}
              <main className="flex-1 flex items-center justify-center relative overflow-hidden bg-black/40 mx-3 sm:mx-6 rounded-2xl border border-white/10 shadow-inner p-4 text-center">
                <div className="max-w-md mx-auto space-y-2.5">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#4F93C9]/20 border border-[#4F93C9]/40 text-[#4F93C9] flex items-center justify-center mx-auto shadow-md">
                    <svg className="w-6 h-6 text-[#4F93C9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white font-heading tracking-tight">
                    Canal de Transmissão Media+
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-200/80 leading-relaxed">
                    Espaço reservado para veiculação de anúncios locais em loop sequencial contínuo.
                  </p>
                  <div className="pt-1 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white">
                    <span>Áudio Habilitado</span>
                    <span className="text-white/40">•</span>
                    <span>Loop Automático</span>
                  </div>
                </div>
              </main>

              {/* Barra Inferior Comercial Oficial (TVFrame) */}
              <footer className="h-16 sm:h-20 px-4 sm:px-8 flex items-center justify-between bg-gradient-to-t from-[#081342] via-[#0E1F66]/90 to-transparent z-20">
                {/* Chamada Comercial */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#0E1F66] to-[#4F93C9] text-white flex items-center justify-center font-bold text-base shadow-md shrink-0 border border-white/10">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight font-heading">
                      Quer ver a sua empresa nesta tela?
                    </h4>
                    <p className="text-[10px] sm:text-xs text-blue-200/80 mt-0.5 flex items-center gap-2">
                      <span>Anuncie para clientes da região</span>
                      <span className="w-1 h-1 rounded-full bg-[#4F93C9]" />
                      <span className="font-bold text-[#8FAE9E]">
                        WhatsApp: (48) 98879-6514
                      </span>
                    </p>
                  </div>
                </div>

                {/* QR Code com CTA */}
                {qrCodeUrl && (
                  <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-lg">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white">
                        Anuncie Aqui
                      </p>
                      <p className="text-[8px] text-blue-200">Aponte a câmera</p>
                    </div>
                    <img
                      src={qrCodeUrl}
                      alt="QR Code Anuncie Aqui"
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white p-0.5 object-contain"
                    />
                  </div>
                )}
              </footer>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO CLARA: DISTINÇÃO DOS DOIS FLUXOS DE USUÁRIO ──────────────── */}
      <section className="py-20 bg-white border-t border-[#E4E7EC]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#4F93C9]">
              Escolha seu Perfil
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0E1F66] font-heading mt-2">
              Como funciona para cada usuário
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#344054]">
              Caminhos independentes e objetivos para anunciantes e donos de estabelecimentos
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ── FLUXO A: QUEM QUER ANUNCIAR ── */}
            <div className="rounded-3xl p-8 bg-white border-2 border-[#4F93C9] shadow-xl shadow-[#4F93C9]/5 flex flex-col justify-between hover:border-[#3D82B5] transition-all">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-[#4F93C9]/10 text-[#0E1F66] border border-[#4F93C9]/30 uppercase tracking-wider">
                    Perfil 1 · Anunciante
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-[#4F93C9]/10 border border-[#4F93C9]/30 flex items-center justify-center text-[#4F93C9]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  </div>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-[#0E1F66] font-heading">
                  Quero Anunciar Meu Negócio
                </h3>
                <p className="text-xs sm:text-sm text-[#344054] mt-2 leading-relaxed">
                  Para empresas, profissionais e marcas que desejam divulgar seus produtos e serviços diretamente para clientes em espera nos estabelecimentos parceiros.
                </p>

                {/* Passo a Passo do Anunciante */}
                <div className="mt-6 space-y-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#0E1F66]">
                    Como funciona seu fluxo:
                  </p>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC]">
                    <span className="w-6 h-6 rounded-lg bg-[#4F93C9] text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#0E1F66]">Escolha o Ponto no Mapa</p>
                      <p className="text-[11px] text-[#9AA3AF] mt-0.5">
                        Navegue pelas TVs disponíveis por cidade, bairro, categoria e fotos reais do espaço.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC]">
                    <span className="w-6 h-6 rounded-lg bg-[#4F93C9] text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#0E1F66]">Envie sua Peça Promocional</p>
                      <p className="text-[11px] text-[#9AA3AF] mt-0.5">
                        Envie seu vídeo (com som) ou imagem. O tempo de veiculação é ajustado automaticamente.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC]">
                    <span className="w-6 h-6 rounded-lg bg-[#4F93C9] text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#0E1F66]">Entrada no Ar na TV</p>
                      <p className="text-[11px] text-[#9AA3AF] mt-0.5">
                        Após moderação rápida, seu anúncio passa a rodar na Smart TV escolhida em loop contínuo.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#E4E7EC]">
                <Link
                  href="/cadastro/anunciante"
                  className="w-full py-4 rounded-2xl font-extrabold text-sm text-center text-white bg-[#4F93C9] hover:bg-[#3D82B5] shadow-lg shadow-[#4F93C9]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Criar Conta de Anunciante</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* ── FLUXO B: QUEM TEM TV NO ESTABELECIMENTO ── */}
            <div className="rounded-3xl p-8 bg-white border-2 border-[#E4E7EC] shadow-xl shadow-slate-900/5 flex flex-col justify-between hover:border-[#0E1F66]/40 transition-all">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-[#8FAE9E]/15 text-[#1E4333] border border-[#8FAE9E]/40 uppercase tracking-wider">
                    Perfil 2 · Dono de TV
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-[#8FAE9E]/15 border border-[#8FAE9E]/40 flex items-center justify-center text-[#1E4333]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-[#0E1F66] font-heading">
                  Tenho TV no Meu Estabelecimento
                </h3>
                <p className="text-xs sm:text-sm text-[#344054] mt-2 leading-relaxed">
                  Para cafés, restaurantes, clínicas, academias e comércios que possuem televisor e desejam integrá-lo à rede de mídia indoor sem precisar de nenhum aparelho.
                </p>

                {/* Passo a Passo do Dono de TV */}
                <div className="mt-6 space-y-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#0E1F66]">
                    Como funciona seu fluxo:
                  </p>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC]">
                    <span className="w-6 h-6 rounded-lg bg-[#0E1F66] text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#0E1F66]">Cadastre seu Estabelecimento</p>
                      <p className="text-[11px] text-[#9AA3AF] mt-0.5">
                        Informe endereço, horários de funcionamento e adicione fotos do espaço e da TV instalada.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC]">
                    <span className="w-6 h-6 rounded-lg bg-[#0E1F66] text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#0E1F66]">Abra o Player na Smart TV</p>
                      <p className="text-[11px] text-[#9AA3AF] mt-0.5">
                        No navegador de internet da TV, acesse o link do player. Não precisa baixar aplicativo.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC]">
                    <span className="w-6 h-6 rounded-lg bg-[#0E1F66] text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#0E1F66]">Digite o Código de 6 Números</p>
                      <p className="text-[11px] text-[#9AA3AF] mt-0.5">
                        Basta digitar na TV o código temporário gerado no seu celular e a tela conecta na hora.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#E4E7EC] flex flex-col sm:flex-row gap-3">
                <Link
                  href="/cadastro/ponto"
                  className="flex-1 py-4 rounded-2xl font-extrabold text-sm text-center text-[#0E1F66] bg-[#F7F8FA] hover:bg-slate-200 border border-[#E4E7EC] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Cadastrar Minha TV</span>
                  <span>→</span>
                </Link>

                <Link
                  href="/player"
                  className="py-4 px-5 rounded-2xl font-bold text-sm text-center text-[#0E1F66] hover:text-[#4F93C9] bg-[#4F93C9]/10 hover:bg-[#4F93C9]/20 border border-[#4F93C9]/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4 text-[#4F93C9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Player TV</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ATRIBUTOS REAIS DO SISTEMA ─────────────── */}
      <section className="py-14 bg-[#F7F8FA] border-y border-[#E4E7EC]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black font-heading text-[#4F93C9]">Com Som</p>
              <p className="text-xs font-bold text-[#0E1F66]">Áudio Habilitado</p>
              <p className="text-[11px] text-[#9AA3AF]">Transmissão sonora contínua nos vídeos</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black font-heading text-[#0E1F66]">Sem Aparelhos</p>
              <p className="text-xs font-bold text-[#0E1F66]">100% no Navegador</p>
              <p className="text-[11px] text-[#9AA3AF]">Roda direto na sua Smart TV</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black font-heading text-[#8FAE9E]">Proof of Play</p>
              <p className="text-xs font-bold text-[#0E1F66]">Auditoria Real</p>
              <p className="text-[11px] text-[#9AA3AF]">Contagem exata de exibições</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black font-heading text-[#0E1F66]">30 Segundos</p>
              <p className="text-xs font-bold text-[#0E1F66]">Pareamento Instantâneo</p>
              <p className="text-[11px] text-[#9AA3AF]">Código rotativo sem complicação</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── BANNER FINAL DE CONVERSÃO ────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-[#0E1F66] to-[#081342] text-white relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#4F93C9]/20 rounded-full blur-3xl pointer-events-none"
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black font-heading tracking-tight">
            Comece a usar a Media+ hoje mesmo
          </h2>
          <p className="text-sm sm:text-base text-blue-100/90 max-w-xl mx-auto leading-relaxed">
            Seja para divulgar seu negócio nas telas mais movimentadas da sua região ou para integrar a TV do seu comércio à rede.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/cadastro/anunciante"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-extrabold text-[#0E1F66] bg-white hover:bg-[#F7F8FA] shadow-xl transition-all cursor-pointer"
            >
              Criar Conta de Anunciante
            </Link>

            <Link
              href="/cadastro/ponto"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-extrabold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all cursor-pointer"
            >
              Cadastrar Minha TV
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER CLARO COM LOGO DESTACADA ───────────────────────────────── */}
      <footer className="border-t border-[#E4E7EC] bg-white pt-14 pb-8 mt-auto text-[#344054]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xs space-y-3">
              <Link href="/" className="inline-block transition-opacity hover:opacity-80">
                <Logo className="h-7 w-auto" whiteText={false} />
              </Link>
              <p className="text-xs text-[#9AA3AF] leading-relaxed">
                A plataforma de mídia indoor inteligente que conecta marcas locais ao público certo nos comércios da região.
              </p>
            </div>

            <div className="flex flex-wrap gap-12 text-sm">
              <div className="space-y-3">
                <p className="font-bold text-[#0E1F66] text-xs tracking-wider uppercase">Plataforma</p>
                <ul className="space-y-2 text-xs text-[#344054]">
                  <li><Link href="/login" className="hover:text-[#4F93C9] transition-colors">Acessar Painel</Link></li>
                  <li><Link href="/cadastro/anunciante" className="hover:text-[#4F93C9] transition-colors">Criar Conta Anunciante</Link></li>
                  <li><Link href="/cadastro/ponto" className="hover:text-[#4F93C9] transition-colors">Cadastrar Smart TV</Link></li>
                  <li><Link href="/player" className="hover:text-[#4F93C9] transition-colors">Player da Smart TV</Link></li>
                </ul>
              </div>

              <div className="space-y-3">
                <p className="font-bold text-[#0E1F66] text-xs tracking-wider uppercase">Suporte & Contato</p>
                <ul className="space-y-2 text-xs text-[#344054]">
                  <li>
                    <a
                      href="https://wa.me/5548988796514"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#8FAE9E] transition-colors font-medium flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5 text-[#8FAE9E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>(48) 98879-6514</span>
                    </a>
                  </li>
                  <li className="text-[11px] text-[#9AA3AF]">Atendimento de Segunda a Sexta</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-[#E4E7EC] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#9AA3AF]">
            <p>&copy; {new Date().getFullYear()} Media+. Todos os direitos reservados.</p>
            <p className="flex items-center gap-1.5 font-semibold text-[#344054]">
              <span className="h-2 w-2 rounded-full bg-[#8FAE9E] animate-pulse inline-block" />
              Rede de Transmissão Ativa
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
