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
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-blue-600 selection:text-white font-sans">
      <Header />

      {/* ── HERO SECTION COM FUNDO CLARO E LOGO EM DESTAQUE ───────────────── */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 bg-gradient-to-b from-slate-50 via-white to-slate-50">
        {/* Glows suaves em tons da marca */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-blue-500/10 blur-[130px] rounded-full"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/3 -right-48 w-[400px] h-[400px] bg-sky-400/10 blur-[100px] rounded-full"
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          {/* Tag de destaque */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-blue-200 bg-white px-4 py-1.5 text-xs font-bold text-blue-700 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Rede de Mídia Indoor Inteligente · Ao Vivo</span>
            </div>
          </div>

          {/* Título Principal */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl lg:text-[72px] font-black tracking-tight text-slate-900 font-heading leading-[1.05]">
              Sua marca onde as pessoas{" "}
              <span className="text-brand-gradient">
                realmente estão.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl mx-auto text-base sm:text-xl text-slate-600 leading-relaxed font-normal">
              Conectamos comércios com televisores a empresas que desejam anunciar.
              Uma rede digital direta, com som ativo e sem intermediários.
            </p>

            {/* CTAs com distinção imediata dos 2 fluxos */}
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
              <Link
                href="/cadastro/anunciante"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-extrabold text-white bg-brand-gradient hover:bg-brand-gradient-hover shadow-lg shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>📢 Quero Anunciar Meu Negócio</span>
                <span>→</span>
              </Link>

              <Link
                href="/cadastro/ponto"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-extrabold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>📺 Tenho TV no Meu Estabelecimento</span>
                <span className="text-blue-600">→</span>
              </Link>
            </div>

            <div className="mt-4 flex items-center justify-center gap-6 text-[12px] text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span> Sem mensalidade fixa
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span> Setup direto na Smart TV
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span> Transmissão com som ativo
              </span>
            </div>
          </div>

          {/* ── MOLDURA PADRÃO DO PLAYER (TVFRAME OFICIAL MEDIA+) ─────────── */}
          <div className="mt-14 sm:mt-18 relative max-w-4xl mx-auto">
            {/* Sombra suave de projeção da tela */}
            <div
              aria-hidden="true"
              className="absolute -inset-4 sm:-inset-6 bg-blue-600/10 blur-2xl rounded-3xl -z-10"
            />

            {/* Container da TV com as exatas dimensões e proporção da tela */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-[#051160] text-white flex flex-col justify-between aspect-video select-none">
              
              {/* Top Bar Oficial da TV (TVFrame) */}
              <header className="h-12 sm:h-14 px-4 sm:px-8 flex items-center justify-between bg-gradient-to-b from-[#030b3d] to-transparent z-20">
                <div className="flex items-center gap-3">
                  <Logo className="h-5 sm:h-6 w-auto" whiteText={true} />
                  <span className="h-3.5 w-px bg-white/20" />
                  <span className="text-xs sm:text-sm font-semibold text-blue-200/90 tracking-wide truncate max-w-[180px] sm:max-w-none">
                    Ponto de Mídia Parceiro · Florianópolis/SC
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-semibold text-white/90">
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] text-blue-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Transmissão Ao Vivo
                  </span>
                  <span className="text-xs sm:text-sm font-bold font-mono tracking-wider text-blue-100">
                    {timeString}
                  </span>
                </div>
              </header>

              {/* Área Central Principal (Sem anúncios de terceiros) */}
              <main className="flex-1 flex items-center justify-center relative overflow-hidden bg-black/50 mx-3 sm:mx-6 rounded-2xl border border-white/10 shadow-inner p-4 text-center">
                <div className="max-w-md mx-auto space-y-2.5">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center text-2xl mx-auto shadow-md">
                    📺
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white font-heading tracking-tight">
                    Canal de Transmissão Media+
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-200/80 leading-relaxed">
                    Espaço reservado para veiculação de anúncios locais em loop sequencial contínuo.
                  </p>
                  <div className="pt-1 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white">
                    <span>🎵 Áudio Habilitado</span>
                    <span className="text-white/40">•</span>
                    <span>Loop Automático</span>
                  </div>
                </div>
              </main>

              {/* Barra Inferior Comercial Oficial (TVFrame) */}
              <footer className="h-16 sm:h-20 px-4 sm:px-8 flex items-center justify-between bg-gradient-to-t from-[#030b3d] via-[#051160]/90 to-transparent z-20">
                {/* Chamada Comercial */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center font-bold text-base shadow-md shrink-0">
                    📢
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight font-heading">
                      Quer ver a sua empresa nesta tela?
                    </h4>
                    <p className="text-[10px] sm:text-xs text-blue-200/80 mt-0.5 flex items-center gap-2">
                      <span>Anuncie para clientes da região</span>
                      <span className="w-1 h-1 rounded-full bg-blue-400" />
                      <span className="font-bold text-emerald-400">
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
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-extrabold tracking-widest text-blue-600">
              Escolha seu Perfil
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 font-heading mt-2">
              Como funciona para cada usuário
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              Caminhos independentes e objetivos para anunciantes e donos de estabelecimentos
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ── FLUXO A: QUEM QUER ANUNCIAR (Fundo Branco com Destaque Azul) ── */}
            <div className="rounded-3xl p-8 bg-white border-2 border-blue-600 shadow-xl shadow-blue-500/5 flex flex-col justify-between hover:border-blue-700 transition-all">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                    Perfil 1 · Anunciante
                  </span>
                  <span className="text-3xl">📢</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
                  Quero Anunciar Meu Negócio
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Para empresas, profissionais e marcas que desejam divulgar seus produtos e serviços diretamente para clientes em espera nos estabelecimentos parceiros.
                </p>

                {/* Passo a Passo do Anunciante */}
                <div className="mt-6 space-y-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                    Como funciona seu fluxo:
                  </p>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Escolha o Ponto no Mapa</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Navegue pelas TVs disponíveis por cidade, bairro, categoria e fotos reais do espaço.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Envie sua Peça Promocional</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Envie seu vídeo (com som) ou imagem. O tempo de veiculação é ajustado automaticamente.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Entrada no Ar na TV</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Após moderação rápida, seu anúncio passa a rodar na Smart TV escolhida em loop contínuo.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <Link
                  href="/cadastro/anunciante"
                  className="w-full py-4 rounded-2xl font-extrabold text-sm text-center text-white bg-brand-gradient hover:bg-brand-gradient-hover shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Criar Conta de Anunciante</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* ── FLUXO B: QUEM TEM TV NO ESTABELECIMENTO (Fundo Branco com Destaque Celeste) ── */}
            <div className="rounded-3xl p-8 bg-white border-2 border-slate-300 shadow-xl shadow-slate-900/5 flex flex-col justify-between hover:border-slate-400 transition-all">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                    Perfil 2 · Dono de TV
                  </span>
                  <span className="text-3xl">📺</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
                  Tenho TV no Meu Estabelecimento
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Para cafés, restaurantes, clínicas, academias e comércios que possuem televisor e desejam integrá-lo à rede de mídia indoor sem precisar de nenhum aparelho.
                </p>

                {/* Passo a Passo do Dono de TV */}
                <div className="mt-6 space-y-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Como funciona seu fluxo:
                  </p>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Cadastre seu Estabelecimento</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Informe endereço, horários de funcionamento e adicione fotos do espaço e da TV instalada.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Abra o Player na Smart TV</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        No navegador de internet da TV, acesse o link do player. Não precisa baixar aplicativo.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Digite o Código de 6 Números</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Basta digitar na TV o código temporário gerado no seu celular e a tela conecta na hora.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/cadastro/ponto"
                  className="flex-1 py-4 rounded-2xl font-extrabold text-sm text-center text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Cadastrar Minha TV</span>
                  <span>→</span>
                </Link>

                <Link
                  href="/player"
                  className="py-4 px-5 rounded-2xl font-bold text-sm text-center text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Player TV 📺</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ATRIBUTOS REAIS DO SISTEMA (SEM DADOS INVENTADOS) ─────────────── */}
      <section className="py-14 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black font-heading text-blue-600">Com Som</p>
              <p className="text-xs font-bold text-slate-800">Áudio Habilitado</p>
              <p className="text-[11px] text-slate-500">Transmissão sonora contínua nos vídeos</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black font-heading text-slate-900">Sem Aparelhos</p>
              <p className="text-xs font-bold text-slate-800">100% no Navegador</p>
              <p className="text-[11px] text-slate-500">Roda direto na sua Smart TV</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black font-heading text-emerald-600">Proof of Play</p>
              <p className="text-xs font-bold text-slate-800">Auditoria Real</p>
              <p className="text-[11px] text-slate-500">Contagem exata de exibições</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black font-heading text-indigo-600">30 Segundos</p>
              <p className="text-xs font-bold text-slate-800">Pareamento Instantâneo</p>
              <p className="text-[11px] text-slate-500">Código rotativo sem complicação</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── BANNER FINAL DE CONVERSÃO ────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-[#051160] text-white relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"
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
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-extrabold text-[#051160] bg-white hover:bg-slate-100 shadow-xl transition-all cursor-pointer"
            >
              Criar Conta de Anunciante
            </Link>

            <Link
              href="/cadastro/ponto"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-extrabold text-white bg-blue-900/60 hover:bg-blue-900/80 border border-white/20 transition-all cursor-pointer"
            >
              Cadastrar Minha TV
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER CLARO COM LOGO DESTACADA ───────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white pt-14 pb-8 mt-auto text-slate-600">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xs space-y-3">
              <Link href="/" className="inline-block transition-opacity hover:opacity-80">
                <Logo className="h-7 w-auto" whiteText={false} />
              </Link>
              <p className="text-xs text-slate-500 leading-relaxed">
                A plataforma de mídia indoor inteligente que conecta marcas locais ao público certo nos comércios da região.
              </p>
            </div>

            <div className="flex flex-wrap gap-12 text-sm">
              <div className="space-y-3">
                <p className="font-bold text-slate-900 text-xs tracking-wider uppercase">Plataforma</p>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li><Link href="/login" className="hover:text-blue-600 transition-colors">Acessar Painel</Link></li>
                  <li><Link href="/cadastro/anunciante" className="hover:text-blue-600 transition-colors">Criar Conta Anunciante</Link></li>
                  <li><Link href="/cadastro/ponto" className="hover:text-blue-600 transition-colors">Cadastrar Smart TV</Link></li>
                  <li><Link href="/player" className="hover:text-blue-600 transition-colors">Player da Smart TV</Link></li>
                </ul>
              </div>

              <div className="space-y-3">
                <p className="font-bold text-slate-900 text-xs tracking-wider uppercase">Suporte & Contato</p>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li>
                    <a
                      href="https://wa.me/5548988796514"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-emerald-600 transition-colors font-medium flex items-center gap-1.5"
                    >
                      <span>💬 (48) 98879-6514</span>
                    </a>
                  </li>
                  <li className="text-[11px] text-slate-400">Atendimento de Segunda a Sexta</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} Media+. Todos os direitos reservados.</p>
            <p className="flex items-center gap-1.5 font-semibold text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Rede de Transmissão Ativa
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
