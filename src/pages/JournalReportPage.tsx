import { useState } from "react";
import { ViewLedgerDrawer } from "../components/ViewLedgerDrawer";
import { Link } from "react-router-dom";
import { ReportTabs } from "../components/ReportTabs";
import { ExportMenu } from "../components/SharedUiBits";
import {
  BRANCH_CODES,
  BRANCH_NAMES,
  COST_CENTERS,
  CURRENCIES,
  GL_ACCOUNT_CLASSES,
  POSTING_STATUSES,
  TXN_CODES,
} from "../data/accountTypeOptions";
import "./JournalReportPage.css";

export type JournalReportVariant = "classic" | "dash";

type ClassicRow = {
  journalNo: string;
  txnDate: string;
  glCode: string;
  glName: string;
  debit: string;
  credit: string;
  narration: string;
  reference: string;
  status: string;
};

type DashRow = {
  journalNo: string;
  txnCode: string;
  date: string;
  glCode: string;
  glName: string;
  debitAccount: string;
  creditAccount: string;
  amount: string;
  narration: string;
  status: string;
  currency: string;
  createdBy: string;
};

const CLASSIC_ROWS: ClassicRow[] = [
  {
    journalNo: "000123",
    txnDate: "April 20, 2025",
    glCode: "10100",
    glName: "Main Vault",
    debit: "₦500,000.00",
    credit: "₦500,000.00",
    narration: "Cash Deposit",
    reference: "REF/LC/0023-LC",
    status: "Posted",
  },
  {
    journalNo: "000124",
    txnDate: "April 21, 2025",
    glCode: "11101",
    glName: "Vault Account",
    debit: "₦250,000.00",
    credit: "₦250,000.00",
    narration: "Internal Transfer",
    reference: "REF/TRF/0081",
    status: "Posted",
  },
  {
    journalNo: "000125",
    txnDate: "April 22, 2025",
    glCode: "21001",
    glName: "Customer Deposits",
    debit: "₦1,000,000.00",
    credit: "₦1,000,000.00",
    narration: "FX Settlement",
    reference: "REF/FX/0144",
    status: "Pending",
  },
  {
    journalNo: "000126",
    txnDate: "April 23, 2025",
    glCode: "40001",
    glName: "Interest Income",
    debit: "₦75,000.00",
    credit: "₦75,000.00",
    narration: "Fee Income Accrual",
    reference: "REF/INC/0032",
    status: "Posted",
  },
  {
    journalNo: "000127",
    txnDate: "April 24, 2025",
    glCode: "50001",
    glName: "Admin Expenses",
    debit: "₦120,000.00",
    credit: "₦120,000.00",
    narration: "Office Supplies",
    reference: "REF/EXP/0099",
    status: "Reversed",
  },
  {
    journalNo: "000128",
    txnDate: "April 25, 2025",
    glCode: "10003",
    glName: "Inter Bank Placement",
    debit: "₦2,000,000.00",
    credit: "₦2,000,000.00",
    narration: "Overnight Placement",
    reference: "REF/PLC/0012",
    status: "Posted",
  },
];

const DASH_ROWS: DashRow[] = Array.from({ length: 8 }, (_, i) => ({
  journalNo: `JN/202507010 00${i + 1}`,
  txnCode: "DEP1001",
  date: "2025/07/01",
  glCode: "11101",
  glName: "Vault Account",
  debitAccount: "Customer Account-21101",
  creditAccount: "Bank Income Account-21101",
  amount: "₦500,000.00",
  narration: "Deposit From ABC Ltd",
  status: "Posted",
  currency: "NGN",
  createdBy: "Yomi Oke",
}));


