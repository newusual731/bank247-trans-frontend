import { useEffect, useMemo, useState } from "react";
import {
  CURRENCIES,
  PRODUCT_SETUP_STATUSES,
  PRODUCT_SETUP_TYPES,
  PRODUCT_TERMS,
} from "../data/accountTypeOptions";
import "./ProductSetupPage.css";
import { listCasaProducts, listInvestmentProducts, listLoanProducts, createCasaProduct, createLoanProduct, createInvestmentProduct } from "../api/accounts";
import { ApiError } from "../lib/apiClient";

type ProductRow = {
  productType: string;
  productName: string;
  term: string;
  interestRate: string;
  currency: string;
  status: string;
  createdBy: string;
  createdDate: string;
  description: string;
};

const ROWS: ProductRow[] = [
  {
    productType: "Fixed Deposit",
    productName: "90 Days FD",
    term: "90 Days",
    interestRate: "6.5%",
    currency: "NGN",
    status: "Active",
    createdBy: "Admin 02",
    createdDate: "06/15/2025",
    description: "",
  },
  {
    productType: "Treasury Bill",
    productName: "180 Days TB",
    term: "182 Days",
    interestRate: "7.0%",
    currency: "NGN",
    status: "Active",
    createdBy: "Admin 01",
    createdDate: "06/15/2025",
    description: "",
  },
  {
    productType: "Fixed Deposit",
    productName: "90 Days FD",
    term: "90 Days",
    interestRate: "6.5%",
    currency: "NGN",
    status: "Active",
    createdBy: "Admin 01",
    createdDate: "06/15/2025",
    description: "",
  },
  {
    productType: "Loan",
    productName: "Personal Loan",
    term: "12 months",
    interestRate: "18%",
    currency: "NGN",
    status: "Active",
    createdBy: "Super-Admin 01",
    createdDate: "06/15/2025",
    description: "",
  },
  {
    productType: "Fixed Deposit",
    productName: "90 Days FD",
    term: "90 Days",
    interestRate: "6.5%",
    currency: "NGN",
    status: "Active",
    createdBy: "Admin 01",
    createdDate: "06/15/2025",
    description: "",
  },
  {
    productType: "Treasury Bill",
    productName: "180 Days TB",
    term: "90 Days",
    interestRate: "6.5%",
    currency: "NGN",
    status: "Active",
    createdBy: "Super-Admin 01",
    createdDate: "06/15/2025",
    description: "",
  },
  {
    productType: "Fixed Deposit",
    productName: "90 Days FD",
    term: "90 Days",
    interestRate: "6.5%",
    currency: "NGN",
    status: "Active",
    createdBy: "Admin 01",
    createdDate: "06/15/2025",
    description: "",
  },
  {
    productType: "Loan",
    productName: "Business Loan",
    term: "30 Months",
    interestRate: "6.5%",
    currency: "NGN",
    status: "Active",
    createdBy: "Admin 02",
    createdDate: "06/15/2025",
    description: "",
  },
  {
    productType: "Fixed Deposit",
    productName: "90 Days FD",
    term: "90 Days",
    interestRate: "6.5%",
    currency: "NGN",
    status: "Active",
    createdBy: "Super-Admin 01",
    createdDate: "06/15/2025",
    description: "",
  },
  {
    productType: "Fixed Deposit",
    productName: "90 Days FD",
    term: "90 Days",
    interestRate: "6.5%",
    currency: "NGN",
    status: "Active",
    createdBy: "Admin 02",
    createdDate: "06/15/2025",
    description: "",
  },
];

type Modal =
  | { kind: "add" }
  | { kind: "edit"; row: ProductRow }
  | { kind: "view"; row: ProductRow }
  | null;

