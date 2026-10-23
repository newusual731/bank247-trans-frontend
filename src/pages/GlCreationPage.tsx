import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { GlModuleTabs } from "../components/GlModuleTabs";
import { GL_ACCOUNT_CLASSES } from "../data/accountTypeOptions";
import "./GlCreationPage.css";
import "./GlEntryModals.css";
import { ViewDetailsModal } from "../components/feedback/ViewDetailsModal";
import { useActionFeedback } from "../components/feedback/useActionFeedback";
import { ApiError } from "../lib/apiClient";
import {
  activateGlAccount,
  createGlAccount,
  createFinancialPeriod,
  closeFinancialPeriod,
  deactivateGlAccount,
  getFinancialPeriod,
  listGlAccounts,
} from "../api/ledger";

const NATURES = ["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"] as const;
const CURRENCIES = ["NGN", "USD", "EUR"] as const;

type GlRow = {
  code: string;
  name: string;
  accountType: string;
  status: string;
  createdBy: string;
};

type ModalState =
  | { kind: "add" }
  | { kind: "edit"; row: GlRow }
  | { kind: "view"; row: GlRow }
  | null;

const STATUS_FILTERS = ["All", "ACTIVE", "INACTIVE"] as const;
const NATURE_FILTERS = ["All", ...GL_ACCOUNT_CLASSES] as const;
const PAGE_SIZE = 20;

function mapNature(accountType: string): string {
  const t = accountType.toLowerCase();
  if (t.includes("liab")) return "LIABILITY";
  if (t.includes("equity") || t.includes("capital")) return "EQUITY";
  if (t.includes("income") || t.includes("revenue")) return "INCOME";
  if (t.includes("expense") || t.includes("expen")) return "EXPENSE";
  return "ASSET";
}

function mapRow(g: Record<string, unknown>): GlRow {
  return {
    code: String(g.code ?? ""),
    name: String(g.description ?? ""),
    accountType: String(g.nature ?? ""),
    status: String(g.status ?? ""),
    createdBy: "—",
  };
}

