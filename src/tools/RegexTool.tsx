import { useMemo, useState } from "react";
import { useAppShell } from "@/contexts/AppShellContext";
import { getStatusClassName } from "@/tools/helpers";
import type { StatusTone, ToolDefinition } from "@/types";

interface RegexFlags {
  g: boolean;
  i: boolean;
  m: boolean;
  s: boolean;
  u: boolean;
}

interface MatchInfo {
  index: number;
  value: string;
  groups: string[];
  named: Record<string, string>;
}

interface RegexResult {
  ok: boolean;
  matches: MatchInfo[];
  error: string | null;
}

interface TextSegment {
  text: string;
  isMatch: boolean;
}

const FLAG_KEYS: (keyof RegexFlags)[] = ["g", "i", "m", "s", "u"];

const copy = {
  en: {
    name: "Regex Tester",
    description:
      "Test regex patterns live with match highlighting and capture group display.",
    hint: "Enter a pattern and test string to see matches in real-time.",
    controls: "Controls",
    pattern: "Pattern",
    patternPlaceholder: "e.g. (\\w+)@(\\w+\\.\\w+)",
    flags: "Flags",
    testString: "Test String",
    testPlaceholder: "Enter text to test against the pattern...",
    clear: "Clear",
    matches: "Matches",
    matchesLabel: "Highlight View",
    matchDetail: "Match Details",
    noMatches: "No matches in test string.",
    cleared: "All fields cleared.",
    initialStatus: "Enter a regex pattern to start testing.",
    valid(count: number) {
      return `Valid regex. ${count} match${count === 1 ? "" : "es"} found.`;
    },
    invalid(error: string) {
      return `Invalid pattern: ${error}`;
    },
    matchLabel(index: number, position: number) {
      return `Match #${index + 1} @ ${position}`;
    },
    groupLabel(index: number) {
      return `Group ${index + 1}`;
    },
    flagLabels: {
      g: "Global",
      i: "Case Insensitive",
      m: "Multiline",
      s: "DotAll",
      u: "Unicode",
    },
    flagMeta: {
      g: "find all",
      i: "ignore case",
      m: "^ $ per line",
      s: ". matches \\n",
      u: "unicode",
    },
  },
  zh: {
    name: "正则测试",
    description: "实时测试正则表达式，高亮匹配结果并展示捕获组。",
    hint: "输入正则表达式和测试文本以实时查看匹配结果。",
    controls: "控制",
    pattern: "正则表达式",
    patternPlaceholder: "例如 (\\w+)@(\\w+\\.\\w+)",
    flags: "标志",
    testString: "测试文本",
    testPlaceholder: "输入要匹配的文本...",
    clear: "清空",
    matches: "匹配结果",
    matchesLabel: "高亮视图",
    matchDetail: "匹配详情",
    noMatches: "测试文本中未找到匹配项。",
    cleared: "所有字段已清空。",
    initialStatus: "输入正则表达式开始测试。",
    valid(count: number) {
      return `有效正则。找到 ${count} 个匹配。`;
    },
    invalid(error: string) {
      return `无效的表达式: ${error}`;
    },
    matchLabel(index: number, position: number) {
      return `匹配 #${index + 1} @ ${position}`;
    },
    groupLabel(index: number) {
      return `捕获组 ${index + 1}`;
    },
    flagLabels: {
      g: "全局匹配",
      i: "忽略大小写",
      m: "多行模式",
      s: "点号全匹配",
      u: "Unicode",
    },
    flagMeta: {
      g: "查找全部",
      i: "不区分大小写",
      m: "^ $ 按行",
      s: ". 匹配 \\n",
      u: "unicode",
    },
  },
} as const;

function computeRegex(
  pattern: string,
  flags: RegexFlags,
  testString: string,
): RegexResult {
  if (!pattern) {
    return { ok: true, matches: [], error: null };
  }

  try {
    const flagStr = FLAG_KEYS.filter((key) => flags[key]).join("");
    const re = new RegExp(pattern, flagStr);
    const matches: MatchInfo[] = [];

    if (flags.g) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(testString)) !== null) {
        matches.push({
          index: m.index,
          value: m[0],
          groups: m.slice(1) as string[],
          named: m.groups ? { ...m.groups } : {},
        });
        if (m[0] === "") {
          re.lastIndex += 1;
        }
      }
    } else {
      const m = re.exec(testString);
      if (m) {
        matches.push({
          index: m.index,
          value: m[0],
          groups: m.slice(1) as string[],
          named: m.groups ? { ...m.groups } : {},
        });
      }
    }

    return { ok: true, matches, error: null };
  } catch (error) {
    return { ok: false, matches: [], error: (error as Error).message };
  }
}

