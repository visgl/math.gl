// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original float32 rounding checks. Planet positions are Astronomy Engine (MIT) values, stored as numbers; no upstream code.
import {expect, test} from 'vitest';
import {
  getFloat32Spacing,
  splitFloat64,
  splitFloat64Array,
  subtractOrigin,
  subtractOriginFromMatrix4,
  getOriginShift
} from '@math.gl/core/matrix';

/** Seeded uniform random numbers in [0, 1) (mulberry32), so that each run checks the same values. */
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The next larger float32 value after a positive float32 value, from its bits. */
function getNextFloat32(value: number): number {
  const view = new DataView(new ArrayBuffer(4));
  view.setFloat32(0, value);
  view.setUint32(0, view.getUint32(0) + 1);
  return view.getFloat32(0);
}

/** The median of a list of numbers. */
function getMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[sorted.length >> 1];
}

/** Ignores the sign of a zero, so that `toEqual` compares numbers only. */
function withoutNegativeZero(values: ArrayLike<number>): number[] {
  return Array.from(values, value => value + 0);
}

/** Numbers that are not finite. */
const NON_FINITE = [Number.NaN, Infinity, -Infinity];
/** Finite numbers that round to an infinite float32. */
const OUTSIDE_FLOAT32 = [3.5e38, -1e39, Number.MAX_VALUE];
/** The largest finite float32 value, (2 - 2^-23) * 2^127. */
const FLOAT32_MAX = 3.4028234663852886e38;

test('getFloat32Spacing#exact values', () => {
  expect(getFloat32Spacing(1)).toBe(2 ** -23);
  expect(getFloat32Spacing(1.5)).toBe(2 ** -23);
  expect(getFloat32Spacing(-3)).toBe(2 ** -22);
  expect(getFloat32Spacing(0)).toBe(2 ** -149);
  expect(getFloat32Spacing(2 ** -126)).toBe(2 ** -149);
  expect(getFloat32Spacing(2 ** -127)).toBe(2 ** -149);
  expect(getFloat32Spacing(2 ** -125)).toBe(2 ** -148);
  // One astronomical unit in metres: the float32 grid there is 16 km.
  expect(getFloat32Spacing(149597870700)).toBe(16384);
  expect(getFloat32Spacing(FLOAT32_MAX)).toBe(2 ** 104);
  // Above the largest float32 value, but rounds down to it.
  expect(getFloat32Spacing(FLOAT32_MAX + 2 ** 102)).toBe(2 ** 104);
});

test('getFloat32Spacing#powers of two and the value below each', () => {
  for (let exponent = -126; exponent <= 127; exponent++) {
    const power = 2 ** exponent;
    expect(getFloat32Spacing(power)).toBe(2 ** (exponent - 23));
    expect(getFloat32Spacing(-power)).toBe(2 ** (exponent - 23));
    // The largest float64 value below the power of two is in the binade below.
    const below = power * (1 - 2 ** -53);
    expect(getFloat32Spacing(below)).toBe(exponent === -126 ? 2 ** -149 : 2 ** (exponent - 24));
  }
});

test('getFloat32Spacing#matches the bit-level distance to the next float32', () => {
  const random = createRandom(1);
  const view = new DataView(new ArrayBuffer(4));
  for (let i = 0; i < 5000; i++) {
    // Any positive finite float32 value below the largest one, subnormal values included.
    view.setUint32(0, 1 + Math.floor(random() * (0x7f7fffff - 1)));
    const value = view.getFloat32(0);
    expect(getFloat32Spacing(value)).toBe(getNextFloat32(value) - value);
  }
});

test('getFloat32Spacing#throws RangeError outside the domain', () => {
  for (const value of [...NON_FINITE, ...OUTSIDE_FLOAT32]) {
    expect(() => getFloat32Spacing(value)).toThrow(RangeError);
  }
});