export function ProductSetupPage() {
  const [productType, setProductType] = useState<string>(PRODUCT_SETUP_TYPES[0]);
  const [currency, setCurrency] = useState<string>(CURRENCIES[0]);
  const [status, setStatus] = useState<string>(PRODUCT_SETUP_STATUSES[0]);
  const [modal, setModal] = useState<Modal>(null);
  const [apiRows, setApiRows] = useState<ProductRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [casa, loans, inv] = await Promise.all([
          listCasaProducts(),
          listLoanProducts(),
          listInvestmentProducts(),
        ]);
        if (cancelled) return;
        const toList = (res: unknown): Record<string, unknown>[] =>
          Array.isArray(res)
            ? (res as Record<string, unknown>[])
            : res && typeof res === "object" && "content" in res && Array.isArray((res as { content: unknown }).content)
              ? (res as { content: Record<string, unknown>[] }).content
              : [];
        const mapped: ProductRow[] = [];
        const push = (items: Record<string, unknown>[], fallbackType: string) => {
          for (const p of items) {
            mapped.push({
              productType: String(p.productType ?? p.category ?? fallbackType),
              productName: String(p.name ?? p.productName ?? p.code ?? "—"),
              term: String(p.term ?? p.tenor ?? p.tenure ?? "—"),
              interestRate: String(p.interestRate ?? p.rate ?? "—"),
              currency: String(p.currency ?? p.baseCurrency ?? "NGN"),
              status: String(p.status ?? (p.active === false ? "Inactive" : "Active")),
              createdBy: String(p.createdBy ?? "—"),
              createdDate: String(p.createdAt ?? p.createdDate ?? "—"),
              description: String(p.description ?? ""),
            });
          }
        };
        push(toList(casa), "CASA");
        push(toList(loans), "Loan");
        push(toList(inv), "Fixed Deposit");
        if (mapped.length) setApiRows(mapped);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Load failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayRows = useMemo(() => {
    let source = apiRows ?? ROWS;
    if (status && status !== "All") source = source.filter((r) => r.status === status);
    if (productType && productType !== "All") {
      const needle = productType.toLowerCase();
      const filtered = source.filter((r) => r.productType.toLowerCase().includes(needle) || needle.includes(r.productType.toLowerCase()));
      if (filtered.length) source = filtered;
    }
    if (currency && currency.length === 3) {
      const filtered = source.filter((r) => r.currency === currency);
      if (filtered.length) source = filtered;
    }
    return source;
  }, [apiRows, productType, status, currency]);


  return (
    <div className="ps">
      <h1>Product Setup</h1>
      {loadError ? <p role="alert">{loadError}</p> : null}

      <div className="ps-filters">
        <label className="ps-field">
          <span>Product Type</span>
          <div className="ps-select">
            <select value={productType} onChange={(e) => setProductType(e.target.value)}>
              {PRODUCT_SETUP_TYPES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <span className="ps-filter-spacer" />
        <label className="ps-field">
          <span>Currency</span>
          <div className="ps-select">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <span className="ps-filter-spacer" />
        <label className="ps-field">
          <span>Status</span>
          <div className="ps-select">
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {PRODUCT_SETUP_STATUSES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
      </div>

      <div className="ps-actions">
        <button type="button" className="ps-btn ps-btn--primary" onClick={() => setModal({ kind: "add" })}>
          +Add New Product
        </button>
        <div className="ps-actions-right">
          <button type="button" className="ps-btn ps-btn--export" onClick={() => window.print()}>
            <ExportIcon /> Export
          </button>
          <button type="button" className="ps-btn ps-btn--print" onClick={() => window.print()}>
            <PrintIcon /> Print
          </button>
        </div>
      </div>

      <div className="ps-table-wrap">
        <table className="ps-table">
          <thead>
            <tr>
              <th>Product Type</th>
              <th>Product Name</th>
              <th>Term</th>
              <th>Interest Rate %</th>
              <th>
                Currency <ChevronDown />
              </th>
              <th>Status</th>
              <th>Created By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, i) => (
              <tr key={i}>
                <td>{row.productType}</td>
                <td>{row.productName}</td>
                <td>{row.term}</td>
                <td>{row.interestRate}</td>
                <td>{row.currency}</td>
                <td>{row.status}</td>
                <td>{row.createdBy}</td>
                <td>
                  <div className="ps-row-actions">
                    <button type="button" onClick={() => setModal({ kind: "view", row })}>
                      View
                    </button>
                    <span aria-hidden>·</span>
                    <button type="button" className="ps-edit" onClick={() => setModal({ kind: "edit", row })}>
                      Edit <ChevronDown />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal?.kind === "add" || modal?.kind === "edit" ? (
        <ProductFormModal
          mode={modal.kind}
          initial={modal.kind === "edit" ? modal.row : undefined}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal?.kind === "view" ? <ViewProductModal row={modal.row} onClose={() => setModal(null)} /> : null}
    </div>
  );
}

function ProductFormModal({
  mode,
  initial,
  onClose,
}: {
  mode: "add" | "edit";
  initial?: ProductRow;
  onClose: () => void;
}) {
  const [productType, setProductType] = useState(initial?.productType ?? PRODUCT_SETUP_TYPES[0]);
  const [productName, setProductName] = useState(initial?.productName ?? "");
  const [currency, setCurrency] = useState(initial?.currency === "NGN" ? "USD" : (initial?.currency ?? "USD"));
  const [term, setTerm] = useState(initial?.term ?? PRODUCT_TERMS[0]);
  const [interestRate, setInterestRate] = useState(initial?.interestRate.replace("%", "") ?? "12.5");
  const [active, setActive] = useState((initial?.status ?? "Active") === "Active");
  const [description, setDescription] = useState(initial?.description ?? "");

  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  async function saveProduct() {
    setBusy(true);
    setSaveError(null);
    try {
      const code = (productName || productType || "PROD").toUpperCase().replace(/[^A-Z0-9_-]/g, "_").slice(0, 40);
      const body = {
        code,
        name: productName || productType,
        currency: currency === "NGN" || currency.length === 3 ? currency : "NGN",
        description: description || undefined,
        interestRate: interestRate ? Number(interestRate) : undefined,
        status: active ? "ACTIVE" : "INACTIVE",
      };
      const ptLower = String(productType || "").toLowerCase();
      if (ptLower.includes("loan")) await createLoanProduct(body);
      else if (ptLower.includes("treasury") || ptLower.includes("deposit") || ptLower.includes("bond") || ptLower.includes("bill"))
        await createInvestmentProduct(body);
      else await createCasaProduct(body);
      onClose();
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }


  return (
    <div className="ps-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="ps-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        {saveError ? <p role="alert">{saveError}</p> : null}
        <header className="ps-modal-head">
          <div>
            <h2 id="product-form-title">{mode === "edit" ? "Edit Product" : "Add New Product"}</h2>
            <h3>Product Details</h3>
          </div>
          <button type="button" className="ps-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="ps-modal-grid">
          <label className="ps-field">
            <span>Product Type</span>
            <div className="ps-select">
              <select value={productType} onChange={(e) => setProductType(e.target.value)}>
                {PRODUCT_SETUP_TYPES.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </label>
          <label className="ps-field">
            <span>Product Name</span>
            <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="" />
          </label>
          <label className="ps-field">
            <span>Currency</span>
            <div className="ps-select">
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option>USD</option>
                <option>NGN</option>
                <option>EUR</option>
              </select>
              <ChevronDown />
            </div>
          </label>
          <label className="ps-field">
            <span>Term</span>
            <div className="ps-select">
              <select value={term} onChange={(e) => setTerm(e.target.value)}>
                {PRODUCT_TERMS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </label>
          <label className="ps-field">
            <span>Interest Rate</span>
            <input value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
          </label>
          <div className="ps-field ps-toggle-field">
            <span>Status</span>
            <button
              type="button"
              className={`ps-toggle${active ? " is-on" : ""}`}
              onClick={() => setActive((v) => !v)}
              aria-pressed={active}
            >
              <span />
            </button>
          </div>
          <label className="ps-field ps-field--full">
            <span>Description</span>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
        </div>

        <footer className="ps-modal-foot">
          <button type="button" className="ps-btn ps-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <div className="ps-modal-foot-right">
            <button type="button" className="ps-btn ps-btn--outline" onClick={onClose}>
              Post
            </button>
            <button
              type="button"
              className="ps-btn ps-btn--primary"
              disabled={busy}
              onClick={() => void saveProduct()}
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function ViewProductModal({ row, onClose }: { row: ProductRow; onClose: () => void }) {
  const name =
    row.productName === "90 Days FD" ? "90 Days Fixed Deposit" : row.productName;

  return (
    <div className="ps-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="ps-modal ps-modal--view"
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-product-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ps-modal-head ps-modal-head--view">
          <h2 id="view-product-title">View Product Setup</h2>
          <button type="button" className="ps-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <dl className="ps-view-list">
          <div>
            <dt>Product Type</dt>
            <dd>{row.productType}</dd>
          </div>
          <div>
            <dt>Product Name</dt>
            <dd>{name}</dd>
          </div>
          <div>
            <dt>Term</dt>
            <dd>{row.term}</dd>
          </div>
          <div>
            <dt>Currency</dt>
            <dd>{row.currency}</dd>
          </div>
          <div>
            <dt>Interest Rate</dt>
            <dd>{row.interestRate}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{row.status}</dd>
          </div>
          <div>
            <dt>Created By</dt>
            <dd>{row.createdBy}</dd>
          </div>
          <div>
            <dt>Created Date</dt>
            <dd>
              <CalendarIcon /> {row.createdDate}
            </dd>
          </div>
        </dl>
        <footer className="ps-view-foot">
          <button type="button" className="ps-btn ps-btn--primary" onClick={onClose}>
            Ok
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
        d="M12 4v12M12 16l-4-4M12 16l4-4M5 20h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
