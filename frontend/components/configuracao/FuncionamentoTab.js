import { useMemo, useState } from "react";
import Modal from "./Modal";
import s from "../../styles/pages.module.css";

function toSqlTime(v) {
  if (!v) return "00:00:00";
  return v.length === 5 ? `${v}:00` : v;
}

export default function FuncionamentoTab({
  DIAS,
  disp,
  exce,
  dayLabel,
  onAddDisp,
  onDeleteDisp,
  onAddExc,
  onDeleteExc,
}) {
  const [openDisp, setOpenDisp] = useState(false);
  const [openExc, setOpenExc] = useState(false);

  const [diaBase, setDiaBase] = useState("1");
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFim, setHoraFim] = useState("18:00");
  const [diasExtras, setDiasExtras] = useState([]);

  const [dataExcecao, setDataExcecao] = useState("");
  const [fechadoDia, setFechadoDia] = useState(true);
  const [excInicio, setExcInicio] = useState("");
  const [excFim, setExcFim] = useState("");

  const grouped = useMemo(
    () => DIAS.map((d) => ({ ...d, windows: disp.filter((r) => r.dia_semana === d.v) })),
    [DIAS, disp]
  );

  async function saveDisp() {
    await onAddDisp({
      dia_semana: Number(diaBase),
      hora_inicio: toSqlTime(horaInicio),
      hora_fim: toSqlTime(horaFim),
      dias_extras: diasExtras,
    });
    setDiasExtras([]);
    setOpenDisp(false);
  }

  async function saveExc() {
    await onAddExc({
      data_excecao: dataExcecao,
      fechado_o_dia: fechadoDia ? 1 : 0,
      hora_inicio: !fechadoDia && excInicio ? toSqlTime(excInicio) : null,
      hora_fim: !fechadoDia && excFim ? toSqlTime(excFim) : null,
    });
    setDataExcecao("");
    setFechadoDia(true);
    setExcInicio("");
    setExcFim("");
    setOpenExc(false);
  }

  return (
    <>
      <div className={s.card}>
        <div className={s.rowBetween} style={{ alignItems: "center" }}>
          <strong>Horarios semanais</strong>
          <button type="button" className={s.btnPrimary} onClick={() => setOpenDisp(true)}>
            Adicionar horario
          </button>
        </div>
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
                {r.hora_inicio?.slice(0, 5)} - {r.hora_fim?.slice(0, 5)}
              </span>
              <button type="button" className={s.btnGhost} onClick={() => onDeleteDisp(r.id)}>
                Excluir
              </button>
            </div>
          ))}
        </div>
      ))}

      <div className={s.card}>
        <div className={s.rowBetween} style={{ alignItems: "center" }}>
          <strong>Excecoes de calendario</strong>
          <button type="button" className={s.btnPrimary} onClick={() => setOpenExc(true)}>
            Nova excecao
          </button>
        </div>
      </div>

      {exce.map((r) => (
        <div key={r.id} className={s.card}>
          <div className={s.rowBetween}>
            <span className={s.muted}>
              {r.data_excecao?.slice(0, 10)} ({dayLabel(new Date(`${r.data_excecao}T00:00:00`).getDay())}) - {r.fechado_o_dia ? "fechado" : `${r.hora_inicio}-${r.hora_fim}`}
            </span>
            <button type="button" className={s.btnGhost} onClick={() => onDeleteExc(r.id)}>
              Excluir
            </button>
          </div>
        </div>
      ))}

      {openDisp ? (
        <Modal
          title="Adicionar horario semanal"
          onClose={() => setOpenDisp(false)}
          actions={
            <>
              <button type="button" className={s.btnGhost} onClick={() => setOpenDisp(false)}>
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
              <label className={s.label}>Dia base</label>
              <select className={s.select} value={diaBase} onChange={(e) => setDiaBase(e.target.value)}>
                {DIAS.map((d) => (
                  <option key={d.v} value={d.v}>
                    {d.l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={s.label}>Inicio</label>
              <input className={s.input} type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
            </div>
            <div>
              <label className={s.label}>Fim</label>
              <input className={s.input} type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} />
            </div>
            <div>
              <label className={s.label}>Aplicar tambem em</label>
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
          </div>
        </Modal>
      ) : null}

      {openExc ? (
        <Modal
          title="Nova excecao"
          onClose={() => setOpenExc(false)}
          actions={
            <>
              <button type="button" className={s.btnGhost} onClick={() => setOpenExc(false)}>
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
                  <label className={s.label}>Inicio</label>
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

