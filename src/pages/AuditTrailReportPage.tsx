import { useState } from "react";
import { Link } from "react-router-dom";
import "./AuditTrailReportPage.css";

type AuditRow = {
  date: string;
  time: string;
  user: string;
  role: string;
  module: string;
  activityType: string;
  details: string;
  ip: string;
  status: string;
  createdBy: string;
  createdDate: string;
};

const ROWS: AuditRow[] = [
  {
    date: "2025/07/03",
    time: "14:44",
    user: "David@b24/7",
    role: "Admin",
    module: "Contract Balance",
    activityType: "Update",
    details: "Debit",
    ip: "156.774.8376",
    status: "Successful",
    createdBy: "Kemi Adeosun",
    createdDate: "07/02/2025",
  },
  {
    date: "2025/07/03",
    time: "14:44",
    user: "Oye@b24/7",
    role: "Teller",
    module: "General Ledger",
    activityType: "Create",
    details: "Updated GL 11001",
    ip: "156.774.8376",
    status: "Successful",
    createdBy: "Kemi Adeosun",
    createdDate: "07/02/2025",
  },
  {
    date: "2025/07/03",
    time: "14:44",
    user: "Cole@b24/7",
    role: "Supervisor",
    module: "Contract Balance",
    activityType: "Update",
    details: "Debit",
    ip: "156.774.8376",
    status: "Failed",
    createdBy: "Kemi Adeosun",
    createdDate: "07/02/2025",
  },
  ...Array.from({ length: 5 }, () => ({
    date: "2025/07/03",
    time: "14:44",
    user: "Chucks@b24/7",
    role: "Teller",
    module: "General Ledger",
    activityType: "Create",
    details: "Updated GL 11001",
    ip: "156.774.8376",
    status: "Reversed",
    createdBy: "Kemi Adeosun",
    createdDate: "07/02/2025",
  })),
];

const MODULES = ["Fixed Deposit", "Contract Balance", "General Ledger", "Accounts", "Transactions"];
const USERS = ["David@b24/7", "Oye@b24/7", "Cole@b24/7", "Chucks@b24/7"];
const ACTIVITY_TYPES = ["Create", "Update", "Delete", "Login", "Export"];
const STATUSES = ["Successful", "Failed", "Reversed"];

export function AuditTrailReportPage() {
  const [date, setDate] = useState("2025-08-15");
  const [module, setModule] = useState(MODULES[0]);
  const [user, setUser] = useState(USERS[0]);
  const [activityType, setActivityType] = useState(ACTIVITY_TYPES[1]);
  const [status, setStatus] = useState(STATUSES[0]);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    by: string;
    date: string;
  } | null>(null);

  return (
    <div className="audit">
      <div className="audit-report-tabs">
        <Link to="/reports/account-statement">Account Statement</Link>
        <Link to="/reports/audit-trail" className="is-active">
          Audit Trail
        </Link>
        <Link to="/reports/general-ledger">General Ledger</Link>
        <Link to="/reports/pnl">Profit & Loss</Link>
      </div>

      <h1>Audit Trail Report</h1>

      <div className="audit-filters">
        <label className="audit-field">
          <span>Date</span>
          <div className="audit-date">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <CalendarIcon />
          </div>
        </label>
        <label className="audit-field">
          <span>Module</span>
          <div className="audit-select">
            <select value={module} onChange={(e) => setModule(e.target.value)}>
              {MODULES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="audit-field">
          <span>User</span>
          <div className="audit-select">
            <select value={user} onChange={(e) => setUser(e.target.value)}>
              {USERS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="audit-field">
          <span>Activity Type</span>
          <div className="audit-select">
            <select value={activityType} onChange={(e) => setActivityType(e.target.value)}>
              {ACTIVITY_TYPES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="audit-field">
          <span>Status</span>
          <div className="audit-select">
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
      </div>

      <div className="audit-actions">
        <button type="button" className="audit-btn audit-btn--export">
          <ExportIcon />
          Export
        </button>
        <button type="button" className="audit-btn audit-btn--print">
          <PrintIcon />
          Print
        </button>
      </div>

      <div className="audit-table-wrap">
        <table className="audit-table">
          <thead>
            <tr>
              <th className="is-left">Time Stamp</th>
              <th>User</th>
              <th>Role</th>
              <th>Module</th>
              <th>Activity Type</th>
              <th>Details</th>
              <th>IP Address</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr key={i}>
                <td className="is-left">
                  <div className="audit-ts">
                    <strong>{row.date}</strong>
                    <span>{row.time}</span>
                  </div>
                </td>
                <td>{row.user}</td>
                <td>{row.role}</td>
                <td>{row.module}</td>
                <td>{row.activityType}</td>
                <td>
                  <button
                    type="button"
                    className="audit-details"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({
                        x: rect.left + rect.width / 2,
                        y: rect.top - 8,
                        by: row.createdBy,
                        date: row.createdDate,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    {row.details}
                  </button>
                </td>
                <td>{row.ip}</td>
                <td>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tooltip ? (
        <div
          className="audit-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
          role="tooltip"
        >
          <div>Created By : {tooltip.by}</div>
          <div>Created Date : {tooltip.date}</div>
        </div>
      ) : null}
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
