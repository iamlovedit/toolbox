import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { AppShellProvider } from "@/contexts/AppShellContext";
import { toolIds, toolMap } from "@/tools/registry";
import { DEFAULT_TOOL_ID } from "@/utils/routing";

function ToolRoute(): JSX.Element {
  const params = useParams<{ toolId: string }>();
  const toolId = params.toolId;
  const activeTool = toolId ? toolMap.get(toolId as never) : undefined;

  if (!activeTool) {
    return <Navigate to={`/tools/${DEFAULT_TOOL_ID}`} replace />;
  }

  return <AppShell activeTool={activeTool} />;
}

export default function App(): JSX.Element {
  return (
    <AppShellProvider>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={`/tools/${DEFAULT_TOOL_ID}`} replace />}
        />
        <Route path="/tools/:toolId" element={<ToolRoute />} />
        <Route
          path="*"
          element={<Navigate to={`/tools/${DEFAULT_TOOL_ID}`} replace />}
        />
      </Routes>
    </AppShellProvider>
  );
}
