import { apiRequest, newIdempotencyKey } from "../lib/apiClient";

export type TellerCashPayload = {
  customerAccount: string;
  amount: string | number;
  currency: string;
  narration?: string;
  idempotencyKey?: string;
  depositorType?: string;
  ctrAcknowledged?: boolean;
  chequeNumber?: string;
};

export type TellerTransaction = {
  reference?: string;
  status?: string;
  [key: string]: unknown;
};

export function depositCash(payload: TellerCashPayload) {
  return apiRequest<TellerTransaction>("/api/v1/teller/transactions/deposits", {
    method: "POST",
    body: {
      ...payload,
      amount: String(payload.amount),
      idempotencyKey: payload.idempotencyKey ?? newIdempotencyKey("dep"),
    },
  });
}

export function withdrawCash(payload: TellerCashPayload) {
  return apiRequest<TellerTransaction>("/api/v1/teller/transactions/withdrawals", {
    method: "POST",
    body: {
      ...payload,
      amount: String(payload.amount),
      idempotencyKey: payload.idempotencyKey ?? newIdempotencyKey("wdl"),
    },
  });
}

export function getTellerTransaction(reference: string) {
  return apiRequest<TellerTransaction>(`/api/v1/teller/transactions/${encodeURIComponent(reference)}`);
}

export function requestCashReversal(reference: string) {
  return apiRequest<TellerTransaction>(
    `/api/v1/teller/transactions/${encodeURIComponent(reference)}/reversal-requests`,
    { method: "POST" },
  );
}

export function completeCashReversal(reference: string) {
  return apiRequest<TellerTransaction>(
    `/api/v1/teller/transactions/${encodeURIComponent(reference)}/complete-reversal`,
    { method: "POST" },
  );
}

export function completeApprovedCash(reference: string) {
  return apiRequest<TellerTransaction>(
    `/api/v1/teller/transactions/${encodeURIComponent(reference)}/complete-approved`,
    { method: "POST" },
  );
}

export type CreateTillTransferPayload = {
  destinationTillId: string;
  amount: string | number;
  currency: string;
  narration?: string;
  idempotencyKey?: string;
};

export function createTillTransfer(payload: CreateTillTransferPayload) {
  return apiRequest<Record<string, unknown>>("/api/v1/teller/till-transfers", {
    method: "POST",
    body: {
      ...payload,
      amount: String(payload.amount),
      idempotencyKey: payload.idempotencyKey ?? newIdempotencyKey("ttx"),
    },
  });
}

export function acceptTillTransfer(reference: string) {
  return apiRequest(`/api/v1/teller/till-transfers/${encodeURIComponent(reference)}/accept`, {
    method: "POST",
  });
}

export function createTill(payload: { tellerId: string; branchCode: string; currency: string }) {
  return apiRequest("/api/v1/teller/admin/tills", { method: "POST", body: payload });
}

export function activateTill(id: string) {
  return apiRequest(`/api/v1/teller/admin/tills/${encodeURIComponent(id)}/activate`, { method: "POST" });
}

export function getTill(id: string) {
  return apiRequest(`/api/v1/teller/admin/tills/${encodeURIComponent(id)}`);
}

export function requestTillClosure(id: string, body?: Record<string, unknown>) {
  return apiRequest(`/api/v1/teller/tills/${encodeURIComponent(id)}/closure-requests`, {
    method: "POST",
    body: body ?? {},
  });
}

export function closeTill(id: string, body?: Record<string, unknown>) {
  return apiRequest(`/api/v1/teller/tills/${encodeURIComponent(id)}/close`, {
    method: "POST",
    body: body ?? {},
  });
}

export function requestTillReopen(id: string, body?: Record<string, unknown>) {
  return apiRequest(`/api/v1/teller/tills/${encodeURIComponent(id)}/reopen-requests`, {
    method: "POST",
    body: body ?? {},
  });
}

export function reopenTill(id: string, body?: Record<string, unknown>) {
  return apiRequest(`/api/v1/teller/tills/${encodeURIComponent(id)}/reopen`, {
    method: "POST",
    body: body ?? {},
  });
}

