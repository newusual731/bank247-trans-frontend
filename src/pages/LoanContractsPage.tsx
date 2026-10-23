import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FilterDropdown } from "../components/FilterDropdown";
import { ContractTypeTabs } from "../components/ContractTypeTabs";
import {
  LOAN_GL_ACCOUNTS,
  LOAN_TYPES,
  REPAYMENT_METHODS,
  TABLE_OVERFLOW_ACTIONS,
  TENOR_MONTHS,
} from "../data/filterDropdownOptions";
import "./LoanContractsPage.css";
import "./GlEntryModals.css";
import { listLoans } from "../api/domain";
import { createLoan, disburseLoan, liquidateLoan, repayLoan } from "../api/contracts";
import { ApiError } from "../lib/apiClient";
import { formatTxnDate, formatTxnMoney } from "../api/transactions";
import { ViewDetailsModal } from "../components/feedback/ViewDetailsModal";
import { useActionFeedback } from "../components/feedback/useActionFeedback";

type LoanRow = {
  id: string;
  counterparty: string;
  productCode: string;
  currency: string;
  amount: string;
  amountNum: number;
  outstanding: string;
  outstandingNum: number;
  startDate: string;
  maturityDate: string;
  status: string;
  disbursementAccount: string;
  interestRate: string;
  tenorMonths: number;
};

type ModalState =
  | { kind: "add" }
  | { kind: "view"; row: LoanRow }
  | { kind: "repay"; row: LoanRow }
  | { kind: "terminate"; row: LoanRow | null }
  | null;

const PAGE_SIZE = 20;

function toList(res: unknown): Record<string, unknown>[] {
  if (Array.isArray(res)) return res as Record<string, unknown>[];
  if (res && typeof res === "object" && "content" in res && Array.isArray((res as { content: unknown }).content)) {
    return (res as { content: Record<string, unknown>[] }).content;
  }
  return [];
}

function mapLoan(l: Record<string, unknown>, i: number): LoanRow {
  const currency = String(l.currency ?? "NGN");
  const amountNum = Number(l.principalAmount ?? l.amount ?? 0) || 0;
  const outstandingNum = Number(l.outstandingPrincipal ?? amountNum) || 0;
  return {
    id: String(l.loanNumber ?? l.id ?? `LN-${i}`),
    counterparty: String(l.customerName ?? l.customerId ?? "—"),
    productCode: String(l.productCode ?? "—"),
    currency,
    amount: formatTxnMoney(amountNum, currency),
    amountNum,
    outstanding: formatTxnMoney(outstandingNum, currency),
    outstandingNum,
    startDate: formatTxnDate(null, String(l.disbursementDate ?? l.applicationDate ?? "")),
    maturityDate: formatTxnDate(null, String(l.maturityDate ?? "")),
    status: String(l.status ?? "—"),
    disbursementAccount: String(l.disbursementAccount ?? "10001"),
    interestRate: String(l.annualInterestRate ?? "—"),
    tenorMonths: Number(l.tenorMonths ?? 0) || 0,
  };
}

function parseAmount(raw: string): string {
  return String(raw ?? "").replace(/[^0-9.]/g, "") || "0";
}

function accountFromLabel(raw: string): string {
  return raw.replace(/[^A-Za-z0-9_.:-]/g, "").slice(0, 30) || "10001";
}

