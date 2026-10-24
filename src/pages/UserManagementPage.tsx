import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FilterDropdown } from "../components/FilterDropdown";
import { IAM_PERMISSION_CATALOG, STAFF_ROLES, USER_STATUSES } from "../data/iamOptions";
import "./UserManagementPage.css";
import { listIamUsers, listIamRoles, listIamPermissions } from "../api/domain";
import { createIamRole, createIamUser, submitIamRole, applyIamRole, submitIamUserCreate, applyIamUserCreate, disableIamUser } from "../api/iam";
import { ApiError } from "../lib/apiClient";
import { ViewDetailsModal } from "../components/feedback/ViewDetailsModal";
import { ConfirmActionModal } from "../components/feedback/ConfirmActionModal";

type UserRow = {
  id: string;
  fullName: string;
  userName: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
};

const ROWS: UserRow[] = [
  {
    id: "U-001",
    fullName: "Grace A.",
    userName: "Grace_Admin",
    email: "Grace@b247@gmail.com",
    role: "Admin",
    status: "Active",
    lastLogin: "2025-07-02 08:30",
  },
  ...Array.from({ length: 7 }, () => ({
    id: "U-002",
    fullName: "John O.",
    userName: "John_ops",
    email: "John@b247@gmail.com",
    role: "Operations",
    status: "Active",
    lastLogin: "2025-07-02 08:30",
  })),
  {
    id: "U-003",
    fullName: "Eunice J.",
    userName: "Eunice_Ld",
    email: "Eunice@b247@gmail.com",
    role: "Operations",
    status: "Active",
    lastLogin: "2025-07-02 08:30",
  },
];

