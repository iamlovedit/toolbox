import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderApp } from "@/test/render";

describe("app shell", () => {
  it("redirects / to the default tool and recovers invalid tool routes", () => {
    renderApp("/");
    expect(
      screen.getByRole("heading", { name: "Base64 Matrix" }),
    ).toBeInTheDocument();
  });

  it("switches tools through navigation and marks the active tool", async () => {
    const user = userEvent.setup();
    renderApp("/tools/base64");

    const urlNavLink = screen.getByText("URL Circuit").closest("a");
    expect(urlNavLink).not.toBeNull();

    await user.click(urlNavLink!);

    expect(
      screen.getByRole("heading", { name: "URL Circuit" }),
    ).toBeInTheDocument();
    expect(urlNavLink).toHaveClass("is-active");
  });

  it("switches language, updates the UI, and persists the preference", async () => {
    const user = userEvent.setup();
    const { unmount } = renderApp("/tools/base64");

    await user.click(screen.getByRole("button", { name: "中" }));

    expect(
      screen.getByRole("heading", { name: "Base64 矩阵" }),
    ).toBeInTheDocument();
    expect(screen.getByText("系统信息")).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("zh-CN");
    expect(window.localStorage.getItem("neon-forge-lang")).toBe("zh");

    unmount();

    renderApp("/tools/hash");
    expect(screen.getByRole("heading", { name: "摘要反应堆" })).toBeInTheDocument();
  });

  it("falls back to the default tool for unknown tool ids", () => {
    renderApp("/tools/not-real");
    expect(
      screen.getByRole("heading", { name: "Base64 Matrix" }),
    ).toBeInTheDocument();
  });

  it("shows the cyber dialog for missing input, restores focus, and localizes it", async () => {
    const user = userEvent.setup();
    renderApp("/tools/base64");

    const input = screen.getByLabelText(
      "UTF-8 Payload / Base64 Block",
    ) as HTMLTextAreaElement;

    await user.click(screen.getByRole("button", { name: "Encode" }));
    expect(
      screen.getByRole("dialog", { name: "Missing Input" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Please fill in UTF-8 Payload / Base64 Block first."),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(input).toHaveFocus());

    await user.click(screen.getByRole("button", { name: "Encode" }));
    await user.click(screen.getByTestId("cyber-dialog-backdrop"));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(input).toHaveFocus());

    await user.click(screen.getByRole("button", { name: "Encode" }));
    await user.click(screen.getByRole("button", { name: "OK" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(input).toHaveFocus());

    await user.click(screen.getByRole("button", { name: "中" }));
    await user.click(screen.getByRole("button", { name: "编码" }));
    expect(screen.getByRole("dialog", { name: "输入缺失" })).toBeInTheDocument();
    expect(
      screen.getByText("请先填写UTF-8 文本 / Base64 数据块。"),
    ).toBeInTheDocument();
  });
});
