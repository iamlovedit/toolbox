import { useRef, useState } from "react";
import { useAppShell } from "@/contexts/AppShellContext";
import { getStatusClassName, requireFilledField } from "@/tools/helpers";
import {
  buildQueryOutput,
  parseQueryInput,
  sortQueryEntries,
  type QueryEntry,
} from "@/utils/query";
import type { StatusTone, ToolDefinition } from "@/types";

interface QueryRowState extends QueryEntry {
  id: number;
}

const copy = {
  en: {
    name: "Query Workbench",
    description:
      "Parse, edit, sort, and rebuild URL query strings without leaving the page.",
    hint: "Paste a full URL or a raw query string to inspect and rebuild it locally.",
    source: "Source",
    sourceMeta: "Full URL / Raw Query",
    sourceLabel: "URL Or Query Input",
    sourcePlaceholder:
      "Paste https://example.com/search?q=neo&q=trinity#top or ?q=neo&lang=en",
    parse: "Parse",
    addRow: "Add Row",
    rebuild: "Rebuild",
    sort: "Sort By Key",
    clear: "Clear",
    rows: "Query Rows",
    rowsMeta: "Editable Parameters",
    baseUrl: "Base URL",
    hashFragment: "Hash Fragment",
    keyLabel(index: number) {
      return `Key ${index}`;
    },
    valueLabel(index: number) {
      return `Value ${index}`;
    },
    removeRow(index: number) {
      return `Remove Row ${index}`;
    },
    output: "Output",
    outputMeta: "Rebuilt Payloads",
    rebuiltQuery: "Rebuilt Query",
    rebuiltUrl: "Rebuilt URL",
    rebuiltQueryPlaceholder: "Rebuilt query appears here...",
    rebuiltUrlPlaceholder: "Rebuilt URL appears here...",
    copyQuery: "Copy Query",
    copyUrl: "Copy URL",
    initialStatus:
      "Parser preserves duplicate keys and empty values. Sorting only happens when you trigger it.",
    parsedStatus: "Query input parsed successfully.",
    parsedHint: "Query input parsed into base URL, rows, and hash fragments.",
    rebuiltStatus: "Query payload rebuilt successfully.",
    rebuiltHint: "Query rows rebuilt into output payloads.",
    sortedStatus: "Query rows sorted by key.",
    addedStatus: "Blank query row added.",
    removedStatus: "Query row removed.",
    clearedStatus: "Query workspace cleared.",
    clearedHint: "Query workspace cleared. Awaiting URL or query input.",
    queryCopied: "Rebuilt query copied.",
    urlCopied: "Rebuilt URL copied.",
    rowCount(count: number) {
      return `${count} row${count === 1 ? "" : "s"}`;
    },
  },
  zh: {
    name: "Query 工作台",
    description: "在本地解析、编辑、排序并重建 URL Query 字符串。",
    hint: "粘贴完整 URL 或原始 Query 字符串，在本地查看并重建结果。",
    source: "输入",
    sourceMeta: "完整 URL / 原始 Query",
    sourceLabel: "URL 或 Query 输入",
    sourcePlaceholder:
      "粘贴 https://example.com/search?q=neo&q=trinity#top 或 ?q=neo&lang=en",
    parse: "解析",
    addRow: "新增行",
    rebuild: "重建",
    sort: "按 Key 排序",
    clear: "清空",
    rows: "Query 行",
    rowsMeta: "可编辑参数",
    baseUrl: "基础 URL",
    hashFragment: "Hash 片段",
    keyLabel(index: number) {
      return `Key ${index}`;
    },
    valueLabel(index: number) {
      return `值 ${index}`;
    },
    removeRow(index: number) {
      return `删除第 ${index} 行`;
    },
    output: "输出",
    outputMeta: "重建结果",
    rebuiltQuery: "重建后的 Query",
    rebuiltUrl: "重建后的 URL",
    rebuiltQueryPlaceholder: "重建后的 Query 会显示在这里...",
    rebuiltUrlPlaceholder: "重建后的 URL 会显示在这里...",
    copyQuery: "复制 Query",
    copyUrl: "复制 URL",
    initialStatus:
      "解析器会保留重复 key 和空值参数。只有显式点击排序时才会重排。",
    parsedStatus: "Query 输入解析成功。",
    parsedHint: "已解析为基础 URL、参数行和 Hash 片段。",
    rebuiltStatus: "Query 重建成功。",
    rebuiltHint: "已根据当前参数行重建输出结果。",
    sortedStatus: "参数行已按 Key 排序。",
    addedStatus: "已新增空白参数行。",
    removedStatus: "参数行已删除。",
    clearedStatus: "Query 工作区已清空。",
    clearedHint: "Query 工作区已清空，等待 URL 或 Query 输入。",
    queryCopied: "重建后的 Query 已复制。",
    urlCopied: "重建后的 URL 已复制。",
    rowCount(count: number) {
      return `${count} 行`;
    },
  },
} as const;

