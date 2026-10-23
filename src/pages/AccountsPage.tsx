import { useEffect, useState } from "react";
import {
  closeAccount,
  enquireAccount,
  formatAccountStatus,
  getAccount,
  listCasaProducts,
  openAccount,
  reactivateAccount,
  searchAccounts,
  type AccountEnquiryResponse,
  type AccountResponse,
  type CasaProduct,
} from "../api/accounts";
import { listBranches, type Branch } from "../api/branches";
import { getCustomerByCif, searchCustomers } from "../api/customers";
import { getAccountBalance, getAccountEntries } from "../api/ledger";
import { ApiError } from "../lib/apiClient";
import { AppAlert } from "../components/feedback/AppAlert";
import { SuccessModal } from "../components/feedback/SuccessModal";
import { Skeleton, SkeletonTableBody } from "../components/skeleton";
import { CURRENCIES } from "../data/accountTypeOptions";
import "./AccountsPage.css";

type AccountRow = {
  id: string;
  name: string;
  subtype: string;
  accountNumber: string;
  productCode: string;
  linkedGl: string;
  balance: string;
  status: string;
  currency: string;
  branchCode: string;
  customerId: string;
};

type OpenDraft = {
  customerId: string;
  customerLabel: string;
  cif: string;
  productCode: string;
  currency: string;
  branchCode: string;
  accountNumber: string;
};

const PAGE_SIZE = 20;
const STATUS_OPTIONS = ["All", "ACTIVE", "PENDING_APPROVAL", "PENDING_ACTIVATION", "DORMANT", "CLOSED", "FAILED_ACTIVATION"] as const;

function emptyOpenDraft(): OpenDraft {
  return {
    customerId: "",
    customerLabel: "",
    cif: "",
    productCode: "",
    currency: "",
    branchCode: "",
    accountNumber: "",
  };
}

function SelectPlaceholder() {
  return (
    <option value="" disabled>
      Select
    </option>
  );
}

function mapAccountToRow(a: AccountResponse, extras?: Partial<AccountRow>): AccountRow {
  return {
    id: a.id,
    name: extras?.name ?? a.customerType ?? "—",
    subtype: a.customerType || "—",
    accountNumber: a.accountNumber,
    productCode: a.productCode,
    linkedGl: extras?.linkedGl ?? "—",
    balance: extras?.balance ?? "—",
    status: formatAccountStatus(String(a.status)),
    currency: a.currency,
    branchCode: a.branchCode,
    customerId: a.customerId,
  };
}

function unwrapEnquiry(res: AccountEnquiryResponse | AccountResponse | Record<string, unknown>): AccountResponse {
  if (res && typeof res === "object" && "account" in res && (res as AccountEnquiryResponse).account) {
    return (res as AccountEnquiryResponse).account;
  }
  return res as AccountResponse;
}

function pageContent<T>(page: { content?: T[] } | T[] | null | undefined): T[] {
  if (!page) return [];
  if (Array.isArray(page)) return page;
  return page.content ?? [];
}

