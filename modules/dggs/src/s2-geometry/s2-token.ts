// math.gl
// SPDX-License-Identifier: MIT and Apache-2.0
// Copyright (c) vis.gl contributors

// s2-geometry is a pure JavaScript port of Google/Niantic's S2 Geometry library
// which is perfect since it works in the browser.

const MAXIMUM_TOKEN_LENGTH = 16;
const MAXIMUM_S2_INDEX = (1n << 64n) - 1n;
const VALID_LOWEST_ON_BITS = 0x1555555555555555n;
const MAXIMUM_LEVEL = 30;

// INDEX CALCULATIONS

/**
 * Given an S2 token (String) this function convert the token to 64 bit id (Index)
 * 'X' is the empty cell
 * https://github.com/google/s2-geometry-library-java/blob/c04b68bf3197a9c34082327eeb3aec7ab7c85da1/src/com/google/common/geometry/S2CellId.java#L439
 */
export function getS2IndexFromToken(token: string): bigint {
  if (token === 'X') {
    return 0n;
  }
  if (!isS2TokenValid(token)) {
    throw new Error(`Invalid S2 token: ${token}`);
  }
  // pad token with zeros to make the length 16
  const paddedToken = token.padEnd(MAXIMUM_TOKEN_LENGTH, '0');
  return BigInt(`0x${paddedToken}`);
}

/**
 * Convert a 64 bit number to a string token
 * 'X' is the empty cell
 */
export function getS2TokenFromIndex(cellId: bigint): string {
  if (cellId === 0n) {
    return 'X';
  }
  if (!isS2IndexValid(cellId)) {
    throw new Error(`Invalid S2 index: ${cellId}`);
  }
  let numZeroDigits = countTrailingZeros(cellId);

  const remainder = numZeroDigits % 4;
  numZeroDigits = (numZeroDigits - remainder) / 4;
  const trailingZeroHexChars = numZeroDigits;
  numZeroDigits *= 4;

  const x = cellId >> BigInt(numZeroDigits);
  const hexString = x.toString(16).replace(/0+$/, '');
  const zeroString = Array(17 - trailingZeroHexChars - hexString.length).join('0');
  return zeroString + hexString;
}

/**
 * Returns whether a value is a valid non-empty 64-bit S2 cell index.
 *
 * @param s2Index - Candidate S2 cell index.
 * @returns `true` when the face and level marker encode a valid S2 cell.
 */
export function isS2IndexValid(s2Index: unknown): s2Index is bigint {
  if (typeof s2Index !== 'bigint' || s2Index <= 0n || s2Index > MAXIMUM_S2_INDEX) {
    return false;
  }
  const face = s2Index >> 61n;
  const lowestOnBit = s2Index & -s2Index;
  return face < 6n && (lowestOnBit & VALID_LOWEST_ON_BITS) !== 0n;
}

/**
 * Returns whether a string is a canonical token for a non-empty S2 cell.
 *
 * The empty-cell sentinel `X` is supported by the conversion functions but is not a valid cell.
 *
 * @param token - Candidate hexadecimal S2 token.
 * @returns `true` when the token canonically encodes a valid S2 cell.
 */
export function isS2TokenValid(token: unknown): token is string {
  if (typeof token !== 'string' || !/^[0-9a-fA-F]{1,16}$/.test(token) || token.endsWith('0')) {
    return false;
  }
  const paddedToken = token.padEnd(MAXIMUM_TOKEN_LENGTH, '0');
  return isS2IndexValid(BigInt(`0x${paddedToken}`));
}

/**
 * Returns the subdivision level encoded by an S2 cell index.
 *
 * @param s2Index - Valid non-empty S2 cell index.
 * @returns The S2 level in the range `[0, 30]`.
 */
export function getS2Level(s2Index: bigint): number {
  if (!isS2IndexValid(s2Index)) {
    throw new Error(`Invalid S2 index: ${s2Index}`);
  }
  return (60 - countTrailingZeros(s2Index)) / 2;
}

/**
 * Returns one of the four Hilbert-ordered children of an S2 cell.
 *
 * @param s2Index - Valid S2 cell index below level 30.
 * @param index - Hilbert child position in the range `[0, 3]`.
 * @returns The child S2 cell index.
 */
export function getS2ChildIndex(s2Index: bigint, index: number): bigint {
  if (!isS2IndexValid(s2Index)) {
    throw new Error(`Invalid S2 index: ${s2Index}`);
  }
  if (!Number.isInteger(index) || index < 0 || index > 3) {
    throw new Error(`Invalid S2 child index: ${index}`);
  }
  if (getS2Level(s2Index) === MAXIMUM_LEVEL) {
    throw new Error('Cannot subdivide an S2 leaf cell');
  }
  // Shift sentinel bit 2 positions to the right.
  const newLsb = lsb(s2Index) >> 2n;
  // Insert child index before the sentinel bit.
  const childCellId: bigint = s2Index + BigInt(2 * index + 1 - 4) * newLsb;
  return childCellId;
}

/**
 * Return the lowest-numbered bit that is on for this cell id
 * @private
 */
function lsb(cellId: bigint): bigint {
  return cellId & -cellId; // eslint-disable-line
}

function countTrailingZeros(n: bigint): number {
  let count = 0;
  while (n % 2n === 0n) {
    n /= 2n;
    count++;
  }
  return count;
}
