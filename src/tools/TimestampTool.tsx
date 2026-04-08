import { useEffect, useRef, useState } from "react";
import { useAppShell } from "@/contexts/AppShellContext";
import {
  formatDateForInput,
  formatLocalDateTime,
  formatTimezoneOffset,
  formatUtcDateTime,
  parseDateInput,
} from "@/utils/dateTime";
import { getStatusClassName, requireFilledField } from "@/tools/helpers";
import type { StatusTone, ToolDefinition } from "@/types";

interface TimestampOutput {
  local: string;
  utc: string;
  seconds: string;
  milliseconds: string;
  zone: string;
  datetimeInput: string;
}

const emptyOutput: TimestampOutput = {
  local: "--",
  utc: "--",
  seconds: "--",
  milliseconds: "--",
  zone: "--",
  datetimeInput: "--",
};

const copy = {
  en: {
    name: "Time Decoder",
    description:
      "Translate timestamps and date strings between local, UTC, seconds and milliseconds.",
    hint: "Paste a timestamp or date string to decode it.",
    realtimeClock: "Realtime Clock",
    systemSnapshot: "System Snapshot",
    unixSeconds: "Unix Seconds",
    unixMilliseconds: "Unix Milliseconds",
    localTime: "Local Time",
    utc: "UTC",
    refresh: "Refresh",
    useNow: "Use Now",
    parser: "Parser",
    parserMeta: "Seconds / ms / Date String",
    inputLabel: "Timestamp Or Date",
    inputPlaceholder:
      "Paste 1712563200, 1712563200000, 2026-04-08 14:30:00, or 2026-04-08T14:30",
    parse: "Parse",
    copyLocal: "Copy Local",
    clear: "Clear",
    initialStatus:
      "Parser accepts 10-digit seconds, 13-digit milliseconds, or date text the browser can parse.",
    resolvedOutput: "Resolved Output",
    convertedValues: "Converted Values",
    timezone: "Timezone",
    datetimeInput: "Datetime Input",
    invalidStatus: "Unable to parse the supplied timestamp or date string.",
    resolvedStatus: "Timestamp resolved successfully.",
    resolvedHint: "Timestamp resolved into local, UTC, and Unix forms.",
    useNowStatus: "Current moment injected into parser.",
    localCopied: "Local time copied.",
    clearedStatus: "Timestamp parser cleared.",
    clearedHint: "Timestamp parser cleared. Awaiting input.",
  },
  zh: {
    name: "时间解码器",
    description: "在本地时间、UTC、秒级时间戳和毫秒级时间戳之间快速转换。",
    hint: "粘贴时间戳或日期字符串进行解析。",
    realtimeClock: "实时时钟",
    systemSnapshot: "系统快照",
    unixSeconds: "Unix 秒",
    unixMilliseconds: "Unix 毫秒",
    localTime: "本地时间",
    utc: "UTC",
    refresh: "刷新",
    useNow: "使用当前时间",
    parser: "解析器",
    parserMeta: "秒 / 毫秒 / 日期字符串",
    inputLabel: "时间戳或日期",
    inputPlaceholder:
      "粘贴 1712563200、1712563200000、2026-04-08 14:30:00 或 2026-04-08T14:30",
    parse: "解析",
    copyLocal: "复制本地时间",
    clear: "清空",
    initialStatus:
      "支持 10 位秒级时间戳、13 位毫秒级时间戳，以及浏览器可识别的日期文本。",
    resolvedOutput: "解析结果",
    convertedValues: "转换后的值",
    timezone: "时区",
    datetimeInput: "Datetime 输入",
    invalidStatus: "无法解析提供的时间戳或日期字符串。",
    resolvedStatus: "时间解析成功。",
    resolvedHint: "已解析为本地时间、UTC 和 Unix 形式。",
    useNowStatus: "已将当前时间注入解析器。",
    localCopied: "本地时间已复制。",
    clearedStatus: "时间解析器已清空。",
    clearedHint: "时间解析器已清空，等待输入。",
  },
} as const;