/** Accounts — wired to account-service search / open / close / reactivate. */
export function AccountsPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [listLoading, setListLoading] = useState(true);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [rows, setRows] = useState<AccountRow[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [branchFilter, setBranchFilter] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [branchOptions, setBranchOptions] = useState<string[]>([]);
  const [products, setProducts] = useState<CasaProduct[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [ledgerRow, setLedgerRow] = useState<AccountRow | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("Account created successfully");
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQuery, branchFilter, currencyFilter, statusFilter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [branchPage, productPage] = await Promise.all([
          listBranches({ status: "ACTIVE", size: 100 }).catch(() => ({ content: [] })),
          listCasaProducts({ status: "ACTIVE", size: 100 }).catch(() => ({ content: [] })),
        ]);
        if (cancelled) return;
        const branches = pageContent<Branch>(branchPage as { content?: Branch[] });
        setBranchOptions(branches.map((b) => b.code).filter(Boolean));
        setProducts(pageContent<CasaProduct>(productPage as { content?: CasaProduct[] }));
      } catch {
        /* filters fall back to free text / empty */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setListLoading(true);
      setListError(null);
      try {
        const result = await searchAccounts({
          q: debouncedQuery || undefined,
          branchCode: branchFilter || undefined,
          currency: currencyFilter || undefined,
          status: statusFilter !== "All" ? statusFilter : undefined,
          page,
          size: PAGE_SIZE,
        });
        if (cancelled) return;
        setRows(result.content.map((a) => mapAccountToRow(a)));
        setTotalPages(Math.max(1, result.totalPages || 1));
        setTotalElements(result.totalElements ?? 0);
      } catch (e) {
        if (cancelled) return;
        setRows([]);
        setTotalElements(0);
        setTotalPages(1);
        setListError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Unable to load accounts");
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, branchFilter, currencyFilter, statusFilter, page]);

  async function lookupAccount() {
    const acct = query.trim();
    if (!acct) return;
    setLookupError(null);
    setLookupLoading(true);
    try {
      const res = await enquireAccount(acct);
      const account = unwrapEnquiry(res);
      const row = mapAccountToRow(account);
      setRows((prev) => [row, ...prev.filter((x) => x.accountNumber !== row.accountNumber)]);
      setToast({ title: "Account found", message: row.accountNumber });
    } catch (e) {
      setLookupError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLookupLoading(false);
    }
  }

  async function refreshList() {
    setPage(0);
    setDebouncedQuery((q) => q);
    // force reload by bumping list via re-fetch
    setListLoading(true);
    try {
      const result = await searchAccounts({
        q: debouncedQuery || undefined,
        branchCode: branchFilter || undefined,
        currency: currencyFilter || undefined,
        status: statusFilter !== "All" ? statusFilter : undefined,
        page: 0,
        size: PAGE_SIZE,
      });
      setRows(result.content.map((a) => mapAccountToRow(a)));
      setTotalPages(Math.max(1, result.totalPages || 1));
      setTotalElements(result.totalElements ?? 0);
      setListError(null);
    } catch (e) {
      setListError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Unable to load accounts");
    } finally {
      setListLoading(false);
    }
  }

  const fromIdx = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const toIdx = Math.min((page + 1) * PAGE_SIZE, totalElements);
  const branchSelectOptions = branchOptions.length ? branchOptions : ["HQ", "001"];

  return (
    <div className="accounts" aria-busy={listLoading || lookupLoading}>
      {toast ? (
        <AppAlert tone="success" title={toast.title} message={toast.message} onClose={() => setToast(null)} />
      ) : null}

      {successOpen ? (
        <SuccessModal
          title="Successful"
          message={successMsg}
          onOkay={() => {
            setSuccessOpen(false);
            setToast({ title: "Success", message: successMsg });
          }}
        />
      ) : null}

      <div className="accounts-head">
        <h1>Accounts</h1>
        <button type="button" className="accounts-add" onClick={() => setModalOpen(true)}>
          + Add New Account
        </button>
      </div>

      <div className="accounts-filters">
        <FilterSelect
          label="Branch Code"
          value={branchFilter}
          options={["", ...branchSelectOptions]}
          optionLabels={{ "": "All" }}
          onChange={(v) => setBranchFilter(v)}
        />
        <FilterSelect
          label="Currency"
          value={currencyFilter}
          options={["", ...CURRENCIES]}
          optionLabels={{ "": "All" }}
          onChange={setCurrencyFilter}
        />
        <FilterSelect label="Status" value={statusFilter} options={[...STATUS_OPTIONS]} onChange={setStatusFilter} />
      </div>

      <label className="accounts-table-search">
        <SearchIcon />
        <input
          type="search"
          placeholder="Search account number or product… (Enter for exact enquiry)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void lookupAccount();
            }
          }}
          disabled={lookupLoading}
        />
      </label>
      {lookupError ? (
        <p className="accounts-empty" role="alert" style={{ margin: "0 0 0.75rem" }}>
          {lookupError}
        </p>
      ) : null}
      {listError ? (
        <p className="accounts-empty" role="alert" style={{ margin: "0 0 0.75rem" }}>
          {listError}
        </p>
      ) : null}

      <div className={`accounts-table-wrap${listLoading || lookupLoading ? " is-loading" : ""}`}>
        <table className="accounts-table">
          <thead>
            <tr>
              <th>Account ID</th>
              <th>Customer / Type</th>
              <th>Account Number</th>
              <th>Product Code</th>
              <th>Branch</th>
              <th>Currency</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {listLoading || lookupLoading ? (
              <SkeletonTableBody rows={6} columns={["xs", "name", "md", "sm", "sm", "xs", "pill", "action"]} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="accounts-empty">
                  No accounts match these filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td title={row.id}>{row.id.slice(0, 8)}…</td>
                  <td>
                    <div className="accounts-name">
                      <strong>{row.name}</strong>
                      <span>{row.subtype}</span>
                    </div>
                  </td>
                  <td>{row.accountNumber}</td>
                  <td>{row.productCode}</td>
                  <td>{row.branchCode}</td>
                  <td>{row.currency}</td>
                  <td>{row.status}</td>
                  <td>
                    <div className="accounts-actions">
                      <button type="button" onClick={() => setLedgerRow(row)}>
                        View Ledger
                      </button>
                      <span aria-hidden>·</span>
                      <button
                        type="button"
                        onClick={() => {
                          void (async () => {
                            try {
                              await closeAccount(row.accountNumber, "Closed from accounts UI");
                              setToast({ title: "Close submitted", message: row.accountNumber });
                              await refreshList();
                            } catch (e) {
                              window.alert(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Close failed");
                            }
                          })();
                        }}
                      >
                        Close
                      </button>
                      <span aria-hidden>·</span>
                      <button
                        type="button"
                        onClick={() => {
                          void (async () => {
                            try {
                              await reactivateAccount(row.accountNumber);
                              setToast({ title: "Account reactivated", message: row.accountNumber });
                              await refreshList();
                            } catch (e) {
                              window.alert(
                                e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Reactivate failed",
                              );
                            }
                          })();
                        }}
                      >
                        Reactivate
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="accounts-pager" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem", gap: "1rem" }}>
        <span>
          {listLoading ? "…" : totalElements === 0 ? "0 results" : `${fromIdx}–${toIdx} of ${totalElements}`}
        </span>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button type="button" disabled={page <= 0 || listLoading} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            Previous
          </button>
          <span>
            Page {totalElements === 0 ? 0 : page + 1} of {totalElements === 0 ? 0 : totalPages}
          </span>
          <button
            type="button"
            disabled={page + 1 >= totalPages || listLoading || totalElements === 0}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {modalOpen ? (
        <AddAccountModal
          products={products}
          branches={branchSelectOptions}
          onClose={() => setModalOpen(false)}
          onSubmit={async (draft) => {
            try {
              if (!draft.customerId || !draft.productCode || !draft.currency || !draft.branchCode) {
                window.alert("Customer, product, currency, and branch are required.");
                return;
              }
              const created = await openAccount({
                accountNumber: draft.accountNumber && /^[0-9]{10}$/.test(draft.accountNumber) ? draft.accountNumber : undefined,
                customerId: draft.customerId,
                productCode: draft.productCode.toUpperCase().replace(/[^A-Z0-9_-]/g, "_").slice(0, 40),
                currency: draft.currency.slice(0, 3).toUpperCase(),
                branchCode: draft.branchCode.toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 20),
              });
              const acct = created.accountNumber;
              const status = formatAccountStatus(String(created.status));
              const msg = acct
                ? created.status === "PENDING_APPROVAL"
                  ? `Account ${acct} submitted for approval`
                  : `Account ${acct} opened (${status})`
                : "Account open submitted";
              setModalOpen(false);
              setSuccessMsg(msg);
              setSuccessOpen(true);
              await refreshList();
            } catch (e) {
              window.alert(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Open account failed");
            }
          }}
        />
      ) : null}

      {ledgerRow ? <LedgerDrawer row={ledgerRow} onClose={() => setLedgerRow(null)} /> : null}

    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  optionLabels,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  optionLabels?: Record<string, string>;
  onChange: (v: string) => void;
}) {
  return (
    <label className="accounts-filter">
      <span>{label}</span>
      <div className="accounts-select">
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (
            <option key={o || "all"} value={o}>
              {optionLabels?.[o] ?? (o || "All")}
            </option>
          ))}
        </select>
        <ChevronDown />
      </div>
    </label>
  );
}

