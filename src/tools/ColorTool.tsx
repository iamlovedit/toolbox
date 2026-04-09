import { useMemo, useState } from "react";
import { useAppShell } from "@/contexts/AppShellContext";
import { getStatusClassName } from "@/tools/helpers";
import {
  formatHslString,
  formatRgbString,
  parseColorInput,
  rgbToHex,
} from "@/utils/color";
import type { StatusTone, ToolDefinition } from "@/types";

const copy = {
  en: {
    name: "Color Convert",
    description: "Convert between HEX, RGB and HSL color formats with preview.",
    hint: "Enter a color in any format to see all conversions live.",
    input: "Input",
    inputLabel: "Color Value",
    inputPlaceholder: "e.g. #ff0055, rgb(255, 0, 85), hsl(340, 100%, 50%)",
    preview: "Preview",
    output: "Formats",
    clear: "Clear",
    copyHex: "Copy HEX",
    copyRgb: "Copy RGB",
    copyHsl: "Copy HSL",
    cleared: "Input cleared.",
    initialStatus: "Enter a HEX, RGB or HSL color.",
    detected(format: string) {
      return `Detected ${format.toUpperCase()} → all formats resolved.`;
    },
    copiedHex: "HEX value copied.",
    copiedRgb: "RGB value copied.",
    copiedHsl: "HSL value copied.",
    labels: {
      hex: "HEX",
      rgb: "RGB",
      hsl: "HSL",
      alpha: "Alpha",
      red: "Red",
      green: "Green",
      blue: "Blue",
      hue: "Hue",
      saturation: "Saturation",
      lightness: "Lightness",
    },
  },
  zh: {
    name: "颜色转换",
    description: "HEX、RGB 与 HSL 颜色格式互转，支持实时预览。",
    hint: "输入任意格式的颜色值以查看所有转换结果。",
    input: "输入",
    inputLabel: "颜色值",
    inputPlaceholder: "例如 #ff0055、rgb(255, 0, 85)、hsl(340, 100%, 50%)",
    preview: "预览",
    output: "格式",
    clear: "清空",
    copyHex: "复制 HEX",
    copyRgb: "复制 RGB",
    copyHsl: "复制 HSL",
    cleared: "输入已清空。",
    initialStatus: "输入 HEX、RGB 或 HSL 颜色。",
    detected(format: string) {
      return `检测到 ${format.toUpperCase()} → 所有格式已解析。`;
    },
    copiedHex: "HEX 值已复制。",
    copiedRgb: "RGB 值已复制。",
    copiedHsl: "HSL 值已复制。",
    labels: {
      hex: "HEX",
      rgb: "RGB",
      hsl: "HSL",
      alpha: "Alpha",
      red: "Red",
      green: "Green",
      blue: "Blue",
      hue: "Hue",
      saturation: "Saturation",
      lightness: "Lightness",
    },
  },
} as const;

function ColorToolComponent(): JSX.Element {
  const { language, copyText, setCommandHint } = useAppShell();
  const text = copy[language];

  const [input, setInput] = useState("#ff0055");

  const parsed = useMemo(() => parseColorInput(input), [input]);

  let status: string;
  let statusTone: StatusTone;

  if (parsed.ok) {
    status = text.detected(parsed.color.sourceFormat);
    statusTone = "success";
  } else if (parsed.error) {
    status = parsed.error;
    statusTone = "error";
  } else {
    status = text.initialStatus;
    statusTone = "info";
  }

  const hexStr = parsed.ok ? rgbToHex(parsed.color.rgb, parsed.color.alpha) : "--";
  const rgbStr = parsed.ok
    ? formatRgbString(parsed.color.rgb, parsed.color.alpha)
    : "--";
  const hslStr = parsed.ok
    ? formatHslString(parsed.color.hsl, parsed.color.alpha)
    : "--";
  const alphaStr = parsed.ok
    ? `${Math.round(parsed.color.alpha * 100)}%`
    : "--";

  return (
    <div className="tool-grid">
      <section className="panel panel-block">
        <div className="panel__header">
          <h3 className="panel__title">{text.input}</h3>
          <div className="panel__meta">COLOR</div>
        </div>
        <label className="field">
          <span>{text.inputLabel}</span>
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={text.inputPlaceholder}
          />
        </label>
        <div className="panel__meta password-options__label">
          {text.preview}
        </div>
        <div
          className="color-swatch"
          style={{
            background: parsed.ok ? hexStr : "transparent",
          }}
        />
        <div className="action-row">
          <button
            className="button"
            type="button"
            onClick={() => {
              setInput("");
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
          <h3 className="panel__title">{text.output}</h3>
          <div className="panel__meta">{parsed.ok ? "3 FORMATS" : "--"}</div>
        </div>
        <div className="kv-grid">
          <div className="kv">
            <span>{text.labels.hex}</span>
            <strong>{hexStr}</strong>
          </div>
          <div className="kv">
            <span>{text.labels.rgb}</span>
            <strong>{rgbStr}</strong>
          </div>
          <div className="kv">
            <span>{text.labels.hsl}</span>
            <strong>{hslStr}</strong>
          </div>
          <div className="kv">
            <span>{text.labels.alpha}</span>
            <strong>{alphaStr}</strong>
          </div>
        </div>
        {parsed.ok && (
          <div className="kv-grid">
            <div className="kv">
              <span>{text.labels.red}</span>
              <strong>{parsed.color.rgb.r}</strong>
            </div>
            <div className="kv">
              <span>{text.labels.green}</span>
              <strong>{parsed.color.rgb.g}</strong>
            </div>
            <div className="kv">
              <span>{text.labels.blue}</span>
              <strong>{parsed.color.rgb.b}</strong>
            </div>
            <div className="kv">
              <span>{text.labels.hue}</span>
              <strong>{parsed.color.hsl.h}°</strong>
            </div>
            <div className="kv">
              <span>{text.labels.saturation}</span>
              <strong>{parsed.color.hsl.s}%</strong>
            </div>
            <div className="kv">
              <span>{text.labels.lightness}</span>
              <strong>{parsed.color.hsl.l}%</strong>
            </div>
          </div>
        )}
        <div className="action-row">
          <button
            className="button"
            type="button"
            onClick={() => copyText(hexStr, text.copiedHex)}
          >
            {text.copyHex}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => copyText(rgbStr, text.copiedRgb)}
          >
            {text.copyRgb}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => copyText(hslStr, text.copiedHsl)}
          >
            {text.copyHsl}
          </button>
        </div>
      </section>
    </div>
  );
}

export const colorTool: ToolDefinition = {
  id: "color",
  groupKey: "encode",
  name: { en: copy.en.name, zh: copy.zh.name },
  badge: "COLOR",
  description: { en: copy.en.description, zh: copy.zh.description },
  hint: { en: copy.en.hint, zh: copy.zh.hint },
  component: ColorToolComponent,
};
