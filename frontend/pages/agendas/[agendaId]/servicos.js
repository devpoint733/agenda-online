import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { api } from "../../../lib/api";
import AgendaLayout from "../../../components/layout/AgendaLayout";
import Modal from "../../../components/configuracao/Modal";
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
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

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

  function openCreateModal() {
    setEditId(null);
    setNome("");
    setDescricao("");
    setDuracao("30");
    setPreco("");
    setModalOpen(true);
  }

  function openEditModal(servico) {
    setEditId(servico.id);
    setNome(servico.nome || "");
    setDescricao(servico.descricao || "");
    setDuracao(String(servico.duracao_minutos || 30));
    setPreco(servico.preco != null ? String(servico.preco) : "");
    setModalOpen(true);
  }

  async function salvar(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api(`/agendas/${agendaId}/servicos${editId ? `/${editId}` : ""}`, {
        method: editId ? "PUT" : "POST",
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
      setEditId(null);
      setModalOpen(false);
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
        <div className={s.rowBetween} style={{ alignItems: "center" }}>
          <p className={s.muted} style={{ margin: 0 }}>
            Cadastre e mantenha seus serviços por aqui.
          </p>
          <button type="button" className={s.btnPrimary} onClick={openCreateModal}>
            <Plus size={16} />
            <span style={{ marginLeft: 8 }}>Novo serviço</span>
          </button>
        </div>
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
              <div className={s.btnRow}>
                <button
                  type="button"
                  className={s.iconBtn}
                  title="Editar serviço"
                  aria-label="Editar serviço"
                  onClick={() => openEditModal(x)}
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  className={s.iconBtn}
                  title="Excluir serviço"
                  aria-label="Excluir serviço"
                  onClick={() => remover(x.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen ? (
        <Modal
          title={editId ? "Editar serviço" : "Novo serviço"}
          onClose={() => setModalOpen(false)}
          actions={
            <>
              <button type="button" className={s.btnGhost} onClick={() => setModalOpen(false)}>
                Cancelar
              </button>
              <button type="submit" form="servico-form" className={s.btnPrimary} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </>
          }
        >
          <form id="servico-form" onSubmit={salvar} className={s.formStack}>
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
          </form>
        </Modal>
      ) : null}
    </AgendaLayout>
  );
}
