import { useState } from "react";
import { BRANCH_CODES, COST_CENTERS, CURRENCIES } from "../data/accountTypeOptions";
import "./PnlReportPage.css";

const PNL_CATEGORIES = ["Income", "Expense"] as const;

type Row = {
  category: string;
  glCode: string;
  glName: string;
  amount: string;
  currency: string;
};

const ROWS: Row[] = [
  { category: "Income", glCode: "11001", glName: "Admin Salaries", amount: "₦500,000.00", currency: "NGN" },
  { category: "Expense", glCode: "111001", glName: "Interest Income", amount: "₦500,000.00", currency: "NGN" },
  { category: "Income", glCode: "50001", glName: "Loan Charges", amount: "₦500,000.00", currency: "NGN" },
  { category: "Expense", glCode: "50001", glName: "Interest Income", amount: "₦500,000.00", currency: "NGN" },
  { category: "Income", glCode: "60001", glName: "Office Supplies", amount: "₦500,000.00", currency: "NGN" },
  { category: "Income", glCode: "40001", glName: "Interest Income", amount: "₦500,000.00", currency: "NGN" },
  { category: "Expense", glCode: "40001", glName: "Admin Salaries", amount: "₦500,000.00", currency: "NGN" },
  { category: "Income", glCode: "40001", glName: "Interest Income", amount: "₦500,000.00", currency: "NGN" },
  { category: "Income", glCode: "40001", glName: "Admin Salaries", amount: "₦500,000.00", currency: "NGN" },
];

export function PnlReportPage() {
  const [from, setFrom] = useState("2025-06-15");
  const [to, setTo] = useState("2025-06-15");
  const [category, setCategory] = useState<string>(PNL_CATEGORIES[0]);
  const [currency, setCurrency] = useState<string>(CURRENCIES[0]);
  const [branch, setBranch] = useState<string>(BRANCH_CODES[0]);
  const [costCenter, setCostCenter] = useState<string>(COST_CENTERS[0]);

  return (
    <div className="pnr">
      <h1>Profit & Loss Report</h1>

      <div className="pnr-filters">
        <div className="pnr-field pnr-field--range">
          <span>Date Range</span>
          <div className="pnr-range">
            <span>From</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <span>To</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <label className="pnr-field">
          <span>Account Category</span>
          <div className="pnr-select">
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {PNL_CATEGORIES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="pnr-field">
          <span>Currency</span>
          <div className="pnr-select">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="pnr-field">
          <span>Branch Code</span>
          <div className="pnr-select">
            <select value={branch} onChange={(e) => setBranch(e.target.value)}>
              {BRANCH_CODES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="pnr-field">
          <span>Cost center</span>
          <div className="pnr-select">
            <select value={costCenter} onChange={(e) => setCostCenter(e.target.value)}>
              {COST_CENTERS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
      </div>

      <div className="pnr-actions">
        <div className="pnr-actions-left">
          <button type="button" className="pnr-btn pnr-btn--export">
            <ExportIcon /> Export
          </button>
          <button type="button" className="pnr-btn pnr-btn--print">
            <PrintIcon /> Print
          </button>
        </div>
        <button type="button" className="pnr-btn pnr-btn--gen">
          Generate Summary
        </button>
      </div>

      <div className="pnr-table-wrap">
        <table className="pnr-table">
          <thead>
            <tr>
              <th>GL Category</th>
              <th>GL Code</th>
              <th>GL Name</th>
              <th>Amount</th>
              <th>
                Currency <ChevronDown />
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr key={i}>
                <td>{row.category}</td>
                <td>{row.glCode}</td>
                <td>{row.glName}</td>
                <td>{row.amount}</td>
                <td>{row.currency}</td>
              </tr>
            ))}
            <tr className="pnr-total">
              <td>TOTAL</td>
              <td />
              <td className="is-net">Net Profit</td>
              <td className="is-net">₦500,000.00</td>
              <td />
            </tr>
          </tbody>
        </table>
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
