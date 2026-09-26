import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import "./ReportingHubPage.css";

type ReportTone = "purple" | "peach" | "pink" | "navy" | "yellow" | "brown" | "orange";

type ReportIconId =
  | "statement"
  | "audit"
  | "ledger"
  | "pnl"
  | "trial"
  | "journal"
  | "daily";

type ReportCard = {
  to: string;
  title: string;
  icon: ReportIconId;
  tone: ReportTone;
  recommended?: boolean;
};

const REPORTS: ReportCard[] = [
  {
    to: "/reports/daily-summary",
    title: "Daily Summary",
    icon: "daily",
    tone: "orange",
    recommended: true,
  },
  {
    to: "/reports/trial-balance",
    title: "Trial Balance Report",
    icon: "trial",
    tone: "peach",
    recommended: true,
  },
  {
    to: "/reports/account-statement",
    title: "Account Statement Report",
    icon: "statement",
    tone: "purple",
  },
  {
    to: "/reports/general-ledger",
    title: "General Ledger Report",
    icon: "ledger",
    tone: "navy",
  },
  {
    to: "/reports/pnl",
    title: "Profit & Loss Report",
    icon: "pnl",
    tone: "pink",
  },
  {
    to: "/reports/journal",
    title: "Journal Report",
    icon: "journal",
    tone: "yellow",
  },
  {
    to: "/reports/audit-trail",
    title: "Audit Trail Report",
    icon: "audit",
    tone: "brown",
  },
];

/** Same hub tile pattern as Teller Cash (Create Individual 1). */
export function ReportingHubPage() {
  return (
    <div className="rhub">
      <div className="rhub-panel">
        <h1>REPORTING</h1>
        <div className="rhub-grid">
          {REPORTS.map((r) => (
            <Link key={r.to} to={r.to} className="rhub-card">
              <span className={`rhub-icon is-${r.tone}`} aria-hidden>
                <ReportIcon name={r.icon} />
              </span>
              {r.recommended ? (
                <span className="rhub-rec">
                  <BoltIcon />
                  Recommended
                </span>
              ) : null}
              <strong>{r.title}</strong>
              <span className="rhub-chev" aria-hidden>
                ›
              </span>
              <span className="rhub-rule" aria-hidden />
              <em>Bank 24/7</em>
            </Link>
          ))}
        </div>
      </div>
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

function ReportIcon({ name }: { name: ReportIconId }): ReactNode {
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
    case "audit":
      return (
        <svg {...common}>
          <path
            d="M12 3.5l7 2.5v5.2c0 4.4-2.9 7.4-7 9.3-4.1-1.9-7-4.9-7-9.3V6L12 3.5z"
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M12 8.5v4.2l2.4 1.5"
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "ledger":
      return (
        <svg {...common}>
          <path
            d="M4.5 6.5c1.8-1 3.6-1.3 5.5-.4V19c-1.9-.9-3.7-.6-5.5.4V6.5zM19.5 6.5c-1.8-1-3.6-1.3-5.5-.4V19c1.9-.9 3.7-.6 5.5.4V6.5z"
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M10 6.2v12.6M14 6.2v12.6" stroke={stroke} strokeWidth="1.35" strokeLinecap="round" />
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
    case "trial":
      return (
        <svg {...common}>
          <path d="M12 4v14.5M8 18.5h8" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M5 9h14" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
          <path
            d="M5 9l-2.2 4.2A2.6 2.6 0 005.4 17h0a2.6 2.6 0 002.6-3.8L5.8 9M19 9l-2.2 4.2A2.6 2.6 0 0019.4 17h0a2.6 2.6 0 002.6-3.8L19.8 9"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "journal":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="2" stroke={stroke} strokeWidth="1.6" />
          <path d="M12 4.5v15M4.5 9h15M4.5 14h15" stroke={stroke} strokeWidth="1.45" />
          <path d="M7.2 11.5h2.6M14.2 16.5h2.6" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "daily":
      return (
        <svg {...common}>
          <rect x="4" y="5.5" width="16" height="14" rx="2" stroke={stroke} strokeWidth="1.6" />
          <path d="M4 10h16M9 3.5v4M15 3.5v4" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M8.5 14h3M14.5 14h1" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
