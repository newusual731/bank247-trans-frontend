import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CURRENCIES,
  PRODUCT_SETUP_STATUSES,
  PRODUCT_SETUP_TYPES,
  PRODUCT_TERMS,
} from "../data/accountTypeOptions";
import "./ProductSetupPage.css";
import {
  activateCasaProduct,
  activateInvestmentProduct,
  activateLoanProduct,
  createCasaProduct,
  createInvestmentProduct,
  createLoanProduct,
  listCasaProducts,
  listInvestmentProducts,
  listLoanProducts,
  submitCasaProduct,
  submitInvestmentProduct,
  submitLoanProduct,
  type ProductKind,
} from "../api/accounts";
import { ApiError } from "../lib/apiClient";

type ProductRow = {
  kind: ProductKind;
  code: string;
  productType: string;
  productName: string;
  term: string;
  interestRate: string;
  currency: string;
  status: string;
  createdBy: string;
  createdDate: string;
  description: string;
  workflowRequestId?: string | null;
  reportingGl?: string;
  principalGl?: string;
};

const DEMO_ROWS: ProductRow[] = [
  {
    kind: "investments",
    code: "FD90",
    productType: "Fixed Deposit",
    productName: "90 Days FD",
    term: "90 Days",
    interestRate: "6.5%",
    currency: "NGN",
    status: "ACTIVE",
    createdBy: "Admin 02",
    createdDate: "06/15/2025",
    description: "",
    reportingGl: "22001",
  },
  {
    kind: "loans",
    code: "PL001",
    productType: "Loan",
    productName: "Personal Loan",
    term: "12 months",
    interestRate: "18%",
    currency: "NGN",
    status: "ACTIVE",
    createdBy: "Super-Admin 01",
    createdDate: "06/15/2025",
    description: "",
    principalGl: "13001",
  },
];

type Modal = { kind: "add" } | { kind: "view"; row: ProductRow } | null;

function toList(res: unknown): Record<string, unknown>[] {
  if (Array.isArray(res)) return res as Record<string, unknown>[];
  if (res && typeof res === "object" && "content" in res && Array.isArray((res as { content: unknown }).content)) {
    return (res as { content: Record<string, unknown>[] }).content;
  }
  return [];
}

function mapCasa(p: Record<string, unknown>): ProductRow {
  const accountType = String(p.accountType ?? "SAVINGS");
  const productType =
    accountType === "CURRENT"
      ? "Current Account"
      : accountType === "FIXED_DEPOSIT"
        ? "Fixed Deposit"
        : "Savings Account";
  const rate = p.annualInterestRate != null ? `${p.annualInterestRate}%` : "—";
  return {
    kind: "casa",
    code: String(p.code ?? ""),
    productType,
    productName: String(p.name ?? p.code ?? "—"),
    term: "—",
    interestRate: rate,
    currency: String(p.currency ?? "NGN"),
    status: String(p.status ?? "ACTIVE"),
    createdBy: String(p.createdBy ?? "—"),
    createdDate: String(p.createdAt ?? "—"),
    description: String(p.productGroup ?? ""),
    workflowRequestId: (p.workflowRequestId as string | null | undefined) ?? null,
    reportingGl: p.reportingLedgerAccount != null ? String(p.reportingLedgerAccount) : undefined,
  };
}

function mapLoan(p: Record<string, unknown>): ProductRow {
  const min = p.minimumTenorMonths;
  const max = p.maximumTenorMonths;
  const term = min != null && max != null ? `${min}–${max} months` : "—";
  const rate = p.defaultAnnualInterestRate != null ? `${p.defaultAnnualInterestRate}%` : "—";
  return {
    kind: "loans",
    code: String(p.code ?? ""),
    productType: "Loan",
    productName: String(p.name ?? p.code ?? "—"),
    term,
    interestRate: rate,
    currency: String(p.currency ?? "NGN"),
    status: String(p.status ?? "ACTIVE"),
    createdBy: String(p.createdBy ?? "—"),
    createdDate: String(p.createdAt ?? "—"),
    description: "",
    workflowRequestId: (p.workflowRequestId as string | null | undefined) ?? null,
    principalGl: p.principalLedgerAccount != null ? String(p.principalLedgerAccount) : undefined,
  };
}

