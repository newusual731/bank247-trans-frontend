import { useEffect, useMemo, useRef, useState } from "react";
import {
  activateTill,
  getTill,
  getTillDenominations,
  getTillEntries,
  getTillPositions,
  getMyTillPositions,
  requestTillClosure,
  requestTillReopen,
} from "../../api/teller";
import { ApiError } from "../../lib/apiClient";
import { useNavigate } from "react-router-dom";
import { ClosingTillConfirm, TellerConfirmModal } from "../../components/teller/TellerConfirmModals";
import "./TillManagementPage.css";

type SummaryRow = {
  id: string;
  branch: string;
  type: string;
  name: string;
  status: "Active" | "Pending" | "Deactivate";
  created: string;
};

type TillRow = {
  id: string;
  name: string;
  account: string;
  currency: string;
  opened: string;
  status: "Active" | "Pending" | "Deactivate";
  lastTxn: string;
};

const SUMMARY: SummaryRow[] = [
  {
    id: "637373",
    branch: "232-Ikeja Top",
    type: "736376273",
    name: "Sam Kola",
    status: "Active",
    created: "July 10, 2022",
  },
];

/** Enquires.png sample rows */
const TILLS: TillRow[] = [
  {
    id: "637373",
    name: "Tella 1",
    account: "736376273",
    currency: "Ikeja Top",
    opened: "July 10, 2022",
    status: "Active",
    lastTxn: "July 10, 2022",
  },
  {
    id: "637373",
    name: "Tella 1",
    account: "736376273",
    currency: "Ikeja Top",
    opened: "July 10, 2022",
    status: "Pending",
    lastTxn: "July 10, 2022",
  },
  {
    id: "637373",
    name: "Tella 1",
    account: "736376273",
    currency: "Ikeja Top",
    opened: "July 10, 2022",
    status: "Active",
    lastTxn: "July 10, 2022",
  },
  {
    id: "637373",
    name: "Tella 1",
    account: "736376273",
    currency: "Ikeja Top",
    opened: "July 10, 2022",
    status: "Deactivate",
    lastTxn: "July 10, 2022",
  },
];

type MenuAction = "view" | "update" | "reactivate" | "suspend" | "close" | null;

