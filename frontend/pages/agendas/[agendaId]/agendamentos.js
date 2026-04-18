import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "../../../hooks/useAuth";
import { api } from "../../../lib/api";
import AgendaLayout from "../../../components/layout/AgendaLayout";
import s from "../../../styles/pages.module.css";

function fmt(dt) {
  if (!dt) return "—";
  try {
    const raw = String(dt).trim();
    const iso = raw.includes("T") ? raw : raw.replace(" ", "T");
    return format(parseISO(iso), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return dt;
  }
}

function badgeClass(situacao) {
  if (situacao === "confirmado" || situacao === "concluido") return s.badgeOk;
  if (situacao === "pendente") return s.badgeWarn;
  if (situacao === "cancelado" || situacao === "nao_compareceu") return s.badgeErr;
  return s.badgeNeu;
}

function toMysqlDatetime(v) {
  if (!v) return null;
  const x = String(v).replace("T", " ");
  return x.length === 16 ? `${x}:00` : x;
}

export default function AgendaAgendamentosPage() {
  const router = useRouter();
  const { agendaId } = router.query;
  const { user, loading } = useAuth();
  const [rows, setRows] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [error, setError] = useState("");
  const [agendaNome, setAgendaNome] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [servicoId, setServicoId] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [situacao, setSituacao] = useState("confirmado");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!agendaId) return;
    setError("");
    try {
      const [ag, list, c, srv] = await Promise.all([
        api(`/agendas/${agendaId}`),
        api(`/agendas/${agendaId}/agendamentos`),
        api(`/agendas/${agendaId}/clientes`),
        api(`/agendas/${agendaId}/servicos`),
      ]);
      setAgendaNome(ag.nome || "");
      setRows(Array.isArray(list) ? list : []);
      setClientes(Array.isArray(c) ? c : []);
      setServicos(Array.isArray(srv) ? srv : []);
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
    if (!agendaId) return;
    setSaving(true);
    setError("");
    try {
      await api(`/agendas/${agendaId}/agendamentos`, {
        method: "POST",
        json: {
          cliente_id: Number(clienteId),
          servico_id: Number(servicoId),
          inicio_em: toMysqlDatetime(inicio),
          fim_em: toMysqlDatetime(fim),
          situacao,
        },
      });
      setClienteId("");
      setServicoId("");
      setInicio("");
      setFim("");
      setSituacao("confirmado");
      await load();
    } catch (err) {
      setError(err.message || "Não foi possível criar");
    } finally {
      setSaving(false);
    }
  }

  async function patchSituacao(id, sit) {
    try {
      await api(`/agendas/${agendaId}/agendamentos/${id}`, {
        method: "PATCH",
        json: { situacao: sit },
      });
      await load();
    } catch (err) {
      setError(err.message || "Erro ao atualizar");
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
    <AgendaLayout agendaTitle={agendaNome || "Agendamentos"}>
      <Head>
        <title>Agendamentos</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <h1 className={s.pageTitle}>Agendamentos</h1>
      {error ? (
        <p className={s.error} role="alert">
          {error}
        </p>
      ) : null}

      <div className={s.card}>
        <h2 className={s.muted} style={{ margin: "0 0 var(--spacing-md)", fontSize: "1rem", fontWeight: 600 }}>
          Novo agendamento
        </h2>
        <form onSubmit={criar} className={s.formStack}>
          <div>
            <label className={s.label}>Cliente</label>
            <select
              className={s.select}
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              required
            >
              <option value="">Selecione</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome_completo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={s.label}>Serviço</label>
            <select
              className={s.select}
              value={servicoId}
              onChange={(e) => setServicoId(e.target.value)}
              required
            >
              <option value="">Selecione</option>
              {servicos.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={s.label}>Início</label>
            <input
              className={s.input}
              type="datetime-local"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={s.label}>Fim</label>
            <input
              className={s.input}
              type="datetime-local"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={s.label}>Situação inicial</label>
            <select className={s.select} value={situacao} onChange={(e) => setSituacao(e.target.value)}>
              <option value="pendente">Pendente</option>
              <option value="confirmado">Confirmado</option>
              <option value="cancelado">Cancelado</option>
              <option value="concluido">Concluído</option>
              <option value="nao_compareceu">Não compareceu</option>
            </select>
          </div>
          <button type="submit" className={s.btnPrimary} disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </form>
      </div>

      <div className={s.cardList}>
        {rows.map((r) => (
          <div key={r.id} className={s.card}>
            <div className={s.rowBetween}>
              <div>
                <span className={`${s.badge} ${badgeClass(r.situacao)}`}>{r.situacao?.replace("_", " ")}</span>
                <p style={{ margin: "10px 0 4px", fontWeight: 600 }}>{fmt(r.inicio_em)}</p>
                <p className={s.muted} style={{ margin: 0 }}>
                  até {fmt(r.fim_em)}
                </p>
              </div>
            </div>
            <div className={s.btnRow} style={{ marginTop: 12 }}>
              <button type="button" className={s.btnGhost} onClick={() => patchSituacao(r.id, "confirmado")}>
                Confirmar
              </button>
              <button type="button" className={s.btnGhost} onClick={() => patchSituacao(r.id, "concluido")}>
                Concluir
              </button>
              <button type="button" className={s.btnGhost} onClick={() => patchSituacao(r.id, "cancelado")}>
                Cancelar
              </button>
            </div>
          </div>
        ))}
      </div>
    </AgendaLayout>
  );
}
