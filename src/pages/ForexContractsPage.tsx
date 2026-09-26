import { useMemo, useState } from "react";
import { FilterDropdown } from "../components/FilterDropdown";
import { ContractTypeTabs } from "../components/ContractTypeTabs";
import {
  CONTRACT_PRODUCT_FILTERS,
  CURRENCY_CODES,
  INTEREST_GL_UNIQUE,
  ISSUER_TYPES,
  PRINCIPAL_GL_UNIQUE,
  TABLE_OVERFLOW_ACTIONS,
} from "../data/filterDropdownOptions";
import "./ForexContractsPage.css";
import { ViewDetailsModal } from "../components/feedback/ViewDetailsModal";
import { ConfirmActionModal } from "../components/feedback/ConfirmActionModal";

type ForexRow = {
  id: string;
  baseCurrency: string;
  counterCurrency: string;
  amount: string;
  rate: string;
  counterparty: string;
  tradeDate: string;
  settlementDate: string;
  status: string;
};

const ROWS: ForexRow[] = [
  {
    id: "FX2024-001",
    baseCurrency: "USD",
    counterCurrency: "NGN",
    amount: "$1,000,000*",
    rate: "1450.50",
    counterparty: "Zenith Bank",
    tradeDate: "01-May-2024",
    settlementDate: "03-May-2024",
    status: "Settled",
  },
  {
    id: "FX2024-002",
    baseCurrency: "USD",
    counterCurrency: "NGN",
    amount: "$1,000,000*",
    rate: "1450.50",
    counterparty: "GTBank",
    tradeDate: "01-May-2024",
    settlementDate: "03-May-2024",
    status: "Open",
  },
  {
    id: "FX2024-003",
    baseCurrency: "EUR",
    counterCurrency: "NGN",
    amount: "$1,000,000*",
    rate: "1580.25",
    counterparty: "CBN",
    tradeDate: "02-May-2024",
    settlementDate: "04-May-2024",
    status: "Settled",
  },
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `FX2024-00${i + 4}`,
    baseCurrency: "USD",
    counterCurrency: "NGN",
    amount: "$1,000,000*",
    rate: "1450.50",
    counterparty: "Zenith Bank",
    tradeDate: "01-May-2024",
    settlementDate: "03-May-2024",
    status: "Settled",
  })),
];

export function ForexContractsPage() {
  const [query, setQuery] = useState("");
  const [productFilter, setProductFilter] = useState<string>(CONTRACT_PRODUCT_FILTERS[0]);
  const [tableAction, setTableAction] = useState<string>(TABLE_OVERFLOW_ACTIONS[1]);
  type ModalState =
    | { kind: "add" }
    | { kind: "view"; row: ForexRow }
    | { kind: "rebook"; row: ForexRow }
    | { kind: "cancel"; row: ForexRow }
    | null;
  const [modal, setModal] = useState<ModalState>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = ROWS;
    if (productFilter !== "All" && productFilter !== "Forex") {
      list = [];
    }
    if (q) {
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.counterparty.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q) ||
          r.baseCurrency.toLowerCase().includes(q),
      );
    }
    const sorted = [...list];
    if (tableAction === "Sort By Date") {
      sorted.sort((a, b) => a.tradeDate.localeCompare(b.tradeDate));
    } else if (tableAction === "Sort By Status") {
      sorted.sort((a, b) => a.status.localeCompare(b.status));
    } else if (tableAction === "Sort By Amount") {
      sorted.sort((a, b) => {
        const av = Number(a.amount.replace(/[^\d.]/g, ""));
        const bv = Number(b.amount.replace(/[^\d.]/g, ""));
        return av - bv;
      });
    } else if (tableAction === "Clear Table") {
      return [];
    }
    return sorted;
  }, [query, tableAction, productFilter]);

  return (
    <div className="forex">
      <div className="forex-head">
        <div>
          <h1>FOREX CONTRACTS</h1>
          <button type="button" className="forex-add" onClick={() => setModal({ kind: "add" })}>
            +Add New Contract
          </button>
        </div>
        <div className="forex-toolbar">
          <FilterDropdown
            aria-label="Filter by product"
            triggerClassName="forex-filter-btn"
            menuAlign="end"
            options={CONTRACT_PRODUCT_FILTERS}
            value={productFilter}
            onSelect={setProductFilter}
            trigger={
              <>
                <FilterIcon />
                Filter{productFilter !== "All" ? `: ${productFilter}` : ""}
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
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <div className="forex-table-wrap">
        <table className="forex-table">
          <thead>
            <tr>
              <th>FX Contract ID</th>
              <th>Base Currency</th>
              <th>Counter Currency</th>
              <th>Amount*</th>
              <th>Rate</th>
              <th>Counterparty</th>
              <th>Trade Date</th>
              <th>Settlement Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={`${row.id}-${i}`}>
                <td>{row.id}</td>
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
                    <button type="button" onClick={() => setModal({ kind: "view", row })}>View</button>
                    <span aria-hidden>·</span>
                    <button type="button" onClick={() => setModal({ kind: "rebook", row })}>Rebook</button>
                    <span aria-hidden>·</span>
                    <button type="button" className="is-danger" onClick={() => setModal({ kind: "cancel", row })}>Cancel</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal?.kind === "add" || modal?.kind === "rebook" ? (
        <AddForexModal
          onClose={() => setModal(null)}
          initial={modal.kind === "rebook" ? modal.row : undefined}
          mode={modal.kind === "rebook" ? "rebook" : "add"}
        />
      ) : null}
      {modal?.kind === "view" ? (
        <ViewDetailsModal
          title="View Forex Contract"
          fields={[
            { label: "FX Contract ID", value: modal.row.id },
            { label: "Base Currency", value: modal.row.baseCurrency },
            { label: "Counter Currency", value: modal.row.counterCurrency },
            { label: "Amount", value: modal.row.amount },
            { label: "Rate", value: modal.row.rate },
            { label: "Counterparty", value: modal.row.counterparty },
            { label: "Trade Date", value: modal.row.tradeDate, date: true },
            { label: "Settlement Date", value: modal.row.settlementDate, date: true },
            { label: "Status", value: modal.row.status },
          ]}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal?.kind === "cancel" ? (
        <ConfirmActionModal
          title="Cancel Contract ?"
          message={`Do you want to cancel ${modal.row.id}?`}
          onConfirm={() => setModal(null)}
          onClose={() => setModal(null)}
        />
      ) : null}
    </div>
  );
}

