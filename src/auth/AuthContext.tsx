import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getMyEffectiveAccess, type EffectiveAccess } from "../api/iam";
import { loginWithPassword, logout as clearAuth, refreshAccessToken } from "../lib/authApi";
import {
  getAccessToken,
  getBankIdFromToken,
  getDisplayNameFromToken,
  getPermissionsFromToken,
  getRolesFromToken,
  isAuthenticated,
  stopSessionWatch,
  watchSession,
} from "../lib/authSession";

type AuthState = {
  ready: boolean;
  authenticated: boolean;
  username: string | null;
  bankId: string | null;
  permissions: string[];
  roles: string[];
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (code: string) => boolean;
};

const AuthContext = createContext<AuthState | null>(null);

function snapshot() {
  const token = getAccessToken();
  return {
    authenticated: isAuthenticated(),
    username: getDisplayNameFromToken(token),
    bankId: getBankIdFromToken(token),
    permissions: getPermissionsFromToken(token),
    roles: getRolesFromToken(token),
  };
}

function withGranted(base: ReturnType<typeof snapshot>, access: EffectiveAccess | null) {
  if (!access) return base;
  return {
    ...base,
    permissions: access.permissionCodes ?? [],
    roles: access.roleCodes ?? [],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready] = useState(true);
  const [auth, setAuth] = useState(() => snapshot());
  const grantedRef = useRef<EffectiveAccess | null>(null);

  const applySession = useCallback((access?: EffectiveAccess | null) => {
    if (access !== undefined) grantedRef.current = access;
    setAuth(withGranted(snapshot(), grantedRef.current));
  }, []);

  useEffect(() => {
    const onLost = () => {
      grantedRef.current = null;
      setAuth(snapshot());
    };
    window.addEventListener("bank247-auth-lost", onLost);
    return () => window.removeEventListener("bank247-auth-lost", onLost);
  }, []);

  useEffect(() => {
    if (!auth.authenticated) return;
    let cancelled = false;
    void getMyEffectiveAccess()
      .then((access) => {
        if (!cancelled) applySession(access);
      })
      .catch(() => {
        /* keep the token claims when IAM is unreachable */
      });
    return () => {
      cancelled = true;
    };
  }, [auth.authenticated, applySession]);

  useEffect(() => {
    if (!auth.authenticated) {
      stopSessionWatch();
      return;
    }
    watchSession(
      async () => Boolean(await refreshAccessToken()),
      () => applySession(),
    );
    return () => stopSessionWatch();
  }, [auth.authenticated, applySession]);

  const login = useCallback(async (username: string, password: string) => {
    await loginWithPassword(username.trim(), password);
    applySession(null);
    try {
      applySession(await getMyEffectiveAccess());
    } catch {
      applySession(null);
    }
  }, [applySession]);

  const logout = useCallback(() => {
    clearAuth();
    grantedRef.current = null;
    setAuth(snapshot());
  }, []);

  const hasPermission = useCallback(
    (code: string) => {
      if (auth.roles.some((role) => role === "SUPER_ADMIN" || role === "SCOPE_SUPER_ADMIN")) return true;
      if (auth.permissions.includes(code)) return true;
      if (auth.permissions.includes(`SCOPE_${code}`)) return true;
      const bare = code.replace(/^SCOPE_/, "");
      return auth.permissions.includes(bare);
    },
    [auth.permissions, auth.roles],
  );

  const value = useMemo<AuthState>(
    () => ({
      ready,
      authenticated: auth.authenticated,
      username: auth.username,
      bankId: auth.bankId,
      permissions: auth.permissions,
      roles: auth.roles,
      login,
      logout,
      hasPermission,
    }),
    [ready, auth, login, logout, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
