import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { api, getStoredToken, uploadUserAvatar } from "../lib/api";
import PainelLayout from "../components/layout/PainelLayout";
import s from "../styles/pages.module.css";

const NAV = [
  { key: "perfil", label: "Meus dados" },
  { key: "nova-agenda", label: "Nova agenda" },
];

export default function PainelPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [tab, setTab] = useState("perfil");
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [senha, setSenha] = useState("");
  const [perfilBusy, setPerfilBusy] = useState(false);
  const [avatarUploadBusy, setAvatarUploadBusy] = useState(false);
  const [avatarPreviewBroken, setAvatarPreviewBroken] = useState(false);
  const avatarFileRef = useRef(null);

  const avatarInitials = useMemo(() => {
    const parts = nome
      ?.split(" ")
      ?.filter(Boolean)
      ?.slice(0, 2)
      ?.map((p) => p[0]?.toUpperCase())
      ?.join("");
    return parts || "•";
  }, [nome]);

  const [agendaNome, setAgendaNome] = useState("");
  const [agendaAtiva, setAgendaAtiva] = useState(true);
  const [agendaBusy, setAgendaBusy] = useState(false);
  const [novaAgendaId, setNovaAgendaId] = useState(null);

  useEffect(() => {
    setError("");
    setOkMsg("");
    if (tab !== "nova-agenda") setNovaAgendaId(null);
  }, [tab]);

  useEffect(() => {
    setAvatarPreviewBroken(false);
  }, [avatarUrl]);

  const hydratePerfil = useCallback((u) => {
    if (!u) return;
    setNome(u.nome || "");
    setEmail(u.email || "");
    setTelefone(u.telefone || "");
    setAvatarUrl(u.avatar_url || "");
    setSenha("");
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const snapshot = user;
    (async () => {
      try {
        const row = await api(`/usuarios/${snapshot.id}`);
        if (!cancelled && row) hydratePerfil(row);
      } catch {
        if (!cancelled) hydratePerfil(snapshot);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, hydratePerfil]);

  async function salvarPerfil(e) {
    e.preventDefault();
    if (!user?.id) return;
    setPerfilBusy(true);
    setError("");
    setOkMsg("");
    try {
      const payload = {
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      };
      if (senha.trim()) {
        if (senha.trim().length < 6) {
          setError("A nova senha deve ter pelo menos 6 caracteres.");
          setPerfilBusy(false);
          return;
        }
        payload.senha = senha.trim();
      }
      const updated = await api(`/usuarios/${user.id}`, {
        method: "PUT",
        json: payload,
      });
      const token = getStoredToken();
      if (token) {
        login(token, {
          id: updated.id,
          nome: updated.nome,
          email: updated.email,
          telefone: updated.telefone,
          avatar_url: updated.avatar_url ?? null,
        });
      }
      hydratePerfil(updated);
      setOkMsg("Dados atualizados com sucesso.");
    } catch (err) {
      setError(err.message || "Não foi possível salvar.");
    } finally {
      setPerfilBusy(false);
    }
  }

  async function onEscolherAvatar(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user?.id) return;
    setError("");
    setOkMsg("");
    setAvatarUploadBusy(true);
    try {
      const data = await uploadUserAvatar(file);
      const url = data.avatar_url;
      setAvatarUrl(url || "");
      const token = getStoredToken();
      if (token && data.user) {
        login(token, {
          id: data.user.id,
          nome: data.user.nome,
          email: data.user.email,
          telefone: data.user.telefone,
          avatar_url: data.user.avatar_url ?? null,
        });
      }
      setOkMsg("");
    } catch (err) {
      setError(err.message || "Falha no envio da imagem.");
    } finally {
      setAvatarUploadBusy(false);
    }
  }

  async function removerAvatar() {
    if (!user?.id) return;
    setError("");
    setOkMsg("");
    setPerfilBusy(true);
    try {
      const updated = await api(`/usuarios/${user.id}`, {
        method: "PUT",
        json: {
          nome: nome.trim(),
          email: email.trim(),
          telefone: telefone.trim() || null,
          avatar_url: null,
        },
      });
      setAvatarUrl("");
      const token = getStoredToken();
      if (token) {
        login(token, {
          id: updated.id,
          nome: updated.nome,
          email: updated.email,
          telefone: updated.telefone,
          avatar_url: updated.avatar_url ?? null,
        });
      }
      setOkMsg("Foto removida do perfil.");
    } catch (err) {
      setError(err.message || "Não foi possível remover a foto.");
    } finally {
      setPerfilBusy(false);
    }
  }

  async function criarAgenda(e) {
    e.preventDefault();
    setAgendaBusy(true);
    setError("");
    setOkMsg("");
    setNovaAgendaId(null);
    try {
      const created = await api("/agendas", {
        method: "POST",
        json: {
          nome: agendaNome.trim(),
          ativo: agendaAtiva ? 1 : 0,
        },
      });
      setOkMsg(`Agenda “${created.nome}” criada e vinculada à sua conta como proprietário.`);
      setNovaAgendaId(created.id);
      setAgendaNome("");
      setAgendaAtiva(true);
    } catch (err) {
      setError(err.message || "Não foi possível criar a agenda.");
    } finally {
      setAgendaBusy(false);
    }
  }

  if (loading || !user) {
    return (
      <>
        <Head>
          <title>Painel</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        </Head>
        <div className={s.landing}>
          <p className={s.muted}>Carregando…</p>
        </div>
      </>
    );
  }

  return (
    <PainelLayout title="Painel de controle" items={NAV} activeKey={tab} onSelect={setTab}>
      <Head>
        <title>Painel de controle</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      {tab === "perfil" ? (
        <>
          <h1 className={`${s.pageTitle} ${s.perfilPageTitle}`}>Meus dados</h1>

        </>
      ) : (
        <>
          <h1 className={s.pageTitle}>Nova agenda</h1>
          <p className={s.muted} style={{ marginTop: -8, marginBottom: "var(--spacing-md)" }}>
            Cria a agenda e já associa você como proprietário (mesmo fluxo da API).
          </p>
        </>
      )}

      {error ? (
        <p className={s.error} role="alert">
          {error}
        </p>
      ) : null}
      {okMsg ? (
        <p className={s.muted} style={{ color: "var(--color-success)", marginBottom: "var(--spacing-md)" }}>
          {okMsg}
        </p>
      ) : null}

      {tab === "perfil" ? (
        <div className={`${s.card} ${s.perfilCard}`}>
          <form onSubmit={salvarPerfil} className={s.formStack}>
            <div className={s.perfilAvatarBlock}>
              <span id="painel-avatar-heading" className={s.perfilAvatarHeading}>
                Foto de perfil
              </span>
              <input
                id="painel-avatar-file"
                ref={avatarFileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className={s.fileInputHidden}
                aria-labelledby="painel-avatar-heading"
                onChange={onEscolherAvatar}
              />
              <button
                type="button"
                className={s.perfilAvatarTrigger}
                disabled={avatarUploadBusy || perfilBusy}
                aria-label="Escolher ou alterar foto de perfil"
                onClick={() => avatarFileRef.current?.click()}
              >
                <div className={s.perfilAvatarCircle}>
                  {avatarUrl.trim() && !avatarPreviewBroken ? (
                    <img
                      src={avatarUrl.trim()}
                      alt=""
                      className={s.perfilAvatarCircleImg}
                      onError={() => setAvatarPreviewBroken(true)}
                    />
                  ) : (
                    <span className={s.perfilAvatarInitials}>{avatarInitials}</span>
                  )}
                  <span className={s.perfilAvatarHoverOverlay} aria-hidden>
                    <ImagePlus size={26} strokeWidth={2} />
                    <span className={s.perfilAvatarHoverText}>Anexar</span>
                  </span>
                </div>
              </button>
              {avatarUrl.trim() ? (
                <button
                  type="button"
                  className={s.perfilAvatarRemove}
                  disabled={perfilBusy || avatarUploadBusy}
                  onClick={removerAvatar}
                >
                  Remover foto
                </button>
              ) : null}
            </div>
            <div>
              <label className={s.label} htmlFor="painel-nome">
                Nome
              </label>
              <input
                id="painel-nome"
                className={s.input}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
            <div>
              <label className={s.label} htmlFor="painel-email">
                E-mail
              </label>
              <input
                id="painel-email"
                type="email"
                className={s.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className={s.label} htmlFor="painel-tel">
                Telefone
              </label>
              <input
                id="painel-tel"
                className={s.input}
                inputMode="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                autoComplete="tel"
              />
            </div>
            <div>
              <label className={s.label} htmlFor="painel-senha">
                Nova senha (opcional)
              </label>
              <input
                id="painel-senha"
                type="password"
                className={s.input}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="new-password"
                placeholder="Deixe em branco para manter"
              />
            </div>
            <button type="submit" className={s.btnPrimary} disabled={perfilBusy || avatarUploadBusy}>
              {perfilBusy ? "Salvando…" : "Salvar alterações"}
            </button>
          </form>
        </div>
      ) : (
        <div className={s.card}>
          <form onSubmit={criarAgenda} className={s.formStack}>
            <div>
              <label className={s.label} htmlFor="painel-agenda-nome">
                Nome da agenda
              </label>
              <input
                id="painel-agenda-nome"
                className={s.input}
                value={agendaNome}
                onChange={(e) => setAgendaNome(e.target.value)}
                required
                placeholder="Ex.: Studio Centro"
              />
            </div>
            <label className={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={agendaAtiva}
                onChange={(e) => setAgendaAtiva(e.target.checked)}
              />
              Agenda ativa (aparece no agendamento público)
            </label>
            <button type="submit" className={s.btnPrimary} disabled={agendaBusy}>
              {agendaBusy ? "Criando…" : "Criar"}
            </button>
            {novaAgendaId ? (
              <div className={s.btnRow}>
                <Link href={`/agendas/${novaAgendaId}`} className={s.btnGhost}>
                  Abrir esta agenda
                </Link>
                <Link href="/agendas" className={s.btnGhost}>
                  Ver lista de agendas
                </Link>
              </div>
            ) : null}
          </form>
        </div>
      )}
    </PainelLayout>
  );
}
