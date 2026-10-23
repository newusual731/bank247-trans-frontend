import { apiRequest } from "../lib/apiClient";
import { searchTransactions } from "./transactions";

export type DashboardKpis = {
  totalAssets: string | number;
  totalLiabilities: string | number;
  netProfit: string | number;
  assetsDeltaPct?: string | number | null;
  liabilitiesDeltaPct?: string | number | null;
  netProfitDeltaPct?: string | number | null;
};

export type DashboardJournalSegment = {
  key: string;
  amount: string | number;
};

export type DashboardDailyJournal = {
  date: string;
  total: string | number;
  segments: DashboardJournalSegment[];
};

export type DashboardOverview = {
  asOf: string;
  branchCode?: string | null;
  currency: string;
  kpis: DashboardKpis;
  dailyJournal: DashboardDailyJournal[];
};

export type DashboardTxnRow = {
  date: string;
  code: string;
  amount: string;
  account: string;
  status: "Failed" | "Posted" | "Pending" | "Reversed" | "Unknown";
  rawStatus: string;
};

export type DashboardTxnPage = {
  rows: DashboardTxnRow[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

function asNumber(v: string | number | null | undefined): number {
  if (v == null || v === "") return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function formatMoney(amount: string | number | null | undefined, currency = "NGN"): string {
  const n = asNumber(amount);
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString()}`;
  }
}

export function formatDeltaPct(v: string | number | null | undefined): { text: string; tone: "up" | "down" | "flat" } {
  if (v == null || v === "") return { text: "—", tone: "flat" };
  const n = asNumber(v);
  if (n === 0) return { text: "0%", tone: "flat" };
  const sign = n > 0 ? "+" : "";
  return { text: `${sign}${n.toFixed(1)}%`, tone: n > 0 ? "up" : "down" };
}

export function getDashboardOverview(params?: { asOf?: string; branchCode?: string; journalDays?: number }) {
  const qs = new URLSearchParams();
  if (params?.asOf) qs.set("asOf", params.asOf);
  if (params?.branchCode) qs.set("branchCode", params.branchCode);
  if (params?.journalDays != null) qs.set("journalDays", String(params.journalDays));
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiRequest<DashboardOverview>(`/api/v1/reports/dashboard/overview${suffix}`);
}

function mapTxnStatus(status: unknown): DashboardTxnRow["status"] {
  const s = String(status ?? "").toUpperCase();
  if (s === "SUCCESSFUL" || s === "POSTED") return "Posted";
  if (s === "FAILED") return "Failed";
  if (s === "PROCESSING" || s === "PENDING") return "Pending";
  if (s === "REVERSED") return "Reversed";
  return "Unknown";
}

function asPage(res: unknown): {
  content: Record<string, unknown>[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
} {
  if (!res || typeof res !== "object") {
    return { content: [], page: 0, size: 5, totalElements: 0, totalPages: 0 };
  }
  const r = res as Record<string, unknown>;
  const content = Array.isArray(r.content)
    ? (r.content as Record<string, unknown>[])
    : Array.isArray(res)
      ? (res as Record<string, unknown>[])
      : [];
  return {
    content,
    page: Number(r.page ?? 0),
    size: Number(r.size ?? content.length),
    totalElements: Number(r.totalElements ?? content.length),
    totalPages: Number(r.totalPages ?? (content.length ? 1 : 0)),
  };
}

export async function getDashboardTransactions(params: {
  page?: number;
  size?: number;
  q?: string;
  status?: string;
}): Promise<DashboardTxnPage> {
  const res = await searchTransactions({
    page: params.page ?? 0,
    size: params.size ?? 5,
    q: params.q,
    status: params.status,
  });
  const page = asPage(res as unknown);
  const rows: DashboardTxnRow[] = page.content.map((t) => {
    const amount = formatMoney(t.amount as string | number, String(t.currency ?? "NGN"));
    const created = t.createdAt ? new Date(String(t.createdAt)) : null;
    const date =
      created && !Number.isNaN(created.getTime())
        ? created.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
        : String(t.valueDate ?? "—");
    return {
      date,
      code: String(t.reference ?? t.id ?? "—"),
      amount,
      account: String(t.sourceAccount ?? t.destinationAccount ?? "—"),
      status: mapTxnStatus(t.status),
      rawStatus: String(t.status ?? ""),
    };
  });
  return {
    rows,
    page: page.page,
    size: page.size,
    totalElements: page.totalElements,
    totalPages: Math.max(page.totalPages, page.totalElements === 0 ? 0 : 1),
  };
}

export async function getPendingTransactionCount(): Promise<number> {
  try {
    const res = await searchTransactions({ status: "PROCESSING", page: 0, size: 1 });
    return asPage(res as unknown).totalElements;
  } catch {
    return 0;
  }
}
