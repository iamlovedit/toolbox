import { useMemo, useRef, useState } from "react";
import { useAppShell } from "@/contexts/AppShellContext";
import { getStatusClassName, requireFilledField } from "@/tools/helpers";
import {
  DEFAULT_AES_ITERATIONS,
  decryptAesPackage,
  encryptAesPackage,
  parseAesPackage,
} from "@/utils/crypto";
import type { StatusTone, ToolDefinition } from "@/types";

const copy = {
  en: {
    name: "AES Vault",
    description: "Encrypt or decrypt text with AES-GCM using a passphrase-derived key package.",
    hint: "Enter a passphrase, then encrypt plaintext into a portable JSON package.",
    controlDeck: "Control Deck",
    passphrase: "Passphrase",
    passphrasePlaceholder: "Enter passphrase for encryption or decryption...",
    iterationsLabel: "PBKDF2 Iterations",
    encrypt: "Encrypt To Package",
    decrypt: "Decrypt To Plaintext",
    copyPackage: "Copy Package",
    copyPlaintext: "Copy Plaintext",
    clear: "Clear",
    initialStatus:
      "AES-GCM package stores salt and IV alongside ciphertext. The passphrase is never persisted.",
    plaintext: "Plaintext",
    sourceText: "Source Text",
    plaintextPlaceholder: "Type or paste plaintext here...",
    cipherPackage: "Cipher Package",
    packageLabel: "Portable JSON Package",
    packageSummary: "Package Summary",
    metadata: "Resolved Metadata",
    version: "Version",
    algorithm: "Algorithm",
    iterations: "Iterations",
    saltBytes: "Salt Bytes",
    ivBytes: "IV Bytes",
    cipherBytes: "Cipher Bytes",
    algSummary: "AES-GCM / PBKDF2",
    bytesLabel: "bytes",
    passphraseRequired: "Passphrase is required.",
    packageMustBeObject: "Cipher package must be a JSON object.",
    invalidIterations: "Cipher package is missing a valid iterations value.",
    invalidFields: "Cipher package must contain base64 salt, iv, and ciphertext fields.",
    encryptedStatus: "Plaintext encrypted into AES-GCM package.",
    encryptedHint: "AES-GCM package generated locally.",
    encryptedToast: "AES package generated.",
    decryptedStatus: "Cipher package decrypted successfully.",
    decryptedHint: "AES-GCM package decrypted back to plaintext.",
    decryptedToast: "AES package decrypted.",
    encryptionFailed: "AES encryption failed.",
    decryptionFailed: "AES decryption failed. Check the passphrase and package.",
    encryptionFailedToast: "AES encryption failed.",
    decryptionFailedToast: "AES decryption failed.",
    packageCopied: "AES package copied.",
    plaintextCopied: "Plaintext copied.",
    clearedStatus: "AES workspace cleared.",
    clearedHint: "AES workspace cleared. Awaiting passphrase and payload.",
  },
  zh: {
    name: "AES 保险库",
    description: "通过口令派生密钥，使用 AES-GCM 对文本进行本地加解密。",
    hint: "输入口令后，把明文加密为可携带的 JSON 数据包。",
    controlDeck: "控制台",
    passphrase: "口令",
    passphrasePlaceholder: "输入用于加密或解密的口令...",
    iterationsLabel: "PBKDF2 迭代次数",
    encrypt: "加密为数据包",
    decrypt: "解密为明文",
    copyPackage: "复制数据包",
    copyPlaintext: "复制明文",
    clear: "清空",
    initialStatus: "AES-GCM 数据包会同时保存 salt 和 IV，口令不会被持久化。",
    plaintext: "明文",
    sourceText: "源文本",
    plaintextPlaceholder: "在这里输入或粘贴明文...",
    cipherPackage: "密文数据包",
    packageLabel: "可携带的 JSON 数据包",
    packageSummary: "数据包摘要",
    metadata: "解析后的元数据",
    version: "版本",
    algorithm: "算法",
    iterations: "迭代次数",
    saltBytes: "Salt 字节数",
    ivBytes: "IV 字节数",
    cipherBytes: "密文字节数",
    algSummary: "AES-GCM / PBKDF2",
    bytesLabel: "字节",
    passphraseRequired: "必须输入口令。",
    packageMustBeObject: "密文数据包必须是 JSON 对象。",
    invalidIterations: "密文数据包缺少合法的 iterations 值。",
    invalidFields: "密文数据包必须包含 base64 格式的 salt、iv 和 ciphertext 字段。",
    encryptedStatus: "明文已加密为 AES-GCM 数据包。",
    encryptedHint: "已在本地生成 AES-GCM 数据包。",
    encryptedToast: "AES 数据包已生成。",
    decryptedStatus: "密文数据包解密成功。",
    decryptedHint: "AES-GCM 数据包已还原为明文。",
    decryptedToast: "AES 数据包已解密。",
    encryptionFailed: "AES 加密失败。",
    decryptionFailed: "AES 解密失败，请检查口令和数据包。",
    encryptionFailedToast: "AES 加密失败。",
    decryptionFailedToast: "AES 解密失败。",
    packageCopied: "AES 数据包已复制。",
    plaintextCopied: "明文已复制。",
    clearedStatus: "AES 工作区已清空。",
    clearedHint: "AES 工作区已清空，等待口令和输入内容。",
  },
} as const;

