import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ContractTypeTabs } from "../components/ContractTypeTabs";
import { FilterDropdown } from "../components/FilterDropdown";
import { ISSUER_TYPES, TABLE_OVERFLOW_ACTIONS, TENOR_MONTHS } from "../data/filterDropdownOptions";
import "./BondContractsPage.css";
import "./GlEntryModals.css";
import { listInvestments } from "../api/domain";
import { bookInvestment, createInvestment, liquidateInvestment } from "../api/contracts";
import { listInvestmentProducts, searchAccounts } from "../api/accounts";
import { getCustomerByCif, searchCustomers } from "../api/customers";
import { ApiError } from "../lib/apiClient";
import { formatTxnDate, formatTxnMoney } from "../api/transactions";
import { ViewDetailsModal } from "../components/feedback/ViewDetailsModal";
import { useActionFeedback } from "../components/feedback/useActionFeedback";

type ContractRow = {
  id: string;
  counterparty: string;
  productCode: string;
  investmentType: string;
  currency: string;
  faceValue: string;
  faceValueNum: number;
  purchaseDate: string;
  maturityDate: string;
  rate: string;
  status: string;
  settlementAccount: string;
  tenorDays: number;
  customerId: string;
};

type SecuritiesKind = "bond" | "tbill";

type SecuritiesConfig = {
  title: string;
  modalTitle: string;
  modalKind: SecuritiesKind;
  /** Lending InvestmentType enum value */
  investmentType: "BOND" | "TREASURY_BILL";
  /** Preferred product codes (catalog / seed) */
  preferredProductCodes: string[];
  defaultCounterparty: string;
};

type ProductOption = { code: string; name: string; investmentType?: string; status?: string };

type ModalState =
  | { kind: "add" }
  | { kind: "view"; row: ContractRow }
  | { kind: "terminate"; row: ContractRow | null }
  | null;

const PAGE_SIZE = 20;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACCOUNT_RE = /^[A-Za-z0-9_.-]{4,30}$/;

const BOND_CONFIG: SecuritiesConfig = {
  title: "BOND CONTRACTS",
  modalTitle: "ADD NEW BOND CONTRACT",
  modalKind: "bond",
  investmentType: "BOND",
  preferredProductCodes: ["BOND", "BOND_NG"],
  defaultCounterparty: "FGN",
};

const TBILL_CONFIG: SecuritiesConfig = {
  title: "TREASURY BILL",
  modalTitle: "ADD NEW TREASURY BILL",
  modalKind: "tbill",
  investmentType: "TREASURY_BILL",
  preferredProductCodes: ["TBILL"],
  defaultCounterparty: "CBN",
};

export function BondContractsPage() {
  return <SecuritiesContractsPage config={BOND_CONFIG} />;
}

export function TreasuryBillsPage() {
  return <SecuritiesContractsPage config={TBILL_CONFIG} />;
}

function toList(res: unknown): Record<string, unknown>[] {
  if (Array.isArray(res)) return res as Record<string, unknown>[];
  if (res && typeof res === "object" && "content" in res && Array.isArray((res as { content: unknown }).content)) {
    return (res as { content: Record<string, unknown>[] }).content;
  }
  return [];
}

function mapInvestment(item: Record<string, unknown>, i: number): ContractRow {
  const currency = String(item.currency ?? "NGN");
  const faceValueNum = Number(item.currentPrincipal ?? item.originalPrincipal ?? item.amount ?? 0) || 0;
  return {
    id: String(item.investmentNumber ?? item.id ?? `INV-${i}`),
    counterparty: String(item.customerName ?? item.customerId ?? "—"),
    productCode: String(item.productCode ?? "—"),
    investmentType: String(item.investmentType ?? ""),
    currency,
    faceValue: formatTxnMoney(faceValueNum, currency),
    faceValueNum,
    purchaseDate: formatTxnDate(null, String(item.bookingDate ?? item.applicationDate ?? "")),
    maturityDate: formatTxnDate(null, String(item.maturityDate ?? "")),
    rate: String(item.annualInterestRate ?? "—"),
    status: String(item.status ?? "—"),
    settlementAccount: String(item.settlementAccount ?? ""),
    tenorDays: Number(item.tenorDays ?? 0) || 0,
    customerId: String(item.customerId ?? ""),
  };
}

