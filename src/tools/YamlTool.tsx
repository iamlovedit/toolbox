import { useRef, useState } from "react";
import { useAppShell } from "@/contexts/AppShellContext";
import { getStatusClassName, requireFilledField } from "@/tools/helpers";
import { jsonToYamlString, yamlToJsonString } from "@/utils/yaml";
import type { StatusTone, ToolDefinition } from "@/types";

const copy = {
  en: {
    name: "YAML Bridge",
    description:
      "Convert structured data between strict JSON and readable YAML locally in the browser.",
    hint: "Paste JSON or YAML and bridge the payload in either direction.",
    controls: "Controls",
    controlsMeta: "JSON <-> YAML",
    jsonToYaml: "JSON -> YAML",
    yamlToJson: "YAML -> JSON",
    prettyJson: "Pretty JSON",
    minifyJson: "Minify JSON",
    clear: "Clear",
    json: "JSON",
    jsonMeta: "Strict JSON",
    jsonLabel: "JSON Document",
    jsonPlaceholder: '{"name":"neo","roles":["chosen","pilot"]}',
    copyJson: "Copy JSON",
    yaml: "YAML",
    yamlMeta: "Readable YAML",
    yamlLabel: "YAML Document",
    yamlPlaceholder: "name: neo\nroles:\n  - chosen\n  - pilot",
    copyYaml: "Copy YAML",
    initialStatus:
      "YAML conversion preserves data shape, not comments, anchors, or the original text layout.",
    jsonToYamlStatus: "JSON converted to YAML successfully.",
    jsonToYamlHint: "Strict JSON converted into readable YAML.",
    yamlToJsonStatus: "YAML converted to JSON successfully.",
    yamlToJsonHint: "YAML converted into pretty JSON.",
    prettyStatus: "JSON formatted with two-space indentation.",
    prettyHint: "JSON pretty print completed in the bridge.",
    minifyStatus: "JSON minified successfully.",
    minifyHint: "JSON minification completed in the bridge.",
    invalidJson: "JSON is invalid.",
    invalidYaml: "YAML is invalid.",
    invalidToast: "Structured data conversion failed.",
    jsonCopied: "JSON copied.",
    yamlCopied: "YAML copied.",
    clearedStatus: "YAML bridge cleared.",
    clearedHint: "YAML bridge cleared. Awaiting JSON or YAML input.",
  },
  zh: {
    name: "YAML 桥",
    description: "在浏览器本地完成严格 JSON 与可读 YAML 之间的双向转换。",
    hint: "粘贴 JSON 或 YAML，并在两个格式之间本地转换。",
    controls: "控制台",
    controlsMeta: "JSON <-> YAML",
    jsonToYaml: "JSON -> YAML",
    yamlToJson: "YAML -> JSON",
    prettyJson: "美化 JSON",
    minifyJson: "压缩 JSON",
    clear: "清空",
    json: "JSON",
    jsonMeta: "严格 JSON",
    jsonLabel: "JSON 文档",
    jsonPlaceholder: '{"name":"neo","roles":["chosen","pilot"]}',
    copyJson: "复制 JSON",
    yaml: "YAML",
    yamlMeta: "可读 YAML",
    yamlLabel: "YAML 文档",
    yamlPlaceholder: "name: neo\nroles:\n  - chosen\n  - pilot",
    copyYaml: "复制 YAML",
    initialStatus:
      "YAML 转换只保证数据结构等价，不保留注释、锚点或原始文本排版。",
    jsonToYamlStatus: "JSON 转 YAML 成功。",
    jsonToYamlHint: "已将严格 JSON 转换为可读 YAML。",
    yamlToJsonStatus: "YAML 转 JSON 成功。",
    yamlToJsonHint: "已将 YAML 转换为格式化 JSON。",
    prettyStatus: "已按两个空格完成 JSON 格式化。",
    prettyHint: "已在 YAML Bridge 中完成 JSON 美化。",
    minifyStatus: "JSON 压缩完成。",
    minifyHint: "已在 YAML Bridge 中完成 JSON 压缩。",
    invalidJson: "JSON 不合法。",
    invalidYaml: "YAML 不合法。",
    invalidToast: "结构化数据转换失败。",
    jsonCopied: "JSON 已复制。",
    yamlCopied: "YAML 已复制。",
    clearedStatus: "YAML Bridge 已清空。",
    clearedHint: "YAML Bridge 已清空，等待 JSON 或 YAML 输入。",
  },
} as const;

