import "./ViewLedgerDrawer.css";

export type LedgerContext = {
  title?: string;
  glCode: string;
  glName?: string;
  currency?: string;
  branch?: string;
  from?: string;
  to?: string;
};

type Line = {
  date: string;
  ref: string;
  narr: string;
  dr: string;
  cr: string;
};

const SAMPLE_LINES: Line[] = [
  { date: "15-Jun-2025", ref: "TXN-88421", narr: "Opening balance", dr: "₦500,000.00", cr: "—" },
  { date: "16-Jun-2025", ref: "TXN-88455", narr: "Interest accrual", dr: "—", cr: "₦12,500.00" },
  { date: "18-Jun-2025", ref: "TXN-88501", narr: "Customer credit", dr: "₦50,000.00", cr: "—" },
  { date: "20-Jun-2025", ref: "TXN-88544", narr: "Reversal / adjustment", dr: "—", cr: "₦5,000.00" },
];

/** Shared View Ledger drawer — Accounts / Trial Balance / Journal Report */
export function ViewLedgerDrawer({
  context,
  onClose,
}: {
  context: LedgerContext;
  onClose: () => void;
}) {
  const subtitle = [context.glCode, context.glName].filter(Boolean).join(" · ");
  const period =
    context.from || context.to
      ? `${context.from ?? "—"} → ${context.to ?? "—"}`
      : "Current period";

  return (
    <div className="vld-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="vld-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vld-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="vld-head">
          <div>
            <h2 id="vld-title">{context.title ?? "View Ledger"}</h2>
            <p>{subtitle || "General ledger detail"}</p>
          </div>
          <button type="button" className="vld-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>

        <dl className="vld-meta">
          <div>
            <dt>GL Code</dt>
            <dd>{context.glCode}</dd>
          </div>
          {context.glName ? (
            <div>
              <dt>GL Name</dt>
              <dd>{context.glName}</dd>
            </div>
          ) : null}
          <div>
            <dt>Period</dt>
            <dd>{period}</dd>
          </div>
          {context.currency ? (
            <div>
              <dt>Currency</dt>
              <dd>{context.currency}</dd>
            </div>
          ) : null}
          {context.branch ? (
            <div>
              <dt>Branch</dt>
              <dd>{context.branch}</dd>
            </div>
          ) : null}
        </dl>

        <div className="vld-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Narration</th>
                <th>Debit</th>
                <th>Credit</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_LINES.map((l) => (
                <tr key={l.ref}>
                  <td>{l.date}</td>
                  <td>{l.ref}</td>
                  <td>{l.narr}</td>
                  <td>{l.dr}</td>
                  <td>{l.cr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="vld-foot">
          <button type="button" className="vld-ghost" onClick={onClose}>
            Close
          </button>
          <button type="button" className="vld-primary" onClick={() => window.print()}>
            Print Ledger
          </button>
        </footer>
      </aside>
    </div>
  );
}
