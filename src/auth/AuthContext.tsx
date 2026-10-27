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
import { asStringList, hasAccessCode, isSuperAdminRole, uniqueCodes } from "./access";

type AuthState = {
  ready: boolean;
  authenticated: boolean;
  username: string | null;
  bankId: string | null;
  permissions: string[];
  roles: string[];
  /** True once IAM effective-access has returned successfully at least once. */
  accessLoaded: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (code: string) => boolean;
  refreshAccess: () => Promise<void>;
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

function normalizeAccess(access: EffectiveAccess): EffectiveAccess {
  return {
    userId: access.userId,
    roleCodes: uniqueCodes(asStringList(access.roleCodes)),
    permissionCodes: uniqueCodes(asStringList(access.permissionCodes)),
    branchScopes: uniqueCodes(asStringList(access.branchScopes)),
  };
}

/**
 * Prefer IAM effective access when present, but always union with JWT claims so
 * a lagging IdP sync cannot wipe Super Admin / direct grants.
 */
function withGranted(base: ReturnType<typeof snapshot>, access: EffectiveAccess | null) {
  if (!access) return base;
  return {
    ...base,
    permissions: uniqueCodes([...(access.permissionCodes ?? []), ...base.permissions]),
    roles: uniqueCodes([...(access.roleCodes ?? []), ...base.roles]),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(() => !snapshot().authenticated);
  const [auth, setAuth] = useState(() => snapshot());
  const [accessLoaded, setAccessLoaded] = useState(false);
  const grantedRef = useRef<EffectiveAccess | null>(null);

  const applySession = useCallback((access?: EffectiveAccess | null) => {
    // Only update the IAM snapshot when a real response is provided.
    // Never pass null here to "clear" on a failed refresh — that wiped Super Admin.
    if (access) {
      grantedRef.current = normalizeAccess(access);
      setAccessLoaded(true);
    }
    setAuth(withGranted(snapshot(), grantedRef.current));
  }, []);

  const refreshAccess = useCallback(async () => {
    if (!isAuthenticated()) return;
    try {
      applySession(await getMyEffectiveAccess());
    } catch {
      // Keep the last good IAM snapshot + current token claims.
      applySession();
    }
  }, [applySession]);

  useEffect(() => {
    const onLost = () => {
      grantedRef.current = null;
      setAccessLoaded(false);
      setAuth(snapshot());
    };
    window.addEventListener("bank247-auth-lost", onLost);
    return () => window.removeEventListener("bank247-auth-lost", onLost);
  }, []);

  useEffect(() => {
    if (!auth.authenticated) {
      setReady(true);
      return;
    }
    let cancelled = false;
    void getMyEffectiveAccess()
      .then((access) => {
        if (!cancelled) applySession(access);
      })
      .catch(() => {
        /* keep the token claims when IAM is unreachable */
        if (!cancelled) applySession();
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [auth.authenticated, applySession]);

  useEffect(() => {
    if (!auth.authenticated) return;
    const onFocus = () => {
      void refreshAccess();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") onFocus();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [auth.authenticated, refreshAccess]);

  useEffect(() => {
    if (!auth.authenticated) {
      stopSessionWatch();
      return;
    }
    watchSession(
      async () => Boolean(await refreshAccessToken()),
      () => {
        applySession();
        void refreshAccess();
      },
    );
    return () => stopSessionWatch();
  }, [auth.authenticated, applySession, refreshAccess]);

  const login = useCallback(async (username: string, password: string) => {
    setReady(false);
    setAccessLoaded(false);
    grantedRef.current = null;
    try {
      await loginWithPassword(username.trim(), password);
      try {
        applySession(await getMyEffectiveAccess());
      } catch {
        applySession();
      }
    } finally {
      setReady(true);
    }
  }, [applySession]);

  const logout = useCallback(() => {
    clearAuth();
    grantedRef.current = null;
    setAccessLoaded(false);
    setAuth(snapshot());
    setReady(true);
  }, []);

  const hasPermission = useCallback(
    (code: string) => {
      if (isSuperAdminRole(auth.roles)) return true;
      // Until IAM answers, do not lock the whole app behind empty claims.
      if (!accessLoaded && auth.permissions.length === 0 && auth.roles.length === 0) {
        return true;
      }
      return hasAccessCode(auth.permissions, code);
    },
    [auth.permissions, auth.roles, accessLoaded],
  );

  const value = useMemo<AuthState>(
    () => ({
      ready,
      authenticated: auth.authenticated,
      username: auth.username,
      bankId: auth.bankId,
      permissions: auth.permissions,
      roles: auth.roles,
      accessLoaded,
      login,
      logout,
      hasPermission,
      refreshAccess,
    }),
    [ready, auth, accessLoaded, login, logout, hasPermission, refreshAccess],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
