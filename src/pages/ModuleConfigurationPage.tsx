import { useState } from "react";
import { getTellerAdminParameters, putTellerAdminParameters } from "../api/teller";
import { ApiError } from "../lib/apiClient";
import { Link } from "react-router-dom";
import { GenerationSuccessModal } from "../components/SharedUiBits";
import "./ModuleConfigurationPage.css";

export function ModuleConfigurationPage() {
  const [amendOpen, setAmendOpen] = useState(false);

  return (
    <div className="mcfg">
      <h1>Module Configuration</h1>
      <p className="mcfg-sub">Configure module limits and operational controls for your bank staff.</p>

      <div className="mcfg-cards">
        <button type="button" className="mcfg-card" onClick={() => setAmendOpen(true)}>
          <span className="mcfg-card-icon is-limit" aria-hidden>
            &gt;_
          </span>
          <div>
            <strong>Amend User Limit</strong>
            <em>Set LCY / FCY debit and credit limits by user and branch</em>
          </div>
          <span className="mcfg-chev" aria-hidden>
            ›
          </span>
        </button>
        <Link to="/reporting" className="mcfg-card">
          <span className="mcfg-card-icon is-report" aria-hidden>
            ◉
          </span>
          <div>
            <strong>REPORTING</strong>
            <em>Open the reporting hub</em>
          </div>
          <span className="mcfg-chev" aria-hidden>
            ›
          </span>
        </Link>
        <Link to="/settings/catalogs" className="mcfg-card">
          <span className="mcfg-card-icon is-limit" aria-hidden>
            ▾
          </span>
          <div>
            <strong>Catalogs &amp; Dropdowns</strong>
            <em>Figma root PNG option lists (design QA)</em>
          </div>
          <span className="mcfg-chev" aria-hidden>
            ›
          </span>
        </Link>
      </div>

      {amendOpen ? <AmendUserLimitModal onClose={() => setAmendOpen(false)} /> : null}
    </div>
  );
}

function AmendUserLimitModal({ onClose }: { onClose: () => void }) {
  const [userId, setUserId] = useState("");
  const [lcyDebit, setLcyDebit] = useState("");
  const [lcyCredit, setLcyCredit] = useState("");
  const [fcyCredit, setFcyCredit] = useState("");
  const [fcyDebit, setFcyDebit] = useState("");
  const [branch, setBranch] = useState("");
  const [done, setDone] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadParams(code: string) {
    if (!code.trim()) return;
    try {
      const res = await getTellerAdminParameters(code.trim());
      if (res && typeof res === "object") {
        const r = res as Record<string, unknown>;
        if (r.lcyDebitLimit != null) setLcyDebit(String(r.lcyDebitLimit));
        if (r.lcyCreditLimit != null) setLcyCredit(String(r.lcyCreditLimit));
        if (r.fcyDebitLimit != null) setFcyDebit(String(r.fcyDebitLimit));
        if (r.fcyCreditLimit != null) setFcyCredit(String(r.fcyCreditLimit));
        if (r.userId != null) setUserId(String(r.userId));
      }
    } catch {
      /* keep form empty if branch has no params yet */
    }
  }

  async function saveParams() {
    setSaving(true);
    setSaveError(null);
    try {
      await putTellerAdminParameters({
        branchCode: branch.trim(),
        userId: userId.trim() || undefined,
        lcyDebitLimit: lcyDebit,
        lcyCreditLimit: lcyCredit,
        fcyDebitLimit: fcyDebit,
        fcyCreditLimit: fcyCredit,
      });
      setDone(true);
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <GenerationSuccessModal
        title="Successfull"
        message="Account parameter setup successfully"
        onClose={() => {
          setDone(false);
          onClose();
        }}
      />
    );
  }

  return (
    <div className="mcfg-backdrop" role="presentation" onClick={onClose}>
      <div className="mcfg-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="mcfg-x" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2>Amend User Limit</h2>
        <label>
          <span>User ID</span>
          <input placeholder="Enter User ID" value={userId} onChange={(e) => setUserId(e.target.value)} />
        </label>
        <label>
          <span>LCY Debit Limit</span>
          <input
            placeholder="Enter Debit Limit"
            value={lcyDebit}
            onChange={(e) => setLcyDebit(e.target.value)}
          />
        </label>
        <label>
          <span>LCY Credit Limit</span>
          <input
            placeholder="Enter Credit Limit"
            value={lcyCredit}
            onChange={(e) => setLcyCredit(e.target.value)}
          />
        </label>
        <label>
          <span>FCY Credit Limit</span>
          <input
            placeholder="Enter Credit Limit"
            value={fcyCredit}
            onChange={(e) => setFcyCredit(e.target.value)}
          />
        </label>
        <label>
          <span>FCY Debit Limit</span>
          <input
            placeholder="Enter Debit Limit"
            value={fcyDebit}
            onChange={(e) => setFcyDebit(e.target.value)}
          />
        </label>
        <label>
          <span>User Branch Code</span>
          <input
            placeholder="Enter Branch Code"
            value={branch} onChange={(e) => { setBranch(e.target.value); void loadParams(e.target.value); }}
          />
        </label>
        <footer>
          <button type="button" className="mcfg-close" onClick={onClose}>
            Close
          </button>
          <button type="button" className="mcfg-submit" onClick={() => void saveParams()}>
            Submit
          </button>
        </footer>
      </div>
    </div>
  );
}
