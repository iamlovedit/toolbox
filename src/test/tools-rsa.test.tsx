import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderTool } from "@/test/render";
import { rsaTool } from "@/tools/RsaTool";
import { downloadText } from "@/utils/browser";
import { generateRsaPemKeyPair } from "@/utils/crypto";

vi.mock("@/utils/crypto", async () => {
  const actual = await vi.importActual<typeof import("@/utils/crypto")>(
    "@/utils/crypto",
  );

  return {
    ...actual,
    generateRsaPemKeyPair: vi.fn().mockResolvedValue({
      publicPem: "-----BEGIN PUBLIC KEY-----\nPUB\n-----END PUBLIC KEY-----",
      privatePem: "-----BEGIN PRIVATE KEY-----\nPRI\n-----END PRIVATE KEY-----",
      fingerprint: "aa:bb:cc",
    }),
  };
});

vi.mock("@/utils/browser", async () => {
  const actual = await vi.importActual<typeof import("@/utils/browser")>(
    "@/utils/browser",
  );

  return {
    ...actual,
    downloadText: vi.fn(),
  };
});

describe("rsa tool", () => {
  it("generates keys, copies them, and downloads the bundle", async () => {
    const user = userEvent.setup();
    const clipboardSpy = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    const Tool = rsaTool.component;
    renderTool(Tool);

    await user.click(screen.getByRole("button", { name: "Generate Keypair" }));

    await waitFor(() =>
      expect(generateRsaPemKeyPair).toHaveBeenCalledWith(2048),
    );
    expect(
      (screen.getByLabelText("Exported Public Block") as HTMLTextAreaElement).value,
    ).toContain("PUBLIC KEY");

    await user.click(screen.getByRole("button", { name: "Copy Public" }));
    await user.click(screen.getByRole("button", { name: "Copy Private" }));

    expect(clipboardSpy).toHaveBeenCalledWith(
      "-----BEGIN PRIVATE KEY-----\nPRI\n-----END PRIVATE KEY-----",
    );

    await user.click(screen.getByRole("button", { name: "Download Bundle" }));
    expect(downloadText).toHaveBeenCalled();
  });
});
