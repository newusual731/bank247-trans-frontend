import { apiRequest, newIdempotencyKey } from "../lib/apiClient";

export function createLoan(body: Record<string, unknown>) {
  return apiRequest("/api/v1/loans", { method: "POST", body });
}

export function disburseLoan(loanNumber: string, valueDate: string) {
  return apiRequest(`/api/v1/loans/${encodeURIComponent(loanNumber)}/disburse`, {
    method: "POST",
    body: { valueDate },
  });
}

export function repayLoan(
  loanNumber: string,
  body: { settlementAccount: string; amount: string | number; valueDate: string; narration?: string },
) {
  return apiRequest(`/api/v1/loans/${encodeURIComponent(loanNumber)}/repay`, {
    method: "POST",
    body: {
      ...body,
      amount: String(body.amount),
      idempotencyKey: newIdempotencyKey("lrp"),
    },
  });
}

export function createInvestment(body: Record<string, unknown>) {
  return apiRequest("/api/v1/investments", { method: "POST", body });
}

export function bookInvestment(investmentNumber: string, valueDate: string) {
  return apiRequest(`/api/v1/investments/${encodeURIComponent(investmentNumber)}/book`, {
    method: "POST",
    body: { valueDate },
  });
}

export function createTreasuryDeal(body: Record<string, unknown>) {
  return apiRequest("/api/v1/treasury/deals", { method: "POST", body });
}

export function bookTreasuryDeal(
  dealReference: string,
  body: { sendExternalConfirmation?: boolean; environment?: "UAT" | "PRODUCTION" } = {},
) {
  return apiRequest(`/api/v1/treasury/deals/${encodeURIComponent(dealReference)}/book`, {
    method: "POST",
    body: {
      sendExternalConfirmation: body.sendExternalConfirmation ?? false,
      environment: body.environment ?? "UAT",
    },
  });
}

export function settleTreasuryDeal(dealReference: string) {
  return apiRequest(`/api/v1/treasury/deals/${encodeURIComponent(dealReference)}/settle`, {
    method: "POST",
  });
}

export function cancelTreasuryDeal(dealReference: string, reason?: string) {
  return apiRequest(`/api/v1/treasury/deals/${encodeURIComponent(dealReference)}/cancel`, {
    method: "POST",
    body: reason ? { reason } : {},
  });
}

export function createTradeInstrument(body: Record<string, unknown>) {
  return apiRequest("/api/v1/trade/instruments", { method: "POST", body });
}

export function issueTradeInstrument(
  instrumentReference: string,
  body: {
    issueDate: string;
    sendSwiftMessage?: boolean;
    swiftMessageType?: string;
    environment?: "UAT" | "PRODUCTION";
  },
) {
  return apiRequest(`/api/v1/trade/instruments/${encodeURIComponent(instrumentReference)}/issue`, {
    method: "POST",
    body: {
      issueDate: body.issueDate,
      sendSwiftMessage: body.sendSwiftMessage ?? false,
      environment: body.environment ?? "UAT",
      swiftMessageType: body.swiftMessageType,
    },
  });
}

export function confirmTradeInstrument(instrumentReference: string) {
  return apiRequest(`/api/v1/trade/instruments/${encodeURIComponent(instrumentReference)}/confirm`, {
    method: "POST",
  });
}

export function cancelTradeInstrument(instrumentReference: string, reason?: string) {
  return apiRequest(`/api/v1/trade/instruments/${encodeURIComponent(instrumentReference)}/cancel`, {
    method: "POST",
    body: reason ? { reason } : {},
  });
}

export function liquidateInvestment(
  investmentNumber: string,
  body: { principalAmount?: string | number; valueDate: string; narration?: string; settlementAccount?: string },
) {
  return apiRequest(`/api/v1/investments/${encodeURIComponent(investmentNumber)}/liquidations`, {
    method: "POST",
    body: {
      idempotencyKey: newIdempotencyKey("liq"),
      valueDate: body.valueDate,
      narration: body.narration,
      settlementAccount: body.settlementAccount,
      ...(body.principalAmount != null ? { principalAmount: String(body.principalAmount) } : {}),
    },
  });
}

export function liquidateLoan(
  loanNumber: string,
  body: { settlementAccount: string; valueDate: string; narration?: string },
) {
  return apiRequest(`/api/v1/loans/${encodeURIComponent(loanNumber)}/liquidate`, {
    method: "POST",
    body: {
      idempotencyKey: newIdempotencyKey("llq"),
      settlementAccount: body.settlementAccount,
      valueDate: body.valueDate,
      narration: body.narration,
    },
  });
}

