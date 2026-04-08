import { useState } from "react";
import { useAppShell } from "@/contexts/AppShellContext";
import { getStatusClassName } from "@/tools/helpers";
import type { PasswordOptions } from "@/utils/password";
import {
  describePasswordProfile,
  generatePassword,
} from "@/utils/password";
import type { StatusTone, ToolDefinition } from "@/types";

const copy = {
  en: {
    name: "Password Mint",
    description:
      "Generate strong local passwords with controllable length and character sets.",
    hint: "Tune the profile, then mint a password locally with Web Crypto.",
    generator: "Generator",
    profileMeta: "Web Crypto",
    length: "Length",
    options: "Character Profile",
    uppercase: "Uppercase",
    lowercase: "Lowercase",
    numbers: "Numbers",
    symbols: "Symbols",
    excludeAmbiguous: "Exclude Ambiguous",
    uppercaseMeta: "A-Z",
    lowercaseMeta: "a-z",
    numbersMeta: "0-9",
    symbolsMeta: "!@#",
    ambiguousMeta: "0 O o 1 l I",
    generate: "Generate",
    copy: "Copy Password",
    clear: "Clear",
    output: "Output",
    generatedPassword: "Generated Password",
    outputPlaceholder: "Generated password appears here...",
    initialStatus:
      "Password generation happens locally in the browser. No secrets leave the page.",
    generatedStatus: "Password generated successfully.",
    generatedHint: "Fresh password generated locally.",
    copied: "Password copied.",
    clearedStatus: "Password output cleared.",
    clearedHint: "Password workspace cleared. Awaiting generation.",
    noGroups: "Select at least one character group.",
    shortLength: "Length is too short for the selected character groups.",
    failedStatus: "Password generation failed.",
    failedToast: "Password generation failed.",
    selectedSets: "Selected Sets",
    ambiguityMode: "Ambiguity Mode",
    filtered: "Filtered",
    standard: "Standard",
  },
  zh: {
    name: "密码铸造台",
    description: "在本地生成高强度密码，并可控制长度与字符组合。",
    hint: "调整密码配置，然后用 Web Crypto 在本地铸造密码。",
    generator: "生成器",
    profileMeta: "Web Crypto",
    length: "长度",
    options: "字符配置",
    uppercase: "大写字母",
    lowercase: "小写字母",
    numbers: "数字",
    symbols: "符号",
    excludeAmbiguous: "排除易混字符",
    uppercaseMeta: "A-Z",
    lowercaseMeta: "a-z",
    numbersMeta: "0-9",
    symbolsMeta: "!@#",
    ambiguousMeta: "0 O o 1 l I",
    generate: "生成",
    copy: "复制密码",
    clear: "清空",
    output: "输出",
    generatedPassword: "生成的密码",
    outputPlaceholder: "生成的密码会显示在这里...",
    initialStatus:
      "密码只在浏览器本地生成，不会离开当前页面。",
    generatedStatus: "密码生成成功。",
    generatedHint: "已在本地生成新密码。",
    copied: "密码已复制。",
    clearedStatus: "密码输出已清空。",
    clearedHint: "密码工作区已清空，等待生成。",
    noGroups: "至少选择一类字符。",
    shortLength: "当前长度不足以覆盖已选择的字符组。",
    failedStatus: "密码生成失败。",
    failedToast: "密码生成失败。",
    selectedSets: "已选字符组",
    ambiguityMode: "混淆处理",
    filtered: "已过滤",
    standard: "标准",
  },
} as const;

function localizePasswordError(
  message: string | undefined,
  text: (typeof copy)["en"] | (typeof copy)["zh"],
): string {
  switch (message) {
    case "Select at least one character group.":
      return text.noGroups;
    case "Length is too short for the selected character groups.":
      return text.shortLength;
    default:
      return message ?? text.failedStatus;
  }
}

