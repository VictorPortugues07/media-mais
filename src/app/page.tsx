import React from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Logo } from "@/components/ui/Logo";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-ink text-slate-900 selection:bg-blue-500 selection:text-white">
      <Header />

      {/* Hero Section com Gradientes e Animações Sutis */}
      <section className="relative overflow-hidden pt-8 pb-20 sm:pt-14 sm:pb-28">
        {/* Glows de fundo da marca */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-500/10 blur-[100px] rounded-full"
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Tag de destaque com pílula */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 px-3.5 py-1 text-xs font-semibold text-blue-700 shadow-xs backdrop-blur-md mb-8 animate-fade-in">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            <span>Rede Inteligente de Mídia Indoor</span>
          </div>

          {/* Título Principal com Tipografia Display Sora e Gradiente da Marca */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 font-heading leading-[1.08]">
            Sua marca onde as pessoas{" "}
            <span className="text-brand-gradient">realmente estão.</span>
          </h1>

          <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed">
            Conectamos estabelecimentos com TVs a anunciantes locais. Transforme a espera dos clientes em atenção e oportunidades reais para o seu negócio.
          </p>

          {/* Botões de Ação Principais */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            <Link
              href="/cadastro/anunciante"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-bold text-white bg-brand-gradient hover:bg-brand-gradient-hover shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2"
            >
              <span>Quero Anunciar</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>

            <Link
              href="/cadastro/ponto"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition flex items-center justify-center gap-2"
            >
              <span>Cadastrar Minha TV</span>
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Como Funciona — 3 Passos */}
      <section className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-600">
              Fluxo 100% Integrado
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 font-heading mt-2">
              Como a Media+ Funciona
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              Uma experiência direta da criação da campanha até a tela do televisor
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-2xl bg-ink border border-slate-200/80 shadow-xs flex flex-col items-start hover:border-blue-300 transition duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100/80 mb-6 font-heading font-black text-lg">
                01
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-heading mb-2">
                Escolha o Ponto no Mapa
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Navegue pelas TVs cadastradas, analise a estimativa de fluxo diário de pessoas, tempo de permanência e perfil do público antes de selecionar.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-ink border border-slate-200/80 shadow-xs flex flex-col items-start hover:border-blue-300 transition duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100/80 mb-6 font-heading font-black text-lg">
                02
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-heading mb-2">
                Envio e Moderação Rápida
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Faça o upload do vídeo ou imagem promocional. A moderação avalia a peça para manter alto padrão visual em todos os estabelecimentos.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-ink border border-slate-200/80 shadow-xs flex flex-col items-start hover:border-blue-300 transition duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100/80 mb-6 font-heading font-black text-lg">
                03
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-heading mb-2">
                Exibição Automática na TV
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Após aprovação, tanto o dono da TV quanto o anunciante são notificados em tempo real e a mídia entra no loop de transmissão em 1080p.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Idêntico ao Site Original */}
      <footer className="relative overflow-hidden border-t border-slate-200/80 bg-white pt-14 pb-8 sm:pt-16 sm:pb-10 mt-auto">
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="max-w-sm space-y-3">
              <Link href="/" className="inline-block transition-opacity hover:opacity-80">
                <Logo className="h-6 sm:h-7 w-auto" />
              </Link>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                A plataforma de mídia indoor inteligente que conecta marcas locais ao público certo no momento certo.
              </p>
            </div>

            <div className="flex flex-wrap gap-10 sm:gap-14 text-xs sm:text-sm">
              <div className="space-y-3">
                <p className="font-semibold text-slate-900 text-xs tracking-wider uppercase">
                  Acesso
                </p>
                <ul className="space-y-2 text-slate-600">
                  <li>
                    <Link href="/login" className="transition-colors hover:text-blue-600">
                      Entrar no Sistema
                    </Link>
                  </li>
                  <li>
                    <Link href="/cadastro/ponto" className="transition-colors hover:text-blue-600">
                      Cadastrar TV
                    </Link>
                  </li>
                  <li>
                    <Link href="/cadastro/anunciante" className="transition-colors hover:text-blue-600">
                      Criar Conta de Anunciante
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <p className="font-semibold text-slate-900 text-xs tracking-wider uppercase">
                  Suporte
                </p>
                <ul className="space-y-2 text-slate-600">
                  <li>
                    <a
                      href="https://wa.me/554888796514"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 transition-colors hover:text-emerald-600 font-medium"
                    >
                      <span>(48) 8879-6514</span>
                    </a>
                  </li>
                  <li className="text-slate-400 text-xs">
                    Suporte e Atendimento Media+
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} Media +. Todos os direitos reservados.</p>
            <p className="flex items-center gap-1.5 font-medium text-slate-500">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Rede de Mídia Ativa
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
