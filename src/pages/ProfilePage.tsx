import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfileAvatar } from "../hooks/useProfileAvatar";
import "./ProfilePage.css";

/** MVP staff "my profile" — not IAM user management */
const PROFILE = {
  displayName: "Sam Kola",
  role: "Owner",
  username: "sam.kola",
  email: "sam.kola@demo.bank247.local",
  staffId: "STF-00482",
  branchCode: "232",
  branchName: "Ikeja Top",
  department: "Branch Operations",
  lastLogin: "Sep 26, 2026 · 08:01",
  permissionsSummary: ["teller.cash.read", "teller.till.write", "ledger.enquiry.read"],
};

const INITIALS = PROFILE.displayName
  .split(" ")
  .map((p) => p[0])
  .slice(0, 2)
  .join("");

export function ProfilePage() {
  const navigate = useNavigate();
  const { avatarUrl, upload, clear } = useProfileAvatar();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onPick = async (file: File | null | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await upload(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="pfp">
      <div className="pfp-panel">
        <div className="pfp-hero">
          <div className="pfp-avatar-wrap">
            <button
              type="button"
              className={`pfp-avatar${avatarUrl ? " has-image" : ""}`}
              aria-label="Change profile photo"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{INITIALS}</span>}
              <span className="pfp-avatar-overlay">{busy ? "…" : "Upload"}</span>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="pfp-file"
              onChange={(e) => void onPick(e.target.files?.[0])}
            />
            {avatarUrl ? (
              <button type="button" className="pfp-avatar-remove" onClick={clear}>
                Remove photo
              </button>
            ) : (
              <p className="pfp-avatar-hint">Click photo to upload</p>
            )}
            {error ? <p className="pfp-avatar-error">{error}</p> : null}
          </div>
          <div className="pfp-hero-meta">
            <h1>{PROFILE.displayName}</h1>
            <p>
              {PROFILE.role} · {PROFILE.branchName}
            </p>
          </div>
          <button type="button" className="pfp-signout" onClick={() => navigate("/login")}>
            Sign out
          </button>
        </div>

        <section className="pfp-section">
          <h2>Account details</h2>
          <dl className="pfp-grid">
            <div>
              <dt>Username</dt>
              <dd>{PROFILE.username}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{PROFILE.email}</dd>
            </div>
            <div>
              <dt>Staff ID</dt>
              <dd>{PROFILE.staffId}</dd>
            </div>
            <div>
              <dt>Department</dt>
              <dd>{PROFILE.department}</dd>
            </div>
          </dl>
        </section>

        <section className="pfp-section">
          <h2>Branch &amp; access</h2>
          <dl className="pfp-grid">
            <div>
              <dt>Branch code</dt>
              <dd>{PROFILE.branchCode}</dd>
            </div>
            <div>
              <dt>Branch name</dt>
              <dd>{PROFILE.branchName}</dd>
            </div>
            <div>
              <dt>Last sign-in</dt>
              <dd>{PROFILE.lastLogin}</dd>
            </div>
            <div className="pfp-span">
              <dt>Effective permissions (sample)</dt>
              <dd>
                <ul className="pfp-perms">
                  {PROFILE.permissionsSummary.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </section>

        <section className="pfp-section">
          <h2>Security</h2>
          <p className="pfp-hint">
            Password and MFA are managed in your bank identity provider (Keycloak / SSO). Bank247 does not store
            staff passwords.
          </p>
          <div className="pfp-security-actions">
            <button type="button" className="pfp-secondary" disabled title="Available when IdP is connected">
              Change password (IdP)
            </button>
            <button type="button" className="pfp-secondary" onClick={() => navigate("/notifications")}>
              View notifications
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