test('splitFloat64#exact values', () => {
  expect(splitFloat64(2 ** 30 + 0.75)).toEqual([2 ** 30, 0.75]);
  // One astronomical unit in metres.
  expect(splitFloat64(149597870700)).toEqual([149597863936, 6764]);
  expect(splitFloat64(-1.5)).toEqual([-1.5, 0]);
  expect(withoutNegativeZero(splitFloat64(0))).toEqual([0, 0]);
  // A tie rounds to the even float32 value: down here, and up in the next case.
  expect(splitFloat64(1 + 2 ** -24)).toEqual([1, 2 ** -24]);
  expect(splitFloat64(1 + 3 * 2 ** -24)).toEqual([1 + 2 ** -22, -(2 ** -24)]);
  // The high part rounds up to the next power of two.
  expect(splitFloat64(2 - 2 ** -30)).toEqual([2, -(2 ** -30)]);
});

test('splitFloat64#high + low keeps the float64 value for values from 1e-3 to 1e12', () => {
  const random = createRandom(2);
  let worst = 0;
  for (let i = 0; i < 20000; i++) {
    const value = (random() < 0.5 ? -1 : 1) * 10 ** (-3 + 15 * random());
    const [high, low] = splitFloat64(value);
    expect(Math.fround(high)).toBe(high);
    expect(Math.fround(low)).toBe(low);
    const error = Math.abs(value - (high + low));
    const bound = getFloat32Spacing(value) * 2 ** -26;
    expect(error).toBeLessThanOrEqual(bound);
    worst = Math.max(worst, error / bound);
  }
  // The bound is not loose: random values come near it.
  expect(worst).toBeGreaterThan(0.9);
});

test('splitFloat64#worst case after each power of two', () => {
  for (let exponent = -101; exponent <= 127; exponent++) {
    // Just below the midpoint of two float32 values: high rounds down, and value - high is a
    // tie on the float32 grid of the low part, which rounds up to 2^(e-24).
    const value = 2 ** exponent * (1 + 2 ** -24 - 2 ** -49);
    const [high, low] = splitFloat64(value);
    expect(high).toBe(2 ** exponent);
    expect(low).toBe(2 ** (exponent - 24));
    expect(value - (high + low)).toBe(-(2 ** (exponent - 49)));
    expect(Math.abs(value - (high + low))).toBe(getFloat32Spacing(value) * 2 ** -26);
  }
  // Below 2^-101 the low part is subnormal: the error is at most 2^-150.
  for (let exponent = -149; exponent < -101; exponent++) {
    const value = 2 ** exponent * (1 + 2 ** -24 - 2 ** -49);
    const [high, low] = splitFloat64(value);
    expect(Math.abs(value - (high + low))).toBeLessThanOrEqual(2 ** -150);
  }
});

test('splitFloat64#throws RangeError outside the domain', () => {
  for (const value of [...NON_FINITE, ...OUTSIDE_FLOAT32]) {
    expect(() => splitFloat64(value)).toThrow(RangeError);
  }
});

test('splitFloat64Array#writes the high and low buffers', () => {
  const values = new Float64Array([149597870700, -(2 ** 30 + 0.75), 1 + 3 * 2 ** -24]);
  const {high, low} = splitFloat64Array(values);
  expect(Array.from(high)).toEqual([149597863936, -(2 ** 30), 1 + 2 ** -22]);
  expect(Array.from(low)).toEqual([6764, -0.75, -(2 ** -24)]);
  expect(high).toBeInstanceOf(Float32Array);

  const random = createRandom(3);
  const many = Array.from({length: 1000}, () => (random() - 0.5) * 1e12);
  const highTarget = new Float32Array(1001);
  const lowTarget = new Float32Array(1001);
  const result = splitFloat64Array(many, highTarget, lowTarget);
  expect(result.high).toBe(highTarget);
  expect(result.low).toBe(lowTarget);
  for (let i = 0; i < many.length; i++) {
    expect([highTarget[i], lowTarget[i]]).toEqual(splitFloat64(many[i]));
  }
  expect(highTarget[1000]).toBe(0);
});

