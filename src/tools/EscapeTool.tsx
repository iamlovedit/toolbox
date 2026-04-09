import { useRef, useState } from "react";
import { useAppShell } from "@/contexts/AppShellContext";
import { getStatusClassName, requireFilledField } from "@/tools/helpers";
import {
  escapeHtmlEntities,
  escapeJsonString,
  escapeUnicodeString,
  unescapeHtmlEntities,
  unescapeJsonString,
  unescapeUnicodeString,
} from "@/utils/escape";
import type { StatusTone, ToolDefinition } from "@/types";

type EscapeMode = "json" | "html" | "unicode";

const copy = {
  en: {
    name: "Escape Deck",
    description:
      "Escape and unescape JSON strings, HTML entities, and unicode sequences locally.",
    hint: "Choose a mode, then escape or unescape the payload in the browser.",
    mode: "Mode",
    jsonMode: "JSON String",
    htmlMode: "HTML Entity",
    unicodeMode: "Unicode Escape",
    jsonMeta: "Quotes / Slashes / Newlines",
    htmlMeta: "&lt; &gt; &amp; &quot;",
    unicodeMeta: "\\uXXXX / \\xXX",
    input: "Input",
    inputLabel: "Payload",
    inputPlaceholder: "Paste plain text or escaped content here...",
    escape: "Escape",
    unescape: "Unescape",
    swap: "Swap",
    clear: "Clear",
    output: "Output",
    outputLabel: "Result",
    outputPlaceholder: "Escaped or unescaped output appears here...",
    copy: "Copy Result",
    initialStatus:
      "JSON String handles quoting and control characters. HTML Entity and Unicode modes cover common web escapes.",
    escapeStatus(mode: EscapeMode) {
      return `${mode === "json" ? "JSON String" : mode === "html" ? "HTML Entity" : "Unicode Escape"} escaped successfully.`;
    },
    unescapeStatus(mode: EscapeMode) {
      return `${mode === "json" ? "JSON String" : mode === "html" ? "HTML Entity" : "Unicode Escape"} unescaped successfully.`;
    },
    escapeHint(mode: EscapeMode) {
      return `${mode === "json" ? "JSON String" : mode === "html" ? "HTML Entity" : "Unicode Escape"} escape completed.`;
    },
    unescapeHint(mode: EscapeMode) {
      return `${mode === "json" ? "JSON String" : mode === "html" ? "HTML Entity" : "Unicode Escape"} unescape completed.`;
    },
    failedStatus: "Escape operation failed for the selected mode.",
    failedToast: "Escape operation failed.",
    swappedStatus: "Input and output buffers swapped.",
    clearedStatus: "Escape workspace cleared.",
    clearedHint: "Escape workspace cleared. Awaiting payload.",
    copied: "Escaped result copied.",
  },
  zh: {
    name: "转义甲板",
    description: "在本地完成 JSON 字符串、HTML 实体和 Unicode 转义的双向处理。",
    hint: "选择模式后，在浏览器里对内容执行转义或反转义。",
    mode: "模式",
    jsonMode: "JSON 字符串",
    htmlMode: "HTML 实体",
    unicodeMode: "Unicode 转义",
    jsonMeta: "引号 / 反斜杠 / 换行",
    htmlMeta: "&lt; &gt; &amp; &quot;",
    unicodeMeta: "\\uXXXX / \\xXX",
    input: "输入",
    inputLabel: "内容",
    inputPlaceholder: "在这里粘贴明文或已转义内容...",
    escape: "转义",
    unescape: "反转义",
    swap: "交换",
    clear: "清空",
    output: "输出",
    outputLabel: "结果",
    outputPlaceholder: "转义或反转义结果会显示在这里...",
    copy: "复制结果",
    initialStatus:
      "JSON 字符串模式处理引号和控制字符，HTML 实体与 Unicode 模式覆盖常见网页转义。",
    escapeStatus(mode: EscapeMode) {
      return `${mode === "json" ? "JSON 字符串" : mode === "html" ? "HTML 实体" : "Unicode 转义"}处理成功。`;
    },
    unescapeStatus(mode: EscapeMode) {
      return `${mode === "json" ? "JSON 字符串" : mode === "html" ? "HTML 实体" : "Unicode 转义"}还原成功。`;
    },
    escapeHint(mode: EscapeMode) {
      return `${mode === "json" ? "JSON 字符串" : mode === "html" ? "HTML 实体" : "Unicode 转义"}已完成转义。`;
    },
    unescapeHint(mode: EscapeMode) {
      return `${mode === "json" ? "JSON 字符串" : mode === "html" ? "HTML 实体" : "Unicode 转义"}已完成反转义。`;
    },
    failedStatus: "当前模式下的转义操作失败。",
    failedToast: "转义操作失败。",
    swappedStatus: "已交换输入与输出缓冲区。",
    clearedStatus: "转义工作区已清空。",
    clearedHint: "转义工作区已清空，等待输入。",
    copied: "结果已复制。",
  },
} as const;

