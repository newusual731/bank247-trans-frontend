import { useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { FilterDropdown } from "../components/FilterDropdown";
import {
  CONTRACT_PRODUCT_FILTERS,
  INTEREST_GL_UNIQUE,
  ISSUER_TYPES,
  PRINCIPAL_GL_UNIQUE,
  RATE_BANDS,
  TABLE_OVERFLOW_ACTIONS,
  TENOR_MONTHS,
} from "../data/filterDropdownOptions";
import "./BondContractsPage.css";

type ContractRow = {
  id: string;
  counterparty: string;
  faceValue: string;
  purchaseDate: string;
  maturityDate: string;
  rate: string;
  status: string;
};

type SecuritiesConfig = {
  title: string;
  modalTitle: string;
  defaultId: string;
  defaultCounterparty: string;
  rows: ContractRow[];
};

const CONTRACT_TABS = [
  { to: "/contracts/balances", label: "Contract Balances" },
  { to: "/contracts/loans", label: "Loan Contracts" },
  { to: "/contracts/treasury-bills", label: "Treasury Bill" },
  { to: "/contracts/bonds", label: "Bond Contracts" },
  { to: "/contracts/forex", label: "Forex Contracts" },
  { to: "/contracts/lc", label: "Letters of Credit" },
  { to: "/gl/chart", label: "Chart of Accounts" },
] as const;

const BOND_CONFIG: SecuritiesConfig = {
  title: "BOND CONTRACTS",
  modalTitle: "Add New Bond Contract",
  defaultId: "BD2024-008",
  defaultCounterparty: "FGN",
  rows: [
    {
      id: "BD2024-001",
      counterparty: "FGN",
      faceValue: "₦500,000.00",
      purchaseDate: "06/15/2025",
      maturityDate: "06/15/2026",
      rate: "8.50",
      status: "Disbursed",
    },
    {
      id: "BD2024-002",
      counterparty: "DANGOTE GROUP",
      faceValue: "₦500,000.00",
      purchaseDate: "06/15/2025",
      maturityDate: "06/15/2027",
      rate: "8.50",
      status: "Disbursed",
    },
    {
      id: "BD2024-003",
      counterparty: "LAGOS STATE",
      faceValue: "₦500,000.00",
      purchaseDate: "06/15/2025",
      maturityDate: "06/15/2028",
      rate: "8.50",
      status: "Disbursed",
    },
    ...Array.from({ length: 4 }, (_, i) => ({
      id: `BD2024-00${i + 4}`,
      counterparty: "FGN",
      faceValue: "₦500,000.00",
      purchaseDate: "06/15/2025",
      maturityDate: "06/15/2026",
      rate: "8.50",
      status: "Disbursed",
    })),
  ],
};

/** Figma CONTRACT/LOAN.png is titled TREASURY BILL (file name is mislabeled). */
const TBILL_CONFIG: SecuritiesConfig = {
  title: "TREASURY BILL",
  modalTitle: "Add New Treasury Bill",
  defaultId: "TB2024-010",
  defaultCounterparty: "CBN",
  rows: Array.from({ length: 9 }, () => ({
    id: "TB2024-001",
    counterparty: "CBN",
    faceValue: "₦500,000.00",
    purchaseDate: "06/15/2025",
    maturityDate: "06/15/2027",
    rate: "8.50",
    status: "Disbursed",
  })),
};

export function BondContractsPage() {
  return <SecuritiesContractsPage config={BOND_CONFIG} />;
}

export function TreasuryBillsPage() {
  return <SecuritiesContractsPage config={TBILL_CONFIG} />;
}

function SecuritiesContractsPage({ config }: { config: SecuritiesConfig }) {
  const [query, setQuery] = useState("");
  const [productFilter, setProductFilter] = useState<string>(CONTRACT_PRODUCT_FILTERS[0]);
  const [tableAction, setTableAction] = useState<string>(TABLE_OVERFLOW_ACTIONS[1]);
  const [modalOpen, setModalOpen] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = config.rows;
    if (q) {
      list = config.rows.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.counterparty.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q),
      );
    }
    const sorted = [...list];
    if (tableAction === "Sort By Date") {
      sorted.sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate));
    } else if (tableAction === "Sort By Status") {
      sorted.sort((a, b) => a.status.localeCompare(b.status));
    } else if (tableAction === "Sort By Amount") {
      sorted.sort((a, b) => {
        const av = Number(a.faceValue.replace(/[^\d.]/g, ""));
        const bv = Number(b.faceValue.replace(/[^\d.]/g, ""));
        return av - bv;
      });
    } else if (tableAction === "Clear Table") {
      return [];
    }
    return sorted;
  }, [query, tableAction, config.rows]);

  return (
    <div className="bonds">
      <div className="bonds-head">
        <div>
          <h1>{config.title}</h1>
          <button type="button" className="bonds-add" onClick={() => setModalOpen(true)}>
            +Add New Contract
          </button>
        </div>
        <div className="bonds-toolbar">
          <FilterDropdown
            aria-label="Filter by product"
            triggerClassName="bonds-filter-btn"
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
            triggerClassName="bonds-sort-btn"
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

      <label className="bonds-search">
        <SearchIcon />
        <input
          type="search"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <div className="bonds-table-wrap">
        <table className="bonds-table">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Counterparty</th>
              <th>Face Value (₦)</th>
              <th>Purchase Date</th>
              <th>Maturity Date</th>
              <th>Interest Rate (%)</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={`${row.id}-${i}`}>
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
                    <button type="button">View</button>
                    <span aria-hidden>·</span>
                    <button type="button">Terminate</button>
                    <span aria-hidden>·</span>
                    <button type="button" className="is-danger">
                      Close
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen ? (
        <AddSecuritiesModal
          title={config.modalTitle}
          defaultId={config.defaultId}
          defaultCounterparty={config.defaultCounterparty}
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </div>
  );
}

