import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import "./FilterDropdown.css";

export type FilterDropdownOption = string;

type FilterDropdownProps = {
  /** Trigger button contents (label + optional icon live outside or inside). */
  trigger: ReactNode;
  options: readonly FilterDropdownOption[];
  value?: string;
  onSelect: (value: string) => void;
  /** Multi-select with leading checkmarks (FILTER DROP DOWN-3/4). */
  checked?: boolean;
  selectedValues?: readonly string[];
  onToggle?: (value: string) => void;
  /** Text alignment inside menu rows. */
  align?: "left" | "center";
  /** Peach hover/active row (Referend drop down). */
  highlight?: boolean;
  /** Menu opens aligned to trigger start or end. */
  menuAlign?: "start" | "end";
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  "aria-label"?: string;
};

export function FilterDropdown({
  trigger,
  options,
  value,
  onSelect,
  checked = false,
  selectedValues = [],
  onToggle,
  align = "left",
  highlight = false,
  menuAlign = "start",
  className = "",
  triggerClassName = "",
  menuClassName = "",
  "aria-label": ariaLabel = "Open menu",
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={`fdrop ${className}`.trim()} ref={rootRef}>
      <button
        type="button"
        className={`fdrop-trigger ${triggerClassName}`.trim()}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
      >
        {trigger}
      </button>

      {open ? (
        <ul
          id={menuId}
          role="listbox"
          className={[
            "fdrop-menu",
            align === "center" ? "is-center" : "is-left",
            menuAlign === "end" ? "is-end" : "",
            highlight ? "is-highlight" : "",
            checked ? "is-checked" : "",
            menuClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {options.map((opt, i) => {
            const isSelected = checked
              ? selectedValues.includes(opt)
              : value === opt;
            return (
              <li key={`${opt}-${i}`} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  className={`fdrop-item${isSelected ? " is-active" : ""}`}
                  onClick={() => {
                    if (checked && onToggle) {
                      onToggle(opt);
                      return;
                    }
                    onSelect(opt);
                    setOpen(false);
                  }}
                >
                  {checked ? (
                    <span className="fdrop-check" aria-hidden>
                      {isSelected ? "✓" : ""}
                    </span>
                  ) : null}
                  <span>{opt}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
