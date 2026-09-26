import { useMemo, useState } from "react";
import { ContractTypeTabs } from "../components/ContractTypeTabs";
import { FilterDropdown } from "../components/FilterDropdown";
import { TABLE_OVERFLOW_ACTIONS } from "../data/filterDropdownOptions";
import "./PlacementContractsPage.css";
import { ViewDetailsModal } from "../components/feedback/ViewDetailsModal";
import { ConfirmActionModal } from "../components/feedback/ConfirmActionModal";

type PlacementRow = {
  id: string;
  institution: string;
  amount: string;
  rate: string;
  tenure: string;
  startDate: string;
  maturityDate: string;
  status: "Issued" | "Closed" | "Cancelled";
};

const ROWS: PlacementRow[] = [
  {
    id: "PLC2025-001",
    institution: "CBN",
    amount: "₦10,000,000",
    rate: "12.50",
    tenure: "90",
    startDate: "01-Jun-2025",
    maturityDate: "30-Aug-2025",
    status: "Issued",
  },
  {
    id: "PLC2025-002",
    institution: "Omatek Ltd",
    amount: "₦5,000,000",
    rate: "11.25",
    tenure: "180",
    startDate: "01-Jun-2025",
    maturityDate: "28-Nov-2025",
    status: "Closed",
  },
  {
    id: "PLC2025-003",
    institution: "Fidelity Investments",
    amount: "₦7,500,000",
    rate: "13.00",
    tenure: "60",
    startDate: "01-Jun-2025",
    maturityDate: "31-Jul-2025",
    status: "Cancelled",
  },
  {
    id: "PLC2025-004",
    institution: "UBA Treasury",
    amount: "₦12,000,000",
    rate: "12.75",
    tenure: "120",
    startDate: "01-Jun-2025",
    maturityDate: "29-Sep-2025",
    status: "Issued",
  },
  {
    id: "PLC2025-005",
    institution: "Stanbic IBTC",
    amount: "₦8,000,000",
    rate: "11.80",
    tenure: "91",
    startDate: "01-Jun-2025",
    maturityDate: "31-Aug-2025",
    status: "Issued",
  },
];

