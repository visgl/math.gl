// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Compare finite rises divided by positive distances, including overflow and rounded ties. */
export function compareTerrainSlopes(a: number, ad: number, b: number, bd: number): number {
  const as = a / ad;
  const bs = b / bd;
  if (as < bs) return -1;
  if (as > bs) return 1;
  if (a === 0 || b === 0 || Math.sign(a) !== Math.sign(b)) return Math.sign(a) - Math.sign(b);
  // Division can round distinct ratios to the same value, zero or infinity.
  // Compare the exact products of their binary64 significands only on that path.
  const bytes = new DataView(new ArrayBuffer(8));
  const parts = (value: number): [bigint, number] => {
    bytes.setFloat64(0, Math.abs(value));
    const bits = bytes.getBigUint64(0);
    const exponent = Number((bits >> 52n) & 0x7ffn);
    const fraction = bits & 0xfffffffffffffn;
    return exponent ? [fraction | 0x10000000000000n, exponent - 1075] : [fraction, -1074];
  };
  const [am, ae] = parts(a),
    [bdm, bde] = parts(bd);
  const [bm, be] = parts(b),
    [adm, ade] = parts(ad);
  let left = am * bdm;
  let right = bm * adm;
  const shift = ae + bde - be - ade;
  if (shift > 0) left <<= BigInt(shift);
  else if (shift < 0) right <<= BigInt(-shift);
  return (left < right ? -1 : left > right ? 1 : 0) * Math.sign(a);
}
