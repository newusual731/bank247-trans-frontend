import "./SuccessModal.css";

export type SuccessModalProps = {
  title?: string;
  message: string;
  okayLabel?: string;
  onOkay: () => void;
  onClose?: () => void;
};

/** Figma Generation Successful*.png — centered success dialog */
export function SuccessModal({
  title = "Successfull",
  message,
  okayLabel = "Okay",
  onOkay,
  onClose,
}: SuccessModalProps) {
  const dismiss = onClose ?? onOkay;

  return (
    <div className="succ-backdrop" role="presentation" onClick={dismiss}>
      <div
        className="succ-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="succ-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="succ-close" aria-label="Close" onClick={dismiss}>
          ×
        </button>
        <div className="succ-icon" aria-hidden>
          <span>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M7.5 12.5l3 3 6-6.5"
                stroke="#fff"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
        <h2 id="succ-title">{title}</h2>
        <p>{message}</p>
        <div className="succ-rule" aria-hidden />
        <button type="button" className="succ-okay" onClick={onOkay}>
          {okayLabel}
        </button>
      </div>
    </div>
  );
}