export function PlacementContractsPage() {
  const [query, setQuery] = useState("");
  const [tableAction, setTableAction] = useState<string>(TABLE_OVERFLOW_ACTIONS[1]);
  type ModalState =
    | { kind: "add" }
    | { kind: "view"; row: PlacementRow }
    | { kind: "confirm"; action: string; row: PlacementRow }
    | null;
  const [modal, setModal] = useState<ModalState>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = ROWS.filter(
      (r) =>
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.institution.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q),
    );
    if (tableAction === "Clear Table") return [];
    if (tableAction === "Sort By Status") list = [...list].sort((a, b) => a.status.localeCompare(b.status));
    if (tableAction === "Sort By Amount") {
      list = [...list].sort(
        (a, b) => Number(a.amount.replace(/[^\d.]/g, "")) - Number(b.amount.replace(/[^\d.]/g, "")),
      );
    }
    return list;
  }, [query, tableAction]);

  return (
    <div className="plc">
      <div className="plc-head">
        <div>
          <h1>Placement Contracts</h1>
          <button type="button" className="plc-add" onClick={() => setModal({ kind: "add" })}>
            +Add New Contract
          </button>
        </div>
        <FilterDropdown
          aria-label="Sort placements"
          triggerClassName="plc-sort"
          menuAlign="end"
          options={TABLE_OVERFLOW_ACTIONS}
          value={tableAction}
          onSelect={setTableAction}
          trigger={
            <>
              <FilterIcon /> Filter · {tableAction.startsWith("Sort") ? tableAction : "Sort By Amount"}
              <ChevronDown />
            </>
          }
        />
      </div>

      <ContractTypeTabs />

      <label className="plc-search">
        <SearchIcon />
        <input
          type="search"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <div className="plc-table-wrap">
        <table className="plc-table">
          <thead>
            <tr>
              <th>Placement ID</th>
              <th>Institution Name</th>
              <th>Amount (₦)</th>
              <th>Rate (%)</th>
              <th>Tenure (Days)</th>
              <th>Start Date</th>
              <th>Maturity Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.institution}</td>
                <td>{row.amount}</td>
                <td>{row.rate}</td>
                <td>{row.tenure}</td>
                <td>{row.startDate}</td>
                <td>{row.maturityDate}</td>
                <td>
                  <span className={`plc-status is-${row.status.toLowerCase()}`}>{row.status}</span>
                </td>
                <td>
                  <div className="plc-actions">
                    {row.status === "Issued" ? (
                      <>
                        <button type="button" onClick={() => setModal({ kind: "view", row })}>View</button>
                        <span>·</span>
                        <button type="button" onClick={() => setModal({ kind: "add" })}>Amend</button>
                        <span>·</span>
                        <button type="button" className="is-danger" onClick={() => setModal({ kind: "confirm", action: "Close", row })}>Close</button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => setModal({ kind: "view", row })}>View</button>
                        <span>·</span>
                        <button type="button" onClick={() => setModal({ kind: "confirm", action: "Rebook", row })}>Rebook</button>
                        <span>·</span>
                        <button type="button" className="is-danger" onClick={() => setModal({ kind: "confirm", action: "Cancel", row })}>Cancel</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal?.kind === "add" ? <AddPlacementModal onClose={() => setModal(null)} /> : null}
      {modal?.kind === "view" ? (
        <ViewDetailsModal
          title="View Placement Contract"
          fields={[
            { label: "Placement ID", value: modal.row.id },
            { label: "Institution", value: modal.row.institution },
            { label: "Amount", value: modal.row.amount },
            { label: "Rate", value: `${modal.row.rate}%` },
            { label: "Tenure", value: `${modal.row.tenure} Days` },
            { label: "Start Date", value: modal.row.startDate, date: true },
            { label: "Maturity Date", value: modal.row.maturityDate, date: true },
            { label: "Status", value: modal.row.status },
          ]}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal?.kind === "confirm" ? (
        <ConfirmActionModal
          title={`${modal.action} Placement ?`}
          message={`Do you want to ${modal.action.toLowerCase()} ${modal.row.id}?`}
          onConfirm={() => setModal(null)}
          onClose={() => setModal(null)}
        />
      ) : null}
    </div>
  );
}

function AddPlacementModal({ onClose }: { onClose: () => void }) {
  const [id, setId] = useState("PLC2025-006");
  const [institution, setInstitution] = useState("CBN");
  const [amount, setAmount] = useState("₦500,000.00");
  const [rate, setRate] = useState("12.50");
  const [tenure, setTenure] = useState("90");
  const [start, setStart] = useState("2025-06-15");
  const [maturity, setMaturity] = useState("2025-09-13");

  return (
    <div className="plc-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="plc-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>Add New Placement Contract</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="plc-modal-grid">
          <label>
            <span>Placement ID</span>
            <input value={id} onChange={(e) => setId(e.target.value)} />
          </label>
          <label>
            <span>Institution Name</span>
            <input value={institution} onChange={(e) => setInstitution(e.target.value)} />
          </label>
          <label>
            <span>Amount (₦)</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label>
            <span>Rate (%)</span>
            <input value={rate} onChange={(e) => setRate(e.target.value)} />
          </label>
          <label>
            <span>Tenure (Days)</span>
            <input value={tenure} onChange={(e) => setTenure(e.target.value)} />
          </label>
          <label>
            <span>Start Date</span>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label>
            <span>Maturity Date</span>
            <input type="date" value={maturity} onChange={(e) => setMaturity(e.target.value)} />
          </label>
        </div>
        <footer>
          <div>
            <button type="button" className="plc-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="plc-ghost">
              Save Draft
            </button>
          </div>
          <button type="button" className="plc-primary" onClick={onClose}>
            Create
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

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
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