function mapInvestment(p: Record<string, unknown>): ProductRow {
  const invType = String(p.investmentType ?? "FIXED_DEPOSIT");
  const productType =
    invType === "TREASURY_BILL"
      ? "Treasury Bill"
      : invType === "BOND"
        ? "Bond"
        : invType === "CALL_DEPOSIT"
          ? "Call Deposit"
          : "Fixed Deposit";
  const min = p.minimumTenorDays;
  const max = p.maximumTenorDays;
  const term = min != null && max != null ? `${min}–${max} Days` : "—";
  const rate = p.defaultAnnualInterestRate != null ? `${p.defaultAnnualInterestRate}%` : "—";
  return {
    kind: "investments",
    code: String(p.code ?? ""),
    productType,
    productName: String(p.name ?? p.code ?? "—"),
    term,
    interestRate: rate,
    currency: String(p.currency ?? "NGN"),
    status: String(p.status ?? "ACTIVE"),
    createdBy: String(p.createdBy ?? "—"),
    createdDate: String(p.createdAt ?? "—"),
    description: invType,
    workflowRequestId: (p.workflowRequestId as string | null | undefined) ?? null,
    reportingGl:
      p.principalLiabilityLedgerAccount != null ? String(p.principalLiabilityLedgerAccount) : undefined,
  };
}

function resolveKind(productType: string): ProductKind {
  const t = productType.toLowerCase();
  if (t.includes("loan")) return "loans";
  if (
    t.includes("deposit") ||
    t.includes("treasury") ||
    t.includes("bond") ||
    t.includes("bill") ||
    t.includes("call")
  ) {
    return "investments";
  }
  return "casa";
}

function parseTermDays(term: string): { min: number; max: number } {
  const n = Number(term.replace(/[^0-9]/g, ""));
  if (term.toLowerCase().includes("month")) {
    const months = n || 12;
    return { min: months * 30, max: months * 30 };
  }
  const days = n || 90;
  return { min: days, max: days };
}

function parseTermMonths(term: string): { min: number; max: number } {
  const n = Number(term.replace(/[^0-9]/g, ""));
  if (term.toLowerCase().includes("day")) {
    const months = Math.max(1, Math.round((n || 90) / 30));
    return { min: months, max: months };
  }
  const months = n || 12;
  return { min: months, max: months };
}

function normalizeCurrency(c: string): string {
  const u = c.trim().toUpperCase();
  if (u === "USD" || u === "NGN" || u === "EUR") return u;
  if (u.startsWith("US")) return "USD";
  if (u.startsWith("NG")) return "NGN";
  if (u.startsWith("EU")) return "EUR";
  return "NGN";
}