function AddForexModal({
  onClose,
  initial,
  mode = "add",
}: {
  onClose: () => void;
  initial?: { id: string; amount: string; baseCurrency: string; counterCurrency: string; counterparty: string; rate: string; tradeDate: string; settlementDate: string };
  mode?: "add" | "rebook";
}) {
  const [fxId, setFxId] = useState(initial?.id ?? "FX2025-005");
  const [notional, setNotional] = useState(initial?.amount?.replace("₦", "").replace(/,/g, "") ?? "1,000,000");
  const [baseCurrency, setBaseCurrency] = useState<string>(initial?.baseCurrency ?? CURRENCY_CODES[0]);
  const [counterCurrency, setCounterCurrency] = useState<string>(initial?.counterCurrency ?? CURRENCY_CODES[1]);
  const [counterparty, setCounterparty] = useState<string>(initial?.counterparty ?? ISSUER_TYPES[0]);
  const [rate, setRate] = useState(initial?.rate ?? "1475.25");
  const [tradeDate, setTradeDate] = useState(initial?.tradeDate ? initial.tradeDate.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$1-$2") : "2025-06-15");
  const [settlementDate, setSettlementDate] = useState(initial?.settlementDate ? initial.settlementDate.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$1-$2") : "2025-06-15");
  const [debitGl, setDebitGl] = useState<string>(PRINCIPAL_GL_UNIQUE[0]);
  const [creditGl, setCreditGl] = useState<string>(INTEREST_GL_UNIQUE[0]);

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
          <div className="forex-modal-grid">
            <label className="forex-field">
              <span>FX Contract ID</span>
              <input value={fxId} onChange={(e) => setFxId(e.target.value)} />
            </label>
            <label className="forex-field">
              <span>Notional Amount</span>
              <input value={notional} onChange={(e) => setNotional(e.target.value)} />
            </label>
            <div className="forex-field">
              <span>Base Currency</span>
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
              <span>Counterparty</span>
              <FilterDropdown
                aria-label="Counterparty"
                className="forex-fdrop"
                triggerClassName="forex-fdrop-trigger"
                options={ISSUER_TYPES}
                value={counterparty}
                onSelect={setCounterparty}
                trigger={
                  <>
                    <span className="forex-fdrop-value">{counterparty}</span>
                    <ChevronDown />
                  </>
                }
              />
            </div>
            <div className="forex-field">
              <span>Counter Currency</span>
              <FilterDropdown
                aria-label="Counter currency"
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
              <span>Exchange Rate</span>
              <input value={rate} onChange={(e) => setRate(e.target.value)} />
            </label>
            <label className="forex-field">
              <span>Trade Date</span>
              <div className="forex-date">
                <CalendarIcon />
                <input
                  type="date"
                  value={tradeDate}
                  onChange={(e) => setTradeDate(e.target.value)}
                />
                <ChevronDown />
              </div>
            </label>
            <label className="forex-field">
              <span>Settlement Date</span>
              <div className="forex-date">
                <CalendarIcon />
                <input
                  type="date"
                  value={settlementDate}
                  onChange={(e) => setSettlementDate(e.target.value)}
                />
                <ChevronDown />
              </div>
            </label>
          </div>

          <h3 className="forex-gl-title">GL Mapping (Accounting)</h3>
          <div className="forex-modal-grid forex-modal-grid--gl">
            <div className="forex-field">
              <span>Debit GL</span>
              <FilterDropdown
                aria-label="Debit GL"
                className="forex-fdrop"
                triggerClassName="forex-fdrop-trigger"
                options={PRINCIPAL_GL_UNIQUE}
                value={debitGl}
                onSelect={setDebitGl}
                trigger={
                  <>
                    <span className="forex-fdrop-value">{debitGl}</span>
                    <ChevronDown />
                  </>
                }
              />
            </div>
            <div className="forex-field">
              <span>Credit GL</span>
              <FilterDropdown
                aria-label="Credit GL"
                className="forex-fdrop"
                triggerClassName="forex-fdrop-trigger"
                options={INTEREST_GL_UNIQUE}
                value={creditGl}
                onSelect={setCreditGl}
                trigger={
                  <>
                    <span className="forex-fdrop-value">{creditGl}</span>
                    <ChevronDown />
                  </>
                }
              />
            </div>
          </div>
        </div>

        <footer className="forex-modal-foot">
          <div className="forex-modal-foot-left">
            <button type="button" className="forex-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="forex-btn-ghost" onClick={() => window.alert("Closed")}>
              Save Draft
            </button>
          </div>
          <button type="button" className="forex-btn-primary" onClick={onClose}>
            Create
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

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
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

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3.5v3M16 3.5v3M3.5 9.5h17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
