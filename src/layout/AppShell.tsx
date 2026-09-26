import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatedOutlet } from "../components/AnimatedOutlet";
import { useProfileAvatar } from "../hooks/useProfileAvatar";
import "./AppShell.css";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: "dash" },
  { to: "/accounts", label: "Accounts", icon: "accounts" },
  { to: "/transactions", label: "Transactions", icon: "tx", matchPrefix: "/transactions" },
  { to: "/gl", label: "General Ledger", icon: "gl" },
  { to: "/contracts/balances", label: "Contracts Products", icon: "contracts", matchPrefix: "/contracts" },
  { to: "/reporting", label: "Reports", icon: "reports", matchPrefix: "/report" },
  { to: "/teller", label: "Teller", icon: "tx", matchPrefix: "/teller" },
  { to: "/settings/users", label: "Settings", icon: "settings", matchPrefix: "/settings" },
] as const;

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const { avatarUrl } = useProfileAvatar();

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  return (
    <div className={`shell${navOpen ? " is-nav-open" : ""}`}>
      {navOpen ? (
        <button
          type="button"
          className="shell-nav-scrim"
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
        />
      ) : null}
      <aside className="shell-sidebar" id="shell-sidebar">
        <div className="shell-sidebar-top">
          <strong className="shell-brand">Bank247</strong>
          <button
            type="button"
            className="shell-nav-close"
            aria-label="Close menu"
            onClick={() => setNavOpen(false)}
          >
            ×
          </button>
        </div>
        <nav className="shell-nav" aria-label="Main">
          {NAV.map((item) => {
            const prefixActive =
              "matchPrefix" in item && location.pathname.startsWith(item.matchPrefix);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `shell-nav-item${isActive || prefixActive ? " is-active" : ""}`
                }
              >
                <span className="shell-nav-icon" aria-hidden>
                  <NavIcon name={item.icon} />
                </span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="shell-sidebar-foot">
          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `shell-nav-item${isActive ? " is-active" : ""}`
            }
          >
            <span className="shell-nav-icon" aria-hidden>
              <NavIcon name="bell" />
            </span>
            <span>Notifications</span>
          </NavLink>

          <div className="shell-user">
            <button
              type="button"
              className="shell-user-btn"
              onClick={() => navigate("/profile")}
              aria-label="Open profile"
            >
              <div className="shell-avatar" aria-hidden>
                {avatarUrl ? <img src={avatarUrl} alt="" /> : null}
              </div>
              <div className="shell-user-meta">
                <strong>Sam Kola</strong>
                <span>Owner</span>
              </div>
            </button>
            <button
              type="button"
              className="shell-logout"
              aria-label="Log out"
              onClick={() => navigate("/login")}
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>

      <div className="shell-main">
        <header className="shell-topbar">
          <button
            type="button"
            className="shell-menu-btn"
            aria-label="Open menu"
            aria-expanded={navOpen}
            aria-controls="shell-sidebar"
            onClick={() => setNavOpen(true)}
          >
            <MenuIcon />
          </button>
          <label className="shell-search">
            <SearchIcon />
            <input type="search" placeholder="Search..." />
          </label>
          <div className="shell-top-actions">
            <button
              type="button"
              className="shell-icon-btn"
              aria-label="Notifications"
              onClick={() => navigate("/notifications")}
            >
              <BellOutlineIcon />
            </button>
            <button type="button" className="shell-icon-btn" aria-label="Messages" onClick={() => navigate("/notifications")}>
              <MailIcon />
            </button>
            <button
              type="button"
              className="shell-user-menu"
              onClick={() => navigate("/profile")}
            >
              Sam Kola
              <ChevronIcon />
            </button>
          </div>
        </header>
        <div className="shell-content">
          <AnimatedOutlet />
        </div>
      </div>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function NavIcon({ name }: { name: string }) {
  switch (name) {
    case "dash":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "accounts":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3 10h18" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="16.5" cy="14.5" r="1.4" fill="currentColor" />
        </svg>
      );
    case "tx":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M7 7h11M18 7l-3-3M18 7l-3 3M17 17H6M6 17l3-3M6 17l3 3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "gl":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M7 3h8l4 4v14H7V3z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M15 3v4h4M10 12h6M10 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "contracts":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3 12h18M12 4a12 12 0 010 16M12 4a12 12 0 000 16" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
    case "reports":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M9 8h6M9 12h6M9 16h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "settings":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M12 3v2.2M12 18.8V21M4.9 6.5l1.6 1.5M17.5 16l1.6 1.5M3 12h2.2M18.8 12H21M4.9 17.5l1.6-1.5M17.5 8l1.6-1.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "bell":
      return <BellOutlineIcon />;
    default:
      return null;
  }
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function BellOutlineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9.5a6 6 0 1112 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13.5 6 9.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M10 18.5a2 2 0 004 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 5H6a2 2 0 00-2 2v10a2 2 0 002 2h4M15 16l4-4-4-4M19 12H10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
