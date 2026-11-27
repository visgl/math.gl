// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  createBreaklineTerrainMesh,
  HeightField,
  splitTerrainBreaklines
} from '@math.gl/geospatial/terrain';

test('split crossings and T-junctions into a mesher-ready graph with provenance', () => {
  const result = splitTerrainBreaklines([
    [
      [0.5, 2, 0],
      [3.5, 2, 0]
    ],
    [
      [2, 0.5, 0],
      [2, 3.5, 0]
    ],
    [
      [3, 2, 0],
      [3, 3, 0]
    ]
  ]);
  expect([...result.sourceSegments]).toEqual([0, 0, 0, 1, 1, 2]);
  expect(result.segments[0][1]).toBe(result.segments[3][1]);
  expect(result.segments[1][1]).toBe(result.segments[5][0]);
  const field = new HeightField({width: 5, height: 5, heights: new Float64Array(25)});
  const mesh = createBreaklineTerrainMesh(field, {breaklines: result.segments, maxError: 0});
  expect(mesh.breaklineEdges.length).toBe(12);
});

test('reject ambiguous overlaps, inconsistent junction heights and exhausted work', () => {
  expect(() =>
    splitTerrainBreaklines([
      [
        [0, 0, 0],
        [2, 0, 0]
      ],
      [
        [1, 0, 0],
        [3, 0, 0]
      ]
    ])
  ).toThrow(/overlap/i);
  const lines = [
    [
      [0, 0, 0],
      [2, 2, 0]
    ],
    [
      [0, 2, 1],
      [2, 0, 1]
    ]
  ] as const;
  expect(() => splitTerrainBreaklines(lines)).toThrow(/height/i);
  expect(() => splitTerrainBreaklines(lines, {maxPairTests: 0})).toThrow(/limit/i);
});
