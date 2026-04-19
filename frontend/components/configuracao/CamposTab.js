import { useState } from "react";
import Modal from "./Modal";
import s from "../../styles/pages.module.css";

const TIPOS = ["texto", "texto_longo", "telefone", "email", "numero", "selecao"];

export default function CamposTab({ campos, onAdd, onDelete }) {
  const [open, setOpen] = useState(false);
  const [chave, setChave] = useState("");
  const [rotulo, setRotulo] = useState("");
  const [tipo, setTipo] = useState("texto");

  async function handleSave() {
    await onAdd({ chave_campo: chave, rotulo, tipo_campo: tipo });
    setChave("");
    setRotulo("");
    setTipo("texto");
    setOpen(false);
  }

  return (
    <>
      <div className={s.card}>
        <div className={s.rowBetween} style={{ alignItems: "center" }}>
          <strong>Campos de coleta</strong>
          <button type="button" className={s.btnPrimary} onClick={() => setOpen(true)}>
            Adicionar campo
          </button>
        </div>
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
            <button type="button" className={s.btnGhost} onClick={() => onDelete(r.id)}>
              Excluir
            </button>
          </div>
        </div>
      ))}

      {open ? (
        <Modal
          title="Novo campo"
          onClose={() => setOpen(false)}
          actions={
            <>
              <button type="button" className={s.btnGhost} onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button type="button" className={s.btnPrimary} onClick={handleSave}>
                Salvar
              </button>
            </>
          }
        >
          <div className={s.formStack}>
            <div>
              <label className={s.label}>Chave</label>
              <input className={s.input} value={chave} onChange={(e) => setChave(e.target.value)} required />
            </div>
            <div>
              <label className={s.label}>Rotulo</label>
              <input className={s.input} value={rotulo} onChange={(e) => setRotulo(e.target.value)} required />
            </div>
            <div>
              <label className={s.label}>Tipo</label>
              <select className={s.select} value={tipo} onChange={(e) => setTipo(e.target.value)}>
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

