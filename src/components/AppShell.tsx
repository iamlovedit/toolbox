import { useEffect, useState } from "react";
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
  const brandTitle = t("app.documentTitle");
  const toolName = pickText(activeTool.name);
  const toolDescription = pickText(activeTool.description);
  const groupLabel = t(`groups.${activeTool.groupKey}`);

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

  return (
    <div className="app-shell">
      <div className="hud-corner hud-corner--top-left" aria-hidden="true"></div>
      <div
        className="hud-corner hud-corner--top-right"
        aria-hidden="true"
      ></div>
      <div
        className="hud-corner hud-corner--bottom-left"
        aria-hidden="true"
      ></div>
      <div
        className="hud-corner hud-corner--bottom-right"
        aria-hidden="true"
      ></div>

      <header className="topbar">
        <div className="topbar__status">
          <span className="signal-dot" aria-hidden="true"></span>
          <span>{t("app.localNode")}</span>
          <span className="divider" aria-hidden="true"></span>
          <span>{metric("modules", tools.length)}</span>
        </div>
        <div className="topbar__titleblock">
          <div className="topbar__eyebrow">{t("app.brandKicker")}</div>
          <div className="topbar__title">{t("app.topbarTitle")}</div>
        </div>
        <div className="topbar__actions">
          <LanguageSwitch />
          <div className="topbar__clock">{clockText || "--:--:--"}</div>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="brand panel">
            <div className="brand__kicker">{t("app.brandKicker")}</div>
            <div className="brand__header">
              <h1 className="glitch-text" data-text={brandTitle}>
                {brandTitle}
              </h1>
              <span className="brand__status">{t("app.localNode")}</span>
            </div>
            <p>{t("app.brandDescription")}</p>
            <div className="sidebar__meta">
              <span className="meta-chip meta-chip--cool">
                {t("app.chipHtml")}
              </span>
              <span className="meta-chip meta-chip--neutral">
                {t("app.chipJs")}
              </span>
              <span className="meta-chip meta-chip--hot">
                {t("app.chipBackend")}
              </span>
            </div>
          </div>

          <ToolNav tools={tools} activeToolId={activeTool.id} />
        </aside>

        <main className="workspace">
          <section className="workspace__hero panel">
            <div className="hero__scanline" aria-hidden="true"></div>
            <div className="hero__eyebrow">{groupLabel}</div>
            <div className="hero__header">
              <div className="hero__copy">
                <h2
                  key={`${activeTool.id}:${language}:title`}
                  className="glitch-text glitch-text--hero"
                  data-text={toolName}
                >
                  {toolName}
                </h2>
                <p>{toolDescription}</p>
              </div>
              <div
                key={`${activeTool.id}:${language}:badge`}
                className="tool-badge"
                data-text={activeTool.badge}
              >
                {activeTool.badge}
              </div>
            </div>
            <div className="hero__stats">
              <span className="meta-chip meta-chip--cool">
                {metric("modules", tools.length)}
              </span>
              <span className="meta-chip meta-chip--neutral">
                {t("app.chipJs")}
              </span>
              <span className="meta-chip meta-chip--hot">
                {t("app.localNode")}
              </span>
            </div>
          </section>

          <section className="tool-stage">
            <ActiveToolComponent key={`${activeTool.id}:${language}`} />
          </section>

          <footer className="command-bar panel">
            <span className="command-bar__label">{t("app.systemMessage")}</span>
            <span className="command-bar__payload">
              {commandHint || t("app.awaitingPayload")}
            </span>
          </footer>
        </main>
      </div>

      <ToastStack />
      <CyberDialog />
      <div className="screen-noise" aria-hidden="true"></div>
      <div className="scanlines" aria-hidden="true"></div>
      <div className="scan-sweep" aria-hidden="true"></div>
    </div>
  );
}
