import { useState } from "react";
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
import "./CatalogGalleryPage.css";

/**
 * Pixel-match gallery for root Figma catalog / dropdown PNGs.
 * Not a production CBS workflow screen — design QA surface.
 */
export function CatalogGalleryPage() {
  const [selectDemo, setSelectDemo] = useState("");
  const [account, setAccount] = useState("");

  return (
    <div className="cgal">
      <header className="cgal-head">
        <div>
          <h1>Catalogs &amp; Dropdowns</h1>
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
        {CATALOG_REGISTRY.map((cat) => (
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
