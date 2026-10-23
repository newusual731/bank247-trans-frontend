import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loginWithPassword, logout as clearAuth } from "../lib/authApi";
import {
  getAccessToken,
  getBankIdFromToken,
  getDisplayNameFromToken,
  getPermissionsFromToken,
  isAuthenticated,
} from "../lib/authSession";

type AuthState = {
  ready: boolean;
  authenticated: boolean;
  username: string | null;
  bankId: string | null;
  permissions: string[];
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
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready] = useState(true);
  const [auth, setAuth] = useState(() => snapshot());

  const login = useCallback(async (username: string, password: string) => {
    await loginWithPassword(username.trim(), password);
    setAuth(snapshot());
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setAuth(snapshot());
  }, []);

  const hasPermission = useCallback(
    (code: string) => {
      if (auth.permissions.includes(code)) return true;
      // JWT may expose SCOPE_ prefixed or raw catalog codes
      if (auth.permissions.includes(`SCOPE_${code}`)) return true;
      const bare = code.replace(/^SCOPE_/, "");
      return auth.permissions.includes(bare);
    },
    [auth.permissions],
  );

  const value = useMemo<AuthState>(
    () => ({
      ready,
      authenticated: auth.authenticated,
      username: auth.username,
      bankId: auth.bankId,
      permissions: auth.permissions,
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
