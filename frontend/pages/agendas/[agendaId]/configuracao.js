import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { api } from "../../../lib/api";
import AgendaLayout from "../../../components/layout/AgendaLayout";
import AgendaTab from "../../../components/configuracao/AgendaTab";
import FuncionamentoTab from "../../../components/configuracao/FuncionamentoTab";
import CamposTab from "../../../components/configuracao/CamposTab";
import MembrosTab from "../../../components/configuracao/MembrosTab";
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

function dayLabel(v) {
  return DIAS.find((d) => d.v === v)?.l || String(v);
}

export default function AgendaConfigPage() {
  const router = useRouter();
  const { agendaId } = router.query;
  const { user, loading } = useAuth();

  const [tab, setTab] = useState("funcionamento");
  const [error, setError] = useState("");

  const [agendaNome, setAgendaNome] = useState("");
  const [agendaSlug, setAgendaSlug] = useState("");
  const [agendaAtivo, setAgendaAtivo] = useState(true);
  const [agendaNomeEdit, setAgendaNomeEdit] = useState("");
  const [regenerandoSlug, setRegenerandoSlug] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [disp, setDisp] = useState([]);
  const [exce, setExce] = useState([]);
  const [campos, setCampos] = useState([]);
  const [membros, setMembros] = useState([]);

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
      setAgendaNomeEdit(ag.nome || "");
      setAgendaSlug(ag.slug_agenda || "");
      setAgendaAtivo(Boolean(ag.ativo));
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

  async function salvarAgenda(e) {
    e.preventDefault();
    try {
      const updated = await api(`/agendas/${agendaId}`, {
        method: "PUT",
        json: { nome: agendaNomeEdit, ativo: agendaAtivo ? 1 : 0 },
      });
      setAgendaNome(updated.nome || "");
      setAgendaNomeEdit(updated.nome || "");
      setAgendaSlug(updated.slug_agenda || "");
      setAgendaAtivo(Boolean(updated.ativo));
    } catch (err) {
      setError(err.message || "Erro ao salvar agenda");
      throw err;
    }
  }

  async function regenerarSlug() {
    setRegenerandoSlug(true);
    try {
      const updated = await api(`/agendas/${agendaId}/slug/regenerate`, { method: "POST" });
      setAgendaSlug(updated.slug_agenda || "");
      setAgendaNome(updated.nome || "");
      setAgendaNomeEdit(updated.nome || "");
      setAgendaAtivo(Boolean(updated.ativo));
    } catch (err) {
      setError(err.message || "Erro ao regenerar slug");
      throw err;
    } finally {
      setRegenerandoSlug(false);
    }
  }

  async function copiarLinkAgenda() {
    if (!agendaSlug || typeof window === "undefined") return;
    const publicUrl = `${window.location.origin}/${agendaSlug}`;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1800);
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
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1800);
    }
  }

  async function addDisp(payload) {
    try {
      const dias = Array.from(new Set([payload.dia_semana, ...(payload.dias_extras || [])]));
      await Promise.all(
        dias.map((dia) =>
          api(`/agendas/${agendaId}/disponibilidade-semanal`, {
            method: "POST",
            json: {
              dia_semana: dia,
              hora_inicio: payload.hora_inicio,
              hora_fim: payload.hora_fim,
            },
          })
        )
      );
      await loadAll();
    } catch (err) {
      setError(err.message || "Erro ao salvar horário");
      throw err;
    }
  }

  async function delDisp(id) {
    try {
      await api(`/agendas/${agendaId}/disponibilidade-semanal/${id}`, { method: "DELETE" });
      await loadAll();
    } catch (err) {
      setError(err.message || "Erro ao excluir horário");
    }
  }

  async function addExc(payload) {
    try {
      await api(`/agendas/${agendaId}/excecoes-calendario`, {
        method: "POST",
        json: payload,
      });
      await loadAll();
    } catch (err) {
      setError(err.message || "Erro ao salvar exceção");
      throw err;
    }
  }

  async function delExc(id) {
    try {
      await api(`/agendas/${agendaId}/excecoes-calendario/${id}`, { method: "DELETE" });
      await loadAll();
    } catch (err) {
      setError(err.message || "Erro ao excluir exceção");
    }
  }

  async function addCampo(payload) {
    try {
      await api(`/agendas/${agendaId}/campos-coleta`, { method: "POST", json: payload });
      await loadAll();
    } catch (err) {
      setError(err.message || "Erro ao adicionar campo");
      throw err;
    }
  }

  async function delCampo(id) {
    try {
      await api(`/agendas/${agendaId}/campos-coleta/${id}`, { method: "DELETE" });
      await loadAll();
    } catch (err) {
      setError(err.message || "Erro ao excluir campo");
    }
  }

  async function addMembro(payload) {
    try {
      await api(`/agendas/${agendaId}/membros`, { method: "POST", json: payload });
      await loadAll();
    } catch (err) {
      setError(err.message || "Erro ao vincular membro");
      throw err;
    }
  }

  async function delMembro(uid) {
    try {
      await api(`/agendas/${agendaId}/membros/${uid}`, { method: "DELETE" });
      await loadAll();
    } catch (err) {
      setError(err.message || "Erro ao remover membro");
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
          ["agenda", "Agenda"],
          ["funcionamento", "Funcionamento"],
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

      {tab === "agenda" ? (
        <AgendaTab
          agendaNomeEdit={agendaNomeEdit}
          setAgendaNomeEdit={setAgendaNomeEdit}
          agendaAtivo={agendaAtivo}
          setAgendaAtivo={setAgendaAtivo}
          agendaSlug={agendaSlug}
          copiedLink={copiedLink}
          onCopy={copiarLinkAgenda}
          onSave={salvarAgenda}
          onRegenerate={regenerarSlug}
          regenerandoSlug={regenerandoSlug}
        />
      ) : null}

      {tab === "funcionamento" ? (
        <FuncionamentoTab
          DIAS={DIAS}
          disp={disp}
          exce={exce}
          dayLabel={dayLabel}
          onAddDisp={addDisp}
          onDeleteDisp={delDisp}
          onAddExc={addExc}
          onDeleteExc={delExc}
        />
      ) : null}

      {tab === "campos" ? <CamposTab campos={campos} onAdd={addCampo} onDelete={delCampo} /> : null}

      {tab === "membros" ? <MembrosTab membros={membros} onAdd={addMembro} onDelete={delMembro} /> : null}
    </AgendaLayout>
  );
}

