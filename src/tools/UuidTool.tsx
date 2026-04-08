import { useState } from "react";
import { useAppShell } from "@/contexts/AppShellContext";
import { getStatusClassName } from "@/tools/helpers";
import type { StatusTone, ToolDefinition } from "@/types";

const copy = {
  en: {
    name: "UUID Stream",
    description: "Emit UUID v4 sequences for test data, fixtures or quick identifiers.",
    hint: "Generate one or more UUID v4 values.",
    generator: "Generator",
    count: "Count",
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

function UuidToolComponent(): JSX.Element {
  const { language, metric, setCommandHint, copyText } = useAppShell();
  const text = copy[language];
  const [count, setCount] = useState(1);
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<string>(text.initialStatus);
  const [statusTone, setStatusTone] = useState<StatusTone>("info");

  return (
    <div className="tool-grid">
      <section className="panel panel-block">
        <div className="panel__header">
          <h3 className="panel__title">{text.generator}</h3>
          <div className="panel__meta">UUID v4</div>
        </div>
        <label className="field">
          <span>{text.count}</span>
          <select
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
          >
            <option value="1">1</option>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
          </select>
        </label>
        <div className="action-row">
          <button
            className="button button--primary"
            type="button"
            onClick={() => {
              const nextOutput = Array.from({ length: count }, () =>
                window.crypto.randomUUID(),
              ).join("\n");
              setOutput(nextOutput);
              setStatus(text.generated(count));
              setStatusTone("success");
              setCommandHint(text.generatedHint(count));
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
            {output ? metric("lines", output.split("\n").length) : metric("lines", 0)}
          </div>
        </div>
        <label className="field">
          <span>{text.listLabel}</span>
          <textarea readOnly value={output} placeholder={text.outputPlaceholder} />
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
