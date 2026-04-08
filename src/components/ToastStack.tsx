import { useAppShell } from "@/contexts/AppShellContext";

export function ToastStack(): JSX.Element {
  const { toasts } = useAppShell();

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast ${toast.tone === "success" ? "toast--success" : ""} ${toast.tone === "error" ? "toast--error" : ""}`.trim()}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
