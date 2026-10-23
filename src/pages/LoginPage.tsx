import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./LoginPage.css";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, authenticated } = useAuth();
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = staffId.trim().length > 0 && password.length > 0 && !busy;

  useEffect(() => {
    if (!authenticated) return;
    const from = (location.state as { from?: string } | null)?.from || "/dashboard";
    navigate(from, { replace: true });
  }, [authenticated, location.state, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await login(staffId.trim(), password);
      const from = (location.state as { from?: string } | null)?.from || "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <img
        className="login-blobs-art"
        src="/login-blobs-full.png"
        width={1440}
        height={1024}
        alt=""
        aria-hidden
        draggable={false}
      />

      <main className="login-main">
        <form className="login-card" onSubmit={onSubmit} noValidate>
          <header className="login-header">
            <h1>Sign in to Transaction Processing</h1>
            <p>Use your staff username and password to access your workspace</p>
          </header>

          <div className="login-fields">
            <label className="login-field">
              <span className="login-label">Staff ID</span>
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
              />
            </label>

            <label className="login-field">
              <span className="login-label login-label--password">Password</span>
              <div className="login-input-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter Password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="login-eye"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              </div>
            </label>
          </div>

          {error ? <p className="login-error" role="alert">{error}</p> : null}

          <button type="submit" className="login-submit" disabled={!canSubmit}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </main>
    </div>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.8 9.8 0 0112 5c5 0 9.3 3.1 11 7.5a11.4 11.4 0 01-4.2 5.1M6.1 6.1A11.3 11.3 0 001 12.5C2.7 16.9 7 20 12 20c1.7 0 3.3-.4 4.7-1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M1 12.5C2.7 8.1 7 5 12 5s9.3 3.1 11 7.5C21.3 16.9 17 20 12 20S2.7 16.9 1 12.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12.5" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
