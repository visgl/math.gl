// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  TerrainSurface,
  HeightField,
  createTerrainSurface,
  packTerrainHeightField,
  unpackTerrainHeightField,
  sweepTerrainBox,
  sweepTerrainRotatingBox,
  sweepTerrainRotatingPolytope
} from '@math.gl/geospatial/terrain';
import fixture from './fixtures/rotational-sweep-parity.json';
import pacific from './fixtures/pacific-streaming.json';
import sierra from './fixtures/sierra-nodata-streaming.json';

const surface = new TerrainSurface({
  positions: Float64Array.of(-4, -4, 0, 4, -4, 0, 4, 4, 0, -4, 4, 0),
  indices: Uint32Array.of(0, 1, 2, 0, 2, 3)
});
const center = [0, 0, 0.75] as const;
const half = [1, 0.25, 0.25] as const;
const rotation = [0, Math.SQRT1_2, 0, Math.SQRT1_2] as const;
const motion = {pivot: center, rotation, translation: [0, 0, 0]} as const;

test('pure box rotation brackets the analytical first plane contact', () => {
  const result = sweepTerrainRotatingBox(surface, center, half, motion);
  // The lowest corner drops by sin(theta) + 0.25 cos(theta).
  const time = (Math.asin(0.75 / Math.hypot(1, 0.25)) - Math.atan(0.25)) / (Math.PI / 2);
  const contactTolerance = 1e-12;
  expect(result.status).toBe('hit');
  if (result.status !== 'hit') throw new Error('Expected rotational hit');
  expect(result.lowerFraction).toBeLessThanOrEqual(time + contactTolerance);
  expect(result.fraction).toBeGreaterThanOrEqual(time - contactTolerance);
  expect(result.fraction - result.lowerFraction).toBeLessThanOrEqual(1e-5);
  expect(sweepTerrainRotatingBox(surface, center, half, motion, {maxWork: 0})).toEqual({
    status: 'incomplete',
    work: 0
  });
});

test('initial overlap, clear motion and zero-rotation translation', () => {
  expect(sweepTerrainRotatingBox(surface, [0, 0, 0], half, motion)).toMatchObject({
    status: 'hit',
    fraction: 0,
    lowerFraction: 0
  });
  expect(
    sweepTerrainRotatingBox(surface, [0, 0, 3], half, {
      ...motion,
      pivot: [0, 0, 3]
    }).status
  ).toBe('miss');
  const translation = [0, 0, -1] as const;
  const fixed = sweepTerrainBox(surface, center, half, translation);
  expect(
    sweepTerrainRotatingBox(surface, center, half, {
      ...motion,
      translation,
      rotation: [0, 0, 0, -1]
    })
  ).toEqual({...fixed, lowerFraction: 0.5});
});

test('hull rotation detects impact even with clear motion endpoints', () => {
  const result = sweepTerrainRotatingPolytope(
    surface,
    {
      vertices: [
        [0, 0, 0.75],
        [0.6, 0, 1.35],
        [0, 0.25, 0.75],
        [0, 0, 0.9]
      ],
      faces: [
        [0, 1, 2],
        [0, 3, 1],
        [0, 2, 3],
        [1, 3, 2]
      ]
    },
    {
      ...motion,
      rotation: [0, 1, 0, 0],
      translation: [0, 0, 0]
    }
  );
  expect(result.status).toBe('hit');
  if (result.status !== 'hit') throw new Error('Expected rotational hull hit');
  const time = 0.25 + Math.asin(0.75 / Math.hypot(0.6, 0.6)) / Math.PI;
  expect(result.lowerFraction).toBeLessThanOrEqual(time);
  expect(result.fraction).toBeGreaterThanOrEqual(time);
});

for (const [i, entry] of fixture.cases.entries()) {
  test(`packed terrain CPU parity fixture: ${entry.name}`, () => {
    const source = [pacific, sierra][i];
    const [x, y, width, height] = entry.pixelWindow;
    expect(entry.sourceSha256).toBe(source.sha256);
    expect(entry.heights).toEqual(
      Array.from(
        {length: width * height},
        (_, index) =>
          source.heights[(y + Math.floor(index / width)) * source.width + x + (index % width)]
      )
    );
    const packed = packTerrainHeightField(
      new HeightField({
        width,
        height,
        heights: Float64Array.from(entry.heights, value => value ?? NaN)
      }),
      {heightOrigin: entry.heightOrigin}
    );
    expect(packed.maxHeightError).toBeGreaterThan(0);
    const terrain = createTerrainSurface(unpackTerrainHeightField(packed), {origin: packed.origin});
    const {center, halfExtents, translation, rotation, expected} = entry.sweep;
    const toPoint = (v: number[]) => [v[0], v[1], v[2]] as const;
    const result = sweepTerrainRotatingBox(terrain, toPoint(center), toPoint(halfExtents), {
      pivot: toPoint(center),
      translation: toPoint(translation),
      rotation: [rotation[0], rotation[1], rotation[2], rotation[3]]
    });
    expect(result.status).toBe(expected.status);
    if (result.status === 'hit' && expected.fraction !== undefined) {
      expect(Math.abs(result.fraction - expected.fraction)).toBeLessThan(
        expected.fractionTolerance!
      );
    }
  });
}

test('isolated grazing is never classified as a clear sweep', () => {
  const pivot = [0, 0, Math.hypot(1, 0.25)] as const;
  const result = sweepTerrainRotatingBox(surface, pivot, half, {...motion, pivot});
  expect(result.status).not.toBe('miss');
  if (result.status === 'hit') {
    const fraction = Math.atan2(1, 0.25) / (Math.PI / 2);
    expect(result.lowerFraction).toBeLessThanOrEqual(fraction);
    expect(result.fraction).toBeCloseTo(fraction, 5);
  }
});

test('rejects invalid motion quaternions and budgets', () => {
  expect(() =>
    sweepTerrainRotatingBox(surface, center, half, {
      ...motion,
      rotation: [0, 0, 0, 0]
    })
  ).toThrow(RangeError);
  expect(() =>
    sweepTerrainRotatingBox(surface, center, half, motion, {
      maxWork: -1
    })
  ).toThrow(RangeError);
});
