// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

const LIMB_BASE = 65536;
const MIN_BINARY_SCALE = -1074;
const MAX_BINARY_SCALE = 971;
const MIN_DECIMAL_SCALE = -342;
const PREFIX_DIGITS = 19;

// Every binary64 rounding midpoint has fewer than 800 significant decimal digits.
// The largest denominator is 2^1075 and the numerator has at most 54 bits, so
// multiplying the numerator by 5^1075 still gives fewer than 800 decimal digits.
const EXACT_DIGITS = 800;

type CachedPower = {
  lower: Uint16Array;
  upper: Uint16Array;
  scale: number;
};

const powers: (CachedPower | undefined)[] = [];
// The conversion is synchronous and invokes no user code while using these buffers.
const mantissaLimbs = new Uint16Array(4);
const product = new Uint16Array(11);

/** Converts a validated unsigned ASCII decimal mantissa and scale to binary64. */
export function decimalToBinary(
  bytes: Uint8Array,
  start: number,
  end: number,
  scale: number
): number {
  while (start < end && (bytes[start] === 48 || bytes[start] === 46)) start++;
  if (start === end) return 0;

  // Two exact Number integers hold up to 19 digits, which fit in 64 unsigned bits.
  let head = 0;
  let tail = 0;
  let digits = 0;
  let sticky = false;
  for (let i = start; i < end; i++) {
    const byte = bytes[i]!;
    if (byte === 46) continue;
    const digit = byte - 48;
    if (digits < 9) head = head * 10 + digit;
    else if (digits < PREFIX_DIGITS) tail = tail * 10 + digit;
    else sticky ||= digit !== 0;
    digits++;
  }

  const adjusted = scale + digits - 1;
  if (adjusted > 308) return Infinity;
  if (adjusted < -324) return 0;

  const prefixScale = scale + Math.max(0, digits - PREFIX_DIGITS);
  const index = prefixScale - MIN_DECIMAL_SCALE;
  powers[index] ??= cachePower(prefixScale);
  const power = powers[index];
  const factor = 10 ** Math.max(0, Math.min(digits, PREFIX_DIGITS) - 9);
  setMantissaLimbs(head, tail, factor);

  // The true product is no lower than prefix * lower. The upper bound adds
  // less than 2^64 for an inexact cached power, and less than 2^97 if the
  // decimal tail also contributes (upper is at most 2^96).
  const errorBits = sticky ? 97 : power.lower === power.upper ? 0 : 64;
  const rounded = roundProductLimbs(power.lower, power.scale, errorBits);
  if (rounded !== undefined) return rounded;

  const lower = roundProductLimbs(power.lower, power.scale);
  if (sticky) setMantissaLimbs(head, tail + 1, factor);
  const upper = roundProductLimbs(power.upper, power.scale);
  return lower !== undefined && lower === upper
    ? lower
    : roundExactDecimal(bytes, start, end, scale, adjusted);
}

/** Caches the enclosing 96-bit coefficients for 10^exponent = coefficient * 2^scale. */
function cachePower(exponent: number): CachedPower {
  const numerator = exponent >= 0 ? 10n ** BigInt(exponent) : 1n;
  const denominator = exponent < 0 ? 10n ** BigInt(-exponent) : 1n;
  const scale = binaryExponent(numerator, denominator, exponent) - 95;
  const n = scale < 0 ? numerator << BigInt(-scale) : numerator;
  const d = scale > 0 ? denominator << BigInt(scale) : denominator;
  const coefficient = n / d;
  const lower = splitLimbs(coefficient);
  const upper = n % d === 0n ? lower : splitLimbs(coefficient + 1n);
  return {lower, upper, scale};
}

function splitLimbs(value: bigint): Uint16Array {
  // The upper coefficient can equal 2^96.
  return Uint16Array.from({length: 7}, (_, index) =>
    Number((value >> BigInt(16 * index)) & 65535n)
  );
}

function setMantissaLimbs(head: number, tail: number, factor: number): void {
  // Splitting head before multiplying keeps every intermediate below 2^53.
  let part = (head & 65535) * factor + tail;
  mantissaLimbs[0] = part & 65535;
  part = (head >>> 16) * factor + Math.floor(part / LIMB_BASE);
  mantissaLimbs[1] = part & 65535;
  part = Math.floor(part / LIMB_BASE);
  mantissaLimbs[2] = part & 65535;
  mantissaLimbs[3] = Math.floor(part / LIMB_BASE);
}

