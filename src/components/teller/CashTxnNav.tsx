import { NavLink } from "react-router-dom";
import "./CashTxnNav.css";

const ITEMS = [
  { to: "/teller/transfers/lcy", label: "LCY Till Transfer" },
  { to: "/teller/transfers/fcy", label: "FCY Till Transfer" },
  { to: "/teller/deposits/fcy", label: "FCY Cash Deposit" },
  { to: "/teller/deposits/lcy", label: "LCY Cash Deposit" },
  { to: "/teller/reverse/deposit", label: "Reverse Cash Deposit" },
  { to: "/teller/reverse/withdrawal", label: "Reverse Cash Withdrawal" },
  { to: "/teller/withdrawals/lcy", label: "LCY Cash Withdrawal" },
  { to: "/teller/withdrawals/cheque", label: "LCY Cash Withdrawal with Cheque" },
  { to: "/teller/withdrawals/counter-cheque", label: "LCY Cash Withdrawal with Counter Cheque" },
  { to: "/teller/withdrawals/internal", label: "LCY Cash Withdrawal — Internal account" },
] as const;

export function CashTxnNav() {
  return (
    <aside className="ctn">
      <h2>Cash Till Transfer</h2>
      <nav aria-label="Cash transactions">
        {ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "is-active" : undefined)}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
