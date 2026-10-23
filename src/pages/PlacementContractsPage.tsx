import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ContractTypeTabs } from "../components/ContractTypeTabs";
import { FilterDropdown } from "../components/FilterDropdown";
import { CURRENCY_CODES, TABLE_OVERFLOW_ACTIONS, TENOR_MONTHS } from "../data/filterDropdownOptions";
import "./PlacementContractsPage.css";
import { listTreasuryDeals } from "../api/domain";
import { createTreasuryDeal, bookTreasuryDeal, settleTreasuryDeal, cancelTreasuryDeal } from "../api/contracts";
import { ApiError } from "../lib/apiClient";
import { formatTxnDate, formatTxnMoney } from "../api/transactions";
import { ViewDetailsModal } from "../components/feedback/ViewDetailsModal";
import { ConfirmActionModal } from "../components/feedback/ConfirmActionModal";
import { useActionFeedback } from "../components/feedback/useActionFeedback";

type MmDealType = "MONEY_MARKET_PLACEMENT" | "MONEY_MARKET_BORROWING";

type PlacementRow = {
  id: string;
  dealType: MmDealType | string;
  institution: string;
  currency: string;
  amount: string;
  amountNum: number;
  rate: string;
  rateNum: number;
  tenure: string;
  tenureDays: number;
  startDate: string;
  maturityDate: string;
  status: string;
  statusKey: string;
  deskCode: string;
  dealerId: string;
  tradeDateRaw: string;
  valueDateRaw: string;
  maturityDateRaw: string;
};

type ModalState =
  | { kind: "add" }
  | { kind: "view"; row: PlacementRow }
  | { kind: "rebook"; row: PlacementRow }
  | { kind: "confirm"; action: "Close" | "Cancel" | "Book"; row: PlacementRow }
  | null;

const PAGE_SIZE = 20;
const MM_TYPES: MmDealType[] = ["MONEY_MARKET_PLACEMENT", "MONEY_MARKET_BORROWING"];
const TYPE_FILTERS = ["All MM", ...MM_TYPES] as const;
const INSTITUTIONS = ["CBN", "ZENITH", "GTB", "ACCESS", "FBN", "UBA", "STANBIC", "CPTY-CBN"] as const;
const DESKS = ["MMDESK", "FXDESK", "TRSY_DESK"] as const;
const CODE_RE = /^[A-Z0-9_.-]{2,40}$/;
const SAFE_REF_RE = /^[A-Za-z0-9_.:/-]{1,120}$/;

function toList(res: unknown): Record<string, unknown>[] {
  if (Array.isArray(res)) return res as Record<string, unknown>[];
  if (res && typeof res === "object" && "content" in res && Array.isArray((res as { content: unknown }).content)) {
    return (res as { content: Record<string, unknown>[] }).content;
  }
  return [];
}

