// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  simplifyTerrainContourPaths,
  type TerrainContourPaths
} from '@math.gl/geospatial/terrain/contour-simplify';
import {HeightField} from '@math.gl/geospatial/terrain';
import {createTerrainContours} from '@math.gl/geospatial/terrain/contours';
import {stitchTerrainContours} from '@math.gl/geospatial/terrain/contour-paths';

function path(
  points: number[],
  indices?: number[],
  offsets?: number[],
  closed?: number[]
): TerrainContourPaths {
  const count = points.length / 2;
  return {
    positions: Float64Array.from({length: count * 3}, (_, i) =>
      i % 3 === 2 ? 0 : points[Math.floor(i / 3) * 2 + (i % 3)]
    ),
    gridCoordinates: Float64Array.from(points),
    indices: Uint32Array.from(indices ?? Array.from({length: count}, (_, i) => i)),
    offsets: Uint32Array.from(offsets ?? [0, count]),
    closed: Uint8Array.from(closed ?? [0]),
    levels: Float64Array.from([0]),
    levelIndices: new Uint32Array((offsets?.length ?? 2) - 1),
    origin: [1e12, -1e12, 0],
    heightReference: 'survey'
  };
}

// Independent nearest-point reference uses a squared-length projection on moderate test coordinates.
function distance(p: number[], a: number[], b: number[]): number {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    den = dx * dx + dy * dy;
  const t = den ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / den)) : 0;
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}

test('simplification removes collinear interiors, compacts buffers and maps original vertices', () => {
  const source = path([0, 0, 1, 0, 2, 0, 3, 0]);
  const result = simplifyTerrainContourPaths(source, {maxError: 0});
  expect(Array.from(result.sourceVertexIndices)).toEqual([0, 3]);
  expect(Array.from(result.indices)).toEqual([0, 1]);
  expect(Array.from(result.offsets)).toEqual([0, 2]);
  expect(result.maxDeviation).toBe(0);
  expect(result.distanceTests).toBe(2);
  expect(Array.from(result.positions)).toEqual([0, 0, 0, 3, 0, 0]);
  result.positions[0] = 9;
  expect(source.positions[0]).toBe(0);
  expect(result.origin).toEqual(source.origin);
});

test('simplification bounds original points and linear edges against each replacement chord', () => {
  const source = path(Array.from({length: 41}, (_, i) => [i / 4, Math.sin(i / 4)]).flat());
  for (const maxError of [0, 0.01, 0.1, 1]) {
    const result = simplifyTerrainContourPaths(source, {maxError});
    let maximum = 0;
    for (let i = 1; i < result.indices.length; i++) {
      const a = result.sourceVertexIndices[result.indices[i - 1]],
        b = result.sourceVertexIndices[result.indices[i]];
      const pa = Array.from(source.gridCoordinates.subarray(2 * a, 2 * a + 2)),
        pb = Array.from(source.gridCoordinates.subarray(2 * b, 2 * b + 2));
      for (let j = a; j <= b; j++) {
        const p = Array.from(source.gridCoordinates.subarray(2 * j, 2 * j + 2));
        maximum = Math.max(maximum, distance(p, pa, pb));
        if (j < b) {
          const mid = [
            (p[0] + source.gridCoordinates[2 * j + 2]) / 2,
            (p[1] + source.gridCoordinates[2 * j + 3]) / 2
          ];
          expect(distance(mid, pa, pb)).toBeLessThanOrEqual(maxError + 1e-12);
        }
      }
    }
    expect(maximum).toBeLessThanOrEqual(maxError + 1e-12);
    expect(result.maxDeviation).toBeCloseTo(maximum, 12);
  }
});

test('closed contours retain closure and at least three distinct anchors', () => {
  const field = new HeightField({
    width: 7,
    height: 7,
    heights: Float64Array.from(
      {length: 49},
      (_, i) => ((i % 7) - 3) ** 2 + (Math.floor(i / 7) - 3) ** 2
    )
  });
  const source = stitchTerrainContours(createTerrainContours(field, [1.5, 4.5]));
  const result = simplifyTerrainContourPaths(source, {maxError: 100});
  expect(Array.from(result.closed)).toEqual([1, 1]);
  expect(Array.from(result.levelIndices)).toEqual([0, 1]);
  for (let i = 0; i < 2; i++) {
    const ids = Array.from(result.indices.subarray(result.offsets[i], result.offsets[i + 1]));
    expect(ids.length).toBe(4);
    expect(ids[0]).toBe(ids[3]);
    expect(new Set(ids).size).toBe(3);
  }
});