function EscapeToolComponent(): JSX.Element {
  const {
    language,
    metric,
    setCommandHint,
    showToast,
    showRequiredFieldDialog,
    copyText,
  } = useAppShell();
  const text = copy[language];
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [mode, setMode] = useState<EscapeMode>("json");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<string>(text.initialStatus);
  const [statusTone, setStatusTone] = useState<StatusTone>("info");

  const handlers = {
    json: {
      escape: escapeJsonString,
      unescape: unescapeJsonString,
    },
    html: {
      escape: escapeHtmlEntities,
      unescape: unescapeHtmlEntities,
    },
    unicode: {
      escape: escapeUnicodeString,
      unescape: unescapeUnicodeString,
    },
  } satisfies Record<
    EscapeMode,
    {
      escape: (value: string) => string;
      unescape: (value: string) => string;
    }
  >;

  return (
    <div className="tool-grid">
      <section className="panel panel-block">
        <div className="panel__header">
          <h3 className="panel__title">{text.input}</h3>
          <div className="panel__meta">{metric("chars", input.length)}</div>
        </div>
        <div className="panel__meta password-options__label">{text.mode}</div>
        <div className="password-options">
          <button
            className={`password-toggle ${mode === "json" ? "is-active" : ""}`.trim()}
            type="button"
            aria-pressed={mode === "json"}
            onClick={() => setMode("json")}
          >
            <strong>{text.jsonMode}</strong>
            <span>{text.jsonMeta}</span>
          </button>
          <button
            className={`password-toggle ${mode === "html" ? "is-active" : ""}`.trim()}
            type="button"
            aria-pressed={mode === "html"}
            onClick={() => setMode("html")}
          >
            <strong>{text.htmlMode}</strong>
            <span>{text.htmlMeta}</span>
          </button>
          <button
            className={`password-toggle ${mode === "unicode" ? "is-active" : ""}`.trim()}
            type="button"
            aria-pressed={mode === "unicode"}
            onClick={() => setMode("unicode")}
          >
            <strong>{text.unicodeMode}</strong>
            <span>{text.unicodeMeta}</span>
          </button>
        </div>
        <label className="field">
          <span>{text.inputLabel}</span>
          <textarea
            ref={inputRef}
            value={input}
            placeholder={text.inputPlaceholder}
            onChange={(event) => setInput(event.target.value)}
          />
        </label>
        <div className="action-row">
          <button
            className="button button--primary"
            type="button"
            onClick={() => {
              if (
                !requireFilledField({
                  value: input,
                  fieldLabel: text.inputLabel,
                  focusTarget: inputRef.current,
                  showRequiredFieldDialog,
                })
              ) {
                return;
              }

              try {
                setOutput(handlers[mode].escape(input));
                setStatus(text.escapeStatus(mode));
                setStatusTone("success");
                setCommandHint(text.escapeHint(mode));
              } catch {
                setStatus(text.failedStatus);
                setStatusTone("error");
                showToast(text.failedToast, "error");
              }
            }}
          >
            {text.escape}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => {
              if (
                !requireFilledField({
                  value: input,
                  fieldLabel: text.inputLabel,
                  focusTarget: inputRef.current,
                  showRequiredFieldDialog,
                })
              ) {
                return;
              }

              try {
                setOutput(handlers[mode].unescape(input));
                setStatus(text.unescapeStatus(mode));
                setStatusTone("success");
                setCommandHint(text.unescapeHint(mode));
              } catch {
                setStatus(text.failedStatus);
                setStatusTone("error");
                showToast(text.failedToast, "error");
              }
            }}
          >
            {text.unescape}
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
          <span>{text.outputLabel}</span>
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

export const escapeTool: ToolDefinition = {
  id: "escape",
  groupKey: "encode",
  name: { en: copy.en.name, zh: copy.zh.name },
  badge: "ESC",
  description: { en: copy.en.description, zh: copy.zh.description },
  hint: { en: copy.en.hint, zh: copy.zh.hint },
  component: EscapeToolComponent,
};
