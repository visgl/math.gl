// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {triangulateDelaunay} from '@math.gl/geometry/processing';

test('triangulates a point inside a hull using original input indices', () => {
  const triangles = triangulateDelaunay([
    [0, 0],
    [5, 0],
    [0, 0],
    [0, 5],
    [1, 1]
  ]);
  const faces = triangles.map(face => [...face].sort().join(',')).sort();
  expect(faces).toEqual(['0,1,4', '0,3,4', '1,3,4']);
});

test('chooses the locally Delaunay diagonal of an asymmetric quadrilateral', () => {
  const faces = triangulateDelaunay([
    [0, 0],
    [3, 0],
    [2, 1],
    [0, 3]
  ]);
  expect(faces.map(face => [...face].sort().join(',')).sort()).toEqual(['0,1,2', '0,2,3']);
});

test('handles insufficient or collinear sites and rejects nonfinite coordinates', () => {
  expect(triangulateDelaunay([])).toEqual([]);
  expect(
    triangulateDelaunay([
      [1, 2],
      [1, 2],
      [2, 3]
    ])
  ).toEqual([]);
  expect(
    triangulateDelaunay([
      [1, 2],
      [2, 3],
      [3, 4]
    ])
  ).toEqual([]);
  expect(() => triangulateDelaunay([[Infinity, 0]])).toThrow(RangeError);
});
