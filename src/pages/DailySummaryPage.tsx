import { useEffect, useMemo, useState } from "react";
import { useActionFeedback } from "../components/feedback/useActionFeedback";
import { ApiError } from "../lib/apiClient";
import { getFinancialTrialBalanceReport } from "../api/domain";
import { listBranches } from "../api/branches";
import { formatTxnMoney } from "../api/transactions";
import { GL_ACCOUNT_CLASSES } from "../data/accountTypeOptions";
import { CURRENCY_CODES } from "../data/filterDropdownOptions";
import "./DailySummaryPage.css";

type SummaryRow = {
  glCode: string;
  glName: string;
  accountCategory: string;
  totalDebit: string;
  totalCredit: string;
  debitNum: number;
  creditNum: number;
  netMovement: string;
  netNum: number;
  currency: string;
  branchCode: string;
  opening: string;
  closing: string;
};

const GL_CLASS_FILTERS = ["All", ...GL_ACCOUNT_CLASSES] as const;
const CURRENCY_FILTERS = ["All", ...CURRENCY_CODES] as const;

function toList(res: unknown): Record<string, unknown>[] {
  if (Array.isArray(res)) return res as Record<string, unknown>[];
  if (res && typeof res === "object" && "content" in res && Array.isArray((res as { content: unknown }).content)) {
    return (res as { content: Record<string, unknown>[] }).content;
  }
  if (res && typeof res === "object" && "rows" in res && Array.isArray((res as { rows: unknown }).rows)) {
    return (res as { rows: Record<string, unknown>[] }).rows;
  }
  return [];
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function categoryLabel(raw: string): string {
  const u = raw.toUpperCase();
  if (u === "ASSET") return "Asset";
  if (u === "LIABILITY") return "Liability";
  if (u === "EQUITY") return "Equity";
  if (u === "INCOME" || u === "REVENUE") return "Income";
  if (u === "EXPENSE" || u === "EXPENSES") return "Expenses";
  return raw || "—";
}

function matchesGlClass(category: string, filter: string): boolean {
  if (filter === "All") return true;
  return categoryLabel(category).toLowerCase() === filter.toLowerCase();
}

function mapRow(r: Record<string, unknown>, fallbackBranch: string, fallbackCurrency: string): SummaryRow {
  const currency = String(r.currency ?? fallbackCurrency ?? "NGN").toUpperCase();
  const debitNum = num(r.debitMovement ?? r.totalDebit ?? r.debit);
  const creditNum = num(r.creditMovement ?? r.totalCredit ?? r.credit);
  const net = debitNum - creditNum;
  const cat = String(r.accountCategory ?? r.category ?? "");
  const glCode = String(r.glCode ?? r.accountCode ?? r.code ?? "—");
  return {
    glCode,
    glName: String(r.glName ?? r.accountName ?? r.description ?? glCode),
    accountCategory: categoryLabel(cat),
    totalDebit: formatTxnMoney(debitNum, currency),
    totalCredit: formatTxnMoney(creditNum, currency),
    debitNum,
    creditNum,
    netMovement: net === 0 ? "Balanced" : net > 0 ? "Debit" : "Credit",
    netNum: net,
    currency,
    branchCode: String(r.branchCode ?? fallbackBranch ?? "—"),
    opening: formatTxnMoney(num(r.openingBalance), currency),
    closing: formatTxnMoney(num(r.closingBalance), currency),
  };
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function exportCsv(rows: SummaryRow[], date: string) {
  const header = [
    "GL Code",
    "GL Name",
    "Account Class",
    "Opening",
    "Total Debit",
    "Total Credit",
    "Net Movement",
    "Closing",
    "Currency",
    "Branch Code",
  ];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.glCode,
        r.glName,
        r.accountCategory,
        r.opening,
        r.totalDebit,
        r.totalCredit,
        r.netMovement,
        r.closing,
        r.currency,
        r.branchCode,
      ]
        .map((v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v))
        .join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `daily-summary-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function DailySummaryPage() {
  const [date, setDate] = useState(todayIso);
  const [glClass, setGlClass] = useState<string>("All");
  const [branch, setBranch] = useState<string>("All");
  const [branchOptions, setBranchOptions] = useState<string[]>(["All"]);
  const [currency, setCurrency] = useState<string>("All");
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [generated, setGenerated] = useState(false);
  const [balanced, setBalanced] = useState<boolean | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { showSuccess, feedbackUi } = useActionFeedback();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listBranches({ status: "ACTIVE", size: 100 });
        if (cancelled) return;
        const codes = toList(res)
          .map((b) => String(b.branchCode ?? b.code ?? ""))
          .filter(Boolean);
        setBranchOptions(["All", ...Array.from(new Set(codes))]);
      } catch {
        /* keep All */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayRows = useMemo(() => {
    return rows.filter((r) => {
      if (!matchesGlClass(r.accountCategory, glClass)) return false;
      if (currency !== "All" && r.currency.toUpperCase() !== currency.toUpperCase()) return false;
      return true;
    });
  }, [rows, glClass, currency]);

  const totals = useMemo(() => {
    const debit = displayRows.reduce((s, r) => s + r.debitNum, 0);
    const credit = displayRows.reduce((s, r) => s + r.creditNum, 0);
    const cur = displayRows[0]?.currency ?? "NGN";
    return {
      debit,
      credit,
      net: debit - credit,
      currency: cur,
      debitFmt: formatTxnMoney(debit, cur),
      creditFmt: formatTxnMoney(credit, cur),
      netFmt: formatTxnMoney(Math.abs(debit - credit), cur),
    };
  }, [displayRows]);

  async function handleGenerate() {
    setBusy(true);
    setGenError(null);
    try {
      const report = (await getFinancialTrialBalanceReport({
        businessDate: date,
        branchCode: branch === "All" ? undefined : branch,
      })) as Record<string, unknown>;

      const mapped = toList(report).map((r) =>
        mapRow(r, branch === "All" ? "—" : branch, "NGN"),
      );
      setRows(mapped);
      setBalanced(typeof report.movementBalanced === "boolean" ? report.movementBalanced : null);
      setGenerated(true);
      showSuccess(
        mapped.length
          ? `Daily summary loaded for ${date} (${mapped.length} GL lines)`
          : `No trial-balance lines for ${date}`,
      );
    } catch (e) {
      setRows([]);
      setBalanced(null);
      setGenerated(true);
      setGenError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Generate failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="dsum">
      {feedbackUi}
      <h1>Daily Summary/Dashboard Report</h1>
      {genError ? (
        <p className="ctp-error" role="alert">
          {genError}
        </p>
      ) : null}
      {balanced === false ? (
        <p className="ctp-error" role="status">
          Trial balance movements are not balanced for this date.
        </p>
      ) : null}

      <div className="dsum-filters">
        <label className="dsum-field">
          <span>Business date</span>
          <div className="dsum-date">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <CalendarIcon />
          </div>
        </label>
        <label className="dsum-field">
          <span>GL Account Type</span>
          <div className="dsum-select">
            <select value={glClass} onChange={(e) => setGlClass(e.target.value)}>
              {GL_CLASS_FILTERS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="dsum-field">
          <span>Branch Code</span>
          <div className="dsum-select">
            <select value={branch} onChange={(e) => setBranch(e.target.value)}>
              {branchOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="dsum-field">
          <span>Currency</span>
          <div className="dsum-select">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCY_FILTERS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
      </div>

      <div className="dsum-actions">
        <div className="dsum-actions-left">
          <button
            type="button"
            className="dsum-btn dsum-btn--export"
            disabled={!displayRows.length}
            onClick={() => exportCsv(displayRows, date)}
          >
            <ExportIcon />
            Export
          </button>
          <button type="button" className="dsum-btn dsum-btn--print" onClick={() => window.print()}>
            <PrintIcon />
            Print
          </button>
        </div>
        <button
          type="button"
          className="dsum-btn dsum-btn--generate"
          onClick={() => void handleGenerate()}
          disabled={busy}
        >
          {busy ? "Generating…" : "Generate Summary"}
        </button>
      </div>

      {generated ? (
        <div className="dsum-table-wrap">
          <table className="dsum-table">
            <thead>
              <tr>
                <th className="is-left">GL Code</th>
                <th className="is-left">GL Name</th>
                <th>Account Class</th>
                <th>
                  <span className="dsum-th dsum-th--debit">Total Debit</span>
                </th>
                <th>
                  <span className="dsum-th dsum-th--credit">Total Credit</span>
                </th>
                <th>Net Movement</th>
                <th>Currency</th>
                <th>Branch Code</th>
              </tr>
            </thead>
            <tbody>
              {busy ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", color: "#6b7280", padding: "1.5rem" }}>
                    Loading trial balance…
                  </td>
                </tr>
              ) : displayRows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", color: "#6b7280", padding: "1.5rem" }}>
                    No GL movement lines for the selected filters.
                  </td>
                </tr>
              ) : (
                displayRows.map((row) => (
                  <tr key={`${row.glCode}-${row.currency}-${row.branchCode}`}>
                    <td className="is-left">{row.glCode}</td>
                    <td className="is-left" title={`Open ${row.opening} · Close ${row.closing}`}>
                      {row.glName}
                    </td>
                    <td>{row.accountCategory}</td>
                    <td>{row.totalDebit}</td>
                    <td>{row.totalCredit}</td>
                    <td>{row.netMovement}</td>
                    <td>{row.currency}</td>
                    <td>{row.branchCode}</td>
                  </tr>
                ))
              )}
              {displayRows.length > 0 ? (
                <tr className="dsum-total">
                  <td className="is-left">TOTAL</td>
                  <td />
                  <td />
                  <td>
                    <div className="dsum-total-cell">
                      <strong>{totals.debitFmt}</strong>
                      <span className="dsum-net">Total debit</span>
                    </div>
                  </td>
                  <td>
                    <div className="dsum-total-cell">
                      <strong>{totals.creditFmt}</strong>
                      <span className="dsum-net">Net {totals.netFmt}</span>
                    </div>
                  </td>
                  <td>{totals.net === 0 ? "Balanced" : totals.net > 0 ? "Debit" : "Credit"}</td>
                  <td>{totals.currency}</td>
                  <td />
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="dsum-empty">Select filters and click Generate Summary.</p>
      )}
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

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3.5v3M16 3.5v3M3.5 9.5h17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 16V4M12 4l-4 4M12 4l4 4M5 20h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 8V4h10v4M7 17H5a2 2 0 01-2-2v-5a2 2 0 012-2h14a2 2 0 012 2v5a2 2 0 01-2 2h-2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="7" y="14" width="10" height="6" rx="1" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
