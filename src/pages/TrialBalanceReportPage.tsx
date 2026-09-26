import { useState } from "react";
import { ViewLedgerDrawer } from "../components/ViewLedgerDrawer";
import { Link } from "react-router-dom";
import { ExportMenu } from "../components/SharedUiBits";
import { ReportTabs } from "../components/ReportTabs";
import {
  BRANCH_CODES,
  COST_CENTERS,
  CURRENCIES,
  GL_ACCOUNT_CLASSES,
  GL_CODE_OPTIONS,
} from "../data/accountTypeOptions";
import "./TrialBalanceReportPage.css";

type TbRow = {
  glCode: string;
  glName: string;
  accountType: string;
  opening: string;
  debit: string;
  credit: string;
  closing: string;
  currency: string;
  branch: string;
};

const ROWS: TbRow[] = [
  {
    glCode: "11000",
    glName: "Cash In Till",
    accountType: "Asset",
    opening: "₦500,000.00",
    debit: "₦200,000.00",
    credit: "₦100,000.00",
    closing: "₦600,000.00",
    currency: "NGN",
    branch: "VI Branch",
  },
  {
    glCode: "11101",
    glName: "Vault Account",
    accountType: "Asset",
    opening: "₦1,200,000.00",
    debit: "₦500,000.00",
    credit: "₦350,000.00",
    closing: "₦1,350,000.00",
    currency: "NGN",
    branch: "VI Branch",
  },
  {
    glCode: "21001",
    glName: "Customer Deposit Acc",
    accountType: "Liability",
    opening: "₦800,000.00",
    debit: "₦150,000.00",
    credit: "₦400,000.00",
    closing: "₦1,050,000.00",
    currency: "NGN",
    branch: "Abuja Branch",
  },
  {
    glCode: "12005",
    glName: "Savings Account",
    accountType: "Liability",
    opening: "₦450,000.00",
    debit: "₦75,000.00",
    credit: "₦220,000.00",
    closing: "₦595,000.00",
    currency: "NGN",
    branch: "Ikeja Branch",
  },
  {
    glCode: "40001",
    glName: "Interest Income",
    accountType: "Income",
    opening: "₦0.00",
    debit: "₦0.00",
    credit: "₦320,000.00",
    closing: "₦320,000.00",
    currency: "NGN",
    branch: "VI Branch",
  },
  {
    glCode: "50001",
    glName: "Admin Salaries",
    accountType: "Expenses",
    opening: "₦0.00",
    debit: "₦180,000.00",
    credit: "₦0.00",
    closing: "₦180,000.00",
    currency: "NGN",
    branch: "Abuja Branch",
  },
  {
    glCode: "10003",
    glName: "Inter Bank Placement",
    accountType: "Asset",
    opening: "₦2,000,000.00",
    debit: "₦500,000.00",
    credit: "₦250,000.00",
    closing: "₦2,250,000.00",
    currency: "NGN",
    branch: "VI Branch",
  },
  {
    glCode: "30001",
    glName: "Share Capital",
    accountType: "Equity",
    opening: "₦5,000,000.00",
    debit: "₦0.00",
    credit: "₦0.00",
    closing: "₦5,000,000.00",
    currency: "NGN",
    branch: "VI Branch",
  },
];

const PREPARERS = ["Ola Oki", "Yomi Oke", "Kemi Adeosun", "Admin 01"] as const;


