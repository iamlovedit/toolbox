import { useAppShell } from "@/contexts/AppShellContext";

export function LanguageSwitch(): JSX.Element {
  const { language, setLanguage, t } = useAppShell();

  return (
    <div className="lang-switch" role="group" aria-label={t("app.language")}>
      <span className="lang-switch__label">{t("app.language")}</span>
      <div className="lang-switch__buttons">
        <button
          className={`lang-switch__button ${language === "en" ? "is-active" : ""}`.trim()}
          type="button"
          onClick={() => setLanguage("en")}
        >
          {t("app.languageEnglish")}
        </button>
        <button
          className={`lang-switch__button ${language === "zh" ? "is-active" : ""}`.trim()}
          type="button"
          onClick={() => setLanguage("zh")}
        >
          {t("app.languageChinese")}
        </button>
      </div>
    </div>
  );
}
