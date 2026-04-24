import Head from "next/head";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/router";
import {
  CalendarDays,
  LayoutDashboard,
  Link2,
  Settings2,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import ThemeToggle from "../components/menu/ThemeToggle";
import s from "../styles/pages.module.css";

const features = [
  {
    icon: CalendarDays,
    title: "Agenda pública por link",
    text: "Cada agenda ganha um slug seguro. Seus clientes escolhem serviço, data e horário em um fluxo rápido, sem criar conta.",
  },
  {
    icon: LayoutDashboard,
    title: "Painel em quadro",
    text: "Visualize pendente, confirmado, concluído e mais. No computador, arraste cartões para mudar o status; no celular, use atalhos.",
  },
  {
    icon: Users,
    title: "Clientes e serviços",
    text: "Cadastre serviços com duração e preço, mantenha clientes por agenda e atualize dados quando precisar.",
  },
  {
    icon: Settings2,
    title: "Horários e exceções",
    text: "Defina janelas semanais e feche dias ou abra horários especiais — o cálculo de vagas respeita tudo isso na página pública.",
  },
  {
    icon: Sparkles,
    title: "Campos extras no agendamento",
    text: "Crie perguntas customizadas (texto, e-mail, telefone, seleção e outros) e receba as respostas junto do pedido.",
  },
  {
    icon: UserPlus,
    title: "Equipe na mesma agenda",
    text: "Convide colaboradores por e-mail ou compartilhe o painel como proprietário. Controle quem administra o que.",
  },
];

const steps = [
  {
    n: "1",
    title: "Crie sua conta",
    text: "Cadastre-se, crie uma agenda e configure nome, disponibilidade e serviços.",
  },
  {
    n: "2",
    title: "Compartilhe o link",
    text: "Envie a URL pública (slug) para clientes agendarem no celular ou no desktop.",
  },
  {
    n: "3",
    title: "Gerencie no painel",
    text: "Acompanhe agendamentos, ajuste status e mantenha a operação organizada.",
  },
];

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/agendas");
    }
  }, [loading, user, router]);

  if (loading || user) {
    return (
      <>
        <Head>
          <title>Agenda online</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        </Head>
        <div className={s.lpLoading}>
          <p className={s.muted}>Carregando…</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Agenda online — agendamentos simples para você e seus clientes</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta
          name="description"
          content="Gerencie agendas, clientes e serviços. Link público para agendar, horários semanais, exceções, campos customizados e painel em quadro — pensado para mobile."
        />
      </Head>

      <div className={s.lpRoot}>
        <header>
          <div className={s.lpNavInner}>
            <Link href="/" className={s.lpBrand}>
              Agenda online
            </Link>
            <div className={s.lpNavActions}>
              <ThemeToggle />
              <Link href="/login" className={s.lpNavText}>
                Entrar
              </Link>
              <Link href="/register" className={`${s.btnPrimary} ${s.lpNavCta}`}>
                Criar conta
              </Link>
            </div>
          </div>
        </header>

        <main className={s.lpMain}>
          <section className={`${s.lpContainer} ${s.lpHero}`} aria-labelledby="lp-hero-title">
            <div className={s.lpHeroGrid}>
              <div>
                <p className={s.lpEyebrow}>Agendamentos sem fricção</p>
                <h1 id="lp-hero-title" className={s.lpHeroTitle}>
                  Seu negócio com horários claros — do link público ao painel do dia a dia.
                </h1>
                <p className={s.lpHeroLead}>
                  Centralize serviços, clientes e confirmações. Ofereça uma página de agendamento responsiva e, por trás,
                  um painel alinhado ao que o sistema já faz: disponibilidade, exceções, campos de coleta e status em
                  colunas.
                </p>
                <div className={s.lpHeroCtas}>
                  <Link href="/register" className={s.btnPrimary}>
                    Começar grátis
                  </Link>
                  <Link href="/login" className={s.btnGhost}>
                    Já tenho conta
                  </Link>
                </div>
                <ul className={s.lpHeroBullets} aria-label="Destaques">
                  <li>
                    <Link2 size={16} aria-hidden />
                    Link único por agenda
                  </li>
                  <li>
                    <CalendarDays size={16} aria-hidden />
                    Slots calculados com regras reais
                  </li>
                  <li>
                    <LayoutDashboard size={16} aria-hidden />
                    Quadro para acompanhar status
                  </li>
                </ul>
              </div>

              <div className={s.lpMockWrap} aria-hidden>
                <div className={s.lpMock}>
                  <div className={s.lpMockHeader}>
                    <span className={s.lpMockDot} />
                    <span className={s.lpMockDot} />
                    <span className={s.lpMockDot} />
                    <span className={s.lpMockTitle}>agenda…/serviço · 30 min</span>
                  </div>
                  <div className={s.lpMockSlots}>
                    {["09:00", "09:15", "09:30", "—", "10:00", "10:15", "10:30", "10:45", "11:00", "11:15", "11:30", "12:00"].map(
                      (t, i) => (
                        <span
                          key={`${t}-${i}`}
                          className={
                            t === "—"
                              ? s.lpMockSlotBusy
                              : i === 2 || i === 7
                                ? s.lpMockSlotOk
                                : i % 5 === 4
                                  ? s.lpMockSlotPast
                                  : s.lpMockSlotOk
                          }
                        >
                          {t}
                        </span>
                      )
                    )}
                  </div>
                  <div className={s.lpMockBoard}>
                    <div className={s.lpMockCol}>
                      <span className={s.lpMockColTitle}>Confirmado</span>
                      <div className={s.lpMockCard}>Maria · Corte</div>
                      <div className={s.lpMockCardMuted}>João · Barba</div>
                    </div>
                    <div className={s.lpMockCol}>
                      <span className={s.lpMockColTitle}>Pendente</span>
                      <div className={s.lpMockCardMuted}>Novo pedido</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={s.lpSection} aria-labelledby="lp-features-title">
            <div className={s.lpContainer}>
              <h2 id="lp-features-title" className={s.lpSectionTitle}>
                O que você ganha com a plataforma
              </h2>
              <p className={s.lpSectionLead}>
                Funcionalidades pensadas para quem precisa agendar serviços com previsibilidade — para você e para quem
                está do outro lado do link.
              </p>
              <div className={s.lpFeatureGrid}>
                {features.map(({ icon: Icon, title, text }) => (
                  <article key={title} className={s.lpFeature}>
                    <div className={s.lpFeatureIcon} aria-hidden>
                      <Icon size={22} strokeWidth={1.75} />
                    </div>
                    <h3 className={s.lpFeatureTitle}>{title}</h3>
                    <p className={s.lpFeatureText}>{text}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className={`${s.lpSection} ${s.lpSectionAlt}`} aria-labelledby="lp-steps-title">
            <div className={s.lpContainer}>
              <h2 id="lp-steps-title" className={s.lpSectionTitle}>
                Como funciona
              </h2>
              <p className={s.lpSectionLead}>Três passos para colocar sua agenda no ar e receber pedidos organizados.</p>
              <ol className={s.lpSteps}>
                {steps.map((st) => (
                  <li key={st.n} className={s.lpStep}>
                    <span className={s.lpStepNum}>{st.n}</span>
                    <h3 className={s.lpStepTitle}>{st.title}</h3>
                    <p className={s.lpStepText}>{st.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className={s.lpContainer} aria-labelledby="lp-cta-title">
            <div className={s.lpCtaBand}>
              <h2 id="lp-cta-title" className={s.lpCtaTitle}>
                Pronto para organizar seus horários?
              </h2>
              <p className={s.lpCtaLead}>
                Crie sua conta, monte a agenda e compartilhe o link. Tudo responsivo — do cadastro ao agendamento
                público.
              </p>
              <div className={s.lpCtaRow}>
                <Link href="/register" className={s.btnPrimary}>
                  Criar conta
                </Link>
                <Link href="/login" className={s.btnGhost}>
                  Entrar
                </Link>
              </div>
            </div>
          </section>
        </main>

        <footer className={s.lpFooter}>
          <div className={s.lpContainer}>
            <p className={s.lpFooterText}>Agenda online — agendamentos com link público e painel para sua equipe.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
