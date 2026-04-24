import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
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
  const [avatarBroken, setAvatarBroken] = useState(false);
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
    setAvatarBroken(false);
  }, [user?.avatar_url]);

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
              {user?.avatar_url && !avatarBroken ? (
                <img
                  src={user.avatar_url}
                  alt=""
                  className={s.avatarButtonImage}
                  onError={() => setAvatarBroken(true)}
                />
              ) : (
                <span className={s.avatarCircle}>{initials}</span>
              )}
            </button>
            {menuOpen ? (
              <div className={s.profileDropdown} role="menu">
                <Link
                  href="/painel"
                  className={s.profileActionLink}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  Painel de controle
                </Link>
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
              Nenhuma agenda ainda.{" "}
              <Link href="/painel" style={{ color: "var(--color-primary)" }}>
                Crie uma no painel
              </Link>{" "}
              ou peça acesso a um proprietário.
            </p>
          </div>
        ) : null}

        <div className={s.cardList}>
          {list.map((a) => {
            const isOwner = a.papel === "proprietario";
            return (
              <article key={a.id} className={s.agendaCardLink}>
                <div className={s.agendaCardHeader}>
                  <div className={s.agendaCardMain}>
                    <div className={s.agendaCardTitleRow}>
                      <strong className={s.agendaCardTitle}>{a.nome}</strong>
                      <button
                        type="button"
                        className={s.agendaCopyBtn}
                        onClick={() => copyPublicRoute(a.slug_agenda, a.id)}
                        aria-label={copiedAgendaId === a.id ? "Link copiado" : "Copiar link público da agenda"}
                        title={copiedAgendaId === a.id ? "Copiado!" : "Copiar link público"}
                      >
                        {copiedAgendaId === a.id ? (
                          <Check size={18} strokeWidth={2.5} className={s.agendaCopyIconOk} aria-hidden />
                        ) : (
                          <Copy size={18} strokeWidth={2} aria-hidden />
                        )}
                      </button>
                    </div>
                    <div className={s.agendaRoleRow}>
                      <span
                        className={`${s.agendaRoleBadge} ${isOwner ? s.agendaRoleOwner : s.agendaRoleMember}`}
                      >
                        {isOwner ? "Proprietário" : "Colaborador"}
                      </span>
                    </div>
                  </div>
                  <Link href={`/agendas/${a.id}`} className={s.agendaAcessar}>
                    Acessar
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}
