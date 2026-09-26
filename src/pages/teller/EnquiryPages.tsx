import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { useActionFeedback } from "../../components/feedback/useActionFeedback";
import "../../components/teller/TellerForm.css";
import "./EnquiryPages.css";

const ENQUIRY_CARDS: {
  to: string;
  title: string;
  icon: EnquiryIconId;
  tone: DepositTone;
  recommended?: boolean;
}[] = [
  {
    to: "/teller/enquiries/image",
    title: "Image Enquiries",
    icon: "image",
    tone: "purple",
    recommended: true,
  },
  {
    to: "/teller/enquiries/account",
    title: "General Account Enquiry",
    icon: "account",
    tone: "peach",
  },
  {
    to: "/teller/enquiries/customer",
    title: "Customer Enquiries",
    icon: "customer",
    tone: "pink",
  },
];

type DepositTone = "purple" | "peach" | "pink";
type DepositIconId = "lcy" | "fcy" | "reverse";
type EnquiryIconId = "image" | "account" | "customer";

const DEPOSIT_CARDS: {
  to: string;
  title: string;
  icon: DepositIconId;
  tone: DepositTone;
  recommended?: boolean;
}[] = [
  {
    to: "/teller/deposits/lcy",
    title: "LCY Cash Deposit",
    icon: "lcy",
    tone: "purple",
    recommended: true,
  },
  {
    to: "/teller/deposits/fcy",
    title: "FCY Cash Deposit",
    icon: "fcy",
    tone: "peach",
  },
  {
    to: "/teller/reverse/deposit",
    title: "Reverse Cash Deposit",
    icon: "reverse",
    tone: "pink",
  },
];

