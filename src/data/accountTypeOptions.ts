/**
 * Dropdown catalogs from Figma transaction-processing pack:
 * - ACCOUNT TYPE/DRPDWN.png
 * - ACCOUNT TYPE/DRPDWN-1.png
 * - ACCOUNT TYPE.png
 * - GL ACCOUNT TYPE.png
 * - CUSTOME/INTERNAL.png (All / Customer / Internal)
 */

/** GL class — Accounts filter "GL Account Type" (DRPDWN.png) */
export const GL_ACCOUNT_CLASSES = [
  "Asset",
  "Liability",
  "Equity",
  "Income",
  "Expenses",
] as const;

/** Customer / product account type (ACCOUNT TYPE.png) */
export const CUSTOMER_ACCOUNT_TYPES = [
  "Fixed Deposit",
  "Savings Account",
  "Current Account",
  "Loan Account",
  "Placement",
  "Treasury Bill",
] as const;

/** Instrument / product codes (ACCOUNT TYPE/DRPDWN-1.png) */
export const INSTRUMENT_PRODUCT_CODES = [
  "FD-180-Fixed Deposit",
  "TBILL-91-Treasury Bill",
  "BOND-1YR-FGN Bond (1year)",
  "CALL-NGN-Call Deposit Open)",
  "CP-30-Commercial Paper (30D)",
] as const;

/** GL role in product ledger mapping (GL ACCOUNT TYPE.png) */
export const GL_LEDGER_ROLES = ["Principal GL", "Interest GL", "Charges GL"] as const;

/**
 * Party scope filter (CUSTOME/INTERNAL.png).
 * Figma shows "linternal" — corrected to Internal.
 */
export const PARTY_SCOPES = ["All", "Customer", "Internal"] as const;
export type PartyScope = (typeof PARTY_SCOPES)[number];

/** Contract type on create forms (Customer vs Internal only — no All). */
export const CONTRACT_PARTY_TYPES = ["Customer", "Internal"] as const;

export const BRANCH_CODES = ["EKO001", "PHC002", "ABJ003", "IBD004", "ENU005", "KAN8006"] as const;
/** Prefer CURRENCY_DROPDOWN from catalogs.ts for full list; keep short form for existing filters. */
export const CURRENCIES = ["Usd", "Ngn", "Eur"] as const;
export const COST_CENTERS = ["CC01", "CC02", "CC03", "CC05", "CC06", "CC07", "CC08", "CC09"] as const;
export const ACCOUNT_STATUSES = ["Active", "Dormant", "Closed"] as const;

/** GL CATEGORY.png */
export const GL_CATEGORIES = [
  "Control Account",
  "Operating Account",
  "Suspense Account",
  "Contra Account",
] as const;

/** GL CODE.png — format: code- Name */
export const GL_CODE_OPTIONS = [
  "10001- Cash in Vault",
  "10002- Cash in Till",
  "10003- Inter Bank Placement",
  "10004- Treasury Bills",
  "10005- Fixed Deposit",
  "10006- Loan to Customers",
  "10007- Acc. Receivable Interest",
  "10005- Suspense Account",
] as const;

/** Account class on GL Creation — ACCOUNT CLASS.png */
export const GL_ACCOUNT_CLASSES_DETAIL = [
  "Current -Asset -",
  "Fixed Asset",
  "Long Term Liability",
  "Revenue",
  "Operating Expense",
] as const;

export const BRANCH_NAMES = ["Victoria Island", "Ogba", "Ikeja", "Surulere", "Ajah"] as const;
export const POSTING_STATUSES = ["Posted", "Reversed", "Pending"] as const;
export const TXN_CODES = ["DEP1001", "DEP1002", "DEP1003", "DEP104", "DEP1005"] as const;

/** PRODUCT TYPE.png */
export const PRODUCT_SETUP_TYPES = [
  "Fixed Deposit",
  "Treasury Bill",
  "Loan",
  "Bond",
  "Forex",
] as const;

/** Term options on Add New Product (MODAL.png) */
export const PRODUCT_TERMS = ["30 Days", "90 Days", "182 Days", "12 months", "30 Months"] as const;

export const PRODUCT_SETUP_STATUSES = ["Active", "Inactive"] as const;

