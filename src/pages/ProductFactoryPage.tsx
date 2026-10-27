import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createFactoryRestrictionCode,
  createFactoryTxnType,
  createProductGroup,
  createProductProperty,
  listFactoryRestrictionCodes,
  listFactoryTxnTypes,
  listProductGroups,
  listProductProperties,
  type FactoryRestrictionCode,
  type FactoryTxnType,
  type ProductGroup,
  type ProductPropertyDefinition,
  updateFactoryRestrictionCode,
  updateFactoryTxnType,
  updateProductGroup,
  updateProductProperty,
} from "../api/productFactory";
import { ApiError } from "../lib/apiClient";
import "./ProductSetupPage.css";

type Tab = "groups" | "properties" | "txn-types" | "restrictions";

const TABS: { id: Tab; label: string }[] = [
  { id: "groups", label: "Product.Group" },
  { id: "properties", label: "Properties" },
  { id: "txn-types", label: "TXN.TYPE" },
  { id: "restrictions", label: "RESTRICTION" },
];

export function ProductFactoryPage() {
  const [tab, setTab] = useState<Tab>("groups");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [properties, setProperties] = useState<ProductPropertyDefinition[]>([]);
  const [txnTypes, setTxnTypes] = useState<FactoryTxnType[]>([]);
  const [restrictions, setRestrictions] = useState<FactoryRestrictionCode[]>([]);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      if (tab === "groups") setGroups(await listProductGroups());
      else if (tab === "properties") setProperties(await listProductProperties());
      else if (tab === "txn-types") setTxnTypes(await listFactoryTxnTypes());
      else setRestrictions(await listFactoryRestrictionCodes());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load Product Factory catalog");
    } finally {
      setBusy(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="ps">
      <h1>Product Factory</h1>
      <p className="ps-hint">
        Bank-editable catalogs from BANK247 PRODUCT FACTORY (Group, Properties, TXN.TYPE, RESTRICTION).
        Leaf products attach to these at{" "}
        <Link to="/settings/products">Product Setup</Link>.
      </p>

      <div className="ps-filters" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? "ps-btn ps-btn--primary" : "ps-btn ps-btn--ghost"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? <p role="alert">{error}</p> : null}
      {busy ? <p className="ps-hint">Loading…</p> : null}

      {tab === "groups" ? (
        <GroupsPanel rows={groups} onChanged={load} onError={setError} />
      ) : null}
      {tab === "properties" ? (
        <PropertiesPanel rows={properties} onChanged={load} onError={setError} />
      ) : null}
      {tab === "txn-types" ? (
        <TxnTypesPanel rows={txnTypes} onChanged={load} onError={setError} />
      ) : null}
      {tab === "restrictions" ? (
        <RestrictionsPanel rows={restrictions} onChanged={load} onError={setError} />
      ) : null}
    </div>
  );
}

