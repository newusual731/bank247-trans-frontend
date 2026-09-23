import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./layout/AppShell";
import { AccountStatementReportPage } from "./pages/AccountStatementReportPage";
import { AccountsPage } from "./pages/AccountsPage";
import { AuditTrailReportPage } from "./pages/AuditTrailReportPage";
import { BondContractsPage, ContractPlaceholderPage, TreasuryBillsPage } from "./pages/BondContractsPage";
import { ChartOfAccountsPage } from "./pages/ChartOfAccountsPage";
import { ContractBalancesPage } from "./pages/ContractBalancesPage";
import { DailySummaryPage } from "./pages/DailySummaryPage";
import { ForexContractsPage } from "./pages/ForexContractsPage";
import { GeneralLedgerPage } from "./pages/GeneralLedgerPage";
import { GeneralLedgerReportPage } from "./pages/GeneralLedgerReportPage";
import { GlCreationPage } from "./pages/GlCreationPage";
import { GlMappingPage } from "./pages/GlMappingPage";
import { LoanContractsPage } from "./pages/LoanContractsPage";
import { LoginPage } from "./pages/LoginPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { PnlEntryPage } from "./pages/PnlEntryPage";
import { PnlReportPage } from "./pages/PnlReportPage";
import { RoleManagementPage, UserManagementPage } from "./pages/UserManagementPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route element={<AppShell />}>
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/dashboard" element={<DailySummaryPage />} />
          <Route path="/reports/daily-summary" element={<DailySummaryPage />} />
          <Route path="/transactions" element={<PlaceholderPage title="Transactions" />} />
          <Route path="/gl" element={<GeneralLedgerPage />} />
          <Route path="/gl/chart" element={<ChartOfAccountsPage />} />
          <Route path="/gl/creation" element={<GlCreationPage />} />
          <Route path="/gl/mapping" element={<GlMappingPage />} />
          <Route path="/gl/pnl-entry" element={<PnlEntryPage />} />
          <Route path="/contracts" element={<Navigate to="/contracts/balances" replace />} />
          <Route path="/contracts/balances" element={<ContractBalancesPage />} />
          <Route path="/contracts/bonds" element={<BondContractsPage />} />
          <Route path="/contracts/loans" element={<LoanContractsPage />} />
          <Route path="/contracts/treasury-bills" element={<TreasuryBillsPage />} />
          <Route path="/contracts/forex" element={<ForexContractsPage />} />
          <Route
            path="/contracts/lc"
            element={<ContractPlaceholderPage title="Letters of Credit" />}
          />
          <Route path="/reports" element={<Navigate to="/reports/audit-trail" replace />} />
          <Route path="/reports/account-statement" element={<AccountStatementReportPage />} />
          <Route path="/reports/audit-trail" element={<AuditTrailReportPage />} />
          <Route path="/reports/general-ledger" element={<GeneralLedgerReportPage />} />
          <Route path="/reports/pnl" element={<PnlReportPage />} />
          <Route path="/settings" element={<Navigate to="/settings/users" replace />} />
          <Route path="/settings/users" element={<UserManagementPage />} />
          <Route path="/settings/roles" element={<RoleManagementPage />} />
          <Route path="/notifications" element={<PlaceholderPage title="Notifications" />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
