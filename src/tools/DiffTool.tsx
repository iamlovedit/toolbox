import { useMemo, useState } from "react";
import { useAppShell } from "@/contexts/AppShellContext";
import { getStatusClassName } from "@/tools/helpers";
import { computeLineDiff } from "@/utils/diff";
import type { StatusTone, ToolDefinition } from "@/types";

const copy = {
  en: {
    name: "Line Diff",
    description:
      "Compare two texts line by line and display a unified diff output.",
    hint: "Paste original and modified text to see line-level differences.",
    original: "Original",
    modified: "Modified",
    originalLabel: "Original Text",
    modifiedLabel: "Modified Text",
    originalPlaceholder: "Paste original text here...",
    modifiedPlaceholder: "Paste modified text here...",
    output: "Unified Diff",
    swap: "Swap",
    clear: "Clear",
    copy: "Copy Diff",
    cleared: "All fields cleared.",
    swapped: "Original and modified swapped.",
    copied: "Diff output copied.",
    initialStatus: "Enter text on both sides to compute a diff.",
    identical: "No differences — texts are identical.",
    stats(added: number, removed: number) {
      return `${added} addition${added === 1 ? "" : "s"}, ${removed} deletion${removed === 1 ? "" : "s"}.`;
    },
    errorTooLarge: "Input exceeds 2000 lines per side.",
    labels: {
      added: "Added",
      removed: "Removed",
      unchanged: "Unchanged",
    },
  },
  zh: {
    name: "行差异",
    description: "逐行对比两段文本并输出统一格式的差异结果。",
    hint: "粘贴原始文本和修改后文本以查看逐行差异。",
    original: "原始",
    modified: "修改",
    originalLabel: "原始文本",
    modifiedLabel: "修改后文本",
    originalPlaceholder: "在此粘贴原始文本...",
    modifiedPlaceholder: "在此粘贴修改后文本...",
    output: "统一差异",
    swap: "交换",
    clear: "清空",
    copy: "复制差异",
    cleared: "所有字段已清空。",
    swapped: "原始文本和修改文本已交换。",
    copied: "差异输出已复制。",
    initialStatus: "在两侧输入文本以计算差异。",
    identical: "无差异——两段文本完全一致。",
    stats(added: number, removed: number) {
      return `${added} 处新增，${removed} 处删除。`;
    },
    errorTooLarge: "单侧输入超过 2000 行。",
    labels: {
      added: "新增",
      removed: "删除",
      unchanged: "未变",
    },
  },
} as const;

function DiffToolComponent(): JSX.Element {
  const { language, metric, copyText, setCommandHint } = useAppShell();
  const text = copy[language];

  const [original, setOriginal] = useState("");
  const [modified, setModified] = useState("");

  const diff = useMemo(
    () => computeLineDiff(original, modified),
    [original, modified],
  );

  const hasBothSides = original.length > 0 || modified.length > 0;

  let status: string;
  let statusTone: StatusTone;

  if (diff.error) {
    status = text.errorTooLarge;
    statusTone = "error";
  } else if (!hasBothSides) {
    status = text.initialStatus;
    statusTone = "info";
  } else if (diff.stats.added === 0 && diff.stats.removed === 0) {
    status = text.identical;
    statusTone = "success";
  } else {
    status = text.stats(diff.stats.added, diff.stats.removed);
    statusTone = "info";
  }

  return (
    <div className="stack-grid">
      <div className="tool-grid">
        <section className="panel panel-block">
          <div className="panel__header">
            <h3 className="panel__title">{text.original}</h3>
            <div className="panel__meta">
              {metric("lines", original ? original.split("\n").length : 0)}
            </div>
          </div>
          <label className="field">
            <span>{text.originalLabel}</span>
            <textarea
              value={original}
              onChange={(event) => setOriginal(event.target.value)}
              placeholder={text.originalPlaceholder}
            />
          </label>
        </section>

        <section className="panel panel-block">
          <div className="panel__header">
            <h3 className="panel__title">{text.modified}</h3>
            <div className="panel__meta">
              {metric("lines", modified ? modified.split("\n").length : 0)}
            </div>
          </div>
          <label className="field">
            <span>{text.modifiedLabel}</span>
            <textarea
              value={modified}
              onChange={(event) => setModified(event.target.value)}
              placeholder={text.modifiedPlaceholder}
            />
          </label>
        </section>
      </div>

      <section className="panel panel-block">
        <div className="panel__header">
          <h3 className="panel__title">{text.output}</h3>
          <div className="panel__meta">
            {diff.unified
              ? metric("lines", diff.unified.split("\n").length)
              : "--"}
          </div>
        </div>

        {hasBothSides && (
          <div className="kv-grid">
            <div className="kv">
              <span>{text.labels.added}</span>
              <strong>+{diff.stats.added}</strong>
            </div>
            <div className="kv">
              <span>{text.labels.removed}</span>
              <strong>-{diff.stats.removed}</strong>
            </div>
            <div className="kv">
              <span>{text.labels.unchanged}</span>
              <strong>{diff.stats.unchanged}</strong>
            </div>
          </div>
        )}

        <label className="field">
          <textarea
            readOnly
            value={diff.unified}
            placeholder={text.initialStatus}
          />
        </label>

        <div className="action-row">
          <button
            className="button button--primary"
            type="button"
            onClick={() => {
              const prev = original;
              setOriginal(modified);
              setModified(prev);
              setCommandHint(text.swapped);
            }}
          >
            {text.swap}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => copyText(diff.unified, text.copied)}
          >
            {text.copy}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => {
              setOriginal("");
              setModified("");
              setCommandHint(text.cleared);
            }}
          >
            {text.clear}
          </button>
        </div>
        <div className={getStatusClassName(statusTone)}>{status}</div>
      </section>
    </div>
  );
}

export const diffTool: ToolDefinition = {
  id: "diff",
  groupKey: "text",
  name: { en: copy.en.name, zh: copy.zh.name },
  badge: "DIFF",
  description: { en: copy.en.description, zh: copy.zh.description },
  hint: { en: copy.en.hint, zh: copy.zh.hint },
  component: DiffToolComponent,
};
