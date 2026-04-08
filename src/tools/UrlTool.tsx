import { useRef, useState } from "react";
import { useAppShell } from "@/contexts/AppShellContext";
import type { StatusTone, ToolDefinition } from "@/types";
import { getStatusClassName, requireFilledField } from "@/tools/helpers";

type UrlMode = "component" | "url";

const copy = {
  en: {
    name: "URL Circuit",
    description:
      "Encode or decode URL components and full URLs with native browser routines.",
    hint: "Choose component or full URL mode before transforming the payload.",
    input: "Input",
    mode: "Mode",
    componentMode: "Component",
    fullUrlMode: "Full URL",
    payload: "Payload",
    payloadPlaceholder: "Paste a query fragment, path, or full URL here...",
    encode: "Encode",
    decode: "Decode",
    swap: "Swap",
    clear: "Clear",
    output: "Output",
    result: "Result",
    resultPlaceholder: "Encoded or decoded URL output appears here...",
    copy: "Copy Result",
    initialStatus:
      "Component mode escapes separators aggressively. Full URL mode preserves path and protocol structure.",
    transformSuccess(mode: UrlMode, direction: "encode" | "decode") {
      const modeLabel = mode === "component" ? "Component" : "Full URL";
      const actionLabel = direction === "encode" ? "encoded" : "decoded";
      return `${modeLabel} ${actionLabel} successfully.`;
    },
    transformHint(mode: UrlMode, direction: "encode" | "decode") {
      const modeLabel = mode === "component" ? "Component" : "Full URL";
      const actionLabel = direction === "encode" ? "encoding" : "decoding";
      return `${modeLabel} ${actionLabel} completed.`;
    },
    failedStatus: "URL transformation failed.",
    failedToast: "URL transformation failed.",
    swappedStatus: "Input and output buffers swapped.",
    clearedStatus: "URL buffers cleared.",
    clearedHint: "URL buffers cleared. Awaiting payload.",
    copied: "URL result copied.",
  },
  zh: {
    name: "URL 回路",
    description: "使用浏览器原生方法对 URL 组件或完整 URL 进行编码和解码。",
    hint: "转换前先选择组件模式还是完整 URL 模式。",
    input: "输入",
    mode: "模式",
    componentMode: "组件",
    fullUrlMode: "完整 URL",
    payload: "内容",
    payloadPlaceholder: "在这里粘贴查询片段、路径或完整 URL...",
    encode: "编码",
    decode: "解码",
    swap: "交换",
    clear: "清空",
    output: "输出",
    result: "结果",
    resultPlaceholder: "编码或解码结果会显示在这里...",
    copy: "复制结果",
    initialStatus:
      "组件模式会更激进地转义分隔符，完整 URL 模式会保留协议和路径结构。",
    transformSuccess(mode: UrlMode, direction: "encode" | "decode") {
      const modeLabel = mode === "component" ? "组件" : "完整 URL";
      const actionLabel = direction === "encode" ? "编码" : "解码";
      return `${modeLabel}${actionLabel}完成。`;
    },
    transformHint(mode: UrlMode, direction: "encode" | "decode") {
      const modeLabel = mode === "component" ? "组件" : "完整 URL";
      const actionLabel = direction === "encode" ? "编码" : "解码";
      return `${modeLabel}${actionLabel}已完成。`;
    },
    failedStatus: "URL 转换失败。",
    failedToast: "URL 转换失败。",
    swappedStatus: "已交换输入与输出缓冲区。",
    clearedStatus: "URL 缓冲区已清空。",
    clearedHint: "URL 缓冲区已清空，等待输入。",
    copied: "URL 结果已复制。",
  },
} as const;

function UrlToolComponent(): JSX.Element {
  const {
    language,
    metric,
    setCommandHint,
    showToast,
    showRequiredFieldDialog,
    copyText,
  } = useAppShell();
  const text = copy[language];
  const [mode, setMode] = useState<UrlMode>("component");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<string>(text.initialStatus);
  const [statusTone, setStatusTone] = useState<StatusTone>("info");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const transform = (direction: "encode" | "decode") => {
    if (
      !requireFilledField({
        value: input,
        fieldLabel: text.payload,
        focusTarget: inputRef.current,
        showRequiredFieldDialog,
      })
    ) {
      return;
    }

    try {
      const handlers =
        mode === "component"
          ? { encode: encodeURIComponent, decode: decodeURIComponent }
          : { encode: encodeURI, decode: decodeURI };
      setOutput(handlers[direction](input));
      setStatus(text.transformSuccess(mode, direction));
      setStatusTone("success");
      setCommandHint(text.transformHint(mode, direction));
    } catch {
      setStatus(text.failedStatus);
      setStatusTone("error");
      showToast(text.failedToast, "error");
    }
  };

  return (
    <div className="tool-grid">
      <section className="panel panel-block">
        <div className="panel__header">
          <h3 className="panel__title">{text.input}</h3>
          <div className="panel__meta">{metric("chars", input.length)}</div>
        </div>
        <label className="field">
          <span>{text.mode}</span>
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as UrlMode)}
          >
            <option value="component">{text.componentMode}</option>
            <option value="url">{text.fullUrlMode}</option>
          </select>
        </label>
        <label className="field">
          <span>{text.payload}</span>
          <textarea
            ref={inputRef}
            value={input}
            placeholder={text.payloadPlaceholder}
            onChange={(event) => setInput(event.target.value)}
          />
        </label>
        <div className="action-row">
          <button
            className="button button--primary"
            type="button"
            onClick={() => transform("encode")}
          >
            {text.encode}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => transform("decode")}
          >
            {text.decode}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => {
              setInput(output);
              setOutput(input);
              setStatus(text.swappedStatus);
              setStatusTone("info");
            }}
          >
            {text.swap}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => {
              setInput("");
              setOutput("");
              setStatus(text.clearedStatus);
              setStatusTone("info");
              setCommandHint(text.clearedHint);
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
          <span>{text.result}</span>
          <textarea readOnly value={output} placeholder={text.resultPlaceholder} />
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

export const urlTool: ToolDefinition = {
  id: "url",
  groupKey: "encode",
  name: { en: copy.en.name, zh: copy.zh.name },
  badge: "URL",
  description: { en: copy.en.description, zh: copy.zh.description },
  hint: { en: copy.en.hint, zh: copy.zh.hint },
  component: UrlToolComponent,
};
