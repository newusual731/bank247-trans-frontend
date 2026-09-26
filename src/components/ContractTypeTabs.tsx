import { NavLink } from "react-router-dom";
import "./ContractTypeTabs.css";

export const CONTRACT_TABS = [
  { to: "/contracts/balances", label: "Contract Balances" },
  { to: "/contracts/products", label: "Contract Product" },
  { to: "/contracts/loans", label: "Loan Contracts" },
  { to: "/contracts/treasury-bills", label: "Treasury Bill" },
  { to: "/contracts/bonds", label: "Bond Contracts" },
  { to: "/contracts/forex", label: "Forex Contracts" },
  { to: "/contracts/placement", label: "Placement Contracts" },
  { to: "/contracts/lc", label: "Letters of Credit" },
  { to: "/gl/chart", label: "Chart of Accounts" },
] as const;

export function ContractTypeTabs() {
  return (
    <nav className="ctabs" aria-label="Contract types">
      {CONTRACT_TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => (isActive ? "is-active" : undefined)}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
