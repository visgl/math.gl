// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {JulianDate} from '../../src/celestial';

test('Julian coordinates normalize noon-based days and remain immutable', () => {
  const day = new JulianDate(2451545, -1.5);
  expect(day.dayNumber).toBe(2451544);
  expect(day.secondsOfDay).toBe(86398.5);
  expect(day.addSeconds(1.5)).toEqual(new JulianDate(2451545));
  expect(new JulianDate(2451545, 86401)).toEqual(new JulianDate(2451546, 1));
  expect(Object.isFrozen(day)).toBe(true);
  expect(new JulianDate(2451545, -1e-30)).toEqual(new JulianDate(2451545));
});

test('Unix conversions match independent epoch and J2000 controls', () => {
  expect(JulianDate.fromUnixTicks(0n, 's', 0)).toEqual(new JulianDate(2440587, 43200));
  expect(JulianDate.fromUnixMilliseconds(new Date('2000-01-01T12:00:00Z'), 32)).toEqual(
    new JulianDate(2451545, 32)
  );
  const tt = JulianDate.fromUnixMilliseconds(new Date('2000-01-01T12:00:00Z'), 64.184, 'TT');
  expect(tt.timeScale).toBe('TT');
  expect(tt.secondsOfDay).toBeCloseTo(64.184, 10);
  expect(tt.toUnixTicks('ms', 64.184, 'nearest')).toBe(946728000000n);
});

test('All int64 timestamp units survive day-split bigint round trips, including negative epochs', () => {
  let seed = 0x123456789abcdefn;
  const values = [-(1n << 63n), (1n << 63n) - 1n, -86400000000001n, -1n, 0n, 1n, 86400000000001n];
  for (let i = 0; i < 100; i++) {
    seed = BigInt.asIntN(64, seed * 6364136223846793005n + 1442695040888963407n);
    values.push(seed);
  }
  for (const unit of ['s', 'ms', 'us', 'ns'] as const) {
    for (const ticks of values) {
      const time = JulianDate.fromUnixTicks(ticks, unit, 37);
      expect(time.toUnixTicks(unit, 37, 'nearest')).toBe(ticks);
    }
  }
  const now = 1792713600000000000n;
  expect(JulianDate.fromUnixTicks(now, 'ns', 37).toUnixTicks('ns', 37, 'nearest')).toBe(now);
  expect(JulianDate.fromUnixTicks(now + 1n, 'ns', 37).toUnixTicks('ns', 37, 'nearest')).toBe(
    now + 1n
  );
});

test('TAI arithmetic preserves the extra elapsed second at a UTC leap boundary', () => {
  const before = JulianDate.fromUnixMilliseconds(Date.parse('2016-12-31T23:59:59Z'), 36);
  const after = JulianDate.fromUnixMilliseconds(Date.parse('2017-01-01T00:00:00Z'), 37);
  expect(after.secondsDifference(before)).toBe(2);
  expect(before.addSeconds(1).secondsDifference(before)).toBe(1);
  // Conversion labels/selection inside the inserted leap second require a separate UTC policy.
  expect(before.toTimeScale('TT', 32.184).secondsDifference(before.toTimeScale('TT', 32.184))).toBe(
    0
  );
  expect(() => before.secondsDifference(before.toTimeScale('TT', 32.184))).toThrow(RangeError);
});

test('Tick rounding and invalid scales/units/coordinates are explicit', () => {
  const halfSecond = JulianDate.fromUnixMilliseconds(500, 0);
  expect(() => halfSecond.toUnixTicks('s', 0)).toThrow(RangeError);
  expect(halfSecond.toUnixTicks('s', 0, 'nearest')).toBe(1n);
  expect(() => halfSecond.toTimeScale('TAI', 1)).toThrow(RangeError);
  for (const args of [
    [1.5, 0],
    [1, NaN],
    [Number.MAX_SAFE_INTEGER, 86400]
  ]) {
    expect(() => new JulianDate(args[0], args[1])).toThrow(RangeError);
  }
  expect(() => new JulianDate(0, 0, 'UTC' as 'TAI')).toThrow(RangeError);
  expect(() => JulianDate.fromUnixTicks(1n, 'minute' as 's', 0)).toThrow(RangeError);
  expect(() => JulianDate.fromUnixTicks(1n << 120n, 's', 0)).toThrow(RangeError);
  expect(() => JulianDate.fromUnixTicks(0n, 's', NaN)).toThrow(RangeError);
  expect(() => JulianDate.fromUnixMilliseconds(new Date('invalid'), 0)).toThrow(RangeError);
  expect(() => new JulianDate(0).addSeconds(Infinity)).toThrow(RangeError);
});
