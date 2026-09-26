import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import "./FormSelect.css";

export function FormkitChevron({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`fsel-chevron ${className}`.trim()}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type FormSelectProps = {
  label?: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder?: string;
  highlight?: boolean;
  "aria-label"?: string;
};

/** Closed field + open menu matching Figma catalog popovers + formkit_down chevron. */
export function FormSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "Select",
  highlight = false,
  "aria-label": ariaLabel,
}: FormSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <label className="fsel">
      {label ? <span className="fsel-label">{label}</span> : null}
      <div className="fsel-wrap" ref={ref}>
        <button
          type="button"
          className="fsel-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={ariaLabel ?? label ?? placeholder}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={!value ? "is-placeholder" : undefined}>{value || placeholder}</span>
          <FormkitChevron />
        </button>
        {open ? (
          <ul
            id={menuId}
            role="listbox"
            className={`fsel-menu${highlight ? " is-highlight" : ""}`}
          >
            {options.map((opt, i) => (
              <li key={`${opt}-${i}`} role="option" aria-selected={value === opt}>
                <button
                  type="button"
                  className={`fsel-item${value === opt ? " is-active" : ""}`}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                >
                  {opt}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </label>
  );
}

export function CatalogMenuPreview({
  options,
  highlight,
  checked,
  selected,
}: {
  options: readonly string[];
  highlight?: boolean;
  checked?: boolean;
  selected?: string;
}) {
  return (
    <ul
      className={[
        "fsel-menu",
        "is-static",
        highlight ? "is-highlight" : "",
        checked ? "is-checked" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="listbox"
    >
      {options.map((opt, i) => {
        const active = selected ? selected === opt : i === 0 && highlight;
        return (
          <li key={`${opt}-${i}`} role="option" aria-selected={!!active}>
            <div className={`fsel-item${active ? " is-active" : ""}`}>
              {checked ? <span className="fsel-check">{active ? "✓" : ""}</span> : null}
              <span>{opt}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function AccountSearchDropdown({
  options,
  value,
  onSelect,
}: {
  options: readonly string[];
  value?: string;
  onSelect: (v: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(true);
  const filtered = options.filter((o) => !query || o.includes(query.trim()));

  return (
    <div className="asrch">
      <label className="asrch-field">
        <input
          type="search"
          placeholder="Search Account No."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        <SearchIcon />
      </label>
      {open ? (
        <ul className="asrch-list" role="listbox">
          {filtered.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                className={value === opt ? "is-active" : undefined}
                onClick={() => onSelect(opt)}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function MonthDatePicker() {
  const month = "January";
  const year = "2023";
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const trailing = Array.from({ length: 11 }, (_, i) => i + 1);
  const weekdays = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  // January 2023 starts on Sunday — index 0
  const startPad = 0;

  return (
    <div className="mdp">
      <header className="mdp-head">
        <button type="button" aria-label="Previous month">
          ‹
        </button>
        <div className="mdp-selectors">
          <button type="button">
            {month} <FormkitChevron />
          </button>
          <button type="button">
            {year} <FormkitChevron />
          </button>
        </div>
        <button type="button" aria-label="Next month">
          ›
        </button>
      </header>
      <div className="mdp-week">
        {weekdays.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="mdp-grid">
        {Array.from({ length: startPad }).map((_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {days.map((d) => {
          const dow = (startPad + d - 1) % 7;
          const weekend = dow === 0 || dow === 6;
          return (
            <button key={d} type="button" className={weekend ? "is-muted" : undefined}>
              {d}
            </button>
          );
        })}
        {trailing.map((d) => (
          <button key={`t-${d}`} type="button" className="is-muted">
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CatalogTabs({ tabs }: { tabs: readonly string[] }) {
  const [active, setActive] = useState(tabs[0]);
  return (
    <nav className="ctabs-sample" aria-label="Sample tabs">
      {tabs.map((t) => (
        <button
          key={t}
          type="button"
          className={active === t ? "is-active" : undefined}
          onClick={() => setActive(t)}
        >
          {t}
        </button>
      ))}
    </nav>
  );
}

export function GradientDivider() {
  return <div className="cat-divider" aria-hidden />;
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="fsel-field-label">{children}</span>;
}
