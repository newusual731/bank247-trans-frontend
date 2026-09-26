import { Outlet } from "react-router-dom";
import { TransactionsNav } from "./TransactionsNav";

export function TransactionsLayout() {
  return (
    <div className="txn-layout">
      <TransactionsNav />
      <Outlet />
    </div>
  );
}
