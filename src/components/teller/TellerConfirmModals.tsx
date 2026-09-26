import "./TellerConfirmModals.css";

/** Disable User.png family — till/deposit confirms (not IAM). */
export function ClosingTillConfirm({
  title = "Closing Till ?",
  message = '"Do you want to close your Till"',
  onYes,
  onNo,
}: {
  title?: string;
  message?: string;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <TellerConfirmModal
      title={title}
      message={message}
      yesLabel="YES"
      noLabel="NO"
      onYes={onYes}
      onNo={onNo}
      dangerNo
    />
  );
}

export function TellerConfirmModal({
  title,
  message,
  yesLabel = "YES",
  noLabel = "NO",
  onYes,
  onNo,
  dangerNo = true,
}: {
  title: string;
  message: string;
  yesLabel?: string;
  noLabel?: string;
  onYes: () => void;
  onNo: () => void;
  dangerNo?: boolean;
}) {
  return (
    <div className="tcm-backdrop" role="presentation" onClick={onNo}>
      <div className="tcm" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tcm-x" onClick={onNo} aria-label="Close">
          ×
        </button>
        <div className="tcm-icon" aria-hidden>
          !
        </div>
        <h2>{title}</h2>
        <p>{message}</p>
        <hr />
        <div className="tcm-actions">
          <button type="button" className="tcm-yes" onClick={onYes}>
            {yesLabel}
          </button>
          <button type="button" className={dangerNo ? "tcm-no" : "tcm-yes"} onClick={onNo}>
            {noLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DepositConfirmModal({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  return (
    <TellerConfirmModal
      title="Confirm Deposit ?"
      message='"Do you want to post this cash deposit"'
      onYes={onYes}
      onNo={onNo}
    />
  );
}

export function SuspendTillConfirm({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  return (
    <TellerConfirmModal
      title="Suspend Till ?"
      message='"Do you want to suspend this Till"'
      onYes={onYes}
      onNo={onNo}
    />
  );
}
