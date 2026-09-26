import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ClosingTillConfirm, TellerConfirmModal } from "../../components/teller/TellerConfirmModals";
import "../../components/teller/TellerForm.css";
import "./CashTxnPages.css";
import "./TellerAdminPages.css";

const PARAM_FIELDS = [
  { label: "Overage Category", placeholder: "123- Ikeja Top", kind: "text" },
  { label: "Shortage Category", placeholder: "Enter Name", kind: "text" },
  { label: "Transaction Code Shortage", placeholder: "Enter ID", kind: "text" },
  { label: "Transaction Code Overage", placeholder: "Enter ID", kind: "text" },
  { label: "Transaction Category", placeholder: "Select", kind: "select", options: ["Cash", "Transfer", "Internal"] },
  { label: "Valid ID", placeholder: "Select", kind: "select", options: ["National ID", "Passport", "Driver License"] },
  { label: "Vault Desc", placeholder: "Customer instruction", kind: "text" },
  { label: "Defined Currencies", placeholder: "Customer instruction", kind: "text" },
  { label: "Transaction Authorisation", placeholder: "Customer instruction", kind: "text" },
  { label: "Max Till Balance", placeholder: "Customer instruction", kind: "text" },
  { label: "Deposit Slip Generate", placeholder: "Customer instruction", kind: "text" },
  { label: "Delete Unauthorised Transactions During EOD", placeholder: "Customer instruction", kind: "text" },
  { label: "Till Balance After Authorisation", placeholder: "Customer instruction", kind: "text" },
] as const;

function SelectInput({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: readonly string[];
}) {
  return (
    <div className="tf-select-wrap">
      <select className="tf-select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <span className="tf-chev" aria-hidden>
        ▾
      </span>
    </div>
  );
}

function AdminFormShell({
  title,
  children,
  primaryLabel,
  onPrimary,
  primaryOnly,
}: {
  title: string;
  children: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  primaryOnly?: boolean;
}) {
  const navigate = useNavigate();
  const close = () => navigate("/teller/admin");

  return (
    <div className="tf-page ctp tap-form">
      <div className="tf-panel ctp-panel">
        <button type="button" className="tf-x" aria-label="Close" onClick={close}>
          ×
        </button>
        <div className="tf-form-shell">
          <h1 className="tf-title">{title}</h1>
          <div className="tf-stack">{children}</div>
          <div className={`tf-actions${primaryOnly ? " tf-actions--center" : ""}`}>
            {primaryOnly ? (
              <button type="button" className="tf-close" onClick={close}>
                {primaryLabel}
              </button>
            ) : (
              <>
                <button type="button" className="tf-close" onClick={close}>
                  Close
                </button>
                <button type="button" className="tf-submit" onClick={onPrimary}>
                  {primaryLabel}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Teller Account Administration hub */
export function TellerAccountAdminPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="tap">
      <div className="tap-panel">
        <header className="tap-head">
          <h1>Teller Account Administration</h1>
        </header>
        <p className="tap-sub">Create tills and configure account parameters for teller operations.</p>
        <div className="tap-cards">
          <Link to="/teller/tills/create" className="tap-card">
            <strong>Create Till</strong>
            <em>Teller till set-up and create till</em>
            <span aria-hidden>›</span>
          </Link>
          <button type="button" className="tap-card" onClick={() => setDrawerOpen(true)}>
            <strong>Account Parameter Setup</strong>
            <em>Overage, shortage, and till balance rules</em>
            <span aria-hidden>›</span>
          </button>
          <Link to="/teller/tills/create?step=create" className="tap-card">
            <strong>Create Till (details)</strong>
            <em>Branch, limits, teller number</em>
            <span aria-hidden>›</span>
          </Link>
          <Link to="/teller/tills/reopen" className="tap-card">
            <strong>Re-open Till</strong>
            <em>Reactivate a closed till</em>
            <span aria-hidden>›</span>
          </Link>
          <Link to="/teller/tills/close" className="tap-card">
            <strong>Close Till</strong>
            <em>Close an active till with reason</em>
            <span aria-hidden>›</span>
          </Link>
        </div>
      </div>
      {drawerOpen ? <AccountParameterSetupPanel onClose={() => setDrawerOpen(false)} /> : null}
    </div>
  );
}

function AccountParameterSetupPanel({ onClose }: { onClose: () => void }) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(PARAM_FIELDS.map((f) => [f.label, f.label === "Overage Category" ? "123- Ikeja Top" : ""])),
  );

  return (
    <div className="tap-drawer-backdrop" role="presentation" onClick={onClose}>
      <aside className="tap-drawer" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tap-drawer-x" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 className="tap-drawer-title">Account Parameter Setup</h2>
        <div className="tap-drawer-fields">
          {PARAM_FIELDS.map((f) => (
            <label key={f.label} className="tf-field">
              <span>{f.label}</span>
              {f.kind === "select" ? (
                <SelectInput
                  value={values[f.label] ?? ""}
                  onChange={(v) => setValues((s) => ({ ...s, [f.label]: v }))}
                  placeholder={f.placeholder}
                  options={"options" in f ? f.options : []}
                />
              ) : (
                <input
                  className="tf-input"
                  placeholder={f.placeholder}
                  value={values[f.label] ?? ""}
                  onChange={(e) => setValues((s) => ({ ...s, [f.label]: e.target.value }))}
                />
              )}
            </label>
          ))}
        </div>
        <button type="button" className="tf-submit tap-full" onClick={onClose}>
          Validate
        </button>
      </aside>
    </div>
  );
}

