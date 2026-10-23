import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import {
  formatTxnDate,
  formatTxnMoney,
  formatTxnStatus,
  searchTransactions,
  type UiTxnStatus,
} from "../api/transactions";
import { ApiError } from "../lib/apiClient";
import { SkeletonTableBody } from "../components/skeleton";
import "./TransactionsHubPage.css";

type TxTone = "purple" | "peach" | "pink";
type TxIconId = "statement" | "special" | "pnl";

type TxModule = {
  to: string;
  title: string;
  icon: TxIconId;
  tone: TxTone;
  recommended?: boolean;
};

type RecentRow = {
  ref: string;
  type: string;
  debit: string;
  credit: string;
  amount: string;
  status: UiTxnStatus;
  date: string;
};

const MODULES: TxModule[] = [
  {
    to: "/transactions/statement-entry",
    title: "Statement Entry",
    icon: "statement",
    tone: "purple",
    recommended: true,
  },
  {
    to: "/transactions/special-entry",
    title: "Special Entry",
    icon: "special",
    tone: "peach",
  },
  {
    to: "/transactions/pnl-entry",
    title: "Profit & Loss Entry",
    icon: "pnl",
    tone: "pink",
  },
];

const PAGE_SIZE = 8;

export function TransactionsHubPage() {
  const [rows, setRows] = useState<RecentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQuery]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await searchTransactions({
          page,
          size: PAGE_SIZE,
          q: debouncedQuery || undefined,
        });
        if (cancelled) return;
        setRows(
          (res.content ?? []).map((t) => ({
            ref: t.reference || t.id || "—",
            type: t.channel || "Transfer",
            debit: t.sourceAccount || "—",
            credit: t.destinationAccount || "—",
            amount: formatTxnMoney(t.amount, t.currency || "NGN"),
            status: formatTxnStatus(t.status),
            date: formatTxnDate(t.createdAt, t.valueDate),
          })),
        );
        setTotalPages(Math.max(1, res.totalPages || 1));
        setTotalElements(res.totalElements ?? 0);
      } catch (e) {
        if (cancelled) return;
        setRows([]);
        setTotalElements(0);
        setTotalPages(1);
        setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Unable to load recent transactions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, debouncedQuery]);

  const fromIdx = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const toIdx = Math.min((page + 1) * PAGE_SIZE, totalElements);

  return (
    <div className="txh" aria-busy={loading}>
      <header className="txh-head">
        <div>
          <h1>Transactions</h1>
        </div>
      </header>

      <div className="txh-grid">
        {MODULES.map((m) => (
          <Link key={m.to} to={m.to} className="txh-card">
            <span className={`txh-icon is-${m.tone}`} aria-hidden>
              <TxIcon name={m.icon} />
            </span>
            {m.recommended ? (
              <span className="txh-rec">
                <BoltIcon />
                Recommended
              </span>
            ) : null}
            <strong>{m.title}</strong>
            <span className="txh-chev" aria-hidden>
              ›
            </span>
            <span className="txh-rule" aria-hidden />
            <em>Bank 24/7</em>
          </Link>
        ))}
      </div>

      <section className="txh-recent">
        <div className="txh-recent-head">
          <h2>Recent Entries</h2>
          <div className="txh-recent-actions">
            <label className="txh-search">
              <SearchIcon />
              <input
                type="search"
                placeholder="Search reference or account…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search recent transactions"
              />
            </label>
            <Link to="/transactions/statement-entry">View Statement Entry</Link>
          </div>
        </div>
        {error ? (
          <p className="txh-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className={`txh-table-wrap${loading ? " is-loading" : ""}`}>
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Type</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTableBody rows={PAGE_SIZE} columns={["md", "sm", "sm", "sm", "sm", "sm", "pill"]} />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="txh-empty">
                    {debouncedQuery ? "No transactions match your search" : "No recent transactions"}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.ref}>
                    <td>{r.ref}</td>
                    <td>{r.type}</td>
                    <td>{r.debit}</td>
                    <td>{r.credit}</td>
                    <td>{r.amount}</td>
                    <td>{r.date}</td>
                    <td>
                      <span className={`txh-pill is-${r.status.toLowerCase()}`}>{r.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="txh-pager">
          <span>{loading ? "…" : totalElements === 0 ? "0 results" : `${fromIdx}–${toIdx} of ${totalElements}`}</span>
          <div className="txh-pager-actions">
            <button type="button" disabled={page <= 0 || loading} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              Previous
            </button>
            <span>
              Page {totalElements === 0 ? 0 : page + 1} of {totalElements === 0 ? 0 : totalPages}
            </span>
            <button
              type="button"
              disabled={page + 1 >= totalPages || loading || totalElements === 0}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function BoltIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13 2L4 14h7l-1 8 10-14h-7l0-6z" />
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

function TxIcon({ name }: { name: TxIconId }): ReactNode {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none" as const,
  };
  const stroke = "#fff";

  switch (name) {
    case "statement":
      return (
        <svg {...common}>
          <path
            d="M7 3.5h7l4 4V20a1.5 1.5 0 01-1.5 1.5H7A1.5 1.5 0 015.5 20V5A1.5 1.5 0 017 3.5z"
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M14 3.5V8h4" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M9 12h6M9 15.5h6M9 19h3.5" stroke={stroke} strokeWidth="1.55" strokeLinecap="round" />
        </svg>
      );
    case "special":
      return (
        <svg {...common}>
          <path
            d="M12 3.5l1.4 4.2H18l-3.6 2.7 1.4 4.3L12 12.8 8.2 14.7l1.4-4.3L6 7.7h4.6L12 3.5z"
            stroke={stroke}
            strokeWidth="1.55"
            strokeLinejoin="round"
          />
          <path d="M7 19.5h10" stroke={stroke} strokeWidth="1.55" strokeLinecap="round" />
        </svg>
      );
    case "pnl":
      return (
        <svg {...common}>
          <path
            d="M4.5 16.5l4.2-4.2 3.1 2.4 6.7-7.2"
            stroke={stroke}
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14.5 7.5h5v5"
            stroke={stroke}
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M4.5 19.5h15" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