export function UserManagementPage() {
  const [role, setRole] = useState<string>("Admin");
  const [status, setStatus] = useState<string>(USER_STATUSES[0]);
  const [from, setFrom] = useState("2025-06-15");
  const [to, setTo] = useState("2025-06-15");
  type ModalState =
    | { kind: "add" }
    | { kind: "edit"; row: UserRow }
    | { kind: "view"; row: UserRow }
    | { kind: "disable"; row: UserRow }
    | null;
  const [modal, setModal] = useState<ModalState>(null);
  const [apiRows, setApiRows] = useState<UserRow[] | null>(null);
  const [roleOptions, setRoleOptions] = useState<string[]>(() => [...STAFF_ROLES]);
  const [iamError, setIamError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [usersRes, rolesRes] = await Promise.all([listIamUsers({ size: 50 }), listIamRoles()]);
        if (cancelled) return;
        const content =
          usersRes && typeof usersRes === "object" && "content" in usersRes && Array.isArray((usersRes as { content: unknown }).content)
            ? (usersRes as { content: Record<string, unknown>[] }).content
            : Array.isArray(usersRes)
              ? (usersRes as Record<string, unknown>[])
              : [];
        if (content.length) {
          setApiRows(
            content.map((u, i) => ({
              id: String(u.id ?? u.userId ?? `U-${i}`),
              fullName: String(u.fullName ?? u.displayName ?? u.name ?? "—"),
              userName: String(u.username ?? u.userName ?? "—"),
              email: String(u.email ?? "—"),
              role: String(
                (Array.isArray(u.roles) && u.roles[0]
                  ? typeof u.roles[0] === "object"
                    ? String((u.roles[0] as { name?: string; code?: string }).name ?? (u.roles[0] as { code?: string }).code ?? "—")
                    : String(u.roles[0])
                  : String(u.role ?? u.primaryRole ?? "—")),
              ),
              status: String(u.status ?? (u.active === false ? "Inactive" : "Active")),
              lastLogin: String(u.lastLoginAt ?? u.lastLogin ?? "—"),
            })),
          );
        }
        const rolesList = Array.isArray(rolesRes)
          ? rolesRes
          : rolesRes && typeof rolesRes === "object" && "content" in rolesRes && Array.isArray((rolesRes as { content: unknown }).content)
            ? (rolesRes as { content: Record<string, unknown>[] }).content
            : [];
        if (rolesList.length) {
          const codes = rolesList
            .map((r) => String((r as Record<string, unknown>).name ?? (r as Record<string, unknown>).code ?? ""))
            .filter(Boolean);
          if (codes.length) setRoleOptions(codes);
        }
      } catch (e) {
        if (!cancelled) setIamError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "IAM load failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    const source = apiRows ?? ROWS;
    return source.filter((r) => (status && status !== "All" ? r.status === status : true));
  }, [status, apiRows]);

  return (
    <div className="um">
      <h1>User Management</h1>
      {iamError ? <p className="um-error" role="alert">{iamError}</p> : null}

      <div className="um-filters">
        <label className="um-field">
          <span>Role</span>
          <div className="um-select">
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {roleOptions.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="um-field">
          <span>Status</span>
          <div className="um-select">
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {USER_STATUSES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <div className="um-field um-field--range">
          <span>Last Login</span>
          <div className="um-range">
            <span>From</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <span>To</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="um-actions">
        <button type="button" className="um-btn um-btn--primary" onClick={() => setModal({ kind: "add" })}>
          +Add New User
        </button>
        <div className="um-settings-links">
          <Link to="/settings/roles" className="um-role-link">
            Role Management
          </Link>
          <Link to="/settings/products" className="um-role-link">
            Product Setup
          </Link>
        </div>
      </div>

      <div className="um-table-wrap">
        <table className="um-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Full Name</th>
              <th>User Name</th>
              <th>Email Address</th>
              <th>
                Role <ChevronDown />
              </th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={`${row.id}-${i}`}>
                <td>{row.id}</td>
                <td>{row.fullName}</td>
                <td>{row.userName}</td>
                <td>{row.email}</td>
                <td>{row.role}</td>
                <td>{row.status}</td>
                <td>{row.lastLogin}</td>
                <td>
                  <div className="um-row-actions">
                    <button type="button" onClick={() => setModal({ kind: "view", row })}>View</button>
                    <span aria-hidden>·</span>
                    <button type="button" onClick={() => setModal({ kind: "edit", row })}>Edit</button>
                    <span aria-hidden>·</span>
                    <button type="button" className="is-danger" onClick={() => setModal({ kind: "disable", row })}>Disable</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal?.kind === "add" || modal?.kind === "edit" ? (
        <AddUserModal
          mode={modal.kind}
          initial={modal.kind === "edit" ? modal.row : undefined}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal?.kind === "view" ? (
        <ViewDetailsModal
          title="View User"
          fields={[
            { label: "User ID", value: modal.row.id },
            { label: "Full Name", value: modal.row.fullName },
            { label: "Username", value: modal.row.userName },
            { label: "Email", value: modal.row.email },
            { label: "Role", value: modal.row.role },
            { label: "Status", value: modal.row.status },
            { label: "Last Login", value: modal.row.lastLogin, date: true },
          ]}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal?.kind === "disable" ? (
        <ConfirmActionModal
          title="Disable User ?"
          message={`Do you want to disable ${modal.row.userName}?`}
          tone="danger"
          confirmLabel="YES"
          onConfirm={() => {
            void (async () => {
              try {
                await disableIamUser(modal.row.id, "Disabled from user management UI");
                setModal(null);
                setApiRows((prev) =>
                  (prev ?? []).map((r) => (r.id === modal.row.id ? { ...r, status: "Disabled" } : r)),
                );
              } catch (e) {
                setIamError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Disable failed");
                setModal(null);
              }
            })();
          }}
          onClose={() => setModal(null)}
        />
      ) : null}
    </div>
  );
}

function AddUserModal({
  onClose,
  mode = "add",
  initial,
}: {
  onClose: () => void;
  mode?: "add" | "edit";
  initial?: UserRow;
}) {
  const [fullName, setFullName] = useState(initial?.fullName ?? "Akinola Oluwole Dada");
  const [username, setUsername] = useState(initial?.userName ?? "Akinola1234");
  const [email, setEmail] = useState(initial?.email ?? "akinola@b247.com");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveUser() {
    setBusy(true);
    setError(null);
    try {
      const parts = fullName.trim().split(/\s+/);
      const firstName = parts[0] || "Staff";
      const lastName = parts.slice(1).join(" ") || "User";
      const created = await createIamUser({
        username: username.trim(),
        email: email.trim(),
        firstName,
        lastName,
        mfaRequired: false,
      }) as { id?: string };
      if (created?.id) {
        try { await submitIamUserCreate(created.id); } catch { /* maker */ }
        try { await applyIamUserCreate(created.id); } catch { /* checker */ }
      }
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Create user failed");
    } finally {
      setBusy(false);
    }
  }

  const [role, setRole] = useState<string>(initial?.role ?? "Admin");
  const [password, setPassword] = useState("********");
  const [confirm, setConfirm] = useState("*******");
  const [active, setActive] = useState((initial?.status ?? "Active") === "Active");

  return (
    <div className="um-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="um-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-user-title"
        onClick={(e) => e.stopPropagation()}
      >
        {error ? <p role="alert">{error}</p> : null}
        <header className="um-modal-head">
          <div>
            <h2 id="add-user-title">{mode === "edit" ? "Edit User" : "Add New User"}</h2>
            <h3>User Details</h3>
          </div>
          <button type="button" className="um-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="um-modal-grid">
          <label className="um-field">
            <span>Full Name</span>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </label>
          <label className="um-field">
            <span>Username</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          <label className="um-field">
            <span>Email Address</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <div className="um-field">
            <span>Role</span>
            <FilterDropdown
              aria-label="Role"
              className="um-fdrop"
              triggerClassName="um-fdrop-trigger"
              options={STAFF_ROLES}
              value={role}
              onSelect={setRole}
              trigger={
                <>
                  <span>{role}</span>
                  <ChevronDown />
                </>
              }
            />
          </div>
          <label className="um-field">
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <label className="um-field">
            <span>Confirm Password</span>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </label>
        </div>

        <div className="um-status-row">
          <span>Status</span>
          <button
            type="button"
            className={`um-toggle${active ? " is-on" : ""}`}
            onClick={() => setActive((v) => !v)}
            aria-pressed={active}
          >
            <span />
          </button>
        </div>

        <footer className="um-modal-foot">
          <button type="button" className="um-btn um-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <div className="um-modal-foot-right">
            <button type="button" className="um-btn um-btn--outline" onClick={onClose}>
              Post
            </button>
            <button type="button" className="um-btn um-btn--primary" disabled={busy} onClick={() => void saveUser()}>
              {busy ? "Saving…" : mode === "edit" ? "Save" : "Add User"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function RoleManagementPage() {
  const [roleName, setRoleName] = useState("Finance Officer");
  const [description, setDescription] = useState("Finance Officer");
  const [permOpen, setPermOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(["gl.read", "ledger.read", "report.read"]);
  const [catalog, setCatalog] = useState<string[]>(IAM_PERMISSION_CATALOG as unknown as string[]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listIamPermissions();
        const list = Array.isArray(res)
          ? res
          : res && typeof res === "object" && "content" in res
            ? (res as { content: Record<string, unknown>[] }).content
            : [];
        const codes = (list as Record<string, unknown>[])
          .map((p) => String(p.code ?? p.permissionCode ?? ""))
          .filter(Boolean);
        if (!cancelled && codes.length) setCatalog(codes);
      } catch { /* keep static catalog */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const togglePerm = (code: string) => {
    setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  async function saveRole() {
    setBusy(true);
    setMsg(null);
    try {
      const code = roleName.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_").slice(0, 40) || "ROLE";
      const created = await createIamRole({
        code,
        name: roleName.trim(),
        description: description.trim() || undefined,
        riskLevel: "MEDIUM",
        permissionCodes: selected,
      }) as { id?: string };
      const id = created?.id;
      if (id) {
        try { await submitIamRole(id); } catch { /* maker step */ }
        try { await applyIamRole(id); } catch { /* checker may be separate */ }
      }
      setMsg(`Role ${roleName} saved`);
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="um rm">
      <h1>Role Management</h1>
      {msg ? <p role="alert">{msg}</p> : null}
      <button type="button" className="um-btn um-btn--primary rm-add" disabled={busy} onClick={() => void saveRole()}>
        + Add Role
      </button>

      <section className="rm-card">
        <h2>Role Details</h2>
        <label className="um-field">
          <span>Role Name</span>
          <input value={roleName} onChange={(e) => setRoleName(e.target.value)} />
        </label>
        <label className="um-field">
          <span>Description</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <div className="um-field">
          <span>Permissions</span>
          <button
            type="button"
            className="um-fdrop-trigger rm-perm-trigger"
            onClick={() => setPermOpen((v) => !v)}
          >
            <span>{selected.length ? `${selected.length} selected` : "Permissions"}</span>
            <ChevronDown />
          </button>
          {permOpen ? (
            <ul className="rm-perm-menu">
              {catalog.map((code) => (
                <li key={code}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selected.includes(code)}
                      onChange={() => togglePerm(code)}
                    />
                    {code}
                  </label>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="rm-perm-box">
          {selected.length ? (
            <ul>
              {selected.map((code) => (
                <li key={code}>{code}</li>
              ))}
            </ul>
          ) : (
            <p>Select catalog permissions to bundle into this role.</p>
          )}
        </div>

        <footer className="rm-foot">
          <Link to="/settings/users" className="um-btn um-btn--ghost">
            Cancel
          </Link>
          <button type="button" className="um-btn um-btn--primary" disabled={busy} onClick={() => void saveRole()}>
            {busy ? "Saving…" : "Add Role"}
          </button>
        </footer>
      </section>
    </div>
  );
}

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
