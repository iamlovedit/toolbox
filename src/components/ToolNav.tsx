import { NavLink } from "react-router-dom";
import type { ToolDefinition, ToolGroup, ToolId } from "@/types";
import { useAppShell } from "@/contexts/AppShellContext";

export function ToolNav({
  tools,
  activeToolId,
}: {
  tools: ToolDefinition[];
  activeToolId: ToolId;
}): JSX.Element {
  const { pickText, t } = useAppShell();
  const groups = tools.reduce<Map<ToolGroup, ToolDefinition[]>>((acc, tool) => {
    if (!acc.has(tool.groupKey)) {
      acc.set(tool.groupKey, []);
    }
    acc.get(tool.groupKey)?.push(tool);
    return acc;
  }, new Map());

  return (
    <nav className="tool-nav" aria-label={t("app.navLabel")}>
      {Array.from(groups.entries()).map(([groupKey, groupTools]) => (
        <section key={groupKey} className="tool-nav__group">
          <div className="tool-nav__label">{t(`groups.${groupKey}`)}</div>
          {groupTools.map((tool) => (
            <NavLink
              key={tool.id}
              to={`/tools/${tool.id}`}
              className={`tool-nav__button ${tool.id === activeToolId ? "is-active" : ""}`.trim()}
            >
              <span className="tool-nav__name">{tool.badge}</span>
              <span className="tool-nav__meta">{pickText(tool.name)}</span>
            </NavLink>
          ))}
        </section>
      ))}
    </nav>
  );
}
