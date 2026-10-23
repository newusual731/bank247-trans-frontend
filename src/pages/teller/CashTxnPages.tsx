import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { CashTxnNav } from "../../components/teller/CashTxnNav";
import { useActionFeedback } from "../../components/feedback/useActionFeedback";
import { ApiError } from "../../lib/apiClient";
import {
  acceptTillTransfer,
  rejectTillTransfer,
  createTillTransfer,
  createVaultTransfer,
  completeApprovedVaultTransfer,
  depositCash,
  requestCashReversal,
  completeCashReversal,
  completeApprovedCash,
  getTellerTransaction,
  getTillTransfer,
  getVaultTransfer,
  withdrawCash,
} from "../../api/teller";
import "../../components/teller/TellerForm.css";
import "./CashTxnPages.css";

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="tf-field">
      <span>{label}</span>
      <div className="tf-select-wrap">
        <select className="tf-select" value={value} onChange={(e) => onChange(e.target.value)}>
          {children}
        </select>
        <span className="tf-chev" aria-hidden>
          ▾
        </span>
      </div>
    </label>
  );
}

function CashFormShell({
  title,
  children,
  actionLabel = "Submit",
  tabs,
  successMessage,
  onSubmit,
  busy,
  error,
}: {
  title: string;
  children: ReactNode;
  actionLabel?: string;
  tabs?: ReactNode;
  successMessage?: string;
  onSubmit?: () => Promise<string | void> | string | void;
  busy?: boolean;
  error?: string | null;
}) {
  const navigate = useNavigate();
  const { showSuccess, feedbackUi } = useActionFeedback();
  const close = () => navigate(-1);

  return (
    <div className="tf-page ctp">
      {feedbackUi}
      <div className="tf-layout">
        <CashTxnNav />
        <div className="tf-panel ctp-panel">
          <button type="button" className="tf-x" aria-label="Close" onClick={close}>
            ×
          </button>
          <div className="tf-form-shell">
            <h1 className="tf-title">{title}</h1>
            {tabs}
            <div className="tf-stack">{children}</div>
            {error ? <p className="ctp-error" role="alert">{error}</p> : null}
            <div className="tf-actions">
              <button type="button" className="tf-close" onClick={close}>
                Close
              </button>
              <button
                type="button"
                className="tf-submit"
                disabled={busy}
                onClick={async () => {
                  try {
                    if (!onSubmit) {
                      showSuccess(successMessage ?? `${title} submitted successfully`);
                      return;
                    }
                    const msg = await onSubmit();
                    showSuccess(
                      typeof msg === "string" && msg
                        ? msg
                        : successMessage ?? `${title} submitted successfully`,
                    );
                  } catch {
                    /* page sets error state */
                  }
                }}
              >
                {busy ? "Working…" : actionLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CashDepositPage({ currency }: { currency: "LCY" | "FCY" }) {
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [holder, setHolder] = useState("");
  const [ccy, setCcy] = useState(currency === "FCY" ? "USD" : "NGN");
  const [narration, setNarration] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await depositCash({
        customerAccount: account.trim(),
        amount: amount.trim(),
        currency: currency === "LCY" ? "NGN" : ccy,
        narration: narration.trim() || undefined,
      });
      const ref = String(res.reference ?? "");
      if (ref) {
        try { await completeApprovedCash(ref); } catch { /* may need checker */ }
      }
      return `Deposit accepted${ref ? ` — ${ref}` : ""}`;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Deposit failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <CashFormShell title={`${currency} Cash Deposit`} actionLabel="Submit" onSubmit={submit} busy={busy} error={error}>
      <label className="tf-field">
        <span>Enter the credit Account</span>
        <input
          className="tf-input"
          placeholder="Enter the credit Account"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
        />
      </label>
      <label className="tf-field">
        <span>Enter the Amount</span>
        <input
          className="tf-input"
          placeholder="Enter Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>
      {currency === "FCY" ? (
        <SelectField label="Currency" value={ccy} onChange={setCcy}>
          <option>USD</option>
          <option>EUR</option>
          <option>GBP</option>
        </SelectField>
      ) : null}
      <SelectField label="Account Holder" value={holder} onChange={setHolder}>
        <option value="">Select</option>
        <option>Adebayo Okon</option>
        <option>Chioma Nwosu</option>
        <option>Sam Kola</option>
      </SelectField>
      <label className="tf-field tf-field--narration">
        <span>Enter Narration</span>
        <textarea
          className="tf-textarea"
          placeholder="Enter Narration"
          value={narration}
          onChange={(e) => setNarration(e.target.value)}
        />
      </label>
    </CashFormShell>
  );
}

export function CashTillTransferPage({ kind }: { kind: "lcy" | "fcy" }) {
  const [fromTill, setFromTill] = useState("");
  const [toTill, setToTill] = useState("");
  const [amount, setAmount] = useState("");
  const [ccy, setCcy] = useState(kind === "fcy" ? "USD" : "NGN");
  const [narration, setNarration] = useState("");
  const [pendingRef, setPendingRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const ccyCode = kind === "lcy" ? "NGN" : ccy;
      const from = fromTill.trim().toUpperCase();
      const to = toTill.trim();
      const isVault = from === "VAULT" || to.toUpperCase() === "VAULT" || /vault/i.test(narration);
      if (isVault) {
        const tillId = from === "VAULT" ? to : fromTill.trim();
        const direction = from === "VAULT" ? "VAULT_TO_TILL" : "TILL_TO_VAULT";
        const res = await createVaultTransfer({
          direction,
          tillId,
          amount: amount.trim(),
          currency: ccyCode,
          narration: narration.trim() || undefined,
        }) as { reference?: string };
        const ref = String(res.reference ?? "");
        if (ref) {
          try { await getVaultTransfer(ref); } catch { /* optional */ }
          try { await completeApprovedVaultTransfer(ref); } catch { /* may need checker */ }
        }
        return `Vault transfer submitted${ref ? ` — ${ref}` : ""} (${direction})`;
      }
      const res = await createTillTransfer({
        destinationTillId: to,
        amount: amount.trim(),
        currency: ccyCode,
        narration: narration.trim() || undefined,
      }) as { reference?: string };
      const ref = String(res.reference ?? "");
      if (ref) {
        try { await getTillTransfer(ref); } catch { /* optional */ }
        try { await acceptTillTransfer(ref); } catch { /* receiving till may accept later */ }
      }
      return `Till transfer submitted${ref ? ` — ${ref}` : ""}${fromTill ? ` (from ${fromTill})` : ""}`;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Transfer failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <CashFormShell title={`${kind === "lcy" ? "LCY" : "FCY"} Till Transfer`} actionLabel="Submit" onSubmit={submit} busy={busy} error={error}>
      <label className="tf-field">
        <span>From Till</span>
        <input
          className="tf-input"
          placeholder="Till ID or VAULT"
          value={fromTill}
          onChange={(e) => setFromTill(e.target.value)}
        />
      </label>
      <label className="tf-field">
        <span>To Till</span>
        <input
          className="tf-input"
          placeholder="Enter Till ID"
          value={toTill}
          onChange={(e) => setToTill(e.target.value)}
        />
      </label>
      <label className="tf-field">
        <span>Enter the Amount</span>
        <input
          className="tf-input"
          placeholder="Enter Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>
      <SelectField label="Currency" value={ccy} onChange={setCcy}>
        {kind === "lcy" ? <option>NGN</option> : null}
        <option>USD</option>
        <option>EUR</option>
        <option>GBP</option>
      </SelectField>
            <label className="tf-field">
        <span>Pending Transfer Ref (accept / reject)</span>
        <input
          className="tf-input"
          placeholder="Existing transfer reference"
          value={pendingRef}
          onChange={(e) => setPendingRef(e.target.value)}
        />
      </label>
      <div className="tf-actions" style={{ marginTop: 8, gap: 8 }}>
        <button
          type="button"
          className="tf-close"
          disabled={busy || !pendingRef.trim()}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              try { await getTillTransfer(pendingRef.trim()); } catch { /* optional */ }
              await acceptTillTransfer(pendingRef.trim());
              return;
            } catch (e) {
              setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Accept failed");
            } finally {
              setBusy(false);
            }
          }}
        >
          Accept pending
        </button>
        <button
          type="button"
          className="tf-close"
          disabled={busy || !pendingRef.trim()}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await rejectTillTransfer(pendingRef.trim());
            } catch (e) {
              setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Reject failed");
            } finally {
              setBusy(false);
            }
          }}
        >
          Reject pending
        </button>
      </div>
