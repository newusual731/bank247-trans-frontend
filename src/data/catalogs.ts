/**
 * Root PNG catalogs / dropdowns from the transaction-processing Figma pack.
 * Product language corrects Figma typos (NGR→NGN, GBR→GBP, Reverse→Reversed,
 * Innternal→Internal, staus→status) while preserving intended option sets.
 */

export type CatalogDef = {
  /** Figma asset name(s) */
  source: string;
  /** Display title in gallery / docs */
  title: string;
  options: readonly string[];
  /** Peach hover (Referend drop down) */
  highlight?: boolean;
  /** Multi-select with checks (FILTER DROP DOWN-3/4 style) */
  checked?: boolean;
  /** Special UI kind beyond plain list */
  kind?: "list" | "search" | "month-picker" | "tabs" | "label" | "form";
};

/** ACCOUNT CLASS.png */
export const ACCOUNT_CLASSES = [
  "Current -Asset -",
  "Fixed Asset",
  "Long Term Liability",
  "Revenue",
  "Operating Expense",
] as const;

/** ACCOUNT TYPE.png */
export const ACCOUNT_TYPES = [
  "Fixed Deposit",
  "Savings Account",
  "Current Account",
  "Loan Account",
  "Placement",
  "Treasury Bill",
] as const;

/** ACCOUNT TYPE/DRPDWN.png — GL class filter */
export const GL_CLASSES = ["Asset", "Liability", "Equity", "Income", "Expenses"] as const;

/** ACCOUNT TYPE/DRPDWN-1.png */
export const INSTRUMENT_CODES = [
  "FD-180-Fixed Deposit",
  "TBILL-91-Treasury Bill",
  "BOND-1YR-FGN Bond (1year)",
  "CALL-NGN-Call Deposit Open)",
  "CP-30-Commercial Paper (30D)",
] as const;

/** BRANCH.png */
export const BRANCHES = ["Victoria Island", "Ogba", "Ikeja", "Surulere", "Ajah"] as const;

/** BRANCH CODE.png · -1 */
export const BRANCH_CODES_FULL = [
  "EKO001",
  "PHC002",
  "ABJ003",
  "IBD004",
  "ENU005",
  "KAN8006",
] as const;

/** COST CENTER.png — CC04 omitted in Figma */
export const COST_CENTERS_FULL = [
  "CC01",
  "CC02",
  "CC03",
  "CC05",
  "CC06",
  "CC07",
  "CC08",
  "CC09",
] as const;

/**
 * CURRENCY DRPDWN.png
 * Figma: NGR → NGN, GBR → GBP in product language.
 */
export const CURRENCY_DROPDOWN = ["USD", "NGN", "EUR", "GBP", "FRC", "RKSH", "CAD"] as const;

/** GL ACCOUNT TYPE.png */
export const GL_LEDGER_ROLES = ["Principal GL", "Interest GL", "Charges GL"] as const;

/** GL CATEGORY.png */
export const GL_CATEGORIES = [
  "Control Account",
  "Operating Account",
  "Suspense Account",
  "Contra Account",
] as const;

/** GL CODE.png */
export const GL_CODES = [
  "10001- Cash in Vault",
  "10002- Cash in Till",
  "10003- Inter Bank Placement",
  "10004- Treasury Bills",
  "10005- Fixed Deposit",
  "10006- Loan to Customers",
  "10007- Acc. Receivable Interest",
  "10005- Suspense Account",
] as const;

/** INTEREST GL.png */
export const INTEREST_GL_CODES = [
  "40101-Fixed Deposit Account",
  "40102-Fixed Deposit Account",
  "40103-Discount Income (T-Bill)",
  "40104-Fixed Deposit Account",
  "40105-Fixed Deposit Account",
] as const;

/** PRINCIPAL GL.png */
export const PRINCIPAL_GL_CODES = [
  "10101-Fixed Deposit",
  "10102-Treasury Bill",
  "10103-Bond Principal GL",
  "10102-Treasury Bill",
  "10104-Discount Income (TBill)",
] as const;

/** LOAN TYPE.png */
export const LOAN_TYPES = [
  "Personal Loan",
  "Business Loan",
  "Salary Advance Loan",
  "Asset Financing Loan",
] as const;

/** PRODUCT TYPE.png */
export const PRODUCT_TYPES = ["Fixed Deposit", "Treasury Bill", "Loan", "Bond", "Forex"] as const;

/** PRODUCT NAME.png / PRODUCT NAME 1.png */
export const PRODUCT_NAMES = ["Fixed Deposit", "Savings Account", "Current Account"] as const;

/** Product subtypes (common CBS subtypes when Product Subtype frame is sparse) */
export const PRODUCT_SUBTYPES = [
  "Standard",
  "Premium",
  "Corporate",
  "Staff",
  "SME",
] as const;

