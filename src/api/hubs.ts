import { apiRequest } from "../lib/apiClient";
import { getTrialBalance } from "./ledger";
import { getMyTillPositions, getTillPositions } from "./teller";
import { listNotifications } from "./notifications";
import { dateToFromInstant, dateToToInstant, searchTransactions } from "./transactions";

export type HubSummary = {
  tillCount: number;
  myTillCount: number;
  notificationCount: number;
  recentTxnCount: number;
  trialBalanceLines: number;
  management?: {
    totalActiveUsers?: number;
    accessRequestsPendingApproval?: number;
    failedLoginsLast24h?: number;
  } | null;
};

function asList(res: unknown): unknown[] {
  if (Array.isArray(res)) return res;
  if (res && typeof res === "object" && "content" in res && Array.isArray((res as { content: unknown }).content)) {
    return (res as { content: unknown[] }).content;
  }
  if (res && typeof res === "object" && "positions" in res && Array.isArray((res as { positions: unknown }).positions)) {
    return (res as { positions: unknown[] }).positions;
  }
  return [];
}

export async function getHubSummary(): Promise<HubSummary> {
  const today = new Date().toISOString().slice(0, 10);
  const [tills, myTills, notifs, txns, trial, management] = await Promise.allSettled([
    getTillPositions(),
    getMyTillPositions(),
    listNotifications({ size: 20 }),
    searchTransactions({ size: 20, from: dateToFromInstant(today), to: dateToToInstant(today) }),
    getTrialBalance(),
    apiRequest<Record<string, number>>("/api/v1/iam/dashboard/management"),
  ]);

  const tillCount = tills.status === "fulfilled" ? asList(tills.value).length : 0;
  const myTillCount = myTills.status === "fulfilled" ? asList(myTills.value).length : 0;
  const notificationCount = notifs.status === "fulfilled" ? notifs.value.length : 0;
  const recentTxnCount = txns.status === "fulfilled" ? asList(txns.value).length : 0;
  let trialBalanceLines = 0;
  if (trial.status === "fulfilled" && trial.value && typeof trial.value === "object") {
    const v = trial.value as { rows?: unknown[]; lines?: unknown[]; accounts?: unknown[] };
    trialBalanceLines = (v.rows ?? v.lines ?? v.accounts ?? []).length;
  }

  return {
    tillCount,
    myTillCount,
    notificationCount,
    recentTxnCount,
    trialBalanceLines,
    management: management.status === "fulfilled" ? management.value : null,
  };
}

export function getProfitLossReport(params: { businessDate: string; branchCode?: string }) {
  const qs = new URLSearchParams();
  qs.set("businessDate", params.businessDate);
  if (params.branchCode) qs.set("branchCode", params.branchCode);
  return apiRequest(`/api/v1/reports/financial/profit-loss?${qs}`);
}
