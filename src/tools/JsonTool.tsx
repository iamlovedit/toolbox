import { useRef, useState } from "react";
import { useAppShell } from "@/contexts/AppShellContext";
import { getStatusClassName, requireFilledField } from "@/tools/helpers";
import type { StatusTone, ToolDefinition } from "@/types";

const copy = {
  en: {
    name: "JSON Lens",
    description: "Validate, pretty-print or minify JSON payloads without leaving the page.",
    hint: "Paste JSON and format or validate it locally.",
    input: "Input",
    inputMeta: "Raw JSON",
    payload: "Payload",
    pretty: "Pretty",
    minify: "Minify",
    validate: "Validate",
    clear: "Clear",
    output: "Output",
    formattedJson: "Formatted JSON",
    outputPlaceholder: "Formatted output appears here...",
    copy: "Copy Output",
    initialStatus:
      "JSON validation is strict. Input must be valid JSON, not JavaScript object literals.",
    prettyStatus: "JSON formatted with two-space indentation.",
    prettyHint: "JSON pretty print completed.",
    minifyStatus: "JSON minified successfully.",
    minifyHint: "JSON minification completed.",
    validStatus: "JSON is valid.",
    validToast: "JSON validation passed.",
    invalidStatus: "JSON is invalid.",
    invalidToast: "JSON validation failed.",
    copied: "JSON output copied.",
    cleared: "JSON buffers cleared.",
  },
  zh: {
    name: "JSON 透镜",
    description: "在本地校验、格式化或压缩 JSON 内容。",
    hint: "粘贴 JSON，并在本地完成格式化或校验。",
    input: "输入",
    inputMeta: "原始 JSON",
    payload: "内容",
    pretty: "美化",
    minify: "压缩",
    validate: "校验",
    clear: "清空",
    output: "输出",
    formattedJson: "格式化后的 JSON",
    outputPlaceholder: "格式化结果会显示在这里...",
    copy: "复制输出",
    initialStatus: "JSON 校验是严格模式，输入必须是合法 JSON，不能是 JavaScript 对象字面量。",
    prettyStatus: "已按两个空格完成 JSON 格式化。",
    prettyHint: "JSON 美化已完成。",
    minifyStatus: "JSON 压缩完成。",
    minifyHint: "JSON 压缩已完成。",
    validStatus: "JSON 合法。",
    validToast: "JSON 校验通过。",
    invalidStatus: "JSON 不合法。",
    invalidToast: "JSON 校验失败。",
    copied: "JSON 输出已复制。",
    cleared: "JSON 缓冲区已清空。",
  },
} as const;

function JsonToolComponent(): JSX.Element {
  const {
    language,
    metric,
    setCommandHint,
    showToast,
    showRequiredFieldDialog,
    copyText,
  } = useAppShell();
  const text = copy[language];
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<string>(text.initialStatus);
  const [statusTone, setStatusTone] = useState<StatusTone>("info");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const parseInput = () => JSON.parse(input);
  const ensureInput = () =>
    requireFilledField({
      value: input,
      fieldLabel: text.payload,
      focusTarget: inputRef.current,
      showRequiredFieldDialog,
    });

  return (
    <div className="tool-grid">
      <section className="panel panel-block">
        <div className="panel__header">
          <h3 className="panel__title">{text.input}</h3>
          <div className="panel__meta">{text.inputMeta}</div>
        </div>
        <label className="field">
          <span>{text.payload}</span>
          <textarea
            ref={inputRef}
            value={input}
            placeholder='{"status":"ok","items":[1,2,3]}'
            onChange={(event) => setInput(event.target.value)}
          />
        </label>
        <div className="action-row">
          <button
            className="button button--primary"
            type="button"
            onClick={() => {
              if (!ensureInput()) {
                return;
              }

              try {
                setOutput(JSON.stringify(parseInput(), null, 2));
                setStatus(text.prettyStatus);
                setStatusTone("success");
                setCommandHint(text.prettyHint);
              } catch {
                setStatus(text.invalidStatus);
                setStatusTone("error");
              }
            }}
          >
            {text.pretty}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => {
              if (!ensureInput()) {
                return;
              }

              try {
                setOutput(JSON.stringify(parseInput()));
                setStatus(text.minifyStatus);
                setStatusTone("success");
                setCommandHint(text.minifyHint);
              } catch {
                setStatus(text.invalidStatus);
                setStatusTone("error");
              }
            }}
          >
            {text.minify}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => {
              if (!ensureInput()) {
                return;
              }

              try {
                parseInput();
                setStatus(text.validStatus);
                setStatusTone("success");
                showToast(text.validToast, "success");
              } catch {
                setStatus(text.invalidStatus);
                setStatusTone("error");
                showToast(text.invalidToast, "error");
              }
            }}
          >
            {text.validate}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => {
              setInput("");
              setOutput("");
              setStatus(text.cleared);
              setStatusTone("info");
            }}
          >
            {text.clear}
          </button>
        </div>
      </section>

      <section className="panel panel-block">
        <div className="panel__header">
          <h3 className="panel__title">{text.output}</h3>
          <div className="panel__meta">{metric("chars", output.length)}</div>
        </div>
        <label className="field">
          <span>{text.formattedJson}</span>
          <textarea readOnly value={output} placeholder={text.outputPlaceholder} />
        </label>
        <div className="action-row">
          <button
            className="button"
            type="button"
            onClick={() => copyText(output, text.copied)}
          >
            {text.copy}
          </button>
        </div>
        <div className={getStatusClassName(statusTone)}>{status}</div>
      </section>
    </div>
  );
}

export const jsonTool: ToolDefinition = {
  id: "json",
  groupKey: "parser",
  name: { en: copy.en.name, zh: copy.zh.name },
  badge: "JSON",
  description: { en: copy.en.description, zh: copy.zh.description },
  hint: { en: copy.en.hint, zh: copy.zh.hint },
  component: JsonToolComponent,
};
