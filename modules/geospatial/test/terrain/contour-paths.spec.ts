// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {HeightField} from '@math.gl/geospatial/terrain';
import {createTerrainContours, type TerrainContours} from '@math.gl/geospatial/terrain/contours';
import {stitchTerrainContours} from '@math.gl/geospatial/terrain/contour-paths';

function graph(
  points: number[],
  edges: number[],
  levels = [0],
  levelIndices?: number[]
): TerrainContours {
  return {
    positions: Float64Array.from(points),
    gridCoordinates: Float64Array.from({length: (points.length / 3) * 2}, (_, i) => i),
    segments: Uint32Array.from(edges),
    levels: Float64Array.from(levels),
    levelIndices: Uint32Array.from(levelIndices ?? Array(edges.length / 2).fill(0)),
    origin: [0, 0, 0],
    heightReference: 'survey'
  };
}
function represented(paths: ReturnType<typeof stitchTerrainContours>): string[] {
  const result: string[] = [];
  for (let p = 0; p < paths.closed.length; p++)
    for (let i = paths.offsets[p] + 1; i < paths.offsets[p + 1]; i++)
      result.push([paths.indices[i - 1], paths.indices[i]].sort((a, b) => a - b).join('/'));
  return result.sort();
}

test('stitching traces disconnected chains, cycles and isolated vertices without losing edges', () => {
  const source = graph(
    [0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 2, 0, 1, 2, 0, 0, 3, 0, 9, 9, 0],
    [1, 2, 0, 1, 3, 4, 4, 5, 5, 3]
  );
  const paths = stitchTerrainContours(source);
  expect(Array.from(paths.offsets)).toEqual([0, 3, 7]);
  expect(Array.from(paths.closed)).toEqual([0, 1]);
  expect(represented(paths)).toEqual(['0/1', '1/2', '3/4', '3/5', '4/5']);
  expect(paths.indices[3]).toBe(paths.indices[6]);
  paths.positions[0] = 99;
  paths.indices[0] = 6;
  paths.levels[0] = 3;
  expect(source.positions[0]).toBe(0);
  expect(source.levels[0]).toBe(0);
});

test('branches terminate paths and a loop attached to a branch remains explicitly closed', () => {
  const star = graph([0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0], [0, 1, 2, 0, 0, 3, 4, 0]);
  const paths = stitchTerrainContours(star);
  expect(paths.closed.length).toBe(4);
  expect(Array.from(paths.closed)).toEqual([0, 0, 0, 0]);
  expect(represented(paths)).toEqual(['0/1', '0/2', '0/3', '0/4']);
  const loop = graph([0, 0, 0, 1, 0, 0, 0, 1, 0, -1, 0, 0], [0, 1, 1, 2, 2, 0, 0, 3]);
  const linked = stitchTerrainContours(loop);
  expect(Array.from(linked.closed).sort()).toEqual([0, 1]);
  expect(represented(linked)).toEqual(['0/1', '0/2', '0/3', '1/2']);
});

test('stitching keeps levels and coincident coordinates separate by vertex identity', () => {
  const source = graph(
    [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1],
    [0, 1, 2, 3, 4, 5],
    [0, 1],
    [0, 0, 1]
  );
  const paths = stitchTerrainContours(source);
  expect(paths.closed.length).toBe(3);
  expect(Array.from(paths.levelIndices)).toEqual([0, 0, 1]);
  const empty = stitchTerrainContours(graph([], []), {
    maxVertices: 0,
    maxSegments: 0,
    maxPaths: 0,
    maxIndices: 0
  });
  expect(Array.from(empty.offsets)).toEqual([0]);
});

test('extracted hill contours stitch into independent closed paths at each level', () => {
  const field = new HeightField({
    width: 7,
    height: 7,
    heights: Float64Array.from(
      {length: 49},
      (_, i) => ((i % 7) - 3) ** 2 + (Math.floor(i / 7) - 3) ** 2
    )
  });
  const contours = createTerrainContours(field, [1.5, 4.5]);
  const paths = stitchTerrainContours(contours);
  expect(Array.from(paths.closed)).toEqual([1, 1]);
  expect(Array.from(paths.levelIndices)).toEqual([0, 1]);
  expect(represented(paths).length).toBe(contours.segments.length / 2);
});

test('stitching validates graph metadata and bounded capacities', () => {
  const source = graph([0, 0, 0, 1, 0, 0, 2, 0, 0], [0, 1, 1, 2]);
  for (const options of [
    {maxVertices: 2},
    {maxSegments: 1},
    {maxPaths: 0},
    {maxIndices: 2},
    {maxLevels: 0},
    {maxPaths: -1},
    {maxPaths: Infinity},
    {maxPaths: 2 ** 32}
  ])
    expect(() => stitchTerrainContours(source, options)).toThrow();
  expect(
    stitchTerrainContours(source, {
      maxVertices: 3,
      maxSegments: 2,
      maxPaths: 1,
      maxIndices: 3,
      maxLevels: 1
    }).indices.length
  ).toBe(3);
  for (const bad of [
    {...source, positions: new Float64Array([NaN, 0, 0])},
    {...source, gridCoordinates: new Float64Array(2)},
    {...source, levels: Float64Array.from([1, 1])},
    {...source, levels: Float64Array.from([NaN])},
    {...source, origin: [0, 0, NaN] as const},
    {...source, heightReference: 1 as never},
    {...source, segments: Uint32Array.from([0])},
    {...source, levelIndices: new Uint32Array(1)},
    {...source, segments: Uint32Array.from([0, 99, 1, 2])},
    {...source, levelIndices: Uint32Array.from([1, 0])},
    {...source, segments: Uint32Array.from([0, 0, 1, 2])},
    {...source, segments: Uint32Array.from([0, 1, 1, 0])},
    {...source, positions: Float64Array.from([0, 0, 0, 0, 0, 0, 2, 0, 0])},
    {...source, levels: Float64Array.from([1])}
  ])
    expect(() => stitchTerrainContours(bad)).toThrow();
  expect(() =>
    stitchTerrainContours({
      ...source,
      levels: Float64Array.from([0, 1]),
      levelIndices: Uint32Array.from([0, 1])
    })
  ).toThrow(/multiple levels/);
});
