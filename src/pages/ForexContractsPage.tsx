import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FilterDropdown } from "../components/FilterDropdown";
import { ContractTypeTabs } from "../components/ContractTypeTabs";
import { CURRENCY_CODES, TABLE_OVERFLOW_ACTIONS } from "../data/filterDropdownOptions";
import "./ForexContractsPage.css";
import { listTreasuryDeals } from "../api/domain";
import { createTreasuryDeal, bookTreasuryDeal, settleTreasuryDeal, cancelTreasuryDeal } from "../api/contracts";
import { ApiError } from "../lib/apiClient";
import { formatTxnDate, formatTxnMoney } from "../api/transactions";
import { ViewDetailsModal } from "../components/feedback/ViewDetailsModal";
import { ConfirmActionModal } from "../components/feedback/ConfirmActionModal";
import { useActionFeedback } from "../components/feedback/useActionFeedback";

type FxDealType = "FX_SPOT" | "FX_FORWARD" | "FX_SWAP" | "FX_OPTION";

type ForexRow = {
  id: string;
  dealType: FxDealType | string;
  baseCurrency: string;
  counterCurrency: string;
  amount: string;
  amountNum: number;
  rate: string;
  rateNum: number;
  counterparty: string;
  tradeDate: string;
  settlementDate: string;
  maturityDate: string;
  status: string;
  deskCode: string;
  dealerId: string;
};

type ModalState =
  | { kind: "add" }
  | { kind: "view"; row: ForexRow }
  | { kind: "rebook"; row: ForexRow }
  | { kind: "cancel"; row: ForexRow }
  | { kind: "settle"; row: ForexRow }
  | null;

const PAGE_SIZE = 20;
const FX_DEAL_TYPES: FxDealType[] = ["FX_SPOT", "FX_FORWARD", "FX_SWAP", "FX_OPTION"];
const DEAL_TYPE_FILTERS = ["All FX", ...FX_DEAL_TYPES] as const;
const COUNTERPARTIES = ["CBN", "ZENITH", "GTB", "ACCESS", "FBN", "UBA", "CPTY-CBN"] as const;
const DESKS = ["FXDESK", "TRSY_DESK"] as const;
const CODE_RE = /^[A-Z0-9_.-]{2,40}$/;
const SAFE_REF_RE = /^[A-Za-z0-9_.:/-]{1,120}$/;

function toList(res: unknown): Record<string, unknown>[] {
  if (Array.isArray(res)) return res as Record<string, unknown>[];
  if (res && typeof res === "object" && "content" in res && Array.isArray((res as { content: unknown }).content)) {
    return (res as { content: Record<string, unknown>[] }).content;
  }
  return [];
}

function mapDeal(item: Record<string, unknown>, i: number): ForexRow {
  const base = String(item.baseCurrency ?? "NGN").toUpperCase();
  const quote = String(item.quoteCurrency ?? "—").toUpperCase();
  const amountNum = Number(item.notionalAmount ?? item.amount ?? 0) || 0;
  const rateNum = Number(item.agreedRate ?? item.rate ?? 0) || 0;
  const dealType = String(item.dealType ?? "FX_SPOT");
  return {
    id: String(item.dealReference ?? item.requestReference ?? item.id ?? `FX-${i}`),
    dealType,
    baseCurrency: base,
    counterCurrency: quote,
    amount: formatTxnMoney(amountNum, base),
    amountNum,
    rate: rateNum ? String(rateNum) : "—",
    rateNum,
    counterparty: String(item.counterpartyId ?? item.counterparty ?? "—"),
    tradeDate: formatTxnDate(null, String(item.tradeDate ?? "")),
    settlementDate: formatTxnDate(null, String(item.valueDate ?? "")),
    maturityDate: formatTxnDate(null, String(item.maturityDate ?? "")),
    status: String(item.status ?? "—"),
    deskCode: String(item.deskCode ?? ""),
    dealerId: String(item.dealerId ?? ""),
  };
}

