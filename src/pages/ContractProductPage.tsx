import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ContractTypeTabs } from "../components/ContractTypeTabs";
import {
  BRANCH_CODES,
  CONTRACT_PARTY_TYPES,
  COST_CENTERS,
  CUSTOMER_ACCOUNT_TYPES,
  INSTRUMENT_PRODUCT_CODES,
} from "../data/accountTypeOptions";
import { CURRENCY_CODES, TENOR_MONTHS } from "../data/filterDropdownOptions";
import "./ContractProductPage.css";
import "./GlEntryModals.css";
import { listInvestments, listLoans, listTreasuryDeals } from "../api/domain";
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

type SourceType = "LOAN" | "INVESTMENT" | "TREASURY";

type ProductRow = {
  id: string;
  sourceType: SourceType;
  customerName: string;
  contractType: string;
  productType: string;
  currency: string;
  principal: string;
  principalNum: number;
  tenure: string;
  interestRate: string;
  startDate: string;
  maturityDate: string;
  autoRollover: string;
  status: string;
  glInterest: string;
  glPrincipal: string;
  branchCode: string;
};

type ModalState =
  | { kind: "view"; row: ProductRow }
  | { kind: "add" }
  | { kind: "terminate"; row: ProductRow | null }
  | null;

const PAGE_SIZE = 20;
const PRODUCT_FILTERS = ["All", ...CUSTOMER_ACCOUNT_TYPES] as const;
const CURRENCY_FILTERS = ["All", ...CURRENCY_CODES] as const;
const BRANCH_FILTERS = ["All", ...BRANCH_CODES] as const;

function toList(res: unknown): Record<string, unknown>[] {
  if (Array.isArray(res)) return res as Record<string, unknown>[];
  if (res && typeof res === "object" && "content" in res && Array.isArray((res as { content: unknown }).content)) {
    return (res as { content: Record<string, unknown>[] }).content;
  }
  return [];
}

function mapProductLabel(code: string | undefined, fallback: string): string {
  if (!code) return fallback;
  const upper = code.toUpperCase();
  if (upper.includes("FD") || upper.includes("FIXED")) return "Fixed Deposit";
  if (upper.includes("TB") || upper.includes("TBILL") || upper.includes("TREASURY")) return "Treasury Bill";
  if (upper.includes("BOND")) return "Bond";
  if (upper.includes("PLACE") || upper.includes("CALL")) return "Placement";
  if (upper.includes("LOAN")) return "Loan Account";
  if (upper.includes("FX") || upper.includes("FOREX")) return "Placement";
  return code;
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
  if (p.includes("SAVINGS")) return "SAVINGS";
  if (p.includes("CURRENT")) return "CURRENT";
  return product.replace(/\s+/g, "_").slice(0, 40) || "TBILL";
}

function parseAmount(raw: string): string {
  return String(raw ?? "").replace(/[^0-9.]/g, "") || "0";
}

function tenorMonths(raw: string): number {
  return Number(String(raw).replace(/\D/g, "")) || 12;
}

function fromInvestment(item: Record<string, unknown>): ProductRow {
  const currency = String(item.currency ?? "NGN");
  const principalNum = Number(item.currentPrincipal ?? item.originalPrincipal ?? item.amount ?? 0) || 0;
  const tenorDays = Number(item.tenorDays ?? 0) || 0;
  const rollover = String(item.rolloverOption ?? "");
  return {
    id: String(item.investmentNumber ?? item.id ?? "—"),
    sourceType: "INVESTMENT",
    customerName: String(item.customerName ?? item.customerId ?? "—"),
    contractType: "Customer",
    productType: mapProductLabel(String(item.productCode ?? ""), "Fixed Deposit"),
    currency,
    principal: formatTxnMoney(principalNum, currency),
    principalNum,
    tenure: tenorDays ? `${tenorDays} Days` : "—",
    interestRate: String(item.annualInterestRate ?? "—"),
    startDate: formatTxnDate(null, String(item.bookingDate ?? item.applicationDate ?? "")),
    maturityDate: formatTxnDate(null, String(item.maturityDate ?? "")),
    autoRollover: /NONE|NO/i.test(rollover) || !rollover ? "No" : "Yes",
    status: String(item.status ?? "—"),
    glInterest: "—",
    glPrincipal: String(item.settlementAccount ?? "—"),
    branchCode: String(item.branchCode ?? ""),
  };
}

