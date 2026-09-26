import { useState } from "react";
import { PARTY_SCOPES, TXN_CODES } from "../data/accountTypeOptions";
import "./StatementEntryPage.css";
import { AddEntryModal } from "./GlEntryModals";

type StmtRow = {
  refId: string;
  date: string;
  glCode: string;
  txnType: string;
  debitAccount: string;
  creditAccount: string;
  description: string;
  amount: string;
  status: "Pending" | "Posted";
};

const ACCOUNT_NUMS = ["All", "006238914- Naira", "0051389315"] as const;
const GL_CODES = ["All", "11000", "11000-11999"] as const;
const TXN_TYPES = ["All", "179004 Deposit", "Savings Account", "T0004-Deposit"] as const;

const ROWS: StmtRow[] = [
  {
    refId: "Ref2325t2hh",
    date: "06/15/2025",
    glCode: "11000-11999",
    txnType: "Savings Account",
    debitAccount: "Till Account",
    creditAccount: "Credit Account",
    description: "Rent Payment",
    amount: "₦500,000.00",
    status: "Posted",
  },
  ...Array.from({ length: 9 }, () => ({
    refId: "Ref2325t2hh",
    date: "06/15/2025",
    glCode: "11000-11999",
    txnType: "Savings Account",
    debitAccount: "Till Account",
    creditAccount: "Credit Account",
    description: "Rent Payment",
    amount: "₦500,000.00",
    status: "Pending" as const,
  })),
];

