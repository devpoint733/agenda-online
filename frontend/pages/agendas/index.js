import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../lib/api";
import s from "../../styles/pages.module.css";

export default function AgendasPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [list, setList] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copiedAgendaId, setCopiedAgendaId] = useState(null);
  const profileMenuRef = useRef(null);

  const firstName = user?.nome?.split?.(" ")?.[0] || "usuário";
  const initials =
    user?.nome
      ?.split?.(" ")
      ?.filter(Boolean)
      ?.slice(0, 2)
      ?.map((part) => part[0]?.toUpperCase())
      ?.join("") || "U";

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

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const onEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  const copyPublicRoute = useCallback(async (slugAgenda, agendaId) => {
    const publicUrl = `${window.location.origin}/${slugAgenda}`;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedAgendaId(agendaId);
      setTimeout(() => setCopiedAgendaId((current) => (current === agendaId ? null : current)), 1800);
    } catch {
      const input = document.createElement("textarea");
      input.value = publicUrl;
      input.setAttribute("readonly", "");
      input.style.position = "absolute";
      input.style.left = "-9999px";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopiedAgendaId(agendaId);
      setTimeout(() => setCopiedAgendaId((current) => (current === agendaId ? null : current)), 1800);
    }
  }, []);

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
      <div className={s.pageShell}>
        <div className={s.heroHeader}>
          <div>
            <h1 className={s.pageTitle}>
              Olá, <span className={s.userName}>{firstName}</span>
            </h1>
            <p className={s.muted} style={{ margin: 0 }}>
              Escolha uma agenda para continuar
            </p>
          </div>

          <div className={s.profileMenu} ref={profileMenuRef}>
            <button
              type="button"
              className={s.avatarButton}
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Abrir menu do perfil"
            >
              <span className={s.avatarCircle}>{initials}</span>
            </button>
            {menuOpen ? (
              <div className={s.profileDropdown} role="menu">
                <button
                  type="button"
                  className={s.profileAction}
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                >
                  Sair
                </button>
              </div>
            ) : null}
          </div>
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
            <article key={a.id} className={s.agendaCardLink}>
              <div className={s.rowBetween} style={{ alignItems: "center", marginBottom: "var(--spacing-sm)" }}>
                <div>
                  <strong style={{ fontSize: "1.0625rem" }}>{a.nome}</strong>
                  <p className={s.muted} style={{ margin: "6px 0 0" }}>
                    /{a.slug_agenda} · {a.papel === "proprietario" ? "Proprietário" : "Colaborador"}
                  </p>
                </div>
                <span className={s.agendaArrow}>→</span>
              </div>

              <div className={s.cardActions}>
                <Link
                  href={`/agendas/${a.id}`}
                  className={s.btnGhost}
                  aria-label="Abrir agenda"
                  title="Abrir agenda"
                >
                  <span aria-hidden="true">↗</span>
                </Link>
                <button
                  type="button"
                  className={s.btnGhost}
                  onClick={() => copyPublicRoute(a.slug_agenda, a.id)}
                  aria-label={copiedAgendaId === a.id ? "Rota copiada" : "Copiar rota pública"}
                  title={copiedAgendaId === a.id ? "Rota copiada" : "Copiar rota pública"}
                >
                  <span aria-hidden="true">{copiedAgendaId === a.id ? "✓" : "⧉"}</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