function daysBetween(from: string, to: string): number {
  if (!from || !to) return 0;
  const a = Date.parse(from);
  const b = Date.parse(to);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

function statusUi(raw: string): { label: string; key: string } {
  const u = raw.toUpperCase();
  if (u.includes("CANCEL")) return { label: "Cancelled", key: "cancelled" };
  if (u.includes("SETTLE") || u.includes("MATURE") || u.includes("CLOSED")) return { label: "Closed", key: "closed" };
  if (u.includes("BOOK") || u.includes("ACTIVE") || u.includes("APPROV") || u.includes("PENDING")) {
    return { label: u.includes("BOOK") ? "Issued" : raw, key: "issued" };
  }
  return { label: raw || "—", key: "issued" };
}

function mapDeal(item: Record<string, unknown>, i: number): PlacementRow {
  const currency = String(item.baseCurrency ?? "NGN").toUpperCase();
  const amountNum = Number(item.notionalAmount ?? item.amount ?? 0) || 0;
  const rateNum = Number(item.agreedRate ?? item.rate ?? 0) || 0;
  const valueRaw = String(item.valueDate ?? item.tradeDate ?? "");
  const matRaw = String(item.maturityDate ?? "");
  const tenureDays = daysBetween(valueRaw, matRaw);
  const statusRaw = String(item.status ?? "—");
  const ui = statusUi(statusRaw);
  return {
    id: String(item.dealReference ?? item.requestReference ?? item.id ?? `PL-${i}`),
    dealType: String(item.dealType ?? "MONEY_MARKET_PLACEMENT"),
    institution: String(item.counterpartyId ?? item.counterparty ?? "—"),
    currency,
    amount: formatTxnMoney(amountNum, currency),
    amountNum,
    rate: rateNum ? String(rateNum) : "—",
    rateNum,
    tenure: tenureDays ? String(tenureDays) : "—",
    tenureDays,
    startDate: formatTxnDate(null, valueRaw),
    maturityDate: formatTxnDate(null, matRaw),
    status: ui.label,
    statusKey: ui.key,
    deskCode: String(item.deskCode ?? ""),
    dealerId: String(item.dealerId ?? ""),
    tradeDateRaw: String(item.tradeDate ?? ""),
    valueDateRaw: valueRaw,
    maturityDateRaw: matRaw,
  };
}

function parseAmount(raw: string): number {
  const n = Number(String(raw ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function tenorDaysFromLabel(raw: string, fallback: number): number {
  const n = Number(String(raw).replace(/\D/g, ""));
  if (!n) return fallback;
  if (/day/i.test(raw)) return n;
  return Math.max(1, n * 30);
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  if (!Number.isFinite(d.getTime())) return iso;
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function isMmType(t: string): boolean {
  return t.toUpperCase().startsWith("MONEY_MARKET_");
}

export function PlacementContractsPage() {
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("All MM");
  const [tableAction, setTableAction] = useState<string>(TABLE_OVERFLOW_ACTIONS[1]);
  const [modal, setModal] = useState<ModalState>(null);
  const [allRows, setAllRows] = useState<PlacementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const { showSuccess, feedbackUi } = useActionFeedback();

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQ, typeFilter, tableAction]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const types = typeFilter === "All MM" ? MM_TYPES : ([typeFilter] as MmDealType[]);
        const pages = await Promise.all(types.map((dealType) => listTreasuryDeals({ dealType, size: 100 })));
        if (cancelled) return;
        const mapped = pages
          .flatMap((res) => toList(res))
          .map(mapDeal)
          .filter((r) => isMmType(r.dealType));
        const byId = new Map<string, PlacementRow>();
        for (const row of mapped) byId.set(row.id, row);
        setAllRows([...byId.values()]);
      } catch (e) {
        if (!cancelled) {
          setAllRows([]);
          setLoadError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Load failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [typeFilter, refreshKey]);

  const filtered = useMemo(() => {
    const q = debouncedQ.toLowerCase();
    let list = allRows;
    if (q) {
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.institution.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q) ||
          r.dealType.toLowerCase().includes(q),
      );
    }
    if (tableAction === "Clear Table") return [];
    const sorted = [...list];
    if (tableAction === "Sort By Date") {
      sorted.sort((a, b) => a.startDate.localeCompare(b.startDate));
    } else if (tableAction === "Sort By Status") {
      sorted.sort((a, b) => a.status.localeCompare(b.status));
    } else if (tableAction === "Sort By Amount") {
      sorted.sort((a, b) => a.amountNum - b.amountNum);
    }
    return sorted;
  }, [allRows, debouncedQ, tableAction]);

  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE) || 1);
  const pageSafe = Math.min(page, totalPages - 1);
  const rows = filtered.slice(pageSafe * PAGE_SIZE, pageSafe * PAGE_SIZE + PAGE_SIZE);
  const fromIdx = totalElements === 0 ? 0 : pageSafe * PAGE_SIZE + 1;
  const toIdx = Math.min((pageSafe + 1) * PAGE_SIZE, totalElements);

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="plc">
      {feedbackUi}
      <div className="plc-head">
        <div>
          <h1>Placement Contracts</h1>
          {loadError ? <p role="alert">{loadError}</p> : null}
          {actionError ? <p role="alert">{actionError}</p> : null}
          <button type="button" className="plc-add" onClick={() => setModal({ kind: "add" })}>
            +Add New Contract
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <FilterDropdown
            aria-label="Filter by money-market type"
            triggerClassName="plc-sort"
            menuAlign="end"
            options={[...TYPE_FILTERS]}
            value={typeFilter}
            onSelect={setTypeFilter}
            trigger={
              <>
                <FilterIcon /> {typeFilter === "All MM" ? "All MM" : typeFilter}
                <ChevronDown />
              </>
            }
          />
          <FilterDropdown
            aria-label="Sort placements"
            triggerClassName="plc-sort"
            menuAlign="end"
            options={TABLE_OVERFLOW_ACTIONS}
            value={tableAction}
            onSelect={(v) => {
              if (v === "Refresh Table") {
                setTableAction("Sort By Amount");
                setQuery("");
                refresh();
                return;
              }
              setTableAction(v);
            }}
            trigger={
              <>
                <FilterIcon /> {tableAction.startsWith("Sort") ? tableAction : "Sort By Amount"}
                <ChevronDown />
              </>
            }
          />
        </div>
      </div>

      <ContractTypeTabs />

      <label className="plc-search">
        <SearchIcon />
        <input
          type="search"
          placeholder="Search deal reference, institution, status…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <div className="plc-table-wrap">
        <table className="plc-table">
          <thead>
            <tr>
              <th>Placement ID</th>
              <th>Type</th>
              <th>Institution Name</th>
              <th>Amount</th>
              <th>Rate (%)</th>
              <th>Tenure (Days)</th>
              <th>Start Date</th>
              <th>Maturity Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", color: "#6b7280", padding: "1.5rem" }}>
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", color: "#6b7280", padding: "1.5rem" }}>
                  No placement deals yet. Use +Add New Contract.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.dealType === "MONEY_MARKET_BORROWING" ? "Borrowing" : "Placement"}</td>
                  <td>{row.institution}</td>
                  <td>{row.amount}</td>
                  <td>{row.rate}</td>
                  <td>{row.tenure}</td>
                  <td>{row.startDate}</td>
                  <td>{row.maturityDate}</td>
                  <td>
                    <span className={`plc-status is-${row.statusKey}`}>{row.status}</span>
                  </td>
                  <td>
                    <div className="plc-actions">
                      <button type="button" onClick={() => setModal({ kind: "view", row })}>
                        View
                      </button>
                      <span>·</span>
                      {row.statusKey === "issued" ? (
                        <>
                          <button type="button" onClick={() => setModal({ kind: "confirm", action: "Book", row })}>
                            Book
                          </button>
                          <span>·</span>
                          <button
                            type="button"
                            className="is-danger"
                            onClick={() => setModal({ kind: "confirm", action: "Close", row })}
                          >
                            Close
                          </button>
                          <span>·</span>
                          <button
                            type="button"
                            className="is-danger"
                            onClick={() => setModal({ kind: "confirm", action: "Cancel", row })}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => setModal({ kind: "rebook", row })}>
                            Rebook
                          </button>
                          <span>·</span>
                          <button
                            type="button"
                            className="is-danger"
                            onClick={() => setModal({ kind: "confirm", action: "Cancel", row })}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
        <span>
          {loading ? "…" : totalElements === 0 ? "0 results" : `${fromIdx}–${toIdx} of ${totalElements}`}
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button type="button" disabled={pageSafe <= 0 || loading} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            Previous
          </button>
          <span>
            Page {totalElements === 0 ? 0 : pageSafe + 1} of {totalElements === 0 ? 0 : totalPages}
          </span>
          <button
            type="button"
            disabled={pageSafe + 1 >= totalPages || loading || totalElements === 0}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {modal?.kind === "add" || modal?.kind === "rebook"
        ? createPortal(
            <AddPlacementModal
              mode={modal.kind === "rebook" ? "rebook" : "add"}
              initial={modal.kind === "rebook" ? modal.row : undefined}
              onClose={() => setModal(null)}
              onDone={(msg) => {
                showSuccess(msg);
                setModal(null);
                refresh();
              }}
            />,
            document.body,
          )
        : null}
      {modal?.kind === "view"
        ? createPortal(
            <ViewDetailsModal
              title="View Placement Contract"
              fields={[
                { label: "Placement ID", value: modal.row.id },
                { label: "Deal type", value: modal.row.dealType },
                { label: "Institution", value: modal.row.institution },
                { label: "Amount", value: modal.row.amount },
                { label: "Rate", value: `${modal.row.rate}%` },
                { label: "Tenure", value: modal.row.tenureDays ? `${modal.row.tenureDays} Days` : "—" },
                { label: "Desk", value: modal.row.deskCode || "—" },
                { label: "Dealer", value: modal.row.dealerId || "—" },
                { label: "Start Date", value: modal.row.startDate, date: true },
                { label: "Maturity Date", value: modal.row.maturityDate, date: true },
                { label: "Status", value: modal.row.status },
              ]}
              onClose={() => setModal(null)}
            />,
            document.body,
          )
        : null}
      {modal?.kind === "confirm" ? (
        <ConfirmActionModal
          title={`${modal.action} Placement ?`}
          message={`Do you want to ${modal.action.toLowerCase()} ${modal.row.id}?`}
          tone={modal.action === "Book" ? "primary" : undefined}
          onConfirm={() => {
            void (async () => {
              setActionError(null);
              try {
                const id = modal.row.id;
                if (modal.action === "Close") await settleTreasuryDeal(id);
                else if (modal.action === "Cancel") await cancelTreasuryDeal(id, "Cancelled from placement UI");
                else if (modal.action === "Book") {
                  await bookTreasuryDeal(id, { sendExternalConfirmation: false, environment: "UAT" });
                }
                setModal(null);
                const done =
                  modal.action === "Close"
                    ? `Closed ${id}`
                    : modal.action === "Cancel"
                      ? `Cancelled ${id}`
                      : `Booked ${id}`;
                showSuccess(done);
                refresh();
              } catch (e) {
                setActionError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Action failed");
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

function AddPlacementModal({
  onClose,
  onDone,
  initial,
  mode = "add",
}: {
  onClose: () => void;
  onDone: (message: string) => void;
  initial?: PlacementRow;
  mode?: "add" | "rebook";
}) {
  const [dealType, setDealType] = useState<MmDealType>(
    (MM_TYPES.includes(initial?.dealType as MmDealType)
      ? initial?.dealType
      : "MONEY_MARKET_PLACEMENT") as MmDealType,
  );
  const [institution, setInstitution] = useState(
    initial?.institution && SAFE_REF_RE.test(initial.institution) ? initial.institution : "CBN",
  );
  const [amount, setAmount] = useState(initial ? String(initial.amountNum || 500000) : "500000");
  const [rate, setRate] = useState(initial?.rateNum ? String(initial.rateNum) : "12.50");
  const [currency, setCurrency] = useState(initial?.currency || "NGN");
  const [tenure, setTenure] = useState(
    initial?.tenureDays ? `${initial.tenureDays} Days` : TENOR_MONTHS[2] ?? "3 Months",
  );
  const [start, setStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [maturity, setMaturity] = useState(() => addDaysIso(new Date().toISOString().slice(0, 10), 90));
  const [deskCode, setDeskCode] = useState(
    initial?.deskCode && CODE_RE.test(initial.deskCode) ? initial.deskCode : "MMDESK",
  );
  const [dealerId, setDealerId] = useState(initial?.dealerId || "DEALER01");
  const [bookNow, setBookNow] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const days = tenorDaysFromLabel(tenure, 90);
    setMaturity(addDaysIso(start, days));
  }, [tenure, start]);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const amt = parseAmount(amount);
      if (amt <= 0) throw new Error("Amount must be greater than zero");
      const cpty = institution.trim().toUpperCase().replace(/\s+/g, "_");
      if (!SAFE_REF_RE.test(cpty)) throw new Error("Institution / counterparty ID is invalid");
      if (!CODE_RE.test(deskCode.trim().toUpperCase())) throw new Error("Desk code is invalid");
      if (!SAFE_REF_RE.test(dealerId.trim())) throw new Error("Dealer ID is invalid");
      if (!maturity || maturity < start) throw new Error("Maturity must be on or after start/value date");

      const rateNum = parseAmount(rate);
      const ref = `PL-${Date.now()}`;
      const body: Record<string, unknown> = {
        requestReference: ref,
        dealType,
        deskCode: deskCode.trim().toUpperCase(),
        dealerId: dealerId.trim(),
        counterpartyId: cpty,
        baseCurrency: currency.slice(0, 3).toUpperCase(),
        notionalAmount: amt,
        tradeDate: start,
        valueDate: start,
        maturityDate: maturity,
        narration: mode === "rebook" && initial ? `Rebook of ${initial.id}` : "Money-market placement from txn UI",
      };
      if (rateNum > 0) body.agreedRate = rateNum;

      const deal = (await createTreasuryDeal(body)) as {
        dealReference?: string;
        requestReference?: string;
      };
      const dealRef = String(deal.dealReference ?? deal.requestReference ?? ref);

      if (bookNow) {
        try {
          await bookTreasuryDeal(dealRef, { sendExternalConfirmation: false, environment: "UAT" });
        } catch (bookErr) {
          const msg =
            bookErr instanceof ApiError
              ? bookErr.message
              : bookErr instanceof Error
                ? bookErr.message
                : "Booking deferred";
          onDone(`${dealRef} created — booking not completed: ${msg}`);
          return;
        }
      }
      onDone(`${mode === "rebook" ? "Rebooked" : "Created"} ${dealRef}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="plc-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="plc-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>{mode === "rebook" ? "Rebook Placement Contract" : "Add New Placement Contract"}</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        {error ? <p role="alert">{error}</p> : null}
        <div className="plc-modal-grid">
          <label>
            <span>Deal type</span>
            <select value={dealType} onChange={(e) => setDealType(e.target.value as MmDealType)}>
              {MM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "MONEY_MARKET_BORROWING" ? "Borrowing" : "Placement"}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Institution (counterparty ID)</span>
            <select value={institution} onChange={(e) => setInstitution(e.target.value)}>
              {INSTITUTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Amount</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
          </label>
          <label>
            <span>Currency</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCY_CODES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Rate (%)</span>
            <input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
          </label>
          <label>
            <span>Tenure</span>
            <select value={tenure} onChange={(e) => setTenure(e.target.value)}>
              {TENOR_MONTHS.map((o) => (
                <option key={o}>{o}</option>
              ))}
              <option>30 Days</option>
              <option>60 Days</option>
              <option>90 Days</option>
              <option>180 Days</option>
              <option>364 Days</option>
            </select>
          </label>
          <label>
            <span>Start / value date</span>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label>
            <span>Maturity date</span>
            <input type="date" value={maturity} onChange={(e) => setMaturity(e.target.value)} />
          </label>
          <label>
            <span>Desk code</span>
            <select value={deskCode} onChange={(e) => setDeskCode(e.target.value)}>
              {DESKS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Dealer ID</span>
            <input value={dealerId} onChange={(e) => setDealerId(e.target.value)} />
          </label>
          <label>
            <span>Book immediately</span>
            <select value={bookNow ? "true" : "false"} onChange={(e) => setBookNow(e.target.value === "true")}>
              <option value="true">Yes</option>
              <option value="false">No (create only)</option>
            </select>
          </label>
        </div>
        <footer>
          <div />
          <div>
            <button type="button" className="plc-ghost" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="button" className="plc-primary" disabled={busy} onClick={() => void submit()}>
              {busy ? "Saving…" : mode === "rebook" ? "Rebook" : "Create"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
