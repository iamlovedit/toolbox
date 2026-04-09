export interface QueryEntry {
  key: string;
  value: string;
}

export interface ParsedQueryInput {
  isUrl: boolean;
  baseUrl: string;
  hash: string;
  rows: QueryEntry[];
}

export interface BuiltQueryOutput {
  query: string;
  url: string;
}

function looksLikeFullUrl(value: string): boolean {
  if (/^(?:[a-z][a-z\d+.-]*:\/\/|\/\/|\/|\.{1,2}\/)/i.test(value)) {
    return true;
  }

  const queryIndex = value.indexOf("?");
  if (queryIndex <= 0) {
    return false;
  }

  const head = value.slice(0, queryIndex);
  return !head.includes("=") && !head.includes("&");
}

function splitUrlLikeValue(value: string): {
  baseUrl: string;
  query: string;
  hash: string;
} {
  const hashIndex = value.indexOf("#");
  const withoutHash = hashIndex === -1 ? value : value.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : value.slice(hashIndex + 1);
  const queryIndex = withoutHash.indexOf("?");
  return {
    baseUrl: queryIndex === -1 ? withoutHash : withoutHash.slice(0, queryIndex),
    query: queryIndex === -1 ? "" : withoutHash.slice(queryIndex + 1),
    hash,
  };
}

function splitRawQuery(value: string): { query: string; hash: string } {
  const normalized = value.startsWith("?") ? value.slice(1) : value;
  const hashIndex = normalized.indexOf("#");
  return {
    query: hashIndex === -1 ? normalized : normalized.slice(0, hashIndex),
    hash: hashIndex === -1 ? "" : normalized.slice(hashIndex + 1),
  };
}

export function parseQueryString(query: string): QueryEntry[] {
  const params = new URLSearchParams(query);
  return Array.from(params.entries()).map(([key, value]) => ({
    key,
    value,
  }));
}

export function parseQueryInput(value: string): ParsedQueryInput {
  const trimmed = value.trim();
  if (!trimmed) {
    return { isUrl: false, baseUrl: "", hash: "", rows: [] };
  }

  if (looksLikeFullUrl(trimmed)) {
    const { baseUrl, query, hash } = splitUrlLikeValue(trimmed);
    return {
      isUrl: true,
      baseUrl,
      hash,
      rows: parseQueryString(query),
    };
  }

  const { query, hash } = splitRawQuery(trimmed);
  return {
    isUrl: false,
    baseUrl: "",
    hash,
    rows: parseQueryString(query),
  };
}

export function buildQueryString(rows: QueryEntry[]): string {
  const params = new URLSearchParams();
  rows.forEach(({ key, value }) => {
    if (!key && !value) {
      return;
    }
    params.append(key, value);
  });
  return params.toString();
}

export function buildQueryOutput({
  isUrl,
  baseUrl,
  hash,
  rows,
}: ParsedQueryInput): BuiltQueryOutput {
  const query = buildQueryString(rows);
  const hashSuffix = hash ? `#${hash}` : "";

  if (!isUrl) {
    return {
      query,
      url: `${query}${hashSuffix}`,
    };
  }

  const querySuffix = query ? `?${query}` : "";
  return {
    query,
    url: `${baseUrl}${querySuffix}${hashSuffix}`,
  };
}

export function sortQueryEntries<T extends QueryEntry>(rows: T[]): T[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const byKey = left.row.key.localeCompare(right.row.key);
      return byKey === 0 ? left.index - right.index : byKey;
    })
    .map(({ row }) => row);
}
