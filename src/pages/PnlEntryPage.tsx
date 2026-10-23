import { useEffect, useMemo, useState } from "react";
import "./PnlEntryPage.css";
import {
  dateToFromInstant,
  dateToToInstant,
  formatTxnDate,
  formatTxnMoney,
  formatTxnStatus,
} from "../api/transactions";
import {
  exportPostingsCsv,
  getLedgerPosting,
  getPostingAnalytics,
  searchPostings,
  type PostingAnalytics,
  type PostingGrowthPoint,
  type PostingMixSlice,
} from "../api/postings";
import { listGlAccounts } from "../api/ledger";
import { ApiError } from "../lib/apiClient";
import { SkeletonTableBody } from "../components/skeleton";
import { AddEntryModal } from "./GlEntryModals";

type PnlRow = {
  refId: string;
  date: string;
  debitAccount: string;
  creditAccount: string;
  description: string;
  amount: string;
  status: "Pending" | "Posted" | "Failed" | "Reversed" | "Unknown";
};

const PNL_TYPE = "PNL_ENTRY" as const;
const DONUT_COLORS = ["#60a5fa", "#fbbf24", "#f472b6", "#ef4444"] as const;
const DONUT_CIRC = 327;
const EMPTY_ARC_LENGTHS = [90, 95, 80, 40] as const;

