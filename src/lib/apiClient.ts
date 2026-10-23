import { API_BASE_URL } from "./config";
import {
  getAccessToken,
  getBankIdFromToken,
  getTokenExpiresAt,
} from "./authSession";
import { refreshAccessToken } from "./authApi";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function correlationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `ui-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function ensureToken(): Promise<string | null> {
  let token = getAccessToken();
  if (!token) return null;
  if (Date.now() > getTokenExpiresAt() - 15_000) {
    const refreshed = await refreshAccessToken();
    token = refreshed?.accessToken ?? getAccessToken();
  }
  return token;
}

export type ApiOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, headers = {}, signal } = options;
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  const hdrs: Record<string, string> = {
    Accept: "application/json",
    "X-Correlation-Id": correlationId(),
    ...headers,
  };

  if (body !== undefined) hdrs["Content-Type"] = "application/json";

  if (auth) {
    const token = await ensureToken();
    if (!token) throw new ApiError(401, "Not signed in");
    hdrs.Authorization = `Bearer ${token}`;
    const bankId = getBankIdFromToken(token);
    if (bankId) hdrs["X-Bank247-Tenant"] = bankId;
  }

  const res = await fetch(url, {
    method,
    headers: hdrs,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let parsed: unknown = undefined;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    if (parsed && typeof parsed === "object") {
      const o = parsed as Record<string, unknown>;
      if (typeof o.message === "string" && o.message) msg = o.message;
      else if (typeof o.error === "string" && o.error) msg = o.error;
    } else if (typeof parsed === "string" && parsed.trim()) {
      // nginx 502 HTML etc. — never dump markup into the UI
      msg = res.status === 502
        ? "Service temporarily unavailable (502). Try again in a moment."
        : `Request failed (${res.status})`;
    }
    throw new ApiError(res.status, msg, parsed);
  }

  return parsed as T;
}

export function newIdempotencyKey(prefix = "ui"): string {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${id}`.slice(0, 120);
}