function YamlToolComponent(): JSX.Element {
  const {
    language,
    metric,
    setCommandHint,
    showToast,
    showRequiredFieldDialog,
    copyText,
  } = useAppShell();
  const text = copy[language];
  const jsonRef = useRef<HTMLTextAreaElement | null>(null);
  const yamlRef = useRef<HTMLTextAreaElement | null>(null);
  const [jsonInput, setJsonInput] = useState("");
  const [yamlInput, setYamlInput] = useState("");
  const [status, setStatus] = useState<string>(text.initialStatus);
  const [statusTone, setStatusTone] = useState<StatusTone>("info");

  return (
    <div className="stack-grid">
      <section className="panel panel-block">
        <div className="panel__header">
          <h3 className="panel__title">{text.controls}</h3>
          <div className="panel__meta">{text.controlsMeta}</div>
        </div>
        <div className="action-row">
          <button
            className="button button--primary"
            type="button"
            onClick={() => {
              if (
                !requireFilledField({
                  value: jsonInput,
                  fieldLabel: text.jsonLabel,
                  focusTarget: jsonRef.current,
                  showRequiredFieldDialog,
                })
              ) {
                return;
              }

              try {
                setYamlInput(jsonToYamlString(jsonInput));
                setStatus(text.jsonToYamlStatus);
                setStatusTone("success");
                setCommandHint(text.jsonToYamlHint);
              } catch {
                setStatus(text.invalidJson);
                setStatusTone("error");
                showToast(text.invalidToast, "error");
              }
            }}
          >
            {text.jsonToYaml}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => {
              if (
                !requireFilledField({
                  value: yamlInput,
                  fieldLabel: text.yamlLabel,
                  focusTarget: yamlRef.current,
                  showRequiredFieldDialog,
                })
              ) {
                return;
              }

              try {
                setJsonInput(yamlToJsonString(yamlInput));
                setStatus(text.yamlToJsonStatus);
                setStatusTone("success");
                setCommandHint(text.yamlToJsonHint);
              } catch {
                setStatus(text.invalidYaml);
                setStatusTone("error");
                showToast(text.invalidToast, "error");
              }
            }}
          >
            {text.yamlToJson}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => {
              if (
                !requireFilledField({
                  value: jsonInput,
                  fieldLabel: text.jsonLabel,
                  focusTarget: jsonRef.current,
                  showRequiredFieldDialog,
                })
              ) {
                return;
              }

              try {
                setJsonInput(JSON.stringify(JSON.parse(jsonInput), null, 2));
                setStatus(text.prettyStatus);
                setStatusTone("success");
                setCommandHint(text.prettyHint);
              } catch {
                setStatus(text.invalidJson);
                setStatusTone("error");
                showToast(text.invalidToast, "error");
              }
            }}
          >
            {text.prettyJson}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => {
              if (
                !requireFilledField({
                  value: jsonInput,
                  fieldLabel: text.jsonLabel,
                  focusTarget: jsonRef.current,
                  showRequiredFieldDialog,
                })
              ) {
                return;
              }

              try {
                setJsonInput(JSON.stringify(JSON.parse(jsonInput)));
                setStatus(text.minifyStatus);
                setStatusTone("success");
                setCommandHint(text.minifyHint);
              } catch {
                setStatus(text.invalidJson);
                setStatusTone("error");
                showToast(text.invalidToast, "error");
              }
            }}
          >
            {text.minifyJson}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => {
              setJsonInput("");
              setYamlInput("");
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

      <div className="tool-grid">
        <section className="panel panel-block">
          <div className="panel__header">
            <h3 className="panel__title">{text.json}</h3>
            <div className="panel__meta">{metric("chars", jsonInput.length)}</div>
          </div>
          <label className="field">
            <span>{text.jsonLabel}</span>
            <textarea
              ref={jsonRef}
              value={jsonInput}
              placeholder={text.jsonPlaceholder}
              onChange={(event) => setJsonInput(event.target.value)}
            />
          </label>
          <div className="action-row">
            <button
              className="button"
              type="button"
              onClick={() => copyText(jsonInput, text.jsonCopied)}
            >
              {text.copyJson}
            </button>
          </div>
        </section>

        <section className="panel panel-block">
          <div className="panel__header">
            <h3 className="panel__title">{text.yaml}</h3>
            <div className="panel__meta">{metric("chars", yamlInput.length)}</div>
          </div>
          <label className="field">
            <span>{text.yamlLabel}</span>
            <textarea
              ref={yamlRef}
              value={yamlInput}
              placeholder={text.yamlPlaceholder}
              onChange={(event) => setYamlInput(event.target.value)}
            />
          </label>
          <div className="action-row">
            <button
              className="button"
              type="button"
              onClick={() => copyText(yamlInput, text.yamlCopied)}
            >
              {text.copyYaml}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export const yamlTool: ToolDefinition = {
  id: "yaml",
  groupKey: "parser",
  name: { en: copy.en.name, zh: copy.zh.name },
  badge: "YAML",
  description: { en: copy.en.description, zh: copy.zh.description },
  hint: { en: copy.en.hint, zh: copy.zh.hint },
  component: YamlToolComponent,
};
