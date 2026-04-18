import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import s from "../styles/pages.module.css";

export default function RegisterPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [telefone, setTelefone] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/agendas");
  }, [loading, user, router]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api("/auth/register", {
        method: "POST",
        json: { nome, email, senha, telefone: telefone || undefined },
      });
      setOk(true);
    } catch (err) {
      setError(err.message || "Não foi possível cadastrar");
    }
  }

  if (loading || user) {
    return (
      <>
        <Head>
          <title>Cadastro</title>
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
        <title>Criar conta</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <div className={s.landing}>
        <h1>Criar conta</h1>
        <p className={s.landingLead}>Preencha os dados para começar.</p>
        {ok ? (
          <div className={s.formStack}>
            <p className={s.muted}>Conta criada. Faça login para continuar.</p>
            <Link href="/login" className={s.btnPrimary}>
              Ir para login
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className={s.formStack}>
            {error ? (
              <p className={s.error} role="alert">
                {error}
              </p>
            ) : null}
            <div>
              <label className={s.label} htmlFor="nome">
                Nome
              </label>
              <input
                id="nome"
                className={s.input}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={s.label} htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                className={s.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={s.label} htmlFor="telefone">
                Telefone (opcional)
              </label>
              <input
                id="telefone"
                className={s.input}
                inputMode="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>
            <div>
              <label className={s.label} htmlFor="senha">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                className={s.input}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button type="submit" className={s.btnPrimary}>
              Cadastrar
            </button>
          </form>
        )}
        <p className={s.muted} style={{ marginTop: "1.5rem" }}>
          <Link href="/login" style={{ color: "var(--color-primary)" }}>
            Já tenho conta
          </Link>
        </p>
      </div>
    </>
  );
}
