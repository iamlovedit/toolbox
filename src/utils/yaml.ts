import { parse, stringify } from "yaml";

export function jsonToYamlString(value: string): string {
  const parsed = JSON.parse(value);
  return stringify(parsed).trimEnd();
}

export function yamlToJsonString(value: string): string {
  const parsed = parse(value);
  return JSON.stringify(parsed ?? null, null, 2);
}
