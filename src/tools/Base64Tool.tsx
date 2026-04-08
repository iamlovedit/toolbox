import { useRef, useState } from "react";
import { useAppShell } from "@/contexts/AppShellContext";
import type { StatusTone, ToolDefinition } from "@/types";
import { base64ToText, textToBase64 } from "@/utils/encoding";
import { getStatusClassName, requireFilledField } from "@/tools/helpers";

const copy = {
  en: {
    name: "Base64 Matrix",
    description: "Encode or decode UTF-8 payloads directly inside the browser.",
    hint: "Ready to encode or decode UTF-8 payloads.",
    input: "Input",
    payloadLabel: "UTF-8 Payload / Base64 Block",
    inputPlaceholder: "Paste plain text or Base64 payload here...",
    encode: "Encode",
    decode: "Decode",
    swap: "Swap",
    clear: "Clear",
    output: "Output",
    resultLabel: "Result",
    outputPlaceholder: "Output appears here...",
    copy: "Copy Result",
    initialStatus: "Input text to encode or paste Base64 to decode.",
    encodedStatus: "Payload encoded to Base64.",
    encodedHint: "Encoded payload to Base64.",
    decodedStatus: "Base64 decoded to UTF-8 text.",
    decodedHint: "Decoded Base64 payload back into UTF-8 text.",
    invalidPayload: "Invalid payload for the requested action.",
    failedToast: "Base64 operation failed.",
    swappedStatus: "Input and output buffers swapped.",
    clearedStatus: "Buffers cleared.",
    clearedHint: "Buffers cleared. Awaiting payload.",
    copied: "Result copied.",
  },
  zh: {
    name: "Base64 矩阵",
    description: "直接在浏览器里对 UTF-8 文本进行 Base64 编码和解码。",
    hint: "准备对 UTF-8 载荷进行 Base64 编码或解码。",
    input: "输入",
    payloadLabel: "UTF-8 文本 / Base64 数据块",
    inputPlaceholder: "在这里粘贴明文或 Base64 内容...",
    encode: "编码",
    decode: "解码",
    swap: "交换",
    clear: "清空",
    output: "输出",
    resultLabel: "结果",
    outputPlaceholder: "结果会显示在这里...",
    copy: "复制结果",
    initialStatus: "输入明文可编码，粘贴 Base64 可解码。",
    encodedStatus: "已编码为 Base64。",
    encodedHint: "已将输入编码为 Base64。",
    decodedStatus: "已将 Base64 解码为 UTF-8 文本。",
    decodedHint: "已将 Base64 还原为 UTF-8 文本。",
    invalidPayload: "输入内容不符合当前操作要求。",
    failedToast: "Base64 操作失败。",
    swappedStatus: "已交换输入与输出缓冲区。",
    clearedStatus: "缓冲区已清空。",
    clearedHint: "缓冲区已清空，等待输入。",
    copied: "结果已复制。",
  },
} as const;

function Base64ToolComponent(): JSX.Element {
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

  const run = (mode: "encode" | "decode") => {
    if (
      !requireFilledField({
        value: input,
        fieldLabel: text.payloadLabel,
        focusTarget: inputRef.current,
        showRequiredFieldDialog,
      })
    ) {
      return;
    }

    try {
      const nextOutput =
        mode === "encode" ? textToBase64(input) : base64ToText(input);
      setOutput(nextOutput);
      if (mode === "encode") {
        setStatus(text.encodedStatus);
        setCommandHint(text.encodedHint);
      } else {
        setStatus(text.decodedStatus);
        setCommandHint(text.decodedHint);
      }
      setStatusTone("success");
    } catch {
      setStatus(text.invalidPayload);
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
          <span>{text.payloadLabel}</span>
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
            onClick={() => run("encode")}
          >
            {text.encode}
          </button>
          <button className="button" type="button" onClick={() => run("decode")}>
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
          <span>{text.resultLabel}</span>
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

export const base64Tool: ToolDefinition = {
  id: "base64",
  groupKey: "encode",
  name: { en: copy.en.name, zh: copy.zh.name },
  badge: "BASE64",
  description: { en: copy.en.description, zh: copy.zh.description },
  hint: { en: copy.en.hint, zh: copy.zh.hint },
  component: Base64ToolComponent,
};
