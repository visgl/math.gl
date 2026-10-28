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

test('empty point sentinels do not contaminate calculations', () => {
  const empty = column([point(NaN, NaN)]);
  expect(centroid(empty).chunks[0].validity.values[0]).toBe(0);
  expect(distance(empty, column([point(1, 2)])).validity[0]).toBe(0);
  const multi = column([
    {
      type: 'MultiPoint',
      coordinates: [
        [NaN, NaN],
        [4, 6]
      ]
    }
  ]);
  expect([...bbox(multi).values]).toEqual([4, 6, 4, 6]);
  const out = centroid(multi).chunks[0];
  if (out.kind !== 'fixed-size-list' || out.child.kind !== 'primitive')
    throw new Error('Expected point');
  expect([...out.child.values]).toEqual([4, 6]);
});

test('null coordinate components and exterior rings do not produce false results', () => {
  const separated = makeGeoArrowColumnFromGeometryRows([point(1, 2)], {
    coordinateLayout: 'separated'
  });
  const chunk = separated.chunks[0];
  if (chunk.kind !== 'struct' || chunk.children.x.kind !== 'primitive')
    throw new Error('Expected separated point');
  const invalid = {
    ...separated,
    chunks: [
      {
        ...chunk,
        children: {
          ...chunk.children,
          x: {...chunk.children.x, validity: {values: new Uint8Array([0])}}
        }
      }
    ]
  };
  expect(distance(invalid, separated).validity[0]).toBe(0);
  const poly = column([polygon]);
  const outer = poly.chunks[0];
  if (outer.kind !== 'list' || outer.child.kind !== 'list') throw new Error('Expected polygon');
  const missingOuter = {
    ...poly,
    chunks: [{...outer, child: {...outer.child, validity: {values: new Uint8Array([2])}}}]
  };
  expect(area(missingOuter).values[0]).toBe(0);
  expect(booleanPointInPolygon(column([point(1, 1)]), missingOuter).values[0]).toBe(0);
});

test('coordinate transforms preserve rows and round-trip Web Mercator', async () => {
  const {truncate, toMercator, toWgs84} = await import('../src/turf');
  const input = column([point(12.3456789, 45.1234567), null]);
  const rounded = truncate(input, {precision: 3});
  expect([...bbox(rounded).values].slice(0, 2)).toEqual([12.346, 45.123]);
  const output = toWgs84(toMercator(input));
  const bounds = bbox(output);
  expect(bounds.validity[0]).toBe(1);
  expect(bounds.values[0]).toBeCloseTo(12.3456789, 9);
  expect(bounds.values[1]).toBeCloseTo(45.1234567, 9);
  expect(() => truncate(input, {precision: -1})).toThrow(RangeError);
});

test('batched destination, midpoint and bounds center', async () => {
  const {destination, midpoint, center} = await import('../src/turf');
  const {default: turfDestination} = await import('@turf/destination');
  const source = {...column([point(10, 20), null]), metadata: {label: 'test'}};
  expect(destination(source, 100, 45).metadata).toEqual(source.metadata);
  const expected = turfDestination([10, 20], 100, 45).geometry.coordinates;
  const actual = bbox(destination(source, 100, 45));
  expect(actual.values[0]).toBeCloseTo(expected[0], 10);
  expect(actual.values[1]).toBeCloseTo(expected[1], 10);
  expect(actual.validity[0]).toBe(1);
  const half = bbox(midpoint(column([point(0, 0)]), column([point(20, 0)])));
  expect(half.values[0]).toBeCloseTo(10, 10);
  expect(half.values[1]).toBeCloseTo(0, 10);
  expect([...bbox(center(column([polygon]))).values]).toEqual([5, 5, 5, 5]);
});
