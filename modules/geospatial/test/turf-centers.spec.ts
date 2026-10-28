// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {makeGeoArrowColumnFromGeometryRows, materializeGeoArrowRows} from '../src/geoarrow/index';
import {angle, centerMean, booleanParallel} from '../src/turf';
const point = (x: number, y: number) =>
  makeGeoArrowColumnFromGeometryRows([{type: 'Point', coordinates: [x, y]}]);
test('angle supports broadcasting, rhumb and explementary modes', () => {
  expect(angle(point(0, 1), point(0, 0), point(1, 0)).values[0]).toBeCloseTo(90);
  expect(
    angle(point(0, 1), point(0, 0), point(1, 0), {mercator: true, explementary: true}).values[0]
  ).toBeCloseTo(270);
  const nullable = makeGeoArrowColumnFromGeometryRows([{type: 'Point', coordinates: [1, 0]}, null]);
  expect(angle(point(0, 1), point(0, 0), nullable).validity[0]).toBe(1);
});
test('centerMean includes repeated closing vertices and preserves nulls', () => {
  const input = makeGeoArrowColumnFromGeometryRows([
    {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [4, 0],
          [4, 4],
          [0, 4],
          [0, 0]
        ]
      ]
    },
    null
  ]);
  expect(materializeGeoArrowRows(centerMean(input))).toEqual([
    {type: 'Point', coordinates: [1.6, 1.6]},
    null
  ]);
});
test('parallel compares segment headings with broadcasting', () => {
  const line = (coordinates: number[][]) =>
    makeGeoArrowColumnFromGeometryRows([{type: 'LineString', coordinates}]);
  expect(
    booleanParallel(
      line([
        [0, 0],
        [1, 0]
      ]),
      line([
        [0, 1],
        [1, 1]
      ])
    ).values[0]
  ).toBe(1);
  expect(
    booleanParallel(
      line([
        [0, 0],
        [1, 0]
      ]),
      line([
        [0, 0],
        [0, 1]
      ])
    ).values[0]
  ).toBe(0);
});