function parseAmount(raw: string): number {
  const n = Number(String(raw ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function isFxType(t: string): boolean {
  return t.toUpperCase().startsWith("FX_");
}

function needsMaturity(dealType: string): boolean {
  return dealType === "FX_FORWARD" || dealType === "FX_SWAP" || dealType === "FX_OPTION";
}

export function ForexContractsPage() {
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [dealTypeFilter, setDealTypeFilter] = useState<string>("All FX");
  const [tableAction, setTableAction] = useState<string>(TABLE_OVERFLOW_ACTIONS[1]);
  const [modal, setModal] = useState<ModalState>(null);
  const [allRows, setAllRows] = useState<ForexRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const { showSuccess, feedbackUi } = useActionFeedback();

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQ, dealTypeFilter, tableAction]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const types =
          dealTypeFilter === "All FX" ? FX_DEAL_TYPES : ([dealTypeFilter] as FxDealType[]);
        const pages = await Promise.all(
          types.map((dealType) => listTreasuryDeals({ dealType, size: 100 })),
        );
        if (cancelled) return;
        const mapped = pages
          .flatMap((res) => toList(res))
          .map(mapDeal)
          .filter((r) => isFxType(r.dealType));
        // Dedupe by deal reference
        const byId = new Map<string, ForexRow>();
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
  }, [dealTypeFilter, refreshKey]);

  const filtered = useMemo(() => {
    const q = debouncedQ.toLowerCase();
    let list = allRows;
    if (q) {
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.counterparty.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q) ||
          r.baseCurrency.toLowerCase().includes(q) ||
          r.counterCurrency.toLowerCase().includes(q) ||
          r.dealType.toLowerCase().includes(q),
      );
    }
    if (tableAction === "Clear Table") return [];
    const sorted = [...list];
    if (tableAction === "Sort By Date") {
      sorted.sort((a, b) => a.tradeDate.localeCompare(b.tradeDate));
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
    <div className="forex">
      {feedbackUi}
      <div className="forex-head">
        <div>
          <h1>FOREX CONTRACTS</h1>
          {loadError ? <p role="alert">{loadError}</p> : null}
          {actionError ? <p role="alert">{actionError}</p> : null}
          <button type="button" className="forex-add" onClick={() => setModal({ kind: "add" })}>
            +Add New Contract
          </button>
        </div>
        <div className="forex-toolbar">
          <FilterDropdown
            aria-label="Filter by FX deal type"
            triggerClassName="forex-filter-btn"
            menuAlign="end"
            options={[...DEAL_TYPE_FILTERS]}
            value={dealTypeFilter}
            onSelect={setDealTypeFilter}
            trigger={
              <>
                <FilterIcon />
                {dealTypeFilter === "All FX" ? "Filter: All FX" : `Filter: ${dealTypeFilter}`}
              </>
            }
          />
          <FilterDropdown
            aria-label="Table sort and actions"
            triggerClassName="forex-sort-btn"
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
                {tableAction.startsWith("Sort") ? tableAction : "Sort By Amount"}
                <ChevronDown />
              </>
            }
          />
        </div>
      </div>

      <ContractTypeTabs />

      <label className="forex-search">
        <SearchIcon />
        <input
          type="search"
          placeholder="Search deal reference, counterparty, currency, status…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <div className="forex-table-wrap">
        <table className="forex-table">
          <thead>
            <tr>
              <th>FX Contract ID</th>
              <th>Type</th>
              <th>Base Currency</th>
              <th>Counter Currency</th>
              <th>Amount</th>
              <th>Rate</th>
              <th>Counterparty</th>
              <th>Trade Date</th>
              <th>Settlement Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} style={{ textAlign: "center", color: "#6b7280", padding: "1.5rem" }}>
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: "center", color: "#6b7280", padding: "1.5rem" }}>
                  No FX deals yet. Use +Add New Contract.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.dealType}</td>
                  <td>{row.baseCurrency}</td>
                  <td>{row.counterCurrency}</td>
                  <td className="is-amount">{row.amount}</td>
                  <td>{row.rate}</td>
                  <td>{row.counterparty}</td>
                  <td>{row.tradeDate}</td>
                  <td>{row.settlementDate}</td>
                  <td>
                    <span className="forex-status">{row.status}</span>
                  </td>
                  <td>
                    <div className="forex-actions">
                      <button type="button" onClick={() => setModal({ kind: "view", row })}>
                        View
                      </button>
                      <span aria-hidden>·</span>
                      <button type="button" onClick={() => setModal({ kind: "rebook", row })}>
                        Rebook
                      </button>
                      <span aria-hidden>·</span>
                      <button type="button" onClick={() => setModal({ kind: "settle", row })}>
                        Settle
                      </button>
                      <span aria-hidden>·</span>
                      <button type="button" className="is-danger" onClick={() => setModal({ kind: "cancel", row })}>
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="forex-pager" style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
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
            <AddForexModal
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
              title="View Forex Contract"
              fields={[
                { label: "FX Contract ID", value: modal.row.id },
                { label: "Deal type", value: modal.row.dealType },
                { label: "Base Currency", value: modal.row.baseCurrency },
                { label: "Counter Currency", value: modal.row.counterCurrency },
                { label: "Amount", value: modal.row.amount },
                { label: "Rate", value: modal.row.rate },
                { label: "Counterparty", value: modal.row.counterparty },
                { label: "Desk", value: modal.row.deskCode || "—" },
                { label: "Dealer", value: modal.row.dealerId || "—" },
                { label: "Trade Date", value: modal.row.tradeDate, date: true },
                { label: "Settlement Date", value: modal.row.settlementDate, date: true },
                { label: "Maturity Date", value: modal.row.maturityDate || "—", date: true },
                { label: "Status", value: modal.row.status },
              ]}
              onClose={() => setModal(null)}
            />,
            document.body,
          )
        : null}
      {modal?.kind === "settle" ? (
        <ConfirmActionModal
          title="Settle Contract ?"
          message={`Do you want to settle ${modal.row.id}?`}
          tone="primary"
          onConfirm={() => {
            void (async () => {
              setActionError(null);
              try {
                await settleTreasuryDeal(modal.row.id);
                setModal(null);
                showSuccess(`Settled ${modal.row.id}`);
                refresh();
              } catch (e) {
                setActionError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Settle failed");
                setModal(null);
              }
            })();
          }}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal?.kind === "cancel" ? (
        <ConfirmActionModal
          title="Cancel Contract ?"
          message={`Do you want to cancel ${modal.row.id}?`}
          onConfirm={() => {
            void (async () => {
              setActionError(null);
              try {
                await cancelTreasuryDeal(modal.row.id, "Cancelled from forex contracts UI");
                setModal(null);
                showSuccess(`Cancelled ${modal.row.id}`);
                refresh();
              } catch (e) {
                setActionError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Cancel failed");
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

function AddForexModal({
  onClose,
  onDone,
  initial,
  mode = "add",
}: {
  onClose: () => void;
  onDone: (message: string) => void;
  initial?: ForexRow;
  mode?: "add" | "rebook";
}) {
  const [dealType, setDealType] = useState<FxDealType>(
    (FX_DEAL_TYPES.includes(initial?.dealType as FxDealType) ? initial?.dealType : "FX_SPOT") as FxDealType,
  );
  const [notional, setNotional] = useState(initial ? String(initial.amountNum || 1000000) : "1000000");
  const [baseCurrency, setBaseCurrency] = useState<string>(initial?.baseCurrency ?? "USD");
  const [counterCurrency, setCounterCurrency] = useState<string>(
    initial?.counterCurrency && initial.counterCurrency !== "—" ? initial.counterCurrency : "NGN",
  );
  const [counterparty, setCounterparty] = useState<string>(
    initial?.counterparty && SAFE_REF_RE.test(initial.counterparty) ? initial.counterparty : "CBN",
  );
  const [deskCode, setDeskCode] = useState(initial?.deskCode && CODE_RE.test(initial.deskCode) ? initial.deskCode : "FXDESK");
  const [dealerId, setDealerId] = useState(initial?.dealerId || "DEALER01");
  const [rate, setRate] = useState(initial?.rateNum ? String(initial.rateNum) : "1550.25");
  const [tradeDate, setTradeDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [valueDate, setValueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [maturityDate, setMaturityDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().slice(0, 10);
  });
  const [bookNow, setBookNow] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const amt = parseAmount(notional);
      const rateNum = parseAmount(rate);
      const base = baseCurrency.slice(0, 3).toUpperCase();
      const quote = counterCurrency.slice(0, 3).toUpperCase();
      if (amt <= 0) throw new Error("Notional must be greater than zero");
      if (rateNum <= 0) throw new Error("Agreed rate is required for FX deals");
      if (base === quote) throw new Error("Base and quote currencies must differ");
      if (!CODE_RE.test(deskCode.trim().toUpperCase())) throw new Error("Desk code is invalid");
      if (!SAFE_REF_RE.test(dealerId.trim())) throw new Error("Dealer ID is invalid");
      const cpty = counterparty.trim().toUpperCase().replace(/\s+/g, "_");
      if (!SAFE_REF_RE.test(cpty)) throw new Error("Counterparty ID is invalid");
      if (needsMaturity(dealType) && !maturityDate) throw new Error("Maturity date is required for this deal type");

      const ref = `FX-${Date.now()}`;
      const body: Record<string, unknown> = {
        requestReference: ref,
        dealType,
        deskCode: deskCode.trim().toUpperCase(),
        dealerId: dealerId.trim(),
        counterpartyId: cpty,
        baseCurrency: base,
        quoteCurrency: quote,
        notionalAmount: amt,
        agreedRate: rateNum,
        tradeDate,
        valueDate,
        narration: mode === "rebook" && initial ? `Rebook of ${initial.id}` : "Forex contract from txn UI",
      };
      if (needsMaturity(dealType)) body.maturityDate = maturityDate;

      const deal = (await createTreasuryDeal(body)) as {
        dealReference?: string;
        requestReference?: string;
        status?: string;
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
    <div className="forex-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="forex-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-forex-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="forex-modal-head">
          <h2 id="add-forex-title">{mode === "rebook" ? "Rebook Forex Contract" : "Add New Forex Contract"}</h2>
          <button type="button" className="forex-modal-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="forex-modal-body">
          {error ? <p role="alert">{error}</p> : null}
          <div className="forex-modal-grid">
            <label className="forex-field">
              <span>Deal type</span>
              <select value={dealType} onChange={(e) => setDealType(e.target.value as FxDealType)}>
                {FX_DEAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="forex-field">
              <span>Notional amount</span>
              <input value={notional} onChange={(e) => setNotional(e.target.value)} inputMode="decimal" />
            </label>
            <div className="forex-field">
              <span>Base currency</span>
              <FilterDropdown
                aria-label="Base currency"
                className="forex-fdrop"
                triggerClassName="forex-fdrop-trigger"
                options={CURRENCY_CODES}
                value={baseCurrency}
                onSelect={setBaseCurrency}
                align="center"
                trigger={
                  <>
                    <span className="forex-fdrop-value">{baseCurrency}</span>
                    <ChevronDown />
                  </>
                }
              />
            </div>
            <div className="forex-field">
              <span>Quote currency</span>
              <FilterDropdown
                aria-label="Quote currency"
                className="forex-fdrop"
                triggerClassName="forex-fdrop-trigger"
                options={CURRENCY_CODES}
                value={counterCurrency}
                onSelect={setCounterCurrency}
                align="center"
                trigger={
                  <>
                    <span className="forex-fdrop-value">{counterCurrency}</span>
                    <ChevronDown />
                  </>
                }
              />
            </div>
            <label className="forex-field">
              <span>Counterparty ID</span>
              <select value={counterparty} onChange={(e) => setCounterparty(e.target.value)}>
                {COUNTERPARTIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="forex-field">
              <span>Agreed rate</span>
              <input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
            </label>
            <label className="forex-field">
              <span>Desk code</span>
              <select value={deskCode} onChange={(e) => setDeskCode(e.target.value)}>
                {DESKS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="forex-field">
              <span>Dealer ID</span>
              <input value={dealerId} onChange={(e) => setDealerId(e.target.value)} />
            </label>
            <label className="forex-field">
              <span>Trade date</span>
              <input type="date" value={tradeDate} onChange={(e) => setTradeDate(e.target.value)} />
            </label>
            <label className="forex-field">
              <span>Value / settlement date</span>
              <input type="date" value={valueDate} onChange={(e) => setValueDate(e.target.value)} />
            </label>
            {needsMaturity(dealType) ? (
              <label className="forex-field">
                <span>Maturity date</span>
                <input type="date" value={maturityDate} onChange={(e) => setMaturityDate(e.target.value)} />
              </label>
            ) : null}
            <label className="forex-field">
              <span>Book immediately</span>
              <select value={bookNow ? "true" : "false"} onChange={(e) => setBookNow(e.target.value === "true")}>
                <option value="true">Yes</option>
                <option value="false">No (create only)</option>
              </select>
            </label>
          </div>
        </div>

        <footer className="forex-modal-foot">
          <button type="button" className="forex-btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="forex-btn-primary" disabled={busy} onClick={() => void submit()}>
            {busy ? "Saving…" : mode === "rebook" ? "Rebook" : "Create"}
          </button>
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
