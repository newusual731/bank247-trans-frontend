import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import "./TransactionsHubPage.css";

type TxTone = "purple" | "peach" | "pink";
type TxIconId = "statement" | "special" | "pnl";

type TxModule = {
  to: string;
  title: string;
  icon: TxIconId;
  tone: TxTone;
  recommended?: boolean;
};

const MODULES: TxModule[] = [
  {
    to: "/transactions/statement-entry",
    title: "Statement Entry",
    icon: "statement",
    tone: "purple",
    recommended: true,
  },
  {
    to: "/transactions/special-entry",
    title: "Special Entry",
    icon: "special",
    tone: "peach",
  },
  {
    to: "/transactions/pnl-entry",
    title: "Profit & Loss Entry",
    icon: "pnl",
    tone: "pink",
  },
];

const RECENT = [
  {
    ref: "Ref2325t2hh",
    type: "Statement Entry",
    debit: "Till Account",
    credit: "Credit Account",
    amount: "₦500,000.00",
    status: "Posted",
    date: "15-Jun-2025",
  },
  {
    ref: "Ref232512hh",
    type: "P&L Entry",
    debit: "50020",
    credit: "—",
    amount: "₦500,000.00",
    status: "Pending",
    date: "15-Jun-2025",
  },
  {
    ref: "Ref2325sp01",
    type: "Special Entry",
    debit: "CC02",
    credit: "—",
    amount: "₦500,000.00",
    status: "Posted",
    date: "14-Jun-2025",
  },
];

export function TransactionsHubPage() {
  return (
    <div className="txh">
      <header className="txh-head">
        <div>
          <h1>Transactions</h1>
          <p>Statement, special, and profit &amp; loss entry processing.</p>
        </div>
      </header>

      <div className="txh-grid">
        {MODULES.map((m) => (
          <Link key={m.to} to={m.to} className="txh-card">
            <span className={`txh-icon is-${m.tone}`} aria-hidden>
              <TxIcon name={m.icon} />
            </span>
            {m.recommended ? (
              <span className="txh-rec">
                <BoltIcon />
                Recommended
              </span>
            ) : null}
            <strong>{m.title}</strong>
            <span className="txh-chev" aria-hidden>
              ›
            </span>
            <span className="txh-rule" aria-hidden />
            <em>Bank 24/7</em>
          </Link>
        ))}
      </div>

      <section className="txh-recent">
        <div className="txh-recent-head">
          <h2>Recent Entries</h2>
          <Link to="/transactions/statement-entry">View Statement Entry</Link>
        </div>
        <div className="txh-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Type</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {RECENT.map((r) => (
                <tr key={`${r.ref}-${r.type}`}>
                  <td>{r.ref}</td>
                  <td>{r.type}</td>
                  <td>{r.debit}</td>
                  <td>{r.credit}</td>
                  <td>{r.amount}</td>
                  <td>{r.date}</td>
                  <td>
                    <span className={`txh-pill is-${r.status.toLowerCase()}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function BoltIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13 2L4 14h7l-1 8 10-14h-7l0-6z" />
    </svg>
  );
}

function TxIcon({ name }: { name: TxIconId }): ReactNode {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none" as const,
  };
  const stroke = "#fff";

  switch (name) {
    case "statement":
      return (
        <svg {...common}>
          <path
            d="M7 3.5h7l4 4V20a1.5 1.5 0 01-1.5 1.5H7A1.5 1.5 0 015.5 20V5A1.5 1.5 0 017 3.5z"
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M14 3.5V8h4" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M9 12h6M9 15.5h6M9 19h3.5" stroke={stroke} strokeWidth="1.55" strokeLinecap="round" />
        </svg>
      );
    case "special":
      return (
        <svg {...common}>
          <path
            d="M12 3.5l1.4 4.2H18l-3.6 2.7 1.4 4.3L12 12.8 8.2 14.7l1.4-4.3L6 7.7h4.6L12 3.5z"
            stroke={stroke}
            strokeWidth="1.55"
            strokeLinejoin="round"
          />
          <path d="M7 19.5h10" stroke={stroke} strokeWidth="1.55" strokeLinecap="round" />
        </svg>
      );
    case "pnl":
      return (
        <svg {...common}>
          <path
            d="M4.5 16.5l4.2-4.2 3.1 2.4 6.7-7.2"
            stroke={stroke}
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14.5 7.5h5v5"
            stroke={stroke}
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M4.5 19.5h15" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
