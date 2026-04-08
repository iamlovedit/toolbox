import { useState } from "react";
import { useAppShell } from "@/contexts/AppShellContext";
import { getStatusClassName } from "@/tools/helpers";
import { downloadText } from "@/utils/browser";
import { generateRsaPemKeyPair } from "@/utils/crypto";
import type { StatusTone, ToolDefinition } from "@/types";

const copy = {
  en: {
    name: "RSA Forge",
    description: "Generate RSA-OAEP keypairs in-browser and export them as PEM blocks.",
    hint: "Generate a local RSA keypair without sending secrets anywhere.",
    keyControls: "Key Controls",
    webCrypto: "Web Crypto",
    modulusLength: "Modulus Length",
    algorithmProfile: "Algorithm Profile",
    generate: "Generate Keypair",
    copyPublic: "Copy Public",
    copyPrivate: "Copy Private",
    download: "Download Bundle",
    initialStatus: "Keys are generated and kept in memory only until you close the page.",
    busyStatus: "Generating RSA keypair locally. Larger modulus sizes take longer.",
    publicFingerprint: "Public Fingerprint",
    pemExport: "PEM Export",
    storage: "Storage",
    browserMemoryOnly: "Browser Memory Only",
    publicKey: "Public Key",
    privateKey: "Private Key",
    publicMeta: "SPKI PEM",
    privateMeta: "PKCS8 PEM",
    publicBlock: "Exported Public Block",
    privateBlock: "Exported Private Block",
    publicPlaceholder: "Public key output appears here...",
    privatePlaceholder: "Private key output appears here...",
    publicLabelShort: "public",
    privateLabelShort: "private",
    noKey(label: string) {
      return `No ${label} key available yet.`;
    },
    generated(size: number) {
      return `RSA ${size} keypair generated successfully.`;
    },
    generatedHint(size: number) {
      return `RSA ${size} keypair generated locally.`;
    },
    readyToast: "RSA keypair ready.",
    failedStatus: "RSA generation failed.",
    failedToast: "RSA generation failed.",
    publicCopied: "Public key copied.",
    privateCopied: "Private key copied.",
    downloaded: "PEM bundle downloaded.",
  },
  zh: {
    name: "RSA 锻炉",
    description: "在浏览器里生成 RSA-OAEP 密钥对，并导出为 PEM 文本块。",
    hint: "在本地生成 RSA 密钥对，不把任何秘密发出去。",
    keyControls: "密钥控制",
    webCrypto: "Web Crypto",
    modulusLength: "模数长度",
    algorithmProfile: "算法配置",
    generate: "生成密钥对",
    copyPublic: "复制公钥",
    copyPrivate: "复制私钥",
    download: "下载 PEM 包",
    initialStatus: "密钥仅保存在当前页面内存中，关闭页面后即失效。",
    busyStatus: "正在本地生成 RSA 密钥对，模数越大耗时越久。",
    publicFingerprint: "公钥指纹",
    pemExport: "PEM 导出",
    storage: "存储",
    browserMemoryOnly: "仅浏览器内存",
    publicKey: "公钥",
    privateKey: "私钥",
    publicMeta: "SPKI PEM",
    privateMeta: "PKCS8 PEM",
    publicBlock: "导出的公钥块",
    privateBlock: "导出的私钥块",
    publicPlaceholder: "公钥会显示在这里...",
    privatePlaceholder: "私钥会显示在这里...",
    publicLabelShort: "公钥",
    privateLabelShort: "私钥",
    noKey(label: string) {
      return `当前还没有可用的${label}。`;
    },
    generated(size: number) {
      return `RSA ${size} 密钥对生成成功。`;
    },
    generatedHint(size: number) {
      return `已在本地生成 RSA ${size} 密钥对。`;
    },
    readyToast: "RSA 密钥对已就绪。",
    failedStatus: "RSA 生成失败。",
    failedToast: "RSA 生成失败。",
    publicCopied: "公钥已复制。",
    privateCopied: "私钥已复制。",
    downloaded: "PEM 包已下载。",
  },
} as const;

