export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export type ColorSourceFormat = "hex" | "rgb" | "hsl";

export interface ParsedColor {
  rgb: RGB;
  hsl: HSL;
  alpha: number;
  sourceFormat: ColorSourceFormat;
}

export type ColorParseResult =
  | { ok: true; color: ParsedColor }
  | { ok: false; error: string };

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB_RE =
  /^rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d*\.?\d+)\s*)?\)$/i;
const HSL_RE =
  /^hsla?\s*\(\s*(\d{1,3}(?:\.\d+)?)\s*,\s*(\d{1,3}(?:\.\d+)?)%\s*,\s*(\d{1,3}(?:\.\d+)?)%\s*(?:,\s*(\d*\.?\d+)\s*)?\)$/i;

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

function clampByte(value: number): number {
  return clamp(Math.round(value), 0, 255);
}

export function rgbToHex(rgb: RGB, alpha = 1): string {
  const parts = [rgb.r, rgb.g, rgb.b].map((value) =>
    clampByte(value).toString(16).padStart(2, "0"),
  );

  if (alpha < 1) {
    const alphaHex = clampByte(alpha * 255).toString(16).padStart(2, "0");
    parts.push(alphaHex);
  }

  return `#${parts.join("")}`;
}

export function rgbToHsl(rgb: RGB): HSL {
  const r = clampByte(rgb.r) / 255;
  const g = clampByte(rgb.g) / 255;
  const b = clampByte(rgb.b) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  const l = (max + min) / 2;

  let s = 0;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
  }

  let h = 0;
  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    h *= 60;
    if (h < 0) {
      h += 360;
    }
  }

  return {
    h: Math.round(h * 10) / 10,
    s: Math.round(s * 1000) / 10,
    l: Math.round(l * 1000) / 10,
  };
}

export function hslToRgb(hsl: HSL): RGB {
  const h = ((hsl.h % 360) + 360) % 360;
  const s = clamp(hsl.s, 0, 100) / 100;
  const l = clamp(hsl.l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (h < 60) {
    r1 = c;
    g1 = x;
  } else if (h < 120) {
    r1 = x;
    g1 = c;
  } else if (h < 180) {
    g1 = c;
    b1 = x;
  } else if (h < 240) {
    g1 = x;
    b1 = c;
  } else if (h < 300) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }

  return {
    r: clampByte((r1 + m) * 255),
    g: clampByte((g1 + m) * 255),
    b: clampByte((b1 + m) * 255),
  };
}

function expandShortHex(hex: string): string {
  return hex
    .split("")
    .map((char) => char + char)
    .join("");
}

export function parseColorInput(raw: string): ColorParseResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "" };
  }

  const hexMatch = trimmed.match(HEX_RE);
  if (hexMatch) {
    let hex = hexMatch[1]!;
    if (hex.length === 3 || hex.length === 4) {
      hex = expandShortHex(hex);
    }

    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const alpha =
      hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;

    const rgb: RGB = { r, g, b };
    return {
      ok: true,
      color: {
        rgb,
        hsl: rgbToHsl(rgb),
        alpha,
        sourceFormat: "hex",
      },
    };
  }

  const rgbMatch = trimmed.match(RGB_RE);
  if (rgbMatch) {
    const r = clampByte(Number(rgbMatch[1]));
    const g = clampByte(Number(rgbMatch[2]));
    const b = clampByte(Number(rgbMatch[3]));
    const alpha =
      rgbMatch[4] !== undefined ? clamp(Number(rgbMatch[4]), 0, 1) : 1;

    const rgb: RGB = { r, g, b };
    return {
      ok: true,
      color: {
        rgb,
        hsl: rgbToHsl(rgb),
        alpha,
        sourceFormat: "rgb",
      },
    };
  }

  const hslMatch = trimmed.match(HSL_RE);
  if (hslMatch) {
    const h = Number(hslMatch[1]);
    const s = clamp(Number(hslMatch[2]), 0, 100);
    const l = clamp(Number(hslMatch[3]), 0, 100);
    const alpha =
      hslMatch[4] !== undefined ? clamp(Number(hslMatch[4]), 0, 1) : 1;

    const hsl: HSL = { h, s, l };
    const rgb = hslToRgb(hsl);
    return {
      ok: true,
      color: {
        rgb,
        hsl: rgbToHsl(rgb),
        alpha,
        sourceFormat: "hsl",
      },
    };
  }

  return { ok: false, error: "Unrecognized color format." };
}

export function formatRgbString(rgb: RGB, alpha = 1): string {
  if (alpha < 1) {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.round(alpha * 1000) / 1000})`;
  }
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

export function formatHslString(hsl: HSL, alpha = 1): string {
  const h = Math.round(hsl.h);
  const s = Math.round(hsl.s);
  const l = Math.round(hsl.l);
  if (alpha < 1) {
    return `hsla(${h}, ${s}%, ${l}%, ${Math.round(alpha * 1000) / 1000})`;
  }
  return `hsl(${h}, ${s}%, ${l}%)`;
}
