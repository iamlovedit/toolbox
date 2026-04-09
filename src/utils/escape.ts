function toHex(value: number, length: number): string {
  return value.toString(16).toUpperCase().padStart(length, "0");
}

function escapeControlCharacter(value: string): string | null {
  switch (value) {
    case "\\":
      return "\\\\";
    case "\"":
      return "\\\"";
    case "\b":
      return "\\b";
    case "\f":
      return "\\f";
    case "\n":
      return "\\n";
    case "\r":
      return "\\r";
    case "\t":
      return "\\t";
    default:
      return null;
  }
}

function escapeUnicodeControlCharacter(value: string): string | null {
  switch (value) {
    case "\\":
      return "\\\\";
    case "\b":
      return "\\b";
    case "\f":
      return "\\f";
    case "\n":
      return "\\n";
    case "\r":
      return "\\r";
    case "\t":
      return "\\t";
    default:
      return null;
  }
}

function unescapeSlashSequence(
  value: string,
  {
    allowHex,
    allowJsonQuote,
  }: {
    allowHex: boolean;
    allowJsonQuote: boolean;
  },
): string {
  let output = "";

  for (let index = 0; index < value.length; index += 1) {
    const current = value[index];
    if (current !== "\\") {
      output += current;
      continue;
    }

    const next = value[index + 1];
    if (!next) {
      throw new Error("Trailing escape sequence.");
    }

    index += 1;
    switch (next) {
      case "\\":
        output += "\\";
        break;
      case "\"":
        if (!allowJsonQuote) {
          throw new Error("Invalid escape sequence.");
        }
        output += "\"";
        break;
      case "/":
        if (!allowJsonQuote) {
          throw new Error("Invalid escape sequence.");
        }
        output += "/";
        break;
      case "b":
        output += "\b";
        break;
      case "f":
        output += "\f";
        break;
      case "n":
        output += "\n";
        break;
      case "r":
        output += "\r";
        break;
      case "t":
        output += "\t";
        break;
      case "u": {
        const hex = value.slice(index + 1, index + 5);
        if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
          throw new Error("Invalid unicode escape.");
        }
        output += String.fromCharCode(Number.parseInt(hex, 16));
        index += 4;
        break;
      }
      case "x": {
        if (!allowHex) {
          throw new Error("Invalid escape sequence.");
        }
        const hex = value.slice(index + 1, index + 3);
        if (!/^[0-9a-fA-F]{2}$/.test(hex)) {
          throw new Error("Invalid hex escape.");
        }
        output += String.fromCharCode(Number.parseInt(hex, 16));
        index += 2;
        break;
      }
      default:
        throw new Error("Invalid escape sequence.");
    }
  }

  return output;
}

export function escapeJsonString(value: string): string {
  let output = "";

  for (const character of value) {
    const escaped = escapeControlCharacter(character);
    if (escaped) {
      output += escaped;
      continue;
    }

    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint < 0x20) {
      output += `\\u${toHex(codePoint, 4)}`;
      continue;
    }

    output += character;
  }

  return output;
}

export function unescapeJsonString(value: string): string {
  return unescapeSlashSequence(value, {
    allowHex: false,
    allowJsonQuote: true,
  });
}

export function escapeHtmlEntities(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function unescapeHtmlEntities(value: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

export function escapeUnicodeString(value: string): string {
  let output = "";

  for (const character of value) {
    const escaped = escapeUnicodeControlCharacter(character);
    if (escaped) {
      output += escaped;
      continue;
    }

    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint >= 0x20 && codePoint <= 0x7e) {
      output += character;
      continue;
    }

    if (codePoint <= 0xffff) {
      output += `\\u${toHex(codePoint, 4)}`;
      continue;
    }

    const normalized = codePoint - 0x10000;
    const high = 0xd800 + (normalized >> 10);
    const low = 0xdc00 + (normalized & 0x3ff);
    output += `\\u${toHex(high, 4)}\\u${toHex(low, 4)}`;
  }

  return output;
}

export function unescapeUnicodeString(value: string): string {
  return unescapeSlashSequence(value, {
    allowHex: true,
    allowJsonQuote: false,
  });
}
