import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  formatDeltaPct,
  formatMoney,
  getDashboardOverview,
  getDashboardTransactions,
  getPendingTransactionCount,
  type DashboardDailyJournal,
  type DashboardOverview,
  type DashboardTxnRow,
} from "../api/dashboard";
import { ApiError } from "../lib/apiClient";
import { DashboardOverviewSkeleton, Skeleton, SkeletonTableBody } from "../components/skeleton";
import "./WelcomeDashboardPage.css";

const PAGE_SIZE = 5;
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function WelcomeDashboardPage() {
  const { username } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [txns, setTxns] = useState<DashboardTxnRow[]>([]);
  const [txnPage, setTxnPage] = useState(0);
  const [txnTotalPages, setTxnTotalPages] = useState(1);
  const [txnTotal, setTxnTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [ovResult, pending] = await Promise.all([
          getDashboardOverview({ journalDays: 7 }).then(
            (ov) => ({ ok: true as const, ov }),
            (err: unknown) => ({ ok: false as const, err }),
          ),
          getPendingTransactionCount(),
        ]);
        if (cancelled) return;
        setPendingCount(pending);
        if (ovResult.ok) {
          setOverview(ovResult.ov);
          setError(null);
        } else {
          setError(ovResult.err instanceof ApiError ? ovResult.err.message : "Unable to load dashboard KPIs");
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Unable to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setTxLoading(true);
      try {
        const page = await getDashboardTransactions({
          page: txnPage,
          size: PAGE_SIZE,
          q: debouncedQuery || undefined,
        });
        if (cancelled) return;
        setTxns(page.rows);
        setTxnTotal(page.totalElements);
        setTxnTotalPages(Math.max(1, page.totalPages || 1));
        if (page.page !== txnPage && page.totalPages > 0 && page.page < page.totalPages) {
          setTxnPage(page.page);
        }
      } catch (err) {
        if (cancelled) return;
        setTxns([]);
        setTxnTotal(0);
        setTxnTotalPages(1);
        // Keep KPIs visible; surface txn errors only when overview also failed
        if (!overview) {
          setError(err instanceof ApiError ? err.message : "Unable to load transactions");
        }
      } finally {
        if (!cancelled) setTxLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [txnPage, debouncedQuery, overview]);

  const currency = overview?.currency || "NGN";
  const kpis = useMemo(() => {
    const assetsDelta = formatDeltaPct(overview?.kpis.assetsDeltaPct);
    const liabDelta = formatDeltaPct(overview?.kpis.liabilitiesDeltaPct);
    const pnlDelta = formatDeltaPct(overview?.kpis.netProfitDeltaPct);
    return [
      {
        label: "Total Asset",
        value: overview ? formatMoney(overview.kpis.totalAssets, currency) : "—",
        delta: assetsDelta.text,
        tone: assetsDelta.tone === "down" ? ("down" as const) : ("up" as const),
      },
      {
        label: "Total Liability",
        value: overview ? formatMoney(overview.kpis.totalLiabilities, currency) : "—",
        delta: liabDelta.text,
        tone: liabDelta.tone === "up" ? ("down" as const) : ("up" as const),
      },
      {
        label: "Net Profit & Loss",
        value: overview ? formatMoney(overview.kpis.netProfit, currency) : "—",
        delta: pnlDelta.text,
        tone: pnlDelta.tone === "down" ? ("down" as const) : ("up" as const),
      },
      {
        label: "Pending",
        value: String(pendingCount),
        delta: pendingCount > 0 ? `${pendingCount} open` : "0 open",
        tone: "warn" as const,
      },
    ];
  }, [overview, pendingCount, currency]);

  const bars = useMemo(() => buildBars(overview?.dailyJournal ?? []), [overview]);
  const chartTotal = bars.reduce((s, b) => s + b.total, 0);
  const safePage = Math.min(txnPage, Math.max(0, txnTotalPages - 1));
  const fromIdx = txnTotal === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const toIdx = Math.min((safePage + 1) * PAGE_SIZE, txnTotal);

  function onSearchChange(value: string) {
    setQuery(value);
    setTxnPage(0);
  }

  const showOverviewSkeleton = loading && !overview;
  /** Full table skeleton on first load / empty search; keep rows visible while paging. */
  const showTxSkeleton = txLoading && txns.length === 0;

  return (
    <div className="wdash" aria-busy={loading || txLoading}>
      <header className="wdash-welcome">
        <h1>{`Welcome${username ? `, ${username}` : "!"}`}</h1>
        <p>{greeting}</p>
      </header>

      {error ? (
        <p className="wdash-error" role="alert">
          {error}
        </p>
      ) : null}

      {showOverviewSkeleton ? (
        <DashboardOverviewSkeleton />
      ) : (
        <>
          <div className="wdash-kpis">
            {kpis.map((k) => (
              <article key={k.label} className={`wdash-kpi is-${k.tone}`}>
                <div className="wdash-kpi-top">
                  <span className="wdash-kpi-icon" aria-hidden />
                  <span className="wdash-kpi-delta">{k.delta}</span>
                </div>
                <h2>{k.label}</h2>
                <strong>{k.value}</strong>
                <svg className="wdash-spark" viewBox="0 0 120 36" aria-hidden>
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    points={
                      k.tone === "down"
                        ? "0,8 20,12 40,10 60,22 80,18 100,28 120,24"
                        : "0,28 20,22 40,24 60,14 80,16 100,8 120,10"
                    }
                  />
                </svg>
              </article>
            ))}
          </div>

          <section className="wdash-chart-card">
            <div className="wdash-chart-head">
              <h3>Daily Journal Entry</h3>
              <span className="wdash-muted">{overview?.asOf ? `As of ${overview.asOf}` : "Last 7 days"}</span>
            </div>
            <div className="wdash-bars">
              {bars.map((b) => (
                <div key={b.day} className="wdash-bar-col">
                  <span className="wdash-bar-total">{b.total.toLocaleString()}</span>
                  <div className="wdash-bar-stack">
                    <i style={{ flex: Math.max(b.p3, 0.01) }} className="is-p3" />
                    <i style={{ flex: Math.max(b.p2, 0.01) }} className="is-p2" />
                    <i style={{ flex: Math.max(b.p1, 0.01) }} className="is-p1" />
                  </div>
                  <span>{b.day}</span>
                </div>
              ))}
            </div>
            <div className="wdash-chart-foot">
              <div>
                <strong>{formatMoney(chartTotal, currency)}</strong>
                <em className="is-flat">7-day movement</em>
              </div>
              <div className="wdash-legend">
                <label>
                  <input type="checkbox" defaultChecked readOnly /> Debit
                </label>
                <label>
                  <input type="checkbox" defaultChecked readOnly /> Credit
                </label>
                <label>
                  <input type="checkbox" defaultChecked readOnly /> Net
                </label>
              </div>
            </div>
          </section>
        </>
      )}

      <section className="wdash-tx">
        <div className="wdash-tx-head">
          <h3>Recent Transactions</h3>
          <label className="wdash-tx-search">
            <SearchIcon />
            <input
              type="search"
              placeholder="Search by reference or account..."
              value={query}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Search recent transactions"
              disabled={showOverviewSkeleton}
            />
          </label>
        </div>
        <div className={`wdash-table-wrap${showTxSkeleton ? " is-loading" : ""}`}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Transaction Code</th>
                <th>Amount</th>
                <th>Account</th>
                <th>Status</th>
                <th>Sort</th>
              </tr>
            </thead>
            <tbody>
              {showTxSkeleton ? (
                <SkeletonTableBody
                  rows={PAGE_SIZE}
                  columns={["sm", "md", "sm", "sm", "xs", "pill"]}
                  rowClassName="wdash-skel-row"
                />
              ) : txns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="wdash-empty">
                    {debouncedQuery ? "No transactions match your search" : "No recent transactions"}
                  </td>
                </tr>
              ) : (
                txns.map((r) => (
                  <tr key={r.code}>
                    <td>{r.date}</td>
                    <td>{r.code}</td>
                    <td>{r.amount}</td>
                    <td>{r.account}</td>
                    <td>{r.status}</td>
                    <td>
                      <span className={`wdash-pill is-${r.status.toLowerCase()}`}>{r.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="wdash-pager">
          <span className="wdash-pager-meta">
            {showTxSkeleton ? <Skeleton size="meta" /> : txnTotal === 0 ? "0 results" : `${fromIdx}–${toIdx} of ${txnTotal}`}
          </span>
          <div className="wdash-pager-actions">
            <button type="button" disabled={safePage <= 0 || txLoading} onClick={() => setTxnPage((p) => Math.max(0, p - 1))}>
              Previous
            </button>
            <span>
              {showTxSkeleton
                ? "…"
                : `Page ${txnTotal === 0 ? 0 : safePage + 1} of ${txnTotal === 0 ? 0 : txnTotalPages}`}
            </span>
            <button
              type="button"
              disabled={safePage + 1 >= txnTotalPages || txLoading || txnTotal === 0}
              onClick={() => setTxnPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}


function buildBars(journal: DashboardDailyJournal[]) {
  if (!journal.length) {
    return DAY_LABELS.map((day) => ({ day, total: 0, p1: 1, p2: 1, p3: 1 }));
  }
  return journal.map((j) => {
    const day = DAY_LABELS[new Date(`${j.date}T12:00:00`).getDay()] ?? j.date.slice(5);
    const debit = Number(j.segments.find((s) => s.key === "DEBIT")?.amount ?? 0);
    const credit = Number(j.segments.find((s) => s.key === "CREDIT")?.amount ?? 0);
    const net = Number(j.segments.find((s) => s.key === "NET")?.amount ?? Math.abs(debit - credit));
    const total = Number(j.total) || debit + credit;
    const sum = debit + credit + net || 1;
    return {
      day,
      total,
      p1: Math.round((debit / sum) * 100) || 1,
      p2: Math.round((credit / sum) * 100) || 1,
      p3: Math.round((net / sum) * 100) || 1,
    };
  });
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