export function TrialBalanceReportPage() {
  const [from, setFrom] = useState("2025-06-15");
  const [to, setTo] = useState("2025-08-15");
  const [glType, setGlType] = useState<string>(GL_ACCOUNT_CLASSES[0]);
  const [glCode, setGlCode] = useState<string>(GL_CODE_OPTIONS[0]);
  const [costCenter, setCostCenter] = useState<string>(COST_CENTERS[0]);
  const [currency, setCurrency] = useState<string>(CURRENCIES[0]);
  const [branch, setBranch] = useState<string>(BRANCH_CODES[0]);
  const [preparedBy, setPreparedBy] = useState<string>(PREPARERS[0]);
  const [reviewedBy, setReviewedBy] = useState<string>(PREPARERS[0]);
  const [signDate, setSignDate] = useState("2025-06-15");
  const [ledgerRow, setLedgerRow] = useState<TbRow | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  return (
    <div className="tbr">
      <ReportTabs active="tb" />

      <div className="tbr-title-row">
        <h1>Trial Balance Report</h1>
        <button
          type="button"
          className="tbr-btn tbr-btn--ledger"
          onClick={() => {
            const row = ROWS.find((r) => `${r.glCode}-${r.branch}` === selectedKey);
            if (!row) {
              window.alert("Select a row in the table, then click View Ledger.");
              return;
            }
            setLedgerRow(row);
          }}
        >
          <EyeIcon />
          View Ledger
        </button>
      </div>

      <div className="tbr-filters">
        <div className="tbr-field tbr-field--range">
          <span>Date Range</span>
          <div className="tbr-range">
            <span className="tbr-range-label">From</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <span className="tbr-range-label">To</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <label className="tbr-field">
          <span>GL Account Type</span>
          <div className="tbr-select">
            <select value={glType} onChange={(e) => setGlType(e.target.value)}>
              {GL_ACCOUNT_CLASSES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="tbr-field">
          <span>GL Code</span>
          <div className="tbr-select">
            <select value={glCode} onChange={(e) => setGlCode(e.target.value)}>
              {GL_CODE_OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="tbr-field">
          <span>Cost center</span>
          <div className="tbr-select">
            <select value={costCenter} onChange={(e) => setCostCenter(e.target.value)}>
              {COST_CENTERS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="tbr-field">
          <span>Currency</span>
          <div className="tbr-select">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="tbr-field">
          <span>Branch Code</span>
          <div className="tbr-select">
            <select value={branch} onChange={(e) => setBranch(e.target.value)}>
              {BRANCH_CODES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
      </div>

      <div className="tbr-actions">
        <ExportMenu>
          <ExportIcon />
          Export
        </ExportMenu>
        <button type="button" className="tbr-btn tbr-btn--print" onClick={() => window.print()}>
          <PrintIcon />
          Print
        </button>
      </div>

      <div className="tbr-table-wrap">
        <table className="tbr-table">
          <thead>
            <tr>
              <th>GL Code</th>
              <th>GL Name</th>
              <th>Account Type</th>
              <th>Opening Balance</th>
              <th>
                <span className="tbr-th tbr-th--debit">Debit</span>
              </th>
              <th>
                <span className="tbr-th tbr-th--credit">Credit</span>
              </th>
              <th>Closing Balance</th>
              <th>Currency</th>
              <th>Branch</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const key = `${row.glCode}-${row.branch}`;
              return (
              <tr
                key={key}
                className={selectedKey === key ? "is-selected" : undefined}
                onClick={() => setSelectedKey(key)}
              >
                <td>{row.glCode}</td>
                <td>{row.glName}</td>
                <td>{row.accountType}</td>
                <td>{row.opening}</td>
                <td className="tbr-debit">{row.debit}</td>
                <td className="tbr-credit">{row.credit}</td>
                <td>{row.closing}</td>
                <td>{row.currency}</td>
                <td>{row.branch}</td>
                <td>
                  <button
                    type="button"
                    className="tbr-row-ledger"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedKey(key);
                      setLedgerRow(row);
                    }}
                  >
                    View Ledger
                  </button>
                </td>
              </tr>
              );
            })}
            <tr className="tbr-total">
              <td>TOTAL</td>
              <td colSpan={2} />
              <td>
                <strong>₦9,950,000.00</strong>
              </td>
              <td className="tbr-debit">
                <strong>₦1,605,000.00</strong>
              </td>
              <td className="tbr-credit">
                <strong>₦1,640,000.00</strong>
              </td>
              <td>
                <strong>₦11,345,000.00</strong>
              </td>
              <td colSpan={3} />
            </tr>
          </tbody>
        </table>
      </div>

      <div className="tbr-signoff">
        <label className="tbr-field">
          <span>Prepared By</span>
          <div className="tbr-select">
            <select value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)}>
              {PREPARERS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="tbr-field">
          <span>Reviewed By</span>
          <div className="tbr-select">
            <select value={reviewedBy} onChange={(e) => setReviewedBy(e.target.value)}>
              {PREPARERS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="tbr-field">
          <span>Date</span>
          <div className="tbr-date">
            <input type="date" value={signDate} onChange={(e) => setSignDate(e.target.value)} />
            <CalendarIcon />
          </div>
        </label>
      </div>

      <p className="tbr-hint">
        Related: <Link to="/reports/journal">Journal Report</Link>
        {" · "}
        <Link to="/reports/general-ledger">General Ledger</Link>
      </p>

      {ledgerRow ? (
        <ViewLedgerDrawer
          context={{
            glCode: ledgerRow.glCode,
            glName: ledgerRow.glName,
            currency: ledgerRow.currency || currency,
            branch: ledgerRow.branch || branch,
            from,
            to,
          }}
          onClose={() => setLedgerRow(null)}
        />
      ) : null}
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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
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

function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