function QueryToolComponent(): JSX.Element {
  const {
    language,
    metric,
    setCommandHint,
    showRequiredFieldDialog,
    copyText,
  } = useAppShell();
  const text = copy[language];
  const nextRowIdRef = useRef(1);
  const sourceRef = useRef<HTMLTextAreaElement | null>(null);
  const [source, setSource] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [hashFragment, setHashFragment] = useState("");
  const [rows, setRows] = useState<QueryRowState[]>([]);
  const [rebuiltQuery, setRebuiltQuery] = useState("");
  const [rebuiltUrl, setRebuiltUrl] = useState("");
  const [status, setStatus] = useState<string>(text.initialStatus);
  const [statusTone, setStatusTone] = useState<StatusTone>("info");

  const createRows = (entries: QueryEntry[]) =>
    entries.map((entry) => ({
      id: nextRowIdRef.current++,
      ...entry,
    }));

  const syncOutputs = (
    nextBaseUrl: string,
    nextHash: string,
    nextRows: QueryEntry[],
  ) => {
    const built = buildQueryOutput({
      isUrl: Boolean(nextBaseUrl.trim()),
      baseUrl: nextBaseUrl,
      hash: nextHash,
      rows: nextRows,
    });
    setRebuiltQuery(built.query);
    setRebuiltUrl(built.url);
  };

  return (
    <div className="stack-grid">
      <div className="tool-grid">
        <section className="panel panel-block">
          <div className="panel__header">
            <h3 className="panel__title">{text.source}</h3>
            <div className="panel__meta">{text.sourceMeta}</div>
          </div>
          <label className="field">
            <span>{text.sourceLabel}</span>
            <textarea
              ref={sourceRef}
              value={source}
              placeholder={text.sourcePlaceholder}
              onChange={(event) => setSource(event.target.value)}
            />
          </label>
          <div className="action-row">
            <button
              className="button button--primary"
              type="button"
              onClick={() => {
                if (
                  !requireFilledField({
                    value: source,
                    fieldLabel: text.sourceLabel,
                    focusTarget: sourceRef.current,
                    showRequiredFieldDialog,
                  })
                ) {
                  return;
                }

                const parsed = parseQueryInput(source);
                const nextRows = createRows(parsed.rows);
                setBaseUrl(parsed.baseUrl);
                setHashFragment(parsed.hash);
                setRows(nextRows);
                syncOutputs(
                  parsed.isUrl ? parsed.baseUrl : "",
                  parsed.hash,
                  parsed.rows,
                );
                setStatus(text.parsedStatus);
                setStatusTone("success");
                setCommandHint(text.parsedHint);
              }}
            >
              {text.parse}
            </button>
            <button
              className="button"
              type="button"
              onClick={() => {
                setRows((current) => [
                  ...current,
                  { id: nextRowIdRef.current++, key: "", value: "" },
                ]);
                setStatus(text.addedStatus);
                setStatusTone("info");
              }}
            >
              {text.addRow}
            </button>
            <button
              className="button"
              type="button"
              onClick={() => {
                const nextRows = rows.map(({ key, value }) => ({ key, value }));
                syncOutputs(baseUrl, hashFragment, nextRows);
                setStatus(text.rebuiltStatus);
                setStatusTone("success");
                setCommandHint(text.rebuiltHint);
              }}
            >
              {text.rebuild}
            </button>
            <button
              className="button"
              type="button"
              onClick={() => {
                setRows((current) =>
                  sortQueryEntries(current).map((row) => ({ ...row })),
                );
                setStatus(text.sortedStatus);
                setStatusTone("info");
              }}
            >
              {text.sort}
            </button>
            <button
              className="button"
              type="button"
              onClick={() => {
                setSource("");
                setBaseUrl("");
                setHashFragment("");
                setRows([]);
                setRebuiltQuery("");
                setRebuiltUrl("");
                setStatus(text.clearedStatus);
                setStatusTone("info");
                setCommandHint(text.clearedHint);
              }}
            >
              {text.clear}
            </button>
          </div>
          <div className={getStatusClassName(statusTone)}>{status}</div>
        </section>

        <section className="panel panel-block">
          <div className="panel__header">
            <h3 className="panel__title">{text.rows}</h3>
            <div className="panel__meta">{text.rowCount(rows.length)}</div>
          </div>
          <div className="query-rows">
            <label className="field">
              <span>{text.baseUrl}</span>
              <input
                value={baseUrl}
                placeholder="https://example.com/search"
                onChange={(event) => setBaseUrl(event.target.value)}
              />
            </label>
            <label className="field">
              <span>{text.hashFragment}</span>
              <input
                value={hashFragment}
                placeholder="section-1"
                onChange={(event) => setHashFragment(event.target.value)}
              />
            </label>
            {rows.map((row, index) => (
              <div key={row.id} className="query-row">
                <div className="query-row__grid">
                  <label className="field">
                    <span>{text.keyLabel(index + 1)}</span>
                    <input
                      value={row.key}
                      onChange={(event) =>
                        setRows((current) =>
                          current.map((entry) =>
                            entry.id === row.id
                              ? { ...entry, key: event.target.value }
                              : entry,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="field">
                    <span>{text.valueLabel(index + 1)}</span>
                    <input
                      value={row.value}
                      onChange={(event) =>
                        setRows((current) =>
                          current.map((entry) =>
                            entry.id === row.id
                              ? { ...entry, value: event.target.value }
                              : entry,
                          ),
                        )
                      }
                    />
                  </label>
                </div>
                <div className="query-row__actions">
                  <button
                    className="button"
                    type="button"
                    onClick={() => {
                      setRows((current) =>
                        current.filter((entry) => entry.id !== row.id),
                      );
                      setStatus(text.removedStatus);
                      setStatusTone("info");
                    }}
                  >
                    {text.removeRow(index + 1)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel panel-block">
        <div className="panel__header">
          <h3 className="panel__title">{text.output}</h3>
          <div className="panel__meta">{text.outputMeta}</div>
        </div>
        <div className="tool-grid">
          <label className="field">
            <span>{text.rebuiltQuery}</span>
            <textarea
              className="query-tool__output"
              readOnly
              value={rebuiltQuery}
              placeholder={text.rebuiltQueryPlaceholder}
            />
          </label>
          <label className="field">
            <span>{text.rebuiltUrl}</span>
            <textarea
              className="query-tool__output"
              readOnly
              value={rebuiltUrl}
              placeholder={text.rebuiltUrlPlaceholder}
            />
          </label>
        </div>
        <div className="action-row">
          <button
            className="button"
            type="button"
            onClick={() => copyText(rebuiltQuery, text.queryCopied)}
          >
            {text.copyQuery}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => copyText(rebuiltUrl, text.urlCopied)}
          >
            {text.copyUrl}
          </button>
          <span className="panel__meta">
            {metric("chars", rebuiltUrl.length)}
          </span>
        </div>
      </section>
    </div>
  );
}

export const queryTool: ToolDefinition = {
  id: "query",
  groupKey: "parser",
  name: { en: copy.en.name, zh: copy.zh.name },
  badge: "QUERY",
  description: { en: copy.en.description, zh: copy.zh.description },
  hint: { en: copy.en.hint, zh: copy.zh.hint },
  component: QueryToolComponent,
};
