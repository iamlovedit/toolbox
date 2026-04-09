import type { Language, LocalizedText, MetricName } from "@/types";

const STORAGE_KEY = "neon-forge-lang";
const SUPPORTED_LANGUAGES = new Set<Language>(["en", "zh"]);

const dictionaries = {
  en: {
    app: {
      documentTitle: "Neon Forge",
      localNode: "LOCAL NODE",
      topbarTitle: "NEON FORGE // CYBER UTILITY DECK",
      language: "LANG",
      languageEnglish: "EN",
      languageChinese: "中",
      brandKicker: "[ OFFLINE TOOL DECK ]",
      brandDescription:
        "A cyberpunk utility board for encoding, crypto, parsing and diagnostic chores.",
      navLabel: "Tool Navigation",
      chipHtml: "PURE HTML",
      chipJs: "LOCAL JS",
      chipBackend: "NO BACKEND",
      systemMessage: "SYS MSG",
      awaitingPayload: "Awaiting payload...",
    },
    groups: {
      encode: "[ Encode ]",
      crypto: "[ Crypto ]",
      parser: "[ Parser ]",
      text: "[ Text ]",
    },
    metrics: {
      chars: ({ count }: { count: number }) => `${count} chars`,
      lines: ({ count }: { count: number }) => `${count} lines`,
      modules: ({ count }: { count: number }) =>
        `${String(count).padStart(2, "0")} modules`,
    },
    common: {
      copied: "Copied to clipboard.",
      nothingToCopy: "Nothing to copy yet.",
      dialogEyebrow: "SYSTEM INTERRUPT",
      missingInputTitle: "Missing Input",
      requiredField: ({ field }: { field: string }) =>
        `Please fill in ${field} first.`,
      dialogConfirm: "OK",
    },
  },
  zh: {
    app: {
      documentTitle: "Neon Forge",
      localNode: "本地节点",
      topbarTitle: "NEON FORGE // 赛博工具甲板",
      language: "语言",
      languageEnglish: "EN",
      languageChinese: "中",
      brandKicker: "[ 离线工具甲板 ]",
      brandDescription:
        "一个带赛博朋克界面的本地开发者工具台，覆盖编码、加密、解析和日常诊断。",
      navLabel: "工具导航",
      chipHtml: "纯 HTML",
      chipJs: "本地 JS",
      chipBackend: "无后端",
      systemMessage: "系统信息",
      awaitingPayload: "等待输入...",
    },
    groups: {
      encode: "[ 编码 ]",
      crypto: "[ 加密 ]",
      parser: "[ 解析 ]",
      text: "[ 文本 ]",
    },
    metrics: {
      chars: ({ count }: { count: number }) => `${count} 字符`,
      lines: ({ count }: { count: number }) => `${count} 行`,
      modules: ({ count }: { count: number }) =>
        `${String(count).padStart(2, "0")} 个模块`,
    },
    common: {
      copied: "已复制到剪贴板。",
      nothingToCopy: "当前没有可复制的内容。",
      dialogEyebrow: "系统中断",
      missingInputTitle: "输入缺失",
      requiredField: ({ field }: { field: string }) => `请先填写${field}。`,
      dialogConfirm: "收到",
    },
  },
} as const;

function getValueByPath(object: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>((value, segment) => (value as Record<string, unknown> | undefined)?.[segment], object);
}

export function detectInitialLanguage(): Language {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "zh") {
      return stored;
    }
  } catch {
    // Ignore storage access failures.
  }

  const candidate =
    typeof navigator !== "undefined" && navigator.language
      ? navigator.language.toLowerCase()
      : "en";

  return candidate.startsWith("zh") ? "zh" : "en";
}

export function persistLanguage(language: Language): Language {
  if (!SUPPORTED_LANGUAGES.has(language)) {
    return "en";
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Ignore storage write failures.
  }

  return language;
}

export function translate(
  language: Language,
  path: string,
  vars: Record<string, string | number> = {},
): string {
  const languageDictionary = dictionaries[language] ?? dictionaries.en;
  const fallbackDictionary = dictionaries.en;
  const resolved =
    getValueByPath(languageDictionary, path) ??
    getValueByPath(fallbackDictionary, path);

  if (typeof resolved === "function") {
    return resolved(vars);
  }

  return typeof resolved === "string" ? resolved : path;
}

export function metricForLanguage(
  language: Language,
  name: MetricName,
  count: number,
): string {
  return translate(language, `metrics.${name}`, { count });
}

export function pickLocalizedText(
  language: Language,
  value: LocalizedText,
): string {
  if (typeof value === "string") {
    return value;
  }

  return value[language] ?? value.en ?? Object.values(value)[0] ?? "";
}
