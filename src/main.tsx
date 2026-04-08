import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "@/App";
import { toolIds } from "@/tools/registry";
import { normalizeLegacyHashRoute } from "@/utils/routing";
import "@/styles/base.css";
import "@/styles/theme.css";
import "@/styles/components.css";
import "@/styles/effects.css";

normalizeLegacyHashRoute(toolIds);

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
