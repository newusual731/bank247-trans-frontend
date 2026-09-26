import "./ConfirmActionModal.css";

export type ConfirmActionModalProps = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" = red primary (NO / Cancel style); "primary" = blue confirm */
  tone?: "danger" | "primary" | "warning";
  onConfirm: () => void;
  onClose: () => void;
};

/** Figma Disable User / confirm dialogs — warning icon + YES/NO style actions */
export function ConfirmActionModal({
  title,
  message,
  confirmLabel = "YES",
  cancelLabel = "NO",
  tone = "warning",
  onConfirm,
  onClose,
}: ConfirmActionModalProps) {
  return (
    <div className="cam-backdrop" role="presentation" onClick={onClose}>
      <div
        className="cam-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cam-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="cam-close" aria-label="Close" onClick={onClose}>
          ×
        </button>
        <div className={`cam-icon cam-icon--${tone}`} aria-hidden>
          <span>!</span>
        </div>
        <h2 id="cam-title">{title}</h2>
        <p>{message}</p>
        <div className="cam-rule" aria-hidden />
        <div className="cam-actions">
          <button type="button" className="cam-yes" onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button type="button" className="cam-no" onClick={onClose}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
