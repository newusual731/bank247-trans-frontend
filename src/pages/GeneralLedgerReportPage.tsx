import { useState } from "react";
import { ReportTabs } from "../components/ReportTabs";
import {
  BRANCH_NAMES,
  COST_CENTERS,
  CURRENCIES,
  GL_ACCOUNT_CLASSES,
  POSTING_STATUSES,
  TXN_CODES,
} from "../data/accountTypeOptions";
import "./GeneralLedgerReportPage.css";

type ReportRow = {
  journalNo: string;
  txnCode: string;
  date: string;
  glCode: string;
  glName: string;
  debitAccount: string;
  creditAccount: string;
  amount: string;
  description: string;
  status: string;
  currency: string;
};

const ROWS: ReportRow[] = Array.from({ length: 8 }, () => ({
  journalNo: "JN/202507010 001",
  txnCode: "DEP1001",
  date: "2025/07/01",
  glCode: "11101",
  glName: "Vault Account",
  debitAccount: "Customer Account-21101",
  creditAccount: "Bank Income Account-21101",
  amount: "₦500,000.00",
  description: "Deposit From ABC Ltd",
  status: "Posted",
  currency: "NGN",
}));

export function GeneralLedgerReportPage() {
  const [from, setFrom] = useState("2025-06-15");
  const [to, setTo] = useState("2025-08-15");
  const [glType, setGlType] = useState<string>(GL_ACCOUNT_CLASSES[0]);
  const [costCenter, setCostCenter] = useState<string>(COST_CENTERS[0]);
  const [txnCode, setTxnCode] = useState<string>(TXN_CODES[0]);
  const [currency, setCurrency] = useState<string>(CURRENCIES[0]);
  const [branch, setBranch] = useState<string>(BRANCH_NAMES[0]);
  const [status, setStatus] = useState<string>(POSTING_STATUSES[0]);
  const [createdBy, setCreatedBy] = useState("Yomi Oke");

  return (
    <div className="glr">
      <ReportTabs active="gl" />

      <h1>General Ledger Report</h1>

      <div className="glr-filters">
        <div className="glr-field glr-field--range">
          <span>Date Range</span>
          <div className="glr-range">
            <span className="glr-range-label">From</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <span className="glr-range-label">To</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <label className="glr-field">
          <span>GL Account Type</span>
          <div className="glr-select">
            <select value={glType} onChange={(e) => setGlType(e.target.value)}>
              {GL_ACCOUNT_CLASSES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="glr-field">
          <span>Cost center</span>
          <div className="glr-select">
            <select value={costCenter} onChange={(e) => setCostCenter(e.target.value)}>
              {COST_CENTERS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="glr-field">
          <span>Transaction Code</span>
          <div className="glr-select">
            <select value={txnCode} onChange={(e) => setTxnCode(e.target.value)}>
              {TXN_CODES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="glr-field">
          <span>Currency</span>
          <div className="glr-select">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="glr-field">
          <span>Branch</span>
          <div className="glr-select">
            <select value={branch} onChange={(e) => setBranch(e.target.value)}>
              {BRANCH_NAMES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="glr-field">
          <span>Status</span>
          <div className="glr-select">
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {POSTING_STATUSES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="glr-field">
          <span>Created By</span>
          <div className="glr-select">
            <select value={createdBy} onChange={(e) => setCreatedBy(e.target.value)}>
              <option>Yomi Oke</option>
              <option>Admin</option>
            </select>
            <ChevronDown />
          </div>
        </label>
      </div>

      <div className="glr-actions">
        <button type="button" className="glr-btn glr-btn--export" onClick={() => window.print()}>
          <ExportIcon />
          Export
        </button>
        <button type="button" className="glr-btn glr-btn--print" onClick={() => window.print()}>
          <PrintIcon />
          Print
        </button>
      </div>

      <div className="glr-table-wrap">
        <table className="glr-table">
          <thead>
            <tr>
              <th>Journal No</th>
              <th>Transaction Code</th>
              <th>Date</th>
              <th>GL Code</th>
              <th>GL Name</th>
              <th>
                <span className="glr-th glr-th--debit">Debit Account</span>
              </th>
              <th>
                <span className="glr-th glr-th--credit">Credit Account</span>
              </th>
              <th>Amount</th>
              <th>Description</th>
              <th>Status</th>
              <th>Currency</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr key={i}>
                <td>{row.journalNo}</td>
                <td>{row.txnCode}</td>
                <td>{row.date}</td>
                <td>{row.glCode}</td>
                <td>{row.glName}</td>
                <td>{row.debitAccount}</td>
                <td>{row.creditAccount}</td>
                <td>{row.amount}</td>
                <td>{row.description}</td>
                <td>{row.status}</td>
                <td>{row.currency}</td>
              </tr>
            ))}
            <tr className="glr-total">
              <td>TOTAL</td>
              <td colSpan={6} />
              <td>
                <strong>₦500,000.00</strong>
              </td>
              <td colSpan={3} />
            </tr>
          </tbody>
        </table>
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
