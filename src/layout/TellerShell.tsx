import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatedOutlet } from "../components/AnimatedOutlet";
import { useProfileAvatar } from "../hooks/useProfileAvatar";
import "./TellerShell.css";

type TellerNavItem = {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
  match?: string;
  matchAny?: readonly string[];
};

/** Create Individual 2 sidebar order (Mail Module Page in slot 4). */
const TELLER_NAV: readonly TellerNavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: "dash", end: true },
  { to: "/teller", label: "Teller Module", icon: "teller", end: true },
  { to: "/teller/currency-exchange", label: "Currency Exchange", icon: "fx" },
  { to: "/teller/cash/mail", label: "Mail Module Page", icon: "mail", end: true },
  {
    to: "/teller/deposits/lcy",
    label: "Boxed cash Deposit",
    icon: "deposit",
    matchAny: ["/teller/deposits/lcy", "/teller/deposits/fcy"],
  },
  { to: "/teller/enquiries", label: "Enquires", icon: "enq", end: true },
  { to: "/teller/tills", label: "Till Administration", icon: "till", match: "/teller/tills" },
  { to: "/teller/deposits/transaction", label: "Deposit Transaction", icon: "deposit2" },
  { to: "/teller/enquiries/image", label: "Image Enquires", icon: "image" },
  { to: "/teller/enquiries/account", label: "General Account Enq", icon: "acct" },
  { to: "/teller/enquiries/customer", label: "Customer Enquiries", icon: "cust" },
];

function isNavActive(item: TellerNavItem, pathname: string, isActive: boolean) {
  if (item.matchAny?.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  if (item.match && pathname.startsWith(item.match)) {
    return true;
  }
  return isActive;
}

export function TellerShell() {
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
    <div className={`tshell${navOpen ? " is-nav-open" : ""}`}>
      {navOpen ? (
        <button
          type="button"
          className="tshell-nav-scrim"
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
        />
      ) : null}
      <aside className="tshell-sidebar" id="tshell-sidebar">
        <div className="tshell-sidebar-top">
          <strong className="tshell-brand">Teller</strong>
          <button
            type="button"
            className="tshell-nav-close"
            aria-label="Close menu"
            onClick={() => setNavOpen(false)}
          >
            ×
          </button>
        </div>
        <nav className="tshell-nav" aria-label="Teller">
          {TELLER_NAV.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end ?? false}
              className={({ isActive }) =>
                `tshell-nav-item${isNavActive(item, location.pathname, isActive) ? " is-active" : ""}`
              }
            >
              <span className="tshell-nav-icon" aria-hidden>
                <TellerNavIcon name={item.icon} />
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="tshell-foot">
          <NavLink
            to="/notifications"
            className={({ isActive }) => `tshell-nav-item${isActive ? " is-active" : ""}`}
          >
            <span className="tshell-nav-icon" aria-hidden>
              <TellerNavIcon name="bell" />
            </span>
            <span>Notifications</span>
          </NavLink>
          <div className="tshell-user">
            <button
              type="button"
              className="tshell-user-btn"
              onClick={() => navigate("/profile")}
              aria-label="Open profile"
            >
              <div className="tshell-avatar" aria-hidden>
                {avatarUrl ? <img src={avatarUrl} alt="" /> : null}
              </div>
              <div className="tshell-user-meta">
                <strong>Sam Kola</strong>
                <span>Owner</span>
              </div>
            </button>
            <button
              type="button"
              className="tshell-logout"
              aria-label="Log out"
              onClick={() => navigate("/login")}
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>

      <div className="tshell-main">
        <header className="tshell-topbar">
          <button
            type="button"
            className="tshell-menu-btn"
            aria-label="Open menu"
            aria-expanded={navOpen}
            aria-controls="tshell-sidebar"
            onClick={() => setNavOpen(true)}
          >
            <TellerMenuIcon />
          </button>
          <span className="tshell-topbar-title">Teller Module</span>
        </header>
        <div className="tshell-content">
          <AnimatedOutlet />
        </div>
      </div>
    </div>
  );
}

function TellerMenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function TellerNavIcon({ name }: { name: string }) {
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
    case "teller":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M5 19c1.5-3 4-4.5 7-4.5S17.5 16 19 19"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "fx":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="15" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 8v8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "mail":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3.5 8l8.5 6 8.5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "transfer":
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
    case "deposit":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 9h16l-1.5 10H5.5L4 9zM8 9V7a4 4 0 018 0v2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "deposit2":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="10" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M4.5 19c1.2-2.8 3.4-4.2 5.5-4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M16 11v6M13 14h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "enq":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M7 3.5h7l4 4V20a1.5 1.5 0 01-1.5 1.5H7A1.5 1.5 0 015.5 20V5A1.5 1.5 0 017 3.5z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "image":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="9.5" cy="10" r="1.8" stroke="currentColor" strokeWidth="1.4" />
          <path d="M5.5 17l4-3.5 3 2.5 3.5-4 2.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      );
    case "acct":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M12 4v2.2M12 17.8V20M4 12h2.2M17.8 12H20M6.4 6.4l1.6 1.6M16 16l1.6 1.6M17.6 6.4L16 8M8 16l-1.6 1.6"
            stroke="currentColor"
            strokeWidth="1.45"
            strokeLinecap="round"
          />
        </svg>
      );
    case "cust":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 8v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="16.2" r="1" fill="currentColor" />
        </svg>
      );
    case "till":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="10" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M4.5 19c1.2-2.8 3.4-4.2 5.5-4.2S14.3 16.2 15.5 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="18" cy="16" r="2.6" stroke="currentColor" strokeWidth="1.4" />
          <path d="M18 14.8v2.4M16.8 16h2.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "bell":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M6 16V10a6 6 0 1112 0v6l1.5 2H4.5L6 16z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M10 20a2 2 0 004 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M10 7V5a2 2 0 012-2h7v18h-7a2 2 0 01-2-2v-2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M4 12h10M11 9l3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
