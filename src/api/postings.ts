import { apiRequest, ApiError } from "../lib/apiClient";
import { API_BASE_URL } from "../lib/config";
import { getAccessToken, getBankIdFromToken, getTokenExpiresAt } from "../lib/authSession";
import { refreshAccessToken } from "../lib/authApi";
import type { PageResponse } from "./transactions";

export type LedgerEntryDirection = "DEBIT" | "CREDIT";

export type LedgerTransactionType =
  | "MANUAL_JOURNAL"
  | "SPECIAL_ENTRY"
  | "PNL_ENTRY"
  | "ADJUSTMENT"
  | string;

export type PostingLeg = {
  accountNumber: string;
  direction: LedgerEntryDirection;
  amount: string | number;
};

export type CreateLedgerPostingPayload = {
  transactionReference: string;
  transactionType: LedgerTransactionType;
  currency: string;
  legs: PostingLeg[];
  narration?: string;
};

export type PostingResponse = {
  transactionReference: string;
  status: string;
  postedAt?: string;
};

export type PostingSummary = {
  transactionReference: string;
  type?: string | null;
  status?: string | null;
  postedAt?: string | null;
  debitAccounts?: string[] | null;
  creditAccounts?: string[] | null;
  amount?: string | number | null;
  currency?: string | null;
  narration?: string | null;
};

export type PostingSearchParams = {
  accountNumber?: string;
  type?: string;
  /** ISO-8601 Instant */
  from?: string;
  /** ISO-8601 Instant */
  to?: string;
  q?: string;
  page?: number;
  size?: number;
};

function toQuery(params: Record<string, string | number | undefined | null>): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function createLedgerPosting(payload: CreateLedgerPostingPayload) {
  return apiRequest<PostingResponse>("/api/v1/ledger/postings", {
    method: "POST",
    body: {
      ...payload,
      legs: payload.legs.map((leg) => ({
        accountNumber: leg.accountNumber,
        direction: leg.direction,
        amount: String(leg.amount),
      })),
    },
  });
}

export function getLedgerPosting(reference: string) {
  return apiRequest<PostingResponse>(`/api/v1/ledger/postings/${encodeURIComponent(reference)}`);
}

export function searchPostings(params: PostingSearchParams = {}) {
  return apiRequest<PageResponse<PostingSummary>>(
    `/api/v1/ledger/postings/search${toQuery({
      accountNumber: params.accountNumber,
      type: params.type,
      from: params.from,
      to: params.to,
      q: params.q,
      page: params.page ?? 0,
      size: params.size ?? 20,
    })}`,
  );
}

export type PostingMixSlice = {
  code: string;
  label: string;
  postingCount: number;
  amount: string | number;
};

export type PostingGrowthPoint = {
  period: string;
  postingCount: number;
  amount: string | number;
};

export type PostingHighlight = {
  label: string;
  detail: string;
};

export type PostingAnalytics = {
  mix: PostingMixSlice[];
  totalPostings: number;
  totalAmount: string | number;
  currency?: string;
  highlightLabel?: string;
  growth: PostingGrowthPoint[];
  topMonth?: PostingHighlight;
  topYear?: PostingHighlight;
  topAccount?: PostingHighlight;
};

export type PostingAnalyticsParams = {
  accountNumber?: string;
  type?: string;
  from?: string;
  to?: string;
  q?: string;
  /** MONTHLY | YEARLY */
  growth?: string;
};

export function getPostingAnalytics(params: PostingAnalyticsParams = {}) {
  return apiRequest<PostingAnalytics>(
    `/api/v1/ledger/postings/analytics${toQuery({
      accountNumber: params.accountNumber,
      type: params.type,
      from: params.from,
      to: params.to,
      q: params.q,
      growth: params.growth ?? "MONTHLY",
    })}`,
  );
}

async function authHeaders(): Promise<Record<string, string>> {
  let token = getAccessToken();
  if (token && Date.now() > getTokenExpiresAt() - 15_000) {
    const refreshed = await refreshAccessToken();
    token = refreshed?.accessToken ?? getAccessToken();
  }
  if (!token) throw new ApiError(401, "Not signed in");
  const headers: Record<string, string> = {
    Accept: "text/csv,application/json",
    Authorization: `Bearer ${token}`,
  };
  const bankId = getBankIdFromToken(token);
  if (bankId) headers["X-Bank247-Tenant"] = bankId;
  return headers;
}

export async function exportPostingsCsv(params: PostingSearchParams = {}) {
  const path = `/api/v1/ledger/postings/export${toQuery({
    accountNumber: params.accountNumber,
    type: params.type,
    from: params.from,
    to: params.to,
    q: params.q,
  })}`;
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, { method: "GET", headers: await authHeaders() });
  if (!res.ok) {
    const text = await res.text();
    let msg =
      res.status === 502
        ? "Export failed: ledger service unavailable (502). Try again after the service is back."
        : `Export failed (${res.status})`;
    try {
      const parsed = JSON.parse(text) as { message?: string; error?: string };
      msg = parsed.message || parsed.error || msg;
    } catch {
      // ignore HTML / plain gateway bodies
    }
    throw new ApiError(res.status, msg);
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = "ledger-postings.csv";
  a.click();
  URL.revokeObjectURL(objectUrl);
}

export function newPostingReference(prefix = "JN") {
  const raw =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${raw}`.replace(/[^A-Za-z0-9._:/-]/g, "-").slice(0, 80);
}