<label className="tf-field tf-field--narration">
        <span>Enter Narration</span>
        <textarea
          className="tf-textarea"
          placeholder="Enter Narration"
          value={narration}
          onChange={(e) => setNarration(e.target.value)}
        />
      </label>
    </CashFormShell>
  );
}

export function CashWithdrawalPage({
  mode,
}: {
  mode: "lcy" | "cheque" | "counter-cheque" | "internal";
}) {
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [holder, setHolder] = useState("");
  const [chequeNo, setChequeNo] = useState("");
  const [narration, setNarration] = useState("");
  const title =
    mode === "cheque"
      ? "LCY Cash Withdrawal with Cheque"
      : mode === "counter-cheque"
        ? "LCY Cash Withdrawal with Counter Cheque"
        : mode === "internal"
          ? "LCY Cash Withdrawal — Internal Account"
          : "LCY Cash Withdrawal";

  const navigate = useNavigate();
  const tabs =
    mode === "cheque" || mode === "counter-cheque" || mode === "internal" ? (
      <div className="ctp-tabs" role="tablist">
        <button
          type="button"
          className={mode === "cheque" ? "is-active" : undefined}
          onClick={() => navigate("/teller/withdrawals/cheque")}
        >
          Cheque
        </button>
        <button
          type="button"
          className={mode === "counter-cheque" ? "is-active" : undefined}
          onClick={() => navigate("/teller/withdrawals/counter-cheque")}
        >
          Counter Cheque
        </button>
        <button
          type="button"
          className={mode === "internal" ? "is-active" : undefined}
          onClick={() => navigate("/teller/withdrawals/internal")}
        >
          Internal Account
        </button>
      </div>
    ) : null;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await withdrawCash({
        customerAccount: account.trim(),
        amount: amount.trim(),
        currency: "NGN",
        narration: narration.trim() || undefined,
        chequeNumber: chequeNo.trim() || undefined,
      });
      const ref = String(res.reference ?? "");
      if (ref) {
        try { await completeApprovedCash(ref); } catch { /* may need checker */ }
      }
      return `Withdrawal accepted${ref ? ` — ${ref}` : ""}`;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Withdrawal failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <CashFormShell title={title} tabs={tabs} actionLabel="Submit" onSubmit={submit} busy={busy} error={error}>
      <label className="tf-field">
        <span>Enter the Debit Account</span>
        <input
          className="tf-input"
          placeholder="Enter the Debit Account"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
        />
      </label>
      <label className="tf-field">
        <span>Enter the Amount</span>
        <input
          className="tf-input"
          placeholder="Enter Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>
      {(mode === "cheque" || mode === "counter-cheque") && (
        <label className="tf-field">
          <span>Cheque Number</span>
          <input
            className="tf-input"
            placeholder="Enter Cheque No"
            value={chequeNo}
            onChange={(e) => setChequeNo(e.target.value)}
          />
        </label>
      )}
      <SelectField label="Account Holder" value={holder} onChange={setHolder}>
        <option value="">Select</option>
        <option>Adebayo Okon</option>
        <option>Chioma Nwosu</option>
        <option>Sam Kola</option>
      </SelectField>
      <label className="tf-field tf-field--narration">
        <span>Enter Narration</span>
        <textarea
          className="tf-textarea"
          placeholder="Enter Narration"
          value={narration}
          onChange={(e) => setNarration(e.target.value)}
        />
      </label>
    </CashFormShell>
  );
}

