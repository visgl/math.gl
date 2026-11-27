// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {HeightField} from '@math.gl/geospatial/terrain';
import {createTerrainContours} from '@math.gl/geospatial/terrain';
import {createTerrainSurface} from '@math.gl/geospatial/terrain';

function field(
  width: number,
  height: number,
  fn: (x: number, y: number) => number,
  diagonal: '00-11' | '10-01' = '00-11'
) {
  return new HeightField({
    width,
    height,
    heights: Float64Array.from({length: width * height}, (_, i) =>
      fn(i % width, Math.floor(i / width))
    ),
    diagonal
  });
}

for (const diagonal of ['00-11', '10-01'] as const)
  test(`contours of a plane share intersections, preserve levels and match triangle sampling (${diagonal})`, () => {
    const source = field(3, 3, x => x, diagonal),
      surface = createTerrainSurface(source);
    const mesh = createTerrainContours(source, [0.5, 1, 1.5]);
    for (let level = 0; level < 3; level++) {
      let length = 0;
      const degrees = new Map<number, number>(),
        pairs = new Set<string>();
      for (let i = 0; i < mesh.segments.length; i += 2) {
        if (mesh.levelIndices[i / 2] !== level) continue;
        const a = mesh.segments[i],
          b = mesh.segments[i + 1];
        const key = [a, b].sort((x, y) => x - y).join('/');
        expect(pairs.has(key)).toBe(false);
        pairs.add(key);
        for (const v of [a, b]) {
          degrees.set(v, (degrees.get(v) ?? 0) + 1);
          expect(mesh.positions[3 * v]).toBe(mesh.levels[level]);
          expect(mesh.positions[3 * v + 2]).toBe(mesh.levels[level]);
        }
        const x = (mesh.positions[3 * a] + mesh.positions[3 * b]) / 2,
          y = (mesh.positions[3 * a + 1] + mesh.positions[3 * b + 1]) / 2;
        expect(surface.sample(x, y).height).toBe(mesh.levels[level]);
        length += Math.hypot(
          mesh.positions[3 * b] - mesh.positions[3 * a],
          mesh.positions[3 * b + 1] - mesh.positions[3 * a + 1]
        );
      }
      expect(length).toBe(2);
      expect([...degrees.values()].filter(n => n === 1).length).toBe(2);
      expect([...degrees.values()].every(n => n <= 2)).toBe(true);
    }
  });

test('contours use the selected triangle diagonal instead of bilinear saddle topology', () => {
  const encode = (diagonal: '00-11' | '10-01') => {
    const source = field(2, 2, (x, y) => (x === y ? 0 : 1), diagonal),
      result = createTerrainContours(source, [0.5]);
    return Array.from({length: result.segments.length / 2}, (_, i) =>
      Array.from(
        result.segments.subarray(2 * i, 2 * i + 2),
        v => `${result.positions[3 * v]},${result.positions[3 * v + 1]}`
      )
        .sort()
        .join(':')
    ).sort();
  };
  expect(encode('00-11')).toEqual(['0,0.5:0.5,1', '0.5,0:1,0.5']);
  expect(encode('10-01')).toEqual(['0,0.5:0.5,0', '0.5,1:1,0.5']);
});

test('contour ties omit plateaus and point touches and deduplicate exact shared edges', () => {
  expect(
    createTerrainContours(
      field(3, 3, () => 1),
      [1]
    ).segments.length
  ).toBe(0);
  expect(
    createTerrainContours(
      field(2, 2, (x, y) => (x === 0 && y === 0 ? 1 : 0)),
      [1]
    ).positions.length
  ).toBe(0);
  const ridge = createTerrainContours(
    field(3, 2, x => (x === 1 ? 0 : -1)),
    [0]
  );
  expect(ridge.segments.length).toBe(2);
  expect(ridge.positions.length).toBe(6);
  expect(
    createTerrainContours(
      field(3, 3, () => 0),
      []
    ).segments.length
  ).toBe(0);
});

