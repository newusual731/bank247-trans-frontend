import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ContractTypeTabs } from "../components/ContractTypeTabs";
import { FilterDropdown } from "../components/FilterDropdown";
import { CURRENCY_CODES, TABLE_OVERFLOW_ACTIONS } from "../data/filterDropdownOptions";
import "./LettersOfCreditPage.css";
import { listTradeInstruments } from "../api/domain";
import {
  createTradeInstrument,
  issueTradeInstrument,
  confirmTradeInstrument,
  cancelTradeInstrument,
} from "../api/contracts";
import { searchAccounts } from "../api/accounts";
import { getCustomerByCif, searchCustomers } from "../api/customers";
import { ApiError } from "../lib/apiClient";
import { formatTxnDate, formatTxnMoney } from "../api/transactions";
import { ViewDetailsModal } from "../components/feedback/ViewDetailsModal";
import { ConfirmActionModal } from "../components/feedback/ConfirmActionModal";
import { useActionFeedback } from "../components/feedback/useActionFeedback";

type LcRow = {
  ref: string;
  applicant: string;
  applicantAccount: string;
  customerId: string;
  beneficiary: string;
  bankCode: string;
  currency: string;
  amount: string;
  amountNum: number;
  outstanding: string;
  issueDate: string;
  expiryDate: string;
  applicationDate: string;
  tenorDays: number;
  status: string;
  statusKey: string;
  statusRaw: string;
};

type ModalState =
  | { kind: "add" }
  | { kind: "rebook"; row: LcRow }
  | { kind: "view"; row: LcRow }
  | { kind: "confirm"; action: "Issue" | "Confirm" | "Cancel"; row: LcRow }
  | null;

const PAGE_SIZE = 20;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACCOUNT_RE = /^[A-Za-z0-9_.-]{4,30}$/;
const BANK_CODES = ["CITIUS", "CHASUS", "DEUTDE", "BNPAFR", "SCBLLN", "GTBINGLA"] as const;
const STATUS_FILTERS = ["All", "DRAFT", "PENDING_APPROVAL", "APPROVED", "ISSUED", "CONFIRMED", "SETTLED", "CLOSED", "CANCELLED"] as const;

function toList(res: unknown): Record<string, unknown>[] {
  if (Array.isArray(res)) return res as Record<string, unknown>[];
  if (res && typeof res === "object" && "content" in res && Array.isArray((res as { content: unknown }).content)) {
    return (res as { content: Record<string, unknown>[] }).content;
  }
  return [];
}

function statusUi(raw: string): { label: string; key: string } {
  const u = raw.toUpperCase();
  if (u.includes("CANCEL")) return { label: "Cancelled", key: "cancelled" };
  if (u.includes("CLOSE") || u.includes("SETTLE")) return { label: "Closed", key: "closed" };
  if (u.includes("ISSUE") || u.includes("CONFIRM") || u.includes("ACCEPT")) return { label: "Issued", key: "issued" };
  if (u.includes("APPROV") || u.includes("PENDING") || u.includes("DRAFT")) return { label: raw.replace(/_/g, " "), key: "issued" };
  return { label: raw || "—", key: "issued" };
}

