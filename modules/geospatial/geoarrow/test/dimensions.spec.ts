// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {inferGeoArrowGeometryDimension, mergeGeoArrowDimensions} from '../../src/geoarrow/index';

test('merges elevation and measure dimensions independently', () => {
  expect(mergeGeoArrowDimensions('xy', 'xym')).toBe('xym');
  expect(mergeGeoArrowDimensions('xyz', 'xym')).toBe('xyzm');
  expect(mergeGeoArrowDimensions('xym', 'xyz')).toBe('xyzm');
});

test('infers dimensions across nested coordinates and geometry collections', () => {
  expect(inferGeoArrowGeometryDimension({type: 'Point', coordinates: [1, 2]})).toBe('xy');
  expect(inferGeoArrowGeometryDimension({type: 'Point', coordinates: [1, 2, 3]})).toBe('xyz');
  expect(inferGeoArrowGeometryDimension({type: 'Point', coordinates: [1, 2, 3, 4]})).toBe('xyzm');
  expect(
    inferGeoArrowGeometryDimension({
      type: 'MultiLineString',
      coordinates: [
        [],
        [
          [0, 0],
          [1, 1, 2, 3]
        ]
      ]
    })
  ).toBe('xyzm');
  expect(
    inferGeoArrowGeometryDimension({
      type: 'GeometryCollection',
      geometries: [
        {type: 'Polygon', coordinates: []},
        {type: 'Point', coordinates: [1, 2, 3]}
      ]
    })
  ).toBe('xyz');
  expect(inferGeoArrowGeometryDimension({type: 'GeometryCollection', geometries: []})).toBe('xy');
});
