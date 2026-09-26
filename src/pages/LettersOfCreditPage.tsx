import { useMemo, useState } from "react";
import { ContractTypeTabs } from "../components/ContractTypeTabs";
import { FilterDropdown } from "../components/FilterDropdown";
import { CURRENCIES, GL_CODE_OPTIONS } from "../data/accountTypeOptions";
import {
  CONTRACT_PRODUCT_FILTERS,
  TABLE_OVERFLOW_ACTIONS,
} from "../data/filterDropdownOptions";
import "./LettersOfCreditPage.css";
import { ViewDetailsModal } from "../components/feedback/ViewDetailsModal";
import { ConfirmActionModal } from "../components/feedback/ConfirmActionModal";

type LcStatus = "Issued" | "Closed" | "Cancelled";

type LcRow = {
  ref: string;
  applicant: string;
  beneficiary: string;
  amount: string;
  issueDate: string;
  expiryDate: string;
  charges: string;
  status: LcStatus;
};

const APPLICANTS = [
  "ABC Industries",
  "Omatek Ltd",
  "Pharmatek PLC",
  "OilMark Inc",
  "Dangote Cement",
] as const;

const ROWS: LcRow[] = [
  {
    ref: "LC2025-001",
    applicant: "ABC Industries",
    beneficiary: "China Co. Ltd",
    amount: "₦1,000,000.00",
    issueDate: "01-Jun-2025",
    expiryDate: "01-Dec-2025",
    charges: "₦350,000.00",
    status: "Issued",
  },
  {
    ref: "LC2024-018",
    applicant: "Omatek Ltd",
    beneficiary: "TexMex Trading",
    amount: "₦2,500,000.00",
    issueDate: "15-Mar-2024",
    expiryDate: "15-Sep-2024",
    charges: "₦180,000.00",
    status: "Closed",
  },
  {
    ref: "LC2025-007",
    applicant: "Pharmatek PLC",
    beneficiary: "MedExpress",
    amount: "₦750,000.00",
    issueDate: "10-Jun-2025",
    expiryDate: "10-Sep-2025",
    charges: "₦95,000.00",
    status: "Issued",
  },
  {
    ref: "LC2024-022",
    applicant: "OilMark Inc",
    beneficiary: "Dubai Equip",
    amount: "₦5,000,000.00",
    issueDate: "20-Nov-2024",
    expiryDate: "20-May-2025",
    charges: "₦420,000.00",
    status: "Cancelled",
  },
  {
    ref: "LC2025-012",
    applicant: "ABC Industries",
    beneficiary: "Shanghai Parts Co",
    amount: "₦1,200,000.00",
    issueDate: "05-Jul-2025",
    expiryDate: "05-Jan-2026",
    charges: "₦210,000.00",
    status: "Issued",
  },
  {
    ref: "LC2025-015",
    applicant: "Dangote Cement",
    beneficiary: "EuroMach GmbH",
    amount: "₦8,500,000.00",
    issueDate: "12-Jul-2025",
    expiryDate: "12-Jan-2026",
    charges: "₦650,000.00",
    status: "Issued",
  },
  {
    ref: "LC2024-031",
    applicant: "Omatek Ltd",
    beneficiary: "Kuala Lumpur Traders",
    amount: "₦980,000.00",
    issueDate: "02-Dec-2024",
    expiryDate: "02-Jun-2025",
    charges: "₦125,000.00",
    status: "Closed",
  },
  {
    ref: "LC2025-019",
    applicant: "Pharmatek PLC",
    beneficiary: "India Pharma Exports",
    amount: "₦3,200,000.00",
    issueDate: "18-Jul-2025",
    expiryDate: "18-Oct-2025",
    charges: "₦275,000.00",
    status: "Issued",
  },
];

const CHARGES_GL = ["Income GL", "Charges GL", "Fee Income", ...GL_CODE_OPTIONS.slice(0, 3)];
const FUNDING_GL = ["Till", "Vault", "Nostro", ...GL_CODE_OPTIONS.slice(0, 3)];