/** Rounds the product, or returns undefined when its error bound can change the result. */
function roundProductLimbs(
  multiplier: Uint16Array,
  scale: number,
  errorBits = 0
): number | undefined {
  let carry = 0;
  for (let i = 0; i < 10; i++) {
    let column = carry;
    if (i < 7) column += mantissaLimbs[0]! * multiplier[i]!;
    if (i >= 1 && i < 8) column += mantissaLimbs[1]! * multiplier[i - 1]!;
    if (i >= 2 && i < 9) column += mantissaLimbs[2]! * multiplier[i - 2]!;
    if (i >= 3) column += mantissaLimbs[3]! * multiplier[i - 3]!;
    product[i] = column & 65535;
    carry = Math.floor(column / LIMB_BASE);
  }
  product[10] = carry;

  let top = 10;
  while (!product[top]) top--;
  const bits = top * 16 + 32 - Math.clz32(product[top]!);
  const unit = Math.max(scale + bits - 53, MIN_BINARY_SCALE);
  if (unit > MAX_BINARY_SCALE) return Infinity;
  const shift = unit - scale;
  if (shift > bits) return errorBits && shift === bits + 1 ? undefined : 0;
  if (errorBits && shift <= errorBits + 1) return undefined;

  const guardIndex = shift - 1;
  const guardWord = guardIndex >>> 4;
  const guardMask = 1 << (guardIndex & 15);
  let quotient = 0;
  for (let i = top; i > guardWord; i--) quotient = quotient * LIMB_BASE + product[i]!;
  const guardLimb = product[guardWord]!;
  quotient = quotient * (LIMB_BASE / (guardMask * 2)) + (guardLimb >>> ((guardIndex & 15) + 1));
  if (guardLimb & guardMask) {
    let sticky = (guardLimb & (guardMask - 1)) !== 0;
    for (let i = guardWord - 1; i >= 0 && !sticky; i--) sticky = product[i] !== 0;
    if (sticky || quotient % 2 !== 0) quotient++;
    else if (errorBits) return undefined;
  } else if (errorBits && (guardLimb & (guardMask - 1)) === guardMask - 1) {
    // A zero bit between the error bound and the midpoint proves that the
    // upper bound rounds down too. Only check more limbs near the midpoint.
    const threshold = errorBits >>> 4;
    let word = guardWord - 1;
    while (word > threshold && product[word] === 65535) word--;
    const highMask = 65535 ^ ((1 << (errorBits & 15)) - 1);
    if (
      guardWord === threshold ||
      (word <= threshold && (product[threshold]! & highMask) === highMask)
    ) {
      return undefined;
    }
  }
  return quotient * 2 ** unit;
}

function lessThanPowerOfTwo(n: bigint, d: bigint, exponent: number): boolean {
  return exponent >= 0 ? n < d << BigInt(exponent) : n << BigInt(-exponent) < d;
}

function binaryExponent(n: bigint, d: bigint, adjusted: number): number {
  let exponent = Math.floor(adjusted * Math.log2(10));
  while (lessThanPowerOfTwo(n, d, exponent)) exponent--;
  while (!lessThanPowerOfTwo(n, d, exponent + 1)) exponent++;
  return exponent;
}

/** Resolves ambiguous rounding by comparing an exact ratio with its binary midpoint. */
function roundExactDecimal(
  bytes: Uint8Array,
  start: number,
  end: number,
  scale: number,
  adjusted: number
): number {
  let mantissa = 0n;
  let chunk = 0;
  let chunkSize = 0;
  let kept = 0;
  let sticky = false;
  for (let i = start; i < end; i++) {
    const byte = bytes[i]!;
    if (byte === 46) continue;
    const digit = byte - 48;
    if (kept < EXACT_DIGITS) {
      kept++;
      chunk = chunk * 10 + digit;
      if (++chunkSize === 9) {
        mantissa = mantissa * 1000000000n + BigInt(chunk);
        chunk = chunkSize = 0;
      }
    } else {
      scale++;
      sticky ||= digit !== 0;
    }
  }
  mantissa = mantissa * 10n ** BigInt(chunkSize) + BigInt(chunk);
  // The discarded tail can affect rounding only by moving off an exact midpoint.
  if (sticky) {
    mantissa = mantissa * 10n + 1n;
    scale--;
  }
  let n = scale >= 0 ? mantissa * 10n ** BigInt(scale) : mantissa;
  let d = scale < 0 ? 10n ** BigInt(-scale) : 1n;
  const unit = Math.max(binaryExponent(n, d, adjusted) - 52, MIN_BINARY_SCALE);
  if (unit > MAX_BINARY_SCALE) return Infinity;
  if (unit < 0) n <<= BigInt(-unit);
  else d <<= BigInt(unit);
  const quotient = n / d;
  const twiceRemainder = 2n * (n - quotient * d);
  const up = twiceRemainder > d || (twiceRemainder === d && (quotient & 1n) !== 0n);
  return (Number(quotient) + Number(up)) * 2 ** unit;
}
