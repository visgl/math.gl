// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {decimalToBinary} from './decimal-to-binary';
import {parseDecimal} from './utf8-utils';

// Decimal powers through 10^22 are exactly representable as binary64.
const EXACT_DECIMAL_POWERS = [
  1, 1e1, 1e2, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13, 1e14, 1e15, 1e16, 1e17,
  1e18, 1e19, 1e20, 1e21, 1e22
];

/**
 * Parses a UTF-8 encoded ASCII number with the same result as `Number()` on its text.
 *
 * Accepts the same grammar as {@link parseUTF8Number}. Uses one multiply or divide for short
 * decimals and rounds longer decimals directly from the bytes without materializing a string.
 *
 * @param bytes - UTF-8 byte buffer.
 * @param firstByte - Inclusive start byte offset.
 * @param endByte - Exclusive end byte offset.
 * @returns Parsed number, or `undefined` when parsing fails.
 * @throws RangeError if the byte range is invalid for the buffer.
 */
export function parseUTF8NumberExact(
  bytes: Uint8Array,
  firstByte: number,
  endByte: number
): number | undefined {
  return parseDecimal(bytes, firstByte, endByte, convertExact);
}

function convertExact(
  value: number,
  scale: number,
  digitCount: number,
  bytes: Uint8Array,
  mantissaStart: number,
  mantissaEnd: number
): number {
  // This path uses one correctly rounded operation on exact operands.
  const magnitude = Math.abs(scale);
  if (digitCount <= 15 && magnitude <= 22) {
    const power = EXACT_DECIMAL_POWERS[magnitude]!;
    return scale < 0 ? value / power : value * power;
  }
  return decimalToBinary(bytes, mantissaStart, mantissaEnd, scale);
}