test('splitFloat64Array#throws RangeError for bad input', () => {
  expect(() => splitFloat64Array([1, 2], new Float32Array(1))).toThrow(RangeError);
  expect(() => splitFloat64Array([1, 2], new Float32Array(2), new Float32Array(1))).toThrow(
    RangeError
  );
  for (const value of [...NON_FINITE, ...OUTSIDE_FLOAT32]) {
    expect(() => splitFloat64Array([1, value])).toThrow(RangeError);
  }
});

test('subtractOrigin#exact values', () => {
  expect(Array.from(subtractOrigin([10, 20, 30, 40, 50, 60], [1, 2, 3]))).toEqual([
    9, 18, 27, 39, 48, 57
  ]);
  expect(Array.from(subtractOrigin(new Float64Array([5, 7, 9, 11]), [1, 2]))).toEqual([4, 5, 8, 9]);
  expect(Array.from(subtractOrigin([5, 6], [1]))).toEqual([4, 5]);
  // A stride of 4 skips the fourth element of each position.
  const interleaved = [1e9 + 1, 1e9 + 2, 1e9 + 3, -1, 1e9 + 4, 1e9 + 5, 1e9 + 6, -1];
  expect(Array.from(subtractOrigin(interleaved, [1e9, 1e9, 1e9], {stride: 4}))).toEqual([
    1, 2, 3, 4, 5, 6
  ]);
  const target = new Float32Array(4).fill(-7);
  expect(subtractOrigin([3, 4, 5], [1, 1, 1], {target})).toBe(target);
  expect(Array.from(target)).toEqual([2, 3, 4, -7]);
  expect(Array.from(subtractOrigin([1, 2, 3, 4], [0, 0, 0, 0]))).toEqual([1, 2, 3, 4]);
  expect(subtractOrigin([], [0, 0, 0])).toHaveLength(0);
});

test('subtractOrigin#throws RangeError for bad input', () => {
  // The messages show that each check, not a later failure, rejects the input.
  expect(() => subtractOrigin([], [])).toThrow(/origin must have 1 to 4 components/);
  expect(() => subtractOrigin([1, 2, 3, 4, 5], [0, 0, 0, 0, 0])).toThrow(
    /origin must have 1 to 4 components/
  );
  for (let i = 0; i < 3; i++) {
    const origin = [0, 0, 0];
    origin[i] = Number.NaN;
    // With no positions, only the origin check can throw.
    expect(() => subtractOrigin([], origin)).toThrow(`origin[${i}] must be a finite number`);
  }
  expect(() => subtractOrigin([1, 2, 3, 4, 5, 6], [0, 0, 0], {stride: 2})).toThrow(
    /stride must be an integer of at least 3/
  );
  expect(() => subtractOrigin([1, 2, 3, 4, 5, 6, 7], [0, 0, 0], {stride: 3.5})).toThrow(
    /stride must be an integer of at least 3/
  );
  // The last position has its 3 components but not the full stride of 4.
  expect(() => subtractOrigin([1, 2, 3, 0, 4, 5, 6], [0, 0, 0], {stride: 4})).toThrow(
    /must be a multiple of the stride/
  );
  expect(() =>
    subtractOrigin([1, 2, 3, 4, 5, 6], [0, 0, 0], {target: new Float32Array(5)})
  ).toThrow(/target must have at least 6 elements/);
  for (const value of [...NON_FINITE, ...OUTSIDE_FLOAT32]) {
    expect(() => subtractOrigin([1, 2, value], [0, 0, 0])).toThrow(RangeError);
  }
  // Each value is in float32 range, but the difference is not.
  expect(() => subtractOrigin([FLOAT32_MAX], [-FLOAT32_MAX])).toThrow(RangeError);
});

/** Kilometres per scene unit: the "true scale" unit of the tangram.gl solar-system example. */
const UNIT_KM = 1e6;
/**
 * Heliocentric ecliptic J2000 position of the Earth at 2026-11-19T00:00:00Z, in scene units, from
 * Astronomy Engine `HelioVector`.
 */
