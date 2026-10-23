const ACCESS_KEY = "bank247.accessToken";
const REFRESH_KEY = "bank247.refreshToken";
const EXPIRES_KEY = "bank247.tokenExpiresAt";

export type TokenBundle = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
};

export function getAccessToken(): string | null {
  try {
    return sessionStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  try {
    return sessionStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function getTokenExpiresAt(): number {
  try {
    return Number(sessionStorage.getItem(EXPIRES_KEY) || 0);
  } catch {
    return 0;
  }
}

export function saveTokens(bundle: TokenBundle): void {
  sessionStorage.setItem(ACCESS_KEY, bundle.accessToken);
  if (bundle.refreshToken) sessionStorage.setItem(REFRESH_KEY, bundle.refreshToken);
  else sessionStorage.removeItem(REFRESH_KEY);
  sessionStorage.setItem(EXPIRES_KEY, String(bundle.expiresAt));
}

export function clearTokens(): void {
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(EXPIRES_KEY);
}

export function isAuthenticated(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  const expiresAt = getTokenExpiresAt();
  return !expiresAt || Date.now() < expiresAt - 5_000;
}

/** Decode JWT payload (no signature verify — resource server validates). */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getPermissionsFromToken(token: string | null = getAccessToken()): string[] {
  if (!token) return [];
  const payload = decodeJwtPayload(token);
  if (!payload) return [];
  const claim = payload.bank247_permissions;
  if (Array.isArray(claim)) return claim.map(String);
  if (typeof claim === "string") return claim.split(/\s+/).filter(Boolean);
  const scope = payload.scope;
  if (typeof scope === "string") return scope.split(/\s+/).filter(Boolean);
  return [];
}

export function getBankIdFromToken(token: string | null = getAccessToken()): string | null {
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  const bankId = payload?.bank_id;
  return typeof bankId === "string" ? bankId : null;
}

export function getDisplayNameFromToken(token: string | null = getAccessToken()): string | null {
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  const preferred = payload?.preferred_username ?? payload?.name ?? payload?.email;
  return typeof preferred === "string" ? preferred : null;
}
