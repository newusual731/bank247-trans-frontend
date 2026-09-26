import { Link } from "react-router-dom";
import "./TellerCashHubPage.css";

type HubCard = {
  title: string;
  to: string;
  tone: string;
  icon: "bars" | "user" | "naira" | "dots" | "doc" | "term" | "sun";
  recommended?: boolean;
};

const TELLER_CARDS: HubCard[] = [
  {
    title: "Teller Account Administration",
    to: "/teller/admin",
    tone: "purple",
    icon: "bars",
    recommended: true,
  },
  {
    title: "Till Management",
    to: "/teller/tills",
    tone: "peach",
    icon: "user",
    recommended: true,
  },
  {
    title: "Cash Transaction Processing",
    to: "/teller/transfers/lcy",
    tone: "pink",
    icon: "naira",
  },
  { title: "Enquiries", to: "/teller/enquiries", tone: "navy", icon: "dots" },
  {
    title: "Reprint Cash deposit slip",
    to: "/teller/reprint",
    tone: "yellow",
    icon: "doc",
  },
  {
    title: "Module Configuration",
    to: "/settings/modules",
    tone: "brown",
    icon: "term",
  },
  {
    title: "REPORTING",
    to: "/reporting",
    tone: "orange",
    icon: "sun",
    recommended: true,
  },
];

const MAIL_CARDS: HubCard[] = [
  {
    title: "Cheque Transactions",
    to: "/teller/withdrawals/cheque",
    tone: "purple",
    icon: "bars",
    recommended: true,
  },
  {
    title: "Fund Transfers",
    to: "/teller/ft",
    tone: "peach",
    icon: "user",
    recommended: true,
  },
  {
    title: "Set-up automated transfer",
    to: "/teller/ft/fixed",
    tone: "pink",
    icon: "naira",
  },
  { title: "Enquiries", to: "/teller/enquiries", tone: "navy", icon: "dots" },
  {
    title: "Reprint Cash deposit slip",
    to: "/teller/reprint",
    tone: "yellow",
    icon: "doc",
  },
  {
    title: "Module Configuration",
    to: "/settings/modules",
    tone: "brown",
    icon: "term",
  },
  {
    title: "REPORTING",
    to: "/reporting",
    tone: "orange",
    icon: "sun",
    recommended: true,
  },
];

export function TellerCashHubPage({ variant = "teller" }: { variant?: "teller" | "mail" }) {
  const cards = variant === "mail" ? MAIL_CARDS : TELLER_CARDS;
  const subtitle = variant === "mail" ? "United Capital Money Market Fund" : "Bank 24/7";

  return (
    <div className="tch">
      <div className="tch-panel">
        <h1>Teller Cash</h1>
        <div className="tch-grid">
          {cards.map((card) => (
            <Link key={card.title} to={card.to} className="tch-card">
              <span className={`tch-icon is-${card.tone}`} aria-hidden>
                <CardIcon name={card.icon} />
              </span>
              {card.recommended ? (
                <span className="tch-rec">
                  <BoltIcon />
                  Recommended
                </span>
              ) : null}
              <strong>{card.title}</strong>
              <span className="tch-chev" aria-hidden>
                ›
              </span>
              <span className="tch-rule" aria-hidden />
              <em>{subtitle}</em>
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

function CardIcon({ name }: { name: HubCard["icon"] }) {
  switch (name) {
    case "bars":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M5 19V11M12 19V5M19 19v-8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case "user":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="3.2" stroke="#fff" strokeWidth="1.8" />
          <path d="M5.5 19c1.4-3 3.8-4.5 6.5-4.5S17.1 16 18.5 19" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "naira":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M7 6v12M17 6v12M7 10h10M7 14h10M8.5 6l7 12"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "dots":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="7" cy="8" r="1.4" fill="#fff" />
          <circle cx="12" cy="8" r="1.4" fill="#fff" />
          <circle cx="17" cy="8" r="1.4" fill="#fff" />
          <path d="M6 14h12M6 18h8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "doc":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M7 3.5h7l4 4V20a1.5 1.5 0 01-1.5 1.5H7A1.5 1.5 0 015.5 20V5A1.5 1.5 0 017 3.5z"
            stroke="#fff"
            strokeWidth="1.6"
          />
          <path d="M14 3.5V8h4.5" stroke="#fff" strokeWidth="1.6" />
        </svg>
      );
    case "term":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M6 8l4 4-4 4M12 16h6" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "sun":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3.2" stroke="#fff" strokeWidth="1.7" />
          <path
            d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4L18 18M18 6l-1.6 1.6M7.6 16.4L6 18"
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return null;
  }
}
