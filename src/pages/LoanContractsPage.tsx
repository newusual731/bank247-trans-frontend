import { useMemo, useState } from "react";
import { FilterDropdown } from "../components/FilterDropdown";
import { ContractTypeTabs } from "../components/ContractTypeTabs";
import {
  CONTRACT_PRODUCT_FILTERS,
  LOAN_GL_ACCOUNTS,
  LOAN_TYPES,
  REPAYMENT_METHODS,
  TABLE_OVERFLOW_ACTIONS,
  TENOR_MONTHS,
} from "../data/filterDropdownOptions";
import "./LoanContractsPage.css";
import { ViewDetailsModal } from "../components/feedback/ViewDetailsModal";

type LoanRow = {
  id: string;
  counterparty: string;
  amount: string;
  startDate: string;
  maturityDate: string;
  status: string;
};

const ROWS: LoanRow[] = Array.from({ length: 9 }, (_, i) => ({
  id: i === 0 ? "L001" : `L00${i + 1}`,
  counterparty: "1234567890",
  amount: "₦500,000.00",
  startDate: "06/15/2025",
  maturityDate: "06/15/2027",
  status: "Disbursed",
}));

export function LoanContractsPage() {
  const [query, setQuery] = useState("");
  const [productFilter, setProductFilter] = useState<string>(CONTRACT_PRODUCT_FILTERS[0]);
  const [tableAction, setTableAction] = useState<string>(TABLE_OVERFLOW_ACTIONS[1]);
  type ModalState =
    | { kind: "add" }
    | { kind: "view"; row: LoanRow }
    | null;
  const [modal, setModal] = useState<ModalState>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = ROWS;
    if (q) {
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.counterparty.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q),
      );
    }
    const sorted = [...list];
    if (tableAction === "Sort By Date") {
      sorted.sort((a, b) => a.startDate.localeCompare(b.startDate));
    } else if (tableAction === "Sort By Status") {
      sorted.sort((a, b) => a.status.localeCompare(b.status));
    } else if (tableAction === "Sort By Amount") {
      sorted.sort((a, b) => {
        const av = Number(a.amount.replace(/[^\d.]/g, ""));
        const bv = Number(b.amount.replace(/[^\d.]/g, ""));
        return av - bv;
      });
    } else if (tableAction === "Clear Table") {
      return [];
    }
    return sorted;
  }, [query, tableAction]);

  return (
    <div className="loan">
      <div className="loan-head">
        <div>
          <h1>LOAN CONTRACT</h1>
          <button type="button" className="loan-add" onClick={() => setModal({ kind: "add" })}>
            +Add New Contract
          </button>
        </div>
        <div className="loan-toolbar">
          <FilterDropdown
            aria-label="Filter by product"
            triggerClassName="loan-filter-btn"
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
            triggerClassName="loan-sort-btn"
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

      <label className="loan-search">
        <SearchIcon />
        <input
          type="search"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <div className="loan-table-wrap">
        <table className="loan-table">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Counterparty</th>
              <th>Amount(₦)</th>
              <th>Start Date</th>
              <th>Maturity Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={`${row.id}-${i}`}>
                <td>{row.id}</td>
                <td>{row.counterparty}</td>
                <td>{row.amount}</td>
                <td>{row.startDate}</td>
                <td>{row.maturityDate}</td>
                <td>
                  <span className="loan-status">{row.status}</span>
                </td>
                <td>
                  <button type="button" className="loan-view" onClick={() => setModal({ kind: "view", row })}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal?.kind === "add" ? <AddLoanModal onClose={() => setModal(null)} /> : null}
      {modal?.kind === "view" ? (
        <ViewDetailsModal
          title="View Loan Contract"
          fields={[
            { label: "Customer ID", value: modal.row.id },
            { label: "Counterparty", value: modal.row.counterparty },
            { label: "Amount", value: modal.row.amount },
            { label: "Start Date", value: modal.row.startDate, date: true },
            { label: "Maturity Date", value: modal.row.maturityDate, date: true },
            { label: "Status", value: modal.row.status },
          ]}
          onClose={() => setModal(null)}
        />
      ) : null}
    </div>
  );
}