export function LettersOfCreditPage() {
  const [query, setQuery] = useState("");
  const [productFilter, setProductFilter] = useState<string>(CONTRACT_PRODUCT_FILTERS[0]);
  const [tableAction, setTableAction] = useState<string>(TABLE_OVERFLOW_ACTIONS[1]);
  type ModalState =
    | { kind: "add" }
    | { kind: "view"; row: LcRow }
    | { kind: "confirm"; action: string; row: LcRow }
    | null;
  const [modal, setModal] = useState<ModalState>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = ROWS;
    if (productFilter !== "All" && productFilter !== "LC") {
      list = [];
    }
    if (q) {
      list = list.filter(
        (r) =>
          r.ref.toLowerCase().includes(q) ||
          r.applicant.toLowerCase().includes(q) ||
          r.beneficiary.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q),
      );
    }
    if (tableAction === "Clear Table") return [];
    const sorted = [...list];
    if (tableAction === "Sort By Date") {
      sorted.sort((a, b) => a.issueDate.localeCompare(b.issueDate));
    } else if (tableAction === "Sort By Status") {
      sorted.sort((a, b) => a.status.localeCompare(b.status));
    } else if (tableAction === "Sort By Amount") {
      sorted.sort(
        (a, b) =>
          Number(a.amount.replace(/[^\d.]/g, "")) - Number(b.amount.replace(/[^\d.]/g, "")),
      );
    }
    return sorted;
  }, [query, productFilter, tableAction]);

  return (
    <div className="lc">
      <div className="lc-head">
        <div>
          <h1>LETTERS OF CREDIT</h1>
          <button type="button" className="lc-add" onClick={() => setModal({ kind: "add" })}>
            +Add New Contract
          </button>
        </div>
        <div className="lc-toolbar">
          <FilterDropdown
            aria-label="Filter by product"
            triggerClassName="lc-filter-btn"
            menuAlign="end"
            options={CONTRACT_PRODUCT_FILTERS}
            value={productFilter}
            onSelect={setProductFilter}
            trigger={
              <>
                <FilterIcon />
                Filter{productFilter !== "All" ? `: ${productFilter}` : ""}
              </>
            }
          />
          <FilterDropdown
            aria-label="Table sort and actions"
            triggerClassName="lc-sort-btn"
            menuAlign="end"
            options={TABLE_OVERFLOW_ACTIONS}
            value={tableAction}
            onSelect={(v) => {
              if (v === "Refresh Table") {
                setTableAction("Sort By Amount");
                setQuery("");
                return;
              }
              setTableAction(v);
            }}
            trigger={
              <>
                {tableAction.startsWith("Sort") ? tableAction : "Sort By Amount"}
                <ChevronDown />
              </>
            }
          />
        </div>
      </div>

      <ContractTypeTabs />

      <label className="lc-search">
        <SearchIcon />
        <input
          type="search"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <div className="lc-table-wrap">
        <table className="lc-table">
          <thead>
            <tr>
              <th>LC Reference No</th>
              <th>Applicant</th>
              <th>Beneficiary</th>
              <th>Amount (₦)</th>
              <th>Issue Date</th>
              <th>Expiry Date</th>
              <th>Charges (₦)</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.ref}>
                <td>{row.ref}</td>
                <td>{row.applicant}</td>
                <td>{row.beneficiary}</td>
                <td>{row.amount}</td>
                <td>{row.issueDate}</td>
                <td>{row.expiryDate}</td>
                <td>{row.charges}</td>
                <td>
                  <span className={`lc-status is-${row.status.toLowerCase()}`}>{row.status}</span>
                </td>
                <td>
                  <div className="lc-actions">
                    {row.status === "Issued" ? (
                      <>
                        <button type="button" onClick={() => setModal({ kind: "view", row })}>View</button>
                        <span aria-hidden>·</span>
                        <button type="button" onClick={() => setModal({ kind: "add" })}>Amend</button>
                        <span aria-hidden>·</span>
                        <button type="button" className="is-danger" onClick={() => setModal({ kind: "confirm", action: "Close", row })}>
                          Close
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => setModal({ kind: "view", row })}>View</button>
                        <span aria-hidden>·</span>
                        <button type="button" onClick={() => setModal({ kind: "confirm", action: "Rebook", row })}>Rebook</button>
                        <span aria-hidden>·</span>
                        <button type="button" className="is-danger" onClick={() => setModal({ kind: "confirm", action: "Cancel", row })}>
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal?.kind === "add" ? <AddLcModal onClose={() => setModal(null)} /> : null}
      {modal?.kind === "view" ? (
        <ViewDetailsModal
          title="View Letter of Credit"
          fields={[
            { label: "LC Ref", value: modal.row.ref },
            { label: "Applicant", value: modal.row.applicant },
            { label: "Beneficiary", value: modal.row.beneficiary },
            { label: "Amount", value: modal.row.amount },
            { label: "Issue Date", value: modal.row.issueDate, date: true },
            { label: "Expiry Date", value: modal.row.expiryDate, date: true },
            { label: "Charges", value: modal.row.charges },
            { label: "Status", value: modal.row.status },
          ]}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal?.kind === "confirm" ? (
        <ConfirmActionModal
          title={`${modal.action} LC ?`}
          message={`Do you want to ${modal.action.toLowerCase()} ${modal.row.ref}?`}
          onConfirm={() => setModal(null)}
          onClose={() => setModal(null)}
        />
      ) : null}
    </div>
  );
}