export function LoanContractsPage() {
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [tableAction, setTableAction] = useState<string>(TABLE_OVERFLOW_ACTIONS[1]);
  const [modal, setModal] = useState<ModalState>(null);
  const [allRows, setAllRows] = useState<LoanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { showSuccess, feedbackUi } = useActionFeedback();

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQ, tableAction]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await listLoans({
          size: 100,
          loanNumber: debouncedQ || undefined,
        });
        if (cancelled) return;
        setAllRows(toList(res).map(mapLoan));
      } catch (e) {
        if (!cancelled) {
          setAllRows([]);
          setLoadError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Failed to load loans");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, refreshKey]);

  const filtered = useMemo(() => {
    const q = debouncedQ.toLowerCase();
    let list = allRows;
    if (q) {
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.counterparty.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q) ||
          r.productCode.toLowerCase().includes(q),
      );
    }
    if (tableAction === "Clear Table") return [];
    const sorted = [...list];
    if (tableAction === "Sort By Date") {
      sorted.sort((a, b) => a.startDate.localeCompare(b.startDate));
    } else if (tableAction === "Sort By Status") {
      sorted.sort((a, b) => a.status.localeCompare(b.status));
    } else if (tableAction === "Sort By Amount") {
      sorted.sort((a, b) => a.amountNum - b.amountNum);
    }
    return sorted;
  }, [allRows, debouncedQ, tableAction]);

  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE) || 1);
  const pageSafe = Math.min(page, totalPages - 1);
  const rows = filtered.slice(pageSafe * PAGE_SIZE, pageSafe * PAGE_SIZE + PAGE_SIZE);
  const fromIdx = totalElements === 0 ? 0 : pageSafe * PAGE_SIZE + 1;
  const toIdx = Math.min((pageSafe + 1) * PAGE_SIZE, totalElements);
  const selected = filtered.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="loan">
      {feedbackUi}
      <div className="loan-head">
        <div>
          <h1>LOAN CONTRACT</h1>
          {loadError ? (
            <p className="loan-error" role="alert">
              {loadError}
            </p>
          ) : null}
          <div className="loan-head-actions">
            <button type="button" className="loan-add" onClick={() => setModal({ kind: "add" })}>
              +Add New Contract
            </button>
            <button
              type="button"
              className="loan-terminate"
              onClick={() => setModal({ kind: "terminate", row: selected ?? rows[0] ?? null })}
            >
              Terminate
            </button>
          </div>
        </div>
        <div className="loan-toolbar">
          <FilterDropdown
            aria-label="Table sort and actions"
            triggerClassName="loan-sort-btn"
            menuAlign="end"
            options={TABLE_OVERFLOW_ACTIONS}
            value={tableAction}
            onSelect={(v) => {
              if (v === "Refresh Table") {
                setTableAction("Sort By Amount");
                setQuery("");
                setRefreshKey((k) => k + 1);
                return;
              }
              setTableAction(v);
            }}
            trigger={
              <>
                {tableAction.startsWith("Sort") ? tableAction : "Sort By Amount"}
                <ChevronDown />
              </>
            }
          />
        </div>
      </div>

      <ContractTypeTabs />

      <label className="loan-search">
        <SearchIcon />
        <input
          type="search"
          placeholder="Search loan number, customer, status…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <div className="loan-table-wrap">
        <table className="loan-table">
          <thead>
            <tr>
              <th>Loan Number</th>
              <th>Counterparty</th>
              <th>Amount</th>
              <th>Start Date</th>
              <th>Maturity Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "#6b7280", padding: "1.5rem" }}>
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "#6b7280", padding: "1.5rem" }}>
                  No loans yet. Use +Add New Contract.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className={selectedId === row.id ? "is-selected" : undefined}
                  onClick={() => setSelectedId(row.id)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{row.id}</td>
                  <td>{row.counterparty}</td>
                  <td>{row.amount}</td>
                  <td>{row.startDate}</td>
                  <td>{row.maturityDate}</td>
                  <td>
                    <span className="loan-status">{row.status}</span>
                  </td>
                  <td>
                    <div className="loan-row-actions">
                      <button
                        type="button"
                        className="loan-view"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModal({ kind: "view", row });
                        }}
                      >
                        View
                      </button>
                      <span aria-hidden>·</span>
                      <button
                        type="button"
                        className="loan-view"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModal({ kind: "repay", row });
                        }}
                      >
                        Repay
                      </button>
                      <span aria-hidden>·</span>
                      <button
                        type="button"
                        className="loan-view is-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(row.id);
                          setModal({ kind: "terminate", row });
                        }}
                      >
                        Terminate
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="loan-pager">
        <span>
          {loading ? "…" : totalElements === 0 ? "0 results" : `${fromIdx}–${toIdx} of ${totalElements}`}
        </span>
        <div className="loan-pager-actions">
          <button
            type="button"
            disabled={pageSafe <= 0 || loading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </button>
          <span>
            Page {totalElements === 0 ? 0 : pageSafe + 1} of {totalElements === 0 ? 0 : totalPages}
          </span>
          <button
            type="button"
            disabled={pageSafe + 1 >= totalPages || loading || totalElements === 0}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {modal?.kind === "add"
        ? createPortal(
            <AddLoanModal
              onClose={() => setModal(null)}
              onDone={(msg) => {
                showSuccess(msg);
                setModal(null);
                setRefreshKey((k) => k + 1);
              }}
            />,
            document.body,
          )
        : null}
      {modal?.kind === "view"
        ? createPortal(
            <ViewDetailsModal
              title="View Loan Contract"
              fields={[
                { label: "Loan Number", value: modal.row.id },
                { label: "Counterparty", value: modal.row.counterparty },
                { label: "Product", value: modal.row.productCode },
                { label: "Principal", value: modal.row.amount },
                { label: "Outstanding", value: modal.row.outstanding },
                { label: "Interest Rate", value: `${modal.row.interestRate}%` },
                { label: "Tenor", value: modal.row.tenorMonths ? `${modal.row.tenorMonths} Months` : "—" },
                { label: "Start Date", value: modal.row.startDate, date: true },
                { label: "Maturity Date", value: modal.row.maturityDate, date: true },
                { label: "Disbursement Account", value: modal.row.disbursementAccount },
                { label: "Status", value: modal.row.status },
              ]}
              onClose={() => setModal(null)}
            />,
            document.body,
          )
        : null}
      {modal?.kind === "repay"
        ? createPortal(
            <RepayLoanModal
              row={modal.row}
              onClose={() => setModal(null)}
              onDone={(msg) => {
                showSuccess(msg);
                setModal(null);
                setRefreshKey((k) => k + 1);
              }}
            />,
            document.body,
          )
        : null}
      {modal?.kind === "terminate"
        ? createPortal(
            <TerminateLoanModal
              initial={modal.row}
              knownRows={filtered}
              onClose={() => setModal(null)}
              onDone={(msg) => {
                showSuccess(msg);
                setModal(null);
                setSelectedId(null);
                setRefreshKey((k) => k + 1);
              }}
            />,
            document.body,
          )
        : null}
    </div>
  );
}

