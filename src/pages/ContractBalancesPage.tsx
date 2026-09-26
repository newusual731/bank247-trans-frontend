import { useMemo, useState } from "react";
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
import { ViewDetailsModal } from "../components/feedback/ViewDetailsModal";

type BalanceRow = {
  id: string;
  party: string;
  scope: "Customer" | "Internal";
  productType: string;
  currency: string;
  debit: string;
  credit: string;
  balance: string;
  status: "Active" | "Settled" | "Closed";
  lastActivity: string;
};

const EXTERNAL_ROWS: BalanceRow[] = Array.from({ length: 5 }, () => ({
  id: "C-0001123",
  party: "Zenith Bank Plc",
  scope: "Customer",
  productType: "Treasury Bill",
  currency: "NGN",
  debit: "₦0.00",
  credit: "₦5,000,000",
  balance: "₦5,000,000",
  status: "Active",
  lastActivity: "06/15/2025",
}));

const INTERNAL_ROWS: BalanceRow[] = [
  {
    id: "C-0002101",
    party: "Internal Treasury",
    scope: "Internal",
    productType: "Bond",
    currency: "NGN",
    debit: "₦0.00",
    credit: "₦5,000,000",
    balance: "₦5,000,000",
    status: "Active",
    lastActivity: "06/15/2025",
  },
  {
    id: "C-0002102",
    party: "FX Desk",
    scope: "Internal",
    productType: "Bond",
    currency: "NGN",
    debit: "₦0.00",
    credit: "₦5,000,000",
    balance: "₦5,000,000",
    status: "Settled",
    lastActivity: "06/15/2025",
  },
  {
    id: "C-0002103",
    party: "Vault Account",
    scope: "Internal",
    productType: "Treasury Bill",
    currency: "NGN",
    debit: "₦0.00",
    credit: "₦5,000,000",
    balance: "₦5,000,000",
    status: "Closed",
    lastActivity: "06/15/2025",
  },
  ...Array.from({ length: 2 }, (_, i) => ({
    id: `C-000210${i + 4}`,
    party: "Internal Treasury",
    scope: "Internal" as const,
    productType: "Bond",
    currency: "NGN",
    debit: "₦0.00",
    credit: "₦5,000,000",
    balance: "₦5,000,000",
    status: "Active" as const,
    lastActivity: "06/15/2025",
  })),
];

const ALL_ROWS = [...EXTERNAL_ROWS, ...INTERNAL_ROWS];

const EXPOSURE_ROWS = Array.from({ length: 5 }, () => ({
  id: "00501021",
  opening: "20,000",
  debit: "+100",
  closing: "+3000",
}));

