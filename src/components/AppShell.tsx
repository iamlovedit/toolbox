import { useEffect, useMemo, useState } from "react";
import type { ToolDefinition } from "@/types";
import { useAppShell } from "@/contexts/AppShellContext";
import { CyberDialog } from "@/components/CyberDialog";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { ToastStack } from "@/components/ToastStack";
import { ToolNav } from "@/components/ToolNav";
import { tools } from "@/tools/registry";

export function AppShell({
  activeTool,
}: {
  activeTool: ToolDefinition;
}): JSX.Element {
  const { language, metric, pickText, t, commandHint, setCommandHint } =
    useAppShell();
  const ActiveToolComponent = activeTool.component;
  const [clockText, setClockText] = useState("");

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.title = t("app.documentTitle");
    setCommandHint(pickText(activeTool.hint));
  }, [activeTool, language, pickText, setCommandHint, t]);

  useEffect(() => {
    const locale = language === "zh" ? "zh-CN" : "en-GB";
    const updateClock = () => {
      setClockText(
        new Date().toLocaleTimeString(locale, {
          hour12: false,
        }),
      );
    };

    updateClock();
    const timerId = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timerId);
  }, [language]);

  const moduleCount = useMemo(() => metric("modules", tools.length), [metric]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__status">
          <span className="signal-dot"></span>
          <span>{t("app.localNode")}</span>
          <span className="divider"></span>
          <span>{moduleCount}</span>
        </div>
        <div className="topbar__title">{t("app.topbarTitle")}</div>
        <div className="topbar__actions">
          <LanguageSwitch />
          <div className="topbar__clock">{clockText || "--:--:--"}</div>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="brand panel">
            <div className="brand__kicker">{t("app.brandKicker")}</div>
            <h1>Neon Forge</h1>
            <p>{t("app.brandDescription")}</p>
          </div>

          <ToolNav tools={tools} activeToolId={activeTool.id} />

          <div className="sidebar__meta">
            <span className="meta-chip">{t("app.chipHtml")}</span>
            <span className="meta-chip">{t("app.chipJs")}</span>
            <span className="meta-chip">{t("app.chipBackend")}</span>
          </div>
        </aside>

        <main className="workspace">
          <section className="workspace__hero panel">
            <div className="hero__eyebrow">{t(`groups.${activeTool.groupKey}`)}</div>
            <div className="hero__header">
              <div className="hero__copy">
                <h2>{pickText(activeTool.name)}</h2>
                <p>{pickText(activeTool.description)}</p>
              </div>
              <div className="tool-badge">{activeTool.badge}</div>
            </div>
          </section>

          <section className="tool-stage">
            <ActiveToolComponent key={`${activeTool.id}:${language}`} />
          </section>

          <footer className="command-bar panel">
            <span className="command-bar__label">{t("app.systemMessage")}</span>
            <span>{commandHint || t("app.awaitingPayload")}</span>
          </footer>
        </main>
      </div>

      <ToastStack />
      <CyberDialog />
      <div className="screen-noise" aria-hidden="true"></div>
      <div className="scanlines" aria-hidden="true"></div>
    </div>
  );
}
