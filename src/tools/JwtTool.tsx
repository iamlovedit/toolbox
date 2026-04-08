import { useRef, useState } from "react";
import { useAppShell } from "@/contexts/AppShellContext";
import { getStatusClassName, requireFilledField } from "@/tools/helpers";
import {
  decodeJwtSegment,
  formatJwtClaimTime,
  formatJwtClaimValue,
} from "@/utils/jwt";
import type { StatusTone, ToolDefinition } from "@/types";

interface ClaimsState {
  alg: string;
  typ: string;
  iss: string;
  aud: string;
  sub: string;
  exp: string;
  iat: string;
  nbf: string;
  signature: string;
}

const emptyClaims: ClaimsState = {
  alg: "--",
  typ: "--",
  iss: "--",
  aud: "--",
  sub: "--",
  exp: "--",
  iat: "--",
  nbf: "--",
  signature: "--",
};

const copy = {
  en: {
    name: "JWT Scope",
    description: "Decode JWT headers and claims locally. This tool does not verify signatures.",
    hint: "Paste a JWT to inspect its header, payload, and claim timestamps.",
    tokenInput: "Token Input",
    decodeOnly: "Decode Only",
    token: "JWT",
    tokenPlaceholder: "eyJhbGciOi...",
    decode: "Decode",
    copyHeader: "Copy Header",
    copyPayload: "Copy Payload",
    clear: "Clear",
    initialStatus:
      "This view only decodes the token. It does not verify signature validity, issuer trust, or audience rules.",
    header: "Header",
    payload: "Payload",
    headerPlaceholder: "Decoded JWT header appears here...",
    payloadPlaceholder: "Decoded JWT payload appears here...",
    decodedHeader: "Decoded Header",
    decodedPayload: "Decoded Payload",
    claimSnapshot: "Claim Snapshot",
    summaryMeta: "Header + Payload Summary",
    algorithm: "Algorithm",
    type: "Type",
    issuer: "Issuer",
    audience: "Audience",
    subject: "Subject",
    expiration: "Expiration",
    issuedAt: "Issued At",
    notBefore: "Not Before",
    signatureSegment: "Signature Segment",
    invalidStructure: "JWT must contain 2 or 3 dot-separated segments.",
    decodedStatus: "JWT decoded successfully. Signature remains unverified.",
    decodedHint: "JWT header and payload decoded locally.",
    decodedToast: "JWT decoded.",
    failedStatus: "JWT decode failed.",
    failedToast: "JWT decode failed.",
    headerCopied: "JWT header copied.",
    payloadCopied: "JWT payload copied.",
    clearedStatus: "JWT workspace cleared.",
    clearedHint: "JWT workspace cleared. Awaiting token.",
    signatureMissing: "Missing or detached",
    signatureChars(length: number) {
      return `${length} chars`;
    },
  },
  zh: {
    name: "JWT 观测镜",
    description: "在本地解码 JWT 的头部和声明信息。此工具不会校验签名。",
    hint: "粘贴 JWT，查看其 header、payload 和时间类声明。",
    tokenInput: "令牌输入",
    decodeOnly: "仅解码",
    token: "JWT",
    tokenPlaceholder: "eyJhbGciOi...",
    decode: "解码",
    copyHeader: "复制头部",
    copyPayload: "复制载荷",
    clear: "清空",
    initialStatus:
      "这里只做令牌解码，不会校验签名真伪、发行者可信度或 audience 规则。",
    header: "头部",
    payload: "载荷",
    headerPlaceholder: "解码后的 JWT 头部会显示在这里...",
    payloadPlaceholder: "解码后的 JWT 载荷会显示在这里...",
    decodedHeader: "解码后的 Header",
    decodedPayload: "解码后的 Payload",
    claimSnapshot: "声明快照",
    summaryMeta: "Header 与 Payload 摘要",
    algorithm: "算法",
    type: "类型",
    issuer: "签发者",
    audience: "受众",
    subject: "主题",
    expiration: "过期时间",
    issuedAt: "签发时间",
    notBefore: "生效时间",
    signatureSegment: "签名段",
    invalidStructure: "JWT 必须包含 2 或 3 个由点分隔的片段。",
    decodedStatus: "JWT 解码成功，但签名仍未校验。",
    decodedHint: "JWT 的 header 和 payload 已在本地解码。",
    decodedToast: "JWT 已解码。",
    failedStatus: "JWT 解码失败。",
    failedToast: "JWT 解码失败。",
    headerCopied: "JWT 头部已复制。",
    payloadCopied: "JWT 载荷已复制。",
    clearedStatus: "JWT 工作区已清空。",
    clearedHint: "JWT 工作区已清空，等待令牌输入。",
    signatureMissing: "缺失或已分离",
    signatureChars(length: number) {
      return `${length} 字符`;
    },
  },
} as const;

