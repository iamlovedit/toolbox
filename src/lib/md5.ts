const SHIFT_AMOUNTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

const TABLE = Array.from({ length: 64 }, (_, index) =>
  Math.floor(Math.abs(Math.sin(index + 1)) * 2 ** 32) >>> 0,
);

function leftRotate(value: number, shift: number): number {
  return (value << shift) | (value >>> (32 - shift));
}

function toLittleEndianHex(value: number): string {
  return Array.from({ length: 4 }, (_, index) =>
    ((value >>> (index * 8)) & 0xff).toString(16).padStart(2, "0"),
  ).join("");
}

export function md5(message: string): string {
  const source = new TextEncoder().encode(message);
  const originalBitLength = source.length * 8;
  const paddedLength = ((source.length + 9 + 63) >> 6) << 6;
  const buffer = new Uint8Array(paddedLength);
  buffer.set(source);
  buffer[source.length] = 0x80;

  const view = new DataView(buffer.buffer);
  view.setUint32(buffer.length - 8, originalBitLength >>> 0, true);
  view.setUint32(
    buffer.length - 4,
    Math.floor(originalBitLength / 2 ** 32),
    true,
  );

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let offset = 0; offset < buffer.length; offset += 64) {
    const chunk = Array.from({ length: 16 }, (_, index) =>
      view.getUint32(offset + index * 4, true),
    );

    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let index = 0; index < 64; index += 1) {
      let f = 0;
      let g = 0;

      if (index < 16) {
        f = (b & c) | (~b & d);
        g = index;
      } else if (index < 32) {
        f = (d & b) | (~d & c);
        g = (5 * index + 1) % 16;
      } else if (index < 48) {
        f = b ^ c ^ d;
        g = (3 * index + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * index) % 16;
      }

      const nextD = d;
      d = c;
      c = b;
      const rotated = leftRotate(
        (a + f + TABLE[index] + chunk[g]) >>> 0,
        SHIFT_AMOUNTS[index],
      );
      b = (b + rotated) >>> 0;
      a = nextD;
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  return [
    toLittleEndianHex(a0),
    toLittleEndianHex(b0),
    toLittleEndianHex(c0),
    toLittleEndianHex(d0),
  ].join("");
}