function AddLoanModal({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [loanType, setLoanType] = useState<string>(LOAN_TYPES[0]);
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("500000");
  const [rate, setRate] = useState("12.5");
  const [tenor, setTenor] = useState<string>(TENOR_MONTHS[4]);
  const [repayment, setRepayment] = useState<string>(REPAYMENT_METHODS[0]);
  const [disburseGl, setDisburseGl] = useState<string>(LOAN_GL_ACCOUNTS[0]);
  const [bookNow, setBookNow] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitLoan() {
    setBusy(true);
    setError(null);
    try {
      const tenorMonths = Number(String(tenor).replace(/\D/g, "")) || 12;
      const amt = parseAmount(amount);
      const today = new Date().toISOString().slice(0, 10);
      const created = (await createLoan({
        applicationReference: `LN-${Date.now()}`,
        customerId: customerId.trim() || "00000000-0000-0000-0000-000000000001",
        productCode: String(loanType).toUpperCase().replace(/\s+/g, "_").slice(0, 40) || "PERSONAL_LOAN",
        disbursementAccount: accountFromLabel(disburseGl),
        amount: amt,
        tenorMonths,
        applicationDate: today,
        purpose: `${repayment}${rate ? ` @ ${parseAmount(rate)}%` : ""}`,
      })) as { loanNumber?: string; id?: string };
      const loanNumber = String(created.loanNumber ?? created.id ?? "");
      if (loanNumber && bookNow) {
        try {
          await disburseLoan(loanNumber, today);
        } catch {
          /* maker-checker may apply */
        }
      }
      onDone(`Loan ${loanNumber || "created"}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Create loan failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gem-backdrop loan-gem-backdrop" role="presentation" onClick={onClose}>
      <div
        className="gem-modal gem-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-loan-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <h2 id="add-loan-title">ADD NEW LOAN CONTRACT</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        {error ? <p role="alert">{error}</p> : null}
        <div className="gem-grid">
          <label>
            <span>Loan Type</span>
            <select value={loanType} onChange={(e) => setLoanType(e.target.value)}>
              {LOAN_TYPES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Customer ID (UUID)</span>
            <input
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="Optional — demo UUID used if empty"
            />
          </label>
          <label>
            <span>Loan Amount</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label>
            <span>Interest Rate %</span>
            <input value={rate} onChange={(e) => setRate(e.target.value)} />
          </label>
          <label>
            <span>Tenor</span>
            <select value={tenor} onChange={(e) => setTenor(e.target.value)}>
              {TENOR_MONTHS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Repayment Method</span>
            <select value={repayment} onChange={(e) => setRepayment(e.target.value)}>
              {REPAYMENT_METHODS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Disbursement Account</span>
            <select value={disburseGl} onChange={(e) => setDisburseGl(e.target.value)}>
              {LOAN_GL_ACCOUNTS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Disburse immediately</span>
            <select value={bookNow ? "true" : "false"} onChange={(e) => setBookNow(e.target.value === "true")}>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>
        </div>
        <footer>
          <button type="button" className="gem-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="gem-primary" disabled={busy} onClick={() => void submitLoan()}>
            {busy ? "Creating…" : "Create loan"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function RepayLoanModal({
  row,
  onClose,
  onDone,
}: {
  row: LoanRow;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [amount, setAmount] = useState(String(row.outstandingNum || row.amountNum || ""));
  const [settlementAccount, setSettlementAccount] = useState(row.disbursementAccount || "10001");
  const [valueDate, setValueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [narration, setNarration] = useState("Repayment from loan contracts UI");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await repayLoan(row.id, {
        settlementAccount: accountFromLabel(settlementAccount),
        amount: parseAmount(amount),
        valueDate,
        narration,
      });
      onDone(`Repayment posted for ${row.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Repay failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gem-backdrop loan-gem-backdrop" role="presentation" onClick={onClose}>
      <div className="gem-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>REPAY LOAN</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        {error ? <p role="alert">{error}</p> : null}
        <p className="gem-warn">
          {row.id} · Outstanding {row.outstanding}
        </p>
        <div className="gem-grid">
          <label>
            <span>Amount</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label>
            <span>Value date</span>
            <input type="date" value={valueDate} onChange={(e) => setValueDate(e.target.value)} />
          </label>
          <label>
            <span>Settlement account</span>
            <input value={settlementAccount} onChange={(e) => setSettlementAccount(e.target.value)} />
          </label>
        </div>
        <label className="gem-desc">
          <span>Narration</span>
          <textarea rows={2} value={narration} onChange={(e) => setNarration(e.target.value)} />
        </label>
        <footer>
          <button type="button" className="gem-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="gem-primary" disabled={busy} onClick={() => void submit()}>
            {busy ? "Posting…" : "Post repayment"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function TerminateLoanModal({
  initial,
  knownRows,
  onClose,
  onDone,
}: {
  initial: LoanRow | null;
  knownRows: LoanRow[];
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [loanId, setLoanId] = useState(initial?.id ?? knownRows[0]?.id ?? "");
  const [settlementAccount, setSettlementAccount] = useState(
    initial?.disbursementAccount || knownRows[0]?.disbursementAccount || "10001",
  );
  const [valueDate, setValueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("Requested By Customer");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = knownRows.find((r) => r.id === loanId) ?? null;

  async function submit() {
    if (!loanId.trim()) {
      setError("Enter a loan number");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await liquidateLoan(loanId.trim(), {
        settlementAccount: accountFromLabel(settlementAccount),
        valueDate,
        narration: reason,
      });
      onDone(`Terminated ${loanId.trim()}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Terminate failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gem-backdrop loan-gem-backdrop" role="presentation" onClick={onClose}>
      <div className="gem-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>TERMINATE LOAN</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        {error ? <p role="alert">{error}</p> : null}
        {selected ? (
          <p className="gem-warn">
            {selected.id} · {selected.amount} · {selected.status}
          </p>
        ) : null}
        <div className="gem-grid">
          <label>
            <span>Loan number</span>
            {knownRows.length > 0 ? (
              <select
                value={loanId}
                onChange={(e) => {
                  setLoanId(e.target.value);
                  const next = knownRows.find((r) => r.id === e.target.value);
                  if (next?.disbursementAccount) setSettlementAccount(next.disbursementAccount);
                }}
              >
                {knownRows.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} · {r.status}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={loanId}
                onChange={(e) => setLoanId(e.target.value)}
                placeholder="Loan number"
                autoFocus
              />
            )}
          </label>
          <label>
            <span>Value date</span>
            <input type="date" value={valueDate} onChange={(e) => setValueDate(e.target.value)} />
          </label>
          <label>
            <span>Settlement account</span>
            <input value={settlementAccount} onChange={(e) => setSettlementAccount(e.target.value)} />
          </label>
        </div>
        <label className="gem-desc">
          <span>Reason</span>
          <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <footer>
          <button type="button" className="gem-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="gem-primary"
            disabled={busy || !loanId.trim()}
            onClick={() => void submit()}
          >
            {busy ? "Working…" : "Terminate"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
