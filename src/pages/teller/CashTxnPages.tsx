import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { CashTxnNav } from "../../components/teller/CashTxnNav";
import { useActionFeedback } from "../../components/feedback/useActionFeedback";
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
  actionLabel = "Preview",
  tabs,
  successMessage,
}: {
  title: string;
  children: ReactNode;
  actionLabel?: string;
  tabs?: ReactNode;
  successMessage?: string;
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
            <div className="tf-actions">
              <button type="button" className="tf-close" onClick={close}>
                Close
              </button>
              <button
                type="button"
                className="tf-submit"
                onClick={() => showSuccess(successMessage ?? `${title} submitted successfully`)}
              >
                {actionLabel}
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

  return (
    <CashFormShell title={`${currency} Cash Deposit`}>
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

  return (
    <CashFormShell title={`${kind === "lcy" ? "LCY" : "FCY"} Till Transfer`} actionLabel="Preview">
      <label className="tf-field">
        <span>From Till</span>
        <input
          className="tf-input"
          placeholder="Enter Till ID"
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

  return (
    <CashFormShell title={title} tabs={tabs}>
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
  return (
    <CashFormShell
      title={`Reverse Cash ${kind === "deposit" ? "Deposit" : "Withdrawal"}`}
      actionLabel="Submit"
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
          </div>
          <div className="tf-actions">
            <button type="button" className="tf-close" onClick={() => navigate(-1)}>
              Close
            </button>
            <button
              type="button"
              className="tf-submit"
              onClick={() => {
                showSuccess("Cash slip sent to printer successfully");
                window.print();
              }}
            >
              Reprint
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
