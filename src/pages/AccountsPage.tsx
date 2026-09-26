import { useEffect, useMemo, useState } from "react";
import { AppAlert } from "../components/feedback/AppAlert";
import { SuccessModal } from "../components/feedback/SuccessModal";
import {
  ACCOUNT_STATUSES,
  BRANCH_CODES,
  CONTRACT_PARTY_TYPES,
  COST_CENTERS,
  CURRENCIES,
  CUSTOMER_ACCOUNT_TYPES,
  GL_ACCOUNT_CLASSES,
  GL_CODE_OPTIONS,
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
  party: Tab;
  product: string;
  openingBalance: string;
  ledgerRole: string;
  currency: string;
};

type AccountDraft = {
  accountName: string;
  accountType: (typeof CONTRACT_PARTY_TYPES)[number];
  openingBalance: string;
  product: string;
  productCode: string;
  linkedGl: string;
  ledgerRole: string;
  subtype: string;
  currency: string;
};

type ModalMode = "create" | "edit";

const CUSTOMER_SEED: AccountRow[] = [
  {
    id: "001",
    name: "John Doe",
    subtype: "Loan Account",
    accountNumber: "1234567890",
    productCode: "L0001",
    linkedGl: "40004",
    balance: "₦500,000.00",
    status: "Dormant",
    party: "customer",
    product: "Loan Account",
    openingBalance: "₦500,000",
    ledgerRole: "Principal GL",
    currency: "NGN",
  },
  {
    id: "002",
    name: "Adebayo Okon",
    subtype: "Savings Account",
    accountNumber: "2000145211",
    productCode: "SA0001",
    linkedGl: "1001001",
    balance: "₦1,250,000.00",
    status: "Active",
    party: "customer",
    product: "Savings Account",
    openingBalance: "₦1,250,000",
    ledgerRole: "Principal GL",
    currency: "NGN",
  },
  {
    id: "003",
    name: "Chioma Nwosu",
    subtype: "Current Account",
    accountNumber: "1000299102",
    productCode: "CA0002",
    linkedGl: "1001002",
    balance: "₦480,200.00",
    status: "Active",
    party: "customer",
    product: "Current Account",
    openingBalance: "₦480,200",
    ledgerRole: "Principal GL",
    currency: "NGN",
  },
  {
    id: "004",
    name: "Sam Kola",
    subtype: "Fixed Deposit",
    accountNumber: "3000111222",
    productCode: "FD-180",
    linkedGl: "10005",
    balance: "₦5,000,000.00",
    status: "Active",
    party: "customer",
    product: "Fixed Deposit",
    openingBalance: "₦5,000,000",
    ledgerRole: "Principal GL",
    currency: "NGN",
  },
  {
    id: "005",
    name: "John Doe",
    subtype: "Loan Account",
    accountNumber: "1234567891",
    productCode: "L0001",
    linkedGl: "40004",
    balance: "₦500,000.00",
    status: "Dormant",
    party: "customer",
    product: "Loan Account",
    openingBalance: "₦500,000",
    ledgerRole: "Interest GL",
    currency: "NGN",
  },
  {
    id: "006",
    name: "John Doe",
    subtype: "Loan Account",
    accountNumber: "1234567892",
    productCode: "L0001",
    linkedGl: "40004",
    balance: "₦500,000.00",
    status: "Dormant",
    party: "customer",
    product: "Loan Account",
    openingBalance: "₦500,000",
    ledgerRole: "Charges GL",
    currency: "USD",
  },
  {
    id: "007",
    name: "John Doe",
    subtype: "Loan Account",
    accountNumber: "1234567893",
    productCode: "L0001",
    linkedGl: "40004",
    balance: "₦500,000.00",
    status: "Dormant",
    party: "customer",
    product: "Loan Account",
    openingBalance: "₦500,000",
    ledgerRole: "Principal GL",
    currency: "NGN",
  },
];

