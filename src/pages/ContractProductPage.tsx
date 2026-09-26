import { useState } from "react";
import { ContractTypeTabs } from "../components/ContractTypeTabs";
import {
  BRANCH_CODES,
  COST_CENTERS,
  CURRENCIES,
  CUSTOMER_ACCOUNT_TYPES,
} from "../data/accountTypeOptions";
import "./ContractProductPage.css";
import { ViewDetailsModal } from "../components/feedback/ViewDetailsModal";
import { ConfirmActionModal } from "../components/feedback/ConfirmActionModal";

type ProductRow = {
  id: string;
  customerName: string;
  contractType: string;
  productType: string;
  currency: string;
  principal: string;
  tenure: string;
  interestRate: string;
  startDate: string;
  maturityDate: string;
  autoRollover: string;
  status: string;
  glInterest: string;
  glPrincipal: string;
};

/** Start/maturity use real dates — Figma copied "12.5" into date cells by mistake. */
const ROWS: ProductRow[] = Array.from({ length: 10 }, () => ({
  id: "CTB-0021",
  customerName: "John Doe",
  contractType: "Customer",
  productType: "Fixed Deposit",
  currency: "USD",
  principal: "₦500,000.00",
  tenure: "91 Days",
  interestRate: "12.5",
  startDate: "06/15/2025",
  maturityDate: "09/14/2025",
  autoRollover: "Yes",
  status: "Active",
  glInterest: "Cash Deposit",
  glPrincipal: "Cash Deposit",
}));

