import type { ToolDefinition, ToolId } from "@/types";
import { aesTool } from "@/tools/AesTool";
import { base64Tool } from "@/tools/Base64Tool";
import { baseTool } from "@/tools/BaseTool";
import { caseTool } from "@/tools/CaseTool";
import { colorTool } from "@/tools/ColorTool";
import { diffTool } from "@/tools/DiffTool";
import { escapeTool } from "@/tools/EscapeTool";
import { hashTool } from "@/tools/HashTool";
import { jsonTool } from "@/tools/JsonTool";
import { jwtTool } from "@/tools/JwtTool";
import { passwordTool } from "@/tools/PasswordTool";
import { queryTool } from "@/tools/QueryTool";
import { regexTool } from "@/tools/RegexTool";
import { rsaTool } from "@/tools/RsaTool";
import { timestampTool } from "@/tools/TimestampTool";
import { urlTool } from "@/tools/UrlTool";
import { uuidTool } from "@/tools/UuidTool";
import { yamlTool } from "@/tools/YamlTool";

export const tools: ToolDefinition[] = [
  base64Tool,
  urlTool,
  escapeTool,
  colorTool,
  baseTool,
  hashTool,
  aesTool,
  rsaTool,
  jsonTool,
  queryTool,
  yamlTool,
  jwtTool,
  timestampTool,
  regexTool,
  passwordTool,
  uuidTool,
  diffTool,
  caseTool,
];

export const toolIds = tools.map((tool) => tool.id) as ToolId[];

export const toolMap = new Map<ToolId, ToolDefinition>(
  tools.map((tool) => [tool.id, tool]),
);
