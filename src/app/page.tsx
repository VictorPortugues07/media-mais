import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Logo } from "@/components/ui/Logo";
import { Reveal } from "@/components/landing/Reveal";
import { RotatingWord } from "@/components/landing/RotatingWord";
import { TvShowcase } from "@/components/landing/TvShowcase";
import { CountUp } from "@/components/landing/CountUp";
import { AudienceTabs } from "@/components/landing/AudienceTabs";
import { TIERS, formatarMoeda } from "@/lib/precificacao";

const LUGARES = [
  { foto: "gym1", nome: "Academias", tempo: "1–2 h de permanência" },
  { foto: "dent1", nome: "Clínicas", tempo: "30–60 min de espera" },
  { foto: "rest1", nome: "Restaurantes", tempo: "30–60 min por refeição" },
  { foto: "barb2", nome: "Barbearias e salões", tempo: "30–60 min na cadeira" },
  { foto: "cowork2", nome: "Coworkings", tempo: "mais de 2 h por dia" },
  { foto: "cafe1", nome: "Cafeterias", tempo: "30–60 min por visita" },
  { foto: "pet1", nome: "Pet shops", tempo: "30–60 min de espera" },
  { foto: "hotel1", nome: "Pousadas", tempo: "café da manhã diário" },
  { foto: "market2", nome: "Supermercados", tempo: "fila do caixa" },
  { foto: "bake1", nome: "Padarias", tempo: "alto fluxo diário" },
];

const NUMEROS = [
  { valor: 8, sufixo: "", rotulo: "marcas no máximo por tela", detalhe: "Sua marca não se perde no meio de dezenas de anúncios." },
  { valor: 6, sufixo: " min", rotulo: "por ciclo do loop", detalhe: "Seu anúncio volta à tela várias vezes a cada hora." },
  { valor: 30, sufixo: " dias", rotulo: "de campanha por cota", detalhe: "Tempo para o público lembrar de você." },
  { valor: 50, sufixo: "%", rotulo: "fica com o estabelecimento", detalhe: "Quem cede a tela participa da receita." },
];

const PLANOS = [
  { tier: TIERS.Bronze, descricao: "Telas de bairro com bom movimento e público fiel." },
  { tier: TIERS.Prata, descricao: "Locais com público qualificado e boa permanência.", destaque: true },
  { tier: TIERS.Ouro, descricao: "Pontos premium: alto fluxo e longos tempos de espera." },
];

