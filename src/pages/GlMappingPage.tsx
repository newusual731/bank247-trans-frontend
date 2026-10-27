import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { GlModuleTabs } from "../components/GlModuleTabs";
import "./GlMappingPage.css";
import "./GlEntryModals.css";
import { ViewDetailsModal } from "../components/feedback/ViewDetailsModal";
import { useActionFeedback } from "../components/feedback/useActionFeedback";
import { ApiError } from "../lib/apiClient";
import {
  activateProductGlMapping,
  createProductGlMapping,
  deactivateProductGlMapping,
  listGlAccounts,
  searchProductGlMappings,
  updateProductGlMapping,
  type GlAccountSummary,
  type ProductGlMapping,
  type ProductGlRole,
} from "../api/ledger";

type MappingRow = {
  id: string;
  productType: string;
  productName: string;
  glAccountType: string;
  glRole: ProductGlRole;
  glCode: string;
  glName: string;
  currency: string;
  status: string;
};

type ModalState =
  | { kind: "add" }
  | { kind: "edit"; row: MappingRow }
  | { kind: "view"; row: MappingRow }
  | null;

const PRODUCT_TYPES = [
  "Fixed Deposit",
  "Treasury Bill",
  "Loan",
  "Bond",
  "Placement",
  "Savings",
  "Current",
] as const;
const CURRENCIES = ["NGN", "USD", "EUR"] as const;
const STATUS_FILTERS = ["All", "ACTIVE", "INACTIVE"] as const;
const ROLE_FILTERS = [
  "All",
  "REPORTING",
  "PRINCIPAL",
  "INTEREST_ACCRUAL",
  "INTEREST_EXPENSE",
  "INTEREST_INCOME",
  "INTEREST_RECEIVABLE",
  "INTEREST_PAYABLE",
  "INTEREST",
  "CHARGES",
  "WHT",
  "VAT",
] as const;
const PAGE_SIZE = 20;

const ROLE_LABEL: Record<ProductGlRole, string> = {
  REPORTING: "Reporting GL",
  PRINCIPAL: "Principal GL",
  INTEREST_ACCRUAL: "Interest accrual GL",
  INTEREST_EXPENSE: "Interest expense GL",
  INTEREST_INCOME: "Interest income GL",
  INTEREST_RECEIVABLE: "Interest receivable GL",
  INTEREST_PAYABLE: "Interest payable GL",
  INTEREST: "Interest GL",
  CHARGES: "Charges GL",
  WHT: "Withholding tax GL",
  VAT: "VAT GL",
};

function mapRow(m: ProductGlMapping): MappingRow {
  return {
    id: m.id,
    productType: m.productType,
    productName: m.productName,
    glRole: m.glRole,
    glAccountType: ROLE_LABEL[m.glRole] ?? m.glRole,
    glCode: m.glCode,
    glName: m.glName || m.glCode,
    currency: m.currency,
    status: m.status,
  };
}

