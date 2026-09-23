import { useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

const TOKEN_LEN = 6;

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState<string[]>(Array(TOKEN_LEN).fill(""));
  const tokenRefs = useRef<Array<HTMLInputElement | null>>([]);

  const canSubmit =
    email.trim().length > 0 &&
    password.length > 0 &&
    token.every((d) => d.length === 1);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    // Auth wiring comes later — UI navigates into the CBS shell.
    navigate("/accounts");
  }

  function setTokenDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setToken((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < TOKEN_LEN - 1) {
      tokenRefs.current[index + 1]?.focus();
    }
  }

  function onTokenKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !token[index] && index > 0) {
      tokenRefs.current[index - 1]?.focus();
    }
  }

  function onTokenPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, TOKEN_LEN);
    if (!digits) return;
    const next = Array(TOKEN_LEN).fill("");
    digits.split("").forEach((d, i) => {
      next[i] = d;
    });
    setToken(next);
    tokenRefs.current[Math.min(digits.length, TOKEN_LEN) - 1]?.focus();
  }

  return (
    <div className="login-page">
      <aside className="login-brand" aria-label="Bank247">
        <div className="login-brand-inner">
          <p className="login-brand-logo">
            Bank<span>247</span>
          </p>
          <h2>
            Elevate your Core Banking
            <br />
            Experience with Bank 24/7
          </h2>
          <p className="login-brand-copy">
            Secure staff access to ledgers, branch cash, transfers, and approvals —
            built for Nigerian banks running on Bank247.
          </p>

          <div className="login-trust">
            <div className="login-trust-icon" aria-hidden>
              <ShieldIcon />
            </div>
            <p>
              Multi-factor staff sign-in protects transaction processing, GL posting, and
              maker-checker workflows across every branch.
            </p>
            <div className="login-trust-meta">
              <strong>Bank247 Security</strong>
              <span>Staff IdP · Token authentication</span>
            </div>
            <div className="login-dots" aria-hidden>
              <span className="is-active" />
              <span />
              <span />
            </div>
          </div>
        </div>
      </aside>

      <main className="login-main">
        <form className="login-card" onSubmit={onSubmit} noValidate>
          <header className="login-header">
            <h1>Log In</h1>
            <p>Enter your credentials to access your account</p>
          </header>

          <label className="login-field">
            <span className="login-label">Email Address</span>
            <div className="login-input-wrap">
              <input
                type="email"
                placeholder="Enter Email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <span className="login-input-icon" aria-hidden>
                <MailIcon />
              </span>
            </div>
          </label>

          <label className="login-field">
            <span className="login-label">Password</span>
            <div className="login-input-wrap">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="login-input-icon login-input-icon--btn"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
          </label>

          <div className="login-forgot-row">
            <a href="#forgot">Forgot Password?</a>
          </div>

          <div className="login-token-sep" role="separator">
            <span>Token Authentication</span>
          </div>

          <div className="login-token" role="group" aria-label="6-digit authentication token">
            {token.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  tokenRefs.current[index] = el;
                }}
                className="login-token-cell"
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={1}
                aria-label={`Digit ${index + 1}`}
                value={digit}
                placeholder="0"
                onChange={(e) => setTokenDigit(index, e.target.value)}
                onKeyDown={(e) => onTokenKeyDown(index, e)}
                onPaste={onTokenPaste}
              />
            ))}
          </div>

          <button type="submit" className="login-submit" disabled={!canSubmit}>
            Log into Account
          </button>
        </form>
      </main>
    </div>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6.5h16v11H4v-11z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 7l7.5 6 7.5-6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.8 9.8 0 0112 5c5 0 9.3 3.1 11 7.5a11.4 11.4 0 01-4.2 5.1M6.1 6.1A11.3 11.3 0 001 12.5C2.7 16.9 7 20 12 20c1.7 0 3.3-.4 4.7-1"
        stroke="currentColor"
        strokeWidth="1.6"
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
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12.5" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l8 3.5v5.2c0 4.6-3.1 8.7-8 9.8-4.9-1.1-8-5.2-8-9.8V6.5L12 3z"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12.2l1.8 1.8 3.4-3.8"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
