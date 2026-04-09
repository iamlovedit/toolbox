import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  DialogMessage,
  DialogTone,
  Language,
  LocalizedText,
  MetricName,
  ToastMessage,
  ToastTone,
} from "@/types";
import {
  detectInitialLanguage,
  metricForLanguage,
  persistLanguage,
  pickLocalizedText,
  translate,
} from "@/i18n";
import { copyTextToClipboard } from "@/utils/browser";

interface AppShellContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (path: string, vars?: Record<string, string | number>) => string;
  metric: (name: MetricName, count: number) => string;
  pickText: (value: LocalizedText) => string;
  commandHint: string;
  setCommandHint: (message: string) => void;
  toasts: ToastMessage[];
  showToast: (message: string, tone?: ToastTone) => void;
  dialog: DialogMessage | null;
  showDialog: (
    message: string,
    options?: {
      title?: string;
      confirmLabel?: string;
      tone?: DialogTone;
      focusTarget?: HTMLElement | null;
    },
  ) => void;
  showRequiredFieldDialog: (
    fieldLabel: string,
    focusTarget?: HTMLElement | null,
  ) => void;
  hideDialog: () => void;
  copyText: (text: string, successMessage?: string) => Promise<void>;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function AppShellProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const [language, setLanguageState] = useState<Language>(
    detectInitialLanguage,
  );
  const [commandHint, setCommandHint] = useState("");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [dialog, setDialog] = useState<DialogMessage | null>(null);
  const timersRef = useRef(new Map<number, number>());
  const dialogFocusTargetRef = useRef<HTMLElement | null>(null);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(persistLanguage(nextLanguage));
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      timersRef.current.clear();
    };
  }, []);

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) =>
      translate(language, path, vars ?? {}),
    [language],
  );

  const metric = useCallback(
    (name: MetricName, count: number) =>
      metricForLanguage(language, name, count),
    [language],
  );

  const pickText = useCallback(
    (value: LocalizedText) => pickLocalizedText(language, value),
    [language],
  );

  const showToast = useCallback((message: string, tone: ToastTone = "info") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, message, tone }]);
    const timerId = window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
      timersRef.current.delete(id);
    }, 2600);
    timersRef.current.set(id, timerId);
  }, []);

  const hideDialog = useCallback(() => {
    const focusTarget = dialogFocusTargetRef.current;
    dialogFocusTargetRef.current = null;
    setDialog(null);

    if (focusTarget) {
      window.setTimeout(() => {
        focusTarget.focus();
      }, 0);
    }
  }, []);

  const showDialog = useCallback(
    (
      message: string,
      options?: {
        title?: string;
        confirmLabel?: string;
        tone?: DialogTone;
        focusTarget?: HTMLElement | null;
      },
    ) => {
      dialogFocusTargetRef.current = options?.focusTarget ?? null;
      setDialog({
        title: options?.title ?? t("common.missingInputTitle"),
        message,
        confirmLabel: options?.confirmLabel ?? t("common.dialogConfirm"),
        tone: options?.tone ?? "error",
      });
    },
    [t],
  );

  const showRequiredFieldDialog = useCallback(
    (fieldLabel: string, focusTarget?: HTMLElement | null) => {
      showDialog(t("common.requiredField", { field: fieldLabel }), {
        title: t("common.missingInputTitle"),
        confirmLabel: t("common.dialogConfirm"),
        tone: "error",
        focusTarget,
      });
    },
    [showDialog, t],
  );

  const copyText = useCallback(
    async (text: string, successMessage?: string) => {
      if (!text.trim()) {
        showToast(t("common.nothingToCopy"), "error");
        return;
      }

      try {
        await copyTextToClipboard(text);
        showToast(successMessage ?? t("common.copied"), "success");
      } catch {
        showToast(successMessage ?? t("common.copied"), "success");
      }
    },
    [showToast, t],
  );

  const value = useMemo<AppShellContextValue>(
    () => ({
      language,
      setLanguage,
      t,
      metric,
      pickText,
      commandHint,
      setCommandHint,
      toasts,
      showToast,
      dialog,
      showDialog,
      showRequiredFieldDialog,
      hideDialog,
      copyText,
    }),
    [
      commandHint,
      copyText,
      dialog,
      hideDialog,
      language,
      metric,
      pickText,
      setLanguage,
      t,
      toasts,
      showDialog,
      showRequiredFieldDialog,
      showToast,
    ],
  );

  return (
    <AppShellContext.Provider value={value}>
      {children}
    </AppShellContext.Provider>
  );
}

export function useAppShell(): AppShellContextValue {
  const value = useContext(AppShellContext);
  if (!value) {
    throw new Error("useAppShell must be used within AppShellProvider.");
  }

  return value;
}
