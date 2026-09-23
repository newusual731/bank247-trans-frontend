import { useMemo, useState } from "react";
import {
  ACCOUNT_STATUSES,
  BRANCH_CODES,
  COST_CENTERS,
  CURRENCIES,
  CUSTOMER_ACCOUNT_TYPES,
  GL_ACCOUNT_CLASSES,
  GL_LEDGER_ROLES,
  INSTRUMENT_PRODUCT_CODES,
} from "../data/accountTypeOptions";
import "./AccountsPage.css";

type Tab = "customer" | "internal";

type AccountRow = {
  id: string;
  name: string;
  subtype: string;
  accountNumber: string;
  productCode: string;
  linkedGl: string;
  balance: string;
  status: string;
};

const ROWS: AccountRow[] = Array.from({ length: 7 }, (_, i) => ({
  id: String(i + 1).padStart(3, "0"),
  name: "John Doe",
  subtype: "Loan Account",
  accountNumber: "1234567890",
  productCode: "L0001",
  linkedGl: "40004",
  balance: "₦500,000.00",
  status: "Dormant",
}));

export function AccountsPage() {
  const [tab, setTab] = useState<Tab>("customer");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [glClass, setGlClass] = useState<string>(GL_ACCOUNT_CLASSES[0]);
  const [branchCode, setBranchCode] = useState<string>(BRANCH_CODES[0]);
  const [currency, setCurrency] = useState<string>(CURRENCIES[0]);
  const [costCenter, setCostCenter] = useState<string>(COST_CENTERS[0]);
  const [status, setStatus] = useState<string>(ACCOUNT_STATUSES[0]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ROWS;
    return ROWS.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.accountNumber.includes(q) ||
        r.productCode.toLowerCase().includes(q) ||
        r.id.includes(q),
    );
  }, [query]);

  return (
    <div className="accounts">
      <div className="accounts-head">
        <h1>Accounts</h1>
        <button type="button" className="accounts-add" onClick={() => setModalOpen(true)}>
          + Add New Account
        </button>
      </div>

      <div className="accounts-filters">
        <label className="accounts-filter">
          <span>GL Account Type</span>
          <div className="accounts-select">
            <select value={glClass} onChange={(e) => setGlClass(e.target.value)}>
              {GL_ACCOUNT_CLASSES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="accounts-filter">
          <span>Branch Code</span>
          <div className="accounts-select">
            <select value={branchCode} onChange={(e) => setBranchCode(e.target.value)}>
              {BRANCH_CODES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="accounts-filter">
          <span>Currency</span>
          <div className="accounts-select">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="accounts-filter">
          <span>Cost center</span>
          <div className="accounts-select">
            <select value={costCenter} onChange={(e) => setCostCenter(e.target.value)}>
              {COST_CENTERS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="accounts-filter">
          <span>Status</span>
          <div className="accounts-select">
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {ACCOUNT_STATUSES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
      </div>

      <div className="accounts-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "customer"}
          className={tab === "customer" ? "is-active" : undefined}
          onClick={() => setTab("customer")}
        >
          Customer Accounts
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "internal"}
          className={tab === "internal" ? "is-active" : undefined}
          onClick={() => setTab("internal")}
        >
          Internal Accounts
        </button>
      </div>

      <label className="accounts-table-search">
        <SearchIcon />
        <input
          type="search"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <div className="accounts-table-wrap">
        <table className="accounts-table">
          <thead>
            <tr>
              <th>Account ID</th>
              <th>Account Name</th>
              <th>Account Number</th>
              <th>Product Code</th>
              <th>Linked GL Code</th>
              <th>Balance(₦)</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${tab}-${row.id}`}>
                <td>{row.id}</td>
                <td>
                  <div className="accounts-name">
                    <strong>{row.name}</strong>
                    <span>{row.subtype}</span>
                  </div>
                </td>
                <td>{row.accountNumber}</td>
                <td>{row.productCode}</td>
                <td>{row.linkedGl}</td>
                <td>{row.balance}</td>
                <td>{row.status}</td>
                <td>
                  <div className="accounts-actions">
                    <button type="button">View Ledger</button>
                    <span aria-hidden>·</span>
                    <button type="button">Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen ? <AddAccountModal onClose={() => setModalOpen(false)} /> : null}
    </div>
  );
}

function AddAccountModal({ onClose }: { onClose: () => void }) {
  const [accountName, setAccountName] = useState("John Doe- Savings");
  const [accountType, setAccountType] = useState<string>(CUSTOMER_ACCOUNT_TYPES[1]);
  const [openingBalance, setOpeningBalance] = useState("₦5,000,000");
  const [product, setProduct] = useState<string>(CUSTOMER_ACCOUNT_TYPES[0]);
  const [productCode, setProductCode] = useState<string>(INSTRUMENT_PRODUCT_CODES[0]);
  const [linkedGl, setLinkedGl] = useState("1001001");
  const [ledgerRole, setLedgerRole] = useState<string>(GL_LEDGER_ROLES[0]);
  const [subtype1, setSubtype1] = useState("Regular savings");
  const [subtype2, setSubtype2] = useState("USD");

  return (
    <div className="acct-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="acct-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-account-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="acct-modal-head">
          <h2 id="add-account-title">Add New Account</h2>
          <button type="button" className="acct-modal-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="acct-modal-body">
          <section className="acct-section">
            <h3>Account Info</h3>
            <label className="acct-field">
              <span>Account Name</span>
              <input value={accountName} onChange={(e) => setAccountName(e.target.value)} />
            </label>
            <label className="acct-field">
              <span>Account Type</span>
              <div className="acct-select">
                <select value={accountType} onChange={(e) => setAccountType(e.target.value)}>
                  {CUSTOMER_ACCOUNT_TYPES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <ChevronDown />
              </div>
            </label>
            <label className="acct-field">
              <span>Opening Balance</span>
              <input value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} />
            </label>
          </section>

          <section className="acct-section">
            <h3>Product Assignment</h3>
            <label className="acct-field">
              <span>Product</span>
              <div className="acct-select">
                <select value={product} onChange={(e) => setProduct(e.target.value)}>
                  {CUSTOMER_ACCOUNT_TYPES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <ChevronDown />
              </div>
            </label>
            <label className="acct-field">
              <span>Product Code</span>
              <div className="acct-select">
                <select value={productCode} onChange={(e) => setProductCode(e.target.value)}>
                  {INSTRUMENT_PRODUCT_CODES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <ChevronDown />
              </div>
            </label>
            <label className="acct-field">
              <span>Linked GL Code</span>
              <input value={linkedGl} onChange={(e) => setLinkedGl(e.target.value)} />
            </label>
          </section>

          <section className="acct-section">
            <h3>Product Ledger Mapping</h3>
            <label className="acct-field">
              <span>Product Type</span>
              <div className="acct-select">
                <select value={ledgerRole} onChange={(e) => setLedgerRole(e.target.value)}>
                  {GL_LEDGER_ROLES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <ChevronDown />
              </div>
            </label>
            <label className="acct-field">
              <span>Product Subtype</span>
              <div className="acct-select">
                <select value={subtype1} onChange={(e) => setSubtype1(e.target.value)}>
                  <option>Regular savings</option>
                  <option>Premium savings</option>
                </select>
                <ChevronDown />
              </div>
            </label>
            <label className="acct-field">
              <span>Product Subtype</span>
              <div className="acct-select">
                <select value={subtype2} onChange={(e) => setSubtype2(e.target.value)}>
                  <option>USD</option>
                  <option>NGN</option>
                  <option>EUR</option>
                </select>
                <ChevronDown />
              </div>
            </label>
          </section>
        </div>

        <footer className="acct-modal-foot">
          <div className="acct-modal-foot-left">
            <button type="button" className="acct-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="acct-btn-ghost">
              Save
            </button>
          </div>
          <button type="button" className="acct-btn-primary" onClick={onClose}>
            Add New Account
          </button>
        </footer>
      </div>
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

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
