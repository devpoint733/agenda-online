import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { api } from "../../../lib/api";
import AgendaLayout from "../../../components/layout/AgendaLayout";
import s from "../../../styles/pages.module.css";

export default function AgendaServicosPage() {
  const router = useRouter();
  const { agendaId } = router.query;
  const { user, loading } = useAuth();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [agendaNome, setAgendaNome] = useState("");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [duracao_minutos, setDuracao] = useState("30");
  const [preco, setPreco] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!agendaId) return;
    setError("");
    try {
      const [ag, list] = await Promise.all([
        api(`/agendas/${agendaId}`),
        api(`/agendas/${agendaId}/servicos`),
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
      await api(`/agendas/${agendaId}/servicos`, {
        method: "POST",
        json: {
          nome,
          descricao: descricao || undefined,
          duracao_minutos: Number(duracao_minutos),
          preco: preco ? Number(preco) : undefined,
        },
      });
      setNome("");
      setDescricao("");
      setDuracao("30");
      setPreco("");
      await load();
    } catch (err) {
      setError(err.message || "Não foi possível salvar");
    } finally {
      setSaving(false);
    }
  }

  async function remover(id) {
    if (!confirm("Excluir este serviço?")) return;
    try {
      await api(`/agendas/${agendaId}/servicos/${id}`, { method: "DELETE" });
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
    <AgendaLayout agendaTitle={agendaNome || "Serviços"}>
      <Head>
        <title>Serviços</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <h1 className={s.pageTitle}>Serviços</h1>
      {error ? (
        <p className={s.error} role="alert">
          {error}
        </p>
      ) : null}

      <div className={s.card}>
        <h2 className={s.muted} style={{ margin: "0 0 var(--spacing-md)", fontSize: "1rem", fontWeight: 600 }}>
          Novo serviço
        </h2>
        <form onSubmit={criar} className={s.formStack}>
          <div>
            <label className={s.label}>Nome</label>
            <input className={s.input} value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div>
            <label className={s.label}>Descrição</label>
            <textarea className={s.textarea} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div>
            <label className={s.label}>Duração (minutos)</label>
            <input
              className={s.input}
              type="number"
              min={1}
              value={duracao_minutos}
              onChange={(e) => setDuracao(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={s.label}>Preço (opcional, número inteiro)</label>
            <input className={s.input} type="number" min={0} value={preco} onChange={(e) => setPreco(e.target.value)} />
          </div>
          <button type="submit" className={s.btnPrimary} disabled={saving}>
            {saving ? "Salvando…" : "Adicionar"}
          </button>
        </form>
      </div>

      <div className={s.cardList}>
        {rows.map((x) => (
          <div key={x.id} className={s.card}>
            <div className={s.rowBetween}>
              <div>
                <strong>{x.nome}</strong>
                <p className={s.muted} style={{ margin: "6px 0 0" }}>
                  {x.duracao_minutos} min
                  {x.preco != null ? ` · preço ${x.preco}` : ""}
                </p>
              </div>
              <button type="button" className={s.btnGhost} onClick={() => remover(x.id)}>
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </AgendaLayout>
  );
}