/** TENOR.png */
export const TENORS_DAYS = ["30 Days", "91 Days", "180 Days", "365 Days"] as const;

/** FILTER DROP DOWN-6.png — month tenors */
export const TENOR_MONTHS = ["1 Month", "2 Months", "3 Months", "6 Months", "12 Months"] as const;

/** TRANS CODE.png */
export const TRANS_CODES = ["DEP1001", "DEP1002", "DEP1003", "DEP104", "DEP1005"] as const;

/** STATUS.png */
export const POSTING_STATUS = ["Posted", "Reversed", "Pending"] as const;

/** STATUS 2.png */
export const ACTIVE_INACTIVE = ["Active", "Inactive"] as const;

/** staus.png — workflow status (Reverse → Reversed) */
export const WORKFLOW_STATUS = ["Pending", "Draft", "Posted", "Reversed"] as const;

/** ROLE.png */
export const ROLES = ["Super Admin", "Admin", "Finance", "Support"] as const;

/** INTERBAL.png / party scope — All / Customer / Internal */
export const PARTY_SCOPE = ["All", "Customer", "Internal"] as const;

/** FILTER DROP DOWN / Contract Entries + table overflow */
export const TABLE_OVERFLOW_ACTIONS = [
  "Sort By Date",
  "Sort By Amount",
  "Sort By Status",
  "Refresh Table",
  "Clear Table",
] as const;

export const CONTRACT_ENTRIES_SORT = ["Sort By Status", "Sort By Date"] as const;

export const CONTRACT_PRODUCT_FILTERS = [
  "All",
  "Treasury Bill",
  "Bond",
  "Placement",
  "Forex",
  "LC",
  "Call Deposit",
] as const;

export const PARTY_TYPE_FILTER = ["Customer", "Internal"] as const;

export const ISSUER_TYPES = ["CBN", "commercial banks"] as const;

export const RATE_BANDS = ["5%", "10 %", "15 %", "20 %", "25 %"] as const;

export const PAYMENT_FREQUENCIES = ["Monthly", "Quarterly"] as const;

export const YES_NO = ["Yes", "No"] as const;

/** Referend drop down.png */
export const REFERENCE_TRANSACTIONS = [
  "TXN/LC/0023-LC Booking",
  "TXN/LC/0023-LC Booking",
  "TXN/LC/0023-LC Booking",
  "TXN/LC/0023-LC Booking",
  "TXN/LC/0023-LC Booking",
] as const;

export const REFERENCE_TRANSACTION_SAMPLES = ["TXN/LC/0023-LC Booking"] as const;

/** Search Account No..png sample results */
export const ACCOUNT_SEARCH_SAMPLES = [
  "0051389315",
  "0051389317",
  "0151389901",
  "0151334555",
  "0151085854",
] as const;

/** FILTER DROP DOWN-3 style principal GL multi-select (bonds) */
export const PRINCIPAL_GL_MULTI = [
  "10001 – Treasury Investment - Bonds",
  "10210 – Bonds – Lagos State",
  "10007 – Corporate Bond Portfolio",
] as const;

export const INTEREST_GL_MULTI = [
  "40001 – Interest Income – Bonds",
  "40005 – Treasury Bill / Bond Interest Earnings",
  "40310 – Bond Discount Gain",
  "40200 – Investment Income – Corporate Securities",
] as const;

/** Tabs.png / Tabs-1 — contract / report style tab labels */
export const SAMPLE_TABS = [
  "Contract Balances",
  "Loan Contracts",
  "Treasury Bill",
  "Bond Contracts",
  "Forex Contracts",
] as const;

/**
 * Registry for gallery + docs. One entry per root catalog PNG (or family).
 */