function AddLcModal({ onClose }: { onClose: () => void }) {
  const [refNo, setRefNo] = useState("LC2025-001");
  const [applicant, setApplicant] = useState<string>(APPLICANTS[0]);
  const [beneficiary, setBeneficiary] = useState("Foreign Vendor");
  const [amount, setAmount] = useState("₦500,000.00");
  const [currency, setCurrency] = useState("USD");
  const [issued, setIssued] = useState("2025-06-15");
  const [expiry, setExpiry] = useState("2025-12-15");
  const [bankGuarantee, setBankGuarantee] = useState("Yes");
  const [charges, setCharges] = useState("");
  const [chargesGl, setChargesGl] = useState(CHARGES_GL[0]);
  const [fundingGl, setFundingGl] = useState(FUNDING_GL[0]);
  const [remarks, setRemarks] = useState("");

  return (
    <div className="lc-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="lc-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-lc-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="lc-modal-head">
          <h2 id="add-lc-title">Add New Letters of Credit</h2>
          <button type="button" className="lc-modal-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="lc-modal-body">
          <div className="lc-modal-grid">
            <label className="lc-field">
              <span>LC Reference No</span>
              <input value={refNo} onChange={(e) => setRefNo(e.target.value)} />
            </label>
            <label className="lc-field">
              <span>Applicant Name</span>
              <div className="lc-select">
                <select value={applicant} onChange={(e) => setApplicant(e.target.value)}>
                  {APPLICANTS.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
                <ChevronDown />
              </div>
            </label>
            <label className="lc-field">
              <span>Beneficiary Name</span>
              <input value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} />
            </label>
            <label className="lc-field">
              <span>LC Amount (₦)</span>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>
          </div>

          <div className="lc-modal-grid lc-modal-grid--3">
            <label className="lc-field">
              <span>Currency</span>
              <div className="lc-select">
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option>USD</option>
                  <option>NGN</option>
                  <option>EUR</option>
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown />
              </div>
            </label>
            <label className="lc-field">
              <span>Issued Date</span>
              <div className="lc-date">
                <CalendarIcon />
                <input type="date" value={issued} onChange={(e) => setIssued(e.target.value)} />
              </div>
            </label>
            <label className="lc-field">
              <span>Expiry Date</span>
              <div className="lc-date">
                <CalendarIcon />
                <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
              </div>
            </label>
          </div>

          <h3 className="lc-modal-section">Financial Terms & Charges</h3>
          <div className="lc-modal-grid">
            <label className="lc-field">
              <span>Bank Guarantee</span>
              <div className="lc-select">
                <select value={bankGuarantee} onChange={(e) => setBankGuarantee(e.target.value)}>
                  <option>Yes</option>
                  <option>No</option>
                </select>
                <ChevronDown />
              </div>
            </label>
            <label className="lc-field">
              <span>Charges (₦)</span>
              <input
                value={charges}
                onChange={(e) => setCharges(e.target.value)}
                placeholder="₦0.00"
              />
            </label>
            <label className="lc-field">
              <span>Charges GL</span>
              <div className="lc-select">
                <select value={chargesGl} onChange={(e) => setChargesGl(e.target.value)}>
                  {CHARGES_GL.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
                <ChevronDown />
              </div>
            </label>
            <label className="lc-field">
              <span>Funding GL</span>
              <div className="lc-select">
                <select value={fundingGl} onChange={(e) => setFundingGl(e.target.value)}>
                  {FUNDING_GL.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
                <ChevronDown />
              </div>
            </label>
          </div>

          <h3 className="lc-modal-section">Documentations</h3>
          <label className="lc-field">
            <span>Purpose / Remarks</span>
            <textarea
              rows={4}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter purpose or remarks…"
            />
          </label>
        </div>

        <footer className="lc-modal-foot">
          <div className="lc-modal-foot-left">
            <button type="button" className="lc-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="lc-btn-ghost">
              Save Draft
            </button>
          </div>
          <button type="button" className="lc-btn-primary" onClick={onClose}>
            Create
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

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
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

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