function parseAmount(raw: string): number {
  const n = Number(String(raw ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function normalizeAccount(raw: string): string {
  return String(raw ?? "")
    .replace(/[^A-Za-z0-9_.-]/g, "")
    .slice(0, 30);
}

function tenorDaysFromLabel(raw: string, fallback: number): number {
  const n = Number(String(raw).replace(/\D/g, ""));
  if (!n) return fallback;
  if (/day/i.test(raw)) return n;
  return Math.max(1, n * 30);
}

function pickDefaultProduct(products: ProductOption[], preferred: string[]): string {
  for (const code of preferred) {
    const hit = products.find((p) => p.code.toUpperCase() === code.toUpperCase());
    if (hit) return hit.code;
  }
  return products[0]?.code ?? preferred[0] ?? "";
}

function SecuritiesContractsPage({ config }: { config: SecuritiesConfig }) {
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [tableAction, setTableAction] = useState<string>(TABLE_OVERFLOW_ACTIONS[1]);
  const [modal, setModal] = useState<ModalState>(null);
  const [allRows, setAllRows] = useState<ContractRow[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { showSuccess, feedbackUi } = useActionFeedback();

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQ, tableAction, config.investmentType]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listInvestmentProducts({ status: "ACTIVE", size: 100 });
        if (cancelled) return;
        const list = toList(res)
          .map((p) => ({
            code: String(p.code ?? ""),
            name: String(p.name ?? p.code ?? ""),
            investmentType: String(p.investmentType ?? ""),
            status: String(p.status ?? ""),
          }))
          .filter(
            (p) =>
              p.code &&
              (p.investmentType === config.investmentType ||
                config.preferredProductCodes.some((c) => c.toUpperCase() === p.code.toUpperCase())),
          );
        setProducts(list.length ? list : config.preferredProductCodes.map((code) => ({ code, name: code })));
      } catch {
        if (!cancelled) {
          setProducts(config.preferredProductCodes.map((code) => ({ code, name: code })));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [config.investmentType, config.preferredProductCodes]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await listInvestments({
          investmentType: config.investmentType,
          size: 100,
          investmentNumber: debouncedQ || undefined,
        });
        if (cancelled) return;
        let mapped = toList(res).map(mapInvestment);
        // Fallback if older gateway ignores investmentType
        mapped = mapped.filter(
          (r) =>
            r.investmentType === config.investmentType ||
            config.preferredProductCodes.some((c) => r.productCode.toUpperCase().includes(c.replace(/_NG$/i, ""))) ||
            (config.modalKind === "bond" && r.productCode.toUpperCase().includes("BOND")) ||
            (config.modalKind === "tbill" &&
              (r.productCode.toUpperCase().includes("TBILL") || r.productCode.toUpperCase().includes("TB_"))),
        );
        setAllRows(mapped);
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
  }, [config.investmentType, config.preferredProductCodes, config.modalKind, debouncedQ, refreshKey]);

  const filtered = useMemo(() => {
    const q = debouncedQ.toLowerCase();
    let list = allRows;
    if (q) {
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.counterparty.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q) ||
          r.productCode.toLowerCase().includes(q),
      );
    }
    if (tableAction === "Clear Table") return [];
    const sorted = [...list];
    if (tableAction === "Sort By Date") {
      sorted.sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate));
    } else if (tableAction === "Sort By Status") {
      sorted.sort((a, b) => a.status.localeCompare(b.status));
    } else if (tableAction === "Sort By Amount") {
      sorted.sort((a, b) => a.faceValueNum - b.faceValueNum);
    }
    return sorted;
  }, [allRows, debouncedQ, tableAction]);

  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE) || 1);
  const pageSafe = Math.min(page, totalPages - 1);
  const rows = filtered.slice(pageSafe * PAGE_SIZE, pageSafe * PAGE_SIZE + PAGE_SIZE);
  const fromIdx = totalElements === 0 ? 0 : pageSafe * PAGE_SIZE + 1;
  const toIdx = Math.min((pageSafe + 1) * PAGE_SIZE, totalElements);
  const selected = filtered.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="bonds">
      {feedbackUi}
      <div className="bonds-head">
        <div>
          <h1>{config.title}</h1>
          {loadError ? <p role="alert">{loadError}</p> : null}
          <div className="bonds-head-actions">
            <button type="button" className="bonds-add" onClick={() => setModal({ kind: "add" })}>
              +Add New Contract
            </button>
            <button
              type="button"
              className="bonds-terminate"
              onClick={() => setModal({ kind: "terminate", row: selected ?? rows[0] ?? null })}
            >
              Terminate
            </button>
          </div>
        </div>
        <div className="bonds-toolbar">
          <FilterDropdown
            aria-label="Table sort and actions"
            triggerClassName="bonds-sort-btn"
            menuAlign="end"
            options={TABLE_OVERFLOW_ACTIONS}
            value={tableAction}
            onSelect={(v) => {
              if (v === "Refresh Table") {
                setTableAction("Sort By Amount");
                setQuery("");
                setRefreshKey((k) => k + 1);
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

      <label className="bonds-search">
        <SearchIcon />
        <input
          type="search"
          placeholder="Search investment number, counterparty, status…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <div className="bonds-table-wrap">
        <table className="bonds-table">
          <thead>
            <tr>
              <th>Contract ID</th>
              <th>Counterparty</th>
              <th>Face Value</th>
              <th>Purchase Date</th>
              <th>Maturity Date</th>
              <th>Interest Rate (%)</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", color: "#6b7280", padding: "1.5rem" }}>
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", color: "#6b7280", padding: "1.5rem" }}>
                  No contracts yet. Use +Add New Contract.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className={selectedId === row.id ? "is-selected" : undefined}
                  onClick={() => setSelectedId(row.id)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{row.id}</td>
                  <td>{row.counterparty}</td>
                  <td>{row.faceValue}</td>
                  <td>{row.purchaseDate}</td>
                  <td>{row.maturityDate}</td>
                  <td>{row.rate}</td>
                  <td>
                    <span className="bonds-status">{row.status}</span>
                  </td>
                  <td>
                    <div className="bonds-actions">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModal({ kind: "view", row });
                        }}
                      >
                        View
                      </button>
                      <span aria-hidden>·</span>
                      <button
                        type="button"
                        className="is-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(row.id);
                          setModal({ kind: "terminate", row });
                        }}
                      >
                        Terminate
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bonds-pager">
        <span>
          {loading ? "…" : totalElements === 0 ? "0 results" : `${fromIdx}–${toIdx} of ${totalElements}`}
        </span>
        <div className="bonds-pager-actions">
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

      {modal?.kind === "add"
        ? createPortal(
            <AddSecuritiesGemModal
              config={config}
              products={products}
              onClose={() => setModal(null)}
              onDone={(msg) => {
                showSuccess(msg);
                setModal(null);
                setRefreshKey((k) => k + 1);
              }}
            />,
            document.body,
          )
        : null}
      {modal?.kind === "view"
        ? createPortal(
            <ViewDetailsModal
              title={config.modalKind === "tbill" ? "View Treasury Bill" : "View Bond Contract"}
              fields={[
                { label: "Contract ID", value: modal.row.id },
                { label: "Product", value: modal.row.productCode },
                { label: "Investment type", value: modal.row.investmentType || config.investmentType },
                { label: "Counterparty", value: modal.row.counterparty },
                { label: "Face Value", value: modal.row.faceValue },
                { label: "Interest Rate", value: `${modal.row.rate}%` },
                { label: "Tenor", value: modal.row.tenorDays ? `${modal.row.tenorDays} Days` : "—" },
                { label: "Purchase Date", value: modal.row.purchaseDate, date: true },
                { label: "Maturity Date", value: modal.row.maturityDate, date: true },
                { label: "Settlement Account", value: modal.row.settlementAccount || "—" },
                { label: "Status", value: modal.row.status },
              ]}
              onClose={() => setModal(null)}
            />,
            document.body,
          )
        : null}
      {modal?.kind === "terminate"
        ? createPortal(
            <TerminateSecuritiesModal
              initial={modal.row}
              knownRows={filtered}
              label={config.modalKind === "tbill" ? "Treasury Bill" : "Bond"}
              onClose={() => setModal(null)}
              onDone={(msg) => {
                showSuccess(msg);
                setModal(null);
                setSelectedId(null);
                setRefreshKey((k) => k + 1);
              }}
            />,
            document.body,
          )
        : null}
    </div>
  );
}