function buildSegments(
  testString: string,
  matches: MatchInfo[],
): TextSegment[] {
  if (matches.length === 0) {
    return testString ? [{ text: testString, isMatch: false }] : [];
  }

  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const match of matches) {
    if (match.index > cursor) {
      segments.push({
        text: testString.slice(cursor, match.index),
        isMatch: false,
      });
    }
    if (match.value.length > 0) {
      segments.push({ text: match.value, isMatch: true });
    }
    cursor = match.index + match.value.length;
  }

  if (cursor < testString.length) {
    segments.push({ text: testString.slice(cursor), isMatch: false });
  }

  return segments;
}

function RegexToolComponent(): JSX.Element {
  const { language, metric, setCommandHint } = useAppShell();
  const text = copy[language];

  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState<RegexFlags>({
    g: true,
    i: false,
    m: false,
    s: false,
    u: false,
  });
  const [testString, setTestString] = useState("");

  const result = useMemo(
    () => computeRegex(pattern, flags, testString),
    [pattern, flags, testString],
  );

  const segments = useMemo(
    () => (result.ok ? buildSegments(testString, result.matches) : []),
    [result, testString],
  );

  let status: string;
  let statusTone: StatusTone;

  if (!pattern) {
    status = text.initialStatus;
    statusTone = "info";
  } else if (!result.ok) {
    status = text.invalid(result.error ?? "");
    statusTone = "error";
  } else {
    status = text.valid(result.matches.length);
    statusTone = result.matches.length > 0 ? "success" : "info";
  }

  return (
    <div className="stack-grid">
      <section className="panel panel-block">
        <div className="panel__header">
          <h3 className="panel__title">{text.controls}</h3>
          <div className="panel__meta">REGEX</div>
        </div>
        <label className="field">
          <span>{text.pattern}</span>
          <input
            type="text"
            value={pattern}
            onChange={(event) => setPattern(event.target.value)}
            placeholder={text.patternPlaceholder}
          />
        </label>
        <div className="panel__meta password-options__label">{text.flags}</div>
        <div className="password-options">
          {FLAG_KEYS.map((key) => (
            <button
              key={key}
              className={`password-toggle ${flags[key] ? "is-active" : ""}`.trim()}
              type="button"
              aria-pressed={flags[key]}
              onClick={() =>
                setFlags((prev) => ({ ...prev, [key]: !prev[key] }))
              }
            >
              <strong>{text.flagLabels[key]}</strong>
              <span>{text.flagMeta[key]}</span>
            </button>
          ))}
        </div>
        <label className="field">
          <span>{text.testString}</span>
          <textarea
            value={testString}
            onChange={(event) => setTestString(event.target.value)}
            placeholder={text.testPlaceholder}
          />
        </label>
        <div className="action-row">
          <button
            className="button"
            type="button"
            onClick={() => {
              setPattern("");
              setFlags({ g: true, i: false, m: false, s: false, u: false });
              setTestString("");
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
          <h3 className="panel__title">{text.matches}</h3>
          <div className="panel__meta">
            {result.ok ? metric("lines", result.matches.length) : "--"}
          </div>
        </div>

        {testString && result.ok && (
          <>
            <div className="panel__meta password-options__label">
              {text.matchesLabel}
            </div>
            <div className="mono-output">
              {segments.map((segment, index) =>
                segment.isMatch ? (
                  <mark key={index} className="regex-highlight">
                    {segment.text}
                  </mark>
                ) : (
                  <span key={index}>{segment.text}</span>
                ),
              )}
            </div>
          </>
        )}

        {result.ok && result.matches.length > 0 && (
          <>
            <div
              className="panel__meta password-options__label"
              style={{ marginTop: 18 }}
            >
              {text.matchDetail}
            </div>
            <div className="kv-grid">
              {result.matches.map((match, index) => (
                <div className="kv" key={index}>
                  <span>{text.matchLabel(index, match.index)}</span>
                  <strong>{match.value || "(empty)"}</strong>
                  {match.groups.map((group, groupIndex) => (
                    <div key={groupIndex} style={{ marginTop: 4 }}>
                      <span style={{ fontSize: 10, opacity: 0.7 }}>
                        {text.groupLabel(groupIndex)}
                      </span>
                      <strong style={{ fontSize: 12 }}>
                        {group ?? "(undefined)"}
                      </strong>
                    </div>
                  ))}
                  {Object.entries(match.named).map(([name, value]) => (
                    <div key={name} style={{ marginTop: 4 }}>
                      <span style={{ fontSize: 10, opacity: 0.7 }}>{name}</span>
                      <strong style={{ fontSize: 12 }}>
                        {value ?? "(undefined)"}
                      </strong>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}

        {result.ok && result.matches.length === 0 && pattern && testString && (
          <div className={getStatusClassName("info")}>{text.noMatches}</div>
        )}
      </section>
    </div>
  );
}

export const regexTool: ToolDefinition = {
  id: "regex",
  groupKey: "parser",
  name: { en: copy.en.name, zh: copy.zh.name },
  badge: "REGEX",
  description: { en: copy.en.description, zh: copy.zh.description },
  hint: { en: copy.en.hint, zh: copy.zh.hint },
  component: RegexToolComponent,
};
