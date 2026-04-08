import type { ComponentType } from "react";

export type Language = "en" | "zh";
export type ToolGroup = "encode" | "crypto" | "parser" | "text";
export type ToolId =
  | "base64"
  | "url"
  | "hash"
  | "aes"
  | "rsa"
  | "json"
  | "jwt"
  | "timestamp"
  | "uuid"
  | "password";

export type MetricName = "chars" | "lines" | "modules";
export type ToastTone = "info" | "success" | "error";
export type StatusTone = ToastTone;
export type DialogTone = "warning" | "error";
export type LocalizedText = string | Record<Language, string>;

export interface ToolDefinition {
  id: ToolId;
  groupKey: ToolGroup;
  badge: string;
  name: LocalizedText;
  description: LocalizedText;
  hint: LocalizedText;
  component: ComponentType;
}

export interface ToastMessage {
  id: number;
  message: string;
  tone: ToastTone;
}

export interface DialogMessage {
  title: string;
  message: string;
  confirmLabel: string;
  tone: DialogTone;
}

export interface AesPackagePayload {
  version: number;
  alg: string;
  kdf: string;
  hash: string;
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
}

export interface ParsedAesPackage {
  version: number;
  alg: string;
  iterations: number;
  salt: Uint8Array;
  iv: Uint8Array;
  ciphertext: Uint8Array;
}