function RsaToolComponent(): JSX.Element {
  const { language, setCommandHint, showToast, copyText } = useAppShell();
  const text = copy[language];
  const [size, setSize] = useState(2048);
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [fingerprint, setFingerprint] = useState("--");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>(text.initialStatus);
  const [statusTone, setStatusTone] = useState<StatusTone>("info");

  const withExistingKey = async (
    value: string,
    label: string,
    action: () => Promise<void> | void,
  ) => {
    if (!value.trim()) {
      showToast(text.noKey(label), "error");
      return;
    }

    await action();
  };

  return (
    <div className="stack-grid">
      <section className="panel panel-block">
        <div className="panel__header">
          <h3 className="panel__title">{text.keyControls}</h3>
          <div className="panel__meta">{text.webCrypto}</div>
        </div>
        <div className="tool-grid">
          <label className="field">
            <span>{text.modulusLength}</span>
            <select
              value={size}
              onChange={(event) => setSize(Number(event.target.value))}
            >
              <option value="2048">2048</option>
              <option value="3072">3072</option>
              <option value="4096">4096</option>
            </select>
          </label>
          <label className="field">
            <span>{text.algorithmProfile}</span>
            <input readOnly value="RSA-OAEP / SHA-256" />
          </label>
        </div>
        <div className="action-row">
          <button
            className="button button--primary"
            type="button"
            disabled={busy}
            onClick={async () => {
              try {
                setBusy(true);
                setPublicKey("");
                setPrivateKey("");
                setFingerprint("--");
                setStatus(text.busyStatus);
                setStatusTone("info");
                const generated = await generateRsaPemKeyPair(size);
                setPublicKey(generated.publicPem);
                setPrivateKey(generated.privatePem);
                setFingerprint(generated.fingerprint);
                setStatus(text.generated(size));
                setStatusTone("success");
                setCommandHint(text.generatedHint(size));
                showToast(text.readyToast, "success");
              } catch {
                setStatus(text.failedStatus);
                setStatusTone("error");
                showToast(text.failedToast, "error");
              } finally {
                setBusy(false);
              }
            }}
          >
            {text.generate}
          </button>
          <button
            className="button"
            type="button"
            disabled={busy}
            onClick={() =>
              withExistingKey(publicKey, text.publicLabelShort, () =>
                copyText(publicKey, text.publicCopied),
              )
            }
          >
            {text.copyPublic}
          </button>
          <button
            className="button"
            type="button"
            disabled={busy}
            onClick={() =>
              withExistingKey(privateKey, text.privateLabelShort, () =>
                copyText(privateKey, text.privateCopied),
              )
            }
          >
            {text.copyPrivate}
          </button>
          <button
            className="button button--hot"
            type="button"
            disabled={busy}
            onClick={() =>
              withExistingKey(privateKey, text.privateLabelShort, () => {
                const stamp = new Date().toISOString().replace(/[:.]/g, "-");
                downloadText(
                  `neon-forge-rsa-${stamp}.pem`,
                  `${publicKey}\n\n${privateKey}\n`,
                );
                setStatus(text.downloaded);
                setStatusTone("success");
              })
            }
          >
            {text.download}
          </button>
        </div>
        <div className={getStatusClassName(statusTone)}>{status}</div>
        <div className="kv-grid">
          <div className="kv">
            <span>{text.publicFingerprint}</span>
            <strong>{fingerprint}</strong>
          </div>
          <div className="kv">
            <span>{text.pemExport}</span>
            <strong>SPKI / PKCS8</strong>
          </div>
          <div className="kv">
            <span>{text.storage}</span>
            <strong>{text.browserMemoryOnly}</strong>
          </div>
        </div>
      </section>

      <div className="tool-grid">
        <section className="panel panel-block">
          <div className="panel__header">
            <h3 className="panel__title">{text.publicKey}</h3>
            <div className="panel__meta">{text.publicMeta}</div>
          </div>
          <label className="field">
            <span>{text.publicBlock}</span>
            <textarea
              readOnly
              value={publicKey}
              placeholder={text.publicPlaceholder}
            />
          </label>
        </section>

        <section className="panel panel-block">
          <div className="panel__header">
            <h3 className="panel__title">{text.privateKey}</h3>
            <div className="panel__meta">{text.privateMeta}</div>
          </div>
          <label className="field">
            <span>{text.privateBlock}</span>
            <textarea
              readOnly
              value={privateKey}
              placeholder={text.privatePlaceholder}
            />
          </label>
        </section>
      </div>
    </div>
  );
}

export const rsaTool: ToolDefinition = {
  id: "rsa",
  groupKey: "crypto",
  name: { en: copy.en.name, zh: copy.zh.name },
  badge: "RSA",
  description: { en: copy.en.description, zh: copy.zh.description },
  hint: { en: copy.en.hint, zh: copy.zh.hint },
  component: RsaToolComponent,
};