function GroupsPanel({
  rows,
  onChanged,
  onError,
}: {
  rows: ProductGroup[];
  onChanged: () => Promise<void>;
  onError: (msg: string | null) => void;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [balanceType, setBalanceType] = useState("CREDIT");
  const [scope, setScope] = useState("WITHIN_GROUP");

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    onError(null);
    try {
      await createProductGroup({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        balanceType,
        productChangeScope: scope,
        crossCurrencyChange: false,
        enableNotificationAlert: true,
      });
      setCode("");
      setName("");
      await onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Create group failed");
    }
  }

  async function deactivate(row: ProductGroup) {
    onError(null);
    try {
      await updateProductGroup(row.code, {
        name: row.name,
        balanceType: row.balanceType,
        overdraftLimit: row.overdraftLimit,
        productChangeScope: row.productChangeScope,
        crossCurrencyChange: row.crossCurrencyChange,
        enableNotificationAlert: row.enableNotificationAlert,
        status: "INACTIVE",
      });
      await onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Update failed");
    }
  }

  return (
    <>
      <form className="ps-modal-grid" onSubmit={(e) => void onCreate(e)} style={{ marginBottom: "1.25rem" }}>
        <label className="ps-field">
          <span>Code</span>
          <input value={code} onChange={(e) => setCode(e.target.value)} required placeholder="SAVINGS.ACCOUNTS-GROUP" />
        </label>
        <label className="ps-field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="ps-field">
          <span>Balance type</span>
          <select value={balanceType} onChange={(e) => setBalanceType(e.target.value)}>
            {["CREDIT", "DEBIT", "BOTH"].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
        <label className="ps-field">
          <span>Product change scope</span>
          <select value={scope} onChange={(e) => setScope(e.target.value)}>
            {["WITHIN_GROUP", "ACROSS_GROUPS"].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
        <div className="ps-field ps-field--full">
          <button type="submit" className="ps-btn ps-btn--primary">
            Add group
          </button>
        </div>
      </form>
      <CatalogTable
        columns={["Code", "Name", "Balance", "Change scope", "Status", ""]}
        rows={rows.map((r) => [
          r.code,
          r.name,
          r.balanceType,
          r.productChangeScope,
          r.status,
          r.status === "ACTIVE" ? (
            <button type="button" className="ps-btn ps-btn--ghost" onClick={() => void deactivate(r)}>
              Deactivate
            </button>
          ) : (
            "—"
          ),
        ])}
      />
    </>
  );
}

function PropertiesPanel({
  rows,
  onChanged,
  onError,
}: {
  rows: ProductPropertyDefinition[];
  onChanged: () => Promise<void>;
  onError: (msg: string | null) => void;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [valueType, setValueType] = useState("NUMERIC");
  const [enumOptions, setEnumOptions] = useState("");

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    onError(null);
    try {
      await createProductProperty({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        valueType,
        enumOptions: valueType === "ENUM" ? enumOptions : undefined,
      });
      setCode("");
      setName("");
      setEnumOptions("");
      await onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Create property failed");
    }
  }

  async function deactivate(row: ProductPropertyDefinition) {
    onError(null);
    try {
      await updateProductProperty(row.code, {
        name: row.name,
        valueType: row.valueType,
        enumOptions: row.enumOptions?.join(","),
        description: row.description ?? undefined,
        status: "INACTIVE",
      });
      await onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Update failed");
    }
  }

  return (
    <>
      <form className="ps-modal-grid" onSubmit={(e) => void onCreate(e)} style={{ marginBottom: "1.25rem" }}>
        <label className="ps-field">
          <span>Code</span>
          <input value={code} onChange={(e) => setCode(e.target.value)} required placeholder="CRINTEREST.RATE" />
        </label>
        <label className="ps-field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="ps-field">
          <span>Value type</span>
          <select value={valueType} onChange={(e) => setValueType(e.target.value)}>
            {["BOOLEAN", "NUMERIC", "TEXT", "DATE", "ENUM", "GL_CODE"].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
        <label className="ps-field">
          <span>Enum options (comma-separated)</span>
          <input
            value={enumOptions}
            onChange={(e) => setEnumOptions(e.target.value)}
            disabled={valueType !== "ENUM"}
            placeholder="Actual/360,Actual/365"
          />
        </label>
        <div className="ps-field ps-field--full">
          <button type="submit" className="ps-btn ps-btn--primary">
            Add property
          </button>
        </div>
      </form>
      <CatalogTable
        columns={["Code", "Name", "Type", "Options", "Status", ""]}
        rows={rows.map((r) => [
          r.code,
          r.name,
          r.valueType,
          r.enumOptions?.join(", ") || "—",
          r.status,
          r.status === "ACTIVE" ? (
            <button type="button" className="ps-btn ps-btn--ghost" onClick={() => void deactivate(r)}>
              Deactivate
            </button>
          ) : (
            "—"
          ),
        ])}
      />
    </>
  );
}

function TxnTypesPanel({
  rows,
  onChanged,
  onError,
}: {
  rows: FactoryTxnType[];
  onChanged: () => Promise<void>;
  onError: (msg: string | null) => void;
}) {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    onError(null);
    try {
      await createFactoryTxnType({
        code: code.trim().toUpperCase(),
        description: description.trim(),
      });
      setCode("");
      setDescription("");
      await onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Create TXN.TYPE failed");
    }
  }

  async function deactivate(row: FactoryTxnType) {
    onError(null);
    try {
      await updateFactoryTxnType(row.code, { description: row.description, status: "INACTIVE" });
      await onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Update failed");
    }
  }

  return (
    <>
      <form className="ps-modal-grid" onSubmit={(e) => void onCreate(e)} style={{ marginBottom: "1.25rem" }}>
        <label className="ps-field">
          <span>Code</span>
          <input value={code} onChange={(e) => setCode(e.target.value)} required placeholder="CASHD" />
        </label>
        <label className="ps-field">
          <span>Description</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} required />
        </label>
        <div className="ps-field ps-field--full">
          <button type="submit" className="ps-btn ps-btn--primary">
            Add TXN.TYPE
          </button>
        </div>
      </form>
      <CatalogTable
        columns={["Code", "Description", "Status", ""]}
        rows={rows.map((r) => [
          r.code,
          r.description,
          r.status,
          r.status === "ACTIVE" ? (
            <button type="button" className="ps-btn ps-btn--ghost" onClick={() => void deactivate(r)}>
              Deactivate
            </button>
          ) : (
            "—"
          ),
        ])}
      />
    </>
  );
}

function RestrictionsPanel({
  rows,
  onChanged,
  onError,
}: {
  rows: FactoryRestrictionCode[];
  onChanged: () => Promise<void>;
  onError: (msg: string | null) => void;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [postingEffect, setPostingEffect] = useState("NO_DEBIT");
  const [allowTxnScope, setAllowTxnScope] = useState("CREDIT");
  const [closureRule, setClosureRule] = useState("NA");

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    onError(null);
    try {
      await createFactoryRestrictionCode({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        postingEffect,
        allowTxnScope,
        closureRule,
      });
      setCode("");
      setName("");
      await onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Create restriction failed");
    }
  }

  async function deactivate(row: FactoryRestrictionCode) {
    onError(null);
    try {
      await updateFactoryRestrictionCode(row.code, {
        name: row.name,
        postingEffect: row.postingEffect,
        allowTxnScope: row.allowTxnScope,
        closureRule: row.closureRule,
        status: "INACTIVE",
      });
      await onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Update failed");
    }
  }

  return (
    <>
      <form className="ps-modal-grid" onSubmit={(e) => void onCreate(e)} style={{ marginBottom: "1.25rem" }}>
        <label className="ps-field">
          <span>Code</span>
          <input value={code} onChange={(e) => setCode(e.target.value)} required placeholder="DORMANT" />
        </label>
        <label className="ps-field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="ps-field">
          <span>Posting effect</span>
          <select value={postingEffect} onChange={(e) => setPostingEffect(e.target.value)}>
            {["NO_DEBIT", "NO_CREDIT", "NO_POSTING", "DEBIT_ONLY", "CREDIT_ONLY", "NONE"].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
        <label className="ps-field">
          <span>Allow txn scope</span>
          <select value={allowTxnScope} onChange={(e) => setAllowTxnScope(e.target.value)}>
            {["ALL", "DEBIT", "CREDIT", "NONE"].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
        <label className="ps-field">
          <span>Closure rule</span>
          <select value={closureRule} onChange={(e) => setClosureRule(e.target.value)}>
            {["NA", "CLOSE_AFTER_30_DAYS_NO_TXN"].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
        <div className="ps-field ps-field--full">
          <button type="submit" className="ps-btn ps-btn--primary">
            Add restriction
          </button>
        </div>
      </form>
      <CatalogTable
        columns={["Code", "Name", "Effect", "Allow TXN", "Closure", "Status", ""]}
        rows={rows.map((r) => [
          r.code,
          r.name,
          r.postingEffect,
          r.allowTxnScope,
          r.closureRule,
          r.status,
          r.status === "ACTIVE" ? (
            <button type="button" className="ps-btn ps-btn--ghost" onClick={() => void deactivate(r)}>
              Deactivate
            </button>
          ) : (
            "—"
          ),
        ])}
      />
    </>
  );
}

function CatalogTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: (string | number | ReactNode)[][];
}) {
  return (
    <div className="ps-table-wrap">
      <table className="ps-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c || "actions"}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>No rows</td>
            </tr>
          ) : (
            rows.map((cells, i) => (
              <tr key={i}>
                {cells.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