function AddSecuritiesGemModal({
  config,
  products,
  onClose,
  onDone,
}: {
  config: SecuritiesConfig;
  products: ProductOption[];
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [counterparty, setCounterparty] = useState(config.defaultCounterparty);
  const [cifOrId, setCifOrId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerLabel, setCustomerLabel] = useState("");
  const [productCode, setProductCode] = useState(() => pickDefaultProduct(products, config.preferredProductCodes));
  const [faceValue, setFaceValue] = useState("500000");
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [tenor, setTenor] = useState<string>(config.modalKind === "tbill" ? "91 Days" : TENOR_MONTHS[4]);
  const [rate, setRate] = useState(config.modalKind === "tbill" ? "15" : "8.50");
  const [issuerType, setIssuerType] = useState<string>(ISSUER_TYPES[0]);
  const [settlement, setSettlement] = useState("");
  const [accountChoices, setAccountChoices] = useState<string[]>([]);
  const [bookNow, setBookNow] = useState(true);
  const [busy, setBusy] = useState(false);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookNote, setBookNote] = useState<string | null>(null);

  useEffect(() => {
    setProductCode((prev) => {
      if (prev && products.some((p) => p.code === prev)) return prev;
      return pickDefaultProduct(products, config.preferredProductCodes);
    });
  }, [products, config.preferredProductCodes]);

  async function resolveCustomer() {
    const q = cifOrId.trim();
    if (!q) {
      setError("Enter a customer UUID or CIF");
      return;
    }
    setLookupBusy(true);
    setError(null);
    try {
      if (UUID_RE.test(q)) {
        setCustomerId(q);
        setCustomerLabel(q);
        const accts = await searchAccounts({ q, status: "ACTIVE", size: 20 });
        const nums = toList(accts)
          .map((a) => String(a.accountNumber ?? ""))
          .filter(Boolean);
        setAccountChoices(nums);
        if (nums[0]) setSettlement(nums[0]);
        return;
      }
      let cust: Record<string, unknown> | null = null;
      try {
        cust = (await getCustomerByCif(q)) as Record<string, unknown>;
      } catch {
        const page = await searchCustomers({ cifNumber: q, name: q, size: 5 });
        cust = toList(page)[0] ?? null;
      }
      if (!cust?.id) {
        setError("Customer not found");
        setCustomerId("");
        setCustomerLabel("");
        return;
      }
      const id = String(cust.id);
      setCustomerId(id);
      setCustomerLabel(String(cust.displayName ?? cust.companyName ?? cust.cifNumber ?? id));
      const accts = await searchAccounts({ q: id, status: "ACTIVE", size: 20 });
      const nums = toList(accts)
        .map((a) => String(a.accountNumber ?? ""))
        .filter((n) => ACCOUNT_RE.test(n));
      setAccountChoices(nums);
      if (nums[0]) setSettlement(nums[0]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Customer lookup failed");
    } finally {
      setLookupBusy(false);
    }
  }

  async function submit() {
    setBusy(true);
    setError(null);
    setBookNote(null);
    try {
      if (!customerId || !UUID_RE.test(customerId)) {
        throw new Error("Resolve a valid customer (UUID) before creating");
      }
      const settle = normalizeAccount(settlement);
      if (!ACCOUNT_RE.test(settle)) {
        throw new Error("Settlement account must be 4–30 alphanumeric characters (customer NUBAN)");
      }
      const code = (productCode || pickDefaultProduct(products, config.preferredProductCodes)).toUpperCase();
      if (!code) throw new Error("Select an investment product code");
      const amt = parseAmount(faceValue);
      if (amt <= 0) throw new Error("Face value must be greater than zero");
      const rateNum = parseAmount(rate);
      if (rateNum <= 0) throw new Error("Interest rate must be greater than zero");
      const fallbackDays = config.modalKind === "tbill" ? 91 : 365;
      const created = (await createInvestment({
        applicationReference: `${code}-${Date.now()}`,
        customerId,
        productCode: code,
        settlementAccount: settle,
        amount: amt,
        tenorDays: tenorDaysFromLabel(tenor, fallbackDays),
        applicationDate: purchaseDate,
        rolloverOption: "NONE",
        annualInterestRate: rateNum,
      })) as { investmentNumber?: string; id?: string; status?: string };
      const num = String(created.investmentNumber ?? created.id ?? "");
      if (num && bookNow) {
        try {
          await bookInvestment(num, purchaseDate);
        } catch (bookErr) {
          const msg =
            bookErr instanceof ApiError
              ? bookErr.message
              : bookErr instanceof Error
                ? bookErr.message
                : "Booking deferred";
          setBookNote(`Created ${num}; booking not completed: ${msg}`);
          onDone(
            `${config.modalKind === "tbill" ? "T-Bill" : "Bond"} ${num} created (${counterparty}/${issuerType}) — pending book`,
          );
          return;
        }
      }
      onDone(`${config.modalKind === "tbill" ? "T-Bill" : "Bond"} ${num || "created"} (${counterparty}/${issuerType})`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gem-backdrop bonds-gem-backdrop" role="presentation" onClick={onClose}>
      <div
        className="gem-modal gem-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sec-add-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <h2 id="sec-add-title">{config.modalTitle}</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        {error ? <p role="alert">{error}</p> : null}
        {bookNote ? <p role="status">{bookNote}</p> : null}
        <div className="gem-grid">
          <label>
            <span>Counterparty</span>
            <input value={counterparty} onChange={(e) => setCounterparty(e.target.value)} />
          </label>
          <label>
            <span>Issuer type</span>
            <select value={issuerType} onChange={(e) => setIssuerType(e.target.value)}>
              {ISSUER_TYPES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            <span>Customer (CIF or UUID)</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                style={{ flex: 1 }}
                value={cifOrId}
                onChange={(e) => setCifOrId(e.target.value)}
                placeholder="CIF0001001 or customer UUID"
                onBlur={() => {
                  if (cifOrId.trim() && !customerId) void resolveCustomer();
                }}
              />
              <button
                type="button"
                className="gem-ghost"
                disabled={lookupBusy || !cifOrId.trim()}
                onClick={() => void resolveCustomer()}
              >
                {lookupBusy ? "Looking up…" : "Lookup"}
              </button>
            </div>
            {customerLabel ? (
              <small style={{ display: "block", marginTop: 4 }}>
                {customerLabel}
                {customerId ? ` · ${customerId}` : ""}
              </small>
            ) : null}
          </label>
          <label>
            <span>Product code</span>
            <select value={productCode} onChange={(e) => setProductCode(e.target.value)}>
              {products.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.code}
                  {p.name && p.name !== p.code ? ` — ${p.name}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Face value</span>
            <input value={faceValue} onChange={(e) => setFaceValue(e.target.value)} inputMode="decimal" />
          </label>
          <label>
            <span>Purchase / value date</span>
            <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
          </label>
          <label>
            <span>Tenor</span>
            <select value={tenor} onChange={(e) => setTenor(e.target.value)}>
              {TENOR_MONTHS.map((o) => (
                <option key={o}>{o}</option>
              ))}
              {config.modalKind === "tbill" ? (
                <>
                  <option>91 Days</option>
                  <option>182 Days</option>
                  <option>364 Days</option>
                </>
              ) : null}
            </select>
          </label>
          <label>
            <span>Interest rate %</span>
            <input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
          </label>
          <label>
            <span>Settlement account (NUBAN)</span>
            {accountChoices.length > 0 ? (
              <select value={settlement} onChange={(e) => setSettlement(e.target.value)}>
                {accountChoices.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={settlement}
                onChange={(e) => setSettlement(e.target.value)}
                placeholder="Customer account number"
              />
            )}
          </label>
          <label>
            <span>Book immediately</span>
            <select value={bookNow ? "true" : "false"} onChange={(e) => setBookNow(e.target.value === "true")}>
              <option value="true">Yes</option>
              <option value="false">No (pending approval / later book)</option>
            </select>
          </label>
        </div>
        <footer>
          <button type="button" className="gem-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="gem-primary" disabled={busy || !customerId} onClick={() => void submit()}>
            {busy ? "Creating…" : "Create"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function TerminateSecuritiesModal({
  initial,
  knownRows,
  label,
  onClose,
  onDone,
}: {
  initial: ContractRow | null;
  knownRows: ContractRow[];
  label: string;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [contractId, setContractId] = useState(initial?.id ?? knownRows[0]?.id ?? "");
  const [settlementAccount, setSettlementAccount] = useState(
    initial?.settlementAccount || knownRows[0]?.settlementAccount || "",
  );
  const [valueDate, setValueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("Requested By Customer");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = knownRows.find((r) => r.id === contractId) ?? null;

  async function submit() {
    if (!contractId.trim()) {
      setError("Enter a contract ID");
      return;
    }
    const settle = normalizeAccount(settlementAccount);
    if (settle && !ACCOUNT_RE.test(settle)) {
      setError("Settlement account must be 4–30 alphanumeric characters");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await liquidateInvestment(contractId.trim(), {
        valueDate,
        narration: reason,
        settlementAccount: settle || undefined,
        principalAmount: selected?.faceValueNum || undefined,
      });
      onDone(`Terminated ${contractId.trim()}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Terminate failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gem-backdrop bonds-gem-backdrop" role="presentation" onClick={onClose}>
      <div className="gem-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>TERMINATE {label.toUpperCase()}</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        {error ? <p role="alert">{error}</p> : null}
        {selected ? (
          <p className="gem-warn">
            {selected.id} · {selected.faceValue} · {selected.status}
          </p>
        ) : null}
        <div className="gem-grid">
          <label>
            <span>Contract ID</span>
            {knownRows.length > 0 ? (
              <select
                value={contractId}
                onChange={(e) => {
                  setContractId(e.target.value);
                  const next = knownRows.find((r) => r.id === e.target.value);
                  if (next?.settlementAccount) setSettlementAccount(next.settlementAccount);
                }}
              >
                {knownRows.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} · {r.status}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={contractId}
                onChange={(e) => setContractId(e.target.value)}
                placeholder="Investment number"
                autoFocus
              />
            )}
          </label>
          <label>
            <span>Value date</span>
            <input type="date" value={valueDate} onChange={(e) => setValueDate(e.target.value)} />
          </label>
          <label>
            <span>Settlement account</span>
            <input
              value={settlementAccount}
              onChange={(e) => setSettlementAccount(e.target.value)}
              placeholder="Customer NUBAN"
            />
          </label>
        </div>
        <label className="gem-desc">
          <span>Reason</span>
          <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <footer>
          <button type="button" className="gem-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="gem-primary"
            disabled={busy || !contractId.trim()}
            onClick={() => void submit()}
          >
            {busy ? "Working…" : "Terminate"}
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