function AddAccountModal({
  products,
  branches,
  onClose,
  onSubmit,
}: {
  products: CasaProduct[];
  branches: string[];
  onClose: () => void;
  onSubmit: (draft: OpenDraft) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState<OpenDraft>(emptyOpenDraft());
  const [busy, setBusy] = useState(false);
  const [cifError, setCifError] = useState<string | null>(null);
  const [cifLoading, setCifLoading] = useState(false);

  const selectedProduct = products.find((p) => p.code === draft.productCode);
  const linkedGl =
    selectedProduct?.interestExpenseLedgerAccount || selectedProduct?.chargeIncomeLedgerAccount || "—";

  const set = <K extends keyof OpenDraft>(key: K, value: OpenDraft[K]) => {
    setDraft((d) => {
      const next = { ...d, [key]: value };
      if (key === "productCode") {
        const product = products.find((p) => p.code === value);
        if (product?.currency && !d.currency) next.currency = product.currency;
        if (product?.currency) next.currency = product.currency;
      }
      return next;
    });
  };

  async function resolveCustomer() {
    const cif = draft.cif.trim();
    if (!cif) {
      setCifError("Enter a CIF or customer UUID");
      return;
    }
    setCifLoading(true);
    setCifError(null);
    try {
      if (/^[0-9a-fA-F-]{36}$/.test(cif)) {
        set("customerId", cif);
        set("customerLabel", cif);
        return;
      }
      let customer: Record<string, unknown> | null = null;
      try {
        customer = (await getCustomerByCif(cif)) as Record<string, unknown>;
      } catch {
        const page = (await searchCustomers({ cifNumber: cif, size: 1 })) as {
          content?: Record<string, unknown>[];
        };
        customer = page.content?.[0] ?? null;
      }
      if (!customer) {
        setCifError("Customer not found");
        set("customerId", "");
        set("customerLabel", "");
        return;
      }
      const id = String(customer.id ?? customer.customerId ?? "");
      if (!id) {
        setCifError("Customer record missing id");
        return;
      }
      const name =
        String(customer.fullName ?? customer.name ?? customer.legalName ?? customer.cifNumber ?? id);
      set("customerId", id);
      set("customerLabel", name);
    } catch (e) {
      setCifError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Customer lookup failed");
      set("customerId", "");
      set("customerLabel", "");
    } finally {
      setCifLoading(false);
    }
  }

  return (
    <div className="acct-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="acct-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-account-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="acct-modal-head">
          <h2 id="add-account-title">Add New Account</h2>
          <button type="button" className="acct-modal-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="acct-modal-body">
          <section className="acct-section">
            <h3>Customer</h3>
            <label className="acct-field">
              <span>CIF or Customer ID</span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  value={draft.cif}
                  placeholder="Enter CIF or UUID"
                  onChange={(e) => set("cif", e.target.value)}
                />
                <button type="button" className="acct-btn-ghost" disabled={cifLoading} onClick={() => void resolveCustomer()}>
                  {cifLoading ? "…" : "Lookup"}
                </button>
              </div>
            </label>
            {cifError ? (
              <p role="alert" className="accounts-empty">
                {cifError}
              </p>
            ) : null}
            {draft.customerId ? (
              <p className="acct-meta">
                Linked: {draft.customerLabel} ({draft.customerId.slice(0, 8)}…)
              </p>
            ) : null}
          </section>

          <section className="acct-section">
            <h3>Product Assignment</h3>
            <label className="acct-field">
              <span>Product</span>
              <div className="acct-select">
                <select value={draft.productCode} onChange={(e) => set("productCode", e.target.value)}>
                  <SelectPlaceholder />
                  {products.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown />
              </div>
            </label>
            <label className="acct-field">
              <span>Currency</span>
              <div className="acct-select">
                <select value={draft.currency} onChange={(e) => set("currency", e.target.value)}>
                  <SelectPlaceholder />
                  {(selectedProduct?.currency ? [selectedProduct.currency] : [...CURRENCIES]).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown />
              </div>
            </label>
            <label className="acct-field">
              <span>Branch</span>
              <div className="acct-select">
                <select value={draft.branchCode} onChange={(e) => set("branchCode", e.target.value)}>
                  <SelectPlaceholder />
                  {branches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <ChevronDown />
              </div>
            </label>
            <label className="acct-field">
              <span>Linked GL (from product)</span>
              <input value={linkedGl} readOnly />
            </label>
            <label className="acct-field">
              <span>Account Number (optional)</span>
              <input
                value={draft.accountNumber}
                placeholder="10-digit NUBAN — leave blank to auto-generate"
                onChange={(e) => set("accountNumber", e.target.value)}
              />
            </label>
          </section>
        </div>

        <footer className="acct-modal-foot">
          <div className="acct-modal-foot-left">
            <button type="button" className="acct-btn-ghost" onClick={onClose}>
              Cancel
            </button>
          </div>
          <button
            type="button"
            className="acct-btn-primary"
            disabled={busy}
            onClick={() => {
              void (async () => {
                setBusy(true);
                try {
                  await onSubmit(draft);
                } finally {
                  setBusy(false);
                }
              })();
            }}
          >
            {busy ? "Submitting…" : "Add New Account"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function LedgerDrawer({ row, onClose }: { row: AccountRow; onClose: () => void }) {
  const [balance, setBalance] = useState(row.balance);
  const [lines, setLines] = useState<{ date: string; ref: string; narr: string; dr: string; cr: string }[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(row.status);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [bal, entries, acct] = await Promise.all([
          getAccountBalance(row.accountNumber).catch(() => null),
          getAccountEntries(row.accountNumber, { size: 50 }).catch(() => null),
          getAccount(row.accountNumber).catch(() => null),
        ]);
        if (cancelled) return;
        if (bal && typeof bal === "object") {
          const b = bal as Record<string, unknown>;
          setBalance(String(b.availableBalance ?? b.ledgerBalance ?? b.balance ?? row.balance));
        }
        if (acct) {
          setStatus(formatAccountStatus(String(acct.status)));
        }
        const content =
          Array.isArray(entries)
            ? entries
            : entries && typeof entries === "object" && "content" in entries && Array.isArray((entries as { content: unknown }).content)
              ? (entries as { content: Record<string, unknown>[] }).content
              : [];
        if (content.length) {
          setLines(
            content.map((e, i) => ({
              date: String(e.valueDate ?? e.postingDate ?? e.createdAt ?? "—"),
              ref: String(e.reference ?? e.id ?? `E-${i}`),
              narr: String(e.narration ?? e.description ?? "—"),
              dr: String(e.debit ?? (String(e.side ?? "").toUpperCase() === "DEBIT" ? e.amount : "—") ?? "—"),
              cr: String(e.credit ?? (String(e.side ?? "").toUpperCase() === "CREDIT" ? e.amount : "—") ?? "—"),
            })),
          );
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Ledger load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [row.accountNumber, row.balance]);

  return (
    <div className="acct-modal-backdrop" role="presentation" onClick={onClose}>
      <aside className="acct-ledger" role="dialog" aria-labelledby="ledger-title" onClick={(e) => e.stopPropagation()}>
        <header className="acct-ledger-head">
          <div>
            <h2 id="ledger-title">View Ledger</h2>
            <p>
              {row.name} · {row.accountNumber}
            </p>
            {err ? <p role="alert">{err}</p> : null}
          </div>
          <button type="button" className="acct-modal-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>
        <dl className="acct-ledger-meta">
          <div>
            <dt>Product</dt>
            <dd>{row.productCode}</dd>
          </div>
          <div>
            <dt>Branch</dt>
            <dd>{row.branchCode}</dd>
          </div>
          <div>
            <dt>Balance</dt>
            <dd>{loading ? <Skeleton size="sm" /> : balance}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{status}</dd>
          </div>
        </dl>
        <div className="acct-ledger-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Narration</th>
                <th>Debit</th>
                <th>Credit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTableBody rows={5} columns={["sm", "md", "lg", "sm", "sm"]} />
              ) : lines.length === 0 ? (
                <tr>
                  <td colSpan={5}>No ledger entries</td>
                </tr>
              ) : (
                lines.map((l) => (
                  <tr key={l.ref}>
                    <td>{l.date}</td>
                    <td>{l.ref}</td>
                    <td>{l.narr}</td>
                    <td>{l.dr}</td>
                    <td>{l.cr}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <footer className="acct-ledger-foot">
          <button type="button" className="acct-btn-ghost" onClick={onClose}>
            Close
          </button>
        </footer>
      </aside>
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