test('contours preserve missing triangle holes and affine cell-center frames', () => {
  const missing = field(2, 2, (x, y) => (x === 1 && y === 0 ? NaN : y));
  expect(createTerrainContours(missing, [0.5]).segments.length).toBe(2);
  const source = new HeightField({
    width: 3,
    height: 3,
    heights: Float64Array.from([0, 1, 2, 0, 1, 2, 0, 1, 2]),
    origin: [1e12, -1e12],
    columnStep: [-2, 1],
    rowStep: [1, 3],
    registration: 'cell',
    heightReference: 'survey'
  });
  const levels = Float64Array.from([0.5]);
  const result = createTerrainContours(source, levels);
  levels[0] = 100;
  expect(result.origin).toEqual([1e12, -1e12, 0]);
  expect(result.heightReference).toBe('survey');
  expect(result.levels[0]).toBe(0.5);
  for (let i = 0; i < result.positions.length / 3; i++) {
    const x = result.gridCoordinates[2 * i] + 0.5,
      y = result.gridCoordinates[2 * i + 1] + 0.5;
    expect(result.positions[3 * i]).toBe(-2 * x + y);
    expect(result.positions[3 * i + 1]).toBe(x + 3 * y);
  }
});

test('contours normalize overflowing height differences and fail on coordinate collapse', () => {
  const source = field(2, 2, x => (x ? 1e308 : -1e308));
  const result = createTerrainContours(source, [0]);
  for (let i = 0; i < result.positions.length; i += 3) expect(result.positions[i]).toBe(0.5);
  expect(() =>
    createTerrainContours(
      field(2, 2, (_x, y) => y),
      [0.5],
      {origin: [-(2 ** 54), 0, 0]}
    )
  ).toThrow(/collapses/);
  expect(() =>
    createTerrainContours(
      field(2, 2, x => x),
      [0.5],
      {origin: [NaN, 0, 0]}
    )
  ).toThrow(/origin/);
  expect(() =>
    createTerrainContours(
      field(2, 2, x => (x ? 1e308 : -1e308)),
      [1e307],
      {origin: [0, 0, -1.79e308]}
    )
  ).toThrow(/overflow/);
});

test('contour capacities, levels and work limits fail explicitly', () => {
  const source = field(3, 3, x => x);
  for (const levels of [[NaN], [Infinity], [1, 1], [2, 1]])
    expect(() => createTerrainContours(source, levels)).toThrow(/levels/);
  for (const options of [
    {maxSamples: 8},
    {maxLevels: 0},
    {maxTriangleTests: 7},
    {maxVertices: 0},
    {maxSegments: 0},
    {maxSamples: -1},
    {maxLevels: NaN},
    {maxVertices: 2 ** 32}
  ])
    expect(() => createTerrainContours(source, [0.5], options)).toThrow();
  const result = createTerrainContours(source, [0.5]);
  expect(
    createTerrainContours(source, [0.5], {
      maxTriangleTests: 8,
      maxVertices: result.positions.length / 3,
      maxSegments: result.segments.length / 2
    }).segments
  ).toEqual(result.segments);
});

test('interior bowl contours form a closed connected segment graph', () => {
  const source = field(5, 5, (x, y) => (x - 2) ** 2 + (y - 2) ** 2);
  const result = createTerrainContours(source, [1.5]);
  const neighbors = new Map<number, number[]>();
  for (let i = 0; i < result.segments.length; i += 2) {
    const a = result.segments[i],
      b = result.segments[i + 1];
    for (const [u, v] of [
      [a, b],
      [b, a]
    ])
      neighbors.set(u, [...(neighbors.get(u) ?? []), v]);
    const x = (result.positions[3 * a] + result.positions[3 * b]) / 2,
      y = (result.positions[3 * a + 1] + result.positions[3 * b + 1]) / 2;
    expect(source.sample(x, y, {interpolation: 'triangle'}).height).toBeCloseTo(1.5, 14);
  }
  expect(neighbors.size).toBeGreaterThan(4);
  for (const adjacent of neighbors.values()) expect(adjacent.length).toBe(2);
  const seen = new Set<number>(),
    pending = [0];
  while (pending.length) {
    const v = pending.pop()!;
    if (seen.has(v)) continue;
    seen.add(v);
    pending.push(...neighbors.get(v)!);
  }
  expect(seen.size).toBe(neighbors.size);
});