function Check() {
  return (
    <svg className="h-4 w-4 shrink-0 text-[#6F9483]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-[#4F93C9]">{children}</p>;
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#344054]">
      <Header />

      {/* ── HERO ───────────────────────────────────────────── */}
      {/* -mt compensa a altura do header fixo para o fundo do hero passar por trás dele */}
      <section className="relative -mt-[68px] overflow-hidden bg-[#F7F8FA]">
        <div aria-hidden="true" className="absolute inset-0 bg-dot-grid [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]" />
        <div aria-hidden="true" className="pointer-events-none absolute -top-48 left-1/2 h-[520px] w-[980px] -translate-x-1/2 rounded-full bg-[#4F93C9]/[0.14] blur-[120px]" />
        <div aria-hidden="true" className="pointer-events-none absolute top-1/3 -right-40 h-[380px] w-[380px] rounded-full bg-[#8FAE9E]/20 blur-[110px]" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-[124px] sm:pt-[148px] pb-20 sm:pb-28">
          <div className="mx-auto max-w-5xl text-center">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 text-xs font-medium text-[#475467] ring-1 ring-[#0E1F66]/[0.08] backdrop-blur">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#8FAE9E] animate-ping opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#6F9483]" />
                </span>
                Mídia indoor para negócios locais
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-7 font-heading text-[42px] leading-[1.04] sm:text-6xl lg:text-[72px] font-semibold tracking-[-0.035em] text-[#0E1F66]">
                Sua marca onde
                <br />
                <span className="sm:whitespace-nowrap">
                  as pessoas{" "}
                  <RotatingWord words={["esperam.", "treinam.", "almoçam.", "se cuidam.", "estão."]} />
                </span>
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-[#5B6578]">
                Anuncie nas TVs de academias, clínicas, restaurantes e barbearias da sua região.
                Ou transforme a TV do seu estabelecimento em uma nova fonte de renda.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/cadastro/anunciante"
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#0E1F66] px-7 py-3.5 text-[15px] font-medium text-white shadow-lg shadow-[#0E1F66]/15 transition hover:bg-[#16297A]"
                >
                  Quero anunciar
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </Link>
                <Link
                  href="/cadastro/ponto"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-medium text-[#0E1F66] ring-1 ring-[#0E1F66]/10 shadow-sm transition hover:ring-[#4F93C9]/40"
                >
                  Tenho uma TV no meu negócio
                </Link>
              </div>
            </Reveal>
          </div>

          <Reveal delay={320} className="mt-16 sm:mt-20">
            <TvShowcase />
          </Reveal>
        </div>
      </section>

      {/* ── ONDE APARECE ──────────────────────────────────── */}
      <section id="onde-aparece" className="scroll-mt-20 py-24 sm:py-28 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="max-w-2xl">
            <Kicker>Onde sua marca aparece</Kicker>
            <h2 className="mt-3 font-heading text-3xl sm:text-[44px] leading-[1.1] font-semibold text-[#0E1F66]">
              Na sala de espera, ninguém pula o anúncio.
            </h2>
            <p className="mt-4 text-[17px] leading-relaxed text-[#5B6578]">
              As telas ficam em lugares onde o público para e presta atenção — e por bastante tempo.
            </p>
          </Reveal>
        </div>

        <Reveal delay={120} className="mt-14">
          <div className="relative [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
            <div className="animate-marquee gap-5 pr-5">
              {[...LUGARES, ...LUGARES].map((l, i) => (
                <figure
                  key={`${l.foto}-${i}`}
                  aria-hidden={i >= LUGARES.length}
                  className="group relative h-72 w-56 sm:h-80 sm:w-64 shrink-0 overflow-hidden rounded-3xl bg-[#0E1F66]"
                >
                  <img
                    src={`/uploads/demo/pontos/${l.foto}.webp`}
                    alt={l.nome}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0A1240]/85 via-[#0A1240]/30 to-transparent p-5 pt-16 text-white">
                    <p className="font-heading text-lg font-semibold">{l.nome}</p>
                    <p className="text-[13px] text-white/75">{l.tempo}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── NÚMEROS ───────────────────────────────────────── */}
      <section className="border-y border-[#EEF0F3] bg-[#F7F8FA] py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
            {NUMEROS.map((n, i) => (
              <Reveal key={n.rotulo} delay={i * 90} className="border-l border-[#DDE1E8] pl-5 sm:pl-6">
                <p className="font-heading text-4xl sm:text-5xl font-semibold tracking-tight text-[#0E1F66]">
                  <CountUp value={n.valor} suffix={n.sufixo} />
                </p>
                <p className="mt-2 text-sm font-medium text-[#344054]">{n.rotulo}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-[#8A93A3]">{n.detalhe}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ─────────────────────────────────── */}
      <section id="como-funciona" className="scroll-mt-20 py-24 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Kicker>Como funciona</Kicker>
            <h2 className="mt-3 font-heading text-3xl sm:text-[44px] leading-[1.1] font-semibold text-[#0E1F66]">
              Simples para quem anuncia. Simples para quem tem a tela.
            </h2>
          </Reveal>
          <Reveal delay={120} className="mt-12">
            <AudienceTabs />
          </Reveal>
        </div>
      </section>

      {/* ── PLANOS ────────────────────────────────────────── */}
      <section id="planos" className="scroll-mt-20 bg-[#F7F8FA] py-24 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Kicker>Planos por tela</Kicker>
            <h2 className="mt-3 font-heading text-3xl sm:text-[44px] leading-[1.1] font-semibold text-[#0E1F66]">
              Preço justo, definido pelo potencial de cada local.
            </h2>
            <p className="mt-4 text-[17px] leading-relaxed text-[#5B6578]">
              Cada tela recebe uma classificação a partir do fluxo, do tempo de permanência e do perfil do público.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {PLANOS.map((p, i) => (
              <Reveal key={p.tier.tier} delay={i * 100}>
                <div
                  className={
                    p.destaque
                      ? "relative h-full rounded-3xl bg-[#0E1F66] p-8 text-white shadow-xl"
                      : "relative h-full rounded-3xl bg-white p-8 ring-1 ring-[#E4E7EC]"
                  }
                >
                  {p.destaque && (
                    <span className="absolute right-6 top-6 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80">
                      Mais procurado
                    </span>
                  )}
                  <p className={p.destaque ? "text-sm font-medium text-[#8EC3EA]" : "text-sm font-medium text-[#4F93C9]"}>
                    {p.tier.tier}
                  </p>
                  <p className="mt-4 flex items-baseline gap-1">
                    <span className={`font-heading text-4xl font-semibold tracking-tight ${p.destaque ? "text-white" : "text-[#0E1F66]"}`}>
                      {formatarMoeda(p.tier.cotaMensal)}
                    </span>
                    <span className={p.destaque ? "text-sm text-white/60" : "text-sm text-[#8A93A3]"}>/mês</span>
                  </p>
                  <p className={`mt-4 text-[15px] leading-relaxed ${p.destaque ? "text-white/75" : "text-[#5B6578]"}`}>
                    {p.descricao}
                  </p>
                  <p className={`mt-6 border-t pt-5 text-[13px] ${p.destaque ? "border-white/10 text-white/60" : "border-[#EEF0F3] text-[#8A93A3]"}`}>
                    Estabelecimento recebe {formatarMoeda(p.tier.repasseAoPonto)} por cota
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={200}>
            <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-[#475467]">
              {["Cota mensal por tela", "Sem taxa de adesão", "Relatório de exibições", "Pagamento via PIX"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0B1A57] py-24 sm:py-32 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_100%,rgba(79,147,201,0.28),transparent_70%)]" />
        {/* Sinal de transmissão */}
        <div aria-hidden="true" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {[0, 0.8, 1.6].map((d) => (
            <span
              key={d}
              className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.08] animate-signal"
              style={{ animationDelay: `${d}s` }}
            />
          ))}
        </div>

        <Reveal className="relative mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="font-heading text-3xl sm:text-5xl leading-[1.08] font-semibold tracking-tight">
            Coloque sua marca na tela certa.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-[17px] leading-relaxed text-white/70">
            Escolha os locais, envie seu anúncio e acompanhe cada exibição — tudo em um só painel.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/cadastro/anunciante"
              className="w-full sm:w-auto rounded-full bg-white px-7 py-3.5 text-[15px] font-medium text-[#0E1F66] shadow-lg transition hover:bg-[#EEF4FB]"
            >
              Começar a anunciar
            </Link>
            <Link
              href="/cadastro/ponto"
              className="w-full sm:w-auto rounded-full px-7 py-3.5 text-[15px] font-medium text-white ring-1 ring-white/25 transition hover:bg-white/10"
            >
              Cadastrar minha TV
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── RODAPÉ ────────────────────────────────────────── */}
      <footer className="bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6 py-14 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Logo className="h-7 w-auto" whiteText={false} />
            <p className="mt-4 text-sm leading-relaxed text-[#8A93A3]">
              Rede de mídia indoor que conecta marcas locais ao público certo, nas telas dos comércios da região.
            </p>
          </div>
          <div className="flex gap-16 text-sm">
            <div>
              <p className="font-medium text-[#0E1F66]">Plataforma</p>
              <ul className="mt-4 space-y-2.5 text-[#5B6578]">
                <li><Link href="/login" className="hover:text-[#0E1F66]">Entrar</Link></li>
                <li><Link href="/cadastro/anunciante" className="hover:text-[#0E1F66]">Anunciar</Link></li>
                <li><Link href="/cadastro/ponto" className="hover:text-[#0E1F66]">Cadastrar TV</Link></li>
                <li><Link href="/player" className="hover:text-[#0E1F66]">Player da TV</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-[#0E1F66]">Contato</p>
              <ul className="mt-4 space-y-2.5 text-[#5B6578]">
                <li>
                  <a href="https://wa.me/5548988796514" target="_blank" rel="noopener noreferrer" className="hover:text-[#0E1F66]">
                    WhatsApp (48) 98879-6514
                  </a>
                </li>
                <li className="text-[#8A93A3]">Segunda a sexta</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-[#EEF0F3]">
          <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-6 py-6 text-xs text-[#8A93A3]">
            <p>© {new Date().getFullYear()} Media+. Todos os direitos reservados.</p>
            <p>Sua marca onde as pessoas estão.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