const INTERNAL_SEED: AccountRow[] = [
  {
    id: "101",
    name: "Cash in Vault — Ikeja",
    subtype: "Operating Account",
    accountNumber: "1110100001",
    productCode: "VAULT-NGN",
    linkedGl: "10001",
    balance: "₦12,400,000.00",
    status: "Active",
    party: "internal",
    product: "Vault Cash",
    openingBalance: "₦12,400,000",
    ledgerRole: "Principal GL",
    currency: "NGN",
  },
  {
    id: "102",
    name: "Cash in Till — 637373",
    subtype: "Operating Account",
    accountNumber: "1110206373",
    productCode: "TILL-NGN",
    linkedGl: "10002",
    balance: "₦2,150,000.00",
    status: "Active",
    party: "internal",
    product: "Till Cash",
    openingBalance: "₦2,150,000",
    ledgerRole: "Principal GL",
    currency: "NGN",
  },
  {
    id: "103",
    name: "Inter-branch Clearing",
    subtype: "Suspense Account",
    accountNumber: "2110300001",
    productCode: "CLR-NGN",
    linkedGl: "10005",
    balance: "₦0.00",
    status: "Active",
    party: "internal",
    product: "Clearing",
    openingBalance: "₦0",
    ledgerRole: "Principal GL",
    currency: "NGN",
  },
  {
    id: "104",
    name: "Nostro USD",
    subtype: "Control Account",
    accountNumber: "1110400001",
    productCode: "NOSTRO-USD",
    linkedGl: "10003",
    balance: "$840,000.00",
    status: "Active",
    party: "internal",
    product: "Nostro",
    openingBalance: "$840,000",
    ledgerRole: "Principal GL",
    currency: "USD",
  },
  {
    id: "105",
    name: "Interest Accrual Pool",
    subtype: "Contra Account",
    accountNumber: "3110500001",
    productCode: "INT-POOL",
    linkedGl: "10007",
    balance: "₦96,500.00",
    status: "Active",
    party: "internal",
    product: "Interest Pool",
    openingBalance: "₦96,500",
    ledgerRole: "Interest GL",
    currency: "NGN",
  },
];

const INTERNAL_PRODUCTS = ["Vault Cash", "Till Cash", "Clearing", "Nostro", "Interest Pool", "Suspense"] as const;
const INTERNAL_CODES = ["VAULT-NGN", "TILL-NGN", "CLR-NGN", "NOSTRO-USD", "INT-POOL", "SUSP-NGN"] as const;
const CUSTOMER_SUBTYPES = ["Regular savings", "Premium savings", "Salary account", "Loan Account"] as const;
const INTERNAL_SUBTYPES = [
  "Operating Account",
  "Control Account",
  "Suspense Account",
  "Contra Account",
] as const;

function emptyDraft(party: Tab): AccountDraft {
  if (party === "internal") {
    return {
      accountName: "Cash in Vault — Ikeja",
      accountType: "Internal",
      openingBalance: "₦0",
      product: INTERNAL_PRODUCTS[0],
      productCode: INTERNAL_CODES[0],
      linkedGl: "10001",
      ledgerRole: GL_LEDGER_ROLES[0],
      subtype: INTERNAL_SUBTYPES[0],
      currency: "NGN",
    };
  }
  return {
    accountName: "John Doe- Savings",
    accountType: "Customer",
    openingBalance: "₦5,000,000",
    product: "Fixed Deposit",
    productCode: INSTRUMENT_PRODUCT_CODES[0],
    linkedGl: "1001001",
    ledgerRole: GL_LEDGER_ROLES[0],
    subtype: CUSTOMER_SUBTYPES[0],
    currency: "USD",
  };
}

function rowToDraft(row: AccountRow): AccountDraft {
  return {
    accountName: `${row.name}${row.party === "customer" ? `- ${row.subtype}` : ""}`,
    accountType: row.party === "customer" ? "Customer" : "Internal",
    openingBalance: row.openingBalance,
    product: row.product,
    productCode: row.productCode,
    linkedGl: row.linkedGl,
    ledgerRole: row.ledgerRole,
    subtype: row.subtype,
    currency: row.currency,
  };
}