function AddLoanModal({ onClose }: { onClose: () => void }) {
  const [loanType, setLoanType] = useState<string>(LOAN_TYPES[0]);
  const [customerName, setCustomerName] = useState("");
  const [amount, setAmount] = useState("500,000.00");
  const [rate, setRate] = useState("");
  const [tenor, setTenor] = useState<string>(TENOR_MONTHS[4]);
  const [repayment, setRepayment] = useState<string>(REPAYMENT_METHODS[0]);
  const [disburseGl, setDisburseGl] = useState<string>(LOAN_GL_ACCOUNTS[0]);
  const [repaymentGl, setRepaymentGl] = useState<string>(LOAN_GL_ACCOUNTS[1]);

  return (
    <div className="loan-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="loan-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-loan-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="loan-modal-head">
          <h2 id="add-loan-title">Add New Loan Contract</h2>
          <button type="button" className="loan-modal-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="loan-modal-body">
          <div className="loan-field">
            <span>Loan Type</span>
            <FilterDropdown
              aria-label="Loan type"
              className="loan-fdrop"
              triggerClassName="loan-fdrop-trigger"
              options={LOAN_TYPES}
              value={loanType}
              onSelect={setLoanType}
              trigger={
                <>
                  <span className="loan-fdrop-value">{loanType}</span>
                  <ChevronDown />
                </>
              }
            />
          </div>

          <label className="loan-field">
            <span>Customer Name</span>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder=""
            />
          </label>

          <div className="loan-modal-grid">
            <label className="loan-field">
              <span>Loan Amount</span>
              <div className="loan-affix">
                <span className="loan-prefix">₦</span>
                <input value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
            </label>
            <label className="loan-field">
              <span>Interest Rate</span>
              <div className="loan-affix">
                <span className="loan-prefix">%</span>
                <input value={rate} onChange={(e) => setRate(e.target.value)} />
              </div>
            </label>
            <div className="loan-field">
              <span>Tenor</span>
              <FilterDropdown
                aria-label="Tenor"
                className="loan-fdrop"
                triggerClassName="loan-fdrop-trigger"
                options={TENOR_MONTHS}
                value={tenor}
                onSelect={setTenor}
                align="center"
                trigger={
                  <>
                    <span className="loan-fdrop-value">{tenor}</span>
                    <ChevronDown />
                  </>
                }
              />
            </div>
            <div className="loan-field">
              <span>Repayment Method</span>
              <FilterDropdown
                aria-label="Repayment method"
                className="loan-fdrop"
                triggerClassName="loan-fdrop-trigger"
                options={REPAYMENT_METHODS}
                value={repayment}
                onSelect={setRepayment}
                trigger={
                  <>
                    <span className="loan-fdrop-value">{repayment}</span>
                    <ChevronDown />
                  </>
                }
              />
            </div>
            <div className="loan-field">
              <span>Disbursement Account</span>
              <FilterDropdown
                aria-label="Disbursement account"
                className="loan-fdrop"
                triggerClassName="loan-fdrop-trigger"
                options={LOAN_GL_ACCOUNTS}
                value={disburseGl}
                onSelect={setDisburseGl}
                trigger={
                  <>
                    <span className="loan-fdrop-value">{disburseGl}</span>
                    <ChevronDown />
                  </>
                }
              />
            </div>
            <div className="loan-field">
              <span>Repayment Account</span>
              <FilterDropdown
                aria-label="Repayment account"
                className="loan-fdrop"
                triggerClassName="loan-fdrop-trigger"
                options={LOAN_GL_ACCOUNTS}
                value={repaymentGl}
                onSelect={setRepaymentGl}
                trigger={
                  <>
                    <span className="loan-fdrop-value">{repaymentGl}</span>
                    <ChevronDown />
                  </>
                }
              />
            </div>
          </div>
        </div>

        <footer className="loan-modal-foot">
          <button type="button" className="loan-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="loan-btn-primary" onClick={onClose}>
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

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