function PasswordToolComponent(): JSX.Element {
  const { language, metric, setCommandHint, showToast, copyText } = useAppShell();
  const text = copy[language];
  const [options, setOptions] = useState<PasswordOptions>({
    length: 20,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false,
  });
  const [lengthInput, setLengthInput] = useState("20");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string>(text.initialStatus);
  const [statusTone, setStatusTone] = useState<StatusTone>("info");

  const profile = describePasswordProfile(options);

  const toggleOption = (key: keyof Omit<PasswordOptions, "length">) => {
    setOptions((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const commitLengthInput = () => {
    const nextLength = Math.max(
      4,
      Math.min(64, Number(lengthInput) || options.length),
    );
    setOptions((current) => ({
      ...current,
      length: nextLength,
    }));
    setLengthInput(String(nextLength));
  };

  return (
    <div className="tool-grid">
      <section className="panel panel-block">
        <div className="panel__header">
          <h3 className="panel__title">{text.generator}</h3>
          <div className="panel__meta">{text.profileMeta}</div>
        </div>
        <label className="field">
          <span>{text.length}</span>
          <input
            type="number"
            min={4}
            max={64}
            value={lengthInput}
            onChange={(event) => {
              const nextValue = event.target.value;
              setLengthInput(nextValue);
              if (nextValue === "") {
                return;
              }

              const parsed = Number(nextValue);
              if (!Number.isNaN(parsed)) {
                setOptions((current) => ({
                  ...current,
                  length: Math.max(4, Math.min(64, parsed)),
                }));
              }
            }}
            onBlur={commitLengthInput}
          />
        </label>
        <div className="panel__meta password-options__label">{text.options}</div>
        <div className="password-options">
          <button
            className={`password-toggle ${options.uppercase ? "is-active" : ""}`.trim()}
            type="button"
            aria-pressed={options.uppercase}
            onClick={() => toggleOption("uppercase")}
          >
            <strong>{text.uppercase}</strong>
            <span>{text.uppercaseMeta}</span>
          </button>
          <button
            className={`password-toggle ${options.lowercase ? "is-active" : ""}`.trim()}
            type="button"
            aria-pressed={options.lowercase}
            onClick={() => toggleOption("lowercase")}
          >
            <strong>{text.lowercase}</strong>
            <span>{text.lowercaseMeta}</span>
          </button>
          <button
            className={`password-toggle ${options.numbers ? "is-active" : ""}`.trim()}
            type="button"
            aria-pressed={options.numbers}
            onClick={() => toggleOption("numbers")}
          >
            <strong>{text.numbers}</strong>
            <span>{text.numbersMeta}</span>
          </button>
          <button
            className={`password-toggle ${options.symbols ? "is-active" : ""}`.trim()}
            type="button"
            aria-pressed={options.symbols}
            onClick={() => toggleOption("symbols")}
          >
            <strong>{text.symbols}</strong>
            <span>{text.symbolsMeta}</span>
          </button>
          <button
            className={`password-toggle ${options.excludeAmbiguous ? "is-active" : ""}`.trim()}
            type="button"
            aria-pressed={options.excludeAmbiguous}
            onClick={() => toggleOption("excludeAmbiguous")}
          >
            <strong>{text.excludeAmbiguous}</strong>
            <span>{text.ambiguousMeta}</span>
          </button>
        </div>
        <div className="action-row">
          <button
            className="button button--primary"
            type="button"
            onClick={() => {
              try {
                const nextPassword = generatePassword(options);
                setPassword(nextPassword);
                setStatus(text.generatedStatus);
                setStatusTone("success");
                setCommandHint(text.generatedHint);
              } catch (error) {
                const message =
                  error instanceof Error ? error.message : text.failedStatus;
                setStatus(localizePasswordError(message, text));
                setStatusTone("error");
                showToast(text.failedToast, "error");
              }
            }}
          >
            {text.generate}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => copyText(password, text.copied)}
          >
            {text.copy}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => {
              setPassword("");
              setStatus(text.clearedStatus);
              setStatusTone("info");
              setCommandHint(text.clearedHint);
            }}
          >
            {text.clear}
          </button>
        </div>
        <div className={getStatusClassName(statusTone)}>{status}</div>
      </section>

      <section className="panel panel-block">
        <div className="panel__header">
          <h3 className="panel__title">{text.output}</h3>
          <div className="panel__meta">{metric("chars", password.length)}</div>
        </div>
        <label className="field">
          <span>{text.generatedPassword}</span>
          <textarea
            readOnly
            value={password}
            placeholder={text.outputPlaceholder}
          />
        </label>
        <div className="kv-grid">
          <div className="kv">
            <span>{text.length}</span>
            <strong>{password.length || "--"}</strong>
          </div>
          <div className="kv">
            <span>{text.selectedSets}</span>
            <strong>{profile.length > 0 ? profile.join(" / ") : "--"}</strong>
          </div>
          <div className="kv">
            <span>{text.ambiguityMode}</span>
            <strong>{options.excludeAmbiguous ? text.filtered : text.standard}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

export const passwordTool: ToolDefinition = {
  id: "password",
  groupKey: "text",
  name: { en: copy.en.name, zh: copy.zh.name },
  badge: "PASS",
  description: { en: copy.en.description, zh: copy.zh.description },
  hint: { en: copy.en.hint, zh: copy.zh.hint },
  component: PasswordToolComponent,
};
