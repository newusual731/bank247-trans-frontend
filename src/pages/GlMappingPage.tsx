import { useMemo, useState } from "react";
import { FilterDropdown } from "../components/FilterDropdown";
import { GlModuleTabs } from "../components/GlModuleTabs";
import {
  CURRENCIES,
  GL_ACCOUNT_CLASSES,
  GL_CODE_OPTIONS,
  GL_LEDGER_ROLES,
} from "../data/accountTypeOptions";
import { CURRENCY_CODES } from "../data/filterDropdownOptions";
import "./GlMappingPage.css";

type MappingRow = {
  productType: string;
  productName: string;
  glAccountType: string;
  glCode: string;
  glName: string;
  currency: string;
  status: string;
};

/** Product types shown on GL Mapping list (Figma rows). */
const MAPPING_PRODUCT_TYPES = [
  "Fixed Deposit",
  "Treasury Bill",
  "Loan",
  "Bond",
  "Placement",
] as const;

const PRODUCT_NAMES = ["90 Days - Fixed Deposit", "TB 180", "BOND-1YR"] as const;
const STATUSES = ["Active", "Inactive"] as const;

const ROWS: MappingRow[] = [
  {
    productType: "Fixed Deposit",
    productName: "90 Days FD",
    glAccountType: "Principal GL",
    glCode: "11001",
    glName: "Fixed Deposit Receivable",
    currency: "NGN",
    status: "Active",
  },
  {
    productType: "Fixed Deposit",
    productName: "90 Days FD",
    glAccountType: "Interest GL",
    glCode: "40011",
    glName: "Interest Payable",
    currency: "NGN",
    status: "Active",
  },
  {
    productType: "Treasury Bill",
    productName: "TB 180",
    glAccountType: "Principal GL",
    glCode: "12001",
    glName: "Treasury Bill Control",
    currency: "NGN",
    status: "Active",
  },
  {
    productType: "Loan",
    productName: "90 Days FD",
    glAccountType: "Interest GL",
    glCode: "40011",
    glName: "Loan Interest Income",
    currency: "NGN",
    status: "Active",
  },
  {
    productType: "Fixed Deposit",
    productName: "90 Days FD",
    glAccountType: "Principal GL",
    glCode: "11001",
    glName: "Fixed Deposit Receivable",
    currency: "NGN",
    status: "Active",
  },
  {
    productType: "Treasury Bill",
    productName: "TB 180",
    glAccountType: "Interest GL",
    glCode: "40011",
    glName: "Interest Payable",
    currency: "NGN",
    status: "Active",
  },
  {
    productType: "Loan",
    productName: "90 Days FD",
    glAccountType: "Principal GL",
    glCode: "12001",
    glName: "Treasury Bill Control",
    currency: "NGN",
    status: "Active",
  },
  {
    productType: "Fixed Deposit",
    productName: "90 Days FD",
    glAccountType: "Interest GL",
    glCode: "40011",
    glName: "Loan Interest Income",
    currency: "NGN",
    status: "Active",
  },
  {
    productType: "Treasury Bill",
    productName: "TB 180",
    glAccountType: "Principal GL",
    glCode: "11001",
    glName: "Fixed Deposit Receivable",
    currency: "NGN",
    status: "Active",
  },
];

