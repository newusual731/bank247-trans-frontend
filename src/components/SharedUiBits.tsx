import { useEffect, useRef, useState, type ReactNode } from "react";
import "./SharedUiBits.css";

export function ExportMenu({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="export-menu" ref={ref}>
      <button type="button" className="export-menu-trigger" onClick={() => setOpen((v) => !v)}>
        {children ?? (
          <>
            <ExportIcon /> Export
          </>
        )}
      </button>
      {open ? (
        <div className="export-menu-panel" role="menu">
          <button type="button" role="menuitem" onClick={() => setOpen(false)}>
            AS PDF
          </button>
          <button type="button" role="menuitem" onClick={() => setOpen(false)}>
            AS EXCEL
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function AuditTooltip({
  createdBy = "Kemi Adeosun",
  createdDate = "07/02/2025",
}: {
  createdBy?: string;
  createdDate?: string;
}) {
  return (
    <div className="audit-tip" role="tooltip">
      <div>Created By : {createdBy}</div>
      <div>Created Date : {createdDate}</div>
    </div>
  );
}

export function SuccessModal({
  title = "Entry Submitted successfully created!",
  onClose,
}: {
  title?: string;
  onClose: () => void;
}) {
  return (
    <div className="fb-backdrop" role="presentation" onClick={onClose}>
      <div className="fb-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="fb-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="fb-check" aria-hidden>
          ✓
        </div>
        <p className="fb-msg">{title}</p>
        <button type="button" className="fb-ok" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}

/** Figma "Generation Successful" — keep typo "Successfull" to match design. */
export function GenerationSuccessModal({
  title = "Successfull",
  message = "Account parameter setup successfully",
  onClose,
}: {
  title?: string;
  message?: string;
  onClose: () => void;
}) {
  return (
    <div className="fb-backdrop" role="presentation" onClick={onClose}>
      <div className="fb-gen" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="fb-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="fb-gen-check" aria-hidden>
          ✓
        </div>
        <h2>{title}</h2>
        <p>{message}</p>
        <hr />
        <button type="button" className="fb-gen-ok" onClick={onClose}>
          Okay
        </button>
      </div>
    </div>
  );
}

export function SuccessToast({
  title = "Success",
  message = "New customer created successfully",
  onClose,
}: {
  title?: string;
  message?: string;
  onClose: () => void;
}) {
  return (
    <div className="fb-toast" role="status">
      <span className="fb-toast-bar" aria-hidden />
      <span className="fb-toast-icon" aria-hidden>
        ✓
      </span>
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
      <button type="button" className="fb-toast-x" onClick={onClose} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}

/** CANCEL.png — confirm abandon with Cancel / Confirm. */
export function CancelConfirmModal({
  title = "Confirm Cancel?",
  message = "If you cancel now, your progress will be deleted, and you will have to start over.",
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  onCancel,
  onConfirm,
}: {
  title?: string;
  message?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fb-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="fb-cancel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fb-cancel-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="fb-close" onClick={onCancel} aria-label="Close">
          ×
        </button>
        <div className="fb-cancel-icon" aria-hidden>
          ?
        </div>
        <h2 id="fb-cancel-title">{title}</h2>
        <p>{message}</p>
        <div className="fb-cancel-actions">
          <button type="button" className="fb-cancel-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="fb-cancel-primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Warning / alert dialog (yellow triangle + OK). */
export function AlertModal({
  title = "Alert",
  message = "Debit and Credit must match before posting",
  okLabel = "OK",
  onClose,
}: {
  title?: string;
  message?: string;
  okLabel?: string;
  onClose: () => void;
}) {
  return (
    <div className="fb-backdrop" role="presentation" onClick={onClose}>
      <div
        className="fb-alert"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fb-alert-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="fb-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="fb-alert-icon" aria-hidden>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3.5L22 20H2L12 3.5Z"
              fill="#FACC15"
              stroke="#EAB308"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <path d="M12 10v4.5" stroke="#92400E" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="17.2" r="1" fill="#92400E" />
          </svg>
        </div>
        <h2 id="fb-alert-title">{title}</h2>
        <p>{message}</p>
        <button type="button" className="fb-alert-ok" onClick={onClose}>
          {okLabel}
        </button>
      </div>
    </div>
  );
}

function ExportIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 16V4M12 4l-4 4M12 4l4 4M5 20h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
