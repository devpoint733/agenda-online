import s from "../../styles/pages.module.css";

export default function Modal({ title, children, onClose, actions }) {
  return (
    <div className={s.modalBackdrop} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={s.modalCard} onClick={(e) => e.stopPropagation()}>
        <h2 className={s.modalTitle}>{title}</h2>
        <div className={s.modalBody}>{children}</div>
        <div className={s.modalActions}>{actions}</div>
      </div>
    </div>
  );
}

