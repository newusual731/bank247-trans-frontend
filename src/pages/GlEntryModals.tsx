import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import "./GlEntryModals.css";

type Line = {
  type: "Debit" | "Credit";
  gl: string;
  description: string;
  amount: string;
  currency: string;
};

const DEFAULT_LINES: Line[] = [
  { type: "Debit", gl: "Vault-11101", description: "Customer fund", amount: "₦500,000.00", currency: "NGN" },
  { type: "Credit", gl: "Vault-11101", description: "Cash Deposit", amount: "₦500,000.00", currency: "NGN" },
  { type: "Debit", gl: "Vault-11101", description: "Customer fund", amount: "₦500,000.00", currency: "NGN" },
  { type: "Credit", gl: "Vault-11101", description: "Cash Deposit", amount: "₦500,000.00", currency: "NGN" },
];

export function AddEntryModal({
  onClose,
  onPosted,
}: {
  onClose: () => void;
  onPosted?: () => void;
}) {
  const [txnCode, setTxnCode] = useState("T0004-Deposit");
  const [postingDate, setPostingDate] = useState("2025-06-15");
  const [reference, setReference] = useState("TXN/LC/0023-LC Booking");
  const [currency, setCurrency] = useState("USD");
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<Line[]>(DEFAULT_LINES);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { type: "Debit", gl: "Vault-11101", description: "", amount: "₦0.00", currency: "NGN" },
    ]);
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

        <div className="gem-grid">
          <label>
            <span>Transaction Code</span>
            <select value={txnCode} onChange={(e) => setTxnCode(e.target.value)}>
              <option>T0004-Deposit</option>
              <option>T0005-Withdrawal</option>
              <option>T0006-Transfer</option>
            </select>
          </label>
          <label>
            <span>Posting Date</span>
            <input type="date" value={postingDate} onChange={(e) => setPostingDate(e.target.value)} />
          </label>
          <label>
            <span>Reference</span>
            <select value={reference} onChange={(e) => setReference(e.target.value)}>
              <option>TXN/LC/0023-LC Booking</option>
              <option>TXN/CASH/001</option>
              <option>TXN/GL/ADJ</option>
            </select>
          </label>
          <label>
            <span>Currency</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option>USD</option>
              <option>NGN</option>
              <option>EUR</option>
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
            onClick={() => {
              onPosted?.();
              onClose();
            }}
          >
            Post
          </button>
          <button
            type="button"
            className="gem-primary"
            onClick={() => {
              onPosted?.();
              onClose();
            }}
          >
            Save Draft
          </button>
        </footer>
      </div>
    </div>
  );
}

export function ReverseEntryModal({ onClose, onSaved }: { onClose: () => void; onSaved?: () => void }) {
  const [reason, setReason] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("2025-06-15");

  return (
    <div className="gem-backdrop" role="presentation" onClick={onClose}>
      <div className="gem-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>REVERSE JOURNAL ENTRY</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <dl className="gem-kv">
          <div>
            <dt>Entry ID</dt>
            <dd>T-code T0004- Deposit</dd>
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
            onClick={() => {
              onSaved?.();
              onClose();
            }}
          >
            Save Draft
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
