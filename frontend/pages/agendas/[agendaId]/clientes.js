import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { api } from "../../../lib/api";
import AgendaLayout from "../../../components/layout/AgendaLayout";
import s from "../../../styles/pages.module.css";

export default function AgendaClientesPage() {
  const router = useRouter();
  const { agendaId } = router.query;
  const { user, loading } = useAuth();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [agendaNome, setAgendaNome] = useState("");
  const [nome_completo, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacoes, setObs] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!agendaId) return;
    setError("");
    try {
      const [ag, list] = await Promise.all([
        api(`/agendas/${agendaId}`),
        api(`/agendas/${agendaId}/clientes`),
      ]);
      setAgendaNome(ag.nome || "");
      setRows(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || "Erro ao carregar");
    }
  }, [agendaId]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function criar(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api(`/agendas/${agendaId}/clientes`, {
        method: "POST",
        json: { nome_completo, email, telefone, observacoes: observacoes || undefined },
      });
      setNome("");
      setEmail("");
      setTelefone("");
      setObs("");
      await load();
    } catch (err) {
      setError(err.message || "Não foi possível salvar");
    } finally {
      setSaving(false);
    }
  }

  async function remover(id) {
    if (!confirm("Excluir este cliente?")) return;
    try {
      await api(`/agendas/${agendaId}/clientes/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err.message || "Erro ao excluir");
    }
  }

  if (!agendaId || loading || !user) {
    return (
      <AgendaLayout>
        <p className={s.muted}>Carregando…</p>
      </AgendaLayout>
    );
  }

  return (
    <AgendaLayout agendaTitle={agendaNome || "Clientes"}>
      <Head>
        <title>Clientes</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <h1 className={s.pageTitle}>Clientes</h1>
      {error ? (
        <p className={s.error} role="alert">
          {error}
        </p>
      ) : null}

      <div className={s.card}>
        <h2 className={s.muted} style={{ margin: "0 0 var(--spacing-md)", fontSize: "1rem", fontWeight: 600 }}>
          Novo cliente
        </h2>
        <form onSubmit={criar} className={s.formStack}>
          <div>
            <label className={s.label}>Nome completo</label>
            <input className={s.input} value={nome_completo} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div>
            <label className={s.label}>E-mail</label>
            <input className={s.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className={s.label}>Telefone</label>
            <input
              className={s.input}
              inputMode="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={s.label}>Observações</label>
            <textarea className={s.textarea} value={observacoes} onChange={(e) => setObs(e.target.value)} />
          </div>
          <button type="submit" className={s.btnPrimary} disabled={saving}>
            {saving ? "Salvando…" : "Adicionar"}
          </button>
        </form>
      </div>

      <div className={s.cardList}>
        {rows.map((c) => (
          <div key={c.id} className={s.card}>
            <div className={s.rowBetween}>
              <div>
                <strong>{c.nome_completo}</strong>
                <p className={s.muted} style={{ margin: "6px 0 0" }}>
                  {c.email} · {c.telefone}
                </p>
              </div>
              <button type="button" className={s.btnGhost} onClick={() => remover(c.id)}>
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </AgendaLayout>
  );
}
