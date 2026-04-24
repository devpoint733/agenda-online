import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import Modal from "./Modal";
import s from "../../styles/pages.module.css";

function toSqlTime(v) {
  if (!v) return "00:00:00";
  return v.length === 5 ? `${v}:00` : v;
}

function toInputTime(v) {
  if (v == null || v === "") return "";
  const str = String(v);
  return str.length >= 5 ? str.slice(0, 5) : str;
}

export default function ExcecoesTab({ exce, dayLabel, onAddExc, onUpdateExc, onDeleteExc }) {
  const [openExc, setOpenExc] = useState(false);
  const [editingExcId, setEditingExcId] = useState(null);

  const [dataExcecao, setDataExcecao] = useState("");
  const [fechadoDia, setFechadoDia] = useState(true);
  const [excInicio, setExcInicio] = useState("");
  const [excFim, setExcFim] = useState("");

  function closeExcModal() {
    setOpenExc(false);
    setEditingExcId(null);
    setDataExcecao("");
    setFechadoDia(true);
    setExcInicio("");
    setExcFim("");
  }

  function openAddExc() {
    setEditingExcId(null);
    setDataExcecao("");
    setFechadoDia(true);
    setExcInicio("");
    setExcFim("");
    setOpenExc(true);
  }

  function openEditExc(r) {
    setEditingExcId(r.id);
    setDataExcecao(r.data_excecao?.slice(0, 10) || "");
    setFechadoDia(Boolean(Number(r.fechado_o_dia)));
    setExcInicio(toInputTime(r.hora_inicio));
    setExcFim(toInputTime(r.hora_fim));
    setOpenExc(true);
  }

  async function saveExc() {
    const payload = {
      data_excecao: dataExcecao,
      fechado_o_dia: fechadoDia ? 1 : 0,
      hora_inicio: !fechadoDia && excInicio ? toSqlTime(excInicio) : null,
      hora_fim: !fechadoDia && excFim ? toSqlTime(excFim) : null,
    };
    if (editingExcId != null) {
      await onUpdateExc(editingExcId, payload);
    } else {
      await onAddExc(payload);
    }
    closeExcModal();
  }

  return (
    <>
      <div className={s.card}>
        <div className={s.rowBetween} style={{ alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <strong>Exceções de calendário</strong>
            <p className={s.muted} style={{ margin: "8px 0 0", fontSize: "0.875rem" }}>
              Feriados, folgas ou horário especial em datas específicas (substituem o horário semanal só naquele dia).
            </p>
          </div>
          <button type="button" className={s.btnPrimary} onClick={openAddExc} style={{ flexShrink: 0 }}>
            Nova exceção
          </button>
        </div>
      </div>

      {exce.length === 0 ? (
        <p className={s.muted}>Nenhuma exceção cadastrada.</p>
      ) : (
        exce.map((r) => (
          <div key={r.id} className={s.card}>
            <div className={s.rowBetween} style={{ alignItems: "center" }}>
              <span className={s.muted}>
                {r.data_excecao?.slice(0, 10)} ({dayLabel(new Date(`${r.data_excecao}T00:00:00`).getDay())}) —{" "}
                {r.fechado_o_dia
                  ? "fechado o dia inteiro"
                  : `${toInputTime(r.hora_inicio)} – ${toInputTime(r.hora_fim)}`}
              </span>
              <div className={s.btnRow}>
                <button
                  type="button"
                  className={s.iconBtn}
                  title="Editar exceção"
                  aria-label="Editar exceção"
                  onClick={() => openEditExc(r)}
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  className={s.iconBtn}
                  title="Excluir exceção"
                  aria-label="Excluir exceção"
                  onClick={() => onDeleteExc(r.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      {openExc ? (
        <Modal
          title={editingExcId != null ? "Editar exceção" : "Nova exceção"}
          onClose={closeExcModal}
          actions={
            <>
              <button type="button" className={s.btnGhost} onClick={closeExcModal}>
                Cancelar
              </button>
              <button type="button" className={s.btnPrimary} onClick={saveExc}>
                Salvar
              </button>
            </>
          }
        >
          <div className={s.formStack}>
            <div>
              <label className={s.label}>Data</label>
              <input className={s.input} type="date" value={dataExcecao} onChange={(e) => setDataExcecao(e.target.value)} />
            </div>
            <label className={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={fechadoDia} onChange={(e) => setFechadoDia(e.target.checked)} />
              Dia fechado inteiro
            </label>
            {!fechadoDia ? (
              <>
                <div>
                  <label className={s.label}>Início</label>
                  <input className={s.input} type="time" value={excInicio} onChange={(e) => setExcInicio(e.target.value)} />
                </div>
                <div>
                  <label className={s.label}>Fim</label>
                  <input className={s.input} type="time" value={excFim} onChange={(e) => setExcFim(e.target.value)} />
                </div>
              </>
            ) : null}
          </div>
        </Modal>
      ) : null}
    </>
  );
}