const EARTH = [82.0646169999207, 123.00281776807114, -0.008105605930471969];
/** Heliocentric ecliptic J2000 position of Neptune at the same time, in scene units. */
const NEPTUNE = [4462.4012219970555, 229.8253075627866, -107.3609717716422];
/** Mean radius of the Earth, in scene units. */
const EARTH_RADIUS = 6371 / UNIT_KM;
/** Equatorial radius of Neptune, in scene units. */
const NEPTUNE_RADIUS = 24764 / UNIT_KM;

/** The length of the difference of two 3D points, in km. */
function getErrorKm(actual: ArrayLike<number>, expected: ArrayLike<number>): number {
  return (
    Math.hypot(actual[0] - expected[0], actual[1] - expected[1], actual[2] - expected[2]) * UNIT_KM
  );
}

/** The largest float32 rounding error of a 3D point, in km. */
function getFloat32BoundKm(point: number[]): number {
  return Math.hypot(...point.map(value => getFloat32Spacing(value) / 2)) * UNIT_KM;
}

test('subtractOrigin#body centres at solar-system scale', () => {
  // With the Sun at the origin, float32 moves the body centres.
  const earth = subtractOrigin(EARTH, [0, 0, 0]);
  const neptune = subtractOrigin(NEPTUNE, [0, 0, 0]);
  expect(getErrorKm(earth, EARTH)).toBeCloseTo(4.44, 2);
  expect(getErrorKm(neptune, NEPTUNE)).toBeCloseTo(145.31, 2);
  expect(getErrorKm(earth, EARTH)).toBeLessThanOrEqual(getFloat32BoundKm(EARTH));
  expect(getErrorKm(neptune, NEPTUNE)).toBeLessThanOrEqual(getFloat32BoundKm(NEPTUNE));
  expect(getFloat32BoundKm(EARTH)).toBeCloseTo(5.395, 3);
  expect(getFloat32BoundKm(NEPTUNE)).toBeCloseTo(244.3, 1);

  // With the origin at the body centre, a point on the limb keeps sub-metre precision.
  for (const [centre, radius, limitKm] of [
    [EARTH, EARTH_RADIUS, 0.0003],
    [NEPTUNE, NEPTUNE_RADIUS, 0.001]
  ] as const) {
    for (const direction of [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ]) {
      const limb = centre.map((value, i) => value + direction[i] * radius);
      const exact = limb.map((value, i) => value - centre[i]);
      const relative = subtractOrigin(limb, centre);
      expect(getErrorKm(relative, exact)).toBeLessThan(limitKm);
      // The naive way rounds the limb point and the centre to float32 first. It loses
      // precision on the axes far from the Sun (the Earth z is near 0: no loss there).
      const naive = Array.from(subtractOrigin(limb, [0, 0, 0]), (value, i) =>
        Math.fround(value - Math.fround(centre[i]))
      );
      if (Math.abs(centre[direction.indexOf(1)]) > 1) {
        expect(getErrorKm(naive, exact)).toBeGreaterThan(getErrorKm(relative, exact) * 1000);
      }
    }
  }
});

test('subtractOrigin#beats naive float32 by the expected factor', () => {
  const random = createRandom(4);
  const oursNormalized: number[] = [];
  const naiveNormalized: number[] = [];
  const gainOverExpected: number[] = [];
  for (let i = 0; i < 4000; i++) {
    const position = 10 ** (3 + 9 * random());
    // The origin is 1e-2 to 1e-8 of the position away, on either side.
    const offset = position * 10 ** -(2 + 6 * random()) * (0.5 + random());
    const origin = position + (random() < 0.5 ? offset : -offset);
    // Exact in float64: the two values are within a factor of 2 (Sterbenz).
    const exact = position - origin;

    const ours = Math.abs(subtractOrigin([position], [origin])[0] - exact);
    const naive = Math.abs(Math.fround(Math.fround(position) - Math.fround(origin)) - exact);
    expect(ours).toBeLessThanOrEqual(getFloat32Spacing(exact) / 2);

    oursNormalized.push(ours / getFloat32Spacing(exact));
    naiveNormalized.push(naive / getFloat32Spacing(position));
    const expectedGain = getFloat32Spacing(position) / getFloat32Spacing(exact);
    if (ours > 0) gainOverExpected.push(naive / ours / expectedGain);
  }
  // Rounding error is uniform in half a spacing: the median of |error| is 1/4 of the spacing.
  // The naive error is the difference of two such errors: its median is 0.29 of the spacing.
  expect(getMedian(oursNormalized)).toBeCloseTo(0.25, 1);
  expect(getMedian(naiveNormalized)).toBeCloseTo(0.29, 1);
  // So the gain is about spacing(position) / spacing(position - origin), times 1.17.
  expect(getMedian(gainOverExpected)).toBeGreaterThan(0.9);
  expect(getMedian(gainOverExpected)).toBeLessThan(1.5);
});

