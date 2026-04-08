import { useEffect, useId, useRef } from "react";
import { useAppShell } from "@/contexts/AppShellContext";

export function CyberDialog(): JSX.Element | null {
  const { dialog, hideDialog, t } = useAppShell();
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    if (!dialog) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    confirmButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      hideDialog();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dialog, hideDialog]);

  if (!dialog) {
    return null;
  }

  return (
    <div
      className="cyber-dialog-backdrop"
      data-testid="cyber-dialog-backdrop"
      onClick={hideDialog}
    >
      <div
        className={`cyber-dialog cyber-dialog--${dialog.tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cyber-dialog__chrome" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="cyber-dialog__eyebrow">{t("common.dialogEyebrow")}</div>
        <h2 id={titleId} className="cyber-dialog__title">
          {dialog.title}
        </h2>
        <p id={messageId} className="cyber-dialog__message">
          {dialog.message}
        </p>
        <div className="cyber-dialog__actions">
          <button
            ref={confirmButtonRef}
            className="button button--hot cyber-dialog__button"
            type="button"
            onClick={hideDialog}
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
