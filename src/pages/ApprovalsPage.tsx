import { useCallback, useEffect, useState } from "react";
import { approveRequest, listApprovals, rejectRequest, type ApprovalRequest } from "../api/workflow";
import { ApiError } from "../lib/apiClient";
import "./ApprovalsPage.css";

type Tab = "eligible" | "pending" | "all";

/** Operations this app submits for maker-checker. Ledger statement, special, and P&L entries are not in this set. */
const TRANSACTION_PREFIXES = ["TELLER_", "LOAN_", "INVESTMENT_", "TREASURY_", "TRADE_", "PAYMENT_"];

const LABELS: Record<string, string> = {
  TELLER_TILL_CREATE: "Open till",
  TELLER_TILL_CLOSE: "Close till",
  TELLER_TILL_REOPEN: "Reopen till",
  TELLER_CASH_DEPOSIT: "Cash deposit",
  TELLER_CASH_WITHDRAWAL: "Cash withdrawal",
  TELLER_CASH_REVERSAL: "Cash reversal",
  TELLER_VAULT_TRANSFER: "Vault transfer",
  LOAN_BOOKING: "Loan booking",
  LOAN_RESTRUCTURE: "Loan restructure",
  INVESTMENT_BOOKING: "Investment booking",
  INVESTMENT_AMENDMENT: "Investment amendment",
  INVESTMENT_TOP_UP: "Investment top-up",
  INVESTMENT_ROLLOVER: "Investment rollover",
  TREASURY_DEAL_APPROVAL: "Treasury deal",
  TREASURY_LIMIT_APPROVAL: "Treasury limit",
  TRADE_INSTRUMENT_APPROVAL: "Trade instrument",
  TRADE_AMENDMENT_APPROVAL: "Trade amendment",
  TRADE_ACTION_APPROVAL: "Trade action",
  PAYMENT_FT_PRODUCT_CREATE: "Transfer product",
  PAYMENT_FT_PRODUCT_AMEND: "Transfer product change",
  PAYMENT_FT_PRODUCT_DEACTIVATE: "Transfer product close",
};

function isTransactionApproval(code: string) {
  return TRANSACTION_PREFIXES.some((prefix) => code.startsWith(prefix));
}

function labelFor(code: string) {
  return LABELS[code] ?? code.split("_").join(" ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

function messageOf(err: unknown) {
  if (err instanceof ApiError) return err.message;
  return err instanceof Error ? err.message : "Could not load approvals";
}

export function ApprovalsPage() {
  const [tab, setTab] = useState<Tab>("eligible");
  const [rows, setRows] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await listApprovals({
        status: tab === "all" ? undefined : "PENDING",
        eligibleOnly: tab === "eligible",
        page: 0,
        size: 100,
      });
      setRows((page.content ?? []).filter((row) => isTransactionApproval(row.operationCode)));
    } catch (err) {
      setRows([]);
      setError(messageOf(err));
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(id: string, kind: "approve" | "reject") {
    setBusyId(id);
    setError(null);
    try {
      if (kind === "approve") await approveRequest(id);
      else await rejectRequest(id);
      await load();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="approvals">
      <div className="approvals-head">
        <div>
          <h1>Approvals</h1>
          <p>Teller, loan, investment, treasury, trade, and payment requests waiting for a checker.</p>
        </div>
      </div>

      <div className="approvals-tabs" role="tablist">
        {(
          [
            ["eligible", "Eligible for me"],
            ["pending", "Pending"],
            ["all", "All"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? "is-active" : undefined}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="approvals-error" role="alert">
          {error}
        </p>
      ) : null}

      <table className="approvals-table">
        <thead>
          <tr>
            <th>Operation</th>
            <th>Resource</th>
            <th>Requested by</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={5} className="approvals-empty">
                Loading…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="approvals-empty">
                No transaction approvals in this list.
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const open = row.status === "PENDING" || row.status === "PENDING_APPROVAL";
              return (
                <tr key={row.id}>
                  <td>{labelFor(row.operationCode)}</td>
                  <td>
                    {row.resourceType} / {row.resourceId}
                  </td>
                  <td>{row.requestedBy || "—"}</td>
                  <td>
                    <span className={`approvals-status is-${row.status.toLowerCase()}`}>{row.status}</span>
                  </td>
                  <td>
                    {open ? (
                      <span className="approvals-actions">
                        <button type="button" disabled={busyId === row.id} onClick={() => void decide(row.id, "approve")}>
                          Approve
                        </button>
                        <button
                          type="button"
                          className="is-secondary"
                          disabled={busyId === row.id}
                          onClick={() => void decide(row.id, "reject")}
                        >
                          Reject
                        </button>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
