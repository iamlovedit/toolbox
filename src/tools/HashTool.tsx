import { useRef, useState } from "react";
import { useAppShell } from "@/contexts/AppShellContext";
import { md5 } from "@/lib/md5";
import { digestSha256Text } from "@/utils/crypto";
import { getStatusClassName, requireFilledField } from "@/tools/helpers";
import type { StatusTone, ToolDefinition } from "@/types";

const copy = {
  en: {
    name: "Digest Reactor",
    description:
      "Generate MD5 or SHA-256 digests locally. MD5 is provided for legacy compatibility only.",
    hint: "Select an algorithm and digest your payload.",
    payload: "Payload",
    payloadMeta: "Digest Input",
    sourceText: "Source Text",
    sourcePlaceholder: "Type the source string to hash...",
    algorithm: "Algorithm",
    md5Option: "MD5 (Legacy)",
    shaOption: "SHA-256",
    digestAction: "Digest",
    clear: "Clear",
    digestTitle: "Digest",
    hexOutput: "Hex Output",
    digestPlaceholder: "Digest output appears here...",
    copy: "Copy Hash",
    initialStatus: "MD5 is available for legacy workflows. Prefer SHA-256 for modern use.",
    md5Status: "Legacy MD5 digest generated.",
    md5Hint: "MD5 digest emitted for compatibility use.",
    shaStatus: "SHA-256 digest generated.",
    shaHint: "SHA-256 digest generated locally in Web Crypto.",
    failedStatus: "Digest operation failed.",
    failedToast: "Digest generation failed.",
    clearedStatus: "Digest buffers cleared.",
    copied: "Digest copied.",
  },
  zh: {
    name: "摘要反应堆",
    description: "在本地生成 MD5 或 SHA-256 摘要。MD5 仅用于兼容旧系统。",
    hint: "选择算法并对输入生成摘要。",
    payload: "载荷",
    payloadMeta: "摘要输入",
    sourceText: "源文本",
    sourcePlaceholder: "输入要计算摘要的文本...",
    algorithm: "算法",
    md5Option: "MD5（兼容模式）",
    shaOption: "SHA-256",
    digestAction: "计算摘要",
    clear: "清空",
    digestTitle: "摘要",
    hexOutput: "十六进制输出",
    digestPlaceholder: "摘要结果会显示在这里...",
    copy: "复制摘要",
    initialStatus: "MD5 仅适用于遗留场景，现代用途优先使用 SHA-256。",
    md5Status: "已生成 MD5 摘要。",
    md5Hint: "已为兼容场景输出 MD5 摘要。",
    shaStatus: "已生成 SHA-256 摘要。",
    shaHint: "已通过 Web Crypto 在本地生成 SHA-256 摘要。",
    failedStatus: "摘要计算失败。",
    failedToast: "摘要生成失败。",
    clearedStatus: "摘要缓冲区已清空。",
    copied: "摘要已复制。",
  },
} as const;

function HashToolComponent(): JSX.Element {
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
  const [algorithm, setAlgorithm] = useState<"md5" | "sha-256">("md5");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<string>(text.initialStatus);
  const [statusTone, setStatusTone] = useState<StatusTone>("info");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const digest = async () => {
    if (
      !requireFilledField({
        value: input,
        fieldLabel: text.sourceText,
        focusTarget: inputRef.current,
        showRequiredFieldDialog,
      })
    ) {
      return;
    }

    try {
      if (algorithm === "md5") {
        setOutput(md5(input));
        setStatus(text.md5Status);
        setCommandHint(text.md5Hint);
      } else {
        setOutput(await digestSha256Text(input));
        setStatus(text.shaStatus);
        setCommandHint(text.shaHint);
      }
      setStatusTone("success");
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
          <h3 className="panel__title">{text.payload}</h3>
          <div className="panel__meta">{text.payloadMeta}</div>
        </div>
        <label className="field">
          <span>{text.sourceText}</span>
          <textarea
            ref={inputRef}
            value={input}
            placeholder={text.sourcePlaceholder}
            onChange={(event) => setInput(event.target.value)}
          />
        </label>
        <label className="field">
          <span>{text.algorithm}</span>
          <select
            value={algorithm}
            onChange={(event) =>
              setAlgorithm(event.target.value as "md5" | "sha-256")
            }
          >
            <option value="md5">{text.md5Option}</option>
            <option value="sha-256">{text.shaOption}</option>
          </select>
        </label>
        <div className="action-row">
          <button className="button button--primary" type="button" onClick={digest}>
            {text.digestAction}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => {
              setInput("");
              setOutput("");
              setStatus(text.clearedStatus);
              setStatusTone("info");
            }}
          >
            {text.clear}
          </button>
        </div>
      </section>

      <section className="panel panel-block">
        <div className="panel__header">
          <h3 className="panel__title">{text.digestTitle}</h3>
          <div className="panel__meta">{metric("chars", output.length)}</div>
        </div>
        <label className="field">
          <span>{text.hexOutput}</span>
          <textarea readOnly value={output} placeholder={text.digestPlaceholder} />
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

export const hashTool: ToolDefinition = {
  id: "hash",
  groupKey: "crypto",
  name: { en: copy.en.name, zh: copy.zh.name },
  badge: "HASH",
  description: { en: copy.en.description, zh: copy.zh.description },
  hint: { en: copy.en.hint, zh: copy.zh.hint },
  component: HashToolComponent,
};
