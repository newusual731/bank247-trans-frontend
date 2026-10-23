import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FilterDropdown } from "../components/FilterDropdown";
import { ContractTypeTabs } from "../components/ContractTypeTabs";
import {
  CONTRACT_PARTY_TYPES,
  INSTRUMENT_PRODUCT_CODES,
  PARTY_SCOPES,
  type PartyScope,
} from "../data/accountTypeOptions";
import {
  CONTRACT_PRODUCT_FILTERS,
  CURRENCY_CODES,
  INTEREST_GL_UNIQUE,
  PAYMENT_FREQUENCIES,
  PRINCIPAL_GL_UNIQUE,
  REFERENCE_TRANSACTIONS,
  TABLE_OVERFLOW_ACTIONS,
  TENOR_MONTHS,
  YES_NO,
} from "../data/filterDropdownOptions";
import "./ContractBalancesPage.css";
import "./GlEntryModals.css";
import {
  getContractBalances,
  getContractBalanceSummary,
  type ContractBalance,
  type ContractBalanceSummary,
} from "../api/domain";
import {
  bookInvestment,
  bookTreasuryDeal,
  cancelTreasuryDeal,
  createInvestment,
  createLoan,
  createTreasuryDeal,
  disburseLoan,
  liquidateInvestment,
  liquidateLoan,
} from "../api/contracts";
import { ApiError } from "../lib/apiClient";
import { formatTxnDate, formatTxnMoney } from "../api/transactions";
import { ViewDetailsModal } from "../components/feedback/ViewDetailsModal";
import { useActionFeedback } from "../components/feedback/useActionFeedback";

type BalanceRow = {
  id: string;
  sourceType: string;
  party: string;
  scope: "Customer" | "Internal";
  productType: string;
  currency: string;
  debit: string;
  credit: string;
  balance: string;
  balanceNum: number;
  debitNum: number;
  creditNum: number;
  status: "Active" | "Settled" | "Closed";
  lastActivity: string;
};

const PAGE_SIZE = 20;
const CURRENCY_FILTERS = ["All", ...CURRENCY_CODES] as const;

function mapStatus(raw: string): BalanceRow["status"] {
  const s = String(raw ?? "").toUpperCase();
  if (s.includes("SETTLE") || s.includes("MATUR")) return "Settled";
  if (s.includes("CLOSE") || s.includes("CANCEL") || s.includes("LIQUID") || s.includes("TERMIN")) return "Closed";
  return "Active";
}

function mapRow(r: ContractBalance): BalanceRow {
  const debitNum = Number(r.debit ?? 0) || 0;
  const creditNum = Number(r.credit ?? 0) || 0;
  const balanceNum = Number(r.balance ?? 0) || 0;
  const currency = r.currency || "NGN";
  return {
    id: r.contractId,
    sourceType: String(r.sourceType || "").toUpperCase(),
    party: r.party || "—",
    scope: String(r.partyScope || "").toUpperCase() === "INTERNAL" ? "Internal" : "Customer",
    productType: r.productType || "—",
    currency,
    debit: formatTxnMoney(debitNum, currency),
    credit: formatTxnMoney(creditNum, currency),
    balance: formatTxnMoney(balanceNum, currency),
    balanceNum,
    debitNum,
    creditNum,
    status: mapStatus(r.status),
    lastActivity: formatTxnDate(r.lastActivity, null),
  };
}

function productCodeFromLabel(product: string): string {
  const p = product.toUpperCase();
  if (p.includes("TBILL") || p.includes("TREASURY BILL")) return "TBILL";
  if (p.includes("BOND")) return "BOND";
  if (p.includes("CALL")) return "CALL_DEPOSIT";
  if (p.includes("FD") || p.includes("FIXED")) return "FIXED_DEPOSIT";
  if (p.includes("CP") || p.includes("COMMERCIAL")) return "COMMERCIAL_PAPER";
  if (p.includes("LOAN")) return "PERSONAL_LOAN";
  if (p.includes("PLACE")) return "MONEY_MARKET_PLACEMENT";
  if (p.includes("FOREX") || p.includes("FX")) return "FX_SPOT";
  return product.replace(/\s+/g, "_").slice(0, 40) || "TBILL";
}

