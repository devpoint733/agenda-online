import { useState } from "react";
import Modal from "./Modal";
import s from "../../styles/pages.module.css";

export default function MembrosTab({ membros, onAdd, onDelete }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState("colaborador");

  async function handleSave() {
    await onAdd({ email, papel });
    setEmail("");
    setPapel("colaborador");
    setOpen(false);
  }

  return (
    <>
      <div className={s.card}>
        <div className={s.rowBetween} style={{ alignItems: "center" }}>
          <p className={s.muted} style={{ margin: 0 }}>
            Apenas o proprietario pode convidar por e-mail.
          </p>
          <button type="button" className={s.btnPrimary} onClick={() => setOpen(true)}>
            Vincular membro
          </button>
        </div>
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
            <button type="button" className={s.btnGhost} onClick={() => onDelete(r.usuario_id)}>
              Remover
            </button>
          </div>
        </div>
      ))}

      {open ? (
        <Modal
          title="Vincular membro"
          onClose={() => setOpen(false)}
          actions={
            <>
              <button type="button" className={s.btnGhost} onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button type="button" className={s.btnPrimary} onClick={handleSave}>
                Vincular
              </button>
            </>
          }
        >
          <div className={s.formStack}>
            <div>
              <label className={s.label}>E-mail do usuario</label>
              <input className={s.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className={s.label}>Papel</label>
              <select className={s.select} value={papel} onChange={(e) => setPapel(e.target.value)}>
                <option value="colaborador">Colaborador</option>
                <option value="proprietario">Proprietario</option>
              </select>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