export function ReverseCashPage({ kind }: { kind: "deposit" | "withdrawal" }) {
  const [refNo, setRefNo] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const ref = refNo.trim();
      await requestCashReversal(ref);
      const res = await completeCashReversal(ref);
      return `Reversal completed${res.reference ? ` — ${res.reference}` : ` — ${ref}`}${reason ? ` (${reason})` : ""}`;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Reversal failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <CashFormShell
      title={`Reverse Cash ${kind === "deposit" ? "Deposit" : "Withdrawal"}`}
      actionLabel="Submit"
      onSubmit={submit}
      busy={busy}
      error={error}
    >
      <label className="tf-field">
        <span>Original Transaction Ref</span>
        <input
          className="tf-input"
          placeholder="Enter Reference"
          value={refNo}
          onChange={(e) => setRefNo(e.target.value)}
        />
      </label>
      <label className="tf-field tf-field--narration">
        <span>Reason for Reversal</span>
        <textarea
          className="tf-textarea"
          placeholder="Enter Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
    </CashFormShell>
  );
}

export function ReprintCashSlipPage() {
  const navigate = useNavigate();
  const { showSuccess, feedbackUi } = useActionFeedback();
  const [refNo, setRefNo] = useState("");
  const [account, setAccount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slip, setSlip] = useState<Record<string, unknown> | null>(null);

  async function reprint() {
    setBusy(true);
    setError(null);
    setSlip(null);
    try {
      const ref = refNo.trim();
      if (!ref) throw new Error("Transaction reference is required");
      const tx = (await getTellerTransaction(ref)) as Record<string, unknown>;
      const acct = String(tx.customerAccount ?? tx.accountNumber ?? "");
      if (account.trim() && acct && account.trim() !== acct) {
        throw new Error(`Account mismatch: slip is for ${acct}`);
      }
      setSlip(tx);
      showSuccess(`Cash slip loaded — ${ref}`);
      window.print();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Reprint failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tf-page ctp">
      {feedbackUi}
      <div className="tf-panel ctp-panel">
        <button type="button" className="tf-x" aria-label="Close" onClick={() => navigate(-1)}>
          ×
        </button>
        <div className="tf-form-shell">
          <h1 className="tf-title">Reprint Cash Slip</h1>
          <div className="tf-stack">
            <label className="tf-field">
              <span>Transaction Reference</span>
              <input
                className="tf-input"
                placeholder="Enter Reference"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
              />
            </label>
            <label className="tf-field">
              <span>Account Number</span>
              <input
                className="tf-input"
                placeholder="Enter Account"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
              />
            </label>
            {slip ? (
              <pre className="ctp-slip" style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>
                {JSON.stringify(slip, null, 2)}
              </pre>
            ) : null}
            {error ? <p className="ctp-error" role="alert">{error}</p> : null}
          </div>
          <div className="tf-actions">
            <button type="button" className="tf-close" onClick={() => navigate(-1)}>
              Close
            </button>
            <button type="button" className="tf-submit" disabled={busy} onClick={() => void reprint()}>
              {busy ? "Loading…" : "Reprint"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
