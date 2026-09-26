import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useActionFeedback } from "../../components/feedback/useActionFeedback";
import "../../components/teller/TellerForm.css";
import "./BankDraftPages.css";

const DRAFT_TABS = [
  { to: "/teller/drafts/issue", label: "Issue" },
  { to: "/teller/drafts/cancel", label: "Cancel" },
  { to: "/teller/drafts/flag", label: "Flag" },
  { to: "/teller/drafts/repurchase", label: "Repurchase" },
  { to: "/teller/drafts/settle", label: "Settle" },
  { to: "/teller/drafts/ledger", label: "Ledger" },
] as const;

function DraftSubnav() {
  return (
    <nav className="tf-subnav" aria-label="Bank draft actions">
      {DRAFT_TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} className={({ isActive }) => (isActive ? "is-active" : undefined)}>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}

function CloseButton({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className="tf-x"
      aria-label="Close"
      onClick={() => (onClose ? onClose() : navigate(-1))}
    >
      ×
    </button>
  );
}

function DraftShell({
  title,
  children,
  actionLabel,
  onAction,
}: {
  title: string;
  children: React.ReactNode;
  actionLabel: string;
  onAction?: () => void;
}) {
  const { showSuccess, feedbackUi } = useActionFeedback();
  return (
    <div className="tf-page bdp">
      {feedbackUi}
      <DraftSubnav />
      <div className="tf-panel">
        <div className="tf-form-shell">
          <div className="tf-form-head">
            <h1>{title}</h1>
            <CloseButton />
          </div>
          <form
            className="tf-stack"
            onSubmit={(e) => {
              e.preventDefault();
              if (onAction) onAction();
              else showSuccess(`${title} completed successfully`);
            }}
          >
            {children}
            <button type="submit" className="tf-btn tf-btn--primary">
              {actionLabel}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/** Issue Bank Draft — routes: /teller/drafts/issue */
export function IssueBankDraftPage() {
  const [name, setName] = useState("Zamani Emmanien");
  const [accountType, setAccountType] = useState("Savings Account");
  const [creditAccount, setCreditAccount] = useState("8399222");
  const [creditAmount, setCreditAmount] = useState("₦233,000.00");
  const [draftNo, setDraftNo] = useState("8399222");
  const [debitDate, setDebitDate] = useState("");
  const [creditDate, setCreditDate] = useState("");
  const [charges, setCharges] = useState("");

  return (
    <DraftShell title="Issue Bank Draft" actionLabel="Validate">
      <label className="tf-field">
        <span>Debit Account Type</span>
        <div className="tf-split">
          <input className="tf-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" />
          <input
            className="tf-input"
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            placeholder="Account type"
          />
        </div>
      </label>
      <label className="tf-field">
        <span>Credit Account</span>
        <div className="tf-tall">
          <input
            className="tf-input"
            style={{ border: "none", padding: 0 }}
            value={creditAccount}
            onChange={(e) => setCreditAccount(e.target.value)}
            placeholder="Account number"
          />
          <input
            className="tf-input"
            style={{ border: "none", padding: 0 }}
            value={creditAmount}
            onChange={(e) => setCreditAmount(e.target.value)}
            placeholder="₦0.00"
          />
        </div>
      </label>
      <label className="tf-field">
        <span>Bank Draft No</span>
        <input className="tf-input tf-input--tall" value={draftNo} onChange={(e) => setDraftNo(e.target.value)} placeholder="Draft number" />
      </label>
      <label className="tf-field">
        <span>Debit Value Date</span>
        <input className="tf-input" type="date" value={debitDate} onChange={(e) => setDebitDate(e.target.value)} />
      </label>
      <label className="tf-field">
        <span>Credit Value Date</span>
        <input className="tf-input" type="date" value={creditDate} onChange={(e) => setCreditDate(e.target.value)} />
      </label>
      <label className="tf-field">
        <span>Applicable Charges</span>
        <input className="tf-input" value={charges} onChange={(e) => setCharges(e.target.value)} placeholder="Enter amount" />
      </label>
    </DraftShell>
  );
}

/** Cancel Bank Draft — /teller/drafts/cancel */
export function CancelBankDraftPage() {
  const [draftNo, setDraftNo] = useState("89382");
  const [debit, setDebit] = useState("89382");
  const [credit, setCredit] = useState("89382");
  const [txnAccount, setTxnAccount] = useState("");
  const [chequeNo, setChequeNo] = useState("");
  const [debitDate, setDebitDate] = useState("");
  const [creditDate, setCreditDate] = useState("");
  const [narration, setNarration] = useState("");

  return (
    <DraftShell title="Cancel Bank Draft" actionLabel="Cancel">
      <label className="tf-field">
        <span>Bank Draft No</span>
        <input className="tf-input" value={draftNo} onChange={(e) => setDraftNo(e.target.value)} placeholder="Draft number" />
      </label>
      <label className="tf-field">
        <span>Debit Account</span>
        <input className="tf-input" value={debit} onChange={(e) => setDebit(e.target.value)} placeholder="Debit account" />
      </label>
      <label className="tf-field">
        <span>Credit Account</span>
        <input className="tf-input" value={credit} onChange={(e) => setCredit(e.target.value)} placeholder="Credit account" />
      </label>
      <label className="tf-field">
        <span>Transaction Account</span>
        <input className="tf-input" value={txnAccount} onChange={(e) => setTxnAccount(e.target.value)} placeholder="Enter ID" />
      </label>
      <label className="tf-field">
        <span>Transaction Cheque No</span>
        <input className="tf-input" value={chequeNo} onChange={(e) => setChequeNo(e.target.value)} placeholder="Enter ID" />
      </label>
      <label className="tf-field">
        <span>Debit Value Date</span>
        <input className="tf-input" type="date" value={debitDate} onChange={(e) => setDebitDate(e.target.value)} />
      </label>
      <label className="tf-field">
        <span>Credit Value Date</span>
        <input className="tf-input" type="date" value={creditDate} onChange={(e) => setCreditDate(e.target.value)} />
      </label>
      <label className="tf-field">
        <span>Narration</span>
        <textarea className="tf-textarea" value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="Credit narration" />
      </label>
    </DraftShell>
  );
}

/** Flag Bank Draft — /teller/drafts/flag */
export function FlagBankDraftPage() {
  const [draftNo, setDraftNo] = useState("89382");
  const [debit, setDebit] = useState("89382");
  const [credit, setCredit] = useState("89382");
  const [txnAccount, setTxnAccount] = useState("");
  const [chequeNo, setChequeNo] = useState("");
  const [debitDate, setDebitDate] = useState("");
  const [creditDate, setCreditDate] = useState("");
  const [narration, setNarration] = useState("");

  return (
    <DraftShell title="Flag a Bank Draft" actionLabel="Flag">
      <label className="tf-field">
        <span>Bank Draft No</span>
        <input className="tf-input" value={draftNo} onChange={(e) => setDraftNo(e.target.value)} placeholder="Draft number" />
      </label>
      <label className="tf-field">
        <span>Debit Account</span>
        <input className="tf-input" value={debit} onChange={(e) => setDebit(e.target.value)} placeholder="Debit account" />
      </label>
      <label className="tf-field">
        <span>Credit Account</span>
        <input className="tf-input" value={credit} onChange={(e) => setCredit(e.target.value)} placeholder="Credit account" />
      </label>
      <label className="tf-field">
        <span>Transaction Account</span>
        <input className="tf-input" value={txnAccount} onChange={(e) => setTxnAccount(e.target.value)} placeholder="Enter ID" />
      </label>
      <label className="tf-field">
        <span>Transaction Cheque No</span>
        <input className="tf-input" value={chequeNo} onChange={(e) => setChequeNo(e.target.value)} placeholder="Enter ID" />
      </label>
      <label className="tf-field">
        <span>Debit Value Date</span>
        <input className="tf-input" type="date" value={debitDate} onChange={(e) => setDebitDate(e.target.value)} />
      </label>
      <label className="tf-field">
        <span>Credit Value Date</span>
        <input className="tf-input" type="date" value={creditDate} onChange={(e) => setCreditDate(e.target.value)} />
      </label>
      <label className="tf-field">
        <span>Narration</span>
        <textarea className="tf-textarea" value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="Credit narration" />
      </label>
    </DraftShell>
  );
}

/** Repurchase Bank Draft — /teller/drafts/repurchase */
export function RepurchaseBankDraftPage() {
  const [draftNo, setDraftNo] = useState("89382");
  const [debit, setDebit] = useState("89382");
  const [credit, setCredit] = useState("89382");
  const [txnAccount, setTxnAccount] = useState("");
  const [chequeNo, setChequeNo] = useState("");
  const [debitDate, setDebitDate] = useState("");
  const [creditDate, setCreditDate] = useState("");
  const [debitNarration, setDebitNarration] = useState("");
  const [creditNarration, setCreditNarration] = useState("");

  return (
    <DraftShell title="Repurchase Bank Draft" actionLabel="Validate">
      <label className="tf-field">
        <span>Bank Draft No</span>
        <input className="tf-input" value={draftNo} onChange={(e) => setDraftNo(e.target.value)} placeholder="Draft number" />
      </label>
      <label className="tf-field">
        <span>Debit Account</span>
        <input className="tf-input" value={debit} onChange={(e) => setDebit(e.target.value)} placeholder="Debit account" />
      </label>
      <label className="tf-field">
        <span>Credit Account</span>
        <input className="tf-input" value={credit} onChange={(e) => setCredit(e.target.value)} placeholder="Credit account" />
      </label>
      <label className="tf-field">
        <span>Transaction Account</span>
        <input className="tf-input" value={txnAccount} onChange={(e) => setTxnAccount(e.target.value)} placeholder="Enter ID" />
      </label>
      <label className="tf-field">
        <span>Transaction Cheque No</span>
        <input className="tf-input" value={chequeNo} onChange={(e) => setChequeNo(e.target.value)} placeholder="Enter ID" />
      </label>
      <label className="tf-field">
        <span>Debit Value Date</span>
        <input className="tf-input" type="date" value={debitDate} onChange={(e) => setDebitDate(e.target.value)} />
      </label>
      <label className="tf-field">
        <span>Credit Value Date</span>
        <input className="tf-input" type="date" value={creditDate} onChange={(e) => setCreditDate(e.target.value)} />
      </label>
      <label className="tf-field">
        <span>Debit Narration</span>
        <textarea
          className="tf-textarea"
          value={debitNarration}
          onChange={(e) => setDebitNarration(e.target.value)}
          placeholder="Debit narration"
        />
      </label>
      <label className="tf-field">
        <span>Credit Narration</span>
        <textarea
          className="tf-textarea"
          value={creditNarration}
          onChange={(e) => setCreditNarration(e.target.value)}
          placeholder="Credit narration"
        />
      </label>
    </DraftShell>
  );
}

/** Settle Bank Draft — /teller/drafts/settle */
export function SettleBankDraftPage() {
  const [draftNo, setDraftNo] = useState("89382");
  const [flagType, setFlagType] = useState("89382");
  const [debit, setDebit] = useState("89382");
  const [credit, setCredit] = useState("89382");
  const [txnAccount, setTxnAccount] = useState("");
  const [chequeNo, setChequeNo] = useState("");
  const [debitDate, setDebitDate] = useState("");
  const [creditDate, setCreditDate] = useState("");
  const [narration, setNarration] = useState("");

  return (
    <DraftShell title="Settle Bank Draft" actionLabel="Validate">
      <label className="tf-field">
        <span>Bank Draft No</span>
        <input className="tf-input" value={draftNo} onChange={(e) => setDraftNo(e.target.value)} placeholder="Draft number" />
      </label>
      <label className="tf-field">
        <span>Flag Type</span>
        <input className="tf-input" value={flagType} onChange={(e) => setFlagType(e.target.value)} placeholder="Flag type" />
      </label>
      <label className="tf-field">
        <span>Debit Account</span>
        <input className="tf-input" value={debit} onChange={(e) => setDebit(e.target.value)} placeholder="Debit account" />
      </label>
      <label className="tf-field">
        <span>Credit Account</span>
        <input className="tf-input" value={credit} onChange={(e) => setCredit(e.target.value)} placeholder="Credit account" />
      </label>
      <label className="tf-field">
        <span>Transaction Account</span>
        <input className="tf-input" value={txnAccount} onChange={(e) => setTxnAccount(e.target.value)} placeholder="Enter ID" />
      </label>
      <label className="tf-field">
        <span>Transaction Cheque No</span>
        <input className="tf-input" value={chequeNo} onChange={(e) => setChequeNo(e.target.value)} placeholder="Enter ID" />
      </label>
      <label className="tf-field">
        <span>Debit Value Date</span>
        <input className="tf-input" type="date" value={debitDate} onChange={(e) => setDebitDate(e.target.value)} />
      </label>
      <label className="tf-field">
        <span>Credit Value Date</span>
        <input className="tf-input" type="date" value={creditDate} onChange={(e) => setCreditDate(e.target.value)} />
      </label>
      <label className="tf-field">
        <span>Narration</span>
        <textarea className="tf-textarea" value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="Credit narration" />
      </label>
    </DraftShell>
  );
}

type LedgerRow = {
  draftNo: string;
  debit: string;
  credit: string;
  amount: string;
  status: string;
  valueDate: string;
  branch: string;
};

const LEDGER_ROWS: LedgerRow[] = [
  {
    draftNo: "BD-8399222",
    debit: "1002345678",
    credit: "8399222",
    amount: "₦233,000.00",
    status: "Issued",
    valueDate: "2025-06-15",
    branch: "Ikeja",
  },
  {
    draftNo: "BD-8399101",
    debit: "1002987654",
    credit: "8399101",
    amount: "₦85,500.00",
    status: "Flagged",
    valueDate: "2025-06-14",
    branch: "Victoria Island",
  },
  {
    draftNo: "BD-8399002",
    debit: "1002111222",
    credit: "8399002",
    amount: "₦1,200,000.00",
    status: "Settled",
    valueDate: "2025-06-12",
    branch: "Ikeja",
  },
  {
    draftNo: "BD-8398890",
    debit: "1002444555",
    credit: "8398890",
    amount: "₦45,000.00",
    status: "Cancelled",
    valueDate: "2025-06-10",
    branch: "Surulere",
  },
];

function statusClass(status: string) {
  if (status === "Issued") return "tf-badge";
  if (status === "Flagged") return "tf-badge tf-badge--warn";
  return "tf-badge tf-badge--muted";
}

/** Bank Draft Ledger — /teller/drafts/ledger */
export function BankDraftLedgerPage() {
  const [q, setQ] = useState("");
  const rows = LEDGER_ROWS.filter(
    (r) =>
      !q ||
      r.draftNo.toLowerCase().includes(q.toLowerCase()) ||
      r.debit.includes(q) ||
      r.credit.includes(q),
  );

  return (
    <div className="tf-page bdp">
      <DraftSubnav />
      <div className="tf-panel">
        <div className="tf-toolbar">
          <h1>Bank Draft Ledger</h1>
          <div className="bdp-ledger-actions">
            <input
              className="tf-input"
              style={{ maxWidth: 240 }}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search draft / account"
            />
            <button type="button" className="tf-btn tf-btn--outline" style={{ width: "auto" }} onClick={() => window.print()}>
              Export
            </button>
          </div>
        </div>
        <div className="tf-table-wrap">
          <table className="tf-table">
            <thead>
              <tr>
                <th>Draft No</th>
                <th>Debit Account</th>
                <th>Credit Account</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Value Date</th>
                <th>Branch</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.draftNo}>
                  <td>{row.draftNo}</td>
                  <td>{row.debit}</td>
                  <td>{row.credit}</td>
                  <td>{row.amount}</td>
                  <td>
                    <span className={statusClass(row.status)}>{row.status}</span>
                  </td>
                  <td>{row.valueDate}</td>
                  <td>{row.branch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