export function GlCreationPage() {
  const [rows, setRows] = useState<GlRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [natureFilter, setNatureFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [periodCode, setPeriodCode] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [periodBusy, setPeriodBusy] = useState(false);
  const { showSuccess, feedbackUi } = useActionFeedback();

  const fromIdx = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const toIdx = Math.min((page + 1) * PAGE_SIZE, totalElements);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [natureFilter, statusFilter, debouncedSearch]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchSize = debouncedSearch ? 100 : PAGE_SIZE;
        const fetchPage = debouncedSearch ? 0 : page;
        const res = await listGlAccounts({
          page: fetchPage,
          size: fetchSize,
          status: statusFilter !== "All" ? statusFilter : undefined,
          nature: natureFilter !== "All" ? mapNature(natureFilter) : undefined,
        });
        if (cancelled) return;
        const content =
          res && typeof res === "object" && "content" in res && Array.isArray((res as { content: unknown }).content)
            ? (res as { content: Record<string, unknown>[] }).content
            : [];
        let mapped = content.map(mapRow);
        if (debouncedSearch) {
          mapped = mapped.filter(
            (r) =>
              r.code.toLowerCase().includes(debouncedSearch) ||
              r.name.toLowerCase().includes(debouncedSearch) ||
              r.accountType.toLowerCase().includes(debouncedSearch),
          );
          setTotalElements(mapped.length);
          setTotalPages(Math.max(1, Math.ceil(mapped.length / PAGE_SIZE) || 1));
          const start = page * PAGE_SIZE;
          setRows(mapped.slice(start, start + PAGE_SIZE));
        } else {
          const pageRes = res as { totalPages?: number; totalElements?: number };
          setTotalPages(Math.max(1, pageRes.totalPages || 1));
          setTotalElements(pageRes.totalElements ?? mapped.length);
          setRows(mapped);
        }
      } catch (e) {
        if (!cancelled) {
          setRows([]);
          setTotalElements(0);
          setTotalPages(1);
          setError(
            e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Failed to load GL accounts",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [natureFilter, statusFilter, debouncedSearch, page, refreshKey]);

  function exportCsv() {
    const header = ["GL Code", "GL Name", "Account Type", "Status", "Created By"];
    const lines = [
      header.join(","),
      ...rows.map((r) =>
        [r.code, r.name, r.accountType, r.status, r.createdBy]
          .map((v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v))
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gl-accounts.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="glc">
      {feedbackUi}
      <GlModuleTabs />
      <h1>GL Creation</h1>
      {error ? <p className="ctp-error" role="alert">{error}</p> : null}

      <div className="glc-filters">
        <label className="glc-field">
          <span>Account Type</span>
          <div className="glc-select">
            <select value={natureFilter} onChange={(e) => setNatureFilter(e.target.value)}>
              {NATURE_FILTERS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="glc-field">
          <span>Status</span>
          <div className="glc-select">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {STATUS_FILTERS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="glc-field glc-field--search">
          <span>Search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Code or name"
          />
        </label>
      </div>

      <div className="glc-toolbar">
        <button type="button" className="glc-btn glc-btn--primary" onClick={() => setModal({ kind: "add" })}>
          +Create GL
        </button>
        <div className="glc-toolbar-right">
          <button type="button" className="glc-btn glc-btn--export" onClick={exportCsv} disabled={loading || rows.length === 0}>
            <ExportIcon />
            Export
          </button>
          <button type="button" className="glc-btn glc-btn--print" onClick={() => window.print()}>
            <PrintIcon />
            Print
          </button>
        </div>
      </div>

      <div className="glc-table-wrap">
        <table className="glc-table">
          <thead>
            <tr>
              <th>GL Code</th>
              <th>GL Name</th>
              <th>Account Type</th>
              <th>Status</th>
              <th>Created By</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="glc-empty">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="glc-empty">
                  No GL accounts yet. Use +Create GL to add one.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.code}>
                  <td>{row.code}</td>
                  <td>{row.name}</td>
                  <td>{row.accountType}</td>
                  <td>
                    <span className={`glc-badge${row.status.toUpperCase() === "INACTIVE" ? " is-off" : ""}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>{row.createdBy}</td>
                  <td>
                    <div className="glc-actions">
                      <button type="button" onClick={() => setModal({ kind: "view", row })}>
                        View
                      </button>
                      <span aria-hidden>·</span>
                      <button type="button" className="glc-edit" onClick={() => setModal({ kind: "edit", row })}>
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="glc-pager">
        <span>{loading ? "…" : totalElements === 0 ? "0 results" : `${fromIdx}–${toIdx} of ${totalElements}`}</span>
        <div className="glc-pager-actions">
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

      <section className="glc-period">
        <h2>Financial Period</h2>
        <div className="glc-period-row">
          <label className="glc-field">
            <span>Period code</span>
            <input
              value={periodCode}
              onChange={(e) => setPeriodCode(e.target.value)}
              placeholder="2026-Q1"
            />
          </label>
          <label className="glc-field">
            <span>Start</span>
            <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          </label>
          <label className="glc-field">
            <span>End</span>
            <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
          </label>
          <div className="glc-period-actions">
            <button
              type="button"
              className="glc-btn glc-btn--primary"
              disabled={periodBusy}
              onClick={() =>
                void (async () => {
                  setPeriodBusy(true);
                  setError(null);
                  try {
                    await createFinancialPeriod({
                      periodCode: periodCode.trim(),
                      startDate: periodStart,
                      endDate: periodEnd,
                    });
                    showSuccess(`Period ${periodCode} created`);
                  } catch (e) {
                    setError(
                      e instanceof ApiError
                        ? e.message
                        : e instanceof Error
                          ? e.message
                          : "Period create failed",
                    );
                  } finally {
                    setPeriodBusy(false);
                  }
                })()
              }
            >
              Create period
            </button>
            <button
              type="button"
              className="glc-btn glc-btn--outline"
              disabled={periodBusy || !periodCode.trim()}
              onClick={() =>
                void (async () => {
                  setPeriodBusy(true);
                  setError(null);
                  try {
                    const p = await getFinancialPeriod(periodCode.trim());
                    window.alert(JSON.stringify(p, null, 2).slice(0, 800));
                  } catch (e) {
                    setError(
                      e instanceof ApiError
                        ? e.message
                        : e instanceof Error
                          ? e.message
                          : "Period lookup failed",
                    );
                  } finally {
                    setPeriodBusy(false);
                  }
                })()
              }
            >
              Get period
            </button>
            <button
              type="button"
              className="glc-btn glc-btn--ghost"
              disabled={periodBusy || !periodCode.trim()}
              onClick={() =>
                void (async () => {
                  setPeriodBusy(true);
                  setError(null);
                  try {
                    await closeFinancialPeriod(periodCode.trim());
                    showSuccess(`Period ${periodCode} closed`);
                  } catch (e) {
                    setError(
                      e instanceof ApiError
                        ? e.message
                        : e instanceof Error
                          ? e.message
                          : "Period close failed",
                    );
                  } finally {
                    setPeriodBusy(false);
                  }
                })()
              }
            >
              Close period
            </button>
          </div>
        </div>
      </section>

      {modal?.kind === "add" || modal?.kind === "edit"
        ? createPortal(
            <AddGlModal
              mode={modal.kind}
              initial={modal.kind === "edit" ? modal.row : undefined}
              onClose={() => setModal(null)}
              onDone={async (message) => {
                showSuccess(message);
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
              title="View GL Account"
              fields={[
                { label: "GL Code", value: modal.row.code },
                { label: "GL Name", value: modal.row.name },
                { label: "Account Type", value: modal.row.accountType },
                { label: "Status", value: modal.row.status },
                { label: "Created By", value: modal.row.createdBy },
              ]}
              onClose={() => setModal(null)}
            />,
            document.body,
          )
        : null}
    </div>
  );
}

function AddGlModal({
  mode,
  initial,
  onClose,
  onDone,
}: {
  mode: "add" | "edit";
  initial?: GlRow;
  onClose: () => void;
  onDone: (message: string) => void | Promise<void>;
}) {
  const isEdit = mode === "edit";
  const [code, setCode] = useState(initial?.code ?? "");
  const [description, setDescription] = useState(initial?.name ?? "");
  const [nature, setNature] = useState<string>(
    initial?.accountType && NATURES.includes(initial.accountType.toUpperCase() as (typeof NATURES)[number])
      ? initial.accountType.toUpperCase()
      : "ASSET",
  );
  const [parentCode, setParentCode] = useState("");
  const [currency, setCurrency] = useState<string>("NGN");
  const [postable, setPostable] = useState(true);
  const [status, setStatus] = useState(
    initial ? (initial.status.toUpperCase() === "ACTIVE" ? "ACTIVE" : "INACTIVE") : "ACTIVE",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  async function submit() {
    setError(null);
    if (isEdit) {
      const glCode = (initial?.code ?? code).trim().toUpperCase();
      if (!glCode) {
        setError("GL code is required");
        return;
      }
      setBusy(true);
      try {
        if (status === "ACTIVE") {
          await activateGlAccount(glCode);
          await onDone(`GL ${glCode} activated`);
        } else {
          await deactivateGlAccount(glCode);
          await onDone(`GL ${glCode} deactivated`);
        }
      } catch (e) {
        setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Update failed");
      } finally {
        setBusy(false);
      }
      return;
    }

    if (!code.trim() || !description.trim()) {
      setError("GL code and description are required");
      return;
    }
    setBusy(true);
    try {
      const glCode = code.trim().toUpperCase();
      await createGlAccount({
        code: glCode,
        description: description.trim(),
        nature,
        parentCode: parentCode.trim() ? parentCode.trim().toUpperCase() : undefined,
        postable,
        currency: currency.slice(0, 3).toUpperCase(),
      });
      await onDone(`GL ${glCode} created`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gem-backdrop glc-gem-backdrop" role="presentation" onClick={onClose}>
      <div
        className="gem-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="glc-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <h2 id="glc-modal-title">{isEdit ? "CHANGE STATUS" : "CREATE GL"}</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        {error ? (
          <p role="alert" className="ctp-error">
            {error}
          </p>
        ) : null}

        {isEdit ? (
          <>
            <dl className="gem-kv">
              <div>
                <dt>GL Code</dt>
                <dd>{initial?.code ?? code}</dd>
              </div>
              <div>
                <dt>Description</dt>
                <dd>{initial?.name ?? description}</dd>
              </div>
              <div>
                <dt>Nature</dt>
                <dd>{initial?.accountType ?? nature}</dd>
              </div>
            </dl>
            <div className="gem-grid">
              <label>
                <span>Status</span>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </label>
            </div>
            <p className="gem-warn">Account name and nature cannot be changed after creation.</p>
          </>
        ) : (
          <>
            <div className="gem-grid">
              <label>
                <span>GL Code</span>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. 11600"
                  autoFocus
                />
              </label>
              <label>
                <span>Nature</span>
                <select value={nature} onChange={(e) => setNature(e.target.value)}>
                  {NATURES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Parent Code</span>
                <input
                  value={parentCode}
                  onChange={(e) => setParentCode(e.target.value)}
                  placeholder="Optional"
                />
              </label>
              <label>
                <span>Currency</span>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {CURRENCIES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Postable</span>
                <select
                  value={postable ? "true" : "false"}
                  onChange={(e) => setPostable(e.target.value === "true")}
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </label>
            </div>
            <label className="gem-desc">
              <span>Description</span>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Account name / description"
              />
            </label>
          </>
        )}

        <footer>
          <button type="button" className="gem-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="gem-primary" disabled={busy} onClick={() => void submit()}>
            {busy ? (isEdit ? "Updating…" : "Creating…") : isEdit ? "Update status" : "Create GL"}
          </button>
        </footer>
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
      <path d="M7 13h10v7H7v-7z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
