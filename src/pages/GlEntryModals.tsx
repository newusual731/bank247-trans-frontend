import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { reversePosting } from "../api/ledger";
import { createLedgerPosting, getLedgerPosting, newPostingReference, type LedgerTransactionType } from "../api/postings";
import { ApiError } from "../lib/apiClient";
import "./GlEntryModals.css";

type Line = {
  type: "Debit" | "Credit";
  gl: string;
  description: string;
  amount: string;
  currency: string;
};

const EMPTY_LINES: Line[] = [
  { type: "Debit", gl: "", description: "", amount: "", currency: "NGN" },
  { type: "Credit", gl: "", description: "", amount: "", currency: "NGN" },
];

function refPrefixForType(transactionType: LedgerTransactionType): string {
  if (transactionType === "SPECIAL_ENTRY") return "SE";
  if (transactionType === "PNL_ENTRY") return "PL";
  if (transactionType === "ADJUSTMENT") return "ADJ";
  return "JN";
}

export function AddEntryModal({
  onClose,
  onPosted,
  transactionType = "MANUAL_JOURNAL",
}: {
  onClose: () => void;
  onPosted?: (reference?: string) => void;
  transactionType?: LedgerTransactionType;
}) {
  const refPrefix = refPrefixForType(transactionType);
  const [txnCode, setTxnCode] = useState("");
  const [postingDate, setPostingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState(() => newPostingReference(refPrefix));
  const [currency, setCurrency] = useState("NGN");
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<Line[]>(EMPTY_LINES);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function parseAmount(raw: string): string {
    const n = raw.replace(/[^0-9.]/g, "");
    if (!n) throw new Error("Enter a valid amount on each line");
    return n;
  }

  function resolveAccount(raw: string): string {
    const trimmed = raw.trim();
    // "Vault-11101" → prefer trailing account token if present
    const parts = trimmed.split(/[-–]/);
    const candidate = parts.length > 1 ? parts[parts.length - 1].trim() : trimmed;
    const acct = candidate || trimmed;
    if (!/^[A-Za-z0-9_.:-]{2,30}$/.test(acct)) {
      throw new Error(`Invalid ledger account: ${raw}`);
    }
    return acct;
  }

  async function submitPost() {
    setBusy(true);
    setError(null);
    try {
      const legs = lines.map((line) => ({
        accountNumber: resolveAccount(line.gl),
        direction: (line.type === "Debit" ? "DEBIT" : "CREDIT") as "DEBIT" | "CREDIT",
        amount: parseAmount(line.amount),
      }));
      const debit = legs.filter((l) => l.direction === "DEBIT").reduce((s, l) => s + Number(l.amount), 0);
      const credit = legs.filter((l) => l.direction === "CREDIT").reduce((s, l) => s + Number(l.amount), 0);
      if (Math.abs(debit - credit) > 0.0001) {
        throw new Error("Debit and Credit must match before posting");
      }
      if (legs.length < 2) throw new Error("At least two legs are required");
      const ref = (reference.trim() || newPostingReference(refPrefix)).slice(0, 80);
      const res = await createLedgerPosting({
        transactionReference: ref,
        transactionType,
        currency: (currency || "NGN").slice(0, 3).toUpperCase(),
        legs,
        narration: description.trim() || txnCode || undefined,
      });
      onPosted?.(res.transactionReference ?? ref);
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Posting failed");
    } finally {
      setBusy(false);
    }
  }

  const addLine = () => {
    setLines((prev) => [...prev, { type: "Debit", gl: "", description: "", amount: "", currency: currency || "NGN" }]);
  };

  const addFiles = (list: FileList | File[] | null) => {
    if (!list) return;
    const next = Array.from(list);
    if (!next.length) return;
    setFiles((prev) => {
      const names = new Set(prev.map((f) => `${f.name}:${f.size}`));
      const merged = [...prev];
      for (const f of next) {
        const key = `${f.name}:${f.size}`;
        if (!names.has(key)) {
          names.add(key);
          merged.push(f);
        }
      }
      return merged;
    });
  };

  const onBrowseChange = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    e.target.value = "";
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="gem-backdrop" role="presentation" onClick={onClose}>
      <div className="gem-modal gem-modal--wide" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>NEW ENTRY</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        {error ? <p role="alert">{error}</p> : null}

        <div className="gem-grid">
          <label>
            <span>Transaction Code</span>
            <input
              type="text"
              placeholder="Optional"
              value={txnCode}
              onChange={(e) => setTxnCode(e.target.value)}
            />
          </label>
          <label>
            <span>Posting Date</span>
            <input type="date" value={postingDate} onChange={(e) => setPostingDate(e.target.value)} />
          </label>
          <label>
            <span>Reference</span>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Auto-generated"
            />
          </label>
          <label>
            <span>Currency</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="">Select</option>
              <option value="NGN">NGN</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </label>
        </div>

        <label className="gem-desc">
          <span>Description</span>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <div className="gem-lines-wrap">
          <table className="gem-lines">
            <thead>
              <tr>
                <th>Type</th>
                <th>GL Account</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Currency</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i}>
                  <td>
                    <select
                      value={line.type}
                      onChange={(e) => {
                        const next = [...lines];
                        next[i] = { ...line, type: e.target.value as Line["type"] };
                        setLines(next);
                      }}
                    >
                      <option>Debit</option>
                      <option>Credit</option>
                    </select>
                  </td>
                  <td>
                    <input
                      placeholder="Ledger account"
                      value={line.gl}
                      onChange={(e) => {
                        const next = [...lines];
                        next[i] = { ...line, gl: e.target.value };
                        setLines(next);
                      }}
                    />
                  </td>
                  <td>
                    <input
                      placeholder="Description"
                      value={line.description}
                      onChange={(e) => {
                        const next = [...lines];
                        next[i] = { ...line, description: e.target.value };
                        setLines(next);
                      }}
                    />
                  </td>
                  <td>
                    <input
                      placeholder="0.00"
                      value={line.amount}
                      onChange={(e) => {
                        const next = [...lines];
                        next[i] = { ...line, amount: e.target.value };
                        setLines(next);
                      }}
                    />
                  </td>
                  <td>
                    <input
                      value={line.currency}
                      onChange={(e) => {
                        const next = [...lines];
                        next[i] = { ...line, currency: e.target.value };
                        setLines(next);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="gem-add-line" onClick={addLine}>
            + Add Line
          </button>
        </div>

        <div
          className={`gem-drop${dragging ? " is-dragging" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={onDragOver}
          onDragEnter={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.csv"
            className="gem-drop-input"
            onChange={onBrowseChange}
            onClick={(e) => e.stopPropagation()}
          />
          <UploadIcon />
          <span>Drag and drop files here or click to browse</span>
          {files.length > 0 ? (
            <ul className="gem-drop-files" onClick={(e) => e.stopPropagation()}>
              {files.map((f, i) => (
                <li key={`${f.name}-${f.size}-${i}`}>
                  <span>{f.name}</span>
                  <button type="button" aria-label={`Remove ${f.name}`} onClick={() => removeFile(i)}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <p className="gem-warn">
          <span aria-hidden>⚠</span> Debit and Credit must match before posting
        </p>

        <footer>
          <button type="button" className="gem-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="gem-outline"
            disabled={busy}
            onClick={() => void submitPost()}
          >
            {busy ? "Posting…" : "Post"}
          </button>
          <button
            type="button"
            className="gem-primary"
            disabled={busy}
            onClick={() => void submitPost()}
          >
            {busy ? "Posting…" : "Post & Close"}
          </button>
        </footer>
      </div>
    </div>
  );
}

export function ReverseEntryModal({
  onClose,
  onSaved,
  entryReference = "",
}: {
  onClose: () => void;
  onSaved?: () => void;
  entryReference?: string;
}) {
  const [reason, setReason] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("2025-06-15");
  const [reference, setReference] = useState(entryReference);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitReverse() {
    const ref = reference.trim();
    if (!ref) {
      setError("Enter the posting reference to reverse");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      try { await getLedgerPosting(reference.trim()); } catch { /* optional */ }
      await reversePosting(ref);
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Reverse failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gem-backdrop" role="presentation" onClick={onClose}>
      <div className="gem-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>REVERSE JOURNAL ENTRY</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        {error ? <p role="alert">{error}</p> : null}
        <label className="gem-field">
          <span>Posting Reference</span>
          <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Ledger posting reference" />
        </label>
        <dl className="gem-kv">
          <div>
            <dt>Entry ID</dt>
            <dd>{reference || "T-code T0004- Deposit"}</dd>
          </div>
          <div>
            <dt>Original Description</dt>
            <dd>Cash deposit into vault</dd>
          </div>
          <div>
            <dt>Amount</dt>
            <dd>₦500,000.00</dd>
          </div>
          <div>
            <dt>
              Debit <em>Vault</em>
            </dt>
            <dd>₦500,000.00</dd>
          </div>
          <div>
            <dt>
              Credit <em>Customer</em>
            </dt>
            <dd>₦500,000.00</dd>
          </div>
        </dl>

        <label className="gem-desc">
          <span>Reason For Reversal</span>
          <textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>

        <label className="gem-field">
          <span>Effective Date</span>
          <input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
        </label>

        <footer className="gem-footer-center">
          <button type="button" className="gem-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="gem-primary"
            disabled={busy}
            onClick={() => void submitReverse()}
          >
            {busy ? "Reversing…" : "Reverse"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 16V6M12 6l-4 4M12 6l4 4M5 18h14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
