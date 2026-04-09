import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { aesTool } from "@/tools/AesTool";
import { hashTool } from "@/tools/HashTool";
import { renderTool } from "@/test/render";

describe("crypto tools", () => {
  it("digests payloads with md5 and sha-256", async () => {
    const user = userEvent.setup();
    const Tool = hashTool.component;
    renderTool(Tool);

    const input = screen.getByLabelText("Source Text");
    const output = screen.getByLabelText("Hex Output") as HTMLTextAreaElement;

    await user.type(input, "hello");
    await user.click(screen.getByRole("button", { name: "Digest" }));
    expect(output.value).toBe("5d41402abc4b2a76b9719d911017c592");

    await user.selectOptions(screen.getByLabelText("Algorithm"), "sha-256");
    await user.click(screen.getByRole("button", { name: "Digest" }));
    await waitFor(() =>
      expect(output.value).toBe(
        "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
      ),
    );
  });

  it("encrypts AES packages and rejects missing passphrases", async () => {
    const user = userEvent.setup();
    const Tool = aesTool.component;
    renderTool(Tool);

    await user.click(screen.getByRole("button", { name: "Encrypt To Package" }));
    expect(screen.getByRole("dialog", { name: "Missing Input" })).toBeInTheDocument();
    expect(screen.getByText("Please fill in Passphrase first.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "OK" }));

    await user.type(screen.getByLabelText("Passphrase"), "hunter2");
    await user.type(screen.getByLabelText("Source Text"), "secret message");
    await user.selectOptions(screen.getByLabelText("PBKDF2 Iterations"), "100000");
    await user.click(screen.getByRole("button", { name: "Encrypt To Package" }));

    const packageField = screen.getByLabelText(
      "Portable JSON Package",
    ) as HTMLTextAreaElement;
    await waitFor(
      () => expect(packageField.value).toContain('"ciphertext"'),
      { timeout: 5000 },
    );
    expect(screen.getByText("Plaintext encrypted into AES-GCM package.")).toBeInTheDocument();
  });
});
