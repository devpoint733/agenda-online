import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { api } from "../../../lib/api";
import AgendaLayout from "../../../components/layout/AgendaLayout";
import Modal from "../../../components/configuracao/Modal";
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
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

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

  function openCreateModal() {
    setEditId(null);
    setNome("");
    setEmail("");
    setTelefone("");
    setObs("");
    setModalOpen(true);
  }

  function openEditModal(cliente) {
    setEditId(cliente.id);
    setNome(cliente.nome_completo || "");
    setEmail(cliente.email || "");
    setTelefone(cliente.telefone || "");
    setObs(cliente.observacoes || "");
    setModalOpen(true);
  }

  async function salvar(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api(`/agendas/${agendaId}/clientes${editId ? `/${editId}` : ""}`, {
        method: editId ? "PUT" : "POST",
        json: {
          nome_completo,
          email,
          telefone,
          observacoes: observacoes || undefined,
        },
      });
      setNome("");
      setEmail("");
      setTelefone("");
      setObs("");
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
        <div className={s.rowBetween} style={{ alignItems: "center" }}>
          <p className={s.muted} style={{ margin: 0 }}>
            Cadastre e edite clientes da agenda.
          </p>
          <button type="button" className={s.btnPrimary} onClick={openCreateModal}>
            <Plus size={16} />
            <span style={{ marginLeft: 8 }}>Novo cliente</span>
          </button>
        </div>
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
              <div className={s.btnRow}>
                <button
                  type="button"
                  className={s.iconBtn}
                  title="Editar cliente"
                  aria-label="Editar cliente"
                  onClick={() => openEditModal(c)}
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  className={s.iconBtn}
                  title="Excluir cliente"
                  aria-label="Excluir cliente"
                  onClick={() => remover(c.id)}
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
          title={editId ? "Editar cliente" : "Novo cliente"}
          onClose={() => setModalOpen(false)}
          actions={
            <>
              <button type="button" className={s.btnGhost} onClick={() => setModalOpen(false)}>
                Cancelar
              </button>
              <button type="submit" form="cliente-form" className={s.btnPrimary} disabled={saving}>
                {saving ? "Salvando…" : "Salvar"}
              </button>
            </>
          }
        >
          <form id="cliente-form" onSubmit={salvar} className={s.formStack}>
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
          </form>
        </Modal>
      ) : null}
    </AgendaLayout>
  );
}
