import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { passwordTool } from "@/tools/PasswordTool";
import { renderTool } from "@/test/render";
import { generatePassword } from "@/utils/password";

describe("password tool", () => {
  it("generates a password with the selected profile, copies it, and clears it", async () => {
    const user = userEvent.setup();
    const clipboardSpy = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    const Tool = passwordTool.component;
    renderTool(Tool);

    const lengthField = screen.getByLabelText("Length");
    await user.clear(lengthField);
    await user.type(lengthField, "24");
    await user.click(screen.getByRole("button", { name: "Generate" }));

    const output = screen.getByLabelText("Generated Password") as HTMLTextAreaElement;
    expect(output.value).toHaveLength(24);
    expect(output.value).toMatch(/[A-Z]/);
    expect(output.value).toMatch(/[a-z]/);
    expect(output.value).toMatch(/[0-9]/);
    expect(output.value).toMatch(/[!@#$%^&*()[\]{};:,.?/_+=-]/);

    await user.click(screen.getByRole("button", { name: "Copy Password" }));
    await waitFor(() => expect(clipboardSpy).toHaveBeenCalledWith(output.value));

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(output.value).toBe("");
  });

  it("rejects an empty character profile", () => {
    expect(() =>
      generatePassword({
        length: 12,
        uppercase: false,
        lowercase: false,
        numbers: false,
        symbols: false,
        excludeAmbiguous: false,
      }),
    ).toThrow("Select at least one character group.");
  });
});