function fromLoan(item: Record<string, unknown>): ProductRow {
  const currency = String(item.currency ?? "NGN");
  const principalNum = Number(item.principalAmount ?? item.outstandingPrincipal ?? 0) || 0;
  const tenor = Number(item.tenorMonths ?? 0) || 0;
  return {
    id: String(item.loanNumber ?? item.id ?? "—"),
    sourceType: "LOAN",
    customerName: String(item.customerName ?? item.customerId ?? "—"),
    contractType: "Customer",
    productType: mapProductLabel(String(item.productCode ?? ""), "Loan Account"),
    currency,
    principal: formatTxnMoney(principalNum, currency),
    principalNum,
    tenure: tenor ? `${tenor} Months` : "—",
    interestRate: String(item.annualInterestRate ?? "—"),
    startDate: formatTxnDate(null, String(item.disbursementDate ?? item.applicationDate ?? "")),
    maturityDate: formatTxnDate(null, String(item.maturityDate ?? "")),
    autoRollover: "No",
    status: String(item.status ?? "—"),
    glInterest: "—",
    glPrincipal: String(item.disbursementAccount ?? "—"),
    branchCode: String(item.branchCode ?? ""),
  };
}

function fromTreasury(item: Record<string, unknown>): ProductRow {
  const currency = String(item.baseCurrency ?? item.currency ?? "NGN");
  const principalNum = Number(item.notionalAmount ?? item.lastMarketValue ?? 0) || 0;
  const dealType = String(item.dealType ?? "");
  return {
    id: String(item.dealReference ?? item.reference ?? item.id ?? "—"),
    sourceType: "TREASURY",
    customerName: String(item.counterpartyId ?? item.deskCode ?? "—"),
    contractType: "Internal",
    productType: mapProductLabel(dealType, "Placement"),
    currency,
    principal: formatTxnMoney(principalNum, currency),
    principalNum,
    tenure: "—",
    interestRate: "—",
    startDate: formatTxnDate(null, String(item.valueDate ?? item.tradeDate ?? "")),
    maturityDate: formatTxnDate(null, String(item.maturityDate ?? "")),
    autoRollover: "No",
    status: String(item.status ?? "—"),
    glInterest: "—",
    glPrincipal: "—",
    branchCode: String(item.deskCode ?? ""),
  };
}

function matchesProductFilter(row: ProductRow, filter: string): boolean {
  if (filter === "All") return true;
  const f = filter.toLowerCase();
  const p = row.productType.toLowerCase();
  if (f.includes("loan")) return row.sourceType === "LOAN" || p.includes("loan");
  if (f.includes("placement")) return row.sourceType === "TREASURY" || p.includes("placement") || p.includes("fx");
  if (f.includes("fixed")) return p.includes("fixed") || p.includes("fd");
  if (f.includes("treasury")) return p.includes("treasury") || p.includes("tbill") || p.includes("bill");
  if (f.includes("savings") || f.includes("current")) return p.includes(f.split(" ")[0] ?? f);
  return p.includes(f) || row.productType === filter;
}

