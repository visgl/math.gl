// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {compileResolvedScale, resolvePalette} from '@math.gl/sql/scales';
import {
  convertScaleColor,
  decodeSRGB,
  encodeSRGB,
  packFloat16,
  unpackFloat16,
  packRGBA16F
} from '../src/scales/hdr-colors';

const linear = {
  primaries: 'srgb' as const,
  transfer: 'linear' as const,
  format: 'rgba32float' as const
};
const p3 = {...linear, primaries: 'display-p3' as const};
const rec2020 = {...linear, primaries: 'rec2020' as const};

test('sRGB transfer roundtrips extended and negative linear components', () => {
  for (const value of [-0.25, 0, 0.003, 0.18, 0.75, 1, 2, 4]) {
    expect(decodeSRGB(encodeSRGB(value))).toBeCloseTo(value, 9);
  }
});

test('wide-gamut conversion preserves extended range and alpha across roundtrip', () => {
  const original = [2, 0.5, 0.2, 0.75] as const;
  const converted = convertScaleColor(original, linear, p3);
  const recovered = convertScaleColor(converted, p3, linear);
  recovered.forEach((value, i) => expect(value).toBeCloseTo(original[i]!, 4));
  const rec = convertScaleColor(original, linear, rec2020);
  const back = convertScaleColor(rec, rec2020, linear);
  back.forEach((value, i) => expect(value).toBeCloseTo(original[i]!, 4));
  expect(converted[3]).toBe(0.75);
});

test('binary16 packing handles normals, subnormals, extended HDR and special values', () => {
  for (const [value, expected] of [
    [0, 0x0000],
    [1, 0x3c00],
    [-1, 0xbc00],
    [2, 0x4000],
    [4, 0x4400],
    [65504, 0x7bff],
    [2 ** -24, 0x0001],
    [2 ** -14, 0x0400]
  ]) {
    expect(packFloat16(value)).toBe(expected);
    expect(unpackFloat16(expected)).toBe(value);
  }
  expect(packFloat16(Infinity)).toBe(0x7c00);
  expect(packFloat16(-Infinity)).toBe(0xfc00);
  expect(Number.isNaN(unpackFloat16(packFloat16(NaN)))).toBe(true);
  expect(packRGBA16F([4, 2, 0.5, 1])).toEqual(Uint16Array.of(0x4400, 0x4000, 0x3800, 0x3c00));
});

test('PQ and HLG need explicit luminance semantics rather than silent reinterpretation', () => {
  expect(() =>
    convertScaleColor([2, 1, 0, 1], linear, {
      primaries: 'rec2020',
      transfer: 'pq',
      format: 'rgba16float'
    })
  ).toThrow('explicit luminance');
});

test('binary16 rounds JavaScript numbers directly at halfway boundaries', () => {
  const halfway = 1 + 2 ** -11;
  expect(packFloat16(halfway - Number.EPSILON)).toBe(0x3c00);
  expect(packFloat16(halfway)).toBe(0x3c00);
  expect(packFloat16(halfway + Number.EPSILON)).toBe(0x3c01);
  expect(packFloat16(2 ** -25)).toBe(0);
  expect(packFloat16(2 ** -25 + 2 ** -77)).toBe(1);
  expect(packFloat16(-0)).toBe(0x8000);
  expect(packFloat16(65520)).toBe(0x7c00);
});

test('named palette values and legend stops use the declared color encoding', () => {
  const range = {type: 'palette', name: 'viridis'} as const;
  const scale = compileResolvedScale(
    {type: 'ordinal', domain: {type: 'fixed', values: ['one']}, range, encoding: p3},
    ['one']
  );
  const encoded = convertScaleColor(resolvePalette(range)[0]!, {...linear, transfer: 'srgb'}, p3);
  expect(scale.sample('one')).toEqual(encoded);
  expect(scale.descriptor.range.values[0]).toEqual(encoded);
});
