// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  getPolygonValidityReason,
  mergePolylinePaths,
  projectPointToPolyline,
  segmentizePolylinePaths
} from '@math.gl/geometry/polygon';
import {expect, test} from 'vitest';

test('plans and measures a route in XY with coordinate arrays', () => {
  const merged = mergePolylinePaths([
    [
      [0, 0],
      [4, 0]
    ],
    [
      [8, 0],
      [4, 0]
    ]
  ]);
  expect(segmentizePolylinePaths(merged, 3, 2)).toEqual([
    [
      [0, 0],
      [2, 0],
      [4, 0],
      [6, 0],
      [8, 0]
    ]
  ]);
  expect(projectPointToPolyline(merged[0]!, [6, 1])).toEqual({
    coordinate: [6, 0],
    distance: 1,
    fraction: 0.75
  });
});

test('detects an invalid polygon from its rings alone', () => {
  expect(
    getPolygonValidityReason([
      [
        [
          [0, 0],
          [4, 4],
          [0, 4],
          [4, 0],
          [0, 0]
        ]
      ]
    ])
  ).toMatch(/self-intersection/);
});
