import { useMemo, useState } from "react";
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

export default function FuncionamentoTab({ DIAS, disp, onAddDisp, onUpdateDisp, onDeleteDisp }) {
  const [openDisp, setOpenDisp] = useState(false);
  const [editingDispId, setEditingDispId] = useState(null);

  const [diaBase, setDiaBase] = useState("1");
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFim, setHoraFim] = useState("18:00");
  const [diasExtras, setDiasExtras] = useState([]);

  const grouped = useMemo(
    () => DIAS.map((d) => ({ ...d, windows: disp.filter((r) => r.dia_semana === d.v) })),
    [DIAS, disp]
  );

  function closeDispModal() {
    setOpenDisp(false);
    setEditingDispId(null);
    setDiasExtras([]);
  }

  function openAddDisp() {
    setEditingDispId(null);
    setDiaBase("1");
    setHoraInicio("09:00");
    setHoraFim("18:00");
    setDiasExtras([]);
    setOpenDisp(true);
  }

  function openEditDisp(r) {
    setEditingDispId(r.id);
    setDiaBase(String(r.dia_semana));
    setHoraInicio(toInputTime(r.hora_inicio));
    setHoraFim(toInputTime(r.hora_fim));
    setDiasExtras([]);
    setOpenDisp(true);
  }

  async function saveDisp() {
    const base = {
      dia_semana: Number(diaBase),
      hora_inicio: toSqlTime(horaInicio),
      hora_fim: toSqlTime(horaFim),
    };
    if (editingDispId != null) {
      await onUpdateDisp(editingDispId, base);
    } else {
      await onAddDisp({ ...base, dias_extras: diasExtras });
    }
    setDiasExtras([]);
    closeDispModal();
  }

  return (
    <>
      <div className={s.card}>
        <div className={s.rowBetween} style={{ alignItems: "center" }}>
          <strong>Horários semanais</strong>
          <button type="button" className={s.btnPrimary} onClick={openAddDisp}>
            Adicionar horário
          </button>
        </div>
        <p className={s.muted} style={{ margin: "10px 0 0", fontSize: "0.875rem" }}>
          Defina as janelas de atendimento por dia da semana. Exceções (feriados, folgas) ficam na aba{" "}
          <strong>Exceções</strong>.
        </p>
      </div>

      {grouped.map((d) => (
        <div key={d.v} className={s.card}>
          <div className={s.rowBetween} style={{ alignItems: "center", marginBottom: d.windows.length ? 10 : 0 }}>
            <strong>{d.l}</strong>
            <span className={s.muted}>{d.windows.length ? `${d.windows.length} janela(s)` : "Fechado"}</span>
          </div>
          {d.windows.map((r) => (
            <div key={r.id} className={s.rowBetween} style={{ marginTop: 8, alignItems: "center" }}>
              <span className={s.muted}>
                {r.hora_inicio?.slice(0, 5)} – {r.hora_fim?.slice(0, 5)}
              </span>
              <div className={s.btnRow}>
                <button
                  type="button"
                  className={s.iconBtn}
                  title="Editar horário"
                  aria-label="Editar horário"
                  onClick={() => openEditDisp(r)}
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  className={s.iconBtn}
                  title="Excluir horário"
                  aria-label="Excluir horário"
                  onClick={() => onDeleteDisp(r.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}

      {openDisp ? (
        <Modal
          title={editingDispId != null ? "Editar horário semanal" : "Adicionar horário semanal"}
          onClose={closeDispModal}
          actions={
            <>
              <button type="button" className={s.btnGhost} onClick={closeDispModal}>
                Cancelar
              </button>
              <button type="button" className={s.btnPrimary} onClick={saveDisp}>
                Salvar
              </button>
            </>
          }
        >
          <div className={s.formStack}>
            <div>
              <label className={s.label}>Dia</label>
              <select className={s.select} value={diaBase} onChange={(e) => setDiaBase(e.target.value)}>
                {DIAS.map((d) => (
                  <option key={d.v} value={d.v}>
                    {d.l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={s.label}>Início</label>
              <input className={s.input} type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
            </div>
            <div>
              <label className={s.label}>Fim</label>
              <input className={s.input} type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} />
            </div>
            {editingDispId == null ? (
              <div>
                <label className={s.label}>Aplicar também em</label>
                <div className={s.dayChips}>
                  {DIAS.filter((d) => d.v !== Number(diaBase)).map((d) => {
                    const active = diasExtras.includes(d.v);
                    return (
                      <button
                        key={d.v}
                        type="button"
                        className={`${s.dayChip} ${active ? s.dayChipActive : ""}`}
                        onClick={() =>
                          setDiasExtras((curr) =>
                            curr.includes(d.v) ? curr.filter((x) => x !== d.v) : [...curr, d.v]
                          )
                        }
                      >
                        {d.l}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </Modal>
      ) : null}
    </>
  );
}
