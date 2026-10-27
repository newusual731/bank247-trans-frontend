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
      <h1>Settings</h1>
      <p className="mcfg-sub">Limits, products, and other bank configuration.</p>

      <div className="mcfg-cards">
        <button type="button" className="mcfg-card" onClick={() => setAmendOpen(true)}>
          <span className="mcfg-card-icon" aria-hidden>
            <IconLimits />
          </span>
          <div>
            <strong>User limits</strong>
            <em>Debit and credit limits by user and branch</em>
          </div>
          <span className="mcfg-chev" aria-hidden>
            ›
          </span>
        </button>
        <Link to="/settings/products" className="mcfg-card">
          <span className="mcfg-card-icon" aria-hidden>
            <IconProducts />
          </span>
          <div>
            <strong>Product setup</strong>
            <em>Create and maintain account products</em>
          </div>
          <span className="mcfg-chev" aria-hidden>
            ›
          </span>
        </Link>
        <Link to="/settings/product-factory" className="mcfg-card">
          <span className="mcfg-card-icon" aria-hidden>
            <IconFactory />
          </span>
          <div>
            <strong>Product catalogs</strong>
            <em>Groups, properties, transaction types, and restrictions</em>
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

function IconLimits() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 19V5M4 19h16M8 15V9M12 15V7M16 15v-4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconProducts() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7.5L12 3l8 4.5v9L12 21l-8-4.5v-9z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M12 12v9M12 12L4 7.5M12 12l8-4.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function IconFactory() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 3v2.2M12 18.8V21M4.9 6.5l1.6 1.5M17.5 16l1.6 1.5M3 12h2.2M18.8 12H21M4.9 17.5l1.6-1.5M17.5 8l1.6-1.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
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
        title="Limits updated"
        message="User limits have been saved."
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
        <h2>Amend user limit</h2>
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
            value={branch}
            onChange={(e) => {
              setBranch(e.target.value);
              void loadParams(e.target.value);
            }}
          />
        </label>
        {saveError ? <p className="mcfg-error">{saveError}</p> : null}
        <footer>
          <button type="button" className="mcfg-close" onClick={onClose} disabled={saving}>
            Close
          </button>
          <button type="button" className="mcfg-submit" onClick={() => void saveParams()} disabled={saving}>
            {saving ? "Saving…" : "Submit"}
          </button>
        </footer>
      </div>
    </div>
  );
}
