import { useState } from "react";
import { GlModuleTabs } from "../components/GlModuleTabs";
import { COST_CENTERS } from "../data/accountTypeOptions";
import "./PnlEntryPage.css";

type PnlRow = {
  refId: string;
  date: string;
  glCode: string;
  txnType: string;
  product: string;
  description: string;
  amount: string;
};

const BUSINESS_UNITS = ["Retail Banking", "Corporate Banking", "Treasury"] as const;
const GL_CODES = ["50020", "11000", "11000-11999"] as const;
const PRODUCTS = ["Loan Term", "Fixed Deposit", "Treasury Bill"] as const;

const ROWS: PnlRow[] = [
  ...Array.from({ length: 9 }, () => ({
    refId: "Ref232512hh",
    date: "06/15/2025",
    glCode: "11000",
    txnType: "Savings Account",
    product: "Loan-Term",
    description: "Rent Payment",
    amount: "₦500,000.00",
  })),
  {
    refId: "Ref232512hh",
    date: "06/15/2025",
    glCode: "11000-11999",
    txnType: "Savings Account",
    product: "Loan-Term",
    description: "Rent Payment",
    amount: "₦500,000.00",
  },
];

export function PnlEntryPage() {
  const [expanded, setExpanded] = useState(false);
  const [unit, setUnit] = useState<string>(BUSINESS_UNITS[0]);
  const [glCode, setGlCode] = useState<string>(GL_CODES[0]);
  const [product, setProduct] = useState<string>(PRODUCTS[0]);
  const [costCenter, setCostCenter] = useState("Joined Cost Center");
  const [from, setFrom] = useState("2025-06-15");
  const [to, setTo] = useState("2025-06-15");

  return (
    <div className={`pnl${expanded ? " is-expanded" : ""}`}>
      <GlModuleTabs />
      <div className="pnl-head">
        <h1>P&L Entry</h1>
        <button type="button" className="pnl-export">
          <ExportIcon />
          Export
        </button>
      </div>

      <div className="pnl-filters">
        <label className="pnl-field">
          <span>Business Unit</span>
          <div className="pnl-select">
            <select value={unit} onChange={(e) => setUnit(e.target.value)}>
              {BUSINESS_UNITS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="pnl-field">
          <span>GL Code</span>
          <div className="pnl-select">
            <select value={glCode} onChange={(e) => setGlCode(e.target.value)}>
              {GL_CODES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="pnl-field">
          <span>Product</span>
          <div className="pnl-select">
            <select value={product} onChange={(e) => setProduct(e.target.value)}>
              {PRODUCTS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="pnl-field">
          <span>Cost Center</span>
          <div className="pnl-select">
            <select value={costCenter} onChange={(e) => setCostCenter(e.target.value)}>
              <option>Joined Cost Center</option>
              {COST_CENTERS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
      </div>

      <div className="pnl-body">
        <div className="pnl-table-wrap">
          <table className="pnl-table">
            <thead>
              <tr>
                <th>Ref ID</th>
                <th>Date</th>
                <th>GL Code</th>
                <th>Transaction Type</th>
                <th>Product</th>
                <th>Description</th>
                {expanded ? (
                  <>
                    <th>Amount</th>
                    <th>Action</th>
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
                  <td>{row.product}</td>
                  <td>{row.description}</td>
                  {expanded ? (
                    <>
                      <td>{row.amount}</td>
                      <td>
                        <button type="button" className="pnl-edit">
                          Edit
                        </button>
                      </td>
                    </>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="pnl-more" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Collapse" : "View More"}
          </button>
        </div>

        {!expanded ? (
          <aside className="pnl-rail">
            <div className="pnl-dates">
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

            <div className="pnl-card">
              <div className="pnl-card-head">
                <h3>Account Chat</h3>
                <select defaultValue="6 months">
                  <option>6 months</option>
                  <option>12 months</option>
                </select>
              </div>
              <AccountChatDonut />
              <div className="pnl-legend">
                <span>
                  <i className="is-purple" /> SMT
                </span>
                <span>
                  <i className="is-pink" /> Special E
                </span>
                <span>
                  <i className="is-blue" /> PNL
                </span>
                <span>
                  <i className="is-gold" /> Total
                </span>
              </div>
            </div>

            <div className="pnl-card">
              <div className="pnl-card-head">
                <h3>Growth</h3>
                <select defaultValue="Yearly">
                  <option>Yearly</option>
                  <option>Monthly</option>
                </select>
              </div>
              <GrowthChart />
            </div>

            <div className="pnl-stats">
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
              </div>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function AccountChatDonut() {
  return (
    <div className="pnl-donut">
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
      <div className="pnl-donut-center">
        <strong>$452</strong>
        <span>september</span>
      </div>
    </div>
  );
}

function GrowthChart() {
  return (
    <svg viewBox="0 0 280 120" className="pnl-growth" role="img" aria-label="Growth">
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