export function getMyTillPositions() {
  return apiRequest("/api/v1/teller/positions/me");
}

export function getTillPositions() {
  return apiRequest("/api/v1/teller/positions");
}

export function getTillEntries(id: string) {
  return apiRequest(`/api/v1/teller/tills/${encodeURIComponent(id)}/entries`);
}

export function getTellerAdminParameters(branchCode: string) {
  return apiRequest(`/api/v1/teller/admin/parameters/${encodeURIComponent(branchCode)}`);
}

export function putTellerAdminParameters(body: Record<string, unknown>) {
  return apiRequest("/api/v1/teller/admin/parameters", { method: "PUT", body });
}

export type IssueBankDraftPayload = {
  sourceAccount: string;
  beneficiaryName: string;
  amount: string | number;
  currency: string;
  branchCode?: string;
  narration?: string;
};

export function createBankDraft(payload: IssueBankDraftPayload) {
  return apiRequest("/api/v1/teller/drafts", {
    method: "POST",
    body: { ...payload, amount: String(payload.amount) },
  });
}

export function listBankDrafts(params?: { branchCode?: string; status?: string; page?: number; size?: number }) {
  const qs = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiRequest(`/api/v1/teller/drafts${suffix}`);
}

export function getBankDraft(draftNumber: string) {
  return apiRequest(`/api/v1/teller/drafts/${encodeURIComponent(draftNumber)}`);
}

export function settleBankDraft(draftNumber: string) {
  return apiRequest(`/api/v1/teller/drafts/${encodeURIComponent(draftNumber)}/settle`, { method: "POST" });
}

export function cancelBankDraft(draftNumber: string, reason?: string) {
  return apiRequest(`/api/v1/teller/drafts/${encodeURIComponent(draftNumber)}/cancel`, {
    method: "POST",
    body: { reason: reason || null },
  });
}

export function flagBankDraft(draftNumber: string, reason?: string) {
  return apiRequest(`/api/v1/teller/drafts/${encodeURIComponent(draftNumber)}/flag`, {
    method: "POST",
    body: { reason: reason || null },
  });
}

export type CreateVaultTransferPayload = {
  direction: "VAULT_TO_TILL" | "TILL_TO_VAULT";
  tillId: string;
  amount: string | number;
  currency: string;
  narration?: string;
  idempotencyKey?: string;
};

export function createVaultTransfer(payload: CreateVaultTransferPayload) {
  return apiRequest("/api/v1/teller/vault-transfers", {
    method: "POST",
    body: {
      ...payload,
      amount: String(payload.amount),
      idempotencyKey: payload.idempotencyKey ?? newIdempotencyKey("vtx"),
    },
  });
}

export function completeApprovedVaultTransfer(reference: string) {
  return apiRequest(`/api/v1/teller/vault-transfers/${encodeURIComponent(reference)}/complete-approved`, {
    method: "POST",
  });
}

export function getVaultTransfer(reference: string) {
  return apiRequest(`/api/v1/teller/vault-transfers/${encodeURIComponent(reference)}`);
}

export function createVault(payload: { branchCode: string; currency: string }) {
  return apiRequest("/api/v1/teller/admin/vaults", { method: "POST", body: payload });
}

export function setTellerLimits(payload: {
  tellerId: string;
  branchCode: string;
  currency: string;
  depositLimit: string | number;
  withdrawalLimit: string | number;
}) {
  return apiRequest("/api/v1/teller/admin/limits", {
    method: "PUT",
    body: {
      ...payload,
      depositLimit: String(payload.depositLimit),
      withdrawalLimit: String(payload.withdrawalLimit),
    },
  });
}

export function rejectTillTransfer(reference: string) {
  return apiRequest(`/api/v1/teller/till-transfers/${encodeURIComponent(reference)}/reject`, {
    method: "POST",
  });
}

export function getTillTransfer(reference: string) {
  return apiRequest(`/api/v1/teller/till-transfers/${encodeURIComponent(reference)}`);
}

export function getTillDenominations(id: string) {
  return apiRequest(`/api/v1/teller/tills/${encodeURIComponent(id)}/denominations`);
}
