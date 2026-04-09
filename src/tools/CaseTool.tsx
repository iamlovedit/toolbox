import { useMemo, useState } from "react";
import { useAppShell } from "@/contexts/AppShellContext";
import { getStatusClassName } from "@/tools/helpers";
import { computeCaseVariants } from "@/utils/textCase";
import type { StatusTone, ToolDefinition } from "@/types";

const VARIANT_KEYS = [
  "camel",
  "pascal",
  "snake",
  "kebab",
  "upperSnake",
  "dotCase",
  "pathCase",
  "titleCase",
  "lowerCase",
  "upperCase",
] as const;

type VariantKey = (typeof VARIANT_KEYS)[number];

const copy = {
  en: {
    name: "Case Convert",
    description:
      "Convert between camelCase, snake_case, kebab-case and other naming conventions.",
    hint: "Type or paste text to see all case variants live.",
    input: "Input",
    inputLabel: "Source Text",
    inputPlaceholder: "e.g. getHTTPResponseCode",
    output: "Variants",
    clear: "Clear",
    copy: "Copy",
    cleared: "Input cleared.",
    copied(label: string) {
      return `${label} copied.`;
    },
    initialStatus: "Enter text to see all case conversions.",
    converted(count: number) {
      return `${count} variant${count === 1 ? "" : "s"} generated.`;
    },
    variantLabels: {
      camel: "camelCase",
      pascal: "PascalCase",
      snake: "snake_case",
      kebab: "kebab-case",
      upperSnake: "UPPER_SNAKE",
      dotCase: "dot.case",
      pathCase: "path/case",
      titleCase: "Title Case",
      lowerCase: "lower case",
      upperCase: "UPPER CASE",
    } satisfies Record<VariantKey, string>,
  },
  zh: {
    name: "大小写转换",
    description: "在 camelCase、snake_case、kebab-case 等命名风格间互转。",
    hint: "输入文本后实时查看所有大小写变体。",
    input: "输入",
    inputLabel: "源文本",
    inputPlaceholder: "例如 getHTTPResponseCode",
    output: "变体",
    clear: "清空",
    copy: "复制",
    cleared: "输入已清空。",
    copied(label: string) {
      return `${label} 已复制。`;
    },
    initialStatus: "输入文本以查看所有大小写转换结果。",
    converted(count: number) {
      return `已生成 ${count} 个变体。`;
    },
    variantLabels: {
      camel: "camelCase",
      pascal: "PascalCase",
      snake: "snake_case",
      kebab: "kebab-case",
      upperSnake: "UPPER_SNAKE",
      dotCase: "dot.case",
      pathCase: "path/case",
      titleCase: "Title Case",
      lowerCase: "lower case",
      upperCase: "UPPER CASE",
    } satisfies Record<VariantKey, string>,
  },
} as const;

function CaseToolComponent(): JSX.Element {
  const { language, copyText, setCommandHint } = useAppShell();
  const text = copy[language];

  const [input, setInput] = useState("");

  const variants = useMemo(() => computeCaseVariants(input), [input]);

  const hasOutput = input.trim().length > 0;
  const status: string = hasOutput
    ? text.converted(VARIANT_KEYS.length)
    : text.initialStatus;
  const statusTone: StatusTone = hasOutput ? "success" : "info";

  return (
    <div className="stack-grid">
      <section className="panel panel-block">
        <div className="panel__header">
          <h3 className="panel__title">{text.input}</h3>
          <div className="panel__meta">SOURCE</div>
        </div>
        <label className="field">
          <span>{text.inputLabel}</span>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={text.inputPlaceholder}
          />
        </label>
        <div className="action-row">
          <button
            className="button"
            type="button"
            onClick={() => {
              setInput("");
              setCommandHint(text.cleared);
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
            {hasOutput ? `${VARIANT_KEYS.length} FORMATS` : "--"}
          </div>
        </div>
        <div className="kv-grid">
          {VARIANT_KEYS.map((key) => {
            const label = text.variantLabels[key];
            const value = variants[key];
            return (
              <div className="kv" key={key}>
                <span>{label}</span>
                <strong>{value || "--"}</strong>
                <button
                  className="button kv__copy-button"
                  type="button"
                  onClick={() => copyText(value, text.copied(label))}
                >
                  {text.copy}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export const caseTool: ToolDefinition = {
  id: "case",
  groupKey: "text",
  name: { en: copy.en.name, zh: copy.zh.name },
  badge: "CASE",
  description: { en: copy.en.description, zh: copy.zh.description },
  hint: { en: copy.en.hint, zh: copy.zh.hint },
  component: CaseToolComponent,
};
