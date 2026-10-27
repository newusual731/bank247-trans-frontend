import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createFactoryRestrictionCode,
  createFactoryTxnType,
  createProductGroup,
  catalogLoadMessage,
  createProductProperty,
  listFactoryRestrictionCodes,
  listFactoryTxnTypes,
  listProductGroups,
  listProductProperties,
  type FactoryCatalogStatus,
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

type Catalog = "groups" | "properties" | "txn-types" | "restrictions";

type Modal =
  | { kind: "add" }
  | { kind: "edit"; code: string }
  | { kind: "view"; code: string }
  | null;

const CATALOGS: { id: Catalog; label: string; addLabel: string }[] = [
  { id: "groups", label: "Product.Group", addLabel: "+Add New Group" },
  { id: "properties", label: "Properties", addLabel: "+Add New Property" },
  { id: "txn-types", label: "TXN.TYPE", addLabel: "+Add New TXN.TYPE" },
  { id: "restrictions", label: "RESTRICTION", addLabel: "+Add New Restriction" },
];

const STATUS_FILTERS = ["All", "ACTIVE", "INACTIVE"] as const;

const BALANCE_TYPES = ["CREDIT", "DEBIT", "BOTH"] as const;
const CHANGE_SCOPES = ["WITHIN_GROUP", "ACROSS_GROUPS"] as const;
const VALUE_TYPES = ["BOOLEAN", "NUMERIC", "TEXT", "DATE", "ENUM", "GL_CODE"] as const;
const POSTING_EFFECTS = ["NO_DEBIT", "NO_CREDIT", "NO_POSTING", "DEBIT_ONLY", "CREDIT_ONLY", "NONE"] as const;
const ALLOW_TXN_SCOPES = ["ALL", "DEBIT", "CREDIT", "NONE"] as const;
const CLOSURE_RULES = ["NA", "CLOSE_AFTER_30_DAYS_NO_TXN"] as const;

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

