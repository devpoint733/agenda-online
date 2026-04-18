import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import s from "../styles/pages.module.css";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace("/agendas");
  }, [loading, user, router]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await api("/auth/login", {
        method: "POST",
        json: { email, senha },
      });
      login(data.token, data.user);
      router.replace("/agendas");
    } catch (err) {
      setError(err.message || "Falha no login");
    }
  }

  if (loading || user) {
    return (
      <>
        <Head>
          <title>Entrar</title>
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
        <title>Entrar</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <div className={s.landing}>
        <h1>Entrar</h1>
        <p className={s.landingLead}>Use seu e-mail e senha.</p>
        <form onSubmit={onSubmit} className={s.formStack}>
          {error ? (
            <p className={s.error} role="alert">
              {error}
            </p>
          ) : null}
          <div>
            <label className={s.label} htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className={s.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={s.label} htmlFor="senha">
              Senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              className={s.input}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={s.btnPrimary}>
            Entrar
          </button>
        </form>
        <p className={s.muted} style={{ marginTop: "1.5rem" }}>
          <Link href="/register" style={{ color: "var(--color-primary)" }}>
            Criar conta
          </Link>
          {" · "}
          <Link href="/" style={{ color: "var(--color-primary)" }}>
            Início
          </Link>
        </p>
      </div>
    </>
  );
}
