import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FilterDropdown } from "../components/FilterDropdown";
import { IAM_PERMISSION_CATALOG, STAFF_ROLES, USER_STATUSES } from "../data/iamOptions";
import "./UserManagementPage.css";

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
  const [modalOpen, setModalOpen] = useState(false);

  const rows = useMemo(() => {
    return ROWS.filter((r) => (status ? r.status === status : true));
  }, [status]);

  return (
    <div className="um">
      <h1>User Management</h1>

      <div className="um-filters">
        <label className="um-field">
          <span>Role</span>
          <div className="um-select">
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {STAFF_ROLES.map((o) => (
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
        <button type="button" className="um-btn um-btn--primary" onClick={() => setModalOpen(true)}>
          +Add New User
        </button>
        <Link to="/settings/roles" className="um-role-link">
          Role Management
        </Link>
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
                    <button type="button">View</button>
                    <span aria-hidden>·</span>
                    <button type="button">Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen ? <AddUserModal onClose={() => setModalOpen(false)} /> : null}
    </div>
  );
}

function AddUserModal({ onClose }: { onClose: () => void }) {
  const [fullName, setFullName] = useState("Akinola Oluwole Dada");
  const [username, setUsername] = useState("Akinola1234");
  const [email, setEmail] = useState("akinola@b247.com");
  const [role, setRole] = useState<string>("Admin");
  const [password, setPassword] = useState("********");
  const [confirm, setConfirm] = useState("*******");
  const [active, setActive] = useState(true);

  return (
    <div className="um-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="um-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-user-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="um-modal-head">
          <div>
            <h2 id="add-user-title">Add New User</h2>
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
            <button type="button" className="um-btn um-btn--outline">
              Post
            </button>
            <button type="button" className="um-btn um-btn--primary" onClick={onClose}>
              Add User
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

  const togglePerm = (code: string) => {
    setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  return (
    <div className="um rm">
      <h1>Role Management</h1>
      <button type="button" className="um-btn um-btn--primary rm-add">
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
              {IAM_PERMISSION_CATALOG.map((code) => (
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
          <button type="button" className="um-btn um-btn--primary">
            Add Role
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