function JwtToolComponent(): JSX.Element {
  const {
    language,
    metric,
    setCommandHint,
    showToast,
    showRequiredFieldDialog,
    copyText,
  } = useAppShell();
  const text = copy[language];
  const [token, setToken] = useState("");
  const [header, setHeader] = useState("");
  const [payload, setPayload] = useState("");
  const [claims, setClaims] = useState<ClaimsState>(emptyClaims);
  const [status, setStatus] = useState<string>(text.initialStatus);
  const [statusTone, setStatusTone] = useState<StatusTone>("info");
  const tokenRef = useRef<HTMLTextAreaElement | null>(null);

  return (
    <div className="stack-grid">
      <section className="panel panel-block">
        <div className="panel__header">
          <h3 className="panel__title">{text.tokenInput}</h3>
          <div className="panel__meta">{text.decodeOnly}</div>
        </div>
        <label className="field">
          <span>{text.token}</span>
          <textarea
            ref={tokenRef}
            value={token}
            placeholder={text.tokenPlaceholder}
            onChange={(event) => setToken(event.target.value)}
          />
        </label>
        <div className="action-row">
          <button
            className="button button--primary"
            type="button"
            onClick={() => {
              if (
                !requireFilledField({
                  value: token,
                  fieldLabel: text.token,
                  focusTarget: tokenRef.current,
                  showRequiredFieldDialog,
                })
              ) {
                return;
              }

              try {
                const segments = token.trim().split(".");
                if (segments.length < 2 || segments.length > 3) {
                  throw new Error(text.invalidStructure);
                }

                const decodedHeader = decodeJwtSegment(segments[0]);
                const decodedPayload = decodeJwtSegment(segments[1]);
                const headerJson = decodedHeader.json ?? {};
                const payloadJson = decodedPayload.json ?? {};

                setHeader(decodedHeader.formatted);
                setPayload(decodedPayload.formatted);
                setClaims({
                  alg: formatJwtClaimValue(headerJson.alg),
                  typ: formatJwtClaimValue(headerJson.typ),
                  iss: formatJwtClaimValue(payloadJson.iss),
                  aud: formatJwtClaimValue(payloadJson.aud),
                  sub: formatJwtClaimValue(payloadJson.sub),
                  exp: formatJwtClaimTime(Number(payloadJson.exp)),
                  iat: formatJwtClaimTime(Number(payloadJson.iat)),
                  nbf: formatJwtClaimTime(Number(payloadJson.nbf)),
                  signature: segments[2]
                    ? text.signatureChars(segments[2].length)
                    : text.signatureMissing,
                });
                setStatus(text.decodedStatus);
                setStatusTone("success");
                setCommandHint(text.decodedHint);
                showToast(text.decodedToast, "success");
              } catch (error) {
                setHeader("");
                setPayload("");
                setClaims(emptyClaims);
                setStatus(
                  error instanceof Error ? error.message : text.failedStatus,
                );
                setStatusTone("error");
                showToast(text.failedToast, "error");
              }
            }}
          >
            {text.decode}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => copyText(header, text.headerCopied)}
          >
            {text.copyHeader}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => copyText(payload, text.payloadCopied)}
          >
            {text.copyPayload}
          </button>
          <button
            className="button"
            type="button"
            onClick={() => {
              setToken("");
              setHeader("");
              setPayload("");
              setClaims(emptyClaims);
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
            <h3 className="panel__title">{text.header}</h3>
            <div className="panel__meta">{metric("chars", header.length)}</div>
          </div>
          <label className="field">
            <span>{text.decodedHeader}</span>
            <textarea readOnly value={header} placeholder={text.headerPlaceholder} />
          </label>
        </section>

        <section className="panel panel-block">
          <div className="panel__header">
            <h3 className="panel__title">{text.payload}</h3>
            <div className="panel__meta">{metric("chars", payload.length)}</div>
          </div>
          <label className="field">
            <span>{text.decodedPayload}</span>
            <textarea
              readOnly
              value={payload}
              placeholder={text.payloadPlaceholder}
            />
          </label>
        </section>
      </div>

      <section className="panel panel-block">
        <div className="panel__header">
          <h3 className="panel__title">{text.claimSnapshot}</h3>
          <div className="panel__meta">{text.summaryMeta}</div>
        </div>
        <div className="kv-grid">
          <div className="kv">
            <span>{text.algorithm}</span>
            <strong>{claims.alg}</strong>
          </div>
          <div className="kv">
            <span>{text.type}</span>
            <strong>{claims.typ}</strong>
          </div>
          <div className="kv">
            <span>{text.issuer}</span>
            <strong>{claims.iss}</strong>
          </div>
          <div className="kv">
            <span>{text.audience}</span>
            <strong>{claims.aud}</strong>
          </div>
          <div className="kv">
            <span>{text.subject}</span>
            <strong>{claims.sub}</strong>
          </div>
          <div className="kv">
            <span>{text.expiration}</span>
            <strong>{claims.exp}</strong>
          </div>
          <div className="kv">
            <span>{text.issuedAt}</span>
            <strong>{claims.iat}</strong>
          </div>
          <div className="kv">
            <span>{text.notBefore}</span>
            <strong>{claims.nbf}</strong>
          </div>
          <div className="kv">
            <span>{text.signatureSegment}</span>
            <strong>{claims.signature}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

export const jwtTool: ToolDefinition = {
  id: "jwt",
  groupKey: "parser",
  name: { en: copy.en.name, zh: copy.zh.name },
  badge: "JWT",
  description: { en: copy.en.description, zh: copy.zh.description },
  hint: { en: copy.en.hint, zh: copy.zh.hint },
  component: JwtToolComponent,
};