function mapInstrument(item: Record<string, unknown>, i: number): LcRow {
  const currency = String(item.currency ?? "USD").toUpperCase();
  const amountNum = Number(item.faceAmount ?? item.amount ?? 0) || 0;
  const outstandingNum = Number(item.outstandingAmount ?? amountNum) || 0;
  const statusRaw = String(item.status ?? "—");
  const ui = statusUi(statusRaw);
  return {
    ref: String(item.instrumentReference ?? item.applicationReference ?? item.id ?? `LC-${i}`),
    applicant: String(item.applicantAccount ?? item.customerId ?? "—"),
    applicantAccount: String(item.applicantAccount ?? ""),
    customerId: String(item.customerId ?? ""),
    beneficiary: String(item.beneficiaryName ?? item.beneficiary ?? "—"),
    bankCode: String(item.counterpartyBankCode ?? "—"),
    currency,
    amount: formatTxnMoney(amountNum, currency),
    amountNum,
    outstanding: formatTxnMoney(outstandingNum, currency),
    issueDate: formatTxnDate(null, String(item.issueDate ?? item.applicationDate ?? "")),
    expiryDate: formatTxnDate(null, String(item.expiryDate ?? "")),
    applicationDate: String(item.applicationDate ?? ""),
    tenorDays: Number(item.tenorDays ?? 0) || 0,
    status: ui.label,
    statusKey: ui.key,
    statusRaw,
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

export function LettersOfCreditPage() {
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [tableAction, setTableAction] = useState<string>(TABLE_OVERFLOW_ACTIONS[1]);
  const [modal, setModal] = useState<ModalState>(null);
  const [allRows, setAllRows] = useState<LcRow[]>([]);
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
  }, [debouncedQ, statusFilter, tableAction]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await listTradeInstruments({
          instrumentType: "LETTER_OF_CREDIT",
          status: statusFilter === "All" ? undefined : statusFilter,
          size: 100,
        });
        if (cancelled) return;
        const mapped = toList(res)
          .map(mapInstrument)
          .filter((r) => r.ref);
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
  }, [statusFilter, refreshKey]);

  const filtered = useMemo(() => {
    const q = debouncedQ.toLowerCase();
    let list = allRows;
    if (q) {
      list = list.filter(
        (r) =>
          r.ref.toLowerCase().includes(q) ||
          r.applicant.toLowerCase().includes(q) ||
          r.beneficiary.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q) ||
          r.statusRaw.toLowerCase().includes(q),
      );
    }
    if (tableAction === "Clear Table") return [];
    const sorted = [...list];
    if (tableAction === "Sort By Date") {
      sorted.sort((a, b) => a.issueDate.localeCompare(b.issueDate));
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
    <div className="lc">
      {feedbackUi}
      <div className="lc-head">
        <div>
          <h1>LETTERS OF CREDIT</h1>
          {loadError ? <p role="alert">{loadError}</p> : null}
          {actionError ? <p role="alert">{actionError}</p> : null}
          <button type="button" className="lc-add" onClick={() => setModal({ kind: "add" })}>
            +Add New Contract
          </button>
        </div>
        <div className="lc-toolbar">
          <FilterDropdown
            aria-label="Filter by status"
            triggerClassName="lc-filter-btn"
            menuAlign="end"
            options={[...STATUS_FILTERS]}
            value={statusFilter}
            onSelect={setStatusFilter}
            trigger={
              <>
                <FilterIcon />
                {statusFilter === "All" ? "Filter: All" : `Filter: ${statusFilter}`}
              </>
            }
          />
          <FilterDropdown
            aria-label="Table sort and actions"
            triggerClassName="lc-sort-btn"
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

      <label className="lc-search">
        <SearchIcon />
        <input
          type="search"
          placeholder="Search LC reference, applicant, beneficiary, status…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <div className="lc-table-wrap">
        <table className="lc-table">
          <thead>
            <tr>
              <th>LC Reference No</th>
              <th>Applicant account</th>
              <th>Beneficiary</th>
              <th>Amount</th>
              <th>Issue Date</th>
              <th>Expiry Date</th>
              <th>Outstanding</th>
              <th>Status</th>
              <th>Action</th>
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
                  No letters of credit yet. Use +Add New Contract.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.ref}>
                  <td>{row.ref}</td>
                  <td>{row.applicant}</td>
                  <td>{row.beneficiary}</td>
                  <td>{row.amount}</td>
                  <td>{row.issueDate}</td>
                  <td>{row.expiryDate}</td>
                  <td>{row.outstanding}</td>
                  <td>
                    <span className={`lc-status is-${row.statusKey}`} title={row.statusRaw}>
                      {row.statusRaw.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td>
                    <div className="lc-actions">
                      <button type="button" onClick={() => setModal({ kind: "view", row })}>
                        View
                      </button>
                      <span aria-hidden>·</span>
                      {row.statusRaw === "APPROVED" || row.statusRaw === "DRAFT" || row.statusRaw === "PENDING_APPROVAL" ? (
                        <>
                          <button type="button" onClick={() => setModal({ kind: "confirm", action: "Issue", row })}>
                            Issue
                          </button>
                          <span aria-hidden>·</span>
                        </>
                      ) : null}
                      {row.statusRaw === "ISSUED" ? (
                        <>
                          <button type="button" onClick={() => setModal({ kind: "confirm", action: "Confirm", row })}>
                            Confirm
                          </button>
                          <span aria-hidden>·</span>
                        </>
                      ) : null}
                      {row.statusKey !== "cancelled" && row.statusKey !== "closed" ? (
                        <button
                          type="button"
                          className="is-danger"
                          onClick={() => setModal({ kind: "confirm", action: "Cancel", row })}
                        >
                          Cancel
                        </button>
                      ) : (
                        <button type="button" onClick={() => setModal({ kind: "rebook", row })}>
                          Rebook
                        </button>
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
            <AddLcModal
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
              title="View Letter of Credit"
              fields={[
                { label: "LC Ref", value: modal.row.ref },
                { label: "Customer ID", value: modal.row.customerId || "—" },
                { label: "Applicant account", value: modal.row.applicantAccount || modal.row.applicant },
                { label: "Beneficiary", value: modal.row.beneficiary },
                { label: "Bank code", value: modal.row.bankCode },
                { label: "Amount", value: modal.row.amount },
                { label: "Outstanding", value: modal.row.outstanding },
                { label: "Issue Date", value: modal.row.issueDate, date: true },
                { label: "Expiry Date", value: modal.row.expiryDate, date: true },
                { label: "Tenor (days)", value: modal.row.tenorDays ? String(modal.row.tenorDays) : "—" },
                { label: "Status", value: modal.row.statusRaw },
              ]}
              onClose={() => setModal(null)}
            />,
            document.body,
          )
        : null}
      {modal?.kind === "confirm" ? (
        <ConfirmActionModal
          title={`${modal.action} LC ?`}
          message={`Do you want to ${modal.action.toLowerCase()} ${modal.row.ref}?`}
          tone={modal.action === "Cancel" ? "danger" : "primary"}
          onConfirm={() => {
            void (async () => {
              setActionError(null);
              try {
                const id = modal.row.ref;
                const today = new Date().toISOString().slice(0, 10);
                if (modal.action === "Cancel") await cancelTradeInstrument(id, "Cancelled from LC UI");
                else if (modal.action === "Confirm") await confirmTradeInstrument(id);
                else if (modal.action === "Issue") {
                  await issueTradeInstrument(id, {
                    issueDate: today,
                    sendSwiftMessage: false,
                    environment: "UAT",
                  });
                }
                setModal(null);
                const done =
                  modal.action === "Issue"
                    ? `Issued ${id}`
                    : modal.action === "Confirm"
                      ? `Confirmed ${id}`
                      : `Cancelled ${id}`;
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

function AddLcModal({
  onClose,
  onDone,
  initial,
  mode = "add",
}: {
  onClose: () => void;
  onDone: (message: string) => void;
  initial?: LcRow;
  mode?: "add" | "rebook";
}) {
  const [cifOrId, setCifOrId] = useState(initial?.customerId ?? "");
  const [customerId, setCustomerId] = useState(initial?.customerId ?? "");
  const [customerLabel, setCustomerLabel] = useState("");
  const [applicantAccount, setApplicantAccount] = useState(initial?.applicantAccount ?? "");
  const [accountChoices, setAccountChoices] = useState<string[]>([]);
  const [beneficiary, setBeneficiary] = useState(initial?.beneficiary && initial.beneficiary !== "—" ? initial.beneficiary : "Foreign Vendor Ltd");
  const [bankCode, setBankCode] = useState(
    initial?.bankCode && initial.bankCode !== "—" ? initial.bankCode : "CITIUS",
  );
  const [amount, setAmount] = useState(initial ? String(initial.amountNum || 500000) : "500000");
  const [currency, setCurrency] = useState(initial?.currency || "USD");
  const [applicationDate, setApplicationDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expiry, setExpiry] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 180);
    return d.toISOString().slice(0, 10);
  });
  const [tenorDays, setTenorDays] = useState(String(initial?.tenorDays || 90));
  const [purpose, setPurpose] = useState(mode === "rebook" && initial ? `Rebook of ${initial.ref}` : "Import of goods");
  const [issueNow, setIssueNow] = useState(true);
  const [busy, setBusy] = useState(false);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          .filter((n) => ACCOUNT_RE.test(n));
        setAccountChoices(nums);
        if (nums[0]) setApplicantAccount(nums[0]);
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
      if (nums[0]) setApplicantAccount(nums[0]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Customer lookup failed");
    } finally {
      setLookupBusy(false);
    }
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      if (!customerId || !UUID_RE.test(customerId)) {
        throw new Error("Resolve a valid customer (UUID) before creating");
      }
      const acct = normalizeAccount(applicantAccount);
      if (!ACCOUNT_RE.test(acct)) throw new Error("Applicant account must be 4–30 alphanumeric characters");
      const amt = parseAmount(amount);
      if (amt <= 0) throw new Error("Amount must be greater than zero");
      if (!beneficiary.trim()) throw new Error("Beneficiary name is required");
      if (expiry < applicationDate) throw new Error("Expiry must be on or after application date");

      const created = (await createTradeInstrument({
        applicationReference: `LC-${Date.now()}`,
        instrumentType: "LETTER_OF_CREDIT",
        customerId,
        applicantAccount: acct,
        beneficiaryName: beneficiary.trim(),
        counterpartyBankCode: bankCode.trim().toUpperCase() || undefined,
        currency: currency.slice(0, 3).toUpperCase(),
        amount: amt,
        applicationDate,
        expiryDate: expiry,
        purpose: purpose.trim() || undefined,
        tenorDays: Number(tenorDays) || undefined,
      })) as { instrumentReference?: string; applicationReference?: string };

      const ref = String(created.instrumentReference ?? created.applicationReference ?? "");
      if (ref && issueNow) {
        try {
          await issueTradeInstrument(ref, {
            issueDate: applicationDate,
            sendSwiftMessage: false,
            environment: "UAT",
          });
        } catch (issueErr) {
          const msg =
            issueErr instanceof ApiError
              ? issueErr.message
              : issueErr instanceof Error
                ? issueErr.message
                : "Issue deferred";
          onDone(`${ref} created — issue not completed: ${msg}`);
          return;
        }
      }
      onDone(`${mode === "rebook" ? "Rebooked" : "Created"} ${ref || "LC"}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="lc-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="lc-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-lc-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="lc-modal-head">
          <h2 id="add-lc-title">{mode === "rebook" ? "Rebook Letter of Credit" : "Add New Letter of Credit"}</h2>
          <button type="button" className="lc-modal-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="lc-modal-body">
          {error ? <p role="alert">{error}</p> : null}
          <div className="lc-modal-grid">
            <label className="lc-field" style={{ gridColumn: "1 / -1" }}>
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
                  className="lc-btn-ghost"
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
            <label className="lc-field">
              <span>Applicant account (NUBAN)</span>
              {accountChoices.length > 0 ? (
                <select value={applicantAccount} onChange={(e) => setApplicantAccount(e.target.value)}>
                  {accountChoices.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={applicantAccount}
                  onChange={(e) => setApplicantAccount(e.target.value)}
                  placeholder="Customer account number"
                />
              )}
            </label>
            <label className="lc-field">
              <span>Beneficiary name</span>
              <input value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} />
            </label>
            <label className="lc-field">
              <span>Counterparty bank code</span>
              <select value={bankCode} onChange={(e) => setBankCode(e.target.value)}>
                {BANK_CODES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </label>
            <label className="lc-field">
              <span>Amount</span>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
            </label>
            <div className="lc-field">
              <span>Currency</span>
              <FilterDropdown
                aria-label="Currency"
                className="lc-select"
                triggerClassName="lc-fdrop-trigger"
                options={CURRENCY_CODES}
                value={currency}
                onSelect={setCurrency}
                trigger={
                  <>
                    <span>{currency}</span>
                    <ChevronDown />
                  </>
                }
              />
            </div>
            <label className="lc-field">
              <span>Application / issue date</span>
              <input type="date" value={applicationDate} onChange={(e) => setApplicationDate(e.target.value)} />
            </label>
            <label className="lc-field">
              <span>Expiry date</span>
              <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
            </label>
            <label className="lc-field">
              <span>Tenor (days)</span>
              <input value={tenorDays} onChange={(e) => setTenorDays(e.target.value)} inputMode="numeric" />
            </label>
            <label className="lc-field">
              <span>Issue immediately</span>
              <select value={issueNow ? "true" : "false"} onChange={(e) => setIssueNow(e.target.value === "true")}>
                <option value="true">Yes</option>
                <option value="false">No (create only)</option>
              </select>
            </label>
            <label className="lc-field" style={{ gridColumn: "1 / -1" }}>
              <span>Purpose</span>
              <textarea rows={2} value={purpose} onChange={(e) => setPurpose(e.target.value)} />
            </label>
          </div>
        </div>

        <footer className="lc-modal-foot">
          <div />
          <div className="lc-modal-foot-left">
            <button type="button" className="lc-btn-ghost" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button
              type="button"
              className="lc-btn-primary"
              disabled={busy || !customerId}
              onClick={() => void submit()}
            >
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
