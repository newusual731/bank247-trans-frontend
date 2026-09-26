import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useActionFeedback } from "../../components/feedback/useActionFeedback";
import "../../components/teller/TellerForm.css";
import "./CashTxnPages.css";
import "./TransferPostingPages.css";

/** CURRENCY DRPDWN.png — keep Figma codes as shown */
const FX_CURRENCIES = ["USD", "NGR", "EUR", "GBR", "FRC", "RKSH", "CAD"] as const;

function OrangeForm({
  title,
  actionLabel,
  fields,
}: {
  title: string;
  actionLabel: string;
  fields: { label: string; placeholder: string; multiline?: boolean; type?: string }[];
}) {
  const navigate = useNavigate();
  const { showSuccess, feedbackUi } = useActionFeedback();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.label, f.placeholder.includes("89382") ? "89382" : ""])),
  );

  return (
    <div className="tf-page tpp">
      {feedbackUi}
      <div className="tf-panel">
        <button type="button" className="tf-x" aria-label="Close" onClick={() => navigate(-1)}>
          ×
        </button>
        <h1 className="tf-title">{title}</h1>
        {fields.map((f) => (
          <label key={f.label} className="tf-field">
            <span>{f.label}</span>
            {f.multiline ? (
              <textarea
                className="tf-textarea"
                placeholder={f.placeholder}
                value={values[f.label] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.label]: e.target.value }))}
              />
            ) : (
              <input
                className="tf-input"
                type={f.type ?? "text"}
                placeholder={f.placeholder}
                value={values[f.label] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.label]: e.target.value }))}
              />
            )}
          </label>
        ))}
        <div className="tf-actions tf-actions--full">
          <button
            type="button"
            className="tf-submit"
            onClick={() => showSuccess(`${title} ${actionLabel.toLowerCase()} successfully`)}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const TRANSFER_FIELDS = [
  { label: "Debit Account", placeholder: "89382" },
  { label: "Credit Account", placeholder: "89382" },
  { label: "Account", placeholder: "Enter ID" },
  { label: "Narration 1", placeholder: "Credit Narration", multiline: true },
  { label: "Narration 2", placeholder: "Credit Narration", multiline: true },
  { label: "Debit Value Date", placeholder: "Select", type: "date" },
  { label: "Credit Value Date", placeholder: "create value date", type: "date" },
];

export function TransferInternalPage() {
  return (
    <OrangeForm
      title="Transfer Between Internal Account"
      actionLabel="FLAG"
      fields={TRANSFER_FIELDS}
    />
  );
}

export function TransferCustomerInternalPage() {
  return (
    <OrangeForm
      title="Transfer Between Customer and Internal Account"
      actionLabel="Submit"
      fields={TRANSFER_FIELDS}
    />
  );
}

export function PostingBetweenNgnPage() {
  return (
    <OrangeForm title="Posting Between NGN Account" actionLabel="FLAG" fields={TRANSFER_FIELDS} />
  );
}

export function PostingBetweenNgnFcyPage() {
  return (
    <OrangeForm
      title="Posting Between NGN & FCY"
      actionLabel="FLAG"
      fields={[
        ...TRANSFER_FIELDS.slice(0, 3),
        { label: "Debit Currency", placeholder: "NGN" },
        { label: "Credit Currency", placeholder: "USD" },
        ...TRANSFER_FIELDS.slice(3),
      ]}
    />
  );
}

export function FtModulePage() {
  return (
    <div className="tpp-hub">
      <h1>FT Module</h1>
      <p>Funds transfer operations for teller and back-office processing.</p>
      <div className="tpp-cards">
        <Link to="/teller/ft/fixed" className="tpp-card">
          <strong>Fixed Transfer</strong>
          <em>Standing / fixed funds transfer setup</em>
          <span>›</span>
        </Link>
        <Link to="/teller/transfers/internal-account" className="tpp-card">
          <strong>Internal Account Transfer</strong>
          <em>Transfer between internal accounts</em>
          <span>›</span>
        </Link>
        <Link to="/teller/transfers/customer-internal" className="tpp-card">
          <strong>Customer ↔ Internal</strong>
          <em>Transfer between customer and internal</em>
          <span>›</span>
        </Link>
        <Link to="/teller/posting/ngn" className="tpp-card">
          <strong>Posting Between NGN</strong>
          <em>Same-currency posting</em>
          <span>›</span>
        </Link>
        <Link to="/teller/posting/ngn-fcy" className="tpp-card">
          <strong>Posting NGN &amp; FCY</strong>
          <em>Cross-currency posting</em>
          <span>›</span>
        </Link>
      </div>
    </div>
  );
}

export function FixedTransferPage() {
  return (
    <OrangeForm
      title="Fixed Transfer"
      actionLabel="Submit"
      fields={[
        { label: "Source Account", placeholder: "Enter Account" },
        { label: "Destination Account", placeholder: "Enter Account" },
        { label: "Amount", placeholder: "Enter Amount" },
        { label: "Frequency", placeholder: "Select" },
        { label: "Start Date", placeholder: "Select", type: "date" },
        { label: "End Date", placeholder: "Select", type: "date" },
        { label: "Narration", placeholder: "Enter Narration", multiline: true },
      ]}
    />
  );
}

function CurrencySelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <label className="tf-field fx-select">
      <span>{label}</span>
      <div className="fx-select-root" ref={rootRef}>
        <button
          type="button"
          className="tf-input fx-select-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((o) => !o)}
        >
          <span>{value || "Select"}</span>
          <span className="tf-chev" aria-hidden>
            ▾
          </span>
        </button>
        {open ? (
          <ul id={listId} className="fx-menu" role="listbox">
            {FX_CURRENCIES.map((code) => (
              <li key={code} role="option" aria-selected={code === value}>
                <button
                  type="button"
                  className={code === value ? "is-active" : undefined}
                  onClick={() => {
                    onChange(code);
                    setOpen(false);
                  }}
                >
                  {code}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </label>
  );
}

export function CurrencyExchangePage() {
  const navigate = useNavigate();
  const { showSuccess, feedbackUi } = useActionFeedback();
  const [from, setFrom] = useState("NGR");
  const [to, setTo] = useState("USD");
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const [narration, setNarration] = useState("");

  return (
    <div className="tf-page ctp fx-page">
      {feedbackUi}
      <div className="tf-panel ctp-panel">
        <button type="button" className="tf-x" aria-label="Close" onClick={() => navigate(-1)}>
          ×
        </button>
        <div className="tf-form-shell">
          <h1 className="tf-title">Currency Exchange</h1>
          <div className="tf-stack">
            <CurrencySelect label="From Currency" value={from} onChange={setFrom} />
            <CurrencySelect label="To Currency" value={to} onChange={setTo} />
            <label className="tf-field">
              <span>Enter the Amount</span>
              <input
                className="tf-input"
                placeholder="Enter Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <label className="tf-field">
              <span>Exchange Rate</span>
              <input
                className="tf-input"
                placeholder="Enter Rate"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </label>
            <label className="tf-field tf-field--narration">
              <span>Enter Narration</span>
              <textarea
                className="tf-textarea"
                placeholder="Enter Narration"
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
              />
            </label>
          </div>
          <div className="tf-actions">
            <button type="button" className="tf-close" onClick={() => navigate(-1)}>
              Close
            </button>
            <button type="button" className="tf-submit" onClick={() => showSuccess("Currency exchange previewed successfully")}>
              Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
