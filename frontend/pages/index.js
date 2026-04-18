import Head from "next/head";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../hooks/useAuth";
import s from "../styles/pages.module.css";

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
        <div className={s.landing}>
          <p className={s.muted}>Carregando…</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Agenda online</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="description" content="Agende serviços com facilidade." />
      </Head>
      <div className={s.landing}>
        <h1>Agenda online</h1>
        <p className={s.landingLead}>
          Gerencie horários, clientes e serviços em um só lugar — pensado para uso no celular.
        </p>
        <div className={s.formStack}>
          <Link href="/login" className={s.btnPrimary}>
            Entrar
          </Link>
          <Link href="/register" className={s.btnGhost}>
            Criar conta
          </Link>
        </div>
      </div>
    </>
  );
}
