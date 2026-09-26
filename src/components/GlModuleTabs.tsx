import { NavLink } from "react-router-dom";
import "./GlModuleTabs.css";

const TABS = [
  { to: "/gl", label: "General Ledger", end: true },
  { to: "/gl/chart", label: "Chart of Accounts" },
  { to: "/gl/creation", label: "GL Creation" },
  { to: "/gl/mapping", label: "GL Mapping" },
  { to: "/reports/trial-balance", label: "Trial Balance" },
  { to: "/reports/journal", label: "Journal Report" },
  { to: "/reports/general-ledger", label: "GL Report" },
  { to: "/reports/pnl", label: "P&L Report" },
] as const;

export function GlModuleTabs() {
  return (
    <nav className="gl-tabs" aria-label="General Ledger modules">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={"end" in tab ? tab.end : false}
          className={({ isActive }) => (isActive ? "is-active" : undefined)}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
