import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./layout/AppShell";
import { TellerShell } from "./layout/TellerShell";
import { AccountStatementReportPage } from "./pages/AccountStatementReportPage";
import { AccountsPage } from "./pages/AccountsPage";
import { AuditTrailReportPage } from "./pages/AuditTrailReportPage";
import { BondContractsPage, TreasuryBillsPage } from "./pages/BondContractsPage";
import { ChartOfAccountsPage } from "./pages/ChartOfAccountsPage";
import { ContractBalancesPage } from "./pages/ContractBalancesPage";
import { ContractProductPage } from "./pages/ContractProductPage";
import { DailySummaryPage } from "./pages/DailySummaryPage";
import { ForexContractsPage } from "./pages/ForexContractsPage";
import { GeneralLedgerPage } from "./pages/GeneralLedgerPage";
import { GeneralLedgerReportPage } from "./pages/GeneralLedgerReportPage";
import { GlCreationPage } from "./pages/GlCreationPage";
import { GlMappingPage } from "./pages/GlMappingPage";
import { JournalReportPage } from "./pages/JournalReportPage";
import { LettersOfCreditPage } from "./pages/LettersOfCreditPage";
import { LoanContractsPage } from "./pages/LoanContractsPage";
import { LoginPage } from "./pages/LoginPage";
import { CatalogGalleryPage } from "./pages/CatalogGalleryPage";
import { ModuleConfigurationPage } from "./pages/ModuleConfigurationPage";
import { TransactionsLayout } from "./components/TransactionsLayout";
import { NotificationsPage } from "./pages/NotificationsPage";
import { PlacementContractsPage } from "./pages/PlacementContractsPage";
import { PnlEntryPage } from "./pages/PnlEntryPage";
import { PnlReportPage } from "./pages/PnlReportPage";
import { ProductSetupPage } from "./pages/ProductSetupPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ReportingHubPage } from "./pages/ReportingHubPage";
import { SpecialEntryPage } from "./pages/SpecialEntryPage";
import { StatementEntryPage } from "./pages/StatementEntryPage";
import {
  BankDraftLedgerPage,
  CancelBankDraftPage,
  FlagBankDraftPage,
  IssueBankDraftPage,
  RepurchaseBankDraftPage,
  SettleBankDraftPage,
} from "./pages/teller/BankDraftPages";
import {
  CashDepositPage,
  CashTillTransferPage,
  CashWithdrawalPage,
  ReprintCashSlipPage,
  ReverseCashPage,
} from "./pages/teller/CashTxnPages";
import {
  CloseTillPage,
  ReopenTillPage,
  TellerAccountAdminPage,
  TillCreationPage,
} from "./pages/teller/TellerAdminPages";
import { TillManagementPage } from "./pages/teller/TillManagementPage";
import {
  DepositTransactionPage,
  EnquiriesHubPage,
  EnquiryPage,
} from "./pages/teller/EnquiryPages";
import {
  CurrencyExchangePage,
  FixedTransferPage,
  FtModulePage,
  PostingBetweenNgnFcyPage,
  PostingBetweenNgnPage,
  TransferCustomerInternalPage,
  TransferInternalPage,
} from "./pages/teller/TransferPostingPages";
import { TellerCashHubPage } from "./pages/TellerCashHubPage";
import { TransactionsHubPage } from "./pages/TransactionsHubPage";
import { TrialBalanceReportPage } from "./pages/TrialBalanceReportPage";
import { RoleManagementPage, UserManagementPage } from "./pages/UserManagementPage";
import { WelcomeDashboardPage } from "./pages/WelcomeDashboardPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route element={<AppShell />}>
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/dashboard" element={<WelcomeDashboardPage />} />
          <Route path="/reports/daily-summary" element={<DailySummaryPage />} />
          <Route path="/transactions" element={<TransactionsLayout />}>
            <Route index element={<TransactionsHubPage />} />
            <Route path="statement-entry" element={<StatementEntryPage />} />
            <Route path="special-entry" element={<SpecialEntryPage />} />
            <Route path="pnl-entry" element={<PnlEntryPage />} />
          </Route>
          <Route path="/gl" element={<GeneralLedgerPage />} />
          <Route path="/gl/chart" element={<ChartOfAccountsPage />} />
          <Route path="/gl/creation" element={<GlCreationPage />} />
          <Route path="/gl/mapping" element={<GlMappingPage />} />
          <Route path="/gl/pnl-entry" element={<Navigate to="/transactions/pnl-entry" replace />} />
          <Route path="/gl/special-entry" element={<Navigate to="/transactions/special-entry" replace />} />
          <Route path="/gl/statement-entry" element={<Navigate to="/transactions/statement-entry" replace />} />
          <Route path="/contracts" element={<Navigate to="/contracts/balances" replace />} />
          <Route path="/contracts/balances" element={<ContractBalancesPage />} />
          <Route path="/contracts/products" element={<ContractProductPage />} />
          <Route path="/contracts/bonds" element={<BondContractsPage />} />
          <Route path="/contracts/loans" element={<LoanContractsPage />} />
          <Route path="/contracts/treasury-bills" element={<TreasuryBillsPage />} />
          <Route path="/contracts/forex" element={<ForexContractsPage />} />
          <Route path="/contracts/placement" element={<PlacementContractsPage />} />
          <Route path="/contracts/lc" element={<LettersOfCreditPage />} />
          <Route path="/reporting" element={<ReportingHubPage />} />
          <Route path="/reports" element={<Navigate to="/reporting" replace />} />
          <Route path="/reports/account-statement" element={<AccountStatementReportPage />} />
          <Route path="/reports/audit-trail" element={<AuditTrailReportPage />} />
          <Route path="/reports/general-ledger" element={<GeneralLedgerReportPage />} />
          <Route path="/reports/pnl" element={<PnlReportPage />} />
          <Route path="/reports/trial-balance" element={<TrialBalanceReportPage />} />
          <Route path="/reports/journal" element={<JournalReportPage />} />
          <Route path="/products" element={<Navigate to="/settings/products" replace />} />
          <Route path="/settings" element={<Navigate to="/settings/users" replace />} />
          <Route path="/settings/users" element={<UserManagementPage />} />
          <Route path="/settings/roles" element={<RoleManagementPage />} />
          <Route path="/settings/products" element={<ProductSetupPage />} />
          <Route path="/settings/modules" element={<ModuleConfigurationPage />} />
          <Route path="/settings/catalogs" element={<CatalogGalleryPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route element={<TellerShell />}>
          <Route path="/teller" element={<TellerCashHubPage variant="teller" />} />
          <Route path="/teller/cash" element={<Navigate to="/teller" replace />} />
          <Route path="/teller/cash/mail" element={<TellerCashHubPage variant="mail" />} />
          <Route path="/teller/admin" element={<TellerAccountAdminPage />} />
          <Route path="/teller/tills" element={<TillManagementPage />} />
          <Route path="/teller/tills/create" element={<TillCreationPage />} />
          <Route path="/teller/tills/reopen" element={<ReopenTillPage />} />
          <Route path="/teller/tills/close" element={<CloseTillPage />} />
          <Route path="/teller/enquiries" element={<EnquiriesHubPage />} />
          <Route path="/teller/enquiries/image" element={<EnquiryPage kind="image" />} />
          <Route path="/teller/enquiries/account" element={<EnquiryPage kind="account" />} />
          <Route path="/teller/enquiries/customer" element={<EnquiryPage kind="customer" />} />
          <Route path="/teller/currency-exchange" element={<CurrencyExchangePage />} />
          <Route path="/teller/transfers/lcy" element={<CashTillTransferPage kind="lcy" />} />
          <Route path="/teller/transfers/fcy" element={<CashTillTransferPage kind="fcy" />} />
          <Route path="/teller/deposits/transaction" element={<DepositTransactionPage />} />
          <Route path="/teller/deposits/lcy" element={<CashDepositPage currency="LCY" />} />
          <Route path="/teller/deposits/fcy" element={<CashDepositPage currency="FCY" />} />
          <Route path="/teller/withdrawals/lcy" element={<CashWithdrawalPage mode="lcy" />} />
          <Route path="/teller/withdrawals/cheque" element={<CashWithdrawalPage mode="cheque" />} />
          <Route path="/teller/withdrawals/counter-cheque" element={<CashWithdrawalPage mode="counter-cheque" />} />
          <Route path="/teller/withdrawals/internal" element={<CashWithdrawalPage mode="internal" />} />
          <Route path="/teller/reverse/deposit" element={<ReverseCashPage kind="deposit" />} />
          <Route path="/teller/reverse/withdrawal" element={<ReverseCashPage kind="withdrawal" />} />
          <Route path="/teller/reprint" element={<ReprintCashSlipPage />} />
          <Route path="/teller/drafts" element={<Navigate to="/teller/drafts/issue" replace />} />
          <Route path="/teller/drafts/issue" element={<IssueBankDraftPage />} />
          <Route path="/teller/drafts/cancel" element={<CancelBankDraftPage />} />
          <Route path="/teller/drafts/flag" element={<FlagBankDraftPage />} />
          <Route path="/teller/drafts/repurchase" element={<RepurchaseBankDraftPage />} />
          <Route path="/teller/drafts/settle" element={<SettleBankDraftPage />} />
          <Route path="/teller/drafts/ledger" element={<BankDraftLedgerPage />} />
          <Route path="/teller/ft" element={<FtModulePage />} />
          <Route path="/teller/ft/fixed" element={<FixedTransferPage />} />
          <Route path="/teller/transfers/internal-account" element={<TransferInternalPage />} />
          <Route path="/teller/transfers/customer-internal" element={<TransferCustomerInternalPage />} />
          <Route path="/teller/posting/ngn" element={<PostingBetweenNgnPage />} />
          <Route path="/teller/posting/ngn-fcy" element={<PostingBetweenNgnFcyPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