function exportCsv(filename: string, headers: string[], rows: string[][]) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ProductFactoryPage() {
  const [catalog, setCatalog] = useState<Catalog>("groups");
  const [status, setStatus] = useState<string>("All");
  const [modal, setModal] = useState<Modal>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [properties, setProperties] = useState<ProductPropertyDefinition[]>([]);
  const [txnTypes, setTxnTypes] = useState<FactoryTxnType[]>([]);
  const [restrictions, setRestrictions] = useState<FactoryRestrictionCode[]>([]);

  const catalogMeta = CATALOGS.find((c) => c.id === catalog)!;

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    const statusArg =
      status === "All" ? undefined : (status as FactoryCatalogStatus);
    try {
      if (catalog === "groups") setGroups(await listProductGroups(statusArg));
      else if (catalog === "properties") setProperties(await listProductProperties(statusArg));
      else if (catalog === "txn-types") setTxnTypes(await listFactoryTxnTypes(statusArg));
      else setRestrictions(await listFactoryRestrictionCodes(statusArg));
    } catch (e) {
      setError(catalogLoadMessage(e));
    } finally {
      setBusy(false);
    }
  }, [catalog, status, refreshKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const reload = () => setRefreshKey((k) => k + 1);

  const onExport = () => {
    if (catalog === "groups") {
      exportCsv(
        "product-groups.csv",
        ["Code", "Name", "Balance Type", "Change Scope", "Status", "Created"],
        groups.map((r) => [
          r.code,
          r.name,
          r.balanceType,
          r.productChangeScope,
          r.status,
          formatDate(r.createdAt),
        ]),
      );
    } else if (catalog === "properties") {
      exportCsv(
        "product-properties.csv",
        ["Code", "Name", "Value Type", "Options", "Status", "Created"],
        properties.map((r) => [
          r.code,
          r.name,
          r.valueType,
          (r.enumOptions ?? []).join("; "),
          r.status,
          formatDate(r.createdAt),
        ]),
      );
    } else if (catalog === "txn-types") {
      exportCsv(
        "factory-txn-types.csv",
        ["Code", "Description", "Status", "Created"],
        txnTypes.map((r) => [r.code, r.description, r.status, formatDate(r.createdAt)]),
      );
    } else {
      exportCsv(
        "factory-restrictions.csv",
        ["Code", "Name", "Posting Effect", "Allow TXN", "Closure", "Status", "Created"],
        restrictions.map((r) => [
          r.code,
          r.name,
          r.postingEffect,
          r.allowTxnScope,
          r.closureRule,
          r.status,
          formatDate(r.createdAt),
        ]),
      );
    }
  };

  return (
    <div className="ps">
      <h1>Product catalogs</h1>
      <p className="ps-hint">
        Maintain product groups, properties, allowed transaction types, and restrictions used when you
        set up products.{" "}
        <Link to="/settings/products">Back to product setup</Link>
      </p>
      {error ? <p role="alert">{error}</p> : null}

      <div className="ps-filters">
        <label className="ps-field">
          <span>Catalog</span>
          <div className="ps-select">
            <select
              value={catalog}
              onChange={(e) => {
                setCatalog(e.target.value as Catalog);
                setModal(null);
              }}
            >
              {CATALOGS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <span className="ps-filter-spacer" />
        <label className="ps-field">
          <span>Status</span>
          <div className="ps-select">
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_FILTERS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        </label>
        <span className="ps-filter-spacer" />
        <span className="ps-field" />
      </div>

      <div className="ps-actions">
        <button type="button" className="ps-btn ps-btn--primary" onClick={() => setModal({ kind: "add" })}>
          {catalogMeta.addLabel}
        </button>
        <div className="ps-actions-right">
          <button
            type="button"
            className="ps-btn ps-btn--export"
            onClick={onExport}
            disabled={busy}
          >
            <ExportIcon /> Export
          </button>
          <button type="button" className="ps-btn ps-btn--print" onClick={() => window.print()}>
            <PrintIcon /> Print
          </button>
        </div>
      </div>

      <div className="ps-table-wrap">
        {catalog === "groups" ? (
          <GroupsTable
            rows={groups}
            loading={busy}
            onView={(code) => setModal({ kind: "view", code })}
            onEdit={(code) => setModal({ kind: "edit", code })}
          />
        ) : null}
        {catalog === "properties" ? (
          <PropertiesTable
            rows={properties}
            loading={busy}
            onView={(code) => setModal({ kind: "view", code })}
            onEdit={(code) => setModal({ kind: "edit", code })}
          />
        ) : null}
        {catalog === "txn-types" ? (
          <TxnTypesTable
            rows={txnTypes}
            loading={busy}
            onView={(code) => setModal({ kind: "view", code })}
            onEdit={(code) => setModal({ kind: "edit", code })}
          />
        ) : null}
        {catalog === "restrictions" ? (
          <RestrictionsTable
            rows={restrictions}
            loading={busy}
            onView={(code) => setModal({ kind: "view", code })}
            onEdit={(code) => setModal({ kind: "edit", code })}
          />
        ) : null}
      </div>

      {modal?.kind === "add" || modal?.kind === "edit" ? (
        <CatalogFormModal
          catalog={catalog}
          mode={modal.kind}
          code={modal.kind === "edit" ? modal.code : undefined}
          groups={groups}
          properties={properties}
          txnTypes={txnTypes}
          restrictions={restrictions}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            reload();
          }}
        />
      ) : null}

      {modal?.kind === "view" ? (
        <CatalogViewModal
          catalog={catalog}
          code={modal.code}
          groups={groups}
          properties={properties}
          txnTypes={txnTypes}
          restrictions={restrictions}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ kind: "edit", code: modal.code })}
        />
      ) : null}
    </div>
  );
}

