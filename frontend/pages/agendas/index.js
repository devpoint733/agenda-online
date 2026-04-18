import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../lib/api";
import s from "../../styles/pages.module.css";

export default function AgendasPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [list, setList] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setBusy(true);
    setError("");
    try {
      const rows = await api("/agendas");
      setList(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err.message || "Erro ao carregar agendas");
      setList([]);
    } finally {
      setBusy(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !user) {
    return (
      <>
        <Head>
          <title>Minhas agendas</title>
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
        <title>Minhas agendas</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <div style={{ minHeight: "100vh", padding: "var(--spacing-md)", paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}>
        <div className={s.rowBetween} style={{ marginBottom: "var(--spacing-lg)", alignItems: "center" }}>
          <div>
            <h1 className={s.pageTitle} style={{ marginBottom: 4 }}>
              Olá, {user.nome?.split?.(" ")?.[0] || "usuário"}
            </h1>
            <p className={s.muted} style={{ margin: 0 }}>
              Escolha uma agenda
            </p>
          </div>
          <button type="button" className={s.btnGhost} onClick={logout}>
            Sair
          </button>
        </div>

        {error ? (
          <p className={s.error} role="alert">
            {error}
          </p>
        ) : null}

        {busy ? <p className={s.muted}>Carregando agendas…</p> : null}

        {!busy && list.length === 0 ? (
          <div className={s.card}>
            <p className={s.muted} style={{ margin: 0 }}>
              Nenhuma agenda ainda. Crie uma pela API ou peça acesso a um proprietário.
            </p>
          </div>
        ) : null}

        <div className={s.cardList}>
          {list.map((a) => (
            <Link
              key={a.id}
              href={`/agendas/${a.id}`}
              className={s.card}
              style={{ textDecoration: "none", color: "inherit", display: "block" }}
            >
              <div className={s.rowBetween}>
                <div>
                  <strong style={{ fontSize: "1.0625rem" }}>{a.nome}</strong>
                  <p className={s.muted} style={{ margin: "6px 0 0" }}>
                    /{a.slug_agenda} · {a.papel === "proprietario" ? "Proprietário" : "Colaborador"}
                  </p>
                </div>
                <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>→</span>
              </div>
            </Link>
          ))}
        </div>

        <p className={s.muted} style={{ marginTop: "var(--spacing-lg)" }}>
          <Link href="/" style={{ color: "var(--color-primary)" }}>
            Página inicial
          </Link>
        </p>
      </div>
    </>
  );
}
