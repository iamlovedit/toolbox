export interface DiffStats {
  added: number;
  removed: number;
  unchanged: number;
}

export interface DiffResult {
  unified: string;
  stats: DiffStats;
  error?: string;
}

const MAX_LINES_PER_SIDE = 2000;

export function computeLineDiff(a: string, b: string): DiffResult {
  const emptyStats: DiffStats = { added: 0, removed: 0, unchanged: 0 };

  if (a === "" && b === "") {
    return { unified: "", stats: emptyStats };
  }

  const A = a.split("\n");
  const B = b.split("\n");

  if (A.length > MAX_LINES_PER_SIDE || B.length > MAX_LINES_PER_SIDE) {
    return {
      unified: "",
      stats: emptyStats,
      error: `Input exceeds ${MAX_LINES_PER_SIDE} lines per side.`,
    };
  }

  const m = A.length;
  const n = B.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );

  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      if (A[i] === B[j]) {
        dp[i]![j] = dp[i + 1]![j + 1]! + 1;
      } else {
        dp[i]![j] = Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
      }
    }
  }

  const lines: string[] = [];
  let i = 0;
  let j = 0;
  let added = 0;
  let removed = 0;
  let unchanged = 0;

  while (i < m && j < n) {
    if (A[i] === B[j]) {
      lines.push(`  ${A[i]}`);
      i += 1;
      j += 1;
      unchanged += 1;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      lines.push(`- ${A[i]}`);
      i += 1;
      removed += 1;
    } else {
      lines.push(`+ ${B[j]}`);
      j += 1;
      added += 1;
    }
  }

  while (i < m) {
    lines.push(`- ${A[i]}`);
    i += 1;
    removed += 1;
  }

  while (j < n) {
    lines.push(`+ ${B[j]}`);
    j += 1;
    added += 1;
  }

  return {
    unified: lines.join("\n"),
    stats: { added, removed, unchanged },
  };
}