export function GlMappingPage() {
  const [rows, setRows] = useState<MappingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [productType, setProductType] = useState<string>("All");
  const [glRole, setGlRole] = useState<string>("All");
  const [currency, setCurrency] = useState<string>("All");
  const [status, setStatus] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const { showSuccess, feedbackUi } = useActionFeedback();

  const fromIdx = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const toIdx = Math.min((page + 1) * PAGE_SIZE, totalElements);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [productType, glRole, currency, status, debouncedSearch]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await searchProductGlMappings({
          page,
          size: PAGE_SIZE,
          productType: productType !== "All" ? productType : undefined,
          glRole: glRole !== "All" ? glRole : undefined,
          currency: currency !== "All" ? currency : undefined,
          status: status !== "All" ? status : undefined,
          q: debouncedSearch || undefined,
        });
        if (cancelled) return;
        setRows((res.content ?? []).map(mapRow));
        setTotalPages(Math.max(1, res.totalPages || 1));
        setTotalElements(res.totalElements ?? 0);
      } catch (e) {
        if (!cancelled) {
          setRows([]);
          setTotalElements(0);
          setTotalPages(1);
          setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Failed to load mappings");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productType, glRole, currency, status, debouncedSearch, page, refreshKey]);

  function exportCsv() {
    const header = ["Product Type", "Product Name", "GL Account Type", "GL Code", "GL Name", "Currency", "Status"];
    const lines = [
      header.join(","),
      ...rows.map((r) =>
        [r.productType, r.productName, r.glAccountType, r.glCode, r.glName, r.currency, r.status]
          .map((v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v))
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gl-product-mappings.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="glm">
      {feedbackUi}
      <GlModuleTabs />
      <h1>GL Mapping</h1>
      {error ? <p role="alert">{error}</p> : null}

      <div className="glm-filters">
        <label className="glm-field">
          <span>Product Type</span>
          <div className="glm-select">
            <select value={productType} onChange={(e) => setProductType(e.target.value)}>
              <option value="All">All</option>
              {PRODUCT_TYPES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="glm-field">
          <span>GL Role</span>
          <div className="glm-select">
            <select value={glRole} onChange={(e) => setGlRole(e.target.value)}>
              {ROLE_FILTERS.map((o) => (
                <option key={o} value={o}>
                  {o === "All" ? "All" : ROLE_LABEL[o as ProductGlRole]}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="glm-field">
          <span>Currency</span>
          <div className="glm-select">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="All">All</option>
              {CURRENCIES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="glm-field">
          <span>Status</span>
          <div className="glm-select">
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_FILTERS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
      </div>

      <div className="glm-actions">
        <button type="button" className="glm-btn glm-btn--primary" onClick={() => setModal({ kind: "add" })}>
          +Add New Mapping
        </button>
        <div className="glm-actions-right">
          <label className="glm-field glm-field--search">
            <span className="sr-only">Search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product / GL"
            />
          </label>
          <button
            type="button"
            className="glm-btn glm-btn--export"
            onClick={exportCsv}
            disabled={loading || rows.length === 0}
          >
            <ExportIcon />
            Export
          </button>
          <button type="button" className="glm-btn glm-btn--print" onClick={() => window.print()}>
            <PrintIcon />
            Print
          </button>
        </div>
      </div>

      <div className="glm-table-wrap">
        <table className="glm-table">
          <thead>
            <tr>
              <th>Product Type</th>
              <th>Product Name</th>
              <th>GL Account Type</th>
              <th>GL Code</th>
              <th>GL Name</th>
              <th>Currency</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", color: "#6b7280", padding: "1.5rem" }}>
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", color: "#6b7280", padding: "1.5rem" }}>
                  No mappings yet. Use +Add New Mapping.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.productType}</td>
                  <td>{row.productName}</td>
                  <td>{row.glAccountType}</td>
                  <td>{row.glCode}</td>
                  <td>{row.glName}</td>
                  <td>{row.currency}</td>
                  <td>{row.status}</td>
                  <td>
                    <div className="glm-row-actions">
                      <button type="button" onClick={() => setModal({ kind: "view", row })}>
                        View
                      </button>
                      <span aria-hidden>·</span>
                      <button type="button" className="glm-edit" onClick={() => setModal({ kind: "edit", row })}>
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

      <div className="glm-pager">
        <span>{loading ? "…" : totalElements === 0 ? "0 results" : `${fromIdx}–${toIdx} of ${totalElements}`}</span>
        <div className="glm-pager-actions">
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

      {modal?.kind === "add" || modal?.kind === "edit"
        ? createPortal(
            <AddMappingModal
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
              title="View GL Mapping"
              fields={[
                { label: "Product Type", value: modal.row.productType },
                { label: "Product Name", value: modal.row.productName },
                { label: "GL Account Type", value: modal.row.glAccountType },
                { label: "GL Code", value: modal.row.glCode },
                { label: "GL Name", value: modal.row.glName },
                { label: "Currency", value: modal.row.currency },
                { label: "Status", value: modal.row.status },
              ]}
              onClose={() => setModal(null)}
            />,
            document.body,
          )
        : null}
    </div>
  );
}

function AddMappingModal({
  mode,
  initial,
  onClose,
  onDone,
}: {
  mode: "add" | "edit";
  initial?: MappingRow;
  onClose: () => void;
  onDone: (message: string) => void | Promise<void>;
}) {
  const isEdit = mode === "edit";
  const [productType, setProductType] = useState(initial?.productType ?? PRODUCT_TYPES[0]);
  const [productName, setProductName] = useState(initial?.productName ?? "");
  const [glRole, setGlRole] = useState<ProductGlRole>(initial?.glRole ?? "PRINCIPAL");
  const [glCode, setGlCode] = useState(initial?.glCode ?? "");
  const [currency, setCurrency] = useState(initial?.currency ?? "NGN");
  const [status, setStatus] = useState(initial?.status?.toUpperCase() === "INACTIVE" ? "INACTIVE" : "ACTIVE");
  const [glOptions, setGlOptions] = useState<GlAccountSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listGlAccounts({ status: "ACTIVE", size: 100 });
        if (cancelled) return;
        setGlOptions((res.content ?? []).filter((g) => g.postable !== false));
      } catch {
        if (!cancelled) setGlOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit() {
    setError(null);
    if (isEdit && initial) {
      setBusy(true);
      try {
        await updateProductGlMapping(initial.id, {
          productName: productName.trim(),
          glRole,
          glCode: glCode.trim().toUpperCase(),
          currency,
        });
        if (status === "ACTIVE" && initial.status.toUpperCase() !== "ACTIVE") {
          await activateProductGlMapping(initial.id);
        } else if (status === "INACTIVE" && initial.status.toUpperCase() !== "INACTIVE") {
          await deactivateProductGlMapping(initial.id);
        }
        await onDone(`Mapping updated for ${productName.trim() || initial.productName}`);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Update failed");
      } finally {
        setBusy(false);
      }
      return;
    }

    if (!productName.trim() || !glCode.trim()) {
      setError("Product name and GL code are required");
      return;
    }
    setBusy(true);
    try {
      await createProductGlMapping({
        productType,
        productName: productName.trim(),
        glRole,
        glCode: glCode.trim().toUpperCase(),
        currency,
      });
      await onDone(`Mapping created for ${productName.trim()}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gem-backdrop glm-gem-backdrop" role="presentation" onClick={onClose}>
      <div className="gem-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>{isEdit ? "EDIT MAPPING" : "ADD NEW MAPPING"}</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        {error ? (
          <p role="alert" className="ctp-error">
            {error}
          </p>
        ) : null}

        <div className="gem-grid">
          <label>
            <span>Product Type</span>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              disabled={isEdit}
            >
              {PRODUCT_TYPES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Product Name</span>
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. 90 Days FD"
            />
          </label>
          <label>
            <span>GL Account Type</span>
            <select value={glRole} onChange={(e) => setGlRole(e.target.value as ProductGlRole)}>
              {(Object.keys(ROLE_LABEL) as ProductGlRole[]).map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABEL[role]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>GL Code</span>
            <select value={glCode} onChange={(e) => setGlCode(e.target.value)}>
              <option value="">Select GL</option>
              {glOptions.map((g) => (
                <option key={g.code} value={g.code}>
                  {g.code} — {g.description || g.code}
                </option>
              ))}
              {glCode && !glOptions.some((g) => g.code === glCode) ? (
                <option value={glCode}>{glCode}</option>
              ) : null}
            </select>
          </label>
          <label>
            <span>Currency</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          {isEdit ? (
            <label>
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </label>
          ) : null}
        </div>

        <footer>
          <button type="button" className="gem-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="gem-primary" disabled={busy} onClick={() => void submit()}>
            {busy ? (isEdit ? "Updating…" : "Creating…") : isEdit ? "Update mapping" : "Create mapping"}
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