test('shared vertices stay fixed even when they occur inside a caller-provided path', () => {
  const source = path([0, 0, 1, 0, 2, 0, 1, 1], [0, 1, 2, 1, 3], [0, 3, 5], [0, 0]);
  const result = simplifyTerrainContourPaths(source, {maxError: 100});
  expect(Array.from(result.sourceVertexIndices)).toEqual([0, 1, 2, 3]);
  expect(Array.from(result.indices)).toEqual([0, 1, 2, 1, 3]);
});

test('coincident nonadjacent coordinates never simplify to a zero-length output edge', () => {
  const source = path([0, 0, 1, 0, 0, 0, 0, 1], [0, 1, 2, 3, 0], [0, 5], [1]);
  const result = simplifyTerrainContourPaths(source, {maxError: 100});
  for (let i = 1; i < result.indices.length; i++) {
    const a = result.indices[i - 1],
      b = result.indices[i];
    expect(
      Math.hypot(
        result.positions[3 * a] - result.positions[3 * b],
        result.positions[3 * a + 1] - result.positions[3 * b + 1]
      )
    ).toBeGreaterThan(0);
  }
});

test('simplification enforces work limits, validates paths and reports unsupported arithmetic', () => {
  const source = path([0, 0, 1, 1, 2, 0]);
  const full = simplifyTerrainContourPaths(source, {maxError: 0});
  expect(() =>
    simplifyTerrainContourPaths(source, {maxError: 0, maxDistanceTests: full.distanceTests - 1})
  ).toThrow(/budget/);
  expect(
    simplifyTerrainContourPaths(source, {maxError: 0, maxDistanceTests: full.distanceTests}).indices
  ).toEqual(full.indices);
  for (const options of [
    {maxError: -1},
    {maxError: Infinity},
    {maxError: 0, maxDistanceTests: -1},
    {maxError: 0, maxIndices: 2},
    {maxError: 0, maxPaths: 0},
    {maxError: 0, maxSegments: 1}
  ])
    expect(() => simplifyTerrainContourPaths(source, options)).toThrow();
  for (const bad of [
    {...source, offsets: Uint32Array.from([])},
    {...source, offsets: Uint32Array.from([1, 3])},
    {...source, offsets: Uint32Array.from([0, 4])},
    {...source, closed: Uint8Array.from([1])},
    {...source, closed: Uint8Array.from([2])},
    {...source, levelIndices: Uint32Array.from([])},
    {...source, indices: Uint32Array.from([0, 1, 99])},
    path([0, 0, 1, 0], [0, 1, 0, 1], [0, 4], [0]),
    path([0, 0, 0, 0])
  ])
    expect(() => simplifyTerrainContourPaths(bad, {maxError: 1})).toThrow();
  expect(() =>
    simplifyTerrainContourPaths(path([-1e308, 0, 0, 1, 1e308, 0]), {maxError: 1})
  ).toThrow(/overflow/);
  const empty = {
    ...source,
    positions: new Float64Array(),
    gridCoordinates: new Float64Array(),
    indices: new Uint32Array(),
    offsets: Uint32Array.from([0]),
    closed: new Uint8Array(),
    levelIndices: new Uint32Array()
  };
  expect(
    simplifyTerrainContourPaths(empty, {maxError: 0, maxDistanceTests: 0}).indices.length
  ).toBe(0);
});

test('simplification retains the same features across small and large coordinate scales', () => {
  for (const scale of [1e-100, 1, 1e100]) {
    const source = path([0, 0, 1, 0.1, 2, 0, 3, 2, 4, 0].map(value => value * scale));
    const result = simplifyTerrainContourPaths(source, {maxError: 0.2 * scale});
    expect(Array.from(result.sourceVertexIndices)).toEqual([0, 2, 3, 4]);
    expect(result.maxDeviation / scale).toBeCloseTo(0.1, 14);
  }
});
