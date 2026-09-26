import { Link } from "react-router-dom";
import "./ReportTabs.css";

const TABS = [
  { to: "/reports/account-statement", label: "Account Statement", key: "asr" },
  { to: "/reports/audit-trail", label: "Audit Trail", key: "audit" },
  { to: "/reports/general-ledger", label: "General Ledger", key: "gl" },
  { to: "/reports/pnl", label: "Profit & Loss", key: "pnl" },
  { to: "/reports/trial-balance", label: "Trial Balance", key: "tb" },
  { to: "/reports/journal", label: "Journal Report", key: "jr" },
] as const;

export function ReportTabs({ active }: { active: (typeof TABS)[number]["key"] }) {
  return (
    <div className="report-tabs">
      {TABS.map((t) => (
        <Link key={t.key} to={t.to} className={active === t.key ? "is-active" : undefined}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}
