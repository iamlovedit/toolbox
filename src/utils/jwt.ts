import { base64UrlToText } from "@/utils/encoding";
import { formatLocalDateTime, formatUtcDateTime } from "@/utils/dateTime";

export interface DecodedJwtSegment {
  formatted: string;
  json: Record<string, unknown> | null;
}

export function decodeJwtSegment(segment: string): DecodedJwtSegment {
  const text = base64UrlToText(segment);

  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    return {
      formatted: JSON.stringify(parsed, null, 2),
      json: parsed,
    };
  } catch {
    return {
      formatted: text,
      json: null,
    };
  }
}

export function formatJwtClaimTime(value: number): string {
  if (!Number.isFinite(value)) {
    return "--";
  }

  const date = new Date(value * 1000);
  return `${formatLocalDateTime(date)} / ${formatUtcDateTime(date)}`;
}

export function formatJwtClaimValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value === undefined || value === null || value === "") {
    return "--";
  }

  return String(value);
}