export function StatementEntryPage() {
  const [expanded, setExpanded] = useState(false);
  const [entryOpen, setEntryOpen] = useState(false);
  const [account, setAccount] = useState<string>(PARTY_SCOPES[1]);
  const [accountNum, setAccountNum] = useState<string>(ACCOUNT_NUMS[1]);
  const [glCode, setGlCode] = useState<string>(GL_CODES[1]);
  const [txnType, setTxnType] = useState<string>(TXN_TYPES[1]);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("2025-06-15");
  const [to, setTo] = useState("2025-06-15");

  return (
    <div className={`stm${expanded ? " is-expanded" : ""}`}>
      <div className="stm-head">
        <h1>Statement Entry</h1>
        <div className="stm-head-right">
          <button type="button" className="stm-export" onClick={() => window.print()}>
            <ExportIcon />
            Export
          </button>
          <label className="stm-search">
            <SearchIcon />
            <input
              type="search"
              placeholder="Search for ref Narration"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="stm-filters">
        <label className="stm-field">
          <span>Account</span>
          <div className="stm-select">
            <select value={account} onChange={(e) => setAccount(e.target.value)}>
              {PARTY_SCOPES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="stm-field">
          <span>Account Num</span>
          <div className="stm-select">
            <select value={accountNum} onChange={(e) => setAccountNum(e.target.value)}>
              {ACCOUNT_NUMS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="stm-field">
          <span>GL Code</span>
          <div className="stm-select">
            <select value={glCode} onChange={(e) => setGlCode(e.target.value)}>
              {GL_CODES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="stm-field">
          <span>Transaction Type</span>
          <div className="stm-select">
            <select value={txnType} onChange={(e) => setTxnType(e.target.value)}>
              {TXN_TYPES.map((o) => (
                <option key={o}>{o}</option>
              ))}
              {TXN_CODES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
      </div>

      <div className="stm-body">
        <div className="stm-table-wrap">
          <table className="stm-table">
            <thead>
              <tr>
                <th>Ref ID</th>
                <th>Date</th>
                <th>GL Code</th>
                <th>Transaction Type</th>
                <th className="is-debit">Debit Account</th>
                <th className="is-credit">Credit Account</th>
                <th>Description</th>
                <th>Amount</th>
                {expanded ? (
                  <>
                    <th>Action</th>
                    <th>Status</th>
                  </>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={i}>
                  <td>{row.refId}</td>
                  <td>{row.date}</td>
                  <td>{row.glCode}</td>
                  <td>{row.txnType}</td>
                  <td className="is-debit">{row.debitAccount}</td>
                  <td className="is-credit">
                    <span className="stm-pill stm-pill--credit">{row.creditAccount}</span>
                  </td>
                  <td>{row.description}</td>
                  <td className="is-amount">{row.amount}</td>
                  {expanded ? (
                    <>
                      <td>
                        <button type="button" className="stm-edit" onClick={() => setEntryOpen(true)}>
                          Edit <span aria-hidden>·</span>
                        </button>
                      </td>
                      <td>
                        <span
                          className={`stm-pill${row.status === "Pending" ? " stm-pill--pending" : " stm-pill--posted"}`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="stm-more" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Collapse" : "View More"}
          </button>
        </div>

        {!expanded ? (
          <aside className="stm-rail">
            <div className="stm-dates">
              <span>Date Range</span>
              <div>
                <label>
                  From
                  <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </label>
                <label>
                  To
                  <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </label>
              </div>
            </div>

            <div className="stm-card">
              <div className="stm-card-head">
                <h3>Account Chat</h3>
                <select defaultValue="6 months">
                  <option>6 months</option>
                  <option>12 months</option>
                </select>
              </div>
              <AccountChatDonut />
              <div className="stm-legend">
                <span>
                  <i className="is-purple" /> SMT
                </span>
                <span>
                  <i className="is-pink" /> Special E
                </span>
                <span>
                  <i className="is-blue" /> P&L
                </span>
                <span>
                  <i className="is-gold" /> Total
                </span>
              </div>
            </div>

            <div className="stm-card">
              <div className="stm-card-head">
                <h3>Growth</h3>
                <select defaultValue="Yearly">
                  <option>Yearly</option>
                  <option>Monthly</option>
                </select>
              </div>
              <GrowthChart />
            </div>

            <div className="stm-stats">
              <div>
                <span>Top month</span>
                <strong>November</strong>
                <em>2019</em>
              </div>
              <div>
                <span>Top year</span>
                <strong>2023</strong>
                <em>2M New Customers</em>
              </div>
              <div>
                <span>Top Members</span>
                <strong>Adeyemi Makun</strong>
                <em>Oasis Organic Inc.</em>
              </div>
            </div>
          </aside>
        ) : null}
      </div>
      {entryOpen ? <AddEntryModal onClose={() => setEntryOpen(false)} /> : null}
    </div>
  );
}

function AccountChatDonut() {
  return (
    <div className="stm-donut">
      <svg viewBox="0 0 160 160" width="168" height="168" aria-hidden>
        <circle cx="80" cy="80" r="52" fill="none" stroke="#eceff1" strokeWidth="26" />
        <circle
          cx="80"
          cy="80"
          r="52"
          fill="none"
          stroke="#60a5fa"
          strokeWidth="26"
          strokeDasharray="90 327"
          transform="rotate(-90 80 80)"
        />
        <circle
          cx="80"
          cy="80"
          r="52"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="26"
          strokeDasharray="95 327"
          strokeDashoffset="-90"
          transform="rotate(-90 80 80)"
        />
        <circle
          cx="80"
          cy="80"
          r="52"
          fill="none"
          stroke="#f472b6"
          strokeWidth="26"
          strokeDasharray="80 327"
          strokeDashoffset="-185"
          transform="rotate(-90 80 80)"
        />
        <circle
          cx="80"
          cy="80"
          r="52"
          fill="none"
          stroke="#ef4444"
          strokeWidth="26"
          strokeDasharray="40 327"
          strokeDashoffset="-265"
          transform="rotate(-90 80 80)"
        />
      </svg>
      <div className="stm-donut-center">
        <strong>$452</strong>
        <span>september</span>
      </div>
    </div>
  );
}

function GrowthChart() {
  return (
    <svg viewBox="0 0 280 120" className="stm-growth" role="img" aria-label="Growth">
      <g stroke="#eef0f2" strokeWidth="1">
        {[20, 40, 60, 80, 100].map((y) => (
          <line key={y} x1="28" x2="270" y1={y} y2={y} />
        ))}
      </g>
      <polyline
        fill="rgba(74, 222, 128, 0.28)"
        stroke="#4ade80"
        strokeWidth="2"
        points="28,95 60,80 90,70 120,55 150,62 180,78 210,50 240,42 270,28 270,110 28,110"
      />
      {["2016", "2018", "2020", "2022"].map((y, i) => (
        <text key={y} x={40 + i * 70} y="116" fontSize="9" fill="#9ca3af">
          {y}
        </text>
      ))}
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
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