function toOutput(date: Date): TimestampOutput {
  return {
    local: formatLocalDateTime(date),
    utc: formatUtcDateTime(date),
    seconds: Math.floor(date.getTime() / 1000).toString(),
    milliseconds: date.getTime().toString(),
    zone: formatTimezoneOffset(date),
    datetimeInput: formatDateForInput(date),
  };
}

function TimestampToolComponent(): JSX.Element {
  const { language, setCommandHint, showRequiredFieldDialog, copyText } =
    useAppShell();
  const text = copy[language];
  const [now, setNow] = useState(() => new Date());
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<TimestampOutput>(emptyOutput);
  const [status, setStatus] = useState<string>(text.initialStatus);
  const [statusTone, setStatusTone] = useState<StatusTone>("info");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(timerId);
  }, []);

  return (
    <div className="stack-grid">
      <div className="tool-grid">
        <section className="panel panel-block">
          <div className="panel__header">
            <h3 className="panel__title">{text.realtimeClock}</h3>
            <div className="panel__meta">{text.systemSnapshot}</div>
          </div>
          <div className="kv-grid">
            <div className="kv">
              <span>{text.unixSeconds}</span>
              <strong>{Math.floor(now.getTime() / 1000)}</strong>
            </div>
            <div className="kv">
              <span>{text.unixMilliseconds}</span>
              <strong>{now.getTime()}</strong>
            </div>
            <div className="kv">
              <span>{text.localTime}</span>
              <strong>{formatLocalDateTime(now)}</strong>
            </div>
            <div className="kv">
              <span>{text.utc}</span>
              <strong>{formatUtcDateTime(now)}</strong>
            </div>
          </div>
          <div className="action-row">
            <button
              className="button button--primary"
              type="button"
              onClick={() => setNow(new Date())}
            >
              {text.refresh}
            </button>
            <button
              className="button"
              type="button"
              onClick={() => {
                const nextNow = new Date();
                setNow(nextNow);
                setInput(nextNow.getTime().toString());
                setOutput(toOutput(nextNow));
                setStatus(text.useNowStatus);
                setStatusTone("success");
              }}
            >
              {text.useNow}
            </button>
          </div>
        </section>

        <section className="panel panel-block">
          <div className="panel__header">
            <h3 className="panel__title">{text.parser}</h3>
            <div className="panel__meta">{text.parserMeta}</div>
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

              const parsed = parseDateInput(input);
              if (!parsed) {
                setStatus(text.invalidStatus);
                  setStatusTone("error");
                  return;
                }

                setOutput(toOutput(parsed));
                setStatus(text.resolvedStatus);
                setStatusTone("success");
                setCommandHint(text.resolvedHint);
              }}
            >
              {text.parse}
            </button>
            <button
              className="button"
              type="button"
              onClick={() => copyText(output.local, text.localCopied)}
            >
              {text.copyLocal}
            </button>
            <button
              className="button"
              type="button"
              onClick={() => {
                setInput("");
                setOutput(emptyOutput);
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
      </div>

      <section className="panel panel-block">
        <div className="panel__header">
          <h3 className="panel__title">{text.resolvedOutput}</h3>
          <div className="panel__meta">{text.convertedValues}</div>
        </div>
        <div className="kv-grid">
          <div className="kv">
            <span>{text.localTime}</span>
            <strong>{output.local}</strong>
          </div>
          <div className="kv">
            <span>{text.utc}</span>
            <strong>{output.utc}</strong>
          </div>
          <div className="kv">
            <span>{text.unixSeconds}</span>
            <strong>{output.seconds}</strong>
          </div>
          <div className="kv">
            <span>{text.unixMilliseconds}</span>
            <strong>{output.milliseconds}</strong>
          </div>
          <div className="kv">
            <span>{text.timezone}</span>
            <strong>{output.zone}</strong>
          </div>
          <div className="kv">
            <span>{text.datetimeInput}</span>
            <strong>{output.datetimeInput}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

export const timestampTool: ToolDefinition = {
  id: "timestamp",
  groupKey: "parser",
  name: { en: copy.en.name, zh: copy.zh.name },
  badge: "TIME",
  description: { en: copy.en.description, zh: copy.zh.description },
  hint: { en: copy.en.hint, zh: copy.zh.hint },
  component: TimestampToolComponent,
};