function parseAmount(raw: string): string {
  return String(raw ?? "").replace(/[^0-9.]/g, "") || "0";
}

function tenorMonths(raw: string): number {
  return Number(String(raw).replace(/\D/g, "")) || 12;
}

export function ContractBalancesPage() {
  const [rows, setRows] = useState<BalanceRow[]>([]);
  const [summary, setSummary] = useState<ContractBalanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [partyMode, setPartyMode] = useState<PartyScope>("All");
  const [productType, setProductType] = useState<string>(CONTRACT_PRODUCT_FILTERS[0]);
  const [currency, setCurrency] = useState<string>("All");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [contractId, setContractId] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [sortAction, setSortAction] = useState<string>(TABLE_OVERFLOW_ACTIONS[1]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [reverseOpen, setReverseOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { showSuccess, feedbackUi } = useActionFeedback();

  const fromIdx = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const toIdx = Math.min((page + 1) * PAGE_SIZE, totalElements);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(contractId.trim()), 300);
    return () => window.clearTimeout(t);
  }, [contractId]);

  useEffect(() => {
    setPage(0);
  }, [partyMode, productType, currency, debouncedQ, sortAction]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const partyScope =
          partyMode === "All" ? undefined : partyMode === "Customer" ? "CUSTOMER" : "INTERNAL";
        const [list, sum] = await Promise.all([
          getContractBalances({
            page,
            size: PAGE_SIZE,
            productType: productType !== "All" ? productType : undefined,
            partyScope,
            currency: currency !== "All" ? currency : undefined,
            q: debouncedQ || undefined,
          }),
          getContractBalanceSummary({
            productType: productType !== "All" ? productType : undefined,
            partyScope,
            currency: currency !== "All" ? currency : undefined,
          }),
        ]);
        if (cancelled) return;
        let mapped = (list.content ?? []).map(mapRow);
        if (sortAction === "Clear Table") {
          mapped = [];
        } else if (sortAction === "Sort By Status") {
          mapped = [...mapped].sort((a, b) => a.status.localeCompare(b.status));
        } else if (sortAction === "Sort By Amount") {
          mapped = [...mapped].sort((a, b) => a.balanceNum - b.balanceNum);
        } else if (sortAction === "Sort By Date") {
          mapped = [...mapped].sort((a, b) => a.lastActivity.localeCompare(b.lastActivity));
        }
        setRows(mapped);
        setSummary(sum);
        setTotalPages(Math.max(1, list.totalPages || 1));
        setTotalElements(list.totalElements ?? 0);
      } catch (e) {
        if (!cancelled) {
          setRows([]);
          setSummary(null);
          setTotalElements(0);
          setTotalPages(1);
          setLoadError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Load failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [partyMode, productType, currency, debouncedQ, page, refreshKey, sortAction]);

  const partyColumn =
    partyMode === "Internal"
      ? "Internal Party"
      : partyMode === "Customer"
        ? "Customer Name"
        : "Party";

  const exposureRows = useMemo(
    () =>
      rows.slice(0, 8).map((r) => ({
        id: r.id,
        opening: formatTxnMoney(Math.max(0, r.balanceNum - r.creditNum + r.debitNum), r.currency),
        debit: formatTxnMoney(r.debitNum, r.currency),
        closing: r.balance,
      })),
    [rows],
  );

  const donutShares = useMemo(() => {
    const shares = summary?.byProductType ?? [];
    const total = shares.reduce((acc, s) => acc + (Number(s.balance) || 0), 0) || 1;
    const palette = ["#00bcd4", "#ffa74f", "#f06292", "#60a5fa", "#4ade80"];
    return shares.slice(0, 5).map((s, i) => ({
      label: s.productType,
      pct: Math.round(((Number(s.balance) || 0) / total) * 100),
      color: palette[i % palette.length],
      balance: Number(s.balance) || 0,
    }));
  }, [summary]);

  return (
    <div className="cbal">
      {feedbackUi}
      <header className="cbal-banner">
        <h1>Contract Balances</h1>
        {summary ? (
          <p className="cbal-banner-meta">
            {summary.totalContracts} contracts ·{" "}
            {formatTxnMoney(summary.totalBalance, currency !== "All" ? currency : "NGN")}
          </p>
        ) : null}
      </header>

      <ContractTypeTabs />
      {loadError ? <p role="alert">{loadError}</p> : null}

      <div className="cbal-filters">
        <div className="cbal-field">
          <span>Product Type</span>
          <FilterDropdown
            aria-label="Product type"
            className="cbal-fdrop"
            triggerClassName="cbal-fdrop-trigger"
            options={CONTRACT_PRODUCT_FILTERS}
            value={productType}
            onSelect={setProductType}
            trigger={
              <>
                <span className="cbal-fdrop-value">{productType}</span>
                <ChevronDown />
              </>
            }
          />
        </div>
        <div className="cbal-field">
          <span>Customer/Internal</span>
          <FilterDropdown
            aria-label="Customer or Internal"
            className="cbal-fdrop"
            triggerClassName="cbal-fdrop-trigger"
            options={PARTY_SCOPES}
            value={partyMode}
            onSelect={(v) => setPartyMode(v as PartyScope)}
            trigger={
              <>
                <span className="cbal-fdrop-value">{partyMode}</span>
                <ChevronDown />
              </>
            }
          />
        </div>
        <div className="cbal-field">
          <span>Currency</span>
          <FilterDropdown
            aria-label="Currency"
            className="cbal-fdrop"
            triggerClassName="cbal-fdrop-trigger"
            options={CURRENCY_FILTERS}
            value={currency}
            onSelect={setCurrency}
            align="center"
            trigger={
              <>
                <span className="cbal-fdrop-value">{currency}</span>
                <ChevronDown />
              </>
            }
          />
        </div>
        <label className="cbal-field">
          <span>As-of Date</span>
          <div className="cbal-date">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <CalendarIcon />
          </div>
        </label>
        <label className="cbal-field">
          <span>Contract ID</span>
          <input
            className="cbal-search-input"
            placeholder="Search"
            value={contractId}
            onChange={(e) => setContractId(e.target.value)}
          />
        </label>
        <div className="cbal-field">
          <span>
            <FilterIcon /> Filter
          </span>
          <FilterDropdown
            aria-label="Sort and table actions"
            className="cbal-fdrop"
            triggerClassName="cbal-fdrop-trigger"
            options={TABLE_OVERFLOW_ACTIONS}
            value={sortAction}
            onSelect={(v) => {
              if (v === "Refresh Table") {
                setSortAction("Sort By Amount");
                setContractId("");
                setRefreshKey((k) => k + 1);
                return;
              }
              setSortAction(v);
            }}
            trigger={
              <>
                <span className="cbal-fdrop-value">
                  {sortAction.startsWith("Sort") ? sortAction : "Sort By Amount"}
                </span>
                <ChevronDown />
              </>
            }
          />
        </div>
      </div>

      <div className="cbal-actions">
        <button type="button" className="cbal-btn cbal-btn--primary" onClick={() => setAddOpen(true)}>
          + Add Contract
        </button>
        <button type="button" className="cbal-btn cbal-btn--orange" onClick={() => setReverseOpen(true)}>
          Terminate
        </button>
      </div>

      <div className="cbal-table-wrap">
        <table className="cbal-table">
          <thead>
            <tr>
              <th>Contract ID</th>
              <th>{partyColumn}</th>
              <th>Product Type</th>
              <th>Currency</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Last Activity Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", color: "#6b7280", padding: "1.5rem" }}>
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", color: "#6b7280", padding: "1.5rem" }}>
                  No contract balances yet. Use + Add Contract.
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
                  <td>{row.party}</td>
                  <td>{row.productType}</td>
                  <td>{row.currency}</td>
                  <td>{row.debit}</td>
                  <td>{row.credit}</td>
                  <td>{row.balance}</td>
                  <td>
                    <span className={`cbal-status cbal-status--${row.status.toLowerCase()}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>{row.lastActivity}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="cbal-pager">
        <span>
          {loading ? "…" : totalElements === 0 ? "0 results" : `${fromIdx}–${toIdx} of ${totalElements}`}
        </span>
        <div className="cbal-pager-actions">
          <button type="button" disabled={page <= 0 || loading} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            Previous
          </button>
          <span>
            Page {totalElements === 0 ? 0 : page + 1} of {totalElements === 0 ? 0 : totalPages}
          </span>
          <button
            type="button"
            disabled={page + 1 >= totalPages || loading || totalElements === 0}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      <section className="cbal-exposure">
        <h2>Contract Exposure Breakdown</h2>
        <div className="cbal-exposure-grid">
          <div className="cbal-card">
            <table className="cbal-mini-table">
              <thead>
                <tr>
                  <th>Contract ID</th>
                  <th>Opening Balance</th>
                  <th>Debit</th>
                  <th>Closing</th>
                </tr>
              </thead>
              <tbody>
                {exposureRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "#6b7280" }}>
                      —
                    </td>
                  </tr>
                ) : (
                  exposureRows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.opening}</td>
                      <td>{r.debit}</td>
                      <td>{r.closing}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="cbal-card cbal-donut-card">
            <h3>Balance Trend</h3>
            <BalanceTrendDonut shares={donutShares} />
            <div className="cbal-legend">
              {donutShares.length === 0 ? (
                <span>No product mix yet</span>
              ) : (
                donutShares.map((s) => (
                  <span key={s.label}>
                    <i style={{ background: s.color }} /> {s.label}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="cbal-card cbal-line-card">
            <div className="cbal-line-head">
              <h3>Line</h3>
              <button type="button" onClick={() => setMoreOpen(true)}>
                MORE
              </button>
            </div>
            <LineTrendChart />
            <div className="cbal-legend">
              <span>
                <i className="is-blue" /> Balance
              </span>
              <span>
                <i className="is-green" /> Credit
              </span>
            </div>
          </div>
        </div>
      </section>

      {addOpen
        ? createPortal(
            <AddContractModal
              onClose={() => setAddOpen(false)}
              onDone={(msg) => {
                showSuccess(msg);
                setAddOpen(false);
                setRefreshKey((k) => k + 1);
              }}
            />,
            document.body,
          )
        : null}
      {reverseOpen
        ? createPortal(
            <ReverseContractModal
              rows={rows}
              initialId={selectedId}
              asOfDate={date}
              onClose={() => setReverseOpen(false)}
              onDone={(msg) => {
                showSuccess(msg);
                setReverseOpen(false);
                setSelectedId(null);
                setRefreshKey((k) => k + 1);
              }}
            />,
            document.body,
          )
        : null}
      {moreOpen
        ? createPortal(
            <ViewDetailsModal
              title="Balance Summary"
              fields={[
                { label: "Total contracts", value: String(summary?.totalContracts ?? 0) },
                {
                  label: "Total balance",
                  value: formatTxnMoney(summary?.totalBalance, currency !== "All" ? currency : "NGN"),
                },
                {
                  label: "By product",
                  value:
                    (summary?.byProductType ?? [])
                      .map((s) => `${s.productType}: ${s.count} / ${formatTxnMoney(s.balance)}`)
                      .join(" · ") || "—",
                },
              ]}
              onClose={() => setMoreOpen(false)}
            />,
            document.body,
          )
        : null}
    </div>
  );
}

function AddContractModal({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [contractType, setContractType] = useState<string>(CONTRACT_PARTY_TYPES[0]);
  const [product, setProduct] = useState<string>(INSTRUMENT_PRODUCT_CODES[0]);
  const [currency, setCurrency] = useState<string>(CURRENCY_CODES[1] ?? "NGN");
  const [principal, setPrincipal] = useState("500000");
  const [tenure, setTenure] = useState<string>(TENOR_MONTHS[2]);
  const [frequency, setFrequency] = useState<string>(PAYMENT_FREQUENCIES[0]);
  const [bankGuarantee, setBankGuarantee] = useState<string>(YES_NO[1]);
  const [referenceTxn, setReferenceTxn] = useState<string>(REFERENCE_TRANSACTIONS[0]);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [maturityDate, setMaturityDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rate, setRate] = useState("12.5");
  const [active, setActive] = useState(true);
  const [description, setDescription] = useState("");
  const [principalGl, setPrincipalGl] = useState<string>(PRINCIPAL_GL_UNIQUE[0]);
  const [interestGl, setInterestGl] = useState<string>(INTEREST_GL_UNIQUE[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const amt = parseAmount(principal);
      const code = productCodeFromLabel(product);
      const settlement = principalGl.replace(/[^A-Za-z0-9_.:-]/g, "").slice(0, 30) || "10001";
      const isInternal = contractType === "Internal";
      const isPlacementOrFx = /PLACE|FOREX|FX|CALL/i.test(product) || isInternal;

      if (/LOAN/i.test(product)) {
        const created = (await createLoan({
          applicationReference: `LN-${Date.now()}`,
          customerId: "00000000-0000-0000-0000-000000000001",
          productCode: code,
          disbursementAccount: settlement,
          amount: amt,
          tenorMonths: tenorMonths(tenure),
          applicationDate: startDate,
          purpose: description || frequency,
        })) as { loanNumber?: string; id?: string };
        const loanNumber = String(created.loanNumber ?? created.id ?? "");
        if (loanNumber && active) {
          try {
            await disburseLoan(loanNumber, startDate);
          } catch {
            /* maker-checker may apply */
          }
        }
        onDone(`Loan ${loanNumber || "created"}`);
        return;
      }

      if (isPlacementOrFx) {
        const ref = `TD-${Date.now()}`;
        const deal = (await createTreasuryDeal({
          requestReference: ref,
          dealType: /FX|FOREX/i.test(product) ? "FX_SPOT" : "MONEY_MARKET_PLACEMENT",
          deskCode: "MM-DESK",
          dealerId: "TRADER",
          counterpartyId: isInternal ? "INTERNAL" : "BANK",
          baseCurrency: currency,
          notionalAmount: amt,
          tradeDate: startDate,
          valueDate: startDate,
          maturityDate,
        })) as { dealReference?: string; reference?: string };
        const dealRef = String(deal.dealReference ?? deal.reference ?? ref);
        if (active) {
          try {
            await bookTreasuryDeal(dealRef);
          } catch {
            /* optional */
          }
        }
        onDone(`Treasury deal ${dealRef}`);
        return;
      }

      const created = (await createInvestment({
        applicationReference: `INV-${Date.now()}`,
        customerId: "00000000-0000-0000-0000-000000000001",
        productCode: code,
        settlementAccount: settlement,
        amount: amt,
        tenorDays: Math.max(1, tenorMonths(tenure) * 30),
        applicationDate: startDate,
        rolloverOption: "NONE",
        annualInterestRate: parseAmount(rate) || undefined,
      })) as { investmentNumber?: string; id?: string };
      const num = String(created.investmentNumber ?? created.id ?? "");
      if (num && active) {
        try {
          await bookInvestment(num, startDate);
        } catch {
          /* optional */
        }
      }
      onDone(`Investment ${num || "created"}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gem-backdrop cbal-gem-backdrop" role="presentation" onClick={onClose}>
      <div
        className="gem-modal gem-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-contract-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <h2 id="add-contract-title">ADD NEW CONTRACT</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        {error ? <p role="alert">{error}</p> : null}

        <div className="gem-grid">
          <label>
            <span>Contract Type</span>
            <select value={contractType} onChange={(e) => setContractType(e.target.value)}>
              {CONTRACT_PARTY_TYPES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Contract Product</span>
            <select value={product} onChange={(e) => setProduct(e.target.value)}>
              {INSTRUMENT_PRODUCT_CODES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Currency</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCY_CODES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Principal Amount</span>
            <input value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="500000" />
          </label>
          <label>
            <span>Tenure</span>
            <select value={tenure} onChange={(e) => setTenure(e.target.value)}>
              {TENOR_MONTHS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Payment Frequency</span>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              {PAYMENT_FREQUENCIES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Start Date</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label>
            <span>Maturity Date</span>
            <input type="date" value={maturityDate} onChange={(e) => setMaturityDate(e.target.value)} />
          </label>
          <label>
            <span>Interest Rate</span>
            <input value={rate} onChange={(e) => setRate(e.target.value)} />
          </label>
          <label>
            <span>Bank Guarantee</span>
            <select value={bankGuarantee} onChange={(e) => setBankGuarantee(e.target.value)}>
              {YES_NO.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Reference Transaction</span>
            <select value={referenceTxn} onChange={(e) => setReferenceTxn(e.target.value)}>
              {[...new Set(REFERENCE_TRANSACTIONS)].map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Book immediately</span>
            <select
              value={active ? "true" : "false"}
              onChange={(e) => setActive(e.target.value === "true")}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>
        </div>

        <label className="gem-desc">
          <span>Description</span>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional narration"
          />
        </label>

        <div className="gem-grid">
          <label>
            <span>Principal GL</span>
            <select value={principalGl} onChange={(e) => setPrincipalGl(e.target.value)}>
              {PRINCIPAL_GL_UNIQUE.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Interest GL</span>
            <select value={interestGl} onChange={(e) => setInterestGl(e.target.value)}>
              {INTEREST_GL_UNIQUE.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
        </div>

        <footer>
          <button type="button" className="gem-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="gem-primary" disabled={busy} onClick={() => void submit()}>
            {busy ? "Posting…" : "Post contract"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function ReverseContractModal({
  rows,
  initialId,
  asOfDate,
  onClose,
  onDone,
}: {
  rows: BalanceRow[];
  initialId: string | null;
  asOfDate: string;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [contractId, setContractId] = useState(initialId ?? rows[0]?.id ?? "");
  const [reason, setReason] = useState("Requested By Customer");
  const [date, setDate] = useState(asOfDate);
  const [sourceOverride, setSourceOverride] = useState("INVESTMENT");
  const [settlementAccount, setSettlementAccount] = useState("10001");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = rows.find((r) => r.id === contractId) ?? null;
  const source = selected?.sourceType || sourceOverride;

  async function submit() {
    if (!contractId.trim()) {
      setError("Enter a contract ID");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const settlement = settlementAccount.replace(/[^A-Za-z0-9_.:-]/g, "").slice(0, 30) || "10001";
      if (source === "LOAN") {
        await liquidateLoan(contractId.trim(), {
          settlementAccount: settlement,
          valueDate: date,
          narration: reason,
        });
      } else if (source === "TREASURY") {
        await cancelTreasuryDeal(contractId.trim(), reason);
      } else {
        await liquidateInvestment(contractId.trim(), {
          valueDate: date,
          narration: reason,
          settlementAccount: settlement,
        });
      }
      onDone(`Terminated ${contractId.trim()}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Terminate failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gem-backdrop cbal-gem-backdrop" role="presentation" onClick={onClose}>
      <div className="gem-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>Terminate Contract</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        {error ? <p role="alert">{error}</p> : null}
        <div className="gem-grid">
          <label>
            <span>Contract ID</span>
            {rows.length > 0 ? (
              <select value={contractId} onChange={(e) => setContractId(e.target.value)}>
                {rows.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} · {r.productType}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={contractId}
                onChange={(e) => setContractId(e.target.value)}
                placeholder="e.g. INV-… / LN-… / deal ref"
                autoFocus
              />
            )}
          </label>
          <label>
            <span>Source type</span>
            <select
              value={selected?.sourceType || sourceOverride}
              onChange={(e) => setSourceOverride(e.target.value)}
              disabled={!!selected}
            >
              <option value="INVESTMENT">INVESTMENT</option>
              <option value="LOAN">LOAN</option>
              <option value="TREASURY">TREASURY</option>
            </select>
          </label>
          <label>
            <span>Value date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            <span>Settlement account</span>
            <input
              value={settlementAccount}
              onChange={(e) => setSettlementAccount(e.target.value)}
              placeholder="10001"
            />
          </label>
        </div>
        <label className="gem-desc">
          Reason
          <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        {selected ? (
          <p className="gem-warn">
            {selected.sourceType} · {selected.party} · {selected.balance}
          </p>
        ) : null}
        <footer>
          <button type="button" className="gem-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="gem-primary" disabled={busy || !contractId.trim()} onClick={() => void submit()}>
            {busy ? "Working…" : "Terminate"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function BalanceTrendDonut({
  shares,
}: {
  shares: Array<{ label: string; pct: number; color: string }>;
}) {
  const circumference = 2 * Math.PI * 54;
  let offset = 0;
  const arcs =
    shares.length === 0
      ? [{ color: "#eceff1", dash: circumference, offset: 0 }]
      : shares.map((s) => {
          const dash = (Math.max(s.pct, 1) / 100) * circumference;
          const arc = { color: s.color, dash, offset: -offset };
          offset += dash;
          return arc;
        });
  const top = shares[0];

  return (
    <div className="cbal-donut">
      <svg viewBox="0 0 160 160" width="160" height="160" aria-hidden>
        <circle cx="80" cy="80" r="54" fill="none" stroke="#eceff1" strokeWidth="28" />
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx="80"
            cy="80"
            r="54"
            fill="none"
            stroke={a.color}
            strokeWidth="28"
            strokeDasharray={`${a.dash} ${circumference}`}
            strokeDashoffset={a.offset}
            transform="rotate(-90 80 80)"
          />
        ))}
      </svg>
      <div className="cbal-donut-center">
        <strong>{top ? `${top.pct}%` : "—"}</strong>
        <span>{top?.label ?? "None"}</span>
      </div>
    </div>
  );
}

function LineTrendChart() {
  return (
    <svg viewBox="0 0 280 140" className="cbal-line-svg" role="img" aria-label="Balance trend line">
      <g stroke="#e5e7eb" strokeWidth="1">
        {[0, 20, 40, 60, 80, 100].map((y) => (
          <line key={y} x1="28" x2="270" y1={120 - y} y2={120 - y} />
        ))}
      </g>
      <polyline
        fill="rgba(96, 165, 250, 0.25)"
        stroke="#60a5fa"
        strokeWidth="2"
        points="28,90 70,55 112,40 154,48 196,70 238,85 270,78"
      />
      <polyline
        fill="rgba(134, 239, 172, 0.28)"
        stroke="#4ade80"
        strokeWidth="2"
        points="28,100 70,70 112,50 154,65 196,88 238,95 270,92"
      />
      {["May", "June", "July", "Aug", "Sep", "Oct"].map((m, i) => (
        <text key={m} x={28 + i * 42} y="136" fontSize="9" fill="#9ca3af">
          {m}
        </text>
      ))}
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3.5v3M16 3.5v3M3.5 9.5h17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
