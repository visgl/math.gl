// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  intersectPolygons,
  unionPolygons,
  subtractPolygons,
  xorPolygons,
  type OverlayPolygon
} from '../../src/polygon';

/** Creates a closed rectangle in counterclockwise order. */
function box(x: number, y: number, right: number, top: number): OverlayPolygon {
  return [
    [
      [x, y],
      [right, y],
      [right, top],
      [x, top],
      [x, y]
    ]
  ];
}

test('overlays polygonal areas, including edge contacts and disconnected output', () => {
  const left = box(0, 0, 2, 1);
  const right = box(1, 0, 3, 1);
  expect(unionPolygons(left, right)).toEqual([box(0, 0, 3, 1)]);
  expect(intersectPolygons(left, right)).toEqual([box(1, 0, 2, 1)]);
  expect(xorPolygons(left, right)).toEqual([box(0, 0, 1, 1), box(2, 0, 3, 1)]);
  expect(intersectPolygons(left, box(2, 0, 3, 1))).toEqual([]);
});

test('preserves holes in subsequent multipolygon operations', () => {
  const shell = box(0, 0, 5, 5);
  const hole = box(1, 1, 4, 4);
  const donut = subtractPolygons(shell, hole);
  expect(donut[0]).toHaveLength(2);
  expect(intersectPolygons(donut, hole)).toEqual([]);
  expect(unionPolygons(donut, hole)).toEqual([shell]);
});
