// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ScaleColor, ScaleColorEncoding} from './scale-types';

type Primaries = ScaleColorEncoding['primaries'];
type Transfer = ScaleColorEncoding['transfer'];

/** D65 linear-RGB to XYZ (CIE 1931) matrices. No output gamut clipping. */
const TO_XYZ: Record<Primaries, readonly number[]> = {
  srgb: [
    0.4124564, 0.3575761, 0.1804375, 0.2126729, 0.7151522, 0.072175, 0.0193339, 0.119192, 0.9503041
  ],
  'display-p3': [
    0.48657095, 0.26566769, 0.19821729, 0.22897456, 0.69173852, 0.07928691, 0, 0.04511338,
    1.04394437
  ],
  rec2020: [
    0.63695805, 0.1446169, 0.16888098, 0.26270021, 0.67799807, 0.05930172, 0, 0.02807269, 1.06098506
  ]
};
const FROM_XYZ: Record<Primaries, readonly number[]> = {
  srgb: [
    3.2404542, -1.5371385, -0.4985314, -0.969266, 1.8760108, 0.041556, 0.0556434, -0.2040259,
    1.0572252
  ],
  'display-p3': [
    2.49349691, -0.93138362, -0.40271078, -0.82948897, 1.76266406, 0.02362469, 0.03584583,
    -0.07617239, 0.95688452
  ],
  rec2020: [
    1.71665119, -0.35567078, -0.25336628, -0.66668435, 1.61648124, 0.01576855, 0.01763986,
    -0.04277061, 0.94210312
  ]
};

function transform(m: readonly number[], [r, g, b]: readonly number[]): [number, number, number] {
  return [
    m[0]! * r + m[1]! * g + m[2]! * b,
    m[3]! * r + m[4]! * g + m[5]! * b,
    m[6]! * r + m[7]! * g + m[8]! * b
  ];
}

/** Signed extension of the sRGB transfer curve, preserving extended-range RGB values. */
export function decodeSRGB(v: number): number {
  const x = Math.abs(v);
  return Math.sign(v) * (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
}
export function encodeSRGB(v: number): number {
  const x = Math.abs(v);
  return Math.sign(v) * (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
}

function decode(v: number, transfer: Transfer): number {
  if (transfer === 'linear') return v;
  if (transfer === 'srgb') return decodeSRGB(v);
  throw new Error(`Transfer ${transfer} requires an explicit HDR display-referred conversion`);
}
function encode(v: number, transfer: Transfer): number {
  if (transfer === 'linear') return v;
  if (transfer === 'srgb') return encodeSRGB(v);
  throw new Error(`Transfer ${transfer} requires an explicit HDR display-referred conversion`);
}

/** Converts RGB primaries and sRGB/linear transfer without tone mapping or clipping. */
export function convertScaleColor(
  color: ScaleColor,
  from: ScaleColorEncoding,
  to: ScaleColorEncoding
): ScaleColor {
  if (color.some(channel => !Number.isFinite(channel))) {
    throw new Error('Color channels must be finite');
  }
  if (
    from.transfer === 'pq' ||
    from.transfer === 'hlg' ||
    to.transfer === 'pq' ||
    to.transfer === 'hlg'
  ) {
    throw new Error('PQ/HLG conversions require explicit luminance and display assumptions');
  }
  const linear = color.slice(0, 3).map(v => decode(v, from.transfer));
  const converted =
    from.primaries === to.primaries
      ? linear
      : transform(FROM_XYZ[to.primaries], transform(TO_XYZ[from.primaries], linear));
  return [
    encode(converted[0]!, to.transfer),
    encode(converted[1]!, to.transfer),
    encode(converted[2]!, to.transfer),
    color[3]
  ];
}

/** IEEE-754 binary16 packing with round-to-nearest, ties-to-even. */
export function packFloat16(value: number): number {
  const sign = value < 0 || Object.is(value, -0) ? 0x8000 : 0;
  const magnitude = Math.abs(value);
  if (Number.isNaN(magnitude)) return 0x7e00;
  if (magnitude >= 65520) return sign | 0x7c00;
  if (magnitude <= 2 ** -25) return sign;

  const exponent = Math.max(-14, Math.floor(Math.log2(magnitude)));
  const scaled = magnitude * 2 ** (10 - exponent);
  const lower = Math.floor(scaled);
  const fraction = scaled - lower;
  const significand = lower + (fraction > 0.5 || (fraction === 0.5 && lower % 2) ? 1 : 0);
  return sign | (((exponent + 14) << 10) + significand);
}

/** IEEE-754 binary16 decode into a JavaScript number. */
export function unpackFloat16(bits: number): number {
  const sign = bits & 0x8000 ? -1 : 1;
  const exp = (bits >>> 10) & 31;
  const mantissa = bits & 1023;
  if (exp === 0) return sign * mantissa * 2 ** -24;
  if (exp === 31) return mantissa ? NaN : sign * Infinity;
  return sign * (1 + mantissa / 1024) * 2 ** (exp - 15);
}

/** Float16 storage words for one unpremultiplied scene-linear RGBA color. */
export function packRGBA16F(color: ScaleColor): Uint16Array {
  return Uint16Array.from(color, packFloat16);
}
