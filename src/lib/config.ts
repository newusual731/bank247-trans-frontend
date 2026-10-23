export const API_BASE_URL = (() => {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (raw === undefined) return "http://localhost:8080";
  return raw.trim().replace(/\/$/, "");
})();

export const OIDC_TOKEN_URL = (() => {
  const raw = import.meta.env.VITE_OIDC_TOKEN_URL as string | undefined;
  if (raw !== undefined && raw.trim() !== "") return raw.trim();
  return API_BASE_URL
    ? `${API_BASE_URL}/realms/bank247/protocol/openid-connect/token`
    : "/realms/bank247/protocol/openid-connect/token";
})();

export const OIDC_CLIENT_ID =
  (import.meta.env.VITE_OIDC_CLIENT_ID as string | undefined) || "bank247-cli";
