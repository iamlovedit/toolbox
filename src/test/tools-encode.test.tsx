import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { base64Tool } from "@/tools/Base64Tool";
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

    await user.selectOptions(screen.getByLabelText("Count"), "5");
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
});
