import { useState } from "react";
import Modal from "./Modal";
import s from "../../styles/pages.module.css";

export default function AgendaTab({
  agendaNomeEdit,
  setAgendaNomeEdit,
  agendaAtivo,
  setAgendaAtivo,
  agendaSlug,
  copiedLink,
  onCopy,
  onSave,
  onRegenerate,
  regenerandoSlug,
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleRegenerateConfirm() {
    await onRegenerate();
    setShowConfirm(false);
  }

  function handleRegenerate() {
    if (agendaSlug) {
      setShowConfirm(true);
      return;
    }
    onRegenerate();
  }

  return (
    <>
      <div className={s.card}>
        <form onSubmit={onSave} className={s.formStack}>
          <div>
            <label className={s.label}>Nome da agenda</label>
            <input
              className={s.input}
              value={agendaNomeEdit}
              onChange={(e) => setAgendaNomeEdit(e.target.value)}
              required
            />
          </div>
          <label className={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={agendaAtivo}
              onChange={(e) => setAgendaAtivo(e.target.checked)}
            />
            Agenda ativa
          </label>
          <div className={s.btnRow}>
            <button type="submit" className={s.btnPrimary}>
              Salvar agenda
            </button>
            <button type="button" className={s.btnGhost} onClick={onCopy} disabled={!agendaSlug}>
              {copiedLink ? "Link copiado" : "Copiar link da agenda"}
            </button>
            <button type="button" className={s.btnGhost} onClick={handleRegenerate}>
              Gerar novo slug hash
            </button>
          </div>
        </form>
      </div>

      {showConfirm ? (
        <Modal
          title="Confirmar alteracao de URL"
          onClose={() => setShowConfirm(false)}
          actions={
            <>
              <button type="button" className={s.btnGhost} onClick={() => setShowConfirm(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className={`${s.btnPrimary} ${s.modalDanger}`}
                onClick={handleRegenerateConfirm}
                disabled={regenerandoSlug}
              >
                {regenerandoSlug ? "Gerando..." : "Sim, gerar novo slug"}
              </button>
            </>
          }
        >
          Esta agenda ja possui slug. Ao gerar outro hash, a URL publica muda e links antigos podem parar de funcionar.
        </Modal>
      ) : null}
    </>
  );
}