export function JournalReportPage({
  variant: variantProp,
}: {
  variant?: JournalReportVariant;
} = {}) {
  const [variant, setVariant] = useState<JournalReportVariant>(variantProp ?? "classic");
  const [from, setFrom] = useState("2025-06-15");
  const [to, setTo] = useState("2025-08-15");
  const [branchCode, setBranchCode] = useState<string>(BRANCH_CODES[0]);
  const [branchName, setBranchName] = useState<string>(BRANCH_NAMES[0]);
  const [currency, setCurrency] = useState<string>(CURRENCIES[0]);
  const [costCenter, setCostCenter] = useState<string>(COST_CENTERS[0]);
  const [ledgerRow, setLedgerRow] = useState<{ glCode: string; glName: string } | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [glType, setGlType] = useState<string>(GL_ACCOUNT_CLASSES[0]);
  const [txnCode, setTxnCode] = useState<string>(TXN_CODES[0]);
  const [status, setStatus] = useState<string>(POSTING_STATUSES[0]);
  const [createdBy, setCreatedBy] = useState("Yomi Oke");

  const activeVariant = variantProp ?? variant;

  return (
    <div className="jnr">
      <ReportTabs active="jr" />

      <div className="jnr-title-row">
        <div>
          <h1>Journal Report</h1>
          {!variantProp ? (
            <div className="jnr-variant-tabs" role="tablist" aria-label="Journal report layout">
              <button
                type="button"
                role="tab"
                aria-selected={activeVariant === "classic"}
                className={activeVariant === "classic" ? "is-active" : undefined}
                onClick={() => setVariant("classic")}
              >
                Classic
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeVariant === "dash"}
                className={activeVariant === "dash" ? "is-active" : undefined}
                onClick={() => setVariant("dash")}
              >
                Dashboard
              </button>
            </div>
          ) : null}
        </div>
        {activeVariant === "classic" || activeVariant === "dash" ? (
          <button
            type="button"
            className="jnr-btn jnr-btn--ledger"
            onClick={() => {
              const classic = CLASSIC_ROWS.find((r) => r.journalNo === selectedKey);
              const dash = DASH_ROWS.find((r, i) => `${r.journalNo}-${i}` === selectedKey);
              const row = classic
                ? { glCode: classic.glCode, glName: classic.glName }
                : dash
                  ? { glCode: dash.glCode, glName: dash.glName }
                  : null;
              if (!row) {
                window.alert("Select a journal row, then click View Ledger.");
                return;
              }
              setLedgerRow(row);
            }}
          >
            <EyeIcon />
            View Ledger
          </button>
        ) : null}
      </div>

      {activeVariant === "classic" ? (
        <div className="jnr-filters jnr-filters--classic">
          <div className="jnr-field jnr-field--range">
            <span>Date Range</span>
            <div className="jnr-range">
              <span className="jnr-range-label">From</span>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              <span className="jnr-range-label">To</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          <label className="jnr-field">
            <span>Branch Code</span>
            <div className="jnr-select">
              <select value={branchCode} onChange={(e) => setBranchCode(e.target.value)}>
                {BRANCH_CODES.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </label>
          <label className="jnr-field">
            <span>Currency</span>
            <div className="jnr-select">
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </label>
          <label className="jnr-field">
            <span>Cost center</span>
            <div className="jnr-select">
              <select value={costCenter} onChange={(e) => setCostCenter(e.target.value)}>
                {COST_CENTERS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </label>
        </div>
      ) : (
        <div className="jnr-filters jnr-filters--dash">
          <div className="jnr-field jnr-field--range">
            <span>Date Range</span>
            <div className="jnr-range">
              <span className="jnr-range-label">From</span>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              <span className="jnr-range-label">To</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          <label className="jnr-field">
            <span>GL Account Type</span>
            <div className="jnr-select">
              <select value={glType} onChange={(e) => setGlType(e.target.value)}>
                {GL_ACCOUNT_CLASSES.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </label>
          <label className="jnr-field">
            <span>Cost center</span>
            <div className="jnr-select">
              <select value={costCenter} onChange={(e) => setCostCenter(e.target.value)}>
                {COST_CENTERS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </label>
          <label className="jnr-field">
            <span>Transaction Code</span>
            <div className="jnr-select">
              <select value={txnCode} onChange={(e) => setTxnCode(e.target.value)}>
                {TXN_CODES.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </label>
          <label className="jnr-field">
            <span>Currency</span>
            <div className="jnr-select">
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </label>
          <label className="jnr-field">
            <span>Branch</span>
            <div className="jnr-select">
              <select value={branchName} onChange={(e) => setBranchName(e.target.value)}>
                {BRANCH_NAMES.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </label>
          <label className="jnr-field">
            <span>Status</span>
            <div className="jnr-select">
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {POSTING_STATUSES.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </label>
          <label className="jnr-field">
            <span>Created By</span>
            <div className="jnr-select">
              <select value={createdBy} onChange={(e) => setCreatedBy(e.target.value)}>
                <option>Yomi Oke</option>
                <option>Ola Oki</option>
                <option>Admin</option>
              </select>
              <ChevronDown />
            </div>
          </label>
        </div>
      )}

      <div className="jnr-actions">
        <ExportMenu>
          <ExportIcon />
          Export
        </ExportMenu>
        <button type="button" className="jnr-btn jnr-btn--print" onClick={() => window.print()}>
          <PrintIcon />
          Print
        </button>
      </div>

      {activeVariant === "classic" ? (
        <div className="jnr-table-wrap">
          <table className="jnr-table">
            <thead>
              <tr>
                <th>Journal No</th>
                <th>Transaction Date</th>
                <th>GL Code</th>
                <th>GL Name</th>
                <th>Debit Account</th>
                <th>Credit Account</th>
                <th>Narration</th>
                <th>Reference</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {CLASSIC_ROWS.map((row) => (
                <tr
                  key={row.journalNo}
                  className={selectedKey === row.journalNo ? "is-selected" : undefined}
                  onClick={() => setSelectedKey(row.journalNo)}
                >
                  <td>{row.journalNo}</td>
                  <td>{row.txnDate}</td>
                  <td>{row.glCode}</td>
                  <td>{row.glName}</td>
                  <td>
                    <strong>{row.debit}</strong>
                  </td>
                  <td>
                    <strong>{row.credit}</strong>
                  </td>
                  <td>{row.narration}</td>
                  <td>{row.reference}</td>
                  <td>{row.status}</td>
                  <td>
                    <button
                      type="button"
                      className="jnr-row-ledger"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedKey(row.journalNo);
                        setLedgerRow({ glCode: row.glCode, glName: row.glName });
                      }}
                    >
                      View Ledger
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="jnr-total">
                <td>Total</td>
                <td colSpan={3} />
                <td>
                  <strong>₦3,945,000.00</strong>
                </td>
                <td>
                  <strong>₦3,945,000.00</strong>
                </td>
                <td colSpan={4} />
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="jnr-table-wrap">
          <table className="jnr-table jnr-table--dash">
            <thead>
              <tr>
                <th>Journal No</th>
                <th>Transaction Code</th>
                <th>Date</th>
                <th>GL Code</th>
                <th>GL Name</th>
                <th>
                  <span className="jnr-th jnr-th--debit">Debit Account</span>
                </th>
                <th>
                  <span className="jnr-th jnr-th--credit">Credit Account</span>
                </th>
                <th>Amount</th>
                <th>Narration</th>
                <th>Status</th>
                <th>Currency</th>
                <th>Created By</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {DASH_ROWS.map((row, i) => {
                const key = `${row.journalNo}-${i}`;
                return (
                <tr
                  key={key}
                  className={selectedKey === key ? "is-selected" : undefined}
                  onClick={() => setSelectedKey(key)}
                >
                  <td>{row.journalNo}</td>
                  <td>{row.txnCode}</td>
                  <td>{row.date}</td>
                  <td>{row.glCode}</td>
                  <td>{row.glName}</td>
                  <td>{row.debitAccount}</td>
                  <td>{row.creditAccount}</td>
                  <td>{row.amount}</td>
                  <td>{row.narration}</td>
                  <td>{row.status}</td>
                  <td>{row.currency}</td>
                  <td>{row.createdBy}</td>
                  <td>
                    <button
                      type="button"
                      className="jnr-row-ledger"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedKey(key);
                        setLedgerRow({ glCode: row.glCode, glName: row.glName });
                      }}
                    >
                      View Ledger
                    </button>
                  </td>
                </tr>
                );
              })}
              <tr className="jnr-total">
                <td>TOTAL</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>
                  <strong>₦4,000,000.00</strong>
                </td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <p className="jnr-hint">
        Related: <Link to="/reports/trial-balance">Trial Balance</Link>
        {" · "}
        <Link to="/reports/general-ledger">General Ledger</Link>
      </p>

      {ledgerRow ? (
        <ViewLedgerDrawer
          context={{
            glCode: ledgerRow.glCode,
            glName: ledgerRow.glName,
            currency,
            branch: branchCode,
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
