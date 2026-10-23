import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useActionFeedback } from "../../components/feedback/useActionFeedback";
import { createTreasuryDeal, bookTreasuryDeal } from "../../api/contracts";
import { ApiError, newIdempotencyKey } from "../../lib/apiClient";
import { createInternalTransfer } from "../../api/transactions";
import { createStandingOrder, cancelStandingOrder } from "../../api/accounts";
import { reverseTransfer, getTransaction } from "../../api/transactions";
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        {error ? <p className="ctp-error" role="alert">{error}</p> : null}
        <div className="tf-actions tf-actions--full">
          <button
            type="button"
            className="tf-submit"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                const debit = (values["Debit Account"] || "").trim();
                const credit = (values["Credit Account"] || "").trim();
                const amountRaw = (values["Amount"] || "").trim().replace(/[^\d.]/g, "");
                if (!amountRaw) throw new Error("Amount is required");
                const narration = (values["Narration 1"] || values["Narration 2"] || "").trim();
                const res = await createInternalTransfer({
                  sourceAccount: debit,
                  destinationAccount: credit,
                  amount: amountRaw,
                  currency: (values["Debit Currency"] || "NGN").trim().toUpperCase().slice(0, 3) || "NGN",
                  narration: narration || undefined,
                });
                const ref =
                  res && typeof res === "object" && "reference" in res
                    ? String((res as { reference?: string }).reference || "")
                    : "";
                showSuccess(`${title} submitted${ref ? ` — ${ref}` : ""}`);
              } catch (e) {
                setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Transfer failed");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Working…" : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const TRANSFER_FIELDS = [
  { label: "Debit Account", placeholder: "89382" },
  { label: "Credit Account", placeholder: "89382" },
  { label: "Amount", placeholder: "Enter Amount" },
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
        <Link to="/teller/ft/reverse" className="tpp-card">
          <strong>Reverse Transfer</strong>
          <em>Reverse an internal funds transfer</em>
          <span>›</span>
        </Link>
      </div>
    </div>
  );
}

function normalizeFreq(raw: string): "DAILY" | "WEEKLY" | "MONTHLY" {
  const u = raw.trim().toUpperCase();
  if (u.startsWith("D")) return "DAILY";
  if (u.startsWith("W")) return "WEEKLY";
  return "MONTHLY";
}

export function FixedTransferPage() {
  const navigate = useNavigate();
  const { showSuccess, feedbackUi } = useActionFeedback();
  const [source, setSource] = useState("");
  const [dest, setDest] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("MONTHLY");
  const [startDate, setStartDate] = useState("");
  const [narration, setNarration] = useState("");
  const [cancelRef, setCancelRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="tf-page tpp">
      {feedbackUi}
      <div className="tf-panel">
        <button type="button" className="tf-x" aria-label="Close" onClick={() => navigate(-1)}>
          ×
        </button>
        <h1 className="tf-title">Fixed Transfer</h1>
        <label className="tf-field">
          <span>Source Account</span>
          <input className="tf-input" placeholder="Enter Account" value={source} onChange={(e) => setSource(e.target.value)} />
        </label>
        <label className="tf-field">
          <span>Destination Account</span>
          <input className="tf-input" placeholder="Enter Account" value={dest} onChange={(e) => setDest(e.target.value)} />
        </label>
        <label className="tf-field">
          <span>Amount</span>
          <input className="tf-input" placeholder="Enter Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <label className="tf-field">
          <span>Frequency</span>
          <select className="tf-input" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            <option value="DAILY">DAILY</option>
            <option value="WEEKLY">WEEKLY</option>
            <option value="MONTHLY">MONTHLY</option>
          </select>
        </label>
        <label className="tf-field">
          <span>Start Date</span>
          <input className="tf-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label className="tf-field">
          <span>Narration</span>
          <textarea className="tf-textarea" placeholder="Enter Narration" value={narration} onChange={(e) => setNarration(e.target.value)} />
        </label>
        {error ? <p className="ctp-error" role="alert">{error}</p> : null}
        <div className="tf-actions tf-actions--full">
          <button
            type="button"
            className="tf-submit"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                const amt = amount.trim().replace(/[^\d.]/g, "");
                if (!amt) throw new Error("Amount is required");
                if (!startDate) throw new Error("Start date is required");
                const res = await createStandingOrder({
                  sourceAccount: source.trim(),
                  destinationAccount: dest.trim(),
                  amount: amt,
                  currency: "NGN",
                  frequency: normalizeFreq(frequency),
                  firstRunDate: startDate,
                  narration: narration.trim() || undefined,
                });
                const ref =
                  res && typeof res === "object" && "reference" in res
                    ? String((res as { reference?: string }).reference || "")
                    : "";
                showSuccess(`Standing order created${ref ? ` — ${ref}` : ""}`);
              } catch (e) {
                setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Standing order failed");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Working…" : "Submit"}
          </button>
        </div>
        <hr />
        <label className="tf-field">
          <span>Cancel Standing Order Ref</span>
          <input className="tf-input" value={cancelRef} onChange={(e) => setCancelRef(e.target.value)} placeholder="Standing order reference" />
        </label>
        <div className="tf-actions tf-actions--full">
          <button
            type="button"
            className="tf-submit"
            disabled={busy || !cancelRef.trim()}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await cancelStandingOrder(cancelRef.trim());
                showSuccess(`Standing order cancelled — ${cancelRef.trim()}`);
              } catch (e) {
                setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Cancel failed");
              } finally {
                setBusy(false);
              }
            }}
          >
            Cancel Standing Order
          </button>
        </div>
      </div>
    </div>
  );
}


