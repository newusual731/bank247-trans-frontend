import { Link, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { permissionForPath } from "./permissions";

export function RequirePermission({ children }: { children: React.ReactNode }) {
  const { ready, username, hasPermission, logout } = useAuth();
  const location = useLocation();
  const required = permissionForPath(location.pathname);

  if (!ready) {
    return (
      <div style={{ maxWidth: 560, margin: "12vh auto", padding: "2rem", textAlign: "center", color: "#6b7280" }}>
        Checking your access…
      </div>
    );
  }

  if (required && !hasPermission(required)) {
    return (
      <div style={{ maxWidth: 560, margin: "12vh auto", padding: "2rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.4rem", marginBottom: "0.75rem" }}>No access to this area</h1>
        <p style={{ color: "#6b7280", lineHeight: 1.6 }}>
          {username || "Your account"} doesn&apos;t have access to this screen.
          If you need it, ask your access administrator to add it to your role.
        </p>
        <p style={{ marginTop: "1.25rem", display: "flex", gap: "1.25rem", justifyContent: "center" }}>
          <Link to="/dashboard">Go to your home page</Link>
          <button type="button" onClick={logout} style={signOutStyle}>
            Sign out
          </button>
        </p>
      </div>
    );
  }

  return children;
}

const signOutStyle = {
  background: "none",
  border: "none",
  padding: 0,
  color: "inherit",
  textDecoration: "none",
  cursor: "pointer",
  font: "inherit",
};
