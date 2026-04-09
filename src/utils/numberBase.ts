export type NumberBase = 2 | 8 | 10 | 16;
export type DetectedBase = "hex" | "oct" | "bin" | "dec";

export type NumberParseResult =
  | { ok: true; value: bigint; detected: DetectedBase }
  | { ok: false; error: string };

const HEX_RE = /^0x[0-9a-f]+$/i;
const OCT_RE = /^0o[0-7]+$/i;
const BIN_RE = /^0b[01]+$/i;
const DEC_RE = /^\d+$/;

export function parseNumberInput(raw: string): NumberParseResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "" };
  }

  const negative = trimmed.startsWith("-");
  const body = negative ? trimmed.slice(1) : trimmed;

  if (!body) {
    return { ok: false, error: "Not a valid number." };
  }

  let detected: DetectedBase;
  if (HEX_RE.test(body)) {
    detected = "hex";
  } else if (OCT_RE.test(body)) {
    detected = "oct";
  } else if (BIN_RE.test(body)) {
    detected = "bin";
  } else if (DEC_RE.test(body)) {
    detected = "dec";
  } else {
    return { ok: false, error: "Not a valid number." };
  }

  try {
    const magnitude = BigInt(body);
    const value = negative ? -magnitude : magnitude;
    return { ok: true, value, detected };
  } catch {
    return { ok: false, error: "Number out of range." };
  }
}

export function formatBase(value: bigint, base: NumberBase): string {
  const negative = value < 0n;
  const magnitude = negative ? -value : value;
  const body = magnitude.toString(base);

  let prefix = "";
  switch (base) {
    case 2:
      prefix = "0b";
      break;
    case 8:
      prefix = "0o";
      break;
    case 16:
      prefix = "0x";
      break;
    default:
      prefix = "";
  }

  return `${negative ? "-" : ""}${prefix}${body}`;
}
