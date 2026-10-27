import { apiRequest } from "../lib/apiClient";

export type AccountStatus =
  | "PENDING_APPROVAL"
  | "PENDING_ACTIVATION"
  | "ACTIVE"
  | "DORMANT"
  | "CLOSED"
  | "FAILED_ACTIVATION";

export type AccountResponse = {
  id: string;
  accountNumber: string;
  customerId: string;
  productCode: string;
  currency: string;
  branchCode: string;
  status: AccountStatus | string;
  customerType?: string | null;
  workflowRequestId?: string | null;
  pendingOperation?: string | null;
  lastActivityAt?: string | null;
  createdAt?: string | null;
};

export type AccountEnquiryResponse = {
  account: AccountResponse;
  debitAllowed: boolean;
  creditAllowed: boolean;
  restrictions?: unknown[];
  liens?: unknown[];
  mandates?: unknown[];
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type AccountSearchParams = {
  q?: string;
  status?: AccountStatus | string;
  branchCode?: string;
  currency?: string;
  productCode?: string;
  customerType?: string;
  page?: number;
  size?: number;
};

export type OpenAccountBody = {
  accountNumber?: string;
  customerId: string;
  productCode: string;
  currency: string;
  branchCode: string;
};

export type CasaProduct = {
  id?: string;
  code: string;
  name: string;
  accountType?: string;
  productGroup?: string;
  balanceType?: string;
  currency: string;
  minimumBalance?: number | string;
  annualInterestRate?: number | string;
  interestBasisDays?: number;
  reportingLedgerAccount?: string | null;
  interestAccrualLedgerAccount?: string | null;
  interestExpenseLedgerAccount?: string | null;
  withholdingTaxLedgerAccount?: string | null;
  vatLedgerAccount?: string | null;
  monthlyMaintenanceCharge?: number | string;
  cashLiteCharge?: number | string;
  chargeIncomeLedgerAccount?: string | null;
  dormancyInactiveDays?: number;
  status?: string;
  workflowRequestId?: string | null;
  createdAt?: string | null;
};

export type LoanProduct = {
  id?: string;
  code: string;
  name: string;
  currency: string;
  minimumAmount?: number | string;
  maximumAmount?: number | string;
  minimumTenorMonths?: number;
  maximumTenorMonths?: number;
  defaultAnnualInterestRate?: number | string;
  repaymentFrequency?: string;
  repaymentMethod?: string;
  interestBasisDays?: number;
  principalLedgerAccount?: string | null;
  interestReceivableLedgerAccount?: string | null;
  interestIncomeLedgerAccount?: string | null;
  status?: string;
  workflowRequestId?: string | null;
  createdAt?: string | null;
};

export type InvestmentProduct = {
  id?: string;
  code: string;
  name: string;
  investmentType?: string;
  currency: string;
  minimumAmount?: number | string;
  maximumAmount?: number | string;
  minimumTenorDays?: number;
  maximumTenorDays?: number;
  defaultAnnualInterestRate?: number | string;
  interestMethod?: string;
  interestBasisDays?: number;
  withholdingTaxRate?: number | string;
  earlyRedemptionPenaltyRate?: number | string;
  earlyRedemptionPenaltyBasis?: string;
  principalLiabilityLedgerAccount?: string | null;
  interestPayableLedgerAccount?: string | null;
  interestExpenseLedgerAccount?: string | null;
  withholdingTaxLedgerAccount?: string | null;
  penaltyIncomeLedgerAccount?: string | null;
  interestPaymentFrequency?: string;
  noticePeriodDays?: number;
  contributionFrequency?: string;
  contributionAmount?: number | string;
  stepUpIncrement?: number | string;
  status?: string;
  workflowRequestId?: string | null;
  createdAt?: string | null;
};

export type ProductKind = "casa" | "loans" | "investments";

function toQuery(params: Record<string, string | number | undefined | null>): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

/** Paginated account search — production list endpoint. */
export function searchAccounts(params: AccountSearchParams = {}) {
  return apiRequest<PageResponse<AccountResponse>>(
    `/api/v1/accounts/search${toQuery({
      q: params.q,
      status: params.status,
      branchCode: params.branchCode,
      currency: params.currency,
      productCode: params.productCode,
      customerType: params.customerType,
      page: params.page ?? 0,
      size: params.size ?? 20,
    })}`,
  );
}

export function getAccount(accountNumber: string) {
  return apiRequest<AccountResponse>(`/api/v1/accounts/${encodeURIComponent(accountNumber)}`);
}

export function enquireAccount(accountNumber: string) {
  return apiRequest<AccountEnquiryResponse>(
    `/api/v1/accounts/${encodeURIComponent(accountNumber)}/enquiry`,
  );
}

export function listCasaProducts(params?: { status?: string; page?: number; size?: number }) {
  return apiRequest<PageResponse<CasaProduct> | CasaProduct[]>(
    `/api/v1/products/casa${toQuery({
      status: params?.status,
      page: params?.page ?? 0,
      size: params?.size ?? 100,
    })}`,
  );
}

export function getCasaProduct(code: string) {
  return apiRequest<CasaProduct>(`/api/v1/products/casa/${encodeURIComponent(code)}`);
}

export function listLoanProducts(params?: { status?: string; page?: number; size?: number }) {
  return apiRequest<PageResponse<LoanProduct> | LoanProduct[]>(
    `/api/v1/products/loans${toQuery({
      status: params?.status,
      page: params?.page ?? 0,
      size: params?.size ?? 100,
    })}`,
  );
}

export function getLoanProduct(code: string) {
  return apiRequest<LoanProduct>(`/api/v1/products/loans/${encodeURIComponent(code)}`);
}

export function listInvestmentProducts(params?: { status?: string; page?: number; size?: number }) {
  return apiRequest<PageResponse<InvestmentProduct> | InvestmentProduct[]>(
    `/api/v1/products/investments${toQuery({
      status: params?.status,
      page: params?.page ?? 0,
      size: params?.size ?? 100,
    })}`,
  );
}

export function getInvestmentProduct(code: string) {
  return apiRequest<InvestmentProduct>(
    `/api/v1/products/investments/${encodeURIComponent(code)}`,
  );
}

export function openAccount(body: OpenAccountBody) {
  return apiRequest<AccountResponse>("/api/v1/accounts", { method: "POST", body });
}

export function applyOpenAccount(accountNumber: string) {
  return apiRequest<AccountResponse>(`/api/v1/accounts/${encodeURIComponent(accountNumber)}/apply-open`, {
    method: "POST",
  });
}

export function closeAccount(accountNumber: string, reason: string) {
  return apiRequest<AccountResponse>(`/api/v1/accounts/${encodeURIComponent(accountNumber)}/close`, {
    method: "POST",
    body: { reason },
  });
}

export function reactivateAccount(accountNumber: string) {
  return apiRequest<AccountResponse>(`/api/v1/accounts/${encodeURIComponent(accountNumber)}/reactivate`, {
    method: "POST",
  });
}

export function createCasaProduct(body: Record<string, unknown>) {
  return apiRequest<CasaProduct>("/api/v1/products/casa", { method: "POST", body });
}

export function submitCasaProduct(code: string) {
  return apiRequest<CasaProduct>(`/api/v1/products/casa/${encodeURIComponent(code)}/submit`, {
    method: "POST",
  });
}

export function activateCasaProduct(code: string, workflowRequestId: string) {
  return apiRequest<CasaProduct>(
    `/api/v1/products/casa/${encodeURIComponent(code)}/activate/${encodeURIComponent(workflowRequestId)}`,
    { method: "POST" },
  );
}

export function createLoanProduct(body: Record<string, unknown>) {
  return apiRequest<LoanProduct>("/api/v1/products/loans", { method: "POST", body });
}

export function submitLoanProduct(code: string) {
  return apiRequest<LoanProduct>(`/api/v1/products/loans/${encodeURIComponent(code)}/submit`, {
    method: "POST",
  });
}

export function activateLoanProduct(code: string, workflowRequestId: string) {
  return apiRequest<LoanProduct>(
    `/api/v1/products/loans/${encodeURIComponent(code)}/activate/${encodeURIComponent(workflowRequestId)}`,
    { method: "POST" },
  );
}

export function createInvestmentProduct(body: Record<string, unknown>) {
  return apiRequest<InvestmentProduct>("/api/v1/products/investments", { method: "POST", body });
}

export function submitInvestmentProduct(code: string) {
  return apiRequest<InvestmentProduct>(
    `/api/v1/products/investments/${encodeURIComponent(code)}/submit`,
    { method: "POST" },
  );
}

export function activateInvestmentProduct(code: string, workflowRequestId: string) {
  return apiRequest<InvestmentProduct>(
    `/api/v1/products/investments/${encodeURIComponent(code)}/activate/${encodeURIComponent(workflowRequestId)}`,
    { method: "POST" },
  );
}

export function createStandingOrder(body: {
  sourceAccount: string;
  destinationAccount: string;
  amount: string | number;
  currency: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  firstRunDate: string;
  narration?: string;
}) {
  return apiRequest("/api/v1/accounts/standing-orders", {
    method: "POST",
    body: { ...body, amount: String(body.amount) },
  });
}

export function cancelStandingOrder(reference: string) {
  return apiRequest(`/api/v1/accounts/standing-orders/${encodeURIComponent(reference)}/cancel`, {
    method: "POST",
  });
}

export function formatAccountStatus(status: string | null | undefined): string {
  if (!status) return "—";
  return status
    .split("_")
    .map((p) => p.charAt(0) + p.slice(1).toLowerCase())
    .join(" ");
}
