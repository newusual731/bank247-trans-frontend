import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useActionFeedback } from "../../components/feedback/useActionFeedback";
import { ApiError } from "../../lib/apiClient";
import {
  cancelBankDraft,
  createBankDraft,
  flagBankDraft,
  getBankDraft,
  listBankDrafts,
  settleBankDraft,
} from "../../api/teller";
import "../../components/teller/TellerForm.css";
import "./BankDraftPages.css";
import { SkeletonTableBody } from "../../components/skeleton";

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

function parseMoney(raw: string): string {
  const n = raw.replace(/[^0-9.]/g, "");
  return n || "0";
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
  onAction?: () => Promise<string | void> | string | void;
}) {
  const { showSuccess, feedbackUi } = useActionFeedback();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError(null);
              try {
                if (!onAction) {
                  showSuccess(`${title} completed successfully`);
                  return;
                }
                const msg = await onAction();
                showSuccess(typeof msg === "string" && msg ? msg : `${title} completed successfully`);
              } catch (err) {
                setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Request failed");
              } finally {
                setBusy(false);
              }
            }}
          >
            {children}
            {error ? <p className="ctp-error" role="alert">{error}</p> : null}
            <button type="submit" className="tf-btn tf-btn--primary" disabled={busy}>
              {busy ? "Working…" : actionLabel}
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
    <DraftShell
      title="Issue Bank Draft"
      actionLabel="Issue"
      onAction={async () => {
        const res = await createBankDraft({
          sourceAccount: creditAccount.replace(/\D/g, "").padStart(10, "0").slice(-10),
          beneficiaryName: name.trim() || "Beneficiary",
          amount: parseMoney(creditAmount),
          currency: "NGN",
          narration: charges ? `Charges ${charges}` : undefined,
        });
        const ref = res && typeof res === "object" && "draftNumber" in res ? String((res as { draftNumber?: string }).draftNumber || "") : "";
        return `Draft issued${ref ? ` — ${ref}` : ""}`;
      }}
    >
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
    <DraftShell
      title="Cancel Bank Draft"
      actionLabel="Cancel"
      onAction={async () => {
        await cancelBankDraft(draftNo.trim(), narration.trim() || undefined);
        return `Draft ${draftNo} cancelled`;
      }}
    >
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
    <DraftShell
      title="Flag a Bank Draft"
      actionLabel="Flag"
      onAction={async () => {
        await flagBankDraft(draftNo.trim(), narration.trim() || undefined);
        return `Draft ${draftNo} flagged`;
      }}
    >
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
    <DraftShell
      title="Repurchase Bank Draft"
      actionLabel="Validate"
      onAction={async () => {
        const d = await getBankDraft(draftNo.trim());
        return `Draft ${draftNo} validated — ${String((d as { status?: string }).status ?? "OK")}`;
      }}
    >
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
    <DraftShell
      title="Settle Bank Draft"
      actionLabel="Settle"
      onAction={async () => {
        try { await getBankDraft(draftNo.trim()); } catch { /* optional validate */ }
        await settleBankDraft(draftNo.trim());
        return `Draft ${draftNo} settled`;
      }}
    >
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

/** Bank Draft Ledger — /teller/drafts/ledger */
export function BankDraftLedgerPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await listBankDrafts({ size: 50 });
      const content =
        res && typeof res === "object" && "content" in res && Array.isArray((res as { content: unknown }).content)
          ? ((res as { content: Record<string, unknown>[] }).content)
          : Array.isArray(res)
            ? res
            : [];
      setRows(content as Record<string, unknown>[]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  // load on mount
  useEffect(() => {
    void refresh();
  }, []);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    const blob = JSON.stringify(r).toLowerCase();
    return blob.includes(q.trim().toLowerCase());
  });

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
            {loading ? (
              <SkeletonTableBody rows={6} columns={["sm", "md", "md", "sm", "pill", "sm", "sm"]} />
            ) : error ? (
              <tr><td colSpan={7}>{error}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7}>No drafts found</td></tr>
            ) : (
              filtered.map((r, i) => (
                <tr key={String(r.draftNumber ?? r.id ?? i)}>
                  <td>{String(r.draftNumber ?? "—")}</td>
                  <td>{String(r.sourceAccount ?? "—")}</td>
                  <td>{String(r.beneficiaryName ?? "—")}</td>
                  <td>{String(r.amount ?? "—")} {String(r.currency ?? "")}</td>
                  <td>{String(r.status ?? "—")}</td>
                  <td>{String(r.valueDate ?? r.createdAt ?? "—")}</td>
                  <td>{String(r.branchCode ?? "—")}</td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
