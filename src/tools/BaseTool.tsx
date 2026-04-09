import { useMemo, useState } from "react";
import { useAppShell } from "@/contexts/AppShellContext";
import { getStatusClassName } from "@/tools/helpers";
import { formatBase, parseNumberInput } from "@/utils/numberBase";
import type { StatusTone, ToolDefinition } from "@/types";

const copy = {
  en: {
    name: "Base Convert",
    description:
      "Convert between decimal, hexadecimal, octal and binary with auto-detection.",
    hint: "Enter a number with optional 0x/0o/0b prefix to convert.",
    input: "Input",
    inputLabel: "Number",
    inputPlaceholder: "e.g. 255, 0xff, 0o377, 0b11111111",
    output: "All Bases",
    clear: "Clear",
    copy: "Copy",
    cleared: "Input cleared.",
    initialStatus: "Enter a number to see all base conversions.",
    detected(base: string) {
      return `Detected ${base}. All bases resolved.`;
    },
    copied(label: string) {
      return `${label} value copied.`;
    },
    labels: {
      dec: "Decimal",
      hex: "Hexadecimal",
      oct: "Octal",
      bin: "Binary",
    },
  },
  zh: {
    name: "进制转换",
    description: "十进制、十六进制、八进制与二进制互转，自动检测输入格式。",
    hint: "输入带有 0x/0o/0b 前缀的数字进行转换。",
    input: "输入",
    inputLabel: "数字",
    inputPlaceholder: "例如 255、0xff、0o377、0b11111111",
    output: "所有进制",
    clear: "清空",
    copy: "复制",
    cleared: "输入已清空。",
    initialStatus: "输入数字以查看所有进制转换结果。",
    detected(base: string) {
      return `检测到 ${base}，所有进制已解析。`;
    },
    copied(label: string) {
      return `${label} 值已复制。`;
    },
    labels: {
      dec: "十进制",
      hex: "十六进制",
      oct: "八进制",
      bin: "二进制",
    },
  },
} as const;

const BASE_DISPLAY_NAMES: Record<string, string> = {
  hex: "HEX",
  oct: "OCT",
  bin: "BIN",
  dec: "DEC",
};

function BaseToolComponent(): JSX.Element {
  const { language, copyText, setCommandHint } = useAppShell();
  const text = copy[language];

  const [input, setInput] = useState("");

  const parsed = useMemo(() => parseNumberInput(input), [input]);

  let status: string;
  let statusTone: StatusTone;

  if (parsed.ok) {
    const displayName = BASE_DISPLAY_NAMES[parsed.detected] ?? parsed.detected;
    status = text.detected(displayName);
    statusTone = "success";
  } else if (parsed.error) {
    status = parsed.error;
    statusTone = "error";
  } else {
    status = text.initialStatus;
    statusTone = "info";
  }

  const dec = parsed.ok ? formatBase(parsed.value, 10) : "--";
  const hex = parsed.ok ? formatBase(parsed.value, 16) : "--";
  const oct = parsed.ok ? formatBase(parsed.value, 8) : "--";
  const bin = parsed.ok ? formatBase(parsed.value, 2) : "--";

  const bases = [
    { key: "dec", label: text.labels.dec, value: dec },
    { key: "hex", label: text.labels.hex, value: hex },
    { key: "oct", label: text.labels.oct, value: oct },
    { key: "bin", label: text.labels.bin, value: bin },
  ] as const;

  return (
    <div className="tool-grid">
      <section className="panel panel-block">
        <div className="panel__header">
          <h3 className="panel__title">{text.input}</h3>
          <div className="panel__meta">NUMBER</div>
        </div>
        <label className="field">
          <span>{text.inputLabel}</span>
          <input
            type="text"
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
          <div className="panel__meta">{parsed.ok ? "4 BASES" : "--"}</div>
        </div>
        <div className="kv-grid">
          {bases.map(({ key, label, value }) => (
            <div className="kv" key={key}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <div className="action-row">
          {bases.map(({ key, label, value }) => (
            <button
              key={key}
              className="button"
              type="button"
              onClick={() => copyText(value, text.copied(label))}
            >
              {text.copy} {key.toUpperCase()}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export const baseTool: ToolDefinition = {
  id: "base",
  groupKey: "encode",
  name: { en: copy.en.name, zh: copy.zh.name },
  badge: "BASE",
  description: { en: copy.en.description, zh: copy.zh.description },
  hint: { en: copy.en.hint, zh: copy.zh.hint },
  component: BaseToolComponent,
};
