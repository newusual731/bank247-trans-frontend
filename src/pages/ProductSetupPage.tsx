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
import {
  getProductFactoryConfig,
  listFactoryRestrictionCodes,
  listFactoryTxnTypes,
  listProductGroups,
  listProductProperties,
  replaceProductAllowedTxnTypes,
  replaceProductPropertyValues,
  replaceProductRestrictionDefaults,
  type FactoryRestrictionCode,
  type FactoryTxnType,
  type ProductFactoryConfig,
  type ProductGroup,
  type ProductPropertyDefinition,
} from "../api/productFactory";
import { listGlAccounts, type GlAccountSummary } from "../api/ledger";
import { ApiError } from "../lib/apiClient";
import { Link } from "react-router-dom";

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
    let source = apiRows ?? (loadError ? DEMO_ROWS : []);
    if (status && status !== "All") {
      source = source.filter((r) => r.status.toUpperCase() === status.toUpperCase());
    }
    if (productType && productType !== "All") {
      const needle = productType.toLowerCase();
      source = source.filter(
        (r) =>
          r.productType.toLowerCase().includes(needle) ||
          needle.includes(r.productType.toLowerCase()) ||
          (needle.includes("savings") && r.kind === "casa") ||
          (needle.includes("current") && r.kind === "casa"),
      );
    }
    const ccy = normalizeCurrency(currency);
    if (ccy.length === 3 && currency && currency !== "All") {
      source = source.filter((r) => normalizeCurrency(r.currency) === ccy);
    }
    return source;
  }, [apiRows, productType, status, currency, loadError]);

  return (
    <div className="ps">
      <h1>Product Setup</h1>
      <p className="ps-hint">
        Product Factory BRD — create leaf products (name, group, balance type, limits, GLs, TXN.TYPE).
        Then Submit → Approve on Approvals → Activate. Maintain catalogs under{" "}
        <Link to="/settings/product-factory">Product Factory</Link>.
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
          <Link to="/settings/product-factory" className="ps-btn ps-btn--ghost" style={{ textDecoration: "none" }}>
            Product Factory catalogs
          </Link>
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
            {apiRows === null && !loadError ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", color: "#6b7280" }}>
                  Loading…
                </td>
              </tr>
            ) : displayRows.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", color: "#6b7280" }}>
                  No products yet. Use +Add New Product.
                </td>
              </tr>
            ) : (
              displayRows.map((row) => (
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
                        Workflow
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
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
  const [term, setTerm] = useState<string>(PRODUCT_TERMS[1]);
  const [interestRate, setInterestRate] = useState("6.5");
  const [description, setDescription] = useState("");
  const [productGroup, setProductGroup] = useState("");
  const [selectedTxns, setSelectedTxns] = useState<string[]>([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([]);

  // CASA GLs
  const [reportingGl, setReportingGl] = useState("");
  const [accrualGl, setAccrualGl] = useState("");
  const [interestExpenseGl, setInterestExpenseGl] = useState("");
  const [whtGl, setWhtGl] = useState("");
  const [vatGl, setVatGl] = useState("");
  const [chargeGl, setChargeGl] = useState("");
  const [minBalance, setMinBalance] = useState("0");
  const [amc, setAmc] = useState("0");
  const [balanceType, setBalanceType] = useState("CREDIT");
  const [closure, setClosure] = useState("NA");
  const [defaultOfficer, setDefaultOfficer] = useState("");
  const [interestCondition, setInterestCondition] = useState("");
  const [minOpeningBalance, setMinOpeningBalance] = useState("");
  const [maxSingleCredit, setMaxSingleCredit] = useState("");
  const [maxSingleDebit, setMaxSingleDebit] = useState("");
  const [maxCumCredit, setMaxCumCredit] = useState("");
  const [maxCumCreditPeriod, setMaxCumCreditPeriod] = useState("");
  const [maxCumDebit, setMaxCumDebit] = useState("");
  const [maxCumDebitPeriod, setMaxCumDebitPeriod] = useState("");
  const [cumulativeBalance, setCumulativeBalance] = useState("");
  const [allowMultiple, setAllowMultiple] = useState("true");
  const [enableNotify, setEnableNotify] = useState("true");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [interestBasis, setInterestBasis] = useState("Actual/365");
  const [accrualStart, setAccrualStart] = useState("FIRST DAY");
  const [accrualEnd, setAccrualEnd] = useState("LAST DAY");
  const [crInterestEligible, setCrInterestEligible] = useState("true");

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

  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [txnTypes, setTxnTypes] = useState<FactoryTxnType[]>([]);
  const [restrictionCodes, setRestrictionCodes] = useState<FactoryRestrictionCode[]>([]);
  const [properties, setProperties] = useState<ProductPropertyDefinition[]>([]);
  const [propertyValues, setPropertyValues] = useState<Record<string, string>>({});
  const [glAccounts, setGlAccounts] = useState<GlAccountSummary[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const kind = resolveKind(productType);
  const selectedGroup = groups.find((g) => g.code === productGroup);

  useEffect(() => {
    if (selectedGroup?.balanceType) setBalanceType(selectedGroup.balanceType);
    if (selectedGroup) setEnableNotify(selectedGroup.enableNotificationAlert ? "true" : "false");
  }, [selectedGroup?.code, selectedGroup?.balanceType, selectedGroup?.enableNotificationAlert]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCatalogLoading(true);
      setCatalogError(null);
      try {
        const [g, t, r, props, gls] = await Promise.all([
          listProductGroups("ACTIVE"),
          listFactoryTxnTypes("ACTIVE"),
          listFactoryRestrictionCodes("ACTIVE"),
          listProductProperties("ACTIVE"),
          listGlAccounts({ status: "ACTIVE", size: 200 }),
        ]);
        if (cancelled) return;
        setGroups(Array.isArray(g) ? g : []);
        setTxnTypes(Array.isArray(t) ? t : []);
        setRestrictionCodes(Array.isArray(r) ? r : []);
        setProperties(Array.isArray(props) ? props : []);
        setGlAccounts((gls.content ?? []).filter((x) => x.postable !== false));
        if (!productGroup && g.length) {
          const savings = g.find((x) => x.code.includes("SAVINGS"));
          setProductGroup((savings ?? g[0]).code);
        }
        setPropertyValues((prev) => {
          const next = { ...prev };
          for (const p of props) {
            if (next[p.code] == null) next[p.code] = "";
          }
          return next;
        });
      } catch (e) {
        if (!cancelled) {
          setCatalogError(
            e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Failed to load catalogs",
          );
        }
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load catalogs once on open
  }, []);

  function toggleTxn(code: string) {
    setSelectedTxns((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }

  function toggleRestriction(code: string) {
    setSelectedRestrictions((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  function setProp(code: string, value: string) {
    setPropertyValues((prev) => ({ ...prev, [code]: value }));
  }

  async function attachFactoryConfig(productCode: string, rate: number) {
    if (selectedTxns.length) {
      await replaceProductAllowedTxnTypes(productCode, selectedTxns);
    }
    const restrictionItems = [...selectedRestrictions];
    if (closure === "CLOSE_AFTER_30_DAYS_NO_TXN" && !restrictionItems.includes("AUTO_CLOSE")) {
      // Prefer catalog code if present; otherwise still attach listed selections.
      const auto = restrictionCodes.find((r) => r.code.includes("AUTO") || r.closureRule.includes("CLOSE"));
      if (auto && !restrictionItems.includes(auto.code)) restrictionItems.push(auto.code);
    }
    if (restrictionItems.length) {
      await replaceProductRestrictionDefaults(
        productCode,
        restrictionItems.map((restrictionCode) => ({
          restrictionCode,
          autoApplyOnOpen: restrictionCode === "ONBOARDING",
        })),
      );
    }

    const put = (map: Map<string, string>, code: string, value: string) => {
      const v = value.trim();
      if (v) map.set(code, v);
    };
    const map = new Map<string, string>();
    for (const [propertyCode, value] of Object.entries(propertyValues)) {
      put(map, propertyCode, value);
    }
    if (rate > 0) put(map, "CRINTEREST.RATE", String(rate));
    put(map, "CRINTEREST.ELIGIBILITY", crInterestEligible);
    put(map, "INTEREST.BASIS", interestBasis);
    put(map, "ACCRUAL.CYCLE.START", accrualStart);
    put(map, "ACCRUAL.CYCLE.END", accrualEnd);
    put(map, "MINIMUM.BALANCE", String(Number(minBalance) || 0));
    put(map, "MINIMUM.OPENING.BALANCE", minOpeningBalance);
    put(map, "MAX.SINGLE.CREDIT", maxSingleCredit);
    put(map, "MAX.SINGLE.DEBIT", maxSingleDebit);
    put(map, "MAX.CUMULATIVE.CREDIT", maxCumCredit);
    put(map, "MAX.CUMULATIVE.DEBIT", maxCumDebit);
    put(map, "ALLOW_MULTIPLE_ACCOUNTS", allowMultiple);
    put(map, "REPORTING.LEDGER", reportingGl.toUpperCase());
    put(map, "INTEREST.ACCRUAL.LEDGER", accrualGl.toUpperCase());
    put(map, "INTEREST.EXPENSE.LEDGER", interestExpenseGl.toUpperCase());
    put(map, "WHT.GL", whtGl.toUpperCase());
    put(map, "VAT.GL", vatGl.toUpperCase());
    put(map, "CUMULATIVE.BALANCE", cumulativeBalance);
    put(map, "DEFAULT.ACCOUNT.OFFICER", defaultOfficer);
    put(map, "EFFECTIVE.DATE", effectiveDate);
    put(map, "EXPIRY.DATE", expiryDate);
    put(map, "ENABLE.NOTIFICATION.ALERT", enableNotify);
    put(map, "INTEREST.CONDITION", interestCondition);
    put(map, "MAX.CUMULATIVE.CREDIT.PERIOD", maxCumCreditPeriod);
    put(map, "MAX.CUMULATIVE.DEBIT.PERIOD", maxCumDebitPeriod);
    put(
      map,
      "CLOSURE.RULE",
      closure === "CLOSE_AFTER_30_DAYS_NO_TXN" ? "CLOSE AFTER 30 DAYS OF NO TXN" : "NA",
    );

    const known = new Set(properties.map((p) => p.code));
    const items = [...map.entries()]
      .filter(([propertyCode]) => known.size === 0 || known.has(propertyCode))
      .map(([propertyCode, value]) => ({ propertyCode, value }));
    if (items.length) {
      await replaceProductPropertyValues(productCode, items);
    }
  }

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
        await attachFactoryConfig(productCode, rate);
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
        await attachFactoryConfig(productCode, rate);
        onSaved(mapInvestment(p as unknown as Record<string, unknown>));
        return;
      }

      const accountType = productType.toLowerCase().includes("current")
        ? "CURRENT"
        : productType.toLowerCase().includes("fixed")
          ? "FIXED_DEPOSIT"
          : "SAVINGS";
      const groupCode =
        productGroup ||
        (accountType === "CURRENT"
          ? "CURRENT.ACCOUNTS-GROUP"
          : accountType === "FIXED_DEPOSIT"
            ? "FIXED.DEPOSIT-GROUP"
            : "SAVINGS.ACCOUNTS-GROUP");
      const basisDays = interestBasis.includes("360") ? 360 : interestBasis.includes("366") ? 366 : 365;
      const p = await createCasaProduct({
        code: productCode,
        name,
        accountType,
        productGroup: groupCode,
        balanceType: balanceType || selectedGroup?.balanceType || "CREDIT",
        currency: ccy,
        minimumBalance: Number(minBalance) || 0,
        annualInterestRate: rate,
        interestBasisDays: basisDays,
        reportingLedgerAccount: reportingGl.trim().toUpperCase(),
        interestAccrualLedgerAccount: accrualGl.trim().toUpperCase() || undefined,
        interestExpenseLedgerAccount: interestExpenseGl.trim().toUpperCase() || undefined,
        withholdingTaxLedgerAccount: whtGl.trim().toUpperCase() || undefined,
        vatLedgerAccount: vatGl.trim().toUpperCase() || undefined,
        chargeIncomeLedgerAccount: chargeGl.trim().toUpperCase() || undefined,
        monthlyMaintenanceCharge: Number(amc) || 0,
        cashLiteCharge: 0,
        dormancyInactiveDays: closure === "CLOSE_AFTER_30_DAYS_NO_TXN" ? 30 : 180,
      });
      await attachFactoryConfig(productCode, rate);
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
            <h2 id="product-form-title">Product Creation Interface</h2>
            <h3>Product Factory BRD · {kind === "casa" ? "CASA" : kind.toUpperCase()}</h3>
          </div>
          <button type="button" className="ps-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="ps-modal-grid">
          <label className="ps-field">
            <span>Account / product type</span>
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
            <span>Product Name</span>
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Savings - regular"
              required
            />
          </label>
          <label className="ps-field">
            <span>Product_ID</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="SAV001"
              required
            />
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

          {kind === "casa" ? (
            <>
              <label className="ps-field">
                <span>Product_group</span>
                <div className="ps-select">
                  <select value={productGroup} onChange={(e) => setProductGroup(e.target.value)} required>
                    {groups.length === 0 ? <option value="">Loading groups…</option> : null}
                    {groups.map((g) => (
                      <option key={g.code} value={g.code}>
                        {g.name} ({g.code})
                      </option>
                    ))}
                  </select>
                  <ChevronDown />
                </div>
              </label>
              <label className="ps-field">
                <span>BALANCE_TYPE</span>
                <div className="ps-select">
                  <select value={balanceType} onChange={(e) => setBalanceType(e.target.value)}>
                    {["CREDIT", "DEBIT", "BOTH"].map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                  <ChevronDown />
                </div>
              </label>
              <label className="ps-field">
                <span>MINIMUM.BALANCE</span>
                <input value={minBalance} onChange={(e) => setMinBalance(e.target.value)} />
              </label>
              <label className="ps-field">
                <span>MINIMUM.OPENING.BALANCE</span>
                <input
                  value={minOpeningBalance}
                  onChange={(e) => setMinOpeningBalance(e.target.value)}
                  placeholder="NULL or numeric"
                />
              </label>

              <p className="ps-section ps-field--full">PROPERTY.1 — CRINTEREST</p>
              <label className="ps-field">
                <span>CRINTEREST.RATE %</span>
                <input value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
              </label>
              <label className="ps-field">
                <span>CRINTEREST.ELIGIBILITY</span>
                <div className="ps-select">
                  <select
                    value={crInterestEligible}
                    onChange={(e) => setCrInterestEligible(e.target.value)}
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                  <ChevronDown />
                </div>
              </label>
              <label className="ps-field">
                <span>Interest.Basis</span>
                <div className="ps-select">
                  <select value={interestBasis} onChange={(e) => setInterestBasis(e.target.value)}>
                    {["Actual/360", "Actual/365", "Actual/366"].map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                  <ChevronDown />
                </div>
              </label>
              <label className="ps-field">
                <span>INTEREST CONDITION (max of 4)</span>
                <input
                  value={interestCondition}
                  onChange={(e) => setInterestCondition(e.target.value)}
                  placeholder="Optional notes / condition count"
                />
              </label>
              <label className="ps-field">
                <span>Accrual Cycle Start</span>
                <div className="ps-select">
                  <select value={accrualStart} onChange={(e) => setAccrualStart(e.target.value)}>
                    <option>FIRST DAY</option>
                    <option>LAST DAY</option>
                  </select>
                  <ChevronDown />
                </div>
              </label>
              <label className="ps-field">
                <span>Accrual Cycle End</span>
                <div className="ps-select">
                  <select value={accrualEnd} onChange={(e) => setAccrualEnd(e.target.value)}>
                    <option>FIRST DAY</option>
                    <option>LAST DAY</option>
                  </select>
                  <ChevronDown />
                </div>
              </label>

              <p className="ps-section ps-field--full">PROPERTY.2 — TXN.TYPE (empty = ALL)</p>
              <div className="ps-field ps-field--full">
                <span>Allowed TXN.TYPE</span>
                {catalogLoading ? (
                  <p className="ps-check-empty">Loading TXN.TYPE catalog…</p>
                ) : catalogError ? (
                  <p className="ps-check-empty" role="alert">
                    Could not load TXN.TYPE ({catalogError}). Open{" "}
                    <Link to="/settings/product-factory">Product Factory</Link> or retry.
                  </p>
                ) : txnTypes.length === 0 ? (
                  <p className="ps-check-empty">
                    No TXN.TYPE rows yet. Seed/create them in{" "}
                    <Link to="/settings/product-factory">Product Factory → TXN.TYPE</Link>. Leave empty
                    to allow ALL.
                  </p>
                ) : (
                  <>
                    <div className="ps-check-list" role="group" aria-label="Allowed TXN.TYPE">
                      {txnTypes.map((t) => (
                        <label key={t.code}>
                          <input
                            type="checkbox"
                            checked={selectedTxns.includes(t.code)}
                            onChange={() => toggleTxn(t.code)}
                          />
                          <span>
                            <strong>{t.code}</strong> — {t.description}
                          </span>
                        </label>
                      ))}
                    </div>
                    <p className="ps-check-empty" style={{ marginTop: "0.35rem" }}>
                      {selectedTxns.length === 0
                        ? "None selected → ALL txn types allowed."
                        : `${selectedTxns.length} selected.`}
                    </p>
                  </>
                )}
              </div>

              <label className="ps-field">
                <span>CLOSURE</span>
                <div className="ps-select">
                  <select value={closure} onChange={(e) => setClosure(e.target.value)}>
                    <option value="NA">NA</option>
                    <option value="CLOSE_AFTER_30_DAYS_NO_TXN">CLOSE AFTER 30 DAYS OF NO TXN</option>
                  </select>
                  <ChevronDown />
                </div>
              </label>
              <label className="ps-field">
                <span>DEFAULT ACCOUNT OFFICER</span>
                <input
                  value={defaultOfficer}
                  onChange={(e) => setDefaultOfficer(e.target.value)}
                  placeholder="e.g. 100"
                />
              </label>

              <p className="ps-section ps-field--full">Ledger GLs</p>
              <label className="ps-field">
                <span>REPORTING LEDGER CODE</span>
                <GlSelect value={reportingGl} onChange={setReportingGl} options={glAccounts} required />
              </label>
              <label className="ps-field">
                <span>INTEREST ACCRUAL LEDGER CODE</span>
                <GlSelect value={accrualGl} onChange={setAccrualGl} options={glAccounts} />
              </label>
              <label className="ps-field">
                <span>INTEREST EXPENSE LEDGER CODE</span>
                <GlSelect value={interestExpenseGl} onChange={setInterestExpenseGl} options={glAccounts} />
              </label>
              <label className="ps-field">
                <span>Withholding Tax GL</span>
                <GlSelect value={whtGl} onChange={setWhtGl} options={glAccounts} />
              </label>
              <label className="ps-field">
                <span>VALUE ADDED TAX GL</span>
                <GlSelect value={vatGl} onChange={setVatGl} options={glAccounts} />
              </label>
              <label className="ps-field">
                <span>Charge income GL</span>
                <GlSelect value={chargeGl} onChange={setChargeGl} options={glAccounts} />
              </label>
              <label className="ps-field">
                <span>Monthly maintenance charge</span>
                <input value={amc} onChange={(e) => setAmc(e.target.value)} />
              </label>

              <p className="ps-section ps-field--full">Limits &amp; flags</p>
              <label className="ps-field">
                <span>MAX SINGLE CREDIT</span>
                <input value={maxSingleCredit} onChange={(e) => setMaxSingleCredit(e.target.value)} />
              </label>
              <label className="ps-field">
                <span>MAX SINGLE DEBIT</span>
                <input value={maxSingleDebit} onChange={(e) => setMaxSingleDebit(e.target.value)} />
              </label>
              <label className="ps-field">
                <span>MAX CUMULATIVE CREDIT</span>
                <input value={maxCumCredit} onChange={(e) => setMaxCumCredit(e.target.value)} />
              </label>
              <label className="ps-field">
                <span>MAX CUMULATIVE CREDIT PERIOD</span>
                <div className="ps-select">
                  <select
                    value={maxCumCreditPeriod}
                    onChange={(e) => setMaxCumCreditPeriod(e.target.value)}
                  >
                    <option value="">—</option>
                    {["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                  <ChevronDown />
                </div>
              </label>
              <label className="ps-field">
                <span>MAX CUMULATIVE DEBIT</span>
                <input value={maxCumDebit} onChange={(e) => setMaxCumDebit(e.target.value)} />
              </label>
              <label className="ps-field">
                <span>MAX CUMULATIVE DEBIT PERIOD</span>
                <div className="ps-select">
                  <select
                    value={maxCumDebitPeriod}
                    onChange={(e) => setMaxCumDebitPeriod(e.target.value)}
                  >
                    <option value="">—</option>
                    {["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                  <ChevronDown />
                </div>
              </label>
              <label className="ps-field">
                <span>CUMULATIVE BALANCE</span>
                <input value={cumulativeBalance} onChange={(e) => setCumulativeBalance(e.target.value)} />
              </label>
              <label className="ps-field">
                <span>ALLOW_MULTIPLE_ACCOUNTS</span>
                <div className="ps-select">
                  <select value={allowMultiple} onChange={(e) => setAllowMultiple(e.target.value)}>
                    <option value="true">TRUE</option>
                    <option value="false">FALSE</option>
                  </select>
                  <ChevronDown />
                </div>
              </label>
              <label className="ps-field">
                <span>ENABLE.NOTIFICATION.ALERT</span>
                <div className="ps-select">
                  <select value={enableNotify} onChange={(e) => setEnableNotify(e.target.value)}>
                    <option value="true">TRUE</option>
                    <option value="false">FALSE</option>
                  </select>
                  <ChevronDown />
                </div>
              </label>
              <label className="ps-field">
                <span>EFFECTIVE.DATE</span>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                />
              </label>
              <label className="ps-field">
                <span>EXPIRY.DATE</span>
                <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
              </label>

              {restrictionCodes.length > 0 ? (
                <div className="ps-field ps-field--full">
                  <span>Default RESTRICTION codes (optional)</span>
                  <div className="ps-check-list" role="group" aria-label="Default restriction codes">
                    {restrictionCodes.map((r) => (
                      <label key={r.code}>
                        <input
                          type="checkbox"
                          checked={selectedRestrictions.includes(r.code)}
                          onChange={() => toggleRestriction(r.code)}
                        />
                        <span>
                          <strong>{r.code}</strong> — {r.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              {properties.filter(
                (p) =>
                  ![
                    "CRINTEREST.RATE",
                    "CRINTEREST.ELIGIBILITY",
                    "INTEREST.BASIS",
                    "ACCRUAL.CYCLE.START",
                    "ACCRUAL.CYCLE.END",
                    "MINIMUM.BALANCE",
                    "MINIMUM.OPENING.BALANCE",
                    "MAX.SINGLE.CREDIT",
                    "MAX.SINGLE.DEBIT",
                    "MAX.CUMULATIVE.CREDIT",
                    "MAX.CUMULATIVE.DEBIT",
                    "ALLOW_MULTIPLE_ACCOUNTS",
                    "REPORTING.LEDGER",
                    "INTEREST.ACCRUAL.LEDGER",
                    "INTEREST.EXPENSE.LEDGER",
                    "WHT.GL",
                    "VAT.GL",
                  ].includes(p.code),
              ).length > 0 ? (
                <>
                  <p className="ps-section ps-field--full">Additional catalog properties</p>
                  {properties
                    .filter(
                      (p) =>
                        ![
                          "CRINTEREST.RATE",
                          "CRINTEREST.ELIGIBILITY",
                          "INTEREST.BASIS",
                          "ACCRUAL.CYCLE.START",
                          "ACCRUAL.CYCLE.END",
                          "MINIMUM.BALANCE",
                          "MINIMUM.OPENING.BALANCE",
                          "MAX.SINGLE.CREDIT",
                          "MAX.SINGLE.DEBIT",
                          "MAX.CUMULATIVE.CREDIT",
                          "MAX.CUMULATIVE.DEBIT",
                          "ALLOW_MULTIPLE_ACCOUNTS",
                          "REPORTING.LEDGER",
                          "INTEREST.ACCRUAL.LEDGER",
                          "INTEREST.EXPENSE.LEDGER",
                          "WHT.GL",
                          "VAT.GL",
                        ].includes(p.code),
                    )
                    .map((prop) => (
                      <label key={prop.code} className="ps-field">
                        <span>
                          {prop.name}{" "}
                          <span style={{ color: "#9ca3af" }}>({prop.code})</span>
                        </span>
                        {prop.valueType === "ENUM" ? (
                          <div className="ps-select">
                            <select
                              value={propertyValues[prop.code] ?? ""}
                              onChange={(e) => setProp(prop.code, e.target.value)}
                            >
                              <option value="">—</option>
                              {(prop.enumOptions ?? []).map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                            <ChevronDown />
                          </div>
                        ) : prop.valueType === "BOOLEAN" ? (
                          <div className="ps-select">
                            <select
                              value={propertyValues[prop.code] ?? ""}
                              onChange={(e) => setProp(prop.code, e.target.value)}
                            >
                              <option value="">—</option>
                              <option value="true">true</option>
                              <option value="false">false</option>
                            </select>
                            <ChevronDown />
                          </div>
                        ) : prop.valueType === "GL_CODE" ? (
                          <GlSelect
                            value={propertyValues[prop.code] ?? ""}
                            onChange={(v) => setProp(prop.code, v)}
                            options={glAccounts}
                          />
                        ) : (
                          <input
                            value={propertyValues[prop.code] ?? ""}
                            onChange={(e) => setProp(prop.code, e.target.value)}
                          />
                        )}
                      </label>
                    ))}
                </>
              ) : null}
            </>
          ) : (
            <>
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
              <label className="ps-field">
                <span>Interest Rate %</span>
                <input value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
              </label>
              <label className="ps-field">
                <span>Min amount</span>
                <input value={minAmt} onChange={(e) => setMinAmt(e.target.value)} />
              </label>
              <label className="ps-field">
                <span>Max amount</span>
                <input value={maxAmt} onChange={(e) => setMaxAmt(e.target.value)} />
              </label>
              <label className="ps-field ps-field--full">
                <span>Description / notes</span>
                <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
              </label>
              {txnTypes.length > 0 ? (
                <label className="ps-field ps-field--full">
                  <span>Allowed TXN.TYPE</span>
                  <select
                    multiple
                    size={Math.min(8, txnTypes.length)}
                    value={selectedTxns}
                    onChange={(e) =>
                      setSelectedTxns(Array.from(e.target.selectedOptions).map((o) => o.value))
                    }
                  >
                    {txnTypes.map((t) => (
                      <option key={t.code} value={t.code}>
                        {t.code} — {t.description}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <p className="ps-section ps-field--full">Chart of Accounts</p>
              {kind === "loans" ? (
                <>
                  <label className="ps-field">
                    <span>Principal ledger</span>
                    <GlSelect value={principalGl} onChange={setPrincipalGl} options={glAccounts} required />
                  </label>
                  <label className="ps-field">
                    <span>Interest receivable</span>
                    <GlSelect
                      value={interestRecvGl}
                      onChange={setInterestRecvGl}
                      options={glAccounts}
                      required
                    />
                  </label>
                  <label className="ps-field">
                    <span>Interest income</span>
                    <GlSelect
                      value={interestIncomeGl}
                      onChange={setInterestIncomeGl}
                      options={glAccounts}
                      required
                    />
                  </label>
                </>
              ) : (
                <>
                  <label className="ps-field">
                    <span>Principal liability GL</span>
                    <GlSelect value={liabGl} onChange={setLiabGl} options={glAccounts} required />
                  </label>
                  <label className="ps-field">
                    <span>Interest payable GL</span>
                    <GlSelect value={payableGl} onChange={setPayableGl} options={glAccounts} required />
                  </label>
                  <label className="ps-field">
                    <span>Interest expense GL</span>
                    <GlSelect
                      value={invExpenseGl}
                      onChange={setInvExpenseGl}
                      options={glAccounts}
                      required
                    />
                  </label>
                  <label className="ps-field">
                    <span>Withholding tax GL</span>
                    <GlSelect value={invWhtGl} onChange={setInvWhtGl} options={glAccounts} required />
                  </label>
                  <label className="ps-field">
                    <span>Penalty income GL</span>
                    <GlSelect value={penaltyGl} onChange={setPenaltyGl} options={glAccounts} required />
                  </label>
                </>
              )}
            </>
          )}
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
  const [factoryConfig, setFactoryConfig] = useState<ProductFactoryConfig | null>(null);

  const status = row.status.toUpperCase();
  const canSubmit =
    (status === "PENDING_APPROVAL" || status === "DRAFT") && !row.workflowRequestId && !!row.code;
  const canActivate = status === "PENDING_APPROVAL" && !!row.workflowRequestId && !!row.code;

  useEffect(() => {
    if (!row.code) return;
    let cancelled = false;
    (async () => {
      try {
        const cfg = await getProductFactoryConfig(row.code);
        if (!cancelled) setFactoryConfig(cfg);
      } catch {
        if (!cancelled) setFactoryConfig(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [row.code]);

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
          {factoryConfig?.allowedTxnTypes?.length ? (
            <div>
              <dt>Allowed TXN.TYPE</dt>
              <dd>{factoryConfig.allowedTxnTypes.map((t) => t.code).join(", ")}</dd>
            </div>
          ) : null}
          {factoryConfig?.restrictionDefaults?.length ? (
            <div>
              <dt>Restrictions</dt>
              <dd>
                {factoryConfig.restrictionDefaults
                  .map((r) => r.restrictionCode)
                  .join(", ")}
              </dd>
            </div>
          ) : null}
          {factoryConfig?.propertyValues?.length
            ? factoryConfig.propertyValues.map((pv) => (
                <div key={pv.propertyCode}>
                  <dt>{pv.propertyName || pv.propertyCode}</dt>
                  <dd>{pv.value || "—"}</dd>
                </div>
              ))
            : null}
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
          <button type="button" className="ps-btn ps-btn--primary" onClick={onClose}>
            Ok
          </button>
        </footer>
      </div>
    </div>
  );
}

function GlSelect({
  value,
  onChange,
  options,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  options: GlAccountSummary[];
  required?: boolean;
}) {
  if (options.length === 0) {
    return (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="GL code"
        required={required}
      />
    );
  }
  return (
    <div className="ps-select">
      <select value={value} onChange={(e) => onChange(e.target.value)} required={required}>
        <option value="">Select GL</option>
        {value && !options.some((g) => g.code === value) ? (
          <option value={value}>{value}</option>
        ) : null}
        {options.map((g) => (
          <option key={g.code} value={g.code}>
            {g.code} — {g.description || g.code}
          </option>
        ))}
      </select>
      <ChevronDown />
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
