import { useEffect, useState } from "react";
import { AppAlert } from "./AppAlert";
import { SuccessModal } from "./SuccessModal";

type Toast = { title: string; message: string };

/** Shared MVP success modal + toast for form/table actions. */
export function useActionFeedback() {
  const [toast, setToast] = useState<Toast | null>(null);
  const [success, setSuccess] = useState<{ title?: string; message: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const showToast = (title: string, message: string) => setToast({ title, message });
  const showSuccess = (message: string, title = "Successfull") => setSuccess({ title, message });

  const feedbackUi = (
    <>
      {toast ? (
        <AppAlert tone="success" title={toast.title} message={toast.message} onClose={() => setToast(null)} />
      ) : null}
      {success ? (
        <SuccessModal
          title={success.title}
          message={success.message}
          onOkay={() => {
            setSuccess(null);
            showToast("Success", success.message);
          }}
        />
      ) : null}
    </>
  );

  return { showToast, showSuccess, feedbackUi };
}

export function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const escape = (c: string) => `"${c.replace(/"/g, '""')}"`;
  const body = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