export function ProductSetupPage() {
  const [productType, setProductType] = useState<string>("All");
  const [currency, setCurrency] = useState<string>(CURRENCIES[0]);
  const [status, setStatus] = useState<string>("All");
  const [modal, setModal] = useState<Modal>(null);
  const [apiRows, setApiRows] = useState<ProductRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [casa, loans, inv] = await Promise.all([
          listCasaProducts({ size: 100 }),
          listLoanProducts({ size: 100 }),
          listInvestmentProducts({ size: 100 }),
        ]);
        if (cancelled) return;
        const mapped: ProductRow[] = [
          ...toList(casa).map(mapCasa),
          ...toList(loans).map(mapLoan),
          ...toList(inv).map(mapInvestment),
        ];
        setApiRows(mapped);
        setLoadError(null);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Load failed");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const displayRows = useMemo(() => {
    let source = apiRows && apiRows.length > 0 ? apiRows : DEMO_ROWS;
    if (status && status !== "All") {
      source = source.filter((r) => r.status.toUpperCase() === status.toUpperCase());
    }
    if (productType && productType !== "All") {
      const needle = productType.toLowerCase();
      const filtered = source.filter(
        (r) =>
          r.productType.toLowerCase().includes(needle) ||
          needle.includes(r.productType.toLowerCase()) ||
          (needle.includes("savings") && r.kind === "casa") ||
          (needle.includes("current") && r.kind === "casa"),
      );
      if (filtered.length || apiRows) source = filtered;
    }
    const ccy = normalizeCurrency(currency);
    if (ccy.length === 3 && currency && currency !== "All") {
      const filtered = source.filter((r) => normalizeCurrency(r.currency) === ccy);
      if (filtered.length || apiRows) source = filtered;
    }
    return source;
  }, [apiRows, productType, status, currency]);

  return (
    <div className="ps">
      <h1>Product Setup</h1>
      <p className="ps-hint">
        Create → Submit for approval → Approve on Approvals → Activate. Map product GLs on GL Mapping
        after charts exist.
      </p>
      {loadError ? <p role="alert">{loadError}</p> : null}

      <div className="ps-filters">
        <label className="ps-field">
          <span>Product Type</span>
          <div className="ps-select">
            <select value={productType} onChange={(e) => setProductType(e.target.value)}>
              {PRODUCT_SETUP_TYPES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <span className="ps-filter-spacer" />
        <label className="ps-field">
          <span>Currency</span>
          <div className="ps-select">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <span className="ps-filter-spacer" />
        <label className="ps-field">
          <span>Status</span>
          <div className="ps-select">
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {PRODUCT_SETUP_STATUSES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
      </div>

      <div className="ps-actions">
        <button type="button" className="ps-btn ps-btn--primary" onClick={() => setModal({ kind: "add" })}>
          +Add New Product
        </button>
        <div className="ps-actions-right">
          <button type="button" className="ps-btn ps-btn--export" onClick={() => window.print()}>
            <ExportIcon /> Export
          </button>
          <button type="button" className="ps-btn ps-btn--print" onClick={() => window.print()}>
            <PrintIcon /> Print
          </button>
        </div>
      </div>

      <div className="ps-table-wrap">
        <table className="ps-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Product Type</th>
              <th>Product Name</th>
              <th>Term</th>
              <th>Interest Rate %</th>
              <th>
                Currency <ChevronDown />
              </th>
              <th>Status</th>
              <th>Reporting / Principal GL</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row) => (
              <tr key={`${row.kind}-${row.code}-${row.productName}`}>
                <td>{row.code || "—"}</td>
                <td>{row.productType}</td>
                <td>{row.productName}</td>
                <td>{row.term}</td>
                <td>{row.interestRate}</td>
                <td>{row.currency}</td>
                <td>{row.status}</td>
                <td>{row.reportingGl || row.principalGl || "—"}</td>
                <td>
                  <div className="ps-row-actions">
                    <button type="button" onClick={() => setModal({ kind: "view", row })}>
                      View
                    </button>
                    <span aria-hidden>·</span>
                    <button type="button" className="ps-edit" onClick={() => setModal({ kind: "view", row })}>
                      Workflow <ChevronDown />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal?.kind === "add" ? (
        <ProductFormModal
          onClose={() => setModal(null)}
          onSaved={(row) => {
            reload();
            setModal({ kind: "view", row });
          }}
        />
      ) : null}
      {modal?.kind === "view" ? (
        <ViewProductModal
          key={`${modal.row.kind}-${modal.row.code}-${modal.row.status}-${modal.row.workflowRequestId ?? ""}`}
          row={modal.row}
          onClose={() => setModal(null)}
          onUpdated={(row) => {
            reload();
            setModal({ kind: "view", row });
          }}
        />
      ) : null}
    </div>
  );
}

function ProductFormModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (row: ProductRow) => void;
}) {
  const [productType, setProductType] = useState("Savings Account");
  const [code, setCode] = useState("");
  const [productName, setProductName] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [term, setTerm] = useState(PRODUCT_TERMS[1]);
  const [interestRate, setInterestRate] = useState("6.5");
  const [description, setDescription] = useState("");

  // CASA GLs
  const [reportingGl, setReportingGl] = useState("");
  const [accrualGl, setAccrualGl] = useState("");
  const [interestExpenseGl, setInterestExpenseGl] = useState("");
  const [whtGl, setWhtGl] = useState("");
  const [vatGl, setVatGl] = useState("");
  const [chargeGl, setChargeGl] = useState("");
  const [minBalance, setMinBalance] = useState("0");
  const [amc, setAmc] = useState("0");

  // Loan GLs
  const [principalGl, setPrincipalGl] = useState("");
  const [interestRecvGl, setInterestRecvGl] = useState("");
  const [interestIncomeGl, setInterestIncomeGl] = useState("");
  const [minAmt, setMinAmt] = useState("10000");
  const [maxAmt, setMaxAmt] = useState("500000");

  // Investment GLs
  const [liabGl, setLiabGl] = useState("");
  const [payableGl, setPayableGl] = useState("");
  const [invExpenseGl, setInvExpenseGl] = useState("");
  const [invWhtGl, setInvWhtGl] = useState("");
  const [penaltyGl, setPenaltyGl] = useState("");

  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const kind = resolveKind(productType);

  async function saveProduct() {
    setBusy(true);
    setSaveError(null);
    try {
      const productCode = (
        code ||
        productName ||
        productType ||
        "PROD"
      )
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, "_")
        .slice(0, 40);
      const name = productName.trim() || productType;
      const ccy = normalizeCurrency(currency);
      const rate = Number(interestRate) || 0;

      if (kind === "loans") {
        const tenor = parseTermMonths(term);
        const p = await createLoanProduct({
          code: productCode,
          name,
          currency: ccy,
          minimumAmount: Number(minAmt) || 1,
          maximumAmount: Number(maxAmt) || 1,
          minimumTenorMonths: tenor.min,
          maximumTenorMonths: Math.max(tenor.min, tenor.max),
          defaultAnnualInterestRate: rate || 0.000001,
          repaymentFrequency: "MONTHLY",
          repaymentMethod: "EQUAL_PRINCIPAL",
          interestBasisDays: 365,
          principalLedgerAccount: principalGl.trim().toUpperCase(),
          interestReceivableLedgerAccount: interestRecvGl.trim().toUpperCase(),
          interestIncomeLedgerAccount: interestIncomeGl.trim().toUpperCase(),
        });
        onSaved(mapLoan(p as unknown as Record<string, unknown>));
        return;
      }

      if (kind === "investments") {
        const tenor = parseTermDays(term);
        const invType =
          productType.toLowerCase().includes("treasury") || productType.toLowerCase().includes("bill")
            ? "TREASURY_BILL"
            : productType.toLowerCase().includes("bond")
              ? "BOND"
              : productType.toLowerCase().includes("call")
                ? "CALL_DEPOSIT"
                : "FIXED_DEPOSIT";
        const p = await createInvestmentProduct({
          code: productCode,
          name,
          investmentType: invType,
          currency: ccy,
          minimumAmount: Number(minAmt) || 1,
          maximumAmount: Number(maxAmt) || 1,
          minimumTenorDays: tenor.min,
          maximumTenorDays: Math.max(tenor.min, tenor.max),
          defaultAnnualInterestRate: rate || 0.000001,
          interestMethod: "SIMPLE",
          interestBasisDays: 365,
          withholdingTaxRate: 10,
          earlyRedemptionPenaltyRate: 0,
          earlyRedemptionPenaltyBasis: "PRINCIPAL",
          principalLiabilityLedgerAccount: liabGl.trim().toUpperCase(),
          interestPayableLedgerAccount: payableGl.trim().toUpperCase(),
          interestExpenseLedgerAccount: invExpenseGl.trim().toUpperCase(),
          withholdingTaxLedgerAccount: invWhtGl.trim().toUpperCase(),
          penaltyIncomeLedgerAccount: penaltyGl.trim().toUpperCase(),
          interestPaymentFrequency: "MATURITY",
          noticePeriodDays: 0,
          contributionFrequency: "NONE",
          contributionAmount: 0,
          stepUpIncrement: 0,
        });
        onSaved(mapInvestment(p as unknown as Record<string, unknown>));
        return;
      }

      const accountType = productType.toLowerCase().includes("current")
        ? "CURRENT"
        : productType.toLowerCase().includes("fixed")
          ? "FIXED_DEPOSIT"
          : "SAVINGS";
      const productGroup =
        accountType === "CURRENT"
          ? "CURRENT.ACCOUNTS-GROUP"
          : accountType === "FIXED_DEPOSIT"
            ? "FIXED.DEPOSIT-GROUP"
            : "SAVINGS.ACCOUNTS-GROUP";
      const p = await createCasaProduct({
        code: productCode,
        name,
        accountType,
        productGroup,
        balanceType: "CREDIT",
        currency: ccy,
        minimumBalance: Number(minBalance) || 0,
        annualInterestRate: rate,
        interestBasisDays: 365,
        reportingLedgerAccount: reportingGl.trim().toUpperCase(),
        interestAccrualLedgerAccount: accrualGl.trim().toUpperCase() || undefined,
        interestExpenseLedgerAccount: interestExpenseGl.trim().toUpperCase() || undefined,
        withholdingTaxLedgerAccount: whtGl.trim().toUpperCase() || undefined,
        vatLedgerAccount: vatGl.trim().toUpperCase() || undefined,
        chargeIncomeLedgerAccount: chargeGl.trim().toUpperCase() || undefined,
        monthlyMaintenanceCharge: Number(amc) || 0,
        cashLiteCharge: 0,
        dormancyInactiveDays: 180,
      });
      onSaved(mapCasa(p as unknown as Record<string, unknown>));
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  const createTypes = PRODUCT_SETUP_TYPES.filter((t) => t !== "All");

  return (
    <div className="ps-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="ps-modal ps-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        {saveError ? <p role="alert">{saveError}</p> : null}
        <header className="ps-modal-head">
          <div>
            <h2 id="product-form-title">Add New Product</h2>
            <h3>Product Details · {kind.toUpperCase()}</h3>
          </div>
          <button type="button" className="ps-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="ps-modal-grid">
          <label className="ps-field">
            <span>Product Type</span>
            <div className="ps-select">
              <select value={productType} onChange={(e) => setProductType(e.target.value)}>
                {createTypes.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </label>
          <label className="ps-field">
            <span>Product Code</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. SAV001"
            />
          </label>
          <label className="ps-field">
            <span>Product Name</span>
            <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="" />
          </label>
          <label className="ps-field">
            <span>Currency</span>
            <div className="ps-select">
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option>NGN</option>
                <option>USD</option>
                <option>EUR</option>
              </select>
              <ChevronDown />
            </div>
          </label>
          {kind !== "casa" ? (
            <label className="ps-field">
              <span>Term</span>
              <div className="ps-select">
                <select value={term} onChange={(e) => setTerm(e.target.value)}>
                  {PRODUCT_TERMS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
                <ChevronDown />
              </div>
            </label>
          ) : (
            <label className="ps-field">
              <span>Minimum balance</span>
              <input value={minBalance} onChange={(e) => setMinBalance(e.target.value)} />
            </label>
          )}
          <label className="ps-field">
            <span>Interest Rate %</span>
            <input value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
          </label>
          {kind !== "casa" ? (
            <>
              <label className="ps-field">
                <span>Min amount</span>
                <input value={minAmt} onChange={(e) => setMinAmt(e.target.value)} />
              </label>
              <label className="ps-field">
                <span>Max amount</span>
                <input value={maxAmt} onChange={(e) => setMaxAmt(e.target.value)} />
              </label>
            </>
          ) : (
            <label className="ps-field">
              <span>Monthly maintenance charge</span>
              <input value={amc} onChange={(e) => setAmc(e.target.value)} />
            </label>
          )}
          <label className="ps-field ps-field--full">
            <span>Description / notes</span>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>

          <p className="ps-section ps-field--full">Chart of Accounts (Product Factory GLs)</p>

          {kind === "casa" ? (
            <>
              <label className="ps-field">
                <span>Reporting ledger (required)</span>
                <input
                  value={reportingGl}
                  onChange={(e) => setReportingGl(e.target.value)}
                  placeholder="e.g. 20001"
                />
              </label>
              <label className="ps-field">
                <span>Interest accrual GL</span>
                <input value={accrualGl} onChange={(e) => setAccrualGl(e.target.value)} />
              </label>
              <label className="ps-field">
                <span>Interest expense GL</span>
                <input value={interestExpenseGl} onChange={(e) => setInterestExpenseGl(e.target.value)} />
              </label>
              <label className="ps-field">
                <span>Withholding tax GL</span>
                <input value={whtGl} onChange={(e) => setWhtGl(e.target.value)} />
              </label>
              <label className="ps-field">
                <span>VAT GL</span>
                <input value={vatGl} onChange={(e) => setVatGl(e.target.value)} />
              </label>
              <label className="ps-field">
                <span>Charge income GL</span>
                <input value={chargeGl} onChange={(e) => setChargeGl(e.target.value)} />
              </label>
            </>
          ) : null}

          {kind === "loans" ? (
            <>
              <label className="ps-field">
                <span>Principal ledger (required)</span>
                <input
                  value={principalGl}
                  onChange={(e) => setPrincipalGl(e.target.value)}
                  placeholder="13000–13999"
                />
              </label>
              <label className="ps-field">
                <span>Interest receivable (required)</span>
                <input value={interestRecvGl} onChange={(e) => setInterestRecvGl(e.target.value)} />
              </label>
              <label className="ps-field">
                <span>Interest income (required)</span>
                <input
                  value={interestIncomeGl}
                  onChange={(e) => setInterestIncomeGl(e.target.value)}
                  placeholder="40000–49999"
                />
              </label>
            </>
          ) : null}

          {kind === "investments" ? (
            <>
              <label className="ps-field">
                <span>Principal liability GL</span>
                <input value={liabGl} onChange={(e) => setLiabGl(e.target.value)} />
              </label>
              <label className="ps-field">
                <span>Interest payable GL</span>
                <input value={payableGl} onChange={(e) => setPayableGl(e.target.value)} />
              </label>
              <label className="ps-field">
                <span>Interest expense GL</span>
                <input value={invExpenseGl} onChange={(e) => setInvExpenseGl(e.target.value)} />
              </label>
              <label className="ps-field">
                <span>Withholding tax GL</span>
                <input value={invWhtGl} onChange={(e) => setInvWhtGl(e.target.value)} />
              </label>
              <label className="ps-field">
                <span>Penalty income GL</span>
                <input value={penaltyGl} onChange={(e) => setPenaltyGl(e.target.value)} />
              </label>
            </>
          ) : null}
        </div>

        <footer className="ps-modal-foot">
          <button type="button" className="ps-btn ps-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <div className="ps-modal-foot-right">
            <button
              type="button"
              className="ps-btn ps-btn--primary"
              disabled={busy}
              onClick={() => void saveProduct()}
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function ViewProductModal({
  row,
  onClose,
  onUpdated,
}: {
  row: ProductRow;
  onClose: () => void;
  onUpdated: (row: ProductRow) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const status = row.status.toUpperCase();
  const canSubmit =
    (status === "PENDING_APPROVAL" || status === "DRAFT") && !row.workflowRequestId && !!row.code;
  const canActivate = status === "PENDING_APPROVAL" && !!row.workflowRequestId && !!row.code;

  async function onSubmit() {
    if (!row.code) return;
    setBusy(true);
    setError(null);
    try {
      const p =
        row.kind === "loans"
          ? await submitLoanProduct(row.code)
          : row.kind === "investments"
            ? await submitInvestmentProduct(row.code)
            : await submitCasaProduct(row.code);
      const mapped =
        row.kind === "loans"
          ? mapLoan(p as unknown as Record<string, unknown>)
          : row.kind === "investments"
            ? mapInvestment(p as unknown as Record<string, unknown>)
            : mapCasa(p as unknown as Record<string, unknown>);
      setMessage(`Submitted · workflow ${mapped.workflowRequestId || "created"}`);
      onUpdated(mapped);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  async function onActivate() {
    if (!row.code || !row.workflowRequestId) {
      setError("No workflow request id — submit first, then approve on Approvals");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const p =
        row.kind === "loans"
          ? await activateLoanProduct(row.code, row.workflowRequestId)
          : row.kind === "investments"
            ? await activateInvestmentProduct(row.code, row.workflowRequestId)
            : await activateCasaProduct(row.code, row.workflowRequestId);
      const mapped =
        row.kind === "loans"
          ? mapLoan(p as unknown as Record<string, unknown>)
          : row.kind === "investments"
            ? mapInvestment(p as unknown as Record<string, unknown>)
            : mapCasa(p as unknown as Record<string, unknown>);
      setMessage(`${mapped.code} is now ${mapped.status}`);
      onUpdated(mapped);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Activate failed (approve the workflow first)",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ps-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="ps-modal ps-modal--view"
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-product-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ps-modal-head ps-modal-head--view">
          <h2 id="view-product-title">View Product Setup</h2>
          <button type="button" className="ps-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        {error ? <p role="alert">{error}</p> : null}
        {message ? <p className="ps-hint">{message}</p> : null}
        <dl className="ps-view-list">
          <div>
            <dt>Code</dt>
            <dd>{row.code || "—"}</dd>
          </div>
          <div>
            <dt>Product Type</dt>
            <dd>{row.productType}</dd>
          </div>
          <div>
            <dt>Product Name</dt>
            <dd>{row.productName}</dd>
          </div>
          <div>
            <dt>Term</dt>
            <dd>{row.term}</dd>
          </div>
          <div>
            <dt>Currency</dt>
            <dd>{row.currency}</dd>
          </div>
          <div>
            <dt>Interest Rate</dt>
            <dd>{row.interestRate}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{row.status}</dd>
          </div>
          <div>
            <dt>Reporting / Principal GL</dt>
            <dd>{row.reportingGl || row.principalGl || "—"}</dd>
          </div>
          <div>
            <dt>Workflow</dt>
            <dd>{row.workflowRequestId || "—"}</dd>
          </div>
          <div>
            <dt>Created Date</dt>
            <dd>
              <CalendarIcon /> {row.createdDate}
            </dd>
          </div>
        </dl>
        <footer className="ps-view-foot" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
          {canSubmit ? (
            <button type="button" className="ps-btn ps-btn--primary" disabled={busy} onClick={() => void onSubmit()}>
              {busy ? "Working…" : "Submit for approval"}
            </button>
          ) : null}
          {canActivate ? (
            <button type="button" className="ps-btn ps-btn--primary" disabled={busy} onClick={() => void onActivate()}>
              {busy ? "Working…" : "Activate (after approval)"}
            </button>
          ) : null}
          {status === "ACTIVE" ? (
            <span className="ps-hint" style={{ margin: 0 }}>
              Active — usable for account opening.
            </span>
          ) : null}
          <button type="button" className="ps-btn ps-btn--ghost" onClick={onClose}>
            Close
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

function ExportIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
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

function PrintIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
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
