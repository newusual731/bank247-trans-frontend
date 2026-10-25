import { OIDC_CLIENT_ID, OIDC_TOKEN_URL } from "./config";
import {
  clearTokens,
  endSession,
  getRefreshExpiresAt,
  getRefreshToken,
  saveTokens,
  type TokenBundle,
} from "./authSession";

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_expires_in?: number;
  token_type?: string;
};

let refreshInFlight: Promise<TokenBundle | null> | null = null;

async function exchange(body: URLSearchParams): Promise<TokenBundle> {
  const res = await fetch(OIDC_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await res.text();
  let data: TokenResponse & { error_description?: string; error?: string };
  try {
    data = JSON.parse(text) as TokenResponse & { error_description?: string; error?: string };
  } catch {
    throw new AuthError(res.ok ? "Invalid token response" : `Sign-in failed (${res.status})`);
  }
  if (!res.ok || !data.access_token) {
    throw new AuthError(data.error_description || data.error || `Sign-in failed (${res.status})`);
  }
  const expiresIn = typeof data.expires_in === "number" ? data.expires_in : 300;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + expiresIn * 1000,
    refreshExpiresAt:
      typeof data.refresh_expires_in === "number"
        ? Date.now() + data.refresh_expires_in * 1000
        : undefined,
  };
}

/** Local Keycloak: public client + direct access grants (password). */
export async function loginWithPassword(username: string, password: string): Promise<TokenBundle> {
  const body = new URLSearchParams({
    grant_type: "password",
    client_id: OIDC_CLIENT_ID,
    username,
    password,
  });
  const bundle = await exchange(body);
  saveTokens(bundle);
  return bundle;
}

async function refreshOnce(): Promise<TokenBundle | null> {
  const refresh = getRefreshToken();
  if (!refresh) {
    endSession();
    return null;
  }
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: OIDC_CLIENT_ID,
    refresh_token: refresh,
  });
  try {
    const bundle = await exchange(body);
    if (!bundle.refreshToken) bundle.refreshToken = refresh;
    if (bundle.refreshExpiresAt == null && getRefreshExpiresAt() > 0) {
      bundle.refreshExpiresAt = getRefreshExpiresAt();
    }
    saveTokens(bundle);
    return bundle;
  } catch {
    endSession();
    return null;
  }
}

export async function refreshAccessToken(): Promise<TokenBundle | null> {
  if (!refreshInFlight) {
    refreshInFlight = refreshOnce().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export function logout(): void {
  clearTokens();
}
