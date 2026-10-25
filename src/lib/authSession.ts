const ACCESS_KEY = "bank247.accessToken";
const REFRESH_KEY = "bank247.refreshToken";
const EXPIRES_KEY = "bank247.tokenExpiresAt";
const REFRESH_EXPIRES_KEY = "bank247.refreshExpiresAt";
const SKEW_MS = 15_000;
const MAX_TIMER_MS = 2_147_483_647;

export type TokenBundle = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  refreshExpiresAt?: number;
};

let sessionWatchTimer: number | null = null;

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

export function getRefreshExpiresAt(): number {
  try {
    return Number(sessionStorage.getItem(REFRESH_EXPIRES_KEY) || 0);
  } catch {
    return 0;
  }
}

export function saveTokens(bundle: TokenBundle): void {
  sessionStorage.setItem(ACCESS_KEY, bundle.accessToken);
  if (bundle.refreshToken) sessionStorage.setItem(REFRESH_KEY, bundle.refreshToken);
  else sessionStorage.removeItem(REFRESH_KEY);
  sessionStorage.setItem(EXPIRES_KEY, String(bundle.expiresAt));
  if (bundle.refreshExpiresAt != null) {
    sessionStorage.setItem(REFRESH_EXPIRES_KEY, String(bundle.refreshExpiresAt));
  } else {
    sessionStorage.removeItem(REFRESH_EXPIRES_KEY);
  }
}

export function clearTokens(): void {
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(EXPIRES_KEY);
  sessionStorage.removeItem(REFRESH_EXPIRES_KEY);
  stopSessionWatch();
}

export function notifyAuthLost(): void {
  window.dispatchEvent(new Event("bank247-auth-lost"));
}

/** Drop the stored session and tell the app to return to the login screen. */
export function endSession(): void {
  clearTokens();
  notifyAuthLost();
}

export function stopSessionWatch(): void {
  if (sessionWatchTimer != null) {
    window.clearTimeout(sessionWatchTimer);
    sessionWatchTimer = null;
  }
}

function refreshTokenExpired(): boolean {
  const at = getRefreshExpiresAt();
  return at > 0 && Date.now() >= at - SKEW_MS;
}

/**
 * Refresh as the access token expires. `refresh` returns false when the
 * refresh token is missing or rejected; the caller must already have ended
 * the session in that case.
 */
export function watchSession(refresh: () => Promise<boolean>, onRefreshed?: () => void): void {
  stopSessionWatch();
  const access = getAccessToken();
  const expiresAt = getTokenExpiresAt();
  if (!access || !expiresAt) return;

  const refreshAt = getRefreshExpiresAt();
  const accessDeadline = expiresAt - SKEW_MS;
  const deadline = refreshAt > 0 ? Math.min(accessDeadline, refreshAt - SKEW_MS) : accessDeadline;
  const delay = Math.min(MAX_TIMER_MS, Math.max(0, deadline - Date.now()));
  sessionWatchTimer = window.setTimeout(() => {
    sessionWatchTimer = null;
    if (refreshTokenExpired()) {
      endSession();
      return;
    }
    void refresh().then((ok) => {
      if (!ok) return;
      onRefreshed?.();
      watchSession(refresh, onRefreshed);
    });
  }, delay);
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
