import { useState } from "react";
import {
  BRANCH_CODES,
  CURRENCIES,
  CUSTOMER_ACCOUNT_TYPES,
  GL_ACCOUNT_CLASSES,
} from "../data/accountTypeOptions";
import "./DailySummaryPage.css";

type SummaryRow = {
  glCode: string;
  glName: string;
  productType: string;
  totalDebit: string;
  totalCredit: string;
  netMovement: string;
  currency: string;
  branchCode: string;
};

const ROWS: SummaryRow[] = Array.from({ length: 9 }, () => ({
  glCode: "11101",
  glName: "₦500,000.00",
  productType: "Fixed Deposit",
  totalDebit: "₦500,000.00",
  totalCredit: "₦500,000.00",
  netMovement: "Debit",
  currency: "NGN",
  branchCode: "Posted",
}));

export function DailySummaryPage() {
  const [date, setDate] = useState("2025-08-15");
  const [productType, setProductType] = useState<string>(CUSTOMER_ACCOUNT_TYPES[0]);
  const [glClass, setGlClass] = useState<string>(GL_ACCOUNT_CLASSES[0]);
  const [branch, setBranch] = useState<string>(BRANCH_CODES[0]);
  const [currency, setCurrency] = useState<string>(CURRENCIES[0]);
  const [generated, setGenerated] = useState(true);

  return (
    <div className="dsum">
      <h1>Daily Summary/Dashboard Report</h1>

      <div className="dsum-filters">
        <label className="dsum-field">
          <span>Date</span>
          <div className="dsum-date">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <CalendarIcon />
          </div>
        </label>
        <label className="dsum-field">
          <span>Product Type</span>
          <div className="dsum-select">
            <select value={productType} onChange={(e) => setProductType(e.target.value)}>
              {CUSTOMER_ACCOUNT_TYPES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="dsum-field">
          <span>GL Account Type</span>
          <div className="dsum-select">
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
        <label className="dsum-field">
          <span>Branch Code</span>
          <div className="dsum-select">
            <select value={branch} onChange={(e) => setBranch(e.target.value)}>
              {BRANCH_CODES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="dsum-field">
          <span>Currency</span>
          <div className="dsum-select">
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
      </div>

      <div className="dsum-actions">
        <div className="dsum-actions-left">
          <button type="button" className="dsum-btn dsum-btn--export">
            <ExportIcon />
            Export
          </button>
          <button type="button" className="dsum-btn dsum-btn--print">
            <PrintIcon />
            Print
          </button>
        </div>
        <button
          type="button"
          className="dsum-btn dsum-btn--generate"
          onClick={() => setGenerated(true)}
        >
          Generate Summary
        </button>
      </div>

      {generated ? (
        <div className="dsum-table-wrap">
          <table className="dsum-table">
            <thead>
              <tr>
                <th className="is-left">GL Code</th>
                <th className="is-left">GL Name</th>
                <th>Product Type</th>
                <th>
                  <span className="dsum-th dsum-th--debit">Total Debit</span>
                </th>
                <th>
                  <span className="dsum-th dsum-th--credit">Total Credit</span>
                </th>
                <th>Net Movement</th>
                <th>Currency</th>
                <th>Branch Code</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={i}>
                  <td className="is-left">{row.glCode}</td>
                  <td className="is-left">{row.glName}</td>
                  <td>{row.productType}</td>
                  <td>{row.totalDebit}</td>
                  <td>{row.totalCredit}</td>
                  <td>{row.netMovement}</td>
                  <td>{row.currency}</td>
                  <td>{row.branchCode}</td>
                </tr>
              ))}
              <tr className="dsum-total">
                <td className="is-left">TOTAL</td>
                <td />
                <td />
                <td>
                  <div className="dsum-total-cell">
                    <strong>₦500,000.00</strong>
                    <span className="dsum-net">Net Position</span>
                  </div>
                </td>
                <td>
                  <div className="dsum-total-cell">
                    <strong>₦500,000.00</strong>
                    <span className="dsum-net">₦500,000.00</span>
                  </div>
                </td>
                <td />
                <td />
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <p className="dsum-empty">Select filters and click Generate Summary.</p>
      )}
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