export function ContractProductPage() {
  const [from, setFrom] = useState("2025-06-15");
  const [to, setTo] = useState("2025-06-15");
  const [branch, setBranch] = useState<string>(BRANCH_CODES[0]);
  const [currency, setCurrency] = useState<string>(CURRENCIES[0]);
  const [costCenter, setCostCenter] = useState<string>(COST_CENTERS[0]);
  const [productType, setProductType] = useState<string>(CUSTOMER_ACCOUNT_TYPES[0]);
  type ModalState =
    | { kind: "view" | "edit"; row: ProductRow }
    | { kind: "add" }
    | { kind: "terminate" }
    | null;
  const [modal, setModal] = useState<ModalState>(null);

  return (
    <div className="cprod">
      <h1>Contract Product</h1>

      <ContractTypeTabs />

      <div className="cprod-filters">
        <div className="cprod-field cprod-field--range">
          <span>Date Range</span>
          <div className="cprod-range">
            <span>From</span>
            <div className="cprod-date">
              <CalendarIcon />
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <span>To</span>
            <div className="cprod-date">
              <CalendarIcon />
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        </div>
        <label className="cprod-field">
          <span>Branch Code</span>
          <div className="cprod-select">
            <select value={branch} onChange={(e) => setBranch(e.target.value)}>
              {BRANCH_CODES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="cprod-field">
          <span>Currency</span>
          <div className="cprod-select">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((o) => (
                <option key={o}>{o}</option>
              ))}
              <option>USD</option>
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="cprod-field">
          <span>Cost center</span>
          <div className="cprod-select">
            <select value={costCenter} onChange={(e) => setCostCenter(e.target.value)}>
              {COST_CENTERS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="cprod-field">
          <span>Product Type</span>
          <div className="cprod-select">
            <select value={productType} onChange={(e) => setProductType(e.target.value)}>
              {CUSTOMER_ACCOUNT_TYPES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
      </div>

      <div className="cprod-actions">
        <div className="cprod-actions-left">
          <button type="button" className="cprod-btn cprod-btn--add" onClick={() => setModal({ kind: "add" })}>
            <PlusIcon /> + Add Contract
          </button>
          <button type="button" className="cprod-btn cprod-btn--terminate" onClick={() => setModal({ kind: "terminate" })}>
            <SwapIcon /> Terminate
          </button>
          <button
            type="button"
            className="cprod-btn cprod-btn--edit"
            onClick={() => setModal({ kind: "edit", row: ROWS[0] })}
          >
            <EditIcon /> Edit
          </button>
        </div>
        <div className="cprod-actions-right">
          <button type="button" className="cprod-btn cprod-btn--export" onClick={() => window.print()}>
            <ExportIcon /> Export
          </button>
          <button type="button" className="cprod-btn cprod-btn--preview" onClick={() => window.print()}>
            <PreviewIcon /> Preview
          </button>
        </div>
      </div>

      <div className="cprod-table-wrap">
        <table className="cprod-table">
          <thead>
            <tr>
              <th>Contract ID</th>
              <th>Customer Name</th>
              <th>Contract Type</th>
              <th>Product Type</th>
              <th>Currency</th>
              <th>Principal Amount</th>
              <th>Tenure</th>
              <th>Interest Rate</th>
              <th>Start Date</th>
              <th>Maturity Date</th>
              <th>Auto Rollover</th>
              <th>Status</th>
              <th>GL Account (Interest)</th>
              <th>GL Account (Principal)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr key={i}>
                <td>{row.id}</td>
                <td>{row.customerName}</td>
                <td>{row.contractType}</td>
                <td>{row.productType}</td>
                <td>{row.currency}</td>
                <td>{row.principal}</td>
                <td>{row.tenure}</td>
                <td>{row.interestRate}</td>
                <td>{row.startDate}</td>
                <td>{row.maturityDate}</td>
                <td>{row.autoRollover}</td>
                <td>{row.status}</td>
                <td>{row.glInterest}</td>
                <td>{row.glPrincipal}</td>
                <td>
                  <div className="cprod-row-actions">
                    <button type="button" onClick={() => setModal({ kind: "view", row })}>
                      View <ChevronDown />
                    </button>
                    <span aria-hidden>·</span>
                    <button type="button" onClick={() => setModal({ kind: "edit", row })}>
                      Edit <ChevronDown />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal?.kind === "view" ? (
        <ViewDetailsModal
          title="View Contract Product"
          fields={[
            { label: "Contract ID", value: modal.row.id },
            { label: "Customer Name", value: modal.row.customerName },
            { label: "Contract Type", value: modal.row.contractType },
            { label: "Product Type", value: modal.row.productType },
            { label: "Currency", value: modal.row.currency },
            { label: "Principal", value: modal.row.principal },
            { label: "Tenure", value: modal.row.tenure },
            { label: "Interest Rate", value: `${modal.row.interestRate}%` },
            { label: "Start Date", value: modal.row.startDate, date: true },
            { label: "Maturity Date", value: modal.row.maturityDate, date: true },
            { label: "Status", value: modal.row.status },
          ]}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal?.kind === "edit" || modal?.kind === "add" ? (
        <ContractProductFormModal
          mode={modal.kind === "add" ? "add" : "edit"}
          initial={modal.kind === "edit" ? modal.row : undefined}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal?.kind === "terminate" ? (
        <ConfirmActionModal
          title="Terminate Contract ?"
          message="Do you want to terminate the selected contract?"
          onConfirm={() => setModal(null)}
          onClose={() => setModal(null)}
        />
      ) : null}
    </div>
  );
}

function ContractProductFormModal({
  mode,
  initial,
  onClose,
}: {
  mode: "add" | "edit";
  initial?: ProductRow;
  onClose: () => void;
}) {
  const [id, setId] = useState(initial?.id ?? "CTB-0022");
  const [customer, setCustomer] = useState(initial?.customerName ?? "");
  const [contractType, setContractType] = useState(initial?.contractType ?? "Customer");
  const [productType, setProductType] = useState(initial?.productType ?? "Fixed Deposit");
  const [currency, setCurrency] = useState(initial?.currency ?? "USD");
  const [principal, setPrincipal] = useState(initial?.principal ?? "₦500,000.00");
  const [tenure, setTenure] = useState(initial?.tenure ?? "91 Days");
  const [rate, setRate] = useState(initial?.interestRate ?? "12.5");

  return (
    <div className="cprod-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="cprod-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header className="cprod-modal-head">
          <h2>{mode === "edit" ? "Edit Contract Product" : "Add Contract Product"}</h2>
          <button type="button" className="cprod-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="cprod-modal-grid">
          <label>
            <span>Contract ID</span>
            <input value={id} onChange={(e) => setId(e.target.value)} />
          </label>
          <label>
            <span>Customer Name</span>
            <input value={customer} onChange={(e) => setCustomer(e.target.value)} />
          </label>
          <label>
            <span>Contract Type</span>
            <input value={contractType} onChange={(e) => setContractType(e.target.value)} />
          </label>
          <label>
            <span>Product Type</span>
            <input value={productType} onChange={(e) => setProductType(e.target.value)} />
          </label>
          <label>
            <span>Currency</span>
            <input value={currency} onChange={(e) => setCurrency(e.target.value)} />
          </label>
          <label>
            <span>Principal</span>
            <input value={principal} onChange={(e) => setPrincipal(e.target.value)} />
          </label>
          <label>
            <span>Tenure</span>
            <input value={tenure} onChange={(e) => setTenure(e.target.value)} />
          </label>
          <label>
            <span>Interest Rate</span>
            <input value={rate} onChange={(e) => setRate(e.target.value)} />
          </label>
        </div>
        <footer className="cprod-modal-foot">
          <button type="button" className="cprod-btn cprod-btn--export" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="cprod-btn cprod-btn--add" onClick={onClose}>
            {mode === "edit" ? "Save" : "Create"}
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

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SwapIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 7h11M18 7l-3-3M18 7l-3 3M17 17H6M6 17l3-3M6 17l3 3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 20h4l10-10-4-4L4 16v4zM14 6l4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
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

function PreviewIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
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