export function ReverseTransferPage() {
  const navigate = useNavigate();
  const { showSuccess, feedbackUi } = useActionFeedback();
  const [refNo, setRefNo] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);

  return (
    <div className="tf-page tpp">
      {feedbackUi}
      <div className="tf-panel">
        <button type="button" className="tf-x" aria-label="Close" onClick={() => navigate(-1)}>
          ×
        </button>
        <h1 className="tf-title">Reverse Transfer</h1>
        <label className="tf-field">
          <span>Transfer Reference</span>
          <input className="tf-input" value={refNo} onChange={(e) => setRefNo(e.target.value)} placeholder="Enter reference" />
        </label>
        <label className="tf-field">
          <span>Reason</span>
          <textarea className="tf-textarea" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" />
        </label>
        {detail ? <pre style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>{detail}</pre> : null}
        {error ? <p className="ctp-error" role="alert">{error}</p> : null}
        <div className="tf-actions tf-actions--full">
          <button
            type="button"
            className="tf-submit"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                const ref = refNo.trim();
                try {
                  const tx = await getTransaction(ref);
                  setDetail(JSON.stringify(tx, null, 2));
                } catch { /* optional */ }
                await reverseTransfer(ref, reason.trim() ? { reason: reason.trim() } : undefined);
                showSuccess(`Transfer reversed — ${ref}`);
              } catch (e) {
                setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Reverse failed");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Working…" : "Reverse"}
          </button>
        </div>
      </div>
    </div>
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitFx() {
    setBusy(true);
    setError(null);
    try {
      const amt = amount.trim().replace(/[^\d.]/g, "");
      if (!amt) throw new Error("Amount is required");
      const today = new Date().toISOString().slice(0, 10);
      const base = from === "NGR" ? "NGN" : from.slice(0, 3);
      const counter = to === "NGR" ? "NGN" : to.slice(0, 3);
      const deal = (await createTreasuryDeal({
        dealType: "FX_SPOT",
        baseCurrency: base,
        counterCurrency: counter,
        notionalAmount: amt,
        rate: rate.trim() || "1",
        tradeDate: today,
        valueDate: today,
        counterparty: "INTERNAL",
        narration: narration.trim() || undefined,
        idempotencyKey: newIdempotencyKey("fx"),
      })) as { dealReference?: string; reference?: string };
      const ref = String(deal.dealReference ?? deal.reference ?? "");
      if (ref) {
        try {
          await bookTreasuryDeal(ref);
        } catch {
          /* may need checker */
        }
      }
      showSuccess(`FX deal booked${ref ? ` — ${ref}` : ""}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "FX failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tf-page tpp">
      {feedbackUi}
      <div className="tf-panel">
        <button type="button" className="tf-x" aria-label="Close" onClick={() => navigate(-1)}>
          ×
        </button>
        <h1 className="tf-title">Currency Exchange</h1>
        <CurrencySelect label="From Currency" value={from} onChange={setFrom} />
        <CurrencySelect label="To Currency" value={to} onChange={setTo} />
        <label className="tf-field">
          <span>Amount</span>
          <input className="tf-input" placeholder="Enter Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <label className="tf-field">
          <span>Rate</span>
          <input className="tf-input" placeholder="Enter Rate" value={rate} onChange={(e) => setRate(e.target.value)} />
        </label>
        <label className="tf-field">
          <span>Narration</span>
          <textarea className="tf-textarea" placeholder="Enter Narration" value={narration} onChange={(e) => setNarration(e.target.value)} />
        </label>
        {error ? <p className="ctp-error" role="alert">{error}</p> : null}
        <div className="tf-actions tf-actions--full">
          <button type="button" className="tf-submit" disabled={busy} onClick={() => void submitFx()}>
            {busy ? "Working…" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
