import "./ViewDetailsModal.css";

export type ViewField = {
  label: string;
  value: string;
  /** When true, show a small calendar icon before the value (dates). */
  date?: boolean;
};

export type ViewDetailsModalProps = {
  title: string;
  fields: ViewField[];
  okayLabel?: string;
  onClose: () => void;
};

/** Figma Product Setup VIEW MODAL — read-only key/value detail dialog */
export function ViewDetailsModal({
  title,
  fields,
  okayLabel = "Ok",
  onClose,
}: ViewDetailsModalProps) {
  return (
    <div className="vdm-backdrop" role="presentation" onClick={onClose}>
      <div
        className="vdm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vdm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="vdm-head">
          <h2 id="vdm-title">{title}</h2>
          <button type="button" className="vdm-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>
        <dl className="vdm-list">
          {fields.map((f) => (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd>
                {f.date ? <CalendarIcon /> : null}
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
        <footer className="vdm-foot">
          <button type="button" className="vdm-ok" onClick={onClose}>
            {okayLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="#6b7280" strokeWidth="1.6" />
      <path d="M3 9h18M8 3v4M16 3v4" stroke="#6b7280" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
