import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jsonTool } from "@/tools/JsonTool";
import { jwtTool } from "@/tools/JwtTool";
import { queryTool } from "@/tools/QueryTool";
import { timestampTool } from "@/tools/TimestampTool";
import { yamlTool } from "@/tools/YamlTool";
import { renderTool } from "@/test/render";

function base64Url(value: object): string {
  return window
    .btoa(JSON.stringify(value))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

describe("parser tools", () => {
  it("pretty prints and validates json payloads", async () => {
    const user = userEvent.setup();
    const Tool = jsonTool.component;
    renderTool(Tool);

    const input = screen.getByLabelText("Payload");
    const output = screen.getByLabelText("Formatted JSON") as HTMLTextAreaElement;

    await user.click(screen.getByRole("button", { name: "Pretty" }));
    expect(screen.getByRole("dialog", { name: "Missing Input" })).toBeInTheDocument();
    expect(output.value).toBe("");
    await user.click(screen.getByRole("button", { name: "OK" }));

    await user.click(input);
    await user.paste('{"status":"ok","items":[1,2]}');
    await user.click(screen.getByRole("button", { name: "Pretty" }));
    expect(output.value).toContain('"status": "ok"');

    await user.clear(input);
    await user.click(input);
    await user.paste("{bad");
    await user.click(screen.getByRole("button", { name: "Validate" }));
    expect(screen.getByText("JSON is invalid.")).toBeInTheDocument();
  });

  it("decodes jwt payloads and handles invalid structures", async () => {
    const user = userEvent.setup();
    const Tool = jwtTool.component;
    renderTool(Tool);

    await user.click(screen.getByRole("button", { name: "Decode" }));
    expect(screen.getByRole("dialog", { name: "Missing Input" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "OK" }));

    const token = [
      base64Url({ alg: "HS256", typ: "JWT" }),
      base64Url({
        iss: "issuer",
        aud: ["web", "api"],
        sub: "user-123",
        exp: 1712563200,
        iat: 1712559600,
        nbf: 1712556000,
      }),
      "signature",
    ].join(".");

    await user.type(screen.getByLabelText("JWT"), token);
    await user.click(screen.getByRole("button", { name: "Decode" }));

    expect(screen.getByText("issuer")).toBeInTheDocument();
    expect(screen.getByText("web, api")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("JWT"));
    await user.type(screen.getByLabelText("JWT"), "abc");
    await user.click(screen.getByRole("button", { name: "Decode" }));
    expect(
      screen.getByText("JWT must contain 2 or 3 dot-separated segments."),
    ).toBeInTheDocument();
  });

  it("parses, edits, sorts, and rebuilds query payloads", async () => {
    const user = userEvent.setup();
    const Tool = queryTool.component;
    renderTool(Tool);

    const source = screen.getByLabelText("URL Or Query Input");
    await user.click(screen.getByRole("button", { name: "Parse" }));
    expect(screen.getByRole("dialog", { name: "Missing Input" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "OK" }));

    await user.type(
      source,
      "https://example.com/search?q=hello%20world&q=again&empty=#frag",
    );
    await user.click(screen.getByRole("button", { name: "Parse" }));

    expect((screen.getByLabelText("Base URL") as HTMLInputElement).value).toBe(
      "https://example.com/search",
    );
    expect(
      (screen.getByLabelText("Hash Fragment") as HTMLInputElement).value,
    ).toBe("frag");

    const rebuiltQuery = screen.getByLabelText(
      "Rebuilt Query",
    ) as HTMLTextAreaElement;
    const rebuiltUrl = screen.getByLabelText(
      "Rebuilt URL",
    ) as HTMLTextAreaElement;
    expect(rebuiltQuery.value).toBe("q=hello+world&q=again&empty=");

    await user.click(screen.getByRole("button", { name: "Remove Row 2" }));
    await user.click(screen.getByRole("button", { name: "Add Row" }));
    await user.type(screen.getByLabelText("Key 3"), "lang");
    await user.type(screen.getByLabelText("Value 3"), "zh");
    await user.click(screen.getByRole("button", { name: "Rebuild" }));

    expect(rebuiltQuery.value).toBe("q=hello+world&empty=&lang=zh");
    expect(rebuiltUrl.value).toBe(
      "https://example.com/search?q=hello+world&empty=&lang=zh#frag",
    );

    await user.click(screen.getByRole("button", { name: "Sort By Key" }));
    await user.click(screen.getByRole("button", { name: "Rebuild" }));
    expect(rebuiltQuery.value).toBe("empty=&lang=zh&q=hello+world");
  });

  it("supports raw query strings with optional leading question marks", async () => {
    const user = userEvent.setup();
    const QueryTool = queryTool.component;
    renderTool(QueryTool);

    await user.type(screen.getByLabelText("URL Or Query Input"), "?draft=1&draft=2#tab");
    await user.click(screen.getByRole("button", { name: "Parse" }));
    expect((screen.getByLabelText("Base URL") as HTMLInputElement).value).toBe("");
    expect(
      (screen.getByLabelText("Rebuilt Query") as HTMLTextAreaElement).value,
    ).toBe("draft=1&draft=2");
    expect(
      (screen.getByLabelText("Rebuilt URL") as HTMLTextAreaElement).value,
    ).toBe("draft=1&draft=2#tab");
  });

  it("bridges json and yaml content in both directions", async () => {
    const user = userEvent.setup();
    const YamlTool = yamlTool.component;
    renderTool(YamlTool);

    const jsonInput = screen.getByLabelText("JSON Document");
    const yamlInput = screen.getByLabelText("YAML Document");
    await user.click(screen.getByRole("button", { name: "JSON -> YAML" }));
    expect(screen.getByRole("dialog", { name: "Missing Input" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "OK" }));

    await user.click(jsonInput);
    await user.paste('{"name":"neo","count":2}');
    await user.click(screen.getByRole("button", { name: "JSON -> YAML" }));
    expect((yamlInput as HTMLTextAreaElement).value).toContain("name: neo");

    await user.clear(yamlInput);
    await user.type(yamlInput, "name: neo\ncount: 2");
    await user.click(screen.getByRole("button", { name: "YAML -> JSON" }));
    expect((jsonInput as HTMLTextAreaElement).value).toContain('"name": "neo"');

    await user.click(screen.getByRole("button", { name: "Minify JSON" }));
    expect((jsonInput as HTMLTextAreaElement).value).toBe(
      "{\"name\":\"neo\",\"count\":2}",
    );

    await user.click(screen.getByRole("button", { name: "Pretty JSON" }));
    expect((jsonInput as HTMLTextAreaElement).value).toContain('\n  "count": 2\n');

    await user.clear(yamlInput);
    await user.click(yamlInput);
    await user.paste("name: [broken");
    await user.click(screen.getByRole("button", { name: "YAML -> JSON" }));
    expect(screen.getByText("YAML is invalid.")).toBeInTheDocument();
    expect((jsonInput as HTMLTextAreaElement).value).toContain('"name": "neo"');
  });

  it("parses timestamps, uses now, and clears the workspace", async () => {
    const user = userEvent.setup();
    const Tool = timestampTool.component;
    renderTool(Tool);

    const input = screen.getByLabelText("Timestamp Or Date");
    await user.click(screen.getByRole("button", { name: "Parse" }));
    expect(screen.getByRole("dialog", { name: "Missing Input" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "OK" }));
    await waitFor(() => expect(input).toHaveFocus());

    await user.type(input, "1712563200");
    await user.click(screen.getByRole("button", { name: "Parse" }));

    expect(screen.getByText("2024-04-08T08:00:00.000Z")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Use Now" }));
    expect((input as HTMLTextAreaElement).value).toMatch(/^\d{13}$/);

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect((input as HTMLTextAreaElement).value).toBe("");
  });
});
