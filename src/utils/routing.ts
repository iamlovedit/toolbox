import type { ToolId } from "@/types";

export const DEFAULT_TOOL_ID: ToolId = "base64";

export function isToolId(value: string | undefined, toolIds: readonly ToolId[]): value is ToolId {
  return !!value && toolIds.includes(value as ToolId);
}

export function getLegacyToolPath(
  hash: string,
  toolIds: readonly ToolId[],
): string | null {
  const normalized = hash.replace(/^#/, "").trim();
  if (!isToolId(normalized, toolIds)) {
    return null;
  }

  return `/tools/${normalized}`;
}

export function normalizeLegacyHashRoute(toolIds: readonly ToolId[]): void {
  if (typeof window === "undefined" || !window.location.hash) {
    return;
  }

  const nextPath = getLegacyToolPath(window.location.hash, toolIds);
  if (!nextPath) {
    return;
  }

  const nextUrl = `${nextPath}${window.location.search}`;
  window.history.replaceState(null, "", nextUrl);
}
