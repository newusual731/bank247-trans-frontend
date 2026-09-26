import "./AppAlert.css";

export type AppAlertTone = "success" | "error" | "warning";

export type AppAlertProps = {
  tone?: AppAlertTone;
  title: string;
  message: string;
  onClose: () => void;
};

/** Figma Alert.png / Alert-1.png — toast banner */
export function AppAlert({ tone = "success", title, message, onClose }: AppAlertProps) {
  return (
    <div className={`app-alert is-${tone}`} role="status">
      <span className="app-alert-accent" aria-hidden />
      <span className="app-alert-icon" aria-hidden>
        {tone === "success" ? <CheckIcon /> : tone === "error" ? <ErrorIcon /> : <WarnIcon />}
      </span>
      <div className="app-alert-copy">
        <strong>{title}</strong>
        <span>{message}</span>
      </div>
      <span className="app-alert-divider" aria-hidden />
      <button type="button" className="app-alert-close" aria-label="Dismiss" onClick={onClose}>
        ×
      </button>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="currentColor" />
      <path d="M8 12.2l2.6 2.6L16.2 9" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="currentColor" />
      <path d="M9 9l6 6M15 9l-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3.5L21 20H3L12 3.5z" fill="currentColor" />
      <path d="M12 10v4.5M12 17.5h.01" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
