import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jsonTool } from "@/tools/JsonTool";
import { jwtTool } from "@/tools/JwtTool";
import { timestampTool } from "@/tools/TimestampTool";
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
