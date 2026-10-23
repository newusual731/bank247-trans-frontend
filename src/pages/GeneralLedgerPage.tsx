import { useEffect, useMemo, useState } from "react";
import { GlModuleTabs } from "../components/GlModuleTabs";
import { SuccessModal } from "../components/SharedUiBits";
import { SkeletonTableBody } from "../components/skeleton";
import { AddEntryModal, ReverseEntryModal } from "./GlEntryModals";
import "./GeneralLedgerPage.css";
import {
  dateToFromInstant,
  dateToToInstant,
  formatTxnDate,
  formatTxnMoney,
  formatTxnStatus,
} from "../api/transactions";
import {
  exportPostingsCsv,
  listGlAccounts,
  searchPostings,
} from "../api/ledger";
import { ApiError } from "../lib/apiClient";

type LedgerRow = {
  entryId: string;
  date: string;
  debitAccount: string;
  creditAccount: string;
  amount: string;
  description: string;
  txnType: string;
  status: string;
};

const TXN_TYPE_OPTIONS = ["All", "MANUAL_JOURNAL", "SPECIAL_ENTRY", "PNL_ENTRY", "ADJUSTMENT"] as const;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

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

export function GeneralLedgerPage() {
  const [to, setTo] = useState(todayIso);
  const [from, setFrom] = useState(() => monthsAgoIso(6, todayIso()));
  const [glCode, setGlCode] = useState("");
  const [accountNum, setAccountNum] = useState("");
  const [txnType, setTxnType] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [glOptions, setGlOptions] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;
  const [refreshKey, setRefreshKey] = useState(0);

  const [addOpen, setAddOpen] = useState(false);
  const [reverseOpen, setReverseOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successTitle, setSuccessTitle] = useState("Entry Submitted successfully created!");

  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const accountFilter = useMemo(
    () => (accountNum.trim() || glCode.trim() || "").replace(/\s+/g, "") || undefined,
    [accountNum, glCode],
  );
  const typeFilter = txnType && txnType !== "All" ? txnType : undefined;
  const fromIdx = totalElements === 0 ? 0 : page * pageSize + 1;
  const toIdx = Math.min((page + 1) * pageSize, totalElements);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [from, to, debouncedSearch, accountFilter, txnType]);

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
          type: typeFilter,
        });
        if (cancelled) return;
        setTotalPages(Math.max(1, res.totalPages || 1));
        setTotalElements(res.totalElements ?? 0);
        setRows(
          (res.content ?? []).map((t) => {
            const debits = t.debitAccounts ?? [];
            const credits = t.creditAccounts ?? [];
            return {
              entryId: t.transactionReference || "—",
              date: formatTxnDate(t.postedAt),
              debitAccount: debits.join(", ") || "—",
              creditAccount: credits.join(", ") || "—",
              amount: formatTxnMoney(t.amount, t.currency || "NGN"),
              description: t.narration || "—",
              txnType: t.type || "—",
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
  }, [from, to, debouncedSearch, accountFilter, typeFilter, page, refreshKey]);

  async function onExport() {
    setExporting(true);
    setExportError(null);
    try {
      await exportPostingsCsv({
        from: dateToFromInstant(from),
        to: dateToToInstant(to),
        q: debouncedSearch || undefined,
        accountNumber: accountFilter,
        type: typeFilter,
      });
    } catch (e) {
      setExportError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  function afterMutation(title: string) {
    setSuccessTitle(title);
    setSuccessOpen(true);
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="gl" aria-busy={loading}>
      <GlModuleTabs />
      <div className="gl-head">
        <h1>General Ledger</h1>
        {loadError ? <p role="alert">{loadError}</p> : null}
        {exportError ? <p role="alert">{exportError}</p> : null}
        <div className="gl-toolbar">
          <label className="gl-search">
            <SearchIcon />
            <input
              type="search"
              placeholder="Search ref / narration"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <button type="button" className="gl-btn gl-btn--add" onClick={() => setAddOpen(true)}>
            + Add Entry
          </button>
          <button type="button" className="gl-btn gl-btn--reverse" onClick={() => setReverseOpen(true)}>
            Reverse
          </button>
          <button type="button" className="gl-btn gl-btn--export" onClick={() => void onExport()} disabled={exporting}>
            <ExportIcon />
            {exporting ? "Exporting…" : "Export"}
          </button>
        </div>
      </div>

      <div className="gl-filters">
        <div className="gl-field gl-field--range">
          <span>Date Range</span>
          <div className="gl-range">
            <span className="gl-range-label">From</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <span className="gl-range-label">To</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <label className="gl-field">
          <span>Account Num</span>
          <div className="gl-select">
            <input
              type="text"
              placeholder="All"
              value={accountNum}
              onChange={(e) => setAccountNum(e.target.value)}
            />
          </div>
        </label>
        <label className="gl-field">
          <span>GL Code</span>
          <div className="gl-select">
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
        <label className="gl-field">
          <span>Transaction Type</span>
          <div className="gl-select">
            <select value={txnType} onChange={(e) => setTxnType(e.target.value)}>
              {TXN_TYPE_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o === "All" ? "All" : o.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
      </div>

      <div className="gl-table-wrap">
        <table className="gl-table">
          <thead>
            <tr>
              <th>Entry ID</th>
              <th>Date</th>
              <th>Debit Account</th>
              <th>Credit Account</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTableBody rows={8} columns={["md", "sm", "sm", "sm", "sm", "md", "sm", "sm"]} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8}>No ledger postings for this range</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.entryId}>
                  <td>{row.entryId}</td>
                  <td>{row.date}</td>
                  <td>{row.debitAccount}</td>
                  <td>{row.creditAccount}</td>
                  <td>{row.amount}</td>
                  <td>{row.description}</td>
                  <td>{row.txnType.replace(/_/g, " ")}</td>
                  <td>{row.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="gl-pager">
        <span>{loading ? "…" : totalElements === 0 ? "0 results" : `${fromIdx}–${toIdx} of ${totalElements}`}</span>
        <div className="gl-pager-actions">
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

      {addOpen ? (
        <AddEntryModal
          transactionType="MANUAL_JOURNAL"
          onClose={() => setAddOpen(false)}
          onPosted={() => {
            setAddOpen(false);
            afterMutation("Entry Submitted successfully created!");
          }}
        />
      ) : null}
      {reverseOpen ? (
        <ReverseEntryModal
          onClose={() => setReverseOpen(false)}
          onSaved={() => {
            setReverseOpen(false);
            afterMutation("Entry successfully reversed!");
          }}
        />
      ) : null}
      {successOpen ? <SuccessModal title={successTitle} onClose={() => setSuccessOpen(false)} /> : null}
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
      <path d="M12 3v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 11l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 19h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