export function GlMappingPage() {
  const [productType, setProductType] = useState<string>(MAPPING_PRODUCT_TYPES[0]);
  const [glClass, setGlClass] = useState<string>("Income");
  const [currency, setCurrency] = useState<string>(CURRENCIES[0]);
  const [status, setStatus] = useState<string>(STATUSES[0]);
  const [modalOpen, setModalOpen] = useState(false);

  const rows = useMemo(() => {
    return ROWS.filter((r) => {
      if (productType && r.productType !== productType) return false;
      if (status && r.status !== status) return false;
      return true;
    });
  }, [productType, status]);

  return (
    <div className="glm">
      <GlModuleTabs />
      <h1>GL Mapping</h1>

      <div className="glm-filters">
        <label className="glm-field">
          <span>Product Type</span>
          <div className="glm-select">
            <select value={productType} onChange={(e) => setProductType(e.target.value)}>
              {MAPPING_PRODUCT_TYPES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="glm-field">
          <span>GL Account Type</span>
          <div className="glm-select">
            <select value={glClass} onChange={(e) => setGlClass(e.target.value)}>
              {GL_ACCOUNT_CLASSES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="glm-field">
          <span>Currency</span>
          <div className="glm-select">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
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
              {STATUSES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
      </div>

      <div className="glm-actions">
        <button type="button" className="glm-btn glm-btn--primary" onClick={() => setModalOpen(true)}>
          +Add New Mapping
        </button>
        <div className="glm-actions-right">
          <button type="button" className="glm-btn glm-btn--export">
            <ExportIcon />
            Export
          </button>
          <button type="button" className="glm-btn glm-btn--print">
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
              <th>
                Currency <ChevronDown />
              </th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td>{row.productType}</td>
                <td>{row.productName}</td>
                <td>{row.glAccountType}</td>
                <td>{row.glCode}</td>
                <td>{row.glName}</td>
                <td>{row.currency}</td>
                <td>{row.status}</td>
                <td>
                  <div className="glm-row-actions">
                    <button type="button">View</button>
                    <span aria-hidden>·</span>
                    <button type="button" className="glm-edit">
                      Edit <ChevronDown />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen ? <AddMappingModal onClose={() => setModalOpen(false)} /> : null}
    </div>
  );
}

function AddMappingModal({ onClose }: { onClose: () => void }) {
  const [productType, setProductType] = useState<string>(MAPPING_PRODUCT_TYPES[0]);
  const [productName, setProductName] = useState<string>(PRODUCT_NAMES[0]);
  const [glRole, setGlRole] = useState<string>(GL_LEDGER_ROLES[0]);
  const [glCode, setGlCode] = useState<string>(GL_LEDGER_ROLES[0]);
  const [currency, setCurrency] = useState<string>(CURRENCY_CODES[0]);
  const [active, setActive] = useState(true);

  return (
    <div className="glm-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="glm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-mapping-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="glm-modal-head">
          <div>
            <h2 id="add-mapping-title">Add New Mapping</h2>
            <h3 className="glm-modal-sub">Mapping Details</h3>
          </div>
          <button type="button" className="glm-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="glm-modal-grid">
          <div className="glm-field">
            <span>Product Type</span>
            <FilterDropdown
              aria-label="Product type"
              className="glm-fdrop"
              triggerClassName="glm-fdrop-trigger"
              options={MAPPING_PRODUCT_TYPES}
              value={productType}
              onSelect={setProductType}
              trigger={
                <>
                  <span className="glm-fdrop-value">{productType}</span>
                  <ChevronDown />
                </>
              }
            />
          </div>
          <div className="glm-field">
            <span>Product Name</span>
            <FilterDropdown
              aria-label="Product name"
              className="glm-fdrop"
              triggerClassName="glm-fdrop-trigger"
              options={PRODUCT_NAMES}
              value={productName}
              onSelect={setProductName}
              trigger={
                <>
                  <span className="glm-fdrop-value">{productName}</span>
                  <ChevronDown />
                </>
              }
            />
          </div>
          <div className="glm-field">
            <span>GL Account Type</span>
            <FilterDropdown
              aria-label="GL account type"
              className="glm-fdrop"
              triggerClassName="glm-fdrop-trigger"
              options={GL_LEDGER_ROLES}
              value={glRole}
              onSelect={setGlRole}
              trigger={
                <>
                  <span className="glm-fdrop-value">{glRole}</span>
                  <ChevronDown />
                </>
              }
            />
          </div>
          <div className="glm-field">
            <span>GL Code</span>
            <FilterDropdown
              aria-label="GL code"
              className="glm-fdrop"
              triggerClassName="glm-fdrop-trigger"
              options={[...GL_LEDGER_ROLES, ...GL_CODE_OPTIONS]}
              value={glCode}
              onSelect={setGlCode}
              trigger={
                <>
                  <span className="glm-fdrop-value">{glCode}</span>
                  <ChevronDown />
                </>
              }
            />
          </div>
          <div className="glm-field">
            <span>Currency</span>
            <FilterDropdown
              aria-label="Currency"
              className="glm-fdrop"
              triggerClassName="glm-fdrop-trigger"
              options={CURRENCY_CODES}
              value={currency}
              onSelect={setCurrency}
              trigger={
                <>
                  <span className="glm-fdrop-value">{currency}</span>
                  <ChevronDown />
                </>
              }
            />
          </div>
          <div className="glm-field glm-toggle-field">
            <span>Status</span>
            <button
              type="button"
              className={`glm-toggle${active ? " is-on" : ""}`}
              onClick={() => setActive((v) => !v)}
              aria-pressed={active}
            >
              <span />
            </button>
          </div>
        </div>

        <footer className="glm-modal-foot">
          <button type="button" className="glm-btn glm-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <div className="glm-modal-foot-right">
            <button type="button" className="glm-btn glm-btn--outline">
              Save
            </button>
            <button type="button" className="glm-btn glm-btn--primary" onClick={onClose}>
              Add New
            </button>
          </div>
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
      <rect x="7" y="14" width="10" height="6" rx="1" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