export const CATALOG_REGISTRY: readonly CatalogDef[] = [
  { source: "ACCOUNT CLASS.png", title: "Account Class", options: ACCOUNT_CLASSES },
  { source: "ACCOUNT TYPE.png", title: "Account Type", options: ACCOUNT_TYPES },
  { source: "ACCOUNT TYPE/DRPDWN.png", title: "GL Class", options: GL_CLASSES },
  { source: "ACCOUNT TYPE/DRPDWN-1.png", title: "Instrument Codes", options: INSTRUMENT_CODES },
  { source: "BRANCH.png", title: "Branch", options: BRANCHES },
  { source: "BRANCH CODE.png", title: "Branch Code", options: BRANCH_CODES_FULL },
  { source: "COST CENTER.png", title: "Cost Center", options: COST_CENTERS_FULL },
  { source: "CURRENCY DRPDWN.png", title: "Currency", options: CURRENCY_DROPDOWN },
  { source: "GL ACCOUNT TYPE.png", title: "GL Account Type (role)", options: GL_LEDGER_ROLES },
  { source: "GL CATEGORY.png", title: "GL Category", options: GL_CATEGORIES },
  { source: "GL CODE.png", title: "GL Code", options: GL_CODES },
  { source: "INTEREST GL.png", title: "Interest GL", options: INTEREST_GL_CODES },
  { source: "PRINCIPAL GL.png", title: "Principal GL", options: PRINCIPAL_GL_CODES },
  { source: "LOAN TYPE.png", title: "Loan Type", options: LOAN_TYPES },
  { source: "PRODUCT TYPE.png", title: "Product Type", options: PRODUCT_TYPES },
  { source: "PRODUCT NAME.png", title: "Product Name", options: PRODUCT_NAMES },
  { source: "Product  Subtype   .png", title: "Product Subtype", options: PRODUCT_SUBTYPES },
  { source: "TENOR.png", title: "Tenor (Days)", options: TENORS_DAYS },
  { source: "FILTER DROP DOWN-6.png", title: "Tenor (Months)", options: TENOR_MONTHS },
  { source: "TRANS CODE.png", title: "Transaction Code", options: TRANS_CODES },
  { source: "STATUS.png", title: "Posting Status", options: POSTING_STATUS },
  { source: "STATUS 2.png", title: "Active / Inactive", options: ACTIVE_INACTIVE },
  { source: "staus.png", title: "Workflow Status", options: WORKFLOW_STATUS },
  { source: "ROLE.png", title: "Role", options: ROLES },
  { source: "INTERBAL.png", title: "Party Scope", options: PARTY_SCOPE },
  { source: "FILTER DROP DOWN.png", title: "Table Filter / Sort", options: TABLE_OVERFLOW_ACTIONS },
  { source: "FILTER DROP DOWN/Contract Entries.png", title: "Contract Entries Sort", options: CONTRACT_ENTRIES_SORT },
  { source: "FILTER DROP DOWN-1.png", title: "Contract Product Filter", options: CONTRACT_PRODUCT_FILTERS },
  { source: "FILTER DROP DOWN-2.png", title: "Party Type", options: PARTY_TYPE_FILTER },
  {
    source: "FILTER DROP DOWN-3.png",
    title: "Principal GL (multi)",
    options: PRINCIPAL_GL_MULTI,
    checked: true,
  },
  {
    source: "FILTER DROP DOWN-4.png",
    title: "Interest GL (multi)",
    options: INTEREST_GL_MULTI,
    checked: true,
  },
  { source: "FILTER DROP DOWN-5.png", title: "Issuer Type", options: ISSUER_TYPES },
  { source: "FILTER DROP DOWN-7.png", title: "Rate Band", options: RATE_BANDS },
  { source: "FILTER DROP DOWN-9.png", title: "Payment Frequency", options: PAYMENT_FREQUENCIES },
  { source: "FILTER DROP DOWN-10.png", title: "Currency Codes", options: ["USD", "NGN", "EUR"] },
  { source: "FILTER DROP DOWN-11.png", title: "Yes / No", options: YES_NO },
  {
    source: "Referend drop down.png",
    title: "Reference Transaction",
    options: REFERENCE_TRANSACTION_SAMPLES,
    highlight: true,
  },
  {
    source: "Search Account No..png",
    title: "Search Account No.",
    options: ACCOUNT_SEARCH_SAMPLES,
    kind: "search",
  },
  { source: "MONTHS 2.png", title: "Month / Date Picker", options: [], kind: "month-picker" },
  { source: "Tabs.png", title: "Tabs", options: SAMPLE_TABS, kind: "tabs" },
  { source: "Tabs-1.png", title: "Tabs (variant)", options: SAMPLE_TABS, kind: "tabs" },
  {
    source: "Transaction Amount.png",
    title: "Transaction Amount (label)",
    options: ["Transaction Amount"],
    kind: "label",
  },
  {
    source: "formkit_down.png",
    title: "Formkit Chevron",
    options: ["Chevron down (select indicator)"],
    kind: "label",
  },
  {
    source: "CHEQUE.png",
    title: "LCY Cash Withdrawal With Cheque",
    options: [],
    kind: "form",
  },
  {
    source: "COUNTER CHEQUE.png",
    title: "LCY Cash Withdrawal With Counter Cheque",
    options: [],
    kind: "form",
  },
  {
    source: "Innternal Account.png",
    title: "Internal Account (withdrawal)",
    options: [],
    kind: "form",
  },
  {
    source: "CUSTOMER.png",
    title: "Customer divider",
    options: ["Gradient divider"],
    kind: "label",
  },
  {
    source: "FOREX.png",
    title: "Forex divider",
    options: ["Horizontal rule"],
    kind: "label",
  },
] as const;