function monthsAgoIso(months: number, endDate: string): string {
  const end = new Date(`${endDate}T12:00:00.000Z`);
  if (Number.isNaN(end.getTime())) {
    const d = new Date();
    d.setUTCMonth(d.getUTCMonth() - months);
    return d.toISOString().slice(0, 10);
  }
  end.setUTCMonth(end.getUTCMonth() - months);
  return end.toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function num(v: string | number | null | undefined): number {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function PnlEntryPage() {
  const [expanded, setExpanded] = useState(false);
  const [entryOpen, setEntryOpen] = useState(false);
  const [accountNum, setAccountNum] = useState("");
  const [glCode, setGlCode] = useState("");
  const [search, setSearch] = useState("");
  const [to, setTo] = useState(todayIso);
  const [from, setFrom] = useState(() => monthsAgoIso(6, todayIso()));
  const [chatWindow, setChatWindow] = useState<"6" | "12">("6");
  const [growthGranularity, setGrowthGranularity] = useState<"MONTHLY" | "YEARLY">("YEARLY");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [glOptions, setGlOptions] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  const [rows, setRows] = useState<PnlRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<PostingAnalytics | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const accountFilter = useMemo(
    () => (accountNum.trim() || glCode.trim() || "").replace(/\s+/g, "") || undefined,
    [accountNum, glCode],
  );
  const fromIdx = totalElements === 0 ? 0 : page * pageSize + 1;
  const toIdx = Math.min((page + 1) * pageSize, totalElements);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setFrom(monthsAgoIso(Number(chatWindow), to));
  }, [chatWindow, to]);

  useEffect(() => {
    setPage(0);
  }, [from, to, debouncedSearch, accountFilter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const glPage = await listGlAccounts({ status: "ACTIVE", size: 100 });
        if (cancelled) return;
        setGlOptions(
          (glPage.content ?? [])
            .map((g) => g.code)
            .filter(Boolean)
            .sort(),
        );
      } catch {
        if (!cancelled) setGlOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await searchPostings({
          page,
          size: pageSize,
          from: dateToFromInstant(from),
          to: dateToToInstant(to),
          q: debouncedSearch || undefined,
          accountNumber: accountFilter,
          type: PNL_TYPE,
        });
        if (cancelled) return;
        setTotalPages(Math.max(1, res.totalPages || 1));
        setTotalElements(res.totalElements ?? 0);
        setRows(
          (res.content ?? []).map((t) => {
            const debits = t.debitAccounts ?? [];
            const credits = t.creditAccounts ?? [];
            return {
              refId: t.transactionReference || "—",
              date: formatTxnDate(t.postedAt),
              debitAccount: debits.join(", ") || "—",
              creditAccount: credits.join(", ") || "—",
              description: t.narration || "—",
              amount: formatTxnMoney(t.amount, t.currency || "NGN"),
              status: formatTxnStatus(t.status),
            };
          }),
        );
      } catch (e) {
        if (!cancelled) {
          setRows([]);
          setTotalElements(0);
          setTotalPages(1);
          setLoadError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Load failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [from, to, debouncedSearch, accountFilter, page, refreshKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setAnalyticsError(null);
      try {
        const res = await getPostingAnalytics({
          from: dateToFromInstant(from),
          to: dateToToInstant(to),
          accountNumber: accountFilter,
          type: PNL_TYPE,
          q: debouncedSearch || undefined,
          growth: growthGranularity,
        });
        if (!cancelled) setAnalytics(res);
      } catch (e) {
        if (!cancelled) {
          setAnalytics(null);
          setAnalyticsError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Analytics failed");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [from, to, accountFilter, debouncedSearch, growthGranularity, refreshKey]);

  async function onExport() {
    setExporting(true);
    setExportError(null);
    try {
      await exportPostingsCsv({
        from: dateToFromInstant(from),
        to: dateToToInstant(to),
        q: debouncedSearch || undefined,
        accountNumber: accountFilter,
        type: PNL_TYPE,
      });
    } catch (e) {
      setExportError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className={`pnl${expanded ? " is-expanded" : ""}`} aria-busy={loading}>
      <div className="pnl-head">
        <h1>P&L Entry</h1>
        {loadError ? <p role="alert">{loadError}</p> : null}
        {exportError ? <p role="alert">{exportError}</p> : null}
        <div className="pnl-head-right">
          <button type="button" className="pnl-export pnl-export--ghost" onClick={() => setEntryOpen(true)}>
            Add Entry
          </button>
          <button type="button" className="pnl-export" onClick={() => void onExport()} disabled={exporting}>
            <ExportIcon />
            {exporting ? "Exporting…" : "Export"}
          </button>
          <label className="pnl-search">
            <SearchIcon />
            <input
              type="search"
              placeholder="Search ref / narration"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="pnl-filters">
        <label className="pnl-field">
          <span>Account Num</span>
          <div className="pnl-select">
            <input
              type="text"
              placeholder="All"
              value={accountNum}
              onChange={(e) => setAccountNum(e.target.value)}
            />
          </div>
        </label>
        <label className="pnl-field">
          <span>GL Code</span>
          <div className="pnl-select">
            <select value={glCode} onChange={(e) => setGlCode(e.target.value)}>
              <option value="">All</option>
              {glOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="pnl-field">
          <span>Transaction Type</span>
          <div className="pnl-select">
            <select value={PNL_TYPE} disabled>
              <option value={PNL_TYPE}>P&L Entry</option>
            </select>
            <ChevronDown />
          </div>
        </label>
      </div>

      <div className="pnl-body">
        <div className="pnl-table-wrap">
          <table className="pnl-table">
            <thead>
              <tr>
                <th>Ref ID</th>
                <th>Date</th>
                <th className="is-debit">Debit Account</th>
                <th className="is-credit">Credit Account</th>
                <th>Description</th>
                <th>Amount</th>
                {expanded ? (
                  <>
                    <th>Status</th>
                    <th>Action</th>
                  </>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTableBody rows={8} columns={["md", "sm", "sm", "sm", "md", "sm"]} />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={expanded ? 8 : 6}>No P&L entries for this range</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.refId}>
                    <td>{row.refId}</td>
                    <td>{row.date}</td>
                    <td className="is-debit">{row.debitAccount}</td>
                    <td className="is-credit">
                      <span className="pnl-pill pnl-pill--credit">{row.creditAccount}</span>
                    </td>
                    <td>{row.description}</td>
                    <td className="is-amount">{row.amount}</td>
                    {expanded ? (
                      <>
                        <td>
                          <span
                            className={`pnl-pill${row.status === "Pending" ? " pnl-pill--pending" : " pnl-pill--posted"}`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="pnl-edit"
                            onClick={() => {
                              void getLedgerPosting(row.refId).catch(() => undefined);
                              setEntryOpen(true);
                            }}
                          >
                            View
                          </button>
                        </td>
                      </>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="pnl-pager">
            <span>
              {loading ? "…" : totalElements === 0 ? "0 results" : `${fromIdx}–${toIdx} of ${totalElements}`}
            </span>
            <div className="pnl-pager-actions">
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
          <button type="button" className="pnl-more" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Collapse" : "View More"}
          </button>
        </div>

        {!expanded ? (
          <aside className="pnl-rail">
            <div className="pnl-dates">
              <span>Date Range</span>
              <div>
                <label>
                  From
                  <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </label>
                <label>
                  To
                  <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </label>
              </div>
            </div>

            <div className="pnl-card">
              <div className="pnl-card-head">
                <h3>Account Chart</h3>
                <select
                  value={chatWindow}
                  onChange={(e) => setChatWindow(e.target.value === "12" ? "12" : "6")}
                >
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                </select>
              </div>
              {analyticsError ? <p role="alert">{analyticsError}</p> : null}
              <AccountChatDonut
                mix={analytics?.mix ?? []}
                totalAmount={analytics?.totalAmount ?? 0}
                currency={analytics?.currency || "NGN"}
                highlightLabel={analytics?.highlightLabel || "—"}
              />
              <div className="pnl-legend">
                <span>
                  <i className="is-blue" /> SMT
                </span>
                <span>
                  <i className="is-gold" /> Special E
                </span>
                <span>
                  <i className="is-pink" /> P&L
                </span>
                <span>
                  <i className="is-red" /> Other
                </span>
              </div>
            </div>

            <div className="pnl-card">
              <div className="pnl-card-head">
                <h3>Growth</h3>
                <select
                  value={growthGranularity}
                  onChange={(e) => setGrowthGranularity(e.target.value === "MONTHLY" ? "MONTHLY" : "YEARLY")}
                >
                  <option value="YEARLY">Yearly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>
              <GrowthChart points={analytics?.growth ?? []} />
            </div>

            <div className="pnl-stats">
              <div>
                <span>Top month</span>
                <strong>{analytics?.topMonth?.label || "—"}</strong>
                <em>{analytics?.topMonth?.detail || "—"}</em>
              </div>
              <div>
                <span>Top year</span>
                <strong>{analytics?.topYear?.label || "—"}</strong>
                <em>{analytics?.topYear?.detail || "—"}</em>
              </div>
              <div>
                <span>Top account</span>
                <strong>{analytics?.topAccount?.label || "—"}</strong>
                <em>{analytics?.topAccount?.detail || "—"}</em>
              </div>
            </div>
          </aside>
        ) : null}
      </div>

      {entryOpen ? (
        <AddEntryModal
          transactionType="PNL_ENTRY"
          onClose={() => setEntryOpen(false)}
          onPosted={() => {
            setEntryOpen(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      ) : null}
    </div>
  );
}

function compactDonutMoney(amount: string | number, currency: string): string {
  const n = num(amount);
  const code = (currency || "NGN").toUpperCase();
  const symbol = code === "NGN" ? "₦" : code === "USD" ? "$" : code === "EUR" ? "€" : `${code} `;
  if (Math.abs(n) >= 1_000_000) return `${symbol}${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${symbol}${(n / 1_000).toFixed(1)}K`;
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${symbol}${Math.round(n).toLocaleString()}`;
  }
}

function AccountChatDonut({
  mix,
  totalAmount,
  currency,
  highlightLabel,
}: {
  mix: PostingMixSlice[];
  totalAmount: string | number;
  currency: string;
  highlightLabel: string;
}) {
  const ordered = ["STATEMENT", "SPECIAL", "PNL", "OTHER"].map((code) => {
    const found = mix.find((m) => m.code === code);
    return found ?? { code, label: code, postingCount: 0, amount: 0 };
  });
  const values = ordered.map((m) => Math.max(0, num(m.amount)));
  const total = values.reduce((s, v) => s + v, 0);
  const lengths =
    total <= 0
      ? [...EMPTY_ARC_LENGTHS]
      : (() => {
          const minLen = 14;
          const floored = values.map((v) => (v > 0 ? v : 0));
          const positiveSum = floored.reduce((s, v) => s + v, 0) || 1;
          const zeroCount = floored.filter((v) => v === 0).length;
          const reserved = zeroCount * minLen;
          const usable = Math.max(DONUT_CIRC - reserved, 1);
          return floored.map((v) => (v <= 0 ? minLen : (v / positiveSum) * usable));
        })();

  let offset = 0;
  const arcs = lengths.map((len, i) => {
    const dash = `${len} ${DONUT_CIRC}`;
    const dashOffset = -offset;
    offset += len;
    return {
      color: DONUT_COLORS[i],
      dash,
      dashOffset,
      code: ordered[i].code,
      delay: `${0.08 + i * 0.12}s`,
    };
  });
  const animKey = lengths.map((l) => Math.round(l)).join("-");

  return (
    <div className="pnl-donut" key={animKey}>
      <svg viewBox="0 0 160 160" width="168" height="168" aria-hidden>
        <circle cx="80" cy="80" r="52" fill="none" stroke="#eceff1" strokeWidth="26" />
        {arcs.map((arc) => (
          <circle
            key={arc.code}
            className="pnl-donut-arc"
            cx="80"
            cy="80"
            r="52"
            fill="none"
            stroke={arc.color}
            strokeWidth="26"
            strokeDasharray={arc.dash}
            strokeDashoffset={arc.dashOffset}
            transform="rotate(-90 80 80)"
            style={{ animationDelay: arc.delay }}
          />
        ))}
      </svg>
      <div className="pnl-donut-center">
        <strong>{compactDonutMoney(totalAmount, currency)}</strong>
        <span>{highlightLabel}</span>
      </div>
    </div>
  );
}

function GrowthChart({ points }: { points: PostingGrowthPoint[] }) {
  const values = points.map((p) => num(p.amount));
  const max = Math.max(...values, 1);
  const left = 28;
  const right = 270;
  const top = 20;
  const bottom = 100;
  const n = Math.max(points.length, 1);
  const coords = points.map((p, i) => {
    const x = points.length === 1 ? (left + right) / 2 : left + (i * (right - left)) / (n - 1);
    const y = bottom - (num(p.amount) / max) * (bottom - top);
    return `${x},${y}`;
  });
  const linePoints = coords.length > 0 ? coords.join(" ") : `${left},${bottom} ${right},${bottom}`;
  const areaPoints =
    coords.length > 0
      ? `${coords.join(" ")} ${coords.length === 1 ? right : coords[coords.length - 1]!.split(",")[0]},${bottom} ${left},${bottom}`
      : `${left},${bottom} ${right},${bottom}`;
  const labels =
    points.length === 0
      ? []
      : points.length <= 4
        ? points
        : ([
            points[0],
            points[Math.floor(points.length / 3)],
            points[Math.floor((2 * points.length) / 3)],
            points[points.length - 1],
          ].filter(Boolean) as PostingGrowthPoint[]);
  const pathLen = Math.max(points.length * 80, 240);
  const growthKey = points.map((p) => `${p.period}:${num(p.amount)}`).join("|");

  return (
    <svg
      key={growthKey}
      viewBox="0 0 280 120"
      className="pnl-growth"
      role="img"
      aria-label="Growth"
      style={{ ["--pnl-growth-len" as string]: String(pathLen) }}
    >
      <g stroke="#eef0f2" strokeWidth="1">
        {[20, 40, 60, 80, 100].map((y) => (
          <line key={y} x1="28" x2="270" y1={y} y2={y} />
        ))}
      </g>
      <polygon className="pnl-growth-area" fill="rgba(74, 222, 128, 0.28)" points={areaPoints} />
      <polyline
        className="pnl-growth-line"
        fill="none"
        stroke="#4ade80"
        strokeWidth="2"
        points={linePoints}
        pathLength={pathLen}
      />
      {labels.map((p, i) => (
        <text key={`${p.period}-${i}`} x={40 + i * 70} y="116" fontSize="9" fill="#9ca3af">
          {p.period}
        </text>
      ))}
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 11l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 19h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
