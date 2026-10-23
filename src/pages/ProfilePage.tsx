import { useEffect, useRef, useState } from "react";
import { getMyProfile, getUserByUsername } from "../api/profile";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../lib/apiClient";
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

export function ProfilePage() {
  const navigate = useNavigate();
  const { username, permissions, bankId } = useAuth();
  const { avatarUrl, upload, clear } = useProfileAvatar();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState(PROFILE);
  const [loadError, setLoadError] = useState<string | null>(null);
  const initials = profile.displayName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let me = await getMyProfile();
        if (cancelled) return;
        if (username) {
          try {
            const byName = await getUserByUsername(username) as Record<string, unknown>;
            me = { ...me, ...byName } as typeof me;
          } catch { /* optional enrichment */ }
        }
        const displayName = [me.firstName, me.lastName].filter(Boolean).join(" ") || me.username || PROFILE.displayName;
        setProfile({
          displayName,
          role: PROFILE.role,
          username: me.username ?? username ?? PROFILE.username,
          email: me.email ?? PROFILE.email,
          staffId: me.id ?? PROFILE.staffId,
          branchCode: me.branchCode ?? PROFILE.branchCode,
          branchName: PROFILE.branchName,
          department: me.departmentCode ?? PROFILE.department,
          lastLogin: me.lastLoginAt ?? PROFILE.lastLogin,
          permissionsSummary: permissions.length ? permissions.slice(0, 12) : PROFILE.permissionsSummary,
        });
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Profile load failed");
          // Fall back to JWT identity
          if (username) {
            setProfile((prev) => ({
              ...prev,
              username,
              displayName: username,
              permissionsSummary: permissions.length ? permissions.slice(0, 12) : prev.permissionsSummary,
            }));
          }
        }
      }
    })();
    return () => { cancelled = true; };
  }, [username, permissions, bankId]);

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
              {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{initials}</span>}
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
            <h1>{profile.displayName}</h1>
      {loadError ? <p role="alert">{loadError}</p> : null}
            <p>
              {profile.role} · {profile.branchName}
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
              <dd>{profile.username}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{profile.email}</dd>
            </div>
            <div>
              <dt>Staff ID</dt>
              <dd>{profile.staffId}</dd>
            </div>
            <div>
              <dt>Department</dt>
              <dd>{profile.department}</dd>
            </div>
          </dl>
        </section>

        <section className="pfp-section">
          <h2>Branch &amp; access</h2>
          <dl className="pfp-grid">
            <div>
              <dt>Branch code</dt>
              <dd>{profile.branchCode}</dd>
            </div>
            <div>
              <dt>Branch name</dt>
              <dd>{profile.branchName}</dd>
            </div>
            <div>
              <dt>Last sign-in</dt>
              <dd>{profile.lastLogin}</dd>
            </div>
            <div className="pfp-span">
              <dt>Effective permissions (sample)</dt>
              <dd>
                <ul className="pfp-perms">
                  {profile.permissionsSummary.map((p) => (
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
