import { apiRequest, newIdempotencyKey } from "../lib/apiClient";

export type TransactionStatus =
  | "PROCESSING"
  | "SUCCESSFUL"
  | "FAILED"
  | "REVERSED"
  | "UNKNOWN"
  | string;

export type TransactionResponse = {
  id: string;
  reference: string;
  sourceAccount: string;
  destinationAccount: string;
  amount: string | number;
  currency: string;
  status: TransactionStatus;
  failureCode?: string | null;
  createdAt?: string | null;
  sourceBranch?: string | null;
  destinationBranch?: string | null;
  interbranch?: boolean;
  reversalReference?: string | null;
  valueDate?: string | null;
  channel?: string | null;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type TransactionSearchParams = {
  accountNumber?: string;
  status?: string;
  /** ISO-8601 Instant, e.g. 2025-06-15T00:00:00Z */
  from?: string;
  /** ISO-8601 Instant */
  to?: string;
  q?: string;
  page?: number;
  size?: number;
};

export type InternalTransferPayload = {
  sourceAccount: string;
  destinationAccount: string;
  amount: string | number;
  currency: string;
  narration?: string;
  reference?: string;
  channel?: string;
  idempotencyKey?: string;
};

export type UiTxnStatus = "Posted" | "Pending" | "Failed" | "Reversed" | "Unknown";

/** Start of day UTC Instant for a YYYY-MM-DD date input. */
export function dateToFromInstant(date: string | undefined | null): string | undefined {
  const d = (date ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return undefined;
  return `${d}T00:00:00.000Z`;
}

/** End of day UTC Instant for a YYYY-MM-DD date input. */
export function dateToToInstant(date: string | undefined | null): string | undefined {
  const d = (date ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return undefined;
  return `${d}T23:59:59.999Z`;
}

export function formatTxnStatus(status: unknown): UiTxnStatus {
  const s = String(status ?? "").toUpperCase();
  if (s === "SUCCESSFUL" || s === "POSTED") return "Posted";
  if (s === "FAILED") return "Failed";
  if (s === "PROCESSING" || s === "PENDING") return "Pending";
  if (s === "REVERSED") return "Reversed";
  return "Unknown";
}

export function formatTxnMoney(amount: string | number | null | undefined, currency = "NGN"): string {
  const n = typeof amount === "number" ? amount : Number(amount ?? 0);
  const safe = Number.isFinite(n) ? n : 0;
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 2,
    }).format(safe);
  } catch {
    return `${currency} ${safe.toLocaleString()}`;
  }
}

export function formatTxnDate(createdAt?: string | null, valueDate?: string | null): string {
  if (createdAt) {
    const d = new Date(createdAt);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    }
  }
  if (valueDate) return String(valueDate);
  return "—";
}

function toQuery(params: Record<string, string | number | undefined | null>): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function createInternalTransfer(payload: InternalTransferPayload) {
  return apiRequest<TransactionResponse>("/api/v1/transactions/internal-transfers", {
    method: "POST",
    body: {
      ...payload,
      amount: String(payload.amount),
      idempotencyKey: payload.idempotencyKey ?? newIdempotencyKey("ift"),
      channel: payload.channel ?? "TELLER",
    },
  });
}

export function reverseTransfer(reference: string, body?: Record<string, unknown>) {
  return apiRequest<TransactionResponse>(`/api/v1/transactions/${encodeURIComponent(reference)}/reverse`, {
    method: "POST",
    body: body ?? {},
  });
}

export function getTransaction(reference: string) {
  return apiRequest<TransactionResponse>(`/api/v1/transactions/${encodeURIComponent(reference)}`);
}

export function searchTransactions(params: TransactionSearchParams = {}) {
  return apiRequest<PageResponse<TransactionResponse>>(
    `/api/v1/transactions/search${toQuery({
      accountNumber: params.accountNumber,
      status: params.status,
      from: params.from,
      to: params.to,
      q: params.q,
      page: params.page ?? 0,
      size: params.size ?? 20,
    })}`,
  );
}
