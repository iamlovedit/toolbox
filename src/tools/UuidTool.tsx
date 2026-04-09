import { useState } from "react";
import { useAppShell } from "@/contexts/AppShellContext";
import { getStatusClassName } from "@/tools/helpers";
import type { StatusTone, ToolDefinition } from "@/types";

type UuidLetterCase = "lowercase" | "uppercase";

const copy = {
  en: {
    name: "UUID Stream",
    description:
      "Emit UUID v4 sequences for test data, fixtures or quick identifiers.",
    hint: "Generate one or more UUID v4 values.",
    generator: "Generator",
    count: "Count",
    letterCase: "Letter Case",
    lowercase: "Lowercase",
    uppercase: "Uppercase",
    lowercaseMeta: "a-f",
    uppercaseMeta: "A-F",
    hyphenation: "Hyphens",
    withHyphens: "Include Hyphens",
    withoutHyphens: "Remove Hyphens",
    withHyphensMeta: "8-4-4-4-12",
    withoutHyphensMeta: "32 chars",
    generate: "Generate",
    copy: "Copy All",
    clear: "Clear",
    initialStatus: "Web Crypto randomUUID() is used for generation.",
    output: "Output",
    listLabel: "UUID List",
    outputPlaceholder: "Generated UUIDs appear here...",
    generated(count: number) {
      return `${count} UUID v4 value${count === 1 ? "" : "s"} emitted.`;
    },
    generatedHint(count: number) {
      return `Generated ${count} UUID v4 value${count === 1 ? "" : "s"}.`;
    },
    copied: "UUID list copied.",
    cleared: "UUID output cleared.",
  },
  zh: {
    name: "UUID 流",
    description: "批量生成 UUID v4，用于测试数据、夹具或临时标识符。",
    hint: "生成一个或多个 UUID v4 值。",
    generator: "生成器",
    count: "数量",
    letterCase: "字母大小写",
    lowercase: "小写",
    uppercase: "大写",
    lowercaseMeta: "a-f",
    uppercaseMeta: "A-F",
    hyphenation: "连接符",
    withHyphens: "包含连接符",
    withoutHyphens: "不含连接符",
    withHyphensMeta: "8-4-4-4-12",
    withoutHyphensMeta: "32 位",
    generate: "生成",
    copy: "全部复制",
    clear: "清空",
    initialStatus: "生成能力来自 Web Crypto 的 randomUUID()。",
    output: "输出",
    listLabel: "UUID 列表",
    outputPlaceholder: "生成的 UUID 会显示在这里...",
    generated(count: number) {
      return `已生成 ${count} 个 UUID v4。`;
    },
    generatedHint(count: number) {
      return `已生成 ${count} 个 UUID v4。`;
    },
    copied: "UUID 列表已复制。",
    cleared: "UUID 输出已清空。",
  },
} as const;

function clampUuidCount(value: number): number {
  return Math.max(1, Math.min(20, value));
}

function normalizeCountInput(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : clampUuidCount(parsed);
}

function formatUuid(
  value: string,
  letterCase: UuidLetterCase,
  includeHyphens: boolean,
): string {
  const normalizedValue = includeHyphens ? value : value.replace(/-/g, "");
  return letterCase === "uppercase"
    ? normalizedValue.toUpperCase()
    : normalizedValue.toLowerCase();
}

function UuidToolComponent(): JSX.Element {
  const { language, metric, setCommandHint, copyText } = useAppShell();
  const text = copy[language];
  const [count, setCount] = useState(1);
  const [countInput, setCountInput] = useState("1");
  const [letterCase, setLetterCase] = useState<UuidLetterCase>("lowercase");
  const [includeHyphens, setIncludeHyphens] = useState(true);
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<string>(text.initialStatus);
  const [statusTone, setStatusTone] = useState<StatusTone>("info");

  const commitCountInput = (): number => {
    const nextCount = normalizeCountInput(countInput, count);
    setCount(nextCount);
    setCountInput(String(nextCount));
    return nextCount;
  };

  return (
    <div className="tool-grid">
      <section className="panel panel-block">
        <div className="panel__header">
          <h3 className="panel__title">{text.generator}</h3>
          <div className="panel__meta">UUID</div>
        </div>
        <label className="field">
          <span>{text.count}</span>
          <input
            type="number"
            min={1}
            max={20}
            step={1}
            value={countInput}
            onChange={(event) => {
              const nextValue = event.target.value;
              setCountInput(nextValue);
              if (nextValue === "") {
                return;
              }

              setCount(normalizeCountInput(nextValue, count));
            }}
            onBlur={commitCountInput}
          />
        </label>
        <div className="panel__meta password-options__label">
          {text.letterCase}
        </div>
        <div className="password-options">
          <button
            className={`password-toggle ${letterCase === "lowercase" ? "is-active" : ""}`.trim()}
            type="button"
            aria-pressed={letterCase === "lowercase"}
            onClick={() => setLetterCase("lowercase")}
          >
            <strong>{text.lowercase}</strong>
            <span>{text.lowercaseMeta}</span>
          </button>
          <button
            className={`password-toggle ${letterCase === "uppercase" ? "is-active" : ""}`.trim()}
            type="button"
            aria-pressed={letterCase === "uppercase"}
            onClick={() => setLetterCase("uppercase")}
          >
            <strong>{text.uppercase}</strong>
            <span>{text.uppercaseMeta}</span>
          </button>
        </div>
        <div className="panel__meta password-options__label">
          {text.hyphenation}
        </div>
        <div className="password-options">
          <button
            className={`password-toggle ${includeHyphens ? "is-active" : ""}`.trim()}
            type="button"
            aria-pressed={includeHyphens}
            onClick={() => setIncludeHyphens(true)}
          >
            <strong>{text.withHyphens}</strong>
            <span>{text.withHyphensMeta}</span>
          </button>
          <button
            className={`password-toggle ${!includeHyphens ? "is-active" : ""}`.trim()}
            type="button"
            aria-pressed={!includeHyphens}
            onClick={() => setIncludeHyphens(false)}
          >
            <strong>{text.withoutHyphens}</strong>
            <span>{text.withoutHyphensMeta}</span>
          </button>
        </div>
        <div className="action-row">
          <button
            className="button button--primary"
            type="button"
            onClick={() => {
              const nextCount = commitCountInput();
              const nextOutput = Array.from({ length: nextCount }, () =>
                formatUuid(
                  window.crypto.randomUUID(),
                  letterCase,
                  includeHyphens,
                ),
              ).join("\n");
              setOutput(nextOutput);
              setStatus(text.generated(nextCount));
              setStatusTone("success");
              setCommandHint(text.generatedHint(nextCount));
            }}
          >
            {text.generate}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => copyText(output, text.copied)}
          >
            {text.copy}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => {
              setOutput("");
              setStatus(text.cleared);
              setStatusTone("info");
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
          <div className="panel__meta">
            {output
              ? metric("lines", output.split("\n").length)
              : metric("lines", 0)}
          </div>
        </div>
        <label className="field">
          <span>{text.listLabel}</span>
          <textarea
            readOnly
            value={output}
            placeholder={text.outputPlaceholder}
          />
        </label>
      </section>
    </div>
  );
}

export const uuidTool: ToolDefinition = {
  id: "uuid",
  groupKey: "text",
  name: { en: copy.en.name, zh: copy.zh.name },
  badge: "UUID",
  description: { en: copy.en.description, zh: copy.zh.description },
  hint: { en: copy.en.hint, zh: copy.zh.hint },
  component: UuidToolComponent,
};