test('subtractOriginFromMatrix4#affine matrix', () => {
  // Column-major: a rotation of 90 degrees about z, a scale of 2, and a translation at 1 AU.
  const matrix = [0, 2, 0, 0, -2, 0, 0, 0, 0, 0, 2, 0, 149597870700.25, -3e11, 12.5, 1];
  const origin = [149597870000, -3e11 + 0.5, 10];
  const out = subtractOriginFromMatrix4(new Float64Array(16), matrix, origin);
  expect(Array.from(out)).toEqual([0, 2, 0, 0, -2, 0, 0, 0, 0, 0, 2, 0, 700.25, -0.5, 2.5, 1]);
  // After the call, float32 keeps the translation.
  expect(Array.from(new Float32Array(out)).slice(12)).toEqual([700.25, -0.5, 2.5, 1]);

  // The output can be the input.
  const inPlace = matrix.slice();
  expect(subtractOriginFromMatrix4(inPlace, inPlace, origin)).toBe(inPlace);
  expect(inPlace).toEqual(Array.from(out));
});

test('subtractOriginFromMatrix4#is translation(-origin) * matrix for any matrix', () => {
  const random = createRandom(5);
  for (let i = 0; i < 100; i++) {
    // Small integers keep every product and sum exact.
    const matrix = Array.from({length: 16}, () => Math.floor(random() * 21) - 10);
    const origin = Array.from({length: 3}, () => Math.floor(random() * 21) - 10);
    const translation = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -origin[0], -origin[1], -origin[2], 1];
    const expected = new Array(16).fill(0);
    for (let column = 0; column < 4; column++) {
      for (let row = 0; row < 4; row++) {
        for (let k = 0; k < 4; k++) {
          expected[column * 4 + row] += translation[k * 4 + row] * matrix[column * 4 + k];
        }
      }
    }
    const out = subtractOriginFromMatrix4(new Array(16), matrix, origin);
    expect(withoutNegativeZero(out)).toEqual(withoutNegativeZero(expected));
  }
});

test('subtractOriginFromMatrix4#throws RangeError for bad input', () => {
  const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  expect(() => subtractOriginFromMatrix4([], identity.slice(0, 15), [0, 0, 0])).toThrow(RangeError);
  expect(() => subtractOriginFromMatrix4([], identity, [0, 0])).toThrow(RangeError);
  for (const value of NON_FINITE) {
    for (let i = 0; i < 16; i++) {
      const matrix = identity.slice();
      matrix[i] = value;
      expect(() => subtractOriginFromMatrix4([], matrix, [0, 0, 0])).toThrow(RangeError);
    }
    for (let i = 0; i < 3; i++) {
      const origin = [0, 0, 0];
      origin[i] = value;
      expect(() => subtractOriginFromMatrix4([], identity, origin)).toThrow(RangeError);
    }
  }
});

