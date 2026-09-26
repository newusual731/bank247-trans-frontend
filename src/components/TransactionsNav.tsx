import { NavLink } from "react-router-dom";
import "./TransactionsNav.css";

const TABS = [
  { to: "/transactions", label: "Overview", end: true },
  { to: "/transactions/statement-entry", label: "Statement Entry" },
  { to: "/transactions/special-entry", label: "Special Entry" },
  { to: "/transactions/pnl-entry", label: "Profit & Loss Entry" },
] as const;

export function TransactionsNav() {
  return (
    <nav className="txn-nav" aria-label="Transaction modules">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={"end" in t ? t.end : false}
          className={({ isActive }) => (isActive ? "is-active" : undefined)}
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