const englishErrors = {
  packageMustBeObject: "Cipher package must be a JSON object.",
  invalidIterations: "Cipher package is missing a valid iterations value.",
  invalidFields:
    "Cipher package must contain base64 salt, iv, and ciphertext fields.",
} as const;

function localizeError(
  message: string | undefined,
  text: (typeof copy)["en"] | (typeof copy)["zh"],
): string {
  switch (message) {
    case englishErrors.packageMustBeObject:
      return text.packageMustBeObject;
    case englishErrors.invalidIterations:
      return text.invalidIterations;
    case englishErrors.invalidFields:
      return text.invalidFields;
    default:
      return message ?? text.decryptionFailed;
  }
}

function createEmptySummary(text: (typeof copy)["en"] | (typeof copy)["zh"]) {
  return {
    version: "--",
    alg: text.algSummary,
    iterations: "--",
    saltSize: "--",
    ivSize: "--",
    cipherSize: "--",
  };
}

function AesToolComponent(): JSX.Element {
  const {
    language,
    metric,
    setCommandHint,
    showToast,
    showRequiredFieldDialog,
    copyText,
  } = useAppShell();
  const text = copy[language];
  const [passphrase, setPassphrase] = useState("");
  const [iterations, setIterations] = useState(DEFAULT_AES_ITERATIONS);
  const [plaintext, setPlaintext] = useState("");
  const [cipherPackage, setCipherPackage] = useState("");
  const [status, setStatus] = useState<string>(text.initialStatus);
  const [statusTone, setStatusTone] = useState<StatusTone>("info");
  const passphraseRef = useRef<HTMLInputElement | null>(null);
  const plaintextRef = useRef<HTMLTextAreaElement | null>(null);
  const cipherPackageRef = useRef<HTMLTextAreaElement | null>(null);

  const summary = useMemo(() => {
    if (!cipherPackage.trim()) {
      return createEmptySummary(text);
    }

    try {
      const parsed = parseAesPackage(cipherPackage);
      return {
        version: String(parsed.version),
        alg: `${parsed.alg} / PBKDF2`,
        iterations: String(parsed.iterations),
        saltSize: `${parsed.salt.byteLength} ${text.bytesLabel}`,
        ivSize: `${parsed.iv.byteLength} ${text.bytesLabel}`,
        cipherSize: `${parsed.ciphertext.byteLength} ${text.bytesLabel}`,
      };
    } catch {
      return createEmptySummary(text);
    }
  }, [cipherPackage, text]);

  return (
    <div className="stack-grid">
      <section className="panel panel-block">
        <div className="panel__header">
          <h3 className="panel__title">{text.controlDeck}</h3>
          <div className="panel__meta">AES-GCM / PBKDF2</div>
        </div>
        <div className="tool-grid">
          <label className="field">
            <span>{text.passphrase}</span>
            <input
              ref={passphraseRef}
              type="password"
              value={passphrase}
              placeholder={text.passphrasePlaceholder}
              onChange={(event) => setPassphrase(event.target.value)}
            />
          </label>
          <label className="field">
            <span>{text.iterationsLabel}</span>
            <select
              value={iterations}
              onChange={(event) => setIterations(Number(event.target.value))}
            >
              <option value="100000">100000</option>
              <option value="150000">150000</option>
              <option value="250000">250000</option>
              <option value="500000">500000</option>
            </select>
          </label>
        </div>
        <div className="action-row">
          <button
            className="button button--primary"
            type="button"
            onClick={async () => {
              if (
                !requireFilledField({
                  value: passphrase,
                  fieldLabel: text.passphrase,
                  focusTarget: passphraseRef.current,
                  showRequiredFieldDialog,
                }) ||
                !requireFilledField({
                  value: plaintext,
                  fieldLabel: text.sourceText,
                  focusTarget: plaintextRef.current,
                  showRequiredFieldDialog,
                })
              ) {
                return;
              }

              try {
                const nextPackage = await encryptAesPackage(
                  passphrase,
                  plaintext,
                  iterations,
                );
                setCipherPackage(JSON.stringify(nextPackage, null, 2));
                setStatus(text.encryptedStatus);
                setStatusTone("success");
                setCommandHint(text.encryptedHint);
                showToast(text.encryptedToast, "success");
              } catch (error) {
                const message =
                  error instanceof Error ? error.message : text.encryptionFailed;
                setStatus(localizeError(message, text));
                setStatusTone("error");
                showToast(text.encryptionFailedToast, "error");
              }
            }}
          >
            {text.encrypt}
          </button>
          <button
            className="button"
            type="button"
            onClick={async () => {
              if (
                !requireFilledField({
                  value: passphrase,
                  fieldLabel: text.passphrase,
                  focusTarget: passphraseRef.current,
                  showRequiredFieldDialog,
                }) ||
                !requireFilledField({
                  value: cipherPackage,
                  fieldLabel: text.packageLabel,
                  focusTarget: cipherPackageRef.current,
                  showRequiredFieldDialog,
                })
              ) {
                return;
              }

              try {
                const decrypted = await decryptAesPackage(passphrase, cipherPackage);
                setPlaintext(decrypted.plaintext);
                setIterations(decrypted.parsed.iterations);
                setStatus(text.decryptedStatus);
                setStatusTone("success");
                setCommandHint(text.decryptedHint);
                showToast(text.decryptedToast, "success");
              } catch (error) {
                const message =
                  error instanceof Error ? error.message : text.decryptionFailed;
                setStatus(localizeError(message, text));
                setStatusTone("error");
                showToast(text.decryptionFailedToast, "error");
              }
            }}
          >
            {text.decrypt}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => copyText(cipherPackage, text.packageCopied)}
          >
            {text.copyPackage}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => copyText(plaintext, text.plaintextCopied)}
          >
            {text.copyPlaintext}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => {
              setPassphrase("");
              setIterations(DEFAULT_AES_ITERATIONS);
              setPlaintext("");
              setCipherPackage("");
              setStatus(text.clearedStatus);
              setStatusTone("info");
              setCommandHint(text.clearedHint);
            }}
          >
            {text.clear}
          </button>
        </div>
        <div className={getStatusClassName(statusTone)}>{status}</div>
      </section>

      <div className="tool-grid">
        <section className="panel panel-block">
          <div className="panel__header">
            <h3 className="panel__title">{text.plaintext}</h3>
            <div className="panel__meta">{metric("chars", plaintext.length)}</div>
          </div>
          <label className="field">
            <span>{text.sourceText}</span>
            <textarea
              ref={plaintextRef}
              value={plaintext}
              placeholder={text.plaintextPlaceholder}
              onChange={(event) => setPlaintext(event.target.value)}
            />
          </label>
        </section>

        <section className="panel panel-block">
          <div className="panel__header">
            <h3 className="panel__title">{text.cipherPackage}</h3>
            <div className="panel__meta">{metric("chars", cipherPackage.length)}</div>
          </div>
          <label className="field">
            <span>{text.packageLabel}</span>
            <textarea
              ref={cipherPackageRef}
              value={cipherPackage}
              placeholder='{"version":1,"alg":"AES-GCM","iterations":150000,"salt":"...","iv":"...","ciphertext":"..."}'
              onChange={(event) => setCipherPackage(event.target.value)}
            />
          </label>
        </section>
      </div>

      <section className="panel panel-block">
        <div className="panel__header">
          <h3 className="panel__title">{text.packageSummary}</h3>
          <div className="panel__meta">{text.metadata}</div>
        </div>
        <div className="kv-grid">
          <div className="kv">
            <span>{text.version}</span>
            <strong>{summary.version}</strong>
          </div>
          <div className="kv">
            <span>{text.algorithm}</span>
            <strong>{summary.alg}</strong>
          </div>
          <div className="kv">
            <span>{text.iterations}</span>
            <strong>{summary.iterations}</strong>
          </div>
          <div className="kv">
            <span>{text.saltBytes}</span>
            <strong>{summary.saltSize}</strong>
          </div>
          <div className="kv">
            <span>{text.ivBytes}</span>
            <strong>{summary.ivSize}</strong>
          </div>
          <div className="kv">
            <span>{text.cipherBytes}</span>
            <strong>{summary.cipherSize}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

export const aesTool: ToolDefinition = {
  id: "aes",
  groupKey: "crypto",
  name: { en: copy.en.name, zh: copy.zh.name },
  badge: "AES",
  description: { en: copy.en.description, zh: copy.zh.description },
  hint: { en: copy.en.hint, zh: copy.zh.hint },
  component: AesToolComponent,
};
