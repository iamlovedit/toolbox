import { md5 } from "@/lib/md5";
import { parseAesPackage, digestSha256Text } from "@/utils/crypto";
import { parseDateInput } from "@/utils/dateTime";
import { textToBase64, base64ToText } from "@/utils/encoding";
import {
  escapeHtmlEntities,
  escapeJsonString,
  escapeUnicodeString,
  unescapeHtmlEntities,
  unescapeJsonString,
  unescapeUnicodeString,
} from "@/utils/escape";
import {
  decodeJwtSegment,
  formatJwtClaimTime,
  formatJwtClaimValue,
} from "@/utils/jwt";
import { buildQueryOutput, parseQueryInput } from "@/utils/query";
import {
  getLegacyToolPath,
  normalizeLegacyHashRoute,
} from "@/utils/routing";
import { generatePassword } from "@/utils/password";
import { jsonToYamlString, yamlToJsonString } from "@/utils/yaml";
import { toolIds } from "@/tools/registry";

describe("shared utilities", () => {
  it("encodes and decodes base64 with utf-8 payloads", () => {
    const encoded = textToBase64("hello 世界");
    expect(encoded).toBe("aGVsbG8g5LiW55WM");
    expect(base64ToText(encoded)).toBe("hello 世界");
  });

  it("supports legacy hash migration helpers", () => {
    expect(getLegacyToolPath("#jwt", toolIds)).toBe("/tools/jwt");
    expect(getLegacyToolPath("#missing", toolIds)).toBeNull();

    window.history.replaceState(null, "", "/#rsa");
    normalizeLegacyHashRoute(toolIds);
    expect(window.location.pathname).toBe("/tools/rsa");
    expect(window.location.hash).toBe("");
  });

  it("parses dates from seconds and rejects invalid values", () => {
    expect(parseDateInput("1712563200")?.getTime()).toBe(1712563200 * 1000);
    expect(parseDateInput("not-a-date")).toBeNull();
  });

  it("decodes jwt segments and formats claim values", () => {
    const encodedHeader = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
    const decoded = decodeJwtSegment(encodedHeader);

    expect(decoded.json).toEqual({ alg: "HS256", typ: "JWT" });
    expect(decoded.formatted).toContain('"alg": "HS256"');
    expect(formatJwtClaimValue(["web", "api"])).toBe("web, api");
    expect(formatJwtClaimTime(1712563200)).toContain("2024-04-08");
  });

  it("parses AES packages and produces stable digests", async () => {
    const parsed = parseAesPackage(
      JSON.stringify({
        version: 1,
        alg: "AES-GCM",
        iterations: 150000,
        salt: "AQIDBA==",
        iv: "AQIDBAUGBwgJCgsM",
        ciphertext: "AQIDBAU=",
      }),
    );

    expect(parsed.iterations).toBe(150000);
    expect(parsed.salt.byteLength).toBe(4);
    expect(() => parseAesPackage("{}")).toThrow(
      "Cipher package is missing a valid iterations value.",
    );
    expect(md5("hello")).toBe("5d41402abc4b2a76b9719d911017c592");
    await expect(digestSha256Text("hello")).resolves.toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
  });

  it("parses query payloads and rebuilds them with duplicate keys intact", () => {
    const parsed = parseQueryInput(
      "https://example.com/search?q=neo&q=trinity&empty=#deck",
    );

    expect(parsed.isUrl).toBe(true);
    expect(parsed.baseUrl).toBe("https://example.com/search");
    expect(parsed.hash).toBe("deck");
    expect(parsed.rows).toEqual([
      { key: "q", value: "neo" },
      { key: "q", value: "trinity" },
      { key: "empty", value: "" },
    ]);
    expect(buildQueryOutput(parsed)).toEqual({
      query: "q=neo&q=trinity&empty=",
      url: "https://example.com/search?q=neo&q=trinity&empty=#deck",
    });
    expect(
      buildQueryOutput(parseQueryInput("?draft=1&draft=2#panel")).url,
    ).toBe("draft=1&draft=2#panel");
  });

  it("escapes text payloads and bridges yaml content", () => {
    expect(escapeJsonString("a\"\n")).toBe("a\\\"\\n");
    expect(unescapeJsonString("a\\\"\\n")).toBe("a\"\n");
    expect(escapeHtmlEntities("<>&\"'")).toBe("&lt;&gt;&amp;&quot;&#39;");
    expect(unescapeHtmlEntities("&lt;&gt;&amp;&quot;&#39;")).toBe("<>&\"'");
    expect(escapeUnicodeString("中A")).toBe("\\u4E2DA");
    expect(unescapeUnicodeString("\\u4E2D\\x41")).toBe("中A");
    expect(jsonToYamlString('{"name":"neo","count":2}')).toContain("name: neo");
    expect(yamlToJsonString("name: neo\ncount: 2")).toContain('"count": 2');
  });

  it("generates passwords with guaranteed coverage of selected groups", () => {
    const password = generatePassword({
      length: 18,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: false,
      excludeAmbiguous: true,
    });

    expect(password).toHaveLength(18);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[0-9]/);
    expect(password).not.toMatch(/[O0oIl1|]/);
  });
});