export function ContractBalancesPage() {
  const [partyMode, setPartyMode] = useState<PartyScope>("All");
  const [productType, setProductType] = useState<string>(CONTRACT_PRODUCT_FILTERS[0]);
  const [currency, setCurrency] = useState<string>(CURRENCY_CODES[0]);
  const [date, setDate] = useState("2025-06-15");
  const [contractId, setContractId] = useState("");
  const [sortAction, setSortAction] = useState<string>(TABLE_OVERFLOW_ACTIONS[1]);
  const [addOpen, setAddOpen] = useState(false);
  const [reverseOpen, setReverseOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const rows = useMemo(() => {
    const source =
      partyMode === "All"
        ? ALL_ROWS
        : partyMode === "Customer"
          ? EXTERNAL_ROWS
          : INTERNAL_ROWS;
    const q = contractId.trim().toLowerCase();
    let list = source.filter((r) => {
      if (productType !== "All" && r.productType !== productType) return false;
      if (!q) return true;
      return r.id.toLowerCase().includes(q) || r.party.toLowerCase().includes(q);
    });
    if (sortAction === "Clear Table") return [];
    if (sortAction === "Sort By Date" || sortAction === "Sort By Status") {
      // Contract Entries sort subset
      list = [...list].sort((a, b) =>
        sortAction === "Sort By Status"
          ? a.status.localeCompare(b.status)
          : a.lastActivity.localeCompare(b.lastActivity),
      );
    } else if (sortAction === "Sort By Amount") {
      list = [...list].sort((a, b) => {
        const av = Number(a.balance.replace(/[^\d.]/g, ""));
        const bv = Number(b.balance.replace(/[^\d.]/g, ""));
        return av - bv;
      });
    }
    return list;
  }, [partyMode, productType, contractId, sortAction]);

  const partyColumn =
    partyMode === "Internal"
      ? "Internal Party"
      : partyMode === "Customer"
        ? "Customer Name"
        : "Party";

  return (
    <div className="cbal">
      <header className="cbal-banner">
        <h1>Contract Balances</h1>
      </header>

      <ContractTypeTabs />

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
            options={CURRENCY_CODES}
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
          <span>Date Range</span>
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
        <button
          type="button"
          className="cbal-btn cbal-btn--orange"
          onClick={() => setReverseOpen(true)}
        >
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
            {rows.map((row, i) => (
              <tr key={`${row.id}-${i}`}>
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
            ))}
          </tbody>
        </table>
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
                {EXPOSURE_ROWS.map((r, i) => (
                  <tr key={i}>
                    <td>{r.id}</td>
                    <td>{r.opening}</td>
                    <td>{r.debit}</td>
                    <td>{r.closing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="cbal-card cbal-donut-card">
            <h3>Balance Trend</h3>
            <BalanceTrendDonut />
            <div className="cbal-legend">
              <span>
                <i className="is-cyan" /> Bond
              </span>
              <span>
                <i className="is-orange" /> Bond
              </span>
              <span>
                <i className="is-pink" /> All
              </span>
            </div>
          </div>

          <div className="cbal-card cbal-line-card">
            <div className="cbal-line-head">
              <h3>Line</h3>
              <button type="button" onClick={() => setMoreOpen(true)}>MORE</button>
            </div>
            <LineTrendChart />
            <div className="cbal-legend">
              <span>
                <i className="is-blue" /> 2023
              </span>
              <span>
                <i className="is-green" /> 2024
              </span>
            </div>
          </div>
        </div>
      </section>

      {addOpen ? <AddContractModal onClose={() => setAddOpen(false)} /> : null}
      {reverseOpen ? <ReverseContractModal onClose={() => setReverseOpen(false)} /> : null}
      {moreOpen ? (
        <ViewDetailsModal
          title="Balance Trend Detail"
          fields={[
            { label: "Series", value: "Bond / All" },
            { label: "Period", value: "2023 – 2024" },
            { label: "Note", value: "Expanded chart options and export will connect to reporting." },
          ]}
          onClose={() => setMoreOpen(false)}
        />
      ) : null}
    </div>
  );
}

function AddContractModal({ onClose }: { onClose: () => void }) {
  const [contractType, setContractType] = useState<string>(CONTRACT_PARTY_TYPES[0]);
  const [product, setProduct] = useState<string>(INSTRUMENT_PRODUCT_CODES[0]);
  const [currency, setCurrency] = useState<string>(CURRENCY_CODES[0]);
  const [principal, setPrincipal] = useState("₦500,000.00");
  const [tenure, setTenure] = useState<string>(TENOR_MONTHS[2]);
  const [frequency, setFrequency] = useState<string>(PAYMENT_FREQUENCIES[0]);
  const [bankGuarantee, setBankGuarantee] = useState<string>(YES_NO[1]);
  const [referenceTxn, setReferenceTxn] = useState<string>(REFERENCE_TRANSACTIONS[0]);
  const [startDate, setStartDate] = useState("2025-06-15");
  const [maturityDate, setMaturityDate] = useState("2025-06-15");
  const [rate, setRate] = useState("12.5");
  const [active, setActive] = useState(true);
  const [description, setDescription] = useState("");
  const [principalGl, setPrincipalGl] = useState<string>(PRINCIPAL_GL_UNIQUE[0]);
  const [interestGl, setInterestGl] = useState<string>(INTEREST_GL_UNIQUE[0]);
  const [selectedPrincipal, setSelectedPrincipal] = useState<string[]>([PRINCIPAL_GL_UNIQUE[0]]);
  const [selectedInterest, setSelectedInterest] = useState<string[]>([INTEREST_GL_UNIQUE[0]]);

  const togglePrincipal = (v: string) => {
    setSelectedPrincipal((prev) => {
      const next = prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v];
      if (next[0]) setPrincipalGl(next[0]);
      return next;
    });
  };
  const toggleInterest = (v: string) => {
    setSelectedInterest((prev) => {
      const next = prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v];
      if (next[0]) setInterestGl(next[0]);
      return next;
    });
  };

  return (
    <div className="cbal-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="cbal-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-contract-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cbal-modal-head">
          <h2 id="add-contract-title">Add New Contract</h2>
          <button type="button" className="cbal-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="cbal-modal-body">
          <section>
            <h3>Contact Details</h3>
            <div className="cbal-modal-grid">
              <div className="cbal-field">
                <span>Contract Type</span>
                <FilterDropdown
                  aria-label="Contract type"
                  className="cbal-fdrop"
                  triggerClassName="cbal-fdrop-trigger"
                  options={CONTRACT_PARTY_TYPES}
                  value={contractType}
                  onSelect={setContractType}
                  trigger={
                    <>
                      <span className="cbal-fdrop-value">{contractType}</span>
                      <ChevronDown />
                    </>
                  }
                />
              </div>
              <div className="cbal-field">
                <span>Contract Product</span>
                <FilterDropdown
                  aria-label="Contract product"
                  className="cbal-fdrop"
                  triggerClassName="cbal-fdrop-trigger"
                  options={INSTRUMENT_PRODUCT_CODES}
                  value={product}
                  onSelect={setProduct}
                  trigger={
                    <>
                      <span className="cbal-fdrop-value">{product}</span>
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
                  options={CURRENCY_CODES}
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
                <span>Principal Amount</span>
                <input value={principal} onChange={(e) => setPrincipal(e.target.value)} />
              </label>
              <div className="cbal-field">
                <span>Tenure</span>
                <FilterDropdown
                  aria-label="Tenure"
                  className="cbal-fdrop"
                  triggerClassName="cbal-fdrop-trigger"
                  options={TENOR_MONTHS}
                  value={tenure}
                  onSelect={setTenure}
                  align="center"
                  trigger={
                    <>
                      <span className="cbal-fdrop-value">{tenure}</span>
                      <ChevronDown />
                    </>
                  }
                />
              </div>
              <div className="cbal-field">
                <span>Payment Frequency</span>
                <FilterDropdown
                  aria-label="Payment frequency"
                  className="cbal-fdrop"
                  triggerClassName="cbal-fdrop-trigger"
                  options={PAYMENT_FREQUENCIES}
                  value={frequency}
                  onSelect={setFrequency}
                  trigger={
                    <>
                      <span className="cbal-fdrop-value">{frequency}</span>
                      <ChevronDown />
                    </>
                  }
                />
              </div>
              <label className="cbal-field">
                <span>Start Date</span>
                <div className="cbal-date">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <CalendarIcon />
                </div>
              </label>
              <label className="cbal-field">
                <span>Maturity Date</span>
                <div className="cbal-date">
                  <input
                    type="date"
                    value={maturityDate}
                    onChange={(e) => setMaturityDate(e.target.value)}
                  />
                  <CalendarIcon />
                </div>
              </label>
              <label className="cbal-field">
                <span>Interest Rate</span>
                <input value={rate} onChange={(e) => setRate(e.target.value)} />
              </label>
              <div className="cbal-field">
                <span>Bank Guarantee</span>
                <FilterDropdown
                  aria-label="Bank guarantee"
                  className="cbal-fdrop"
                  triggerClassName="cbal-fdrop-trigger"
                  options={YES_NO}
                  value={bankGuarantee}
                  onSelect={setBankGuarantee}
                  align="center"
                  trigger={
                    <>
                      <span className="cbal-fdrop-value">{bankGuarantee}</span>
                      <ChevronDown />
                    </>
                  }
                />
              </div>
              <div className="cbal-field">
                <span>Reference Transaction</span>
                <FilterDropdown
                  aria-label="Reference transaction"
                  className="cbal-fdrop"
                  triggerClassName="cbal-fdrop-trigger"
                  options={REFERENCE_TRANSACTIONS}
                  value={referenceTxn}
                  onSelect={setReferenceTxn}
                  highlight
                  trigger={
                    <>
                      <span className="cbal-fdrop-value">{referenceTxn}</span>
                      <ChevronDown />
                    </>
                  }
                />
              </div>
              <label className="cbal-field cbal-toggle-field">
                <span>Status</span>
                <button
                  type="button"
                  className={`cbal-toggle${active ? " is-on" : ""}`}
                  onClick={() => setActive((v) => !v)}
                  aria-pressed={active}
                >
                  <span />
                </button>
              </label>
            </div>
            <label className="cbal-field cbal-field--full">
              <span>Description</span>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
          </section>

          <section>
            <h3>GL Accounts</h3>
            <div className="cbal-modal-grid">
              <div className="cbal-field">
                <span>Principal GL</span>
                <FilterDropdown
                  aria-label="Principal GL"
                  className="cbal-fdrop"
                  triggerClassName="cbal-fdrop-trigger"
                  options={PRINCIPAL_GL_UNIQUE}
                  checked
                  selectedValues={selectedPrincipal}
                  onToggle={togglePrincipal}
                  onSelect={setPrincipalGl}
                  value={principalGl}
                  trigger={
                    <>
                      <span className="cbal-fdrop-value">
                        {selectedPrincipal[0] ?? "Select GL"}
                        {selectedPrincipal.length > 1 ? ` (+${selectedPrincipal.length - 1})` : ""}
                      </span>
                      <ChevronDown />
                    </>
                  }
                />
              </div>
              <div className="cbal-field">
                <span>Interest GL</span>
                <FilterDropdown
                  aria-label="Interest GL"
                  className="cbal-fdrop"
                  triggerClassName="cbal-fdrop-trigger"
                  options={INTEREST_GL_UNIQUE}
                  checked
                  selectedValues={selectedInterest}
                  onToggle={toggleInterest}
                  onSelect={setInterestGl}
                  value={interestGl}
                  trigger={
                    <>
                      <span className="cbal-fdrop-value">
                        {selectedInterest[0] ?? "Select GL"}
                        {selectedInterest.length > 1 ? ` (+${selectedInterest.length - 1})` : ""}
                      </span>
                      <ChevronDown />
                    </>
                  }
                />
              </div>
            </div>
          </section>
        </div>

        <footer className="cbal-modal-foot">
          <button type="button" className="cbal-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <div className="cbal-modal-foot-right">
            <button type="button" className="cbal-btn-outline" onClick={() => window.alert("Closed")}>
              Post
            </button>
            <button type="button" className="cbal-btn-solid" onClick={onClose}>
              Save Draft
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function ReverseContractModal({ onClose }: { onClose: () => void }) {
  const [reason, setReason] = useState("Requested By Customer");
  const [date, setDate] = useState("2025-06-15");

  return (
    <div className="cbal-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="cbal-modal cbal-modal--sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reverse-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cbal-modal-head">
          <h2 id="reverse-title">REVERSE CONTRACT</h2>
          <button type="button" className="cbal-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="cbal-modal-body">
          <label className="cbal-field cbal-field--full">
            <span>Account Name</span>
            <input value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          <label className="cbal-field cbal-field--full">
            <span>Date</span>
            <div className="cbal-date">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <CalendarIcon />
            </div>
          </label>
        </div>
        <footer className="cbal-modal-foot">
          <button type="button" className="cbal-btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="cbal-btn-solid" onClick={onClose}>
            Save Draft
          </button>
        </footer>
      </div>
    </div>
  );
}

function BalanceTrendDonut() {
  return (
    <div className="cbal-donut">
      <svg viewBox="0 0 160 160" width="160" height="160" aria-hidden>
        <circle cx="80" cy="80" r="54" fill="none" stroke="#eceff1" strokeWidth="28" />
        <circle
          cx="80"
          cy="80"
          r="54"
          fill="none"
          stroke="#00bcd4"
          strokeWidth="28"
          strokeDasharray="135 340"
          strokeDashoffset="0"
          transform="rotate(-90 80 80)"
        />
        <circle
          cx="80"
          cy="80"
          r="54"
          fill="none"
          stroke="#ffa74f"
          strokeWidth="28"
          strokeDasharray="160 340"
          strokeDashoffset="-135"
          transform="rotate(-90 80 80)"
        />
        <circle
          cx="80"
          cy="80"
          r="54"
          fill="none"
          stroke="#f06292"
          strokeWidth="28"
          strokeDasharray="78 340"
          strokeDashoffset="-295"
          transform="rotate(-90 80 80)"
        />
      </svg>
      <div className="cbal-donut-center">
        <strong>%50</strong>
        <span>Bond</span>
      </div>
      <div className="cbal-donut-labels" aria-hidden>
        <span className="is-a">40%</span>
        <span className="is-b">47%</span>
        <span className="is-c">23%</span>
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