test('getOriginShift#exact values', () => {
  const remainder = [0, 0, 0];
  const out = getOriginShift(
    new Float32Array(3),
    [0, 0, 0],
    [16777217, 0.1, -1000000.3],
    remainder
  );
  expect(Array.from(out)).toEqual([16777216, Math.fround(0.1), Math.fround(-1000000.3)]);
  expect(remainder).toEqual([1, 0.1 - Math.fround(0.1), -1000000.3 - Math.fround(-1000000.3)]);
  // shift + remainder is the move, exactly.
  expect(out[0] + remainder[0]).toBe(16777217);
  expect(out[1] + remainder[1]).toBe(0.1);
  expect(out[2] + remainder[2]).toBe(-1000000.3);

  // The next move of 1 adds the carried 1: the shift is 2, and nothing is left to carry.
  getOriginShift(out, [16777217, 0.1, -1000000.3], [16777218, 0.1, -1000000.3], remainder);
  expect(out[0]).toBe(2);
  expect(remainder[0]).toBe(0);
  // A component that does not move releases its carried part.
  expect(out[1]).toBe(Math.fround(0.1 - Math.fround(0.1)));
});

test('getOriginShift#shifts do not drift over many moves', () => {
  const step = 1000000.3; // fround(step) = 1000000.3125: 12.5 mm too far at each move.
  const moves = 1000;
  const remainder = [0];
  const out = [0];
  let sumOfShifts = 0;
  let naiveSum = 0;
  for (let k = 0; k < moves; k++) {
    getOriginShift(out, [k * step], [(k + 1) * step], remainder);
    expect(out[0]).toBe(Math.fround(out[0]));
    sumOfShifts += out[0];
    naiveSum += Math.fround(step);
  }
  const total = moves * step;
  const error = Math.abs(sumOfShifts + remainder[0] - total);
  const drift = Math.abs(sumOfShifts - total);
  const naiveDrift = Math.abs(naiveSum - total);
  // One float64 rounding of the origins per move, at the magnitude of the total.
  expect(error).toBeLessThanOrEqual(moves * Number.EPSILON * total);
  // The shifts alone are behind by less than half of the float32 spacing of one step.
  expect(drift).toBeLessThanOrEqual(getFloat32Spacing(step) / 2 + error);
  expect(naiveDrift).toBeCloseTo(12.5, 6);
  expect(naiveDrift / drift).toBeGreaterThan(100);
});

test('getOriginShift#out can be an origin, and 1 to 4 components work', () => {
  const previous = [1e9 + 0.25, 2, 3, 4];
  const remainder = new Float64Array(4);
  getOriginShift(previous, previous, [2e9 + 0.75, 3, 5, 8], remainder);
  expect(previous).toEqual([Math.fround(1e9 + 0.5), 1, 2, 4]);
  expect(remainder[0]).toBe(1e9 + 0.5 - Math.fround(1e9 + 0.5));

  const next = [7.1];
  const one = [0];
  getOriginShift(next, [0], next, one);
  expect(next[0]).toBe(Math.fround(7.1));
  expect(next[0] + one[0]).toBe(7.1);
});

test('getOriginShift#throws RangeError and changes nothing for bad input', () => {
  const out = [9, 9, 9];
  const remainder = [0.5, 0.5, 0.5];
  const check = (call: () => unknown) => {
    expect(call).toThrow(RangeError);
    expect(out).toEqual([9, 9, 9]);
    expect(remainder).toEqual([0.5, 0.5, 0.5]);
  };
  check(() => getOriginShift(out, [], [], []));
  check(() => getOriginShift(out, [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]));
  check(() => getOriginShift(out, [0, 0], [0, 0, 0], remainder));
  check(() => getOriginShift(out, [0, 0, 0], [0, 0, 0], [0, 0]));
  check(() => getOriginShift([0, 0], [0, 0, 0], [0, 0, 0], remainder));
  check(() => getOriginShift(out, [0, 0, 0], [0, 0, 0], new Float32Array(3)));
  check(() => getOriginShift(out, [0, NaN, 0], [0, 0, 0], remainder));
  check(() => getOriginShift(out, [0, 0, 0], [0, 0, Infinity], remainder));
  check(() => getOriginShift(out, [0, 0, 0], [0, 0, 0], [0, NaN, 0]));
  // The second component overflows float32; the first must not be written.
  check(() => getOriginShift(out, [0, 0, 0], [1, 1e39, 0], remainder));
});
