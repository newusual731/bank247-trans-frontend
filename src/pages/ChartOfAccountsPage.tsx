import { useState } from "react";
import { FilterDropdown } from "../components/FilterDropdown";
import { GlModuleTabs } from "../components/GlModuleTabs";
import { CONTRACT_ENTRIES_SORT } from "../data/filterDropdownOptions";
import "./ChartOfAccountsPage.css";

type CoaRow = {
  dateCreated: string;
  account: string;
  generalLedger: string;
  ledgerName: string;
  headersName: string;
  relatedHeaders: string;
  opening: string;
  totalDebit: string;
  totalCredit: string;
  closing: string;
};

const ROWS: CoaRow[] = Array.from({ length: 8 }, () => ({
  dateCreated: "06/15/2025",
  account: "Assets",
  generalLedger: "000123",
  ledgerName: "Staff Salary Account",
  headersName: "11073",
  relatedHeaders: "LOANS AND ADVANCES TO CUSTOMER",
  opening: "1,416,209.83",
  totalDebit: "4,653,940.82",
  totalCredit: "4,653,940.82",
  closing: "1,416,209.83",
}));

export function ChartOfAccountsPage() {
  const [assetFilter, setAssetFilter] = useState("All");
  const [reportDate, setReportDate] = useState("2025-06-15");
  const [sortBy, setSortBy] = useState<string>(CONTRACT_ENTRIES_SORT[0]);

  return (
    <div className="coa">
      <GlModuleTabs />
      <div className="coa-head">
        <div>
          <h1>Chart of Account</h1>
          <button type="button" className="coa-export">
            <ExportIcon />
            Export
          </button>
        </div>
        <div className="coa-toolbar">
          <label className="coa-field">
            <span>Total Asset</span>
            <div className="coa-select">
              <select value={assetFilter} onChange={(e) => setAssetFilter(e.target.value)}>
                <option>All</option>
                <option>Assets</option>
                <option>Liabilities</option>
                <option>Equity</option>
              </select>
              <ChevronDown />
            </div>
          </label>
          <label className="coa-field">
            <span>Report Date</span>
            <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
          </label>
          <div className="coa-field">
            <span>
              <FilterIcon /> Filter
            </span>
            <FilterDropdown
              aria-label="Sort chart of accounts"
              className="coa-fdrop"
              triggerClassName="coa-fdrop-trigger"
              options={CONTRACT_ENTRIES_SORT}
              value={sortBy}
              onSelect={setSortBy}
              trigger={
                <>
                  <span>{sortBy}</span>
                  <ChevronDown />
                </>
              }
            />
          </div>
        </div>
      </div>

      <div className="coa-table-wrap">
        <table className="coa-table">
          <thead>
            <tr>
              <th>
                Date Created <ChevronDown />
              </th>
              <th>
                Account <ChevronDown />
              </th>
              <th>
                General Ledger <ChevronDown />
              </th>
              <th>
                Ledger Name <ChevronDown />
              </th>
              <th>
                Headers Name <ChevronDown />
              </th>
              <th>
                Related Headers Name <ChevronDown />
              </th>
              <th>Opening Balance</th>
              <th>Total Debit</th>
              <th>Total Credit</th>
              <th>Closing Balance</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr key={i}>
                <td>{row.dateCreated}</td>
                <td>{row.account}</td>
                <td>{row.generalLedger}</td>
                <td>{row.ledgerName}</td>
                <td>{row.headersName}</td>
                <td>{row.relatedHeaders}</td>
                <td>{row.opening}</td>
                <td>{row.totalDebit}</td>
                <td>{row.totalCredit}</td>
                <td>{row.closing}</td>
              </tr>
            ))}
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

function FilterIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
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