/** Accounts — CUSTOMER.png / INTERNAL.png / Add New.png + alerts */
export function AccountsPage() {
  const [tab, setTab] = useState<Tab>("customer");
  const [query, setQuery] = useState("");
  const [customerRows, setCustomerRows] = useState(CUSTOMER_SEED);
  const [internalRows, setInternalRows] = useState(INTERNAL_SEED);
  const [glClass, setGlClass] = useState<string>(GL_ACCOUNT_CLASSES[0]);
  const [branchCode, setBranchCode] = useState<string>(BRANCH_CODES[0]);
  const [currency, setCurrency] = useState<string>(CURRENCIES[0]);
  const [costCenter, setCostCenter] = useState<string>(COST_CENTERS[0]);
  const [status, setStatus] = useState<string>("All");

  const [modal, setModal] = useState<{ mode: ModalMode; row?: AccountRow } | null>(null);
  const [ledgerRow, setLedgerRow] = useState<AccountRow | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("Account created successfully");
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const source = tab === "customer" ? customerRows : internalRows;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const statusQ = status.toLowerCase();
    return source.filter((r) => {
      if (statusQ && statusQ !== "all" && r.status.toLowerCase() !== statusQ) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.accountNumber.includes(q) ||
        r.productCode.toLowerCase().includes(q) ||
        r.id.includes(q) ||
        r.subtype.toLowerCase().includes(q)
      );
    });
  }, [source, query, status]);

  const openCreate = () => setModal({ mode: "create" });
  const openEdit = (row: AccountRow) => setModal({ mode: "edit", row });

  const upsertRow = (draft: AccountDraft, mode: ModalMode, existing?: AccountRow) => {
    const party: Tab = draft.accountType === "Internal" ? "internal" : "customer";
    const name =
      party === "customer"
        ? draft.accountName.split("-")[0]?.trim() || draft.accountName
        : draft.accountName;

    const next: AccountRow = {
      id:
        existing?.id ??
        String((party === "customer" ? customerRows.length : internalRows.length) + 1).padStart(3, "0"),
      name,
      subtype: draft.subtype,
      accountNumber:
        existing?.accountNumber ??
        (party === "customer"
          ? `2${String(Math.floor(100000000 + Math.random() * 899999999))}`
          : `1${String(Math.floor(100000000 + Math.random() * 899999999))}`),
      productCode: draft.productCode.includes("-")
        ? draft.productCode.split("-")[0] ?? draft.productCode
        : draft.productCode,
      linkedGl: draft.linkedGl.includes("-")
        ? draft.linkedGl.split("-")[0]?.trim() ?? draft.linkedGl
        : draft.linkedGl,
      balance:
        draft.openingBalance.startsWith("₦") || draft.openingBalance.startsWith("$")
          ? draft.openingBalance.includes(".")
            ? draft.openingBalance
            : `${draft.openingBalance}.00`
          : `₦${draft.openingBalance}`,
      status: "Active",
      party,
      product: draft.product,
      openingBalance: draft.openingBalance,
      ledgerRole: draft.ledgerRole,
      currency: draft.currency,
    };

    if (party === "customer") {
      setCustomerRows((prev) =>
        mode === "edit" && existing ? prev.map((r) => (r.id === existing.id ? next : r)) : [next, ...prev],
      );
      if (tab !== "customer") setTab("customer");
    } else {
      setInternalRows((prev) =>
        mode === "edit" && existing ? prev.map((r) => (r.id === existing.id ? next : r)) : [next, ...prev],
      );
      if (tab !== "internal") setTab("internal");
    }
  };

  return (
    <div className="accounts">
      {toast ? (
        <AppAlert tone="success" title={toast.title} message={toast.message} onClose={() => setToast(null)} />
      ) : null}

      {successOpen ? (
        <SuccessModal
          title="Successfull"
          message={successMsg}
          onOkay={() => {
            setSuccessOpen(false);
            setToast({
              title: "Success",
              message:
                tab === "internal"
                  ? "Internal account created successfully"
                  : "New customer account created successfully",
            });
          }}
        />
      ) : null}

      <div className="accounts-head">
        <h1>Accounts</h1>
        <button type="button" className="accounts-add" onClick={openCreate}>
          + Add New Account
        </button>
      </div>

      <div className="accounts-filters">
        <FilterSelect label="GL Account Type" value={glClass} options={GL_ACCOUNT_CLASSES} onChange={setGlClass} />
        <FilterSelect label="Branch Code" value={branchCode} options={BRANCH_CODES} onChange={setBranchCode} />
        <FilterSelect label="Currency" value={currency} options={CURRENCIES} onChange={setCurrency} />
        <FilterSelect label="Cost center" value={costCenter} options={COST_CENTERS} onChange={setCostCenter} />
        <FilterSelect
          label="Status"
          value={status}
          options={["All", ...ACCOUNT_STATUSES]}
          onChange={setStatus}
        />
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
        <input type="search" placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} />
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
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="accounts-empty">
                  No {tab} accounts match these filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={`${row.party}-${row.id}`}>
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
                      <button type="button" onClick={() => setLedgerRow(row)}>
                        View Ledger
                      </button>
                      <span aria-hidden>·</span>
                      <button type="button" className="accounts-edit" onClick={() => openEdit(row)}>
                        Edit
                        <ChevronDown />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal ? (
        <AddAccountModal
          mode={modal.mode}
          tabDefault={tab}
          initial={modal.row ? rowToDraft(modal.row) : emptyDraft(tab)}
          existing={modal.row}
          onClose={() => setModal(null)}
          onSaveDraft={(draft) => {
            upsertRow(draft, modal.mode, modal.row);
            setModal(null);
            setToast({ title: "Success", message: "Account draft saved successfully" });
          }}
          onSubmit={(draft) => {
            upsertRow(draft, modal.mode, modal.row);
            setModal(null);
            if (modal.mode === "create") {
              setSuccessMsg(
                draft.accountType === "Internal"
                  ? "Internal account setup successfully"
                  : "Account parameter setup successfully",
              );
              setSuccessOpen(true);
            } else {
              setToast({ title: "Success", message: "Account updated successfully" });
            }
          }}
        />
      ) : null}

      {ledgerRow ? (
        <LedgerDrawer
          row={ledgerRow}
          onClose={() => setLedgerRow(null)}
          onEdited={() => {
            const r = ledgerRow;
            setLedgerRow(null);
            openEdit(r);
          }}
        />
      ) : null}

      <span className="accounts-sr-only">
        {glClass} {branchCode} {currency} {costCenter}
      </span>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="accounts-filter">
      <span>{label}</span>
      <div className="accounts-select">
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown />
      </div>
    </label>
  );
}