/** Till creation.png — Teller Till Set-up → optional Create Till details */
export function TillCreationPage() {
  const navigate = useNavigate();
  const stepParam = new URLSearchParams(window.location.search).get("step");
  const [step, setStep] = useState<"setup" | "create">(stepParam === "create" ? "create" : "setup");
  const [userName, setUserName] = useState("");
  const [branch, setBranch] = useState("");
  const [currency, setCurrency] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [limit, setLimit] = useState("");
  const [tellerNo, setTellerNo] = useState("");
  const [longAcct, setLongAcct] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [doneOpen, setDoneOpen] = useState(false);

  if (step === "create") {
    return (
      <>
        <AdminFormShell
          title="Create Till"
          primaryLabel="Submit"
          onPrimary={() => setConfirmOpen(true)}
        >
          <label className="tf-field">
            <span>Branch</span>
            <SelectInput
              value={branch}
              onChange={setBranch}
              placeholder="Select"
              options={["232-Ikeja Top", "101-VI", "014-Abuja"]}
            />
          </label>
          <label className="tf-field">
            <span>Customer ID</span>
            <input
              className="tf-input"
              placeholder="Enter ID"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            />
          </label>
          <label className="tf-field">
            <span>Currency</span>
            <SelectInput
              value={currency}
              onChange={setCurrency}
              placeholder="Select"
              options={["NGN", "USD", "EUR"]}
            />
          </label>
          <label className="tf-field">
            <span>Limit (Amount)</span>
            <input
              className="tf-input"
              placeholder="Enter Limit"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </label>
          <label className="tf-field">
            <span>Teller Number</span>
            <input
              className="tf-input"
              placeholder="Enter Teller Number"
              value={tellerNo}
              onChange={(e) => setTellerNo(e.target.value)}
            />
          </label>
          <label className="tf-field">
            <span>Long Account Number</span>
            <input
              className="tf-input"
              placeholder="Enter Account Number"
              value={longAcct}
              onChange={(e) => setLongAcct(e.target.value)}
            />
          </label>
        </AdminFormShell>
        {confirmOpen ? (
          <ClosingTillConfirm
            title="Open Till ?"
            message='"Do you want to open this Till"'
            onYes={() => {
              setConfirmOpen(false);
              setDoneOpen(true);
            }}
            onNo={() => setConfirmOpen(false)}
          />
        ) : null}
        {doneOpen ? (
          <TellerConfirmModal
            title="Till Created"
            message='"Till setup completed successfully"'
            yesLabel="OK"
            noLabel="CLOSE"
            onYes={() => navigate("/teller/admin")}
            onNo={() => navigate("/teller/admin")}
            dangerNo={false}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <AdminFormShell
        title="Teller Till Set-up"
        primaryLabel="Submit"
        onPrimary={() => setConfirmOpen(true)}
      >
        <label className="tf-field">
          <span>User Name</span>
          <input
            className="tf-input"
            placeholder="Enter Username"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </label>
        <label className="tf-field">
          <span>Branch Code</span>
          <input
            className="tf-input"
            placeholder="Enter Branch Code"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          />
        </label>
        <label className="tf-field">
          <span>Currency</span>
          <SelectInput
            value={currency}
            onChange={setCurrency}
            placeholder="Select"
            options={["NGN", "USD", "EUR"]}
          />
        </label>
      </AdminFormShell>
      {confirmOpen ? (
        <ClosingTillConfirm
          title="Open Till ?"
          message='"Do you want to open this Till"'
          onYes={() => {
            setConfirmOpen(false);
            setStep("create");
          }}
          onNo={() => setConfirmOpen(false)}
        />
      ) : null}
    </>
  );
}

/** Till creation-2 / -5 — Till ID or full re-open */
export function ReopenTillPage() {
  const [tillId, setTillId] = useState("");
  const [mode, setMode] = useState<"id" | "full">("id");
  const [branch, setBranch] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [currency, setCurrency] = useState("");
  const [limit, setLimit] = useState("");
  const [longAcct, setLongAcct] = useState("");
  const [tellerNo, setTellerNo] = useState("");
  const [doneOpen, setDoneOpen] = useState(false);
  const navigate = useNavigate();

  if (mode === "full") {
    return (
      <>
        <AdminFormShell title="Re-open Till" primaryLabel="Reactivate" onPrimary={() => setDoneOpen(true)}>
          <label className="tf-field">
            <span>Branch</span>
            <SelectInput value={branch} onChange={setBranch} placeholder="Select" options={["232-Ikeja Top", "101-VI"]} />
          </label>
          <label className="tf-field">
            <span>Customer ID</span>
            <input className="tf-input" placeholder="Enter ID" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
          </label>
          <label className="tf-field">
            <span>Currency</span>
            <SelectInput value={currency} onChange={setCurrency} placeholder="Select" options={["NGN", "USD", "EUR"]} />
          </label>
          <label className="tf-field">
            <span>Limit (Amount)</span>
            <input className="tf-input" placeholder="Enter Limit" value={limit} onChange={(e) => setLimit(e.target.value)} />
          </label>
          <label className="tf-field">
            <span>Long Account Number</span>
            <input className="tf-input" placeholder="Enter Account Number" value={longAcct} onChange={(e) => setLongAcct(e.target.value)} />
          </label>
          <label className="tf-field">
            <span>Teller Number</span>
            <input className="tf-input" placeholder="Enter Teller Number" value={tellerNo} onChange={(e) => setTellerNo(e.target.value)} />
          </label>
        </AdminFormShell>
        {doneOpen ? (
          <TellerConfirmModal
            title="Till Reopened"
            message='"Till reactivated successfully"'
            yesLabel="OK"
            noLabel="CLOSE"
            onYes={() => navigate("/teller/admin")}
            onNo={() => navigate("/teller/admin")}
            dangerNo={false}
          />
        ) : null}
      </>
    );
  }

  return (
    <AdminFormShell
      title="Reopen Closed Till"
      primaryLabel="Submit"
      onPrimary={() => setMode("full")}
    >
      <label className="tf-field">
        <span>Till ID</span>
        <input
          className="tf-input"
          placeholder="Enter Till ID"
          value={tillId}
          onChange={(e) => setTillId(e.target.value)}
        />
      </label>
    </AdminFormShell>
  );
}

/** Till creation-6 — Close Till (single "Close" CTA = submit close, × = dismiss) */
export function CloseTillPage() {
  const [branch, setBranch] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [currency, setCurrency] = useState("");
  const [limit, setLimit] = useState("");
  const [longAcct, setLongAcct] = useState("");
  const [tellerNo, setTellerNo] = useState("");
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [doneOpen, setDoneOpen] = useState(false);
  const navigate = useNavigate();
  const dismiss = () => navigate("/teller/admin");

  return (
    <>
      <div className="tf-page ctp tap-form">
        <div className="tf-panel ctp-panel">
          <button type="button" className="tf-x" aria-label="Dismiss" onClick={dismiss}>
            ×
          </button>
          <div className="tf-form-shell">
            <h1 className="tf-title">Close Till</h1>
            <div className="tf-stack">
              <label className="tf-field">
                <span>Branch</span>
                <SelectInput value={branch} onChange={setBranch} placeholder="Select" options={["232-Ikeja Top", "101-VI"]} />
              </label>
              <label className="tf-field">
                <span>Customer ID</span>
                <input className="tf-input" placeholder="Enter ID" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
              </label>
              <label className="tf-field">
                <span>Currency</span>
                <SelectInput value={currency} onChange={setCurrency} placeholder="Select" options={["NGN", "USD", "EUR"]} />
              </label>
              <label className="tf-field">
                <span>Limit (Amount)</span>
                <input className="tf-input" placeholder="Enter Limit" value={limit} onChange={(e) => setLimit(e.target.value)} />
              </label>
              <label className="tf-field">
                <span>Long Account Number</span>
                <input className="tf-input" placeholder="Enter Account Number" value={longAcct} onChange={(e) => setLongAcct(e.target.value)} />
              </label>
              <label className="tf-field">
                <span>Teller Number</span>
                <input className="tf-input" placeholder="Enter Teller Number" value={tellerNo} onChange={(e) => setTellerNo(e.target.value)} />
              </label>
              <label className="tf-field tf-field--narration">
                <span>Reason</span>
                <textarea
                  className="tf-textarea"
                  placeholder="Enter Reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
            </div>
            <div className="tf-actions tf-actions--center">
              <button type="button" className="tf-submit" onClick={() => setConfirmOpen(true)}>
                Close Till
              </button>
            </div>
          </div>
        </div>
      </div>
      {confirmOpen ? (
        <ClosingTillConfirm
          title="Closing Till ?"
          message='"Do you want to close your Till"'
          onYes={() => {
            setConfirmOpen(false);
            setDoneOpen(true);
          }}
          onNo={() => setConfirmOpen(false)}
        />
      ) : null}
      {doneOpen ? (
        <TellerConfirmModal
          title="Till Closed"
          message='"Till closed successfully"'
          yesLabel="OK"
          noLabel="CLOSE"
          onYes={dismiss}
          onNo={dismiss}
          dangerNo={false}
        />
      ) : null}
    </>
  );
}
