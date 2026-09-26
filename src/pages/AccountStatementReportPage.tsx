import { useState } from "react";
import { CUSTOMER_ACCOUNT_TYPES, CURRENCIES } from "../data/accountTypeOptions";
import "./AccountStatementReportPage.css";
import { ReportTabs } from "../components/ReportTabs";

type StatementRow = {
  date: string;
  code: string;
  description: string;
  debit: string;
  credit: string;
  balance: string;
  currency: string;
  status: string;
};

const ROWS: StatementRow[] = Array.from({ length: 8 }, () => ({
  date: "2025/07/01",
  code: "DEP1001",
  description: "Deposit From ABC Ltd",
  debit: "₦500,000.00",
  credit: "₦500,000.00",
  balance: "₦500,000.00",
  currency: "NGN",
  status: "Posted",
}));

export function AccountStatementReportPage() {
  const [from, setFrom] = useState("2025-06-15");
  const [to, setTo] = useState("2025-06-15");
  const [accountNumber, setAccountNumber] = useState("0051389315");
  const [accountType, setAccountType] = useState<string>(CUSTOMER_ACCOUNT_TYPES[1]);
  const [transactionCode, setTransactionCode] = useState("DEP1001");
  const [currency, setCurrency] = useState<string>(CURRENCIES[0]);
  const [branch, setBranch] = useState("Victoria Island");
  const [status, setStatus] = useState("Posted");

  return (
    <div className="asr">
      <ReportTabs active="asr" />

      <h1>Account Statement Report</h1>

      <div className="asr-filters">
        <label className="asr-field asr-field--date">
          <span>From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="asr-field asr-field--date">
          <span>To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label className="asr-field">
          <span>Account Number</span>
          <div className="asr-select">
            <select value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}>
              <option value="0051389315">0051389315</option>
              <option value="0123456789">0123456789</option>
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="asr-field">
          <span>Account Type</span>
          <div className="asr-select">
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
        <label className="asr-field">
          <span>Transaction Code</span>
          <div className="asr-select">
            <select value={transactionCode} onChange={(e) => setTransactionCode(e.target.value)}>
              <option>DEP1001</option>
              <option>WDL1001</option>
              <option>TRF1001</option>
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="asr-field">
          <span>Currency</span>
          <div className="asr-select">
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
        <label className="asr-field">
          <span>Branch</span>
          <div className="asr-select">
            <select value={branch} onChange={(e) => setBranch(e.target.value)}>
              <option>Victoria Island</option>
              <option>Ikeja</option>
              <option>Abuja Central</option>
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="asr-field">
          <span>Status</span>
          <div className="asr-select">
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Posted</option>
              <option>Pending</option>
              <option>Reversed</option>
            </select>
            <ChevronDown />
          </div>
        </label>
      </div>

      <div className="asr-actions">
        <button type="button" className="asr-btn asr-btn--export" onClick={() => window.print()}>
          <ExportIcon />
          Export
        </button>
        <button type="button" className="asr-btn asr-btn--print" onClick={() => window.print()}>
          <PrintIcon />
          Print
        </button>
      </div>

      <div className="asr-table-wrap">
        <table className="asr-table">
          <thead>
            <tr>
              <th className="is-left">Date</th>
              <th>Transaction Code</th>
              <th className="is-left">Description</th>
              <th>
                <span className="asr-th asr-th--debit">Debit</span>
              </th>
              <th>
                <span className="asr-th asr-th--credit">Credit</span>
              </th>
              <th>Balance</th>
              <th>Currency</th>
              <th className="is-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr key={i}>
                <td className="is-left">{row.date}</td>
                <td>{row.code}</td>
                <td className="is-left asr-desc">{row.description}</td>
                <td>{row.debit}</td>
                <td>{row.credit}</td>
                <td>{row.balance}</td>
                <td>{row.currency}</td>
                <td className="is-right">{row.status}</td>
              </tr>
            ))}
            <tr className="asr-total">
              <td className="is-left" colSpan={1}>
                TOTAL
              </td>
              <td />
              <td />
              <td />
              <td />
              <td>₦500,000.00</td>
              <td />
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
