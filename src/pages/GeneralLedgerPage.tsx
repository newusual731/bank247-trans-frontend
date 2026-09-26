import { useState } from "react";
import { GlModuleTabs } from "../components/GlModuleTabs";
import { ExportMenu, SuccessModal } from "../components/SharedUiBits";
import {
  BRANCH_CODES,
  COST_CENTERS,
  CURRENCIES,
  GL_ACCOUNT_CLASSES,
} from "../data/accountTypeOptions";
import { AddEntryModal, ReverseEntryModal } from "./GlEntryModals";
import "./GeneralLedgerPage.css";

type LedgerRow = {
  entryId: string;
  date: string;
  runningBalance: string;
  debitAccount: string;
  creditAccount: string;
  amount: string;
  description: string;
  txnCode: string;
  status: string;
};

const ROWS: LedgerRow[] = Array.from({ length: 15 }, () => ({
  entryId: "000123",
  date: "April 20, 2025",
  runningBalance: "₦500,000.00",
  debitAccount: "10001",
  creditAccount: "20001",
  amount: "₦500,000.00",
  description: "Cash Deposit",
  txnCode: "T0004",
  status: "Posted",
}));

export function GeneralLedgerPage() {
  const [from, setFrom] = useState("2025-06-15");
  const [to, setTo] = useState("2025-06-15");
  const [glType, setGlType] = useState<string>(GL_ACCOUNT_CLASSES[0]);
  const [costCenter, setCostCenter] = useState<string>(COST_CENTERS[0]);
  const [currency, setCurrency] = useState<string>(CURRENCIES[0]);
  const [branch, setBranch] = useState<string>(BRANCH_CODES[0]);
  const [addOpen, setAddOpen] = useState(false);
  const [reverseOpen, setReverseOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successTitle, setSuccessTitle] = useState("Entry Submitted successfully created!");

  return (
    <div className="gl">
      <GlModuleTabs />
      <div className="gl-head">
        <h1>General Ledger</h1>
        <div className="gl-toolbar">
          <button type="button" className="gl-btn gl-btn--add" onClick={() => setAddOpen(true)}>
            + Add Entry
          </button>
          <button type="button" className="gl-btn gl-btn--reverse" onClick={() => setReverseOpen(true)}>
            Reverse
          </button>
          <ExportMenu />
        </div>
      </div>

      <div className="gl-filters">
        <div className="gl-field gl-field--range">
          <span>Date Range</span>
          <div className="gl-range">
            <span className="gl-range-label">From</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <span className="gl-range-label">To</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <label className="gl-field">
          <span>GL Account Type</span>
          <div className="gl-select">
            <select value={glType} onChange={(e) => setGlType(e.target.value)}>
              {GL_ACCOUNT_CLASSES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="gl-field">
          <span>Cost center</span>
          <div className="gl-select">
            <select value={costCenter} onChange={(e) => setCostCenter(e.target.value)}>
              {COST_CENTERS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="gl-field">
          <span>Currency</span>
          <div className="gl-select">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="gl-field">
          <span>Branch Code</span>
          <div className="gl-select">
            <select value={branch} onChange={(e) => setBranch(e.target.value)}>
              {BRANCH_CODES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
      </div>

      <div className="gl-table-wrap">
        <table className="gl-table">
          <thead>
            <tr>
              <th>Entry ID</th>
              <th>Date</th>
              <th>Running Balance</th>
              <th>
                Debit Account <ChevronDown />
              </th>
              <th>
                Credit Account <ChevronDown />
              </th>
              <th>Amount</th>
              <th>Description</th>
              <th>Transaction Code</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr key={i}>
                <td>{row.entryId}</td>
                <td>{row.date}</td>
                <td>{row.runningBalance}</td>
                <td>{row.debitAccount}</td>
                <td>{row.creditAccount}</td>
                <td>{row.amount}</td>
                <td>{row.description}</td>
                <td>{row.txnCode}</td>
                <td>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {addOpen ? (
        <AddEntryModal
          onClose={() => setAddOpen(false)}
          onPosted={() => {
            setSuccessTitle("Entry Submitted successfully created!");
            setSuccessOpen(true);
          }}
        />
      ) : null}
      {reverseOpen ? (
        <ReverseEntryModal
          onClose={() => setReverseOpen(false)}
          onSaved={() => {
            setSuccessTitle("Entry successfully created!");
            setSuccessOpen(true);
          }}
        />
      ) : null}
      {successOpen ? (
        <SuccessModal title={successTitle} onClose={() => setSuccessOpen(false)} />
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
