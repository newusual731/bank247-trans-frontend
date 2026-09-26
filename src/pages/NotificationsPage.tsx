import { useMemo, useRef, useState } from "react";
import "./NotificationsPage.css";

type NotifStatus = "Unread" | "Read";
type NotifType = "Approval" | "Till" | "Transfer" | "System" | "Security";

type NotificationRow = {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  channel: "In-app" | "Email" | "SMS";
  status: NotifStatus;
  when: string;
};

const SEED: NotificationRow[] = [
  {
    id: "N-1001",
    type: "Approval",
    title: "Cash withdrawal pending approval",
    message: "Withdrawal ₦250,000 on till 637373 awaits checker authorisation.",
    channel: "In-app",
    status: "Unread",
    when: "Sep 26, 2026 · 09:14",
  },
  {
    id: "N-1002",
    type: "Till",
    title: "Till opened",
    message: "Till 637373 (Ikeja Top) opened by Sam Kola.",
    channel: "In-app",
    status: "Unread",
    when: "Sep 26, 2026 · 08:02",
  },
  {
    id: "N-1003",
    type: "Transfer",
    title: "FT posting completed",
    message: "Fixed transfer FT-88421 posted successfully to GL.",
    channel: "Email",
    status: "Read",
    when: "Sep 25, 2026 · 16:40",
  },
  {
    id: "N-1004",
    type: "Security",
    title: "New sign-in",
    message: "Successful login from Lagos branch workstation.",
    channel: "In-app",
    status: "Read",
    when: "Sep 25, 2026 · 07:55",
  },
  {
    id: "N-1005",
    type: "System",
    title: "EOD reminder",
    message: "End-of-day window opens at 18:00 for branch 232.",
    channel: "SMS",
    status: "Unread",
    when: "Sep 24, 2026 · 17:30",
  },
];

type Tab = "inbox" | "all";

/** MVP staff inbox — chrome aligned with Till Management / Enquires.png */
export function NotificationsPage() {
  const [tab, setTab] = useState<Tab>("inbox");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState(SEED);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [selected, setSelected] = useState<NotificationRow | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (tab === "inbox" && r.status !== "Unread") return false;
      if (!q) return true;
      return [r.id, r.type, r.title, r.message, r.channel, r.status]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, tab, query]);

  const unreadCount = rows.filter((r) => r.status === "Unread").length;

  const markRead = (id: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Read" } : r)));
    setMenuFor(null);
  };

  const markAllRead = () => {
    setRows((prev) => prev.map((r) => ({ ...r, status: "Read" as const })));
  };

  const openDetail = (row: NotificationRow) => {
    setSelected(row);
    if (row.status === "Unread") markRead(row.id);
    setMenuFor(null);
  };

  return (
    <div className="nfp">
      <div className="nfp-panel">
        <div className="nfp-head">
          <div>
            <h1>Notifications</h1>
            <p className="nfp-sub">
              {unreadCount > 0 ? `${unreadCount} unread` : "You are up to date"}
            </p>
          </div>
          <button type="button" className="nfp-mark-all" onClick={markAllRead} disabled={unreadCount === 0}>
            Mark all as read
          </button>
        </div>

        <label className="nfp-search">
          <SearchIcon />
          <input
            type="search"
            placeholder="Search by title, type, or channel"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <div className="nfp-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "inbox"}
            className={tab === "inbox" ? "is-active" : undefined}
            onClick={() => setTab("inbox")}
          >
            Inbox{unreadCount > 0 ? ` (${unreadCount})` : ""}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "all"}
            className={tab === "all" ? "is-active" : undefined}
            onClick={() => setTab("all")}
          >
            All
          </button>
        </div>

        <div className="nfp-table-wrap">
          <table className="nfp-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Message</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Date</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="nfp-empty">
                    No notifications match this view.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className={r.status === "Unread" ? "is-unread" : undefined}>
                    <td>
                      <span className={`nfp-type is-${r.type.toLowerCase()}`}>{r.type}</span>
                    </td>
                    <td>
                      <button type="button" className="nfp-msg" onClick={() => openDetail(r)}>
                        <strong>{r.title}</strong>
                        <span>{r.message}</span>
                      </button>
                    </td>
                    <td>{r.channel}</td>
                    <td>
                      <span className={`nfp-badge is-${r.status.toLowerCase()}`}>{r.status}</span>
                    </td>
                    <td>{r.when}</td>
                    <td className="nfp-actions">
                      <button
                        type="button"
                        className="nfp-more"
                        aria-label={`Actions for ${r.id}`}
                        onClick={() => setMenuFor((cur) => (cur === r.id ? null : r.id))}
                      >
                        ⋯
                      </button>
                      {menuFor === r.id ? (
                        <div className="nfp-menu" ref={menuRef} role="menu">
                          <button type="button" role="menuitem" onClick={() => openDetail(r)}>
                            View
                          </button>
                          {r.status === "Unread" ? (
                            <button type="button" role="menuitem" onClick={() => markRead(r.id)}>
                              Mark as read
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected ? (
        <div className="nfp-drawer-backdrop" onClick={() => setSelected(null)} role="presentation">
          <aside
            className="nfp-drawer"
            role="dialog"
            aria-labelledby="nfp-drawer-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="nfp-drawer-head">
              <h2 id="nfp-drawer-title">{selected.title}</h2>
              <button type="button" className="nfp-drawer-close" aria-label="Close" onClick={() => setSelected(null)}>
                ×
              </button>
            </div>
            <dl className="nfp-drawer-meta">
              <div>
                <dt>Reference</dt>
                <dd>{selected.id}</dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>{selected.type}</dd>
              </div>
              <div>
                <dt>Channel</dt>
                <dd>{selected.channel}</dd>
              </div>
              <div>
                <dt>When</dt>
                <dd>{selected.when}</dd>
              </div>
            </dl>
            <p className="nfp-drawer-body">{selected.message}</p>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