function GroupsTable({
  rows,
  loading,
  onView,
  onEdit,
}: {
  rows: ProductGroup[];
  loading: boolean;
  onView: (code: string) => void;
  onEdit: (code: string) => void;
}) {
  return (
    <table className="ps-table">
      <thead>
        <tr>
          <th>Code</th>
          <th>Name</th>
          <th>Balance Type</th>
          <th>Change Scope</th>
          <th>Cross CCY</th>
          <th>Status</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr>
            <td colSpan={8} style={{ textAlign: "center", color: "#6b7280" }}>
              Loading…
            </td>
          </tr>
        ) : rows.length === 0 ? (
          <tr>
            <td colSpan={8} style={{ textAlign: "center", color: "#6b7280" }}>
              No groups yet. Use +Add New Group.
            </td>
          </tr>
        ) : (
          rows.map((r) => (
            <tr key={r.code}>
              <td>{r.code}</td>
              <td>{r.name}</td>
              <td>{r.balanceType}</td>
              <td>{r.productChangeScope}</td>
              <td>{r.crossCurrencyChange ? "Yes" : "No"}</td>
              <td>{r.status}</td>
              <td>{formatDate(r.createdAt)}</td>
              <td>
                <RowActions onView={() => onView(r.code)} onEdit={() => onEdit(r.code)} />
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function PropertiesTable({
  rows,
  loading,
  onView,
  onEdit,
}: {
  rows: ProductPropertyDefinition[];
  loading: boolean;
  onView: (code: string) => void;
  onEdit: (code: string) => void;
}) {
  return (
    <table className="ps-table">
      <thead>
        <tr>
          <th>Code</th>
          <th>Name</th>
          <th>Value Type</th>
          <th>Options</th>
          <th>Status</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr>
            <td colSpan={7} style={{ textAlign: "center", color: "#6b7280" }}>
              Loading…
            </td>
          </tr>
        ) : rows.length === 0 ? (
          <tr>
            <td colSpan={7} style={{ textAlign: "center", color: "#6b7280" }}>
              No properties yet. Use +Add New Property.
            </td>
          </tr>
        ) : (
          rows.map((r) => (
            <tr key={r.code}>
              <td>{r.code}</td>
              <td>{r.name}</td>
              <td>{r.valueType}</td>
              <td>{(r.enumOptions ?? []).join(", ") || "—"}</td>
              <td>{r.status}</td>
              <td>{formatDate(r.createdAt)}</td>
              <td>
                <RowActions onView={() => onView(r.code)} onEdit={() => onEdit(r.code)} />
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function TxnTypesTable({
  rows,
  loading,
  onView,
  onEdit,
}: {
  rows: FactoryTxnType[];
  loading: boolean;
  onView: (code: string) => void;
  onEdit: (code: string) => void;
}) {
  return (
    <table className="ps-table">
      <thead>
        <tr>
          <th>Code</th>
          <th>Description</th>
          <th>Status</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr>
            <td colSpan={5} style={{ textAlign: "center", color: "#6b7280" }}>
              Loading…
            </td>
          </tr>
        ) : rows.length === 0 ? (
          <tr>
            <td colSpan={5} style={{ textAlign: "center", color: "#6b7280" }}>
              No TXN.TYPE rows yet. Use +Add New TXN.TYPE.
            </td>
          </tr>
        ) : (
          rows.map((r) => (
            <tr key={r.code}>
              <td>{r.code}</td>
              <td>{r.description}</td>
              <td>{r.status}</td>
              <td>{formatDate(r.createdAt)}</td>
              <td>
                <RowActions onView={() => onView(r.code)} onEdit={() => onEdit(r.code)} />
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function RestrictionsTable({
  rows,
  loading,
  onView,
  onEdit,
}: {
  rows: FactoryRestrictionCode[];
  loading: boolean;
  onView: (code: string) => void;
  onEdit: (code: string) => void;
}) {
  return (
    <table className="ps-table">
      <thead>
        <tr>
          <th>Code</th>
          <th>Name</th>
          <th>Posting Effect</th>
          <th>Allow TXN</th>
          <th>Closure Rule</th>
          <th>Status</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr>
            <td colSpan={8} style={{ textAlign: "center", color: "#6b7280" }}>
              Loading…
            </td>
          </tr>
        ) : rows.length === 0 ? (
          <tr>
            <td colSpan={8} style={{ textAlign: "center", color: "#6b7280" }}>
              No restrictions yet. Use +Add New Restriction.
            </td>
          </tr>
        ) : (
          rows.map((r) => (
            <tr key={r.code}>
              <td>{r.code}</td>
              <td>{r.name}</td>
              <td>{r.postingEffect}</td>
              <td>{r.allowTxnScope}</td>
              <td>{r.closureRule}</td>
              <td>{r.status}</td>
              <td>{formatDate(r.createdAt)}</td>
              <td>
                <RowActions onView={() => onView(r.code)} onEdit={() => onEdit(r.code)} />
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function RowActions({ onView, onEdit }: { onView: () => void; onEdit: () => void }) {
  return (
    <div className="ps-row-actions">
      <button type="button" onClick={onView}>
        View
      </button>
      <span aria-hidden>·</span>
      <button type="button" className="ps-edit" onClick={onEdit}>
        Edit
      </button>
    </div>
  );
}

function CatalogFormModal({
  catalog,
  mode,
  code,
  groups,
  properties,
  txnTypes,
  restrictions,
  onClose,
  onSaved,
}: {
  catalog: Catalog;
  mode: "add" | "edit";
  code?: string;
  groups: ProductGroup[];
  properties: ProductPropertyDefinition[];
  txnTypes: FactoryTxnType[];
  restrictions: FactoryRestrictionCode[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = mode === "edit";
  const existingGroup = useMemo(
    () => (code ? groups.find((g) => g.code === code) : undefined),
    [code, groups],
  );
  const existingProp = useMemo(
    () => (code ? properties.find((p) => p.code === code) : undefined),
    [code, properties],
  );
  const existingTxn = useMemo(
    () => (code ? txnTypes.find((t) => t.code === code) : undefined),
    [code, txnTypes],
  );
  const existingRest = useMemo(
    () => (code ? restrictions.find((r) => r.code === code) : undefined),
    [code, restrictions],
  );

  const [rowCode, setRowCode] = useState(code ?? "");
  const [name, setName] = useState(
    existingGroup?.name ?? existingProp?.name ?? existingRest?.name ?? "",
  );
  const [description, setDescription] = useState(
    existingTxn?.description ?? existingProp?.description ?? "",
  );
  const [balanceType, setBalanceType] = useState(existingGroup?.balanceType ?? "CREDIT");
  const [scope, setScope] = useState(existingGroup?.productChangeScope ?? "WITHIN_GROUP");
  const [overdraft, setOverdraft] = useState(
    existingGroup?.overdraftLimit != null ? String(existingGroup.overdraftLimit) : "",
  );
  const [crossCcy, setCrossCcy] = useState(existingGroup?.crossCurrencyChange ?? false);
  const [notify, setNotify] = useState(existingGroup?.enableNotificationAlert ?? true);
  const [valueType, setValueType] = useState(existingProp?.valueType ?? "NUMERIC");
  const [enumOptions, setEnumOptions] = useState((existingProp?.enumOptions ?? []).join(","));
  const [postingEffect, setPostingEffect] = useState(existingRest?.postingEffect ?? "NO_DEBIT");
  const [allowTxnScope, setAllowTxnScope] = useState(existingRest?.allowTxnScope ?? "CREDIT");
  const [closureRule, setClosureRule] = useState(existingRest?.closureRule ?? "NA");
  const [status, setStatus] = useState<FactoryCatalogStatus>(
    existingGroup?.status ??
      existingProp?.status ??
      existingTxn?.status ??
      existingRest?.status ??
      "ACTIVE",
  );
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const title =
    catalog === "groups"
      ? isEdit
        ? "Edit Product Group"
        : "Add New Product Group"
      : catalog === "properties"
        ? isEdit
          ? "Edit Property"
          : "Add New Property"
        : catalog === "txn-types"
          ? isEdit
            ? "Edit TXN.TYPE"
            : "Add New TXN.TYPE"
          : isEdit
            ? "Edit Restriction"
            : "Add New Restriction";

  async function save() {
    setBusy(true);
    setSaveError(null);
    try {
      if (catalog === "groups") {
        const body = {
          name: name.trim(),
          balanceType,
          overdraftLimit: overdraft.trim() === "" ? null : Number(overdraft),
          productChangeScope: scope,
          crossCurrencyChange: crossCcy,
          enableNotificationAlert: notify,
          status,
        };
        if (isEdit && code) {
          await updateProductGroup(code, body);
        } else {
          await createProductGroup({
            code: rowCode.trim().toUpperCase(),
            name: body.name,
            balanceType: body.balanceType,
            overdraftLimit: body.overdraftLimit,
            productChangeScope: body.productChangeScope,
            crossCurrencyChange: body.crossCurrencyChange,
            enableNotificationAlert: body.enableNotificationAlert,
          });
        }
      } else if (catalog === "properties") {
        const body = {
          name: name.trim(),
          valueType,
          enumOptions: valueType === "ENUM" ? enumOptions : undefined,
          description: description.trim() || undefined,
          status,
        };
        if (isEdit && code) {
          await updateProductProperty(code, body);
        } else {
          await createProductProperty({
            code: rowCode.trim().toUpperCase(),
            name: body.name,
            valueType: body.valueType,
            enumOptions: body.enumOptions,
            description: body.description,
          });
        }
      } else if (catalog === "txn-types") {
        if (isEdit && code) {
          await updateFactoryTxnType(code, { description: description.trim(), status });
        } else {
          await createFactoryTxnType({
            code: rowCode.trim().toUpperCase(),
            description: description.trim(),
          });
        }
      } else if (isEdit && code) {
        await updateFactoryRestrictionCode(code, {
          name: name.trim(),
          postingEffect,
          allowTxnScope,
          closureRule,
          status,
        });
      } else {
        await createFactoryRestrictionCode({
          code: rowCode.trim().toUpperCase(),
          name: name.trim(),
          postingEffect,
          allowTxnScope,
          closureRule,
        });
      }
      onSaved();
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ps-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="ps-modal ps-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pf-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        {saveError ? <p role="alert">{saveError}</p> : null}
        <header className="ps-modal-head">
          <div>
            <h2 id="pf-form-title">{title}</h2>
            <h3>{CATALOGS.find((c) => c.id === catalog)?.label}</h3>
          </div>
          <button type="button" className="ps-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="ps-modal-grid">
          {catalog === "groups" ? (
            <>
              <label className="ps-field">
                <span>Code</span>
                <input
                  value={isEdit ? code : rowCode}
                  onChange={(e) => setRowCode(e.target.value)}
                  disabled={isEdit}
                  required
                  placeholder="SAVINGS.ACCOUNTS-GROUP"
                />
              </label>
              <label className="ps-field">
                <span>Name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label className="ps-field">
                <span>Balance Type</span>
                <div className="ps-select">
                  <select value={balanceType} onChange={(e) => setBalanceType(e.target.value)}>
                    {BALANCE_TYPES.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                  <ChevronDown />
                </div>
              </label>
              <label className="ps-field">
                <span>Product Change Scope</span>
                <div className="ps-select">
                  <select value={scope} onChange={(e) => setScope(e.target.value)}>
                    {CHANGE_SCOPES.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                  <ChevronDown />
                </div>
              </label>
              <label className="ps-field">
                <span>Overdraft Limit</span>
                <input
                  value={overdraft}
                  onChange={(e) => setOverdraft(e.target.value)}
                  placeholder="Optional"
                />
              </label>
              {isEdit ? (
                <label className="ps-field">
                  <span>Status</span>
                  <div className="ps-select">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as FactoryCatalogStatus)}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                    <ChevronDown />
                  </div>
                </label>
              ) : null}
              <label className="ps-field ps-toggle-field">
                <span>Cross-currency change</span>
                <button
                  type="button"
                  className={`ps-toggle${crossCcy ? " is-on" : ""}`}
                  onClick={() => setCrossCcy((v) => !v)}
                  aria-pressed={crossCcy}
                >
                  <span />
                </button>
              </label>
              <label className="ps-field ps-toggle-field">
                <span>Notification alerts</span>
                <button
                  type="button"
                  className={`ps-toggle${notify ? " is-on" : ""}`}
                  onClick={() => setNotify((v) => !v)}
                  aria-pressed={notify}
                >
                  <span />
                </button>
              </label>
            </>
          ) : null}

          {catalog === "properties" ? (
            <>
              <label className="ps-field">
                <span>Code</span>
                <input
                  value={isEdit ? code : rowCode}
                  onChange={(e) => setRowCode(e.target.value)}
                  disabled={isEdit}
                  required
                  placeholder="CRINTEREST.RATE"
                />
              </label>
              <label className="ps-field">
                <span>Name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label className="ps-field">
                <span>Value Type</span>
                <div className="ps-select">
                  <select value={valueType} onChange={(e) => setValueType(e.target.value)}>
                    {VALUE_TYPES.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                  <ChevronDown />
                </div>
              </label>
              <label className="ps-field">
                <span>Enum options</span>
                <input
                  value={enumOptions}
                  onChange={(e) => setEnumOptions(e.target.value)}
                  disabled={valueType !== "ENUM"}
                  placeholder="Actual/360,Actual/365"
                />
              </label>
              <label className="ps-field ps-field--full">
                <span>Description</span>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>
              {isEdit ? (
                <label className="ps-field">
                  <span>Status</span>
                  <div className="ps-select">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as FactoryCatalogStatus)}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                    <ChevronDown />
                  </div>
                </label>
              ) : null}
            </>
          ) : null}

          {catalog === "txn-types" ? (
            <>
              <label className="ps-field">
                <span>Code</span>
                <input
                  value={isEdit ? code : rowCode}
                  onChange={(e) => setRowCode(e.target.value)}
                  disabled={isEdit}
                  required
                  placeholder="CASHD"
                />
              </label>
              <label className="ps-field">
                <span>Description</span>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </label>
              {isEdit ? (
                <label className="ps-field">
                  <span>Status</span>
                  <div className="ps-select">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as FactoryCatalogStatus)}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                    <ChevronDown />
                  </div>
                </label>
              ) : null}
            </>
          ) : null}

          {catalog === "restrictions" ? (
            <>
              <label className="ps-field">
                <span>Code</span>
                <input
                  value={isEdit ? code : rowCode}
                  onChange={(e) => setRowCode(e.target.value)}
                  disabled={isEdit}
                  required
                  placeholder="DORMANT"
                />
              </label>
              <label className="ps-field">
                <span>Name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label className="ps-field">
                <span>Posting Effect</span>
                <div className="ps-select">
                  <select value={postingEffect} onChange={(e) => setPostingEffect(e.target.value)}>
                    {POSTING_EFFECTS.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                  <ChevronDown />
                </div>
              </label>
              <label className="ps-field">
                <span>Allow TXN Scope</span>
                <div className="ps-select">
                  <select value={allowTxnScope} onChange={(e) => setAllowTxnScope(e.target.value)}>
                    {ALLOW_TXN_SCOPES.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                  <ChevronDown />
                </div>
              </label>
              <label className="ps-field">
                <span>Closure Rule</span>
                <div className="ps-select">
                  <select value={closureRule} onChange={(e) => setClosureRule(e.target.value)}>
                    {CLOSURE_RULES.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                  <ChevronDown />
                </div>
              </label>
              {isEdit ? (
                <label className="ps-field">
                  <span>Status</span>
                  <div className="ps-select">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as FactoryCatalogStatus)}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                    <ChevronDown />
                  </div>
                </label>
              ) : null}
            </>
          ) : null}
        </div>

        <footer className="ps-modal-foot">
          <button type="button" className="ps-btn ps-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <div className="ps-modal-foot-right">
            <button
              type="button"
              className="ps-btn ps-btn--primary"
              disabled={busy}
              onClick={() => void save()}
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function CatalogViewModal({
  catalog,
  code,
  groups,
  properties,
  txnTypes,
  restrictions,
  onClose,
  onEdit,
}: {
  catalog: Catalog;
  code: string;
  groups: ProductGroup[];
  properties: ProductPropertyDefinition[];
  txnTypes: FactoryTxnType[];
  restrictions: FactoryRestrictionCode[];
  onClose: () => void;
  onEdit: () => void;
}) {
  const group = groups.find((g) => g.code === code);
  const prop = properties.find((p) => p.code === code);
  const txn = txnTypes.find((t) => t.code === code);
  const rest = restrictions.find((r) => r.code === code);

  const fields: { label: string; value: string }[] = [];
  if (catalog === "groups" && group) {
    fields.push(
      { label: "Code", value: group.code },
      { label: "Name", value: group.name },
      { label: "Balance Type", value: group.balanceType },
      { label: "Change Scope", value: group.productChangeScope },
      {
        label: "Overdraft Limit",
        value: group.overdraftLimit != null ? String(group.overdraftLimit) : "—",
      },
      { label: "Cross Currency", value: group.crossCurrencyChange ? "Yes" : "No" },
      { label: "Notifications", value: group.enableNotificationAlert ? "Yes" : "No" },
      { label: "Status", value: group.status },
      { label: "Created Date", value: formatDate(group.createdAt) },
    );
  } else if (catalog === "properties" && prop) {
    fields.push(
      { label: "Code", value: prop.code },
      { label: "Name", value: prop.name },
      { label: "Value Type", value: prop.valueType },
      { label: "Options", value: (prop.enumOptions ?? []).join(", ") || "—" },
      { label: "Description", value: prop.description || "—" },
      { label: "Status", value: prop.status },
      { label: "Created Date", value: formatDate(prop.createdAt) },
    );
  } else if (catalog === "txn-types" && txn) {
    fields.push(
      { label: "Code", value: txn.code },
      { label: "Description", value: txn.description },
      { label: "Status", value: txn.status },
      { label: "Created Date", value: formatDate(txn.createdAt) },
    );
  } else if (catalog === "restrictions" && rest) {
    fields.push(
      { label: "Code", value: rest.code },
      { label: "Name", value: rest.name },
      { label: "Posting Effect", value: rest.postingEffect },
      { label: "Allow TXN Scope", value: rest.allowTxnScope },
      { label: "Closure Rule", value: rest.closureRule },
      { label: "Status", value: rest.status },
      { label: "Created Date", value: formatDate(rest.createdAt) },
    );
  }

  return (
    <div className="ps-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="ps-modal ps-modal--view"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pf-view-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ps-modal-head ps-modal-head--view">
          <h2 id="pf-view-title">View {CATALOGS.find((c) => c.id === catalog)?.label}</h2>
          <button type="button" className="ps-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <dl className="ps-view-list">
          {fields.length === 0 ? (
            <div>
              <dt>Record</dt>
              <dd>Not found</dd>
            </div>
          ) : (
            fields.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>
                  {f.label === "Created Date" ? (
                    <>
                      <CalendarIcon /> {f.value}
                    </>
                  ) : (
                    f.value
                  )}
                </dd>
              </div>
            ))
          )}
        </dl>
        <footer className="ps-view-foot" style={{ gap: "0.5rem" }}>
          <button type="button" className="ps-btn ps-btn--ghost" onClick={onEdit}>
            Edit
          </button>
          <button type="button" className="ps-btn ps-btn--primary" onClick={onClose}>
            Ok
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

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3.5v3M16 3.5v3M3.5 9.5h17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 16V4M12 4l-4 4M12 4l4 4M5 20h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4v12M12 16l-4-4M12 16l4-4M5 20h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
