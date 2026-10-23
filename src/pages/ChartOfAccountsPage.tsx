import { useEffect, useState } from "react";
import { GlModuleTabs } from "../components/GlModuleTabs";
import { SkeletonTableBody } from "../components/skeleton";
import "./ChartOfAccountsPage.css";
import { ApiError } from "../lib/apiClient";
import {
  activateGlAccount,
  deactivateGlAccount,
  listGlAccounts,
  type GlAccountSummary,
} from "../api/ledger";
import { formatTxnMoney } from "../api/transactions";

type CoaRow = {
  code: string;
  description: string;
  nature: string;
  status: string;
  parentCode: string;
  accountLevel: number;
  postable: boolean;
  currency: string;
  balance: string;
  createdAt: string;
};

const NATURE_OPTIONS = ["All", "ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"] as const;
const STATUS_OPTIONS = ["All", "ACTIVE", "INACTIVE"] as const;

function formatCreatedAt(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function mapRow(g: GlAccountSummary): CoaRow {
  return {
    code: g.code || "—",
    description: g.description || "—",
    nature: g.nature || "—",
    status: g.status || "—",
    parentCode: g.parentCode || "—",
    accountLevel: g.accountLevel ?? 0,
    postable: Boolean(g.postable),
    currency: (g.currency || "NGN").toUpperCase(),
    balance: g.balance == null || g.balance === "" ? "—" : formatTxnMoney(g.balance, g.currency || "NGN"),
    createdAt: formatCreatedAt(g.createdAt),
  };
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function ChartOfAccountsPage() {
  const [nature, setNature] = useState<string>("All");
  const [status, setStatus] = useState<string>("ACTIVE");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;
  const [refreshKey, setRefreshKey] = useState(0);
  const [busyCode, setBusyCode] = useState<string | null>(null);

  const [rows, setRows] = useState<CoaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fromIdx = totalElements === 0 ? 0 : page * pageSize + 1;
  const toIdx = Math.min((page + 1) * pageSize, totalElements);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [nature, status, debouncedSearch]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        // Fetch a page; when searching by code/name, pull a larger page then filter client-side
        // for the current catalog size (seed CoA is modest). Server still paginates when not searching.
        const fetchSize = debouncedSearch ? 100 : pageSize;
        const fetchPage = debouncedSearch ? 0 : page;
        const res = await listGlAccounts({
          page: fetchPage,
          size: fetchSize,
          status: status !== "All" ? status : undefined,
          nature: nature !== "All" ? nature : undefined,
        });
        if (cancelled) return;
        let mapped = (res.content ?? []).map(mapRow);
        if (debouncedSearch) {
          mapped = mapped.filter(
            (r) =>
              r.code.toLowerCase().includes(debouncedSearch) ||
              r.description.toLowerCase().includes(debouncedSearch) ||
              r.parentCode.toLowerCase().includes(debouncedSearch),
          );
          setTotalElements(mapped.length);
          setTotalPages(Math.max(1, Math.ceil(mapped.length / pageSize) || 1));
          const start = page * pageSize;
          setRows(mapped.slice(start, start + pageSize));
        } else {
          setTotalPages(Math.max(1, res.totalPages || 1));
          setTotalElements(res.totalElements ?? 0);
          setRows(mapped);
        }
      } catch (e) {
        if (!cancelled) {
          setRows([]);
          setTotalElements(0);
          setTotalPages(1);
          setLoadError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Failed to load CoA");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nature, status, debouncedSearch, page, refreshKey]);

  async function toggleGl(code: string, activate: boolean) {
    setBusyCode(code);
    setActionError(null);
    try {
      if (activate) await activateGlAccount(code);
      else await deactivateGlAccount(code);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "GL status change failed");
    } finally {
      setBusyCode(null);
    }
  }

  function onExport() {
    const header = [
      "createdAt",
      "code",
      "description",
      "nature",
      "parentCode",
      "level",
      "postable",
      "status",
      "currency",
      "balance",
    ];
    const lines = [header.join(",")];
    for (const r of rows) {
      lines.push(
        [
          r.createdAt,
          r.code,
          r.description,
          r.nature,
          r.parentCode,
          String(r.accountLevel),
          r.postable ? "true" : "false",
          r.status,
          r.currency,
          r.balance,
        ]
          .map(escapeCsv)
          .join(","),
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chart-of-accounts.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="coa" aria-busy={loading}>
      <GlModuleTabs />
      <div className="coa-head">
        <div>
          <h1>Chart of Accounts</h1>
          {loadError ? <p role="alert">{loadError}</p> : null}
          {actionError ? <p role="alert">{actionError}</p> : null}
          <button type="button" className="coa-export" onClick={onExport} disabled={loading || rows.length === 0}>
            <ExportIcon />
            Export
          </button>
        </div>
        <div className="coa-toolbar">
          <label className="coa-field coa-field--search">
            <span>Search</span>
            <input
              type="search"
              placeholder="Code / name / parent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label className="coa-field">
            <span>Nature</span>
            <div className="coa-select">
              <select value={nature} onChange={(e) => setNature(e.target.value)}>
                {NATURE_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o === "All" ? "All" : o.charAt(0) + o.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </label>
          <label className="coa-field">
            <span>Status</span>
            <div className="coa-select">
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o === "All" ? "All" : o.charAt(0) + o.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </label>
        </div>
      </div>

      <div className="coa-table-wrap">
        <table className="coa-table">
          <thead>
            <tr>
              <th>Date Created</th>
              <th>GL Code</th>
              <th>Ledger Name</th>
              <th>Nature</th>
              <th>Parent</th>
              <th>Level</th>
              <th>Postable</th>
              <th>Status</th>
              <th>Balance</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTableBody rows={8} columns={["sm", "sm", "md", "sm", "sm", "xs", "xs", "sm", "sm", "sm"]} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={10}>No GL accounts for this filter</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.code}>
                  <td>{row.createdAt}</td>
                  <td>{row.code}</td>
                  <td>{row.description}</td>
                  <td>{row.nature}</td>
                  <td>{row.parentCode}</td>
                  <td>{row.accountLevel}</td>
                  <td>{row.postable ? "Yes" : "No"}</td>
                  <td>
                    <span className={`coa-pill${row.status === "ACTIVE" ? " coa-pill--active" : " coa-pill--inactive"}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>{row.balance}</td>
                  <td>
                    {row.status === "ACTIVE" ? (
                      <button
                        type="button"
                        className="coa-row-action"
                        disabled={busyCode === row.code}
                        onClick={() => void toggleGl(row.code, false)}
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="coa-row-action"
                        disabled={busyCode === row.code}
                        onClick={() => void toggleGl(row.code, true)}
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="coa-pager">
        <span>{loading ? "…" : totalElements === 0 ? "0 results" : `${fromIdx}–${toIdx} of ${totalElements}`}</span>
        <div className="coa-pager-actions">
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
    </div>
  );
}

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
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
