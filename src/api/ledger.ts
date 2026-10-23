import { apiRequest } from "../lib/apiClient";
import type { PageResponse } from "./transactions";

export type GlAccountSummary = {
  id?: string;
  code: string;
  description?: string;
  nature?: string;
  status?: string;
  parentCode?: string | null;
  accountLevel?: number;
  postable?: boolean;
  currency?: string | null;
  balance?: string | number | null;
  createdAt?: string | null;
};

export function listGlAccounts(params?: {
  parentCode?: string;
  status?: string;
  nature?: string;
  page?: number;
  size?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.parentCode) qs.set("parentCode", params.parentCode);
  if (params?.status) qs.set("status", params.status);
  if (params?.nature) qs.set("nature", params.nature);
  if (params?.page != null) qs.set("page", String(params.page));
  if (params?.size != null) qs.set("size", String(params.size));
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiRequest<PageResponse<GlAccountSummary>>(`/api/v1/gl/accounts${suffix}`);
}

export function createGlAccount(body: Record<string, unknown>) {
  return apiRequest("/api/v1/gl/accounts", { method: "POST", body });
}

export function getAccountBalance(accountNumber: string) {
  return apiRequest(`/api/v1/ledger/accounts/${encodeURIComponent(accountNumber)}/balance`);
}

export function getAccountEntries(accountNumber: string, params?: { page?: number; size?: number }) {
  const qs = new URLSearchParams();
  if (params?.page != null) qs.set("page", String(params.page));
  if (params?.size != null) qs.set("size", String(params.size));
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiRequest(`/api/v1/ledger/accounts/${encodeURIComponent(accountNumber)}/entries${suffix}`);
}

export function getTrialBalance(params?: { asOf?: string }) {
  const qs = new URLSearchParams();
  if (params?.asOf) qs.set("asOf", params.asOf);
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiRequest(`/api/v1/ledger/trial-balance${suffix}`);
}

export function reversePosting(reference: string) {
  return apiRequest(`/api/v1/ledger/postings/${encodeURIComponent(reference)}/reverse`, { method: "POST" });
}

export {
  createLedgerPosting,
  exportPostingsCsv,
  getLedgerPosting,
  getPostingAnalytics,
  newPostingReference,
  searchPostings,
} from "./postings";
export type {
  CreateLedgerPostingPayload,
  LedgerTransactionType,
  PostingAnalytics,
  PostingLeg,
  PostingSearchParams,
  PostingSummary,
} from "./postings";

export function createFinancialPeriod(body: { periodCode: string; startDate: string; endDate: string }) {
  return apiRequest("/api/v1/gl/periods", { method: "POST", body });
}

export function closeFinancialPeriod(periodCode: string) {
  return apiRequest(`/api/v1/gl/periods/${encodeURIComponent(periodCode)}/close`, { method: "POST" });
}

export function getFinancialPeriod(periodCode: string) {
  return apiRequest(`/api/v1/gl/periods/${encodeURIComponent(periodCode)}`);
}

export function createTransactionCode(body: {
  code: string;
  description: string;
  debitGlCode: string;
  creditGlCode: string;
}) {
  return apiRequest("/api/v1/gl/transaction-codes", { method: "POST", body });
}

export function getTransactionCode(code: string) {
  return apiRequest(`/api/v1/gl/transaction-codes/${encodeURIComponent(code)}`);
}

export function activateGlAccount(code: string) {
  return apiRequest(`/api/v1/gl/accounts/${encodeURIComponent(code)}/activate`, { method: "POST" });
}

export function deactivateGlAccount(code: string) {
  return apiRequest(`/api/v1/gl/accounts/${encodeURIComponent(code)}/deactivate`, { method: "POST" });
}

export type ProductGlRole = "PRINCIPAL" | "INTEREST" | "CHARGES";
export type ProductGlMappingStatus = "ACTIVE" | "INACTIVE";

export type ProductGlMapping = {
  id: string;
  productType: string;
  productName: string;
  glRole: ProductGlRole;
  glCode: string;
  glName?: string;
  currency: string;
  status: ProductGlMappingStatus;
};

export function searchProductGlMappings(params?: {
  productType?: string;
  glRole?: ProductGlRole | string;
  currency?: string;
  status?: ProductGlMappingStatus | string;
  glCode?: string;
  q?: string;
  page?: number;
  size?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.productType) qs.set("productType", params.productType);
  if (params?.glRole) qs.set("glRole", params.glRole);
  if (params?.currency) qs.set("currency", params.currency);
  if (params?.status) qs.set("status", params.status);
  if (params?.glCode) qs.set("glCode", params.glCode);
  if (params?.q) qs.set("q", params.q);
  if (params?.page != null) qs.set("page", String(params.page));
  if (params?.size != null) qs.set("size", String(params.size));
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiRequest<PageResponse<ProductGlMapping>>(`/api/v1/gl/product-mappings${suffix}`);
}

export function createProductGlMapping(body: {
  productType: string;
  productName: string;
  glRole: ProductGlRole;
  glCode: string;
  currency: string;
}) {
  return apiRequest<ProductGlMapping>("/api/v1/gl/product-mappings", { method: "POST", body });
}

export function updateProductGlMapping(
  id: string,
  body: {
    productName?: string;
    glRole?: ProductGlRole;
    glCode?: string;
    currency?: string;
  },
) {
  return apiRequest<ProductGlMapping>(`/api/v1/gl/product-mappings/${encodeURIComponent(id)}`, {
    method: "PUT",
    body,
  });
}

export function activateProductGlMapping(id: string) {
  return apiRequest<ProductGlMapping>(
    `/api/v1/gl/product-mappings/${encodeURIComponent(id)}/activate`,
    { method: "POST" },
  );
}

export function deactivateProductGlMapping(id: string) {
  return apiRequest<ProductGlMapping>(
    `/api/v1/gl/product-mappings/${encodeURIComponent(id)}/deactivate`,
    { method: "POST" },
  );
}

export function placeLedgerHold(body: {
  accountNumber: string;
  amount: string | number;
  currency: string;
  reason: string;
  reference: string;
}) {
  return apiRequest("/api/v1/ledger/holds", {
    method: "POST",
    body: { ...body, amount: String(body.amount) },
  });
}

export function releaseLedgerHold(id: string) {
  return apiRequest(`/api/v1/ledger/holds/${encodeURIComponent(id)}/release`, { method: "POST" });
}
