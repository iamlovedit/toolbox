import type { AesPackagePayload, ParsedAesPackage } from "@/types";
import {
  arrayBufferToPem,
  base64ToBytes,
  bufferToHex,
  bytesToBase64,
} from "@/utils/encoding";

export const DEFAULT_AES_ITERATIONS = 150000;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

export async function deriveAesKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: toArrayBuffer(salt),
      iterations,
      hash: "SHA-256",
    },
    baseKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"],
  );
}

export function parseAesPackage(rawText: string): ParsedAesPackage {
  const parsed = JSON.parse(rawText) as Partial<AesPackagePayload>;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Cipher package must be a JSON object.");
  }

  const iterations = Number(parsed.iterations);
  if (!Number.isInteger(iterations) || iterations < 1000) {
    throw new Error("Cipher package is missing a valid iterations value.");
  }

  if (
    typeof parsed.salt !== "string" ||
    typeof parsed.iv !== "string" ||
    typeof parsed.ciphertext !== "string"
  ) {
    throw new Error(
      "Cipher package must contain base64 salt, iv, and ciphertext fields.",
    );
  }

  return {
    version: parsed.version ?? 1,
    alg: parsed.alg ?? "AES-GCM",
    iterations,
    salt: base64ToBytes(parsed.salt),
    iv: base64ToBytes(parsed.iv),
    ciphertext: base64ToBytes(parsed.ciphertext),
  };
}

export async function encryptAesPackage(
  passphrase: string,
  plaintext: string,
  iterations: number,
): Promise<AesPackagePayload> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(passphrase, salt, iterations);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    encoder.encode(plaintext),
  );

  return {
    version: 1,
    alg: "AES-GCM",
    kdf: "PBKDF2",
    hash: "SHA-256",
    iterations,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
  };
}

export async function decryptAesPackage(
  passphrase: string,
  rawText: string,
): Promise<{ plaintext: string; parsed: ParsedAesPackage }> {
  const parsed = parseAesPackage(rawText);
  const key = await deriveAesKey(passphrase, parsed.salt, parsed.iterations);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(parsed.iv) },
    key,
    toArrayBuffer(parsed.ciphertext),
  );

  return {
    plaintext: decoder.decode(decrypted),
    parsed,
  };
}

export async function digestSha256Text(value: string): Promise<string> {
  const data = encoder.encode(value);
  const buffer = await window.crypto.subtle.digest("SHA-256", data);
  return bufferToHex(buffer);
}

export async function generateRsaPemKeyPair(modulusLength: number): Promise<{
  publicPem: string;
  privatePem: string;
  fingerprint: string;
}> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  );

  const [spki, pkcs8] = await Promise.all([
    window.crypto.subtle.exportKey("spki", keyPair.publicKey),
    window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey),
  ]);

  const digest = await window.crypto.subtle.digest("SHA-256", spki);

  return {
    publicPem: arrayBufferToPem(spki, "PUBLIC KEY"),
    privatePem: arrayBufferToPem(pkcs8, "PRIVATE KEY"),
    fingerprint: (bufferToHex(digest).slice(0, 32).match(/.{1,2}/g) ?? []).join(
      ":",
    ),
  };
}