function AddAccountModal({
  mode,
  tabDefault,
  initial,
  existing,
  onClose,
  onSaveDraft,
  onSubmit,
}: {
  mode: ModalMode;
  tabDefault: Tab;
  initial: AccountDraft;
  existing?: AccountRow;
  onClose: () => void;
  onSaveDraft: (draft: AccountDraft) => void;
  onSubmit: (draft: AccountDraft) => void;
}) {
  const [draft, setDraft] = useState<AccountDraft>(initial);
  const isInternal = draft.accountType === "Internal";
  const products = isInternal ? INTERNAL_PRODUCTS : CUSTOMER_ACCOUNT_TYPES;
  const codes = isInternal ? INTERNAL_CODES : INSTRUMENT_PRODUCT_CODES;
  const subtypes = isInternal ? INTERNAL_SUBTYPES : CUSTOMER_SUBTYPES;

  const set = <K extends keyof AccountDraft>(key: K, value: AccountDraft[K]) => {
    setDraft((d) => {
      if (key === "accountType") {
        const party = value === "Internal" ? "internal" : "customer";
        return { ...emptyDraft(party), accountType: value as AccountDraft["accountType"] };
      }
      return { ...d, [key]: value };
    });
  };

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
          <h2 id="add-account-title">{mode === "edit" ? "Edit Account" : "Add New Account"}</h2>
          <button type="button" className="acct-modal-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="acct-modal-body">
          <section className="acct-section">
            <h3>Account Info</h3>
            <label className="acct-field">
              <span>Account Name</span>
              <input value={draft.accountName} onChange={(e) => set("accountName", e.target.value)} />
            </label>
            <label className="acct-field">
              <span>Account Type</span>
              <div className="acct-select">
                <select
                  value={draft.accountType}
                  onChange={(e) => set("accountType", e.target.value as AccountDraft["accountType"])}
                >
                  {CONTRACT_PARTY_TYPES.map((o) => (
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
              <input value={draft.openingBalance} onChange={(e) => set("openingBalance", e.target.value)} />
            </label>
          </section>

          <section className="acct-section">
            <h3>Product Assignment</h3>
            <label className="acct-field">
              <span>Product</span>
              <div className="acct-select">
                <select value={draft.product} onChange={(e) => set("product", e.target.value)}>
                  {products.map((o) => (
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
                <select value={draft.productCode} onChange={(e) => set("productCode", e.target.value)}>
                  {codes.map((o) => (
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
              {isInternal ? (
                <div className="acct-select">
                  <select value={draft.linkedGl} onChange={(e) => set("linkedGl", e.target.value)}>
                    {GL_CODE_OPTIONS.map((o) => (
                      <option key={o} value={o.split("-")[0]?.trim() ?? o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  <ChevronDown />
                </div>
              ) : (
                <input value={draft.linkedGl} onChange={(e) => set("linkedGl", e.target.value)} />
              )}
            </label>
          </section>

          <section className="acct-section">
            <h3>Product Ledger Mapping</h3>
            <label className="acct-field">
              <span>Product Type</span>
              <div className="acct-select">
                <select value={draft.ledgerRole} onChange={(e) => set("ledgerRole", e.target.value)}>
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
                <select value={draft.subtype} onChange={(e) => set("subtype", e.target.value)}>
                  {subtypes.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <ChevronDown />
              </div>
            </label>
            <label className="acct-field">
              <span>{isInternal ? "Currency" : "Product Subtype"}</span>
              <div className="acct-select">
                <select value={draft.currency} onChange={(e) => set("currency", e.target.value)}>
                  <option>USD</option>
                  <option>NGN</option>
                  <option>EUR</option>
                </select>
                <ChevronDown />
              </div>
            </label>
          </section>

          {existing ? (
            <p className="acct-meta">
              Editing {existing.accountNumber} · started from {tabDefault} tab
            </p>
          ) : null}
        </div>

        <footer className="acct-modal-foot">
          <div className="acct-modal-foot-left">
            <button type="button" className="acct-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="acct-btn-ghost" onClick={() => onSaveDraft(draft)}>
              Save
            </button>
          </div>
          <button type="button" className="acct-btn-primary" onClick={() => onSubmit(draft)}>
            {mode === "edit" ? "Update Account" : "Add New Account"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function LedgerDrawer({
  row,
  onClose,
  onEdited,
}: {
  row: AccountRow;
  onClose: () => void;
  onEdited: () => void;
}) {
  const lines = [
    { date: "15-Jun-2025", ref: "TXN-88421", narr: "Opening balance", dr: row.balance, cr: "—" },
    { date: "16-Jun-2025", ref: "TXN-88455", narr: "Interest accrual", dr: "—", cr: "₦12,500.00" },
    { date: "18-Jun-2025", ref: "TXN-88501", narr: "Customer credit", dr: "₦50,000.00", cr: "—" },
  ];

  return (
    <div className="acct-modal-backdrop" role="presentation" onClick={onClose}>
      <aside className="acct-ledger" role="dialog" aria-labelledby="ledger-title" onClick={(e) => e.stopPropagation()}>
        <header className="acct-ledger-head">
          <div>
            <h2 id="ledger-title">View Ledger</h2>
            <p>
              {row.name} · {row.accountNumber}
            </p>
          </div>
          <button type="button" className="acct-modal-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>
        <dl className="acct-ledger-meta">
          <div>
            <dt>Product</dt>
            <dd>{row.product}</dd>
          </div>
          <div>
            <dt>Linked GL</dt>
            <dd>{row.linkedGl}</dd>
          </div>
          <div>
            <dt>Balance</dt>
            <dd>{row.balance}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{row.status}</dd>
          </div>
        </dl>
        <div className="acct-ledger-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Narration</th>
                <th>Debit</th>
                <th>Credit</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.ref}>
                  <td>{l.date}</td>
                  <td>{l.ref}</td>
                  <td>{l.narr}</td>
                  <td>{l.dr}</td>
                  <td>{l.cr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="acct-ledger-foot">
          <button type="button" className="acct-btn-ghost" onClick={onClose}>
            Close
          </button>
          <button type="button" className="acct-btn-primary" onClick={onEdited}>
            Edit Account
          </button>
        </footer>
      </aside>
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
