import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { base64Tool } from "@/tools/Base64Tool";
import { escapeTool } from "@/tools/EscapeTool";
import { urlTool } from "@/tools/UrlTool";
import { uuidTool } from "@/tools/UuidTool";
import { renderTool } from "@/test/render";

describe("encoding and text tools", () => {
  it("handles base64 encode, swap, decode, and clear", async () => {
    const user = userEvent.setup();
    const Tool = base64Tool.component;
    renderTool(Tool);

    const input = screen.getByLabelText("UTF-8 Payload / Base64 Block");
    const output = screen.getByLabelText("Result") as HTMLTextAreaElement;

    await user.click(screen.getByRole("button", { name: "Encode" }));
    expect(screen.getByRole("dialog", { name: "Missing Input" })).toBeInTheDocument();
    expect(output.value).toBe("");
    await user.click(screen.getByRole("button", { name: "OK" }));

    await user.type(input, "hello 世界");
    await user.click(screen.getByRole("button", { name: "Encode" }));
    expect(output.value).toBe("aGVsbG8g5LiW55WM");

    await user.click(screen.getByRole("button", { name: "Swap" }));
    expect((input as HTMLTextAreaElement).value).toBe("aGVsbG8g5LiW55WM");

    await user.click(screen.getByRole("button", { name: "Decode" }));
    expect(output.value).toBe("hello 世界");

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect((input as HTMLTextAreaElement).value).toBe("");
    expect(output.value).toBe("");
  });

  it("encodes URL payloads in both component and full-url mode", async () => {
    const user = userEvent.setup();
    const Tool = urlTool.component;
    renderTool(Tool);

    const input = screen.getByLabelText("Payload");
    const output = screen.getByLabelText("Result") as HTMLTextAreaElement;

    await user.type(input, "a b");
    await user.click(screen.getByRole("button", { name: "Encode" }));
    expect(output.value).toBe("a%20b");

    await user.selectOptions(screen.getByLabelText("Mode"), "url");
    await user.clear(input);
    await user.type(input, "https://a.com/a b?x=1&y=2");
    await user.click(screen.getByRole("button", { name: "Encode" }));
    expect(output.value).toBe("https://a.com/a%20b?x=1&y=2");
  });

  it("generates, copies, and clears UUID batches", async () => {
    const user = userEvent.setup();
    const clipboardSpy = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    const Tool = uuidTool.component;
    renderTool(Tool);

    const countInput = screen.getByLabelText("Count");
    await user.clear(countInput);
    await user.type(countInput, "5");
    await user.click(screen.getByRole("button", { name: "Generate" }));

    const output = screen.getByLabelText("UUID List") as HTMLTextAreaElement;
    const lines = output.value.split("\n");
    expect(lines).toHaveLength(5);
    lines.forEach((line) => {
      expect(line).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    await user.click(screen.getByRole("button", { name: "Copy All" }));
    await waitFor(() =>
      expect(clipboardSpy).toHaveBeenCalledWith(output.value),
    );

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(output.value).toBe("");
  });

  it("escapes and unescapes json, html entities, and unicode sequences", async () => {
    const user = userEvent.setup();
    const clipboardSpy = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    const Tool = escapeTool.component;
    renderTool(Tool);

    const input = screen.getByLabelText("Payload");
    const output = screen.getByLabelText("Result") as HTMLTextAreaElement;

    await user.click(screen.getByRole("button", { name: "Escape" }));
    expect(screen.getByRole("dialog", { name: "Missing Input" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "OK" }));

    await user.click(input);
    await user.paste("hello \"world\"\nline2");
    await user.click(screen.getByRole("button", { name: "Escape" }));
    expect(output.value).toBe("hello \\\"world\\\"\\nline2");

    await user.click(screen.getByRole("button", { name: "Copy Result" }));
    await waitFor(() =>
      expect(clipboardSpy).toHaveBeenCalledWith("hello \\\"world\\\"\\nline2"),
    );

    await user.click(screen.getByRole("button", { name: "Swap" }));
    expect((input as HTMLTextAreaElement).value).toBe("hello \\\"world\\\"\\nline2");
    await user.click(screen.getByRole("button", { name: "Unescape" }));
    expect(output.value).toBe("hello \"world\"\nline2");

    await user.click(screen.getByRole("button", { name: /HTML Entity/i }));
    await user.clear(input);
    await user.type(input, "<div>&\"'");
    await user.click(screen.getByRole("button", { name: "Escape" }));
    expect(output.value).toBe("&lt;div&gt;&amp;&quot;&#39;");

    await user.click(screen.getByRole("button", { name: /Unicode Escape/i }));
    await user.clear(input);
    await user.type(input, "中A");
    await user.click(screen.getByRole("button", { name: "Escape" }));
    expect(output.value).toBe("\\u4E2DA");

    await user.clear(input);
    await user.type(input, "\\u4E2D\\x41");
    await user.click(screen.getByRole("button", { name: "Unescape" }));
    expect(output.value).toBe("中A");

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect((input as HTMLTextAreaElement).value).toBe("");
    expect(output.value).toBe("");
  });
});
