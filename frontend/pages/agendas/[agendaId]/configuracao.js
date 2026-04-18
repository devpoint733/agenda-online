import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { api } from "../../../lib/api";
import AgendaLayout from "../../../components/layout/AgendaLayout";
import s from "../../../styles/pages.module.css";

const DIAS = [
  { v: 0, l: "Domingo" },
  { v: 1, l: "Segunda" },
  { v: 2, l: "Terça" },
  { v: 3, l: "Quarta" },
  { v: 4, l: "Quinta" },
  { v: 5, l: "Sexta" },
  { v: 6, l: "Sábado" },
];

const TIPOS = ["texto", "texto_longo", "telefone", "email", "numero", "selecao"];

function toSqlTime(v) {
  if (!v) return "00:00:00";
  return v.length === 5 ? `${v}:00` : v;
}

export default function AgendaConfigPage() {
  const router = useRouter();
  const { agendaId } = router.query;
  const { user, loading } = useAuth();
  const [tab, setTab] = useState("disp");
  const [error, setError] = useState("");
  const [agendaNome, setAgendaNome] = useState("");
  const [disp, setDisp] = useState([]);
  const [exce, setExce] = useState([]);
  const [campos, setCampos] = useState([]);
  const [membros, setMembros] = useState([]);

  const [dia_semana, setDia] = useState("1");
  const [hora_inicio, setHi] = useState("09:00");
  const [hora_fim, setHf] = useState("18:00");

  const [data_excecao, setDataExc] = useState("");
  const [fechado_o_dia, setFechado] = useState(true);
  const [excHi, setExcHi] = useState("");
  const [excHf, setExcHf] = useState("");

  const [chave_campo, setChave] = useState("");
  const [rotulo, setRotulo] = useState("");
  const [tipo_campo, setTipo] = useState("texto");

  const [emailMembro, setEmailMembro] = useState("");
  const [papelMembro, setPapelMembro] = useState("colaborador");

  const loadAll = useCallback(async () => {
    if (!agendaId) return;
    setError("");
    try {
      const [ag, d, e, c, m] = await Promise.all([
        api(`/agendas/${agendaId}`),
        api(`/agendas/${agendaId}/disponibilidade-semanal`),
        api(`/agendas/${agendaId}/excecoes-calendario`),
        api(`/agendas/${agendaId}/campos-coleta`),
        api(`/agendas/${agendaId}/membros`),
      ]);
      setAgendaNome(ag.nome || "");
      setDisp(Array.isArray(d) ? d : []);
      setExce(Array.isArray(e) ? e : []);
      setCampos(Array.isArray(c) ? c : []);
      setMembros(Array.isArray(m) ? m : []);
    } catch (err) {
      setError(err.message || "Erro ao carregar");
    }
  }, [agendaId]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function addDisp(e) {
    e.preventDefault();
    try {
      await api(`/agendas/${agendaId}/disponibilidade-semanal`, {
        method: "POST",
        json: {
          dia_semana: Number(dia_semana),
          hora_inicio: toSqlTime(hora_inicio),
          hora_fim: toSqlTime(hora_fim),
        },
      });
      await loadAll();
    } catch (err) {
      setError(err.message || "Erro ao salvar");
    }
  }

  async function delDisp(id) {
    try {
      await api(`/agendas/${agendaId}/disponibilidade-semanal/${id}`, { method: "DELETE" });
      await loadAll();
    } catch (err) {
      setError(err.message || "Erro ao excluir");
    }
  }

  async function addExc(e) {
    e.preventDefault();
    try {
      await api(`/agendas/${agendaId}/excecoes-calendario`, {
        method: "POST",
        json: {
          data_excecao,
          fechado_o_dia: fechado_o_dia ? 1 : 0,
          hora_inicio: !fechado_o_dia && excHi ? toSqlTime(excHi) : null,
          hora_fim: !fechado_o_dia && excHf ? toSqlTime(excHf) : null,
        },
      });
      setDataExc("");
      await loadAll();
    } catch (err) {
      setError(err.message || "Erro ao salvar exceção");
    }
  }

  async function delExc(id) {
    try {
      await api(`/agendas/${agendaId}/excecoes-calendario/${id}`, { method: "DELETE" });
      await loadAll();
    } catch (err) {
      setError(err.message || "Erro");
    }
  }

  async function addCampo(e) {
    e.preventDefault();
    try {
      await api(`/agendas/${agendaId}/campos-coleta`, {
        method: "POST",
        json: { chave_campo, rotulo, tipo_campo },
      });
      setChave("");
      setRotulo("");
      setTipo("texto");
      await loadAll();
    } catch (err) {
      setError(err.message || "Erro");
    }
  }

  async function delCampo(id) {
    try {
      await api(`/agendas/${agendaId}/campos-coleta/${id}`, { method: "DELETE" });
      await loadAll();
    } catch (err) {
      setError(err.message || "Erro");
    }
  }

  async function addMembro(e) {
    e.preventDefault();
    try {
      await api(`/agendas/${agendaId}/membros`, {
        method: "POST",
        json: { email: emailMembro, papel: papelMembro },
      });
      setEmailMembro("");
      await loadAll();
    } catch (err) {
      setError(err.message || "Só o proprietário pode adicionar ou e-mail inválido");
    }
  }

  async function delMembro(uid) {
    try {
      await api(`/agendas/${agendaId}/membros/${uid}`, { method: "DELETE" });
      await loadAll();
    } catch (err) {
      setError(err.message || "Erro ao remover");
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
    <AgendaLayout agendaTitle={agendaNome || "Ajustes"}>
      <Head>
        <title>Ajustes da agenda</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <h1 className={s.pageTitle}>Ajustes</h1>
      {error ? (
        <p className={s.error} role="alert">
          {error}
        </p>
      ) : null}

      <div className={s.tabs} role="tablist">
        {[
          ["disp", "Horários semanais"],
          ["exc", "Exceções"],
          ["campos", "Campos"],
          ["membros", "Equipe"],
        ].map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            className={`${s.tab} ${tab === k ? s.tabActive : ""}`}
            onClick={() => {
              setTab(k);
              setError("");
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "disp" ? (
        <>
          <div className={s.card}>
            <form onSubmit={addDisp} className={s.formStack}>
              <div>
                <label className={s.label}>Dia da semana</label>
                <select className={s.select} value={dia_semana} onChange={(e) => setDia(e.target.value)}>
                  {DIAS.map((d) => (
                    <option key={d.v} value={d.v}>
                      {d.l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={s.label}>Início</label>
                <input className={s.input} type="time" value={hora_inicio} onChange={(e) => setHi(e.target.value)} />
              </div>
              <div>
                <label className={s.label}>Fim</label>
                <input className={s.input} type="time" value={hora_fim} onChange={(e) => setHf(e.target.value)} />
              </div>
              <button type="submit" className={s.btnPrimary}>
                Adicionar janela
              </button>
            </form>
          </div>
          {disp.map((r) => (
            <div key={r.id} className={s.card}>
              <div className={s.rowBetween}>
                <span>
                  {DIAS.find((d) => d.v === r.dia_semana)?.l || r.dia_semana}: {r.hora_inicio?.slice(0, 5)} –{" "}
                  {r.hora_fim?.slice(0, 5)}
                </span>
                <button type="button" className={s.btnGhost} onClick={() => delDisp(r.id)}>
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </>
      ) : null}

      {tab === "exc" ? (
        <>
          <div className={s.card}>
            <form onSubmit={addExc} className={s.formStack}>
              <div>
                <label className={s.label}>Data</label>
                <input className={s.input} type="date" value={data_excecao} onChange={(e) => setDataExc(e.target.value)} required />
              </div>
              <label className={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={fechado_o_dia} onChange={(e) => setFechado(e.target.checked)} />
                Dia fechado inteiro
              </label>
              {!fechado_o_dia ? (
                <>
                  <div>
                    <label className={s.label}>Início (janela)</label>
                    <input className={s.input} type="time" value={excHi} onChange={(e) => setExcHi(e.target.value)} />
                  </div>
                  <div>
                    <label className={s.label}>Fim</label>
                    <input className={s.input} type="time" value={excHf} onChange={(e) => setExcHf(e.target.value)} />
                  </div>
                </>
              ) : null}
              <button type="submit" className={s.btnPrimary}>
                Salvar exceção
              </button>
            </form>
          </div>
          {exce.map((r) => (
            <div key={r.id} className={s.card}>
              <div className={s.rowBetween}>
                <span className={s.muted}>
                  {r.data_excecao?.slice(0, 10)} — {r.fechado_o_dia ? "fechado" : `${r.hora_inicio}–${r.hora_fim}`}
                </span>
                <button type="button" className={s.btnGhost} onClick={() => delExc(r.id)}>
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </>
      ) : null}

      {tab === "campos" ? (
        <>
          <div className={s.card}>
            <form onSubmit={addCampo} className={s.formStack}>
              <div>
                <label className={s.label}>Chave (id único)</label>
                <input className={s.input} value={chave_campo} onChange={(e) => setChave(e.target.value)} required />
              </div>
              <div>
                <label className={s.label}>Rótulo</label>
                <input className={s.input} value={rotulo} onChange={(e) => setRotulo(e.target.value)} required />
              </div>
              <div>
                <label className={s.label}>Tipo</label>
                <select className={s.select} value={tipo_campo} onChange={(e) => setTipo(e.target.value)}>
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className={s.btnPrimary}>
                Adicionar campo
              </button>
            </form>
          </div>
          {campos.map((r) => (
            <div key={r.id} className={s.card}>
              <div className={s.rowBetween}>
                <span>
                  <strong>{r.rotulo}</strong>
                  <span className={s.muted} style={{ marginLeft: 8 }}>
                    ({r.chave_campo}) · {r.tipo_campo}
                  </span>
                </span>
                <button type="button" className={s.btnGhost} onClick={() => delCampo(r.id)}>
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </>
      ) : null}

      {tab === "membros" ? (
        <>
          <div className={s.card}>
            <p className={s.muted} style={{ marginTop: 0 }}>
              Apenas o proprietário pode convidar por e-mail.
            </p>
            <form onSubmit={addMembro} className={s.formStack}>
              <div>
                <label className={s.label}>E-mail do usuário</label>
                <input className={s.input} type="email" value={emailMembro} onChange={(e) => setEmailMembro(e.target.value)} required />
              </div>
              <div>
                <label className={s.label}>Papel</label>
                <select className={s.select} value={papelMembro} onChange={(e) => setPapelMembro(e.target.value)}>
                  <option value="colaborador">Colaborador</option>
                  <option value="proprietario">Proprietário</option>
                </select>
              </div>
              <button type="submit" className={s.btnPrimary}>
                Vincular
              </button>
            </form>
          </div>
          {membros.map((r) => (
            <div key={r.id} className={s.card}>
              <div className={s.rowBetween}>
                <div>
                  <strong>{r.nome}</strong>
                  <p className={s.muted} style={{ margin: "6px 0 0" }}>
                    {r.email} · {r.papel}
                  </p>
                </div>
                <button type="button" className={s.btnGhost} onClick={() => delMembro(r.usuario_id)}>
                  Remover
                </button>
              </div>
            </div>
          ))}
        </>
      ) : null}
    </AgendaLayout>
  );
}
