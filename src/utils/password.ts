export interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

const RAW_CHARSETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/",
} as const;

const AMBIGUOUS = /[O0oIl1|]/g;

function normalizeCharset(value: string, excludeAmbiguous: boolean): string {
  return excludeAmbiguous ? value.replace(AMBIGUOUS, "") : value;
}

function getRandomIndex(max: number): number {
  if (!Number.isInteger(max) || max <= 0) {
    throw new Error("Character set must not be empty.");
  }

  const maxUint32 = 0x100000000;
  const cutoff = maxUint32 - (maxUint32 % max);
  const buffer = new Uint32Array(1);

  while (true) {
    window.crypto.getRandomValues(buffer);
    if (buffer[0] < cutoff) {
      return buffer[0] % max;
    }
  }
}

function pickCharacter(charset: string): string {
  return charset[getRandomIndex(charset.length)] ?? "";
}

function shuffleCharacters(characters: string[]): string[] {
  const result = [...characters];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = getRandomIndex(index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex]!, result[index]!];
  }

  return result;
}

export function getPasswordCharsets(options: PasswordOptions): string[] {
  const charsets: string[] = [];

  if (options.uppercase) {
    charsets.push(normalizeCharset(RAW_CHARSETS.uppercase, options.excludeAmbiguous));
  }

  if (options.lowercase) {
    charsets.push(normalizeCharset(RAW_CHARSETS.lowercase, options.excludeAmbiguous));
  }

  if (options.numbers) {
    charsets.push(normalizeCharset(RAW_CHARSETS.numbers, options.excludeAmbiguous));
  }

  if (options.symbols) {
    charsets.push(normalizeCharset(RAW_CHARSETS.symbols, options.excludeAmbiguous));
  }

  return charsets.filter(Boolean);
}

export function generatePassword(options: PasswordOptions): string {
  const charsets = getPasswordCharsets(options);

  if (charsets.length === 0) {
    throw new Error("Select at least one character group.");
  }

  if (!Number.isInteger(options.length) || options.length < charsets.length) {
    throw new Error("Length is too short for the selected character groups.");
  }

  const combined = charsets.join("");
  const characters = charsets.map((charset) => pickCharacter(charset));

  while (characters.length < options.length) {
    characters.push(pickCharacter(combined));
  }

  return shuffleCharacters(characters).join("");
}

export function describePasswordProfile(options: PasswordOptions): string[] {
  const labels: string[] = [];

  if (options.uppercase) {
    labels.push("A-Z");
  }
  if (options.lowercase) {
    labels.push("a-z");
  }
  if (options.numbers) {
    labels.push("0-9");
  }
  if (options.symbols) {
    labels.push("#?!");
  }

  return labels;
}
