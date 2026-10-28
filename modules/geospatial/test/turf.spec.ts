// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import turfArea from '@turf/area';
import turfDistance from '@turf/distance';
import turfBearing from '@turf/bearing';
import turfCentroid from '@turf/centroid';
import turfPointInPolygon from '@turf/boolean-point-in-polygon';
import {makeGeoArrowColumnFromGeometryRows, sliceGeoArrowColumn} from '../src/geoarrow';
import {area, bbox, bearing, booleanPointInPolygon, centroid, distance, length} from '../src/turf';

const point = (x: number, y: number) => ({type: 'Point' as const, coordinates: [x, y]});
const polygon = {
  type: 'Polygon' as const,
  coordinates: [
    [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0]
    ],
    [
      [2, 2],
      [4, 2],
      [4, 4],
      [2, 4],
      [2, 2]
    ]
  ]
};
const column = (values: any[]) => makeGeoArrowColumnFromGeometryRows(values);

test('batched measurements match Turf and preserve validity', () => {
  const a = column([point(179, 10), null, point(1, 2)]),
    b = column([point(-179, 11)]);
  const d = distance(a, b),
    bearings = bearing(a, b);
  expect(d.values[0]).toBeCloseTo(turfDistance(point(179, 10), point(-179, 11)), 8);
  expect(bearings.values[0]).toBeCloseTo(turfBearing(point(179, 10), point(-179, 11)), 8);
  expect(d.validity[0]).toBe(5);
  expect(() => distance(a, column([point(0, 0), point(1, 1)]))).toThrow(/lengths/);
  const line = column([
    {
      type: 'LineString',
      coordinates: [
        [0, 0],
        [1, 0],
        [1, 1]
      ]
    }
  ]);
  expect(length(line).values[0]).toBeCloseTo(
    turfDistance(point(0, 0), point(1, 0)) + turfDistance(point(1, 0), point(1, 1)),
    8
  );
});

test('polygons match Turf for area, centroid, bounds, and holes', () => {
  const p = column([polygon]);
  expect(area(p).values[0]).toBeCloseTo(turfArea(polygon), 2);
  expect([...bbox(p).values]).toEqual([0, 0, 10, 10]);
  const c = centroid(p);
  const child = c.chunks[0];
  if (child.kind !== 'fixed-size-list' || child.child.kind !== 'primitive')
    throw new Error('Expected point');
  expect([...child.child.values]).toEqual(turfCentroid(polygon).geometry.coordinates);
  const pts = column([point(1, 1), point(3, 3), point(0, 3), point(20, 3)]);
  expect([...booleanPointInPolygon(pts, p).values]).toEqual([1, 0, 1, 0]);
  expect([...booleanPointInPolygon(pts, p, {ignoreBoundary: true}).values]).toEqual([1, 0, 0, 0]);
  expect(booleanPointInPolygon(pts, p).values[1]).toBe(
    Number(turfPointInPolygon(point(3, 3), polygon))
  );
});

test('slices, empty rows and unsupported types', () => {
  const sliced = sliceGeoArrowColumn(column([point(0, 0), point(4, 5), point(9, 9)]), 1, 2);
  expect([...bbox(sliced).values]).toEqual([4, 5, 4, 5]);
  expect(distance(sliced, sliced).values[0]).toBe(0);
  const empty = column([{type: 'LineString', coordinates: []}]);
  expect(length(empty).values[0]).toBe(0);
  expect(centroid(empty).chunks[0].validity.values[0]).toBe(0);
  expect(() => area(sliced)).toThrow(/Unsupported GeoArrow encoding/);
});

test('chunked separated multipolygons and null bitmap slices', () => {
  const multi = {
    type: 'MultiPolygon' as const,
    coordinates: [
      polygon.coordinates,
      [
        [
          [20, 0],
          [21, 0],
          [21, 1],
          [20, 1],
          [20, 0]
        ]
      ]
    ]
  };
  const first = makeGeoArrowColumnFromGeometryRows([multi, null], {coordinateLayout: 'separated'});
  const second = makeGeoArrowColumnFromGeometryRows([multi], {coordinateLayout: 'separated'});
  const combined = {...first, chunks: [...first.chunks, ...second.chunks]};
  expect(area(combined).values[0]).toBeCloseTo(turfArea(multi), 2);
  expect(area(combined).validity[0]).toBe(5);
  const sliced = sliceGeoArrowColumn(combined, 1, 3);
  expect(area(sliced).validity[0]).toBe(2);
  expect([...booleanPointInPolygon(column([point(20.5, 0.5)]), sliced).values]).toEqual([0, 1]);
  expect(booleanPointInPolygon(column([point(20.5, 0.5)]), sliced).validity[0]).toBe(2);
});
