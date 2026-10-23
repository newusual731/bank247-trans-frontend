import { apiRequest } from "../lib/apiClient";

export function getAuditEvents(params?: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiRequest(`/api/v1/audit/events${suffix}`);
}

export function getTellerActivityReport(params?: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiRequest(`/api/v1/reports/teller/activity${suffix}`);
}

export function getTellerCashPositionReport(params?: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiRequest(`/api/v1/reports/teller/cash-position${suffix}`);
}

export function getFinancialTrialBalanceReport(params?: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiRequest(`/api/v1/reports/financial/trial-balance${suffix}`);
}

export function listLoans(params?: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiRequest(`/api/v1/loans${suffix}`);
}

export function listInvestments(params?: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiRequest(`/api/v1/investments${suffix}`);
}

export function listTreasuryDeals(params?: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiRequest(`/api/v1/treasury/deals${suffix}`);
}

export function listTradeInstruments(params?: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiRequest(`/api/v1/trade/instruments${suffix}`);
}

export function listIamUsers(params?: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiRequest(`/api/v1/iam/users${suffix}`);
}

export function listIamPermissions() {
  return apiRequest("/api/v1/iam/permissions");
}

export function listIamRoles() {
  return apiRequest("/api/v1/iam/roles");
}

export function getLoanPerformanceReport(params?: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiRequest(`/api/v1/reports/loans/performance${suffix}`);
}

export function getInvestmentPortfolioReport(params?: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiRequest(`/api/v1/reports/investments/portfolio${suffix}`);
}

export function getTreasuryDealsReport(params?: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiRequest(`/api/v1/reports/treasury/deals${suffix}`);
}

export type ContractBalance = {
  contractId: string;
  sourceType: "LOAN" | "INVESTMENT" | "TREASURY" | string;
  party: string;
  partyScope: "CUSTOMER" | "INTERNAL" | string;
  productType: string;
  currency: string;
  debit: string | number;
  credit: string | number;
  balance: string | number;
  status: string;
  lastActivity?: string | null;
};

export type ContractBalanceSummary = {
  totalContracts: number;
  totalBalance: string | number;
  byProductType: Array<{ productType: string; count: number; balance: string | number }>;
};

export function getContractBalances(params?: {
  productType?: string;
  partyScope?: string;
  currency?: string;
  status?: string;
  q?: string;
  page?: number;
  size?: number;
}) {
  const qs = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiRequest<{
    content: ContractBalance[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  }>(`/api/v1/reports/contracts/balances${suffix}`);
}

export function getContractBalanceSummary(params?: {
  productType?: string;
  partyScope?: string;
  currency?: string;
  status?: string;
}) {
  const qs = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiRequest<ContractBalanceSummary>(`/api/v1/reports/contracts/balances/summary${suffix}`);
}
