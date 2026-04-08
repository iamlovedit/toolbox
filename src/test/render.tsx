import { render } from "@testing-library/react";
import type { ComponentType } from "react";
import { CyberDialog } from "@/components/CyberDialog";
import { ToastStack } from "@/components/ToastStack";
import { MemoryRouter } from "react-router-dom";
import App from "@/App";
import { AppShellProvider } from "@/contexts/AppShellContext";

export function renderApp(initialEntry = "/tools/base64") {
  if (!window.localStorage.getItem("neon-forge-lang")) {
    window.localStorage.setItem("neon-forge-lang", "en");
  }
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>,
  );
}

export function renderTool(Component: ComponentType) {
  if (!window.localStorage.getItem("neon-forge-lang")) {
    window.localStorage.setItem("neon-forge-lang", "en");
  }
  return render(
    <AppShellProvider>
      <Component />
      <ToastStack />
      <CyberDialog />
    </AppShellProvider>,
  );
}
