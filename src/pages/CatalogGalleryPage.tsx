import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AccountSearchDropdown,
  CatalogMenuPreview,
  CatalogTabs,
  FieldLabel,
  FormkitChevron,
  FormSelect,
  GradientDivider,
  MonthDatePicker,
} from "../components/FormSelect";
import { CATALOG_REGISTRY } from "../data/catalogs";
import { fetchLiveCatalogs, type LiveCatalogBundle } from "../api/catalogs";
import { ApiError } from "../lib/apiClient";
import "./CatalogGalleryPage.css";

/**
 * Pixel-match gallery for root Figma catalog / dropdown PNGs.
 * Not a production CBS workflow screen — design QA surface.
 */
export function CatalogGalleryPage() {
  const [selectDemo, setSelectDemo] = useState("");
  const [account, setAccount] = useState("");
  const [live, setLive] = useState<LiveCatalogBundle | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchLiveCatalogs();
        if (!cancelled) setLive(data);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Catalog load failed");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const registry = useMemo(() => {
    if (!live) return CATALOG_REGISTRY;
    return CATALOG_REGISTRY.map((cat) => {
      const title = cat.title.toLowerCase();
      let options = cat.options;
      if (title.includes("gl") || title.includes("account class") || cat.source.toLowerCase().includes("gl")) {
        if (live.glCodes.length) options = live.glCodes as unknown as typeof cat.options;
      } else if (title.includes("permission") || title.includes("iam")) {
        if (live.permissions.length) options = live.permissions as unknown as typeof cat.options;
      } else if (title.includes("product") || title.includes("account type")) {
        const merged = [...live.casaProducts, ...live.loanProducts, ...live.investmentProducts];
        if (merged.length) options = merged as unknown as typeof cat.options;
      }
      return { ...cat, options };
    });
  }, [live]);

  return (
    <div className="cgal">
      <header className="cgal-head">
        <div>
          <h1>Catalogs &amp; Dropdowns</h1>
          {loadError ? <p role="alert">{loadError}</p> : null}
          {live ? <p className="cgal-live">Live options loaded from GL / products / IAM permissions.</p> : null}
          <p>Root Figma PNG option lists — pixel-matched menus, selects, search, tabs, pickers.</p>
        </div>
        <Link to="/settings/users" className="cgal-back">
          ← Settings
        </Link>
      </header>

      <section className="cgal-demo">
        <h2>Live controls</h2>
        <div className="cgal-demo-grid">
          <FormSelect
            label="Account Type"
            placeholder="Select"
            value={selectDemo}
            options={CATALOG_REGISTRY.find((c) => c.source === "ACCOUNT TYPE.png")!.options}
            onChange={setSelectDemo}
          />
          <div>
            <FieldLabel>formkit_down</FieldLabel>
            <div className="cgal-chev-demo">
              Closed select uses <FormkitChevron />
            </div>
          </div>
          <div>
            <FieldLabel>Transaction Amount</FieldLabel>
            <input className="cgal-amount" placeholder="0.00" />
          </div>
          <GradientDivider />
        </div>
      </section>

      <div className="cgal-grid">
        {registry.map((cat) => (
          <article key={cat.source} className="cgal-card">
            <header>
              <h3>{cat.title}</h3>
              <code>{cat.source}</code>
            </header>
            <div className="cgal-body">
              {cat.kind === "search" ? (
                <AccountSearchDropdown
                  options={cat.options}
                  value={account}
                  onSelect={setAccount}
                />
              ) : cat.kind === "month-picker" ? (
                <MonthDatePicker />
              ) : cat.kind === "tabs" ? (
                <CatalogTabs tabs={cat.options} />
              ) : cat.kind === "label" && cat.source.includes("CUSTOMER") ? (
                <GradientDivider />
              ) : cat.kind === "label" && cat.source.includes("formkit") ? (
                <FormkitChevron />
              ) : cat.kind === "label" && cat.source.includes("Transaction") ? (
                <FieldLabel>Transaction Amount</FieldLabel>
              ) : cat.kind === "label" ? (
                <hr className="cgal-hr" />
              ) : cat.kind === "form" ? (
                <p className="cgal-form-note">
                  Full form — see{" "}
                  <Link to="/teller/withdrawals/cheque">Cheque</Link>,{" "}
                  <Link to="/teller/withdrawals/counter-cheque">Counter Cheque</Link>,{" "}
                  <Link to="/teller/withdrawals/internal">Internal</Link>
                </p>
              ) : cat.options.length ? (
                <CatalogMenuPreview
                  options={cat.options}
                  highlight={cat.highlight}
                  checked={cat.checked}
                />
              ) : (
                <p className="cgal-empty">No list options</p>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
