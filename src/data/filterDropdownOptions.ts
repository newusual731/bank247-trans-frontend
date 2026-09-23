/**
 * Option catalogs from Figma FILTER DROP DOWN frames
 * (transaction processing module).
 *
 * Typos in frames corrected in code:
 * - "Call Ceposit" → Call Deposit
 * - "Iinternal" / "linternal" → Internal
 */

/** FILTER DROP DOWN/Contract Entries.png */
export const CONTRACT_ENTRIES_SORT = ["Sort By Status", "Sort By Date"] as const;

/** FILTER DROP DOWN.png — table overflow / sort+actions */
export const TABLE_OVERFLOW_ACTIONS = [
  "Sort By Date",
  "Sort By Amount",
  "Sort By Status",
  "Refresh Table",
  "Clear Table",
] as const;

/** FILTER DROP DOWN-1.png — product type filter */
export const CONTRACT_PRODUCT_FILTERS = [
  "All",
  "Treasury Bill",
  "Bond",
  "Placement",
  "Forex",
  "LC",
  "Call Deposit",
] as const;

/**
 * FILTER DROP DOWN-2.png — Customer / Internal (no All).
 * Same semantics as CONTRACT_PARTY_TYPES.
 */
export const PARTY_TYPE_FILTER = ["Customer", "Internal"] as const;

/** FILTER DROP DOWN-3.png — Principal / Asset GL multi-select */
export const PRINCIPAL_GL_OPTIONS = [
  "10001 – Treasury Investment - Bonds",
  "10210 – Bonds – Lagos State",
  "10001 – Treasury Investment - Bonds",
  "10007 – Corporate Bond Portfolio",
  "10001 – Treasury Investment - Bonds",
] as const;

/** Unique Principal GL labels for selects (deduped from frame). */
export const PRINCIPAL_GL_UNIQUE = [
  "10001 – Treasury Investment - Bonds",
  "10210 – Bonds – Lagos State",
  "10007 – Corporate Bond Portfolio",
] as const;

/** FILTER DROP DOWN-4.png — Interest / Income GL multi-select */
export const INTEREST_GL_OPTIONS = [
  "40001 – Interest Income – Bonds",
  "40005 – Treasury Bill / Bond Interest Earnings",
  "40310 – Bond Discount Gain",
  "40200 – Investment Income – Corporate Securities",
  "40310 – Bond Discount Gain",
] as const;

export const INTEREST_GL_UNIQUE = [
  "40001 – Interest Income – Bonds",
  "40005 – Treasury Bill / Bond Interest Earnings",
  "40310 – Bond Discount Gain",
  "40200 – Investment Income – Corporate Securities",
] as const;

/** FILTER DROP DOWN-5.png / -8.png — issuer / counterparty class */
export const ISSUER_TYPES = ["CBN", "commercial banks"] as const;

/** FILTER DROP DOWN-6.png — tenor */
export const TENOR_MONTHS = [
  "1 Month",
  "2 Months",
  "3 Months",
  "6 Months",
  "12 Months",
] as const;

/** FILTER DROP DOWN-7.png — rate band (preserve spacing as shown for 10–25) */
export const RATE_BANDS = ["5%", "10 %", "15 %", "20 %", "25 %"] as const;

/** FILTER DROP DOWN-9.png — coupon / accrual frequency */
export const PAYMENT_FREQUENCIES = ["Monthly", "Quarterly"] as const;

/** LOAN TYPE.png */
export const LOAN_TYPES = [
  "Personal Loan",
  "Business Loan",
  "Salary Advance Loan",
  "Asset Financing Loan",
] as const;

/**
 * Loan repayment methods (Figma modal shows "Flared" — treat as Flat;
 * include common CBS methods).
 */
export const REPAYMENT_METHODS = ["Flat", "Reducing Balance", "Bullet"] as const;

/** Loan disbursement / collection GL samples from LOAN CONTRACT modal */
export const LOAN_GL_ACCOUNTS = ["GL 3001", "GL 2001", "GL 11001", "GL 40011"] as const;

/** FILTER DROP DOWN-10.png — currency codes (all-caps) */
export const CURRENCY_CODES = ["USD", "NGN", "EUR"] as const;

/** FILTER DROP DOWN-11.png — boolean Yes/No */
export const YES_NO = ["Yes", "No"] as const;

/** Referend drop down.png — linked / reference transaction picker */
export const REFERENCE_TRANSACTIONS = [
  "TXN/LC/0023-LC Booking",
  "TXN/LC/0023-LC Booking",
  "TXN/LC/0023-LC Booking",
  "TXN/LC/0023-LC Booking",
  "TXN/LC/0023-LC Booking",
] as const;

export const REFERENCE_TRANSACTION_SAMPLES = ["TXN/LC/0023-LC Booking"] as const;
