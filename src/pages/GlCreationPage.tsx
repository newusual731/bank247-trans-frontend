import { useState } from "react";
import { GlModuleTabs } from "../components/GlModuleTabs";
import {
  BRANCH_CODES,
  COST_CENTERS,
  CUSTOMER_ACCOUNT_TYPES,
  GL_ACCOUNT_CLASSES_DETAIL,
  GL_CATEGORIES,
} from "../data/accountTypeOptions";
import "./GlCreationPage.css";

type GlRow = {
  code: string;
  name: string;
  accountType: string;
  status: string;
  createdBy: string;
};

const ROWS: GlRow[] = Array.from({ length: 3 }, () => ({
  code: "11500",
  name: "Cash In Till",
  accountType: "Asset",
  status: "Active",
  createdBy: "Admin",
}));

export function GlCreationPage() {
  const [code, setCode] = useState("11600");
  const [name, setName] = useState("Cash in Till");
  const [accountType, setAccountType] = useState<string>(CUSTOMER_ACCOUNT_TYPES[0]);
  const [accountClass, setAccountClass] = useState<string>(GL_ACCOUNT_CLASSES_DETAIL[0]);
  const [category, setCategory] = useState<string>(GL_CATEGORIES[0]);
  const [branch, setBranch] = useState("EK0001");
  const [opening, setOpening] = useState("₦500,000.00");
  const [costCenter, setCostCenter] = useState<string>(COST_CENTERS[0]);
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);

  return (
    <div className="glc">
      <GlModuleTabs />
      <header className="glc-banner">
        <h1>GL CREATION</h1>
      </header>

      <section className="glc-card">
        <div className="glc-form-grid">
          <label className="glc-field">
            <span>GL Code</span>
            <input value={code} onChange={(e) => setCode(e.target.value)} />
          </label>
          <label className="glc-field">
            <span>GL Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="glc-field">
            <span>Account Type</span>
            <div className="glc-select">
              <select value={accountType} onChange={(e) => setAccountType(e.target.value)}>
                {CUSTOMER_ACCOUNT_TYPES.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </label>
          <label className="glc-field">
            <span>Account Class</span>
            <div className="glc-select">
              <select value={accountClass} onChange={(e) => setAccountClass(e.target.value)}>
                {GL_ACCOUNT_CLASSES_DETAIL.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </label>
          <label className="glc-field">
            <span>GL Category</span>
            <div className="glc-select">
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {GL_CATEGORIES.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </label>
          <label className="glc-field">
            <span>Branch Code</span>
            <div className="glc-select">
              <select value={branch} onChange={(e) => setBranch(e.target.value)}>
                <option>EK0001</option>
                {BRANCH_CODES.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </label>
          <label className="glc-field">
            <span>Opening Balance</span>
            <input value={opening} onChange={(e) => setOpening(e.target.value)} />
          </label>
          <label className="glc-field">
            <span>Cost Center</span>
            <div className="glc-select">
              <select value={costCenter} onChange={(e) => setCostCenter(e.target.value)}>
                {COST_CENTERS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
          </label>
          <label className="glc-field glc-field--full">
            <span>Description</span>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <div className="glc-field glc-toggle-field">
            <span>Status</span>
            <button
              type="button"
              className={`glc-toggle${active ? " is-on" : ""}`}
              onClick={() => setActive((v) => !v)}
              aria-pressed={active}
            >
              <span />
            </button>
          </div>
        </div>

        <div className="glc-form-actions">
          <button type="button" className="glc-btn-ghost">
            Deactivate History
          </button>
          <button type="button" className="glc-btn-outline">
            Update
          </button>
          <button type="button" className="glc-btn-primary">
            Save Draft
          </button>
        </div>
      </section>

      <div className="glc-table-wrap">
        <table className="glc-table">
          <thead>
            <tr>
              <th>GL Code</th>
              <th>GL Name</th>
              <th>Account Type</th>
              <th>Status</th>
              <th>Created By</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr key={i}>
                <td>{row.code}</td>
                <td>{row.name}</td>
                <td>{row.accountType}</td>
                <td>
                  <span className="glc-badge">{row.status}</span>
                </td>
                <td>{row.createdBy}</td>
                <td>
                  <div className="glc-actions">
                    <button type="button">View</button>
                    <span aria-hidden>·</span>
                    <button type="button">Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