/** Enquires.png — Till Management */
export function TillManagementPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [menuFor, setMenuFor] = useState<number | null>(null);
  const [action, setAction] = useState<MenuAction>(null);
  const [selected, setSelected] = useState<TillRow | null>(null);
  const [apiTills, setApiTills] = useState<TillRow[] | null>(null);
  const [apiSummary, setApiSummary] = useState<SummaryRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let res: unknown;
        try {
          res = await getTillPositions();
        } catch {
          res = await getMyTillPositions();
        }
        if (cancelled) return;
        const content = Array.isArray(res)
          ? res
          : res && typeof res === "object" && "content" in res && Array.isArray((res as { content: unknown }).content)
            ? (res as { content: Record<string, unknown>[] }).content
            : res && typeof res === "object" && "positions" in res && Array.isArray((res as { positions: unknown }).positions)
              ? (res as { positions: Record<string, unknown>[] }).positions
              : [];
        if (!content.length) return;
        const mapped: TillRow[] = content.map((p, i) => {
          const statusRaw = String(p.status ?? "Active");
          const status: TillRow["status"] =
            statusRaw.toUpperCase().includes("PEND")
              ? "Pending"
              : statusRaw.toUpperCase().includes("CLOSE") || statusRaw.toUpperCase().includes("DEACT")
                ? "Deactivate"
                : "Active";
          return {
            id: String(p.tellerId ?? p.tillId ?? p.id ?? `T-${i}`),
            name: String(p.tellerName ?? p.name ?? p.tillName ?? "—"),
            account: String(p.accountNumber ?? p.tillAccount ?? p.glAccount ?? "—"),
            currency: String(p.currency ?? p.branchName ?? "—"),
            opened: String(p.openedAt ?? p.createdAt ?? p.dateOpened ?? "—"),
            status,
            lastTxn: String(p.lastTransactionAt ?? p.lastTxnAt ?? p.updatedAt ?? "—"),
          };
        });
        setApiTills(mapped);
        setApiSummary(
          mapped.slice(0, 5).map((t) => ({
            id: t.id,
            branch: String((content[0] as Record<string, unknown>)?.branchName ?? (content[0] as Record<string, unknown>)?.branchCode ?? "—"),
            type: t.account,
            name: t.name,
            status: t.status,
            created: t.opened,
          })),
        );
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Load failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const tills = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = apiTills ?? TILLS;
    return source.filter(
      (r) =>
        !q ||
        r.id.includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.account.toLowerCase().includes(q),
    );
  }, [query, apiTills]);

  const runAction = (kind: MenuAction, row: TillRow, index: number) => {
    setMenuFor(null);
    setSelected(row);
    if (kind === "update") {
      navigate("/teller/tills/create?step=create");
      return;
    }
    if (kind === "reactivate") {
      void (async () => {
        try {
          await activateTill(row.id);
          window.alert(`Till ${row.id} activated`);
        } catch {
          try {
            await requestTillReopen(row.id, { reason: "Reopen from Till Management" });
            window.alert(`Till ${row.id} reopen requested`);
          } catch {
            navigate("/teller/tills/reopen");
          }
        }
      })();
      return;
    }
    if (kind === "close") {
      void (async () => {
        try {
          await requestTillClosure(row.id, { reason: "Closed from Till Management" });
        } catch {
          /* fall through to page */
        }
        navigate("/teller/tills/close");
      })();
      return;
    }
    if (kind === "view") {
      void (async () => {
        try {
          const [till, entries, dens] = await Promise.all([
            getTill(row.id),
            getTillEntries(row.id).catch(() => null),
            getTillDenominations(row.id).catch(() => null),
          ]);
          window.alert(
            `Till ${row.id}\n` +
              JSON.stringify({ till, entries, denominations: dens }, null, 2).slice(0, 1500),
          );
        } catch (e) {
          window.alert(e instanceof Error ? e.message : "Till lookup failed");
        }
      })();
    }
    setAction(kind);
    void index;
  };

  return (
    <div className="tmp">
      <div className="tmp-panel">
        <h1>Till Management</h1>
        {loadError ? <p role="alert">{loadError}</p> : null}

        <label className="tmp-search">
          <SearchIcon />
          <input
            type="search"
            placeholder="Search by name, ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <div className="tmp-summary">
          <table>
            <thead>
              <tr>
                <th>Tella ID</th>
                <th>Branch Name</th>
                <th>Tella type</th>
                <th>Tella Name</th>
                <th>Status</th>
                <th>Date Created</th>
              </tr>
            </thead>
            <tbody>
              {(apiSummary ?? SUMMARY).map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.branch}</td>
                  <td>{r.type}</td>
                  <td>{r.name}</td>
                  <td>
                    <span className={`tmp-pill is-${r.status.toLowerCase()}`}>{r.status}</span>
                  </td>
                  <td>{r.created}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="tmp-branch">
          <span>
            <strong>Branch Code: 232</strong>
          </span>
          <span>
            <strong>Branch Name: ikeja Top</strong>
          </span>
        </div>

        <div className="tmp-table-wrap">
          <table className="tmp-table">
            <thead>
              <tr>
                <th>Teller ID</th>
                <th>Tella Name</th>
                <th>Till Account</th>
                <th>Currency</th>
                <th>Date Opened</th>
                <th>Status</th>
                <th>Date of last Transaction</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {tills.map((r, i) => (
                <tr key={`${r.id}-${r.status}-${i}`}>
                  <td>{r.id}</td>
                  <td>{r.name}</td>
                  <td>{r.account}</td>
                  <td>{r.currency}</td>
                  <td>{r.opened}</td>
                  <td>
                    <span className={`tmp-pill is-${r.status.toLowerCase()}`}>{r.status}</span>
                  </td>
                  <td>{r.lastTxn}</td>
                  <TillRowActions
                    open={menuFor === i}
                    onToggle={() => setMenuFor((cur) => (cur === i ? null : i))}
                    onClose={() => setMenuFor(null)}
                    onSelect={(kind) => runAction(kind, r, i)}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {action === "view" && selected ? (
        <TellerConfirmModal
          title="View Till"
          message={`"Till ${selected.id} — ${selected.name} / ${selected.account}"`}
          yesLabel="OK"
          noLabel="CLOSE"
          onYes={() => setAction(null)}
          onNo={() => setAction(null)}
          dangerNo={false}
        />
      ) : null}

      {action === "suspend" && selected ? (
        <ClosingTillConfirm
          title="Suspend Till ?"
          message={`"Do you want to suspend Till ${selected.id}"`}
          onYes={() => setAction(null)}
          onNo={() => setAction(null)}
        />
      ) : null}
    </div>
  );
}

function TillRowActions({
  open,
  onToggle,
  onClose,
  onSelect,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSelect: (kind: Exclude<MenuAction, null>) => void;
}) {
  const rootRef = useRef<HTMLTableCellElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <td className="tmp-actions-cell" ref={rootRef} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="tmp-more"
        aria-label="Actions"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={onToggle}
      >
        ⋯
      </button>
      {open ? (
        <div className="tmp-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => onSelect("view")}>
            View Till
          </button>
          <button type="button" role="menuitem" onClick={() => onSelect("update")}>
            Update Till
          </button>
          <button type="button" role="menuitem" onClick={() => onSelect("reactivate")}>
            Reactivate Till
          </button>
          <button type="button" role="menuitem" className="is-warn" onClick={() => onSelect("suspend")}>
            Suspend Till
          </button>
          <button type="button" role="menuitem" className="is-danger" onClick={() => onSelect("close")}>
            Close Till
          </button>
        </div>
      ) : null}
    </td>
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