/** Same hub tile pattern as Teller Cash / Reporting / Deposit Transaction. */
export function EnquiriesHubPage() {
  return (
    <div className="dth">
      <div className="dth-panel">
        <h1>Enquiries</h1>
        <div className="dth-grid">
          {ENQUIRY_CARDS.map((c) => (
            <Link key={c.to} to={c.to} className="dth-card">
              <span className={`dth-icon is-${c.tone}`} aria-hidden>
                <EnquiryIcon name={c.icon} />
              </span>
              {c.recommended ? (
                <span className="dth-rec">
                  <BoltIcon />
                  Recommended
                </span>
              ) : null}
              <strong>{c.title}</strong>
              <span className="dth-chev" aria-hidden>
                ›
              </span>
              <span className="dth-rule" aria-hidden />
              <em>Bank 24/7</em>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Same hub tile pattern as Teller Cash / Reporting / Transactions. */
export function DepositTransactionPage() {
  return (
    <div className="dth">
      <div className="dth-panel">
        <h1>Deposit Transaction</h1>
        <div className="dth-grid">
          {DEPOSIT_CARDS.map((c) => (
            <Link key={c.to} to={c.to} className="dth-card">
              <span className={`dth-icon is-${c.tone}`} aria-hidden>
                <DepositIcon name={c.icon} />
              </span>
              {c.recommended ? (
                <span className="dth-rec">
                  <BoltIcon />
                  Recommended
                </span>
              ) : null}
              <strong>{c.title}</strong>
              <span className="dth-chev" aria-hidden>
                ›
              </span>
              <span className="dth-rule" aria-hidden />
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

function DepositIcon({ name }: { name: DepositIconId }): ReactNode {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none" as const,
  };
  const stroke = "#fff";

  switch (name) {
    case "lcy":
      /* Naira cash deposit */
      return (
        <svg {...common}>
          <path
            d="M7 6v12M17 6v12M7 10h10M7 14h10M8.5 6l7 12"
            stroke={stroke}
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "fcy":
      /* FX / dual currency */
      return (
        <svg {...common}>
          <circle cx="9" cy="12" r="4.5" stroke={stroke} strokeWidth="1.55" />
          <circle cx="15" cy="12" r="4.5" stroke={stroke} strokeWidth="1.55" />
          <path d="M12 8v8" stroke={stroke} strokeWidth="1.45" strokeLinecap="round" />
        </svg>
      );
    case "reverse":
      /* Reverse / undo arrows */
      return (
        <svg {...common}>
          <path
            d="M7 7h11M18 7l-3-3M18 7l-3 3M17 17H6M6 17l3-3M6 17l3 3"
            stroke={stroke}
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

function EnquiryIcon({ name }: { name: EnquiryIconId }): ReactNode {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none" as const,
  };
  const stroke = "#fff";

  switch (name) {
    case "image":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="14" rx="2" stroke={stroke} strokeWidth="1.6" />
          <circle cx="9.5" cy="10" r="1.8" stroke={stroke} strokeWidth="1.45" />
          <path
            d="M5.5 17l4-3.5 3 2.5 3.5-4 2.5 5"
            stroke={stroke}
            strokeWidth="1.45"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "account":
      return (
        <svg {...common}>
          <rect x="3.5" y="6" width="17" height="13" rx="2" stroke={stroke} strokeWidth="1.6" />
          <path d="M3.5 10h17" stroke={stroke} strokeWidth="1.6" />
          <circle cx="16.5" cy="14.5" r="1.4" fill={stroke} />
        </svg>
      );
    case "customer":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.2" stroke={stroke} strokeWidth="1.65" />
          <path
            d="M5.5 19c1.4-3 3.8-4.5 6.5-4.5S17.1 16 18.5 19"
            stroke={stroke}
            strokeWidth="1.65"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

type EnquiryKind = "image" | "account" | "customer";

const CONFIG: Record<
  EnquiryKind,
  { title: string; placeholder: string; columns: string[]; rows: string[][] }
> = {
  image: {
    title: "Image Enquiries",
    placeholder: "Cheque No / Image Ref / Account",
    columns: ["Date", "Reference", "Account", "Image Type", "Status"],
    rows: [
      ["15-Jun-2025", "IMG-00421", "2000145211", "Cheque Front", "Available"],
      ["15-Jun-2025", "IMG-00422", "2000145211", "Cheque Back", "Available"],
      ["14-Jun-2025", "IMG-00398", "1000299102", "Deposit Slip", "Available"],
    ],
  },
  account: {
    title: "General Account Enquiry",
    placeholder: "Account Number / Name",
    columns: ["Account", "Name", "Product", "Currency", "Balance", "Status"],
    rows: [
      ["2000145211", "Adebayo Okon", "Savings", "NGN", "₦1,250,000.00", "Active"],
      ["1000299102", "Chioma Nwosu", "Current", "NGN", "₦480,200.00", "Active"],
      ["3000111222", "Sam Kola", "Savings", "USD", "$12,400.00", "Dormant"],
    ],
  },
  customer: {
    title: "Customer Enquiries",
    placeholder: "Customer ID / Name / BVN",
    columns: ["Customer ID", "Name", "Branch", "Accounts", "KYC", "Status"],
    rows: [
      ["CUS-10021", "Adebayo Okon", "232-Ikeja", "3", "Complete", "Active"],
      ["CUS-10088", "Chioma Nwosu", "101-VI", "2", "Complete", "Active"],
      ["CUS-10102", "Sam Kola", "232-Ikeja", "1", "Pending", "Active"],
    ],
  },
};

export function EnquiryPage({ kind }: { kind: EnquiryKind }) {
  const cfg = CONFIG[kind];
  const { showToast, feedbackUi } = useActionFeedback();
  return (
    <>
      {feedbackUi}
      <div className="enq">
        <div className="tf-panel enq-panel">
          <h1 className="tf-title">{cfg.title}</h1>
          <label className="tf-field enq-search">
            <span>Search</span>
            <div className="enq-search-row">
              <input className="tf-input" placeholder={cfg.placeholder} />
              <button
                type="button"
                className="tf-submit"
                onClick={() => showToast("Success", `${cfg.title} search completed`)}
              >
                Search
              </button>
            </div>
          </label>
          <div className="enq-table-wrap">
            <table>
              <thead>
                <tr>
                  {cfg.columns.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cfg.rows.map((row, i) => (
                  <tr key={`${kind}-${i}`}>
                    {row.map((cell) => (
                      <td key={cell}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