export function ContractProductPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [branch, setBranch] = useState<string>("All");
  const [currency, setCurrency] = useState<string>("All");
  const [costCenter, setCostCenter] = useState<string>(COST_CENTERS[0]);
  const [productType, setProductType] = useState<string>("All");
  const [modal, setModal] = useState<ModalState>(null);
  const [allRows, setAllRows] = useState<ProductRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const { showSuccess, feedbackUi } = useActionFeedback();

  useEffect(() => {
    setPage(0);
  }, [from, to, branch, currency, productType]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [invRes, loanRes, treasRes] = await Promise.all([
          listInvestments({ size: 100, from, to }),
          listLoans({ size: 100, from, to }),
          listTreasuryDeals({ size: 100 }),
        ]);
        if (cancelled) return;
        const mapped = [
          ...toList(invRes).map(fromInvestment),
          ...toList(loanRes).map(fromLoan),
          ...toList(treasRes).map(fromTreasury),
        ];
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
  }, [from, to, refreshKey]);

  const filtered = useMemo(() => {
    return allRows.filter((r) => {
      if (currency !== "All" && r.currency.toUpperCase() !== currency.toUpperCase()) return false;
      if (branch !== "All" && r.branchCode && r.branchCode !== branch) return false;
      if (!matchesProductFilter(r, productType)) return false;
      return true;
    });
  }, [allRows, currency, branch, productType]);

  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE) || 1);
  const pageSafe = Math.min(page, totalPages - 1);
  const rows = filtered.slice(pageSafe * PAGE_SIZE, pageSafe * PAGE_SIZE + PAGE_SIZE);
  const fromIdx = totalElements === 0 ? 0 : pageSafe * PAGE_SIZE + 1;
  const toIdx = Math.min((pageSafe + 1) * PAGE_SIZE, totalElements);
  const selected = filtered.find((r) => r.id === selectedId) ?? null;

  function exportCsv() {
    const header = [
      "Contract ID",
      "Source",
      "Customer Name",
      "Contract Type",
      "Product Type",
      "Currency",
      "Principal",
      "Tenure",
      "Interest Rate",
      "Start Date",
      "Maturity Date",
      "Auto Rollover",
      "Status",
    ];
    const lines = [
      header.join(","),
      ...filtered.map((r) =>
        [
          r.id,
          r.sourceType,
          r.customerName,
          r.contractType,
          r.productType,
          r.currency,
          r.principal,
          r.tenure,
          r.interestRate,
          r.startDate,
          r.maturityDate,
          r.autoRollover,
          r.status,
        ]
          .map((v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v))
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contract-products.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="cprod">
      {feedbackUi}
      <h1>Contract Product</h1>
      {loadError ? <p role="alert">{loadError}</p> : null}

      <ContractTypeTabs />

      <div className="cprod-filters">
        <div className="cprod-field cprod-field--range">
          <span>Date Range</span>
          <div className="cprod-range">
            <span>From</span>
            <div className="cprod-date">
              <CalendarIcon />
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <span>To</span>
            <div className="cprod-date">
              <CalendarIcon />
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        </div>
        <label className="cprod-field">
          <span>Branch Code</span>
          <div className="cprod-select">
            <select value={branch} onChange={(e) => setBranch(e.target.value)}>
              {BRANCH_FILTERS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="cprod-field">
          <span>Currency</span>
          <div className="cprod-select">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCY_FILTERS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="cprod-field">
          <span>Cost center</span>
          <div className="cprod-select">
            <select value={costCenter} onChange={(e) => setCostCenter(e.target.value)}>
              {COST_CENTERS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <label className="cprod-field">
          <span>Product Type</span>
          <div className="cprod-select">
            <select value={productType} onChange={(e) => setProductType(e.target.value)}>
              {PRODUCT_FILTERS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
      </div>

      <div className="cprod-actions">
        <div className="cprod-actions-left">
          <button type="button" className="cprod-btn cprod-btn--add" onClick={() => setModal({ kind: "add" })}>
            <PlusIcon /> + Add Contract
          </button>
          <button
            type="button"
            className="cprod-btn cprod-btn--terminate"
            onClick={() => setModal({ kind: "terminate", row: selected ?? rows[0] ?? null })}
          >
            <SwapIcon /> Terminate
          </button>
        </div>
        <div className="cprod-actions-right">
          <button type="button" className="cprod-btn cprod-btn--export" onClick={exportCsv}>
            <ExportIcon /> Export
          </button>
          <button type="button" className="cprod-btn cprod-btn--preview" onClick={() => window.print()}>
            <PreviewIcon /> Preview
          </button>
        </div>
      </div>

      <div className="cprod-table-wrap">
        <table className="cprod-table">
          <thead>
            <tr>
              <th>Contract ID</th>
              <th>Customer Name</th>
              <th>Contract Type</th>
              <th>Product Type</th>
              <th>Currency</th>
              <th>Principal Amount</th>
              <th>Tenure</th>
              <th>Interest Rate</th>
              <th>Start Date</th>
              <th>Maturity Date</th>
              <th>Auto Rollover</th>
              <th>Status</th>
              <th>GL Account (Interest)</th>
              <th>GL Account (Principal)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={15} style={{ textAlign: "center", color: "#6b7280", padding: "1.5rem" }}>
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={15} style={{ textAlign: "center", color: "#6b7280", padding: "1.5rem" }}>
                  No contracts yet. Use + Add Contract.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={`${row.sourceType}-${row.id}`}
                  className={selectedId === row.id ? "is-selected" : undefined}
                  onClick={() => setSelectedId(row.id)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{row.id}</td>
                  <td>{row.customerName}</td>
                  <td>{row.contractType}</td>
                  <td>{row.productType}</td>
                  <td>{row.currency}</td>
                  <td>{row.principal}</td>
                  <td>{row.tenure}</td>
                  <td>{row.interestRate}</td>
                  <td>{row.startDate}</td>
                  <td>{row.maturityDate}</td>
                  <td>{row.autoRollover}</td>
                  <td>{row.status}</td>
                  <td>{row.glInterest}</td>
                  <td>{row.glPrincipal}</td>
                  <td>
                    <div className="cprod-row-actions">
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

      <div className="cprod-pager">
        <span>
          {loading ? "…" : totalElements === 0 ? "0 results" : `${fromIdx}–${toIdx} of ${totalElements}`}
        </span>
        <div className="cprod-pager-actions">
          <button
            type="button"
            disabled={pageSafe <= 0 || loading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
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

      {modal?.kind === "view"
        ? createPortal(
            <ViewDetailsModal
              title="View Contract"
              fields={[
                { label: "Contract ID", value: modal.row.id },
                { label: "Source", value: modal.row.sourceType },
                { label: "Customer Name", value: modal.row.customerName },
                { label: "Contract Type", value: modal.row.contractType },
                { label: "Product Type", value: modal.row.productType },
                { label: "Currency", value: modal.row.currency },
                { label: "Principal", value: modal.row.principal },
                { label: "Tenure", value: modal.row.tenure },
                { label: "Interest Rate", value: `${modal.row.interestRate}%` },
                { label: "Start Date", value: modal.row.startDate, date: true },
                { label: "Maturity Date", value: modal.row.maturityDate, date: true },
                { label: "Status", value: modal.row.status },
                { label: "Principal GL / settlement", value: modal.row.glPrincipal },
              ]}
              onClose={() => setModal(null)}
            />,
            document.body,
          )
        : null}
      {modal?.kind === "add"
        ? createPortal(
            <AddContractModal
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
      {modal?.kind === "terminate"
        ? createPortal(
            <TerminateContractModal
              initial={modal.row}
              knownRows={filtered}
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
  const [rate, setRate] = useState("12.5");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [maturityDate, setMaturityDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [customer, setCustomer] = useState("");
  const [settlement, setSettlement] = useState("10001");
  const [bookNow, setBookNow] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const amt = parseAmount(principal);
      const code = productCodeFromLabel(product);
      const account = settlement.replace(/[^A-Za-z0-9_.:-]/g, "").slice(0, 30) || "10001";
      const isInternal = contractType === "Internal";
      const isLoan = /LOAN/i.test(product) || /LOAN/i.test(code);
      const isPlacementOrFx = /PLACE|FOREX|FX|CALL/i.test(product) || isInternal;

      if (isLoan) {
        const created = (await createLoan({
          applicationReference: `LN-${Date.now()}`,
          customerId: customer.trim() || "00000000-0000-0000-0000-000000000001",
          productCode: code,
          disbursementAccount: account,
          amount: amt,
          tenorMonths: tenorMonths(tenure),
          applicationDate: startDate,
          purpose: "Contract product UI",
        })) as { loanNumber?: string; id?: string };
        const loanNumber = String(created.loanNumber ?? created.id ?? "");
        if (loanNumber && bookNow) {
          try {
            await disburseLoan(loanNumber, startDate);
          } catch {
            /* maker-checker */
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
          counterpartyId: customer.trim() || (isInternal ? "INTERNAL" : "BANK"),
          baseCurrency: currency,
          notionalAmount: amt,
          tradeDate: startDate,
          valueDate: startDate,
          maturityDate,
        })) as { dealReference?: string; reference?: string };
        const dealRef = String(deal.dealReference ?? deal.reference ?? ref);
        if (bookNow) {
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
        customerId: customer.trim() || "00000000-0000-0000-0000-000000000001",
        productCode: code,
        settlementAccount: account,
        amount: amt,
        tenorDays: Math.max(1, tenorMonths(tenure) * 30),
        applicationDate: startDate,
        rolloverOption: "NONE",
        annualInterestRate: parseAmount(rate) || undefined,
      })) as { investmentNumber?: string; id?: string };
      const num = String(created.investmentNumber ?? created.id ?? "");
      if (num && bookNow) {
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
    <div className="gem-backdrop cprod-gem-backdrop" role="presentation" onClick={onClose}>
      <div
        className="gem-modal gem-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cprod-add-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <h2 id="cprod-add-title">ADD NEW CONTRACT</h2>
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
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Contract Product</span>
            <select value={product} onChange={(e) => setProduct(e.target.value)}>
              {INSTRUMENT_PRODUCT_CODES.map((o) => (
                <option key={o}>{o}</option>
              ))}
              <option value="PERSONAL_LOAN">Personal Loan</option>
            </select>
          </label>
          <label>
            <span>Currency</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCY_CODES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Principal Amount</span>
            <input value={principal} onChange={(e) => setPrincipal(e.target.value)} />
          </label>
          <label>
            <span>Tenure</span>
            <select value={tenure} onChange={(e) => setTenure(e.target.value)}>
              {TENOR_MONTHS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Interest Rate</span>
            <input value={rate} onChange={(e) => setRate(e.target.value)} />
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
            <span>Customer / Counterparty</span>
            <input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="UUID or counterparty id (optional)"
            />
          </label>
          <label>
            <span>Settlement / Disbursement account</span>
            <input value={settlement} onChange={(e) => setSettlement(e.target.value)} />
          </label>
          <label>
            <span>Book immediately</span>
            <select value={bookNow ? "true" : "false"} onChange={(e) => setBookNow(e.target.value === "true")}>
              <option value="true">Yes</option>
              <option value="false">No</option>
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

function TerminateContractModal({
  initial,
  knownRows,
  onClose,
  onDone,
}: {
  initial: ProductRow | null;
  knownRows: ProductRow[];
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [contractId, setContractId] = useState(initial?.id ?? knownRows[0]?.id ?? "");
  const [sourceOverride, setSourceOverride] = useState<SourceType>(initial?.sourceType ?? "INVESTMENT");
  const [reason, setReason] = useState("Requested By Customer");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [settlementAccount, setSettlementAccount] = useState(
    initial?.glPrincipal && initial.glPrincipal !== "—" ? initial.glPrincipal : "10001",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = knownRows.find((r) => r.id === contractId) ?? null;
  const source = selected?.sourceType ?? sourceOverride;

  async function submit() {
    if (!contractId.trim()) {
      setError("Enter a contract ID");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const settlement = settlementAccount.replace(/[^A-Za-z0-9_.:-]/g, "").slice(0, 30) || "10001";
      const id = contractId.trim();
      if (source === "LOAN") {
        await liquidateLoan(id, {
          settlementAccount: settlement,
          valueDate: date,
          narration: reason,
        });
      } else if (source === "TREASURY") {
        await cancelTreasuryDeal(id, reason);
      } else {
        await liquidateInvestment(id, {
          valueDate: date,
          narration: reason,
          settlementAccount: settlement,
          principalAmount: selected?.principalNum || undefined,
        });
      }
      onDone(`Terminated ${id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Terminate failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gem-backdrop cprod-gem-backdrop" role="presentation" onClick={onClose}>
      <div className="gem-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>TERMINATE CONTRACT</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        {error ? <p role="alert">{error}</p> : null}
        {selected ? (
          <p className="gem-warn">
            {selected.sourceType} · {selected.id} · {selected.productType} · {selected.principal}
          </p>
        ) : null}
        <div className="gem-grid">
          <label>
            <span>Contract ID</span>
            {knownRows.length > 0 ? (
              <select value={contractId} onChange={(e) => setContractId(e.target.value)}>
                {knownRows.map((r) => (
                  <option key={`${r.sourceType}-${r.id}`} value={r.id}>
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
              value={source}
              onChange={(e) => setSourceOverride(e.target.value as SourceType)}
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
            <input value={settlementAccount} onChange={(e) => setSettlementAccount(e.target.value)} />
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
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
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

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SwapIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 7h11M18 7l-3-3M18 7l-3 3M17 17H6M6 17l3-3M6 17l3 3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 16V4M12 4l-4 4M12 4l4 4M5 20h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PreviewIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4v12M12 16l-4-4M12 16l4-4M5 20h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