function AddSecuritiesModal({
  title,
  defaultId,
  defaultCounterparty,
  onClose,
}: {
  title: string;
  defaultId: string;
  defaultCounterparty: string;
  onClose: () => void;
}) {
  const [contractId, setContractId] = useState(defaultId);
  const [counterparty, setCounterparty] = useState(defaultCounterparty);
  const [issuerType, setIssuerType] = useState<string>(ISSUER_TYPES[0]);
  const [faceValue, setFaceValue] = useState("₦500,000.00");
  const [purchaseDate, setPurchaseDate] = useState("2025-06-15");
  const [maturityDate, setMaturityDate] = useState("2027-06-15");
  const [tenor, setTenor] = useState<string>(TENOR_MONTHS[4]);
  const [rate, setRate] = useState("8.50");
  const [rateBand, setRateBand] = useState<string>(RATE_BANDS[1]);
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
    <div className="bond-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="bond-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-securities-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="bond-modal-head">
          <h2 id="add-securities-title">{title}</h2>
          <button type="button" className="bond-modal-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="bond-modal-body">
          <div className="bond-modal-panel">
            <div className="bond-modal-grid">
              <label className="bond-field">
                <span>Contract ID</span>
                <input value={contractId} onChange={(e) => setContractId(e.target.value)} />
              </label>
              <label className="bond-field">
                <span>Counterparty</span>
                <input value={counterparty} onChange={(e) => setCounterparty(e.target.value)} />
              </label>
              <div className="bond-field">
                <span>Issuer Type</span>
                <FilterDropdown
                  aria-label="Issuer type"
                  triggerClassName="bond-fdrop-trigger"
                  options={ISSUER_TYPES}
                  value={issuerType}
                  onSelect={setIssuerType}
                  trigger={
                    <>
                      <span className="bond-fdrop-value">{issuerType}</span>
                      <ChevronDown />
                    </>
                  }
                />
              </div>
              <label className="bond-field">
                <span>Face Value (₦)</span>
                <input value={faceValue} onChange={(e) => setFaceValue(e.target.value)} />
              </label>
              <div className="bond-field">
                <span>Tenor</span>
                <FilterDropdown
                  aria-label="Tenor"
                  triggerClassName="bond-fdrop-trigger"
                  options={TENOR_MONTHS}
                  value={tenor}
                  onSelect={setTenor}
                  align="center"
                  trigger={
                    <>
                      <span className="bond-fdrop-value">{tenor}</span>
                      <ChevronDown />
                    </>
                  }
                />
              </div>
              <div className="bond-field">
                <span>Rate Band</span>
                <FilterDropdown
                  aria-label="Rate band"
                  triggerClassName="bond-fdrop-trigger"
                  options={RATE_BANDS}
                  value={rateBand}
                  onSelect={(v) => {
                    setRateBand(v);
                    setRate(v.replace(/\s/g, "").replace("%", ""));
                  }}
                  trigger={
                    <>
                      <span className="bond-fdrop-value">{rateBand}</span>
                      <ChevronDown />
                    </>
                  }
                />
              </div>
              <label className="bond-field">
                <span>Interest Rate (%)</span>
                <input value={rate} onChange={(e) => setRate(e.target.value)} />
              </label>
              <label className="bond-field">
                <span>Purchase Date</span>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </label>
              <label className="bond-field">
                <span>Maturity Date</span>
                <input
                  type="date"
                  value={maturityDate}
                  onChange={(e) => setMaturityDate(e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="bond-modal-gl-row">
            <div className="bond-field">
              <span>Principal GL</span>
              <FilterDropdown
                aria-label="Principal GL"
                triggerClassName="bond-fdrop-trigger"
                options={PRINCIPAL_GL_UNIQUE}
                checked
                selectedValues={selectedPrincipal}
                onToggle={togglePrincipal}
                onSelect={setPrincipalGl}
                value={principalGl}
                trigger={
                  <>
                    <span className="bond-fdrop-value">
                      {selectedPrincipal[0] ?? "Select GL"}
                      {selectedPrincipal.length > 1 ? ` (+${selectedPrincipal.length - 1})` : ""}
                    </span>
                    <ChevronDown />
                  </>
                }
              />
            </div>
            <div className="bond-field">
              <span>Interest GL</span>
              <FilterDropdown
                aria-label="Interest GL"
                triggerClassName="bond-fdrop-trigger"
                options={INTEREST_GL_UNIQUE}
                checked
                selectedValues={selectedInterest}
                onToggle={toggleInterest}
                onSelect={setInterestGl}
                value={interestGl}
                trigger={
                  <>
                    <span className="bond-fdrop-value">
                      {selectedInterest[0] ?? "Select GL"}
                      {selectedInterest.length > 1 ? ` (+${selectedInterest.length - 1})` : ""}
                    </span>
                    <ChevronDown />
                  </>
                }
              />
            </div>
          </div>
        </div>

        <footer className="bond-modal-foot">
          <div className="bond-modal-foot-left">
            <button type="button" className="bond-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="bond-btn-ghost">
              Save Draft
            </button>
          </div>
          <button type="button" className="bond-btn-primary" onClick={onClose}>
            Create
          </button>
        </footer>
      </div>
    </div>
  );
}

function ContractTypeTabs() {
  return (
    <nav className="bonds-tabs" aria-label="Contract types">
      {CONTRACT_TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => (isActive ? "is-active" : undefined)}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function ContractPlaceholderPage({ title }: { title: string }) {
  return (
    <div className="bonds">
      <h1 style={{ margin: "0 0 1rem", fontSize: "1.55rem", letterSpacing: "-0.03em" }}>{title}</h1>
      <ContractTypeTabs />
      <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
        Coming next from the transaction processing Figma pack.{" "}
        <Link to="/contracts/treasury-bills">Open Treasury Bill</Link>
        {" · "}
        <Link to="/contracts/bonds">Open Bond Contracts</Link>
      </p>
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
