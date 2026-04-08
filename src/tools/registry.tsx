import type { ToolDefinition, ToolId } from "@/types";
import { aesTool } from "@/tools/AesTool";
import { base64Tool } from "@/tools/Base64Tool";
import { hashTool } from "@/tools/HashTool";
import { jsonTool } from "@/tools/JsonTool";
import { jwtTool } from "@/tools/JwtTool";
import { passwordTool } from "@/tools/PasswordTool";
import { rsaTool } from "@/tools/RsaTool";
import { timestampTool } from "@/tools/TimestampTool";
import { urlTool } from "@/tools/UrlTool";
import { uuidTool } from "@/tools/UuidTool";

export const tools: ToolDefinition[] = [
  base64Tool,
  urlTool,
  hashTool,
  aesTool,
  rsaTool,
  jsonTool,
  jwtTool,
  timestampTool,
  passwordTool,
  uuidTool,
];

export const toolIds = tools.map((tool) => tool.id) as ToolId[];

export const toolMap = new Map<ToolId, ToolDefinition>(
  tools.map((tool) => [tool.id, tool]),
);
