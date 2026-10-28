// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// @ts-expect-error probe.gl bench types are not exposed by the package
import type {Bench} from 'probe.gl/bench';
import type {GeoArrowColumn} from '../src/geoarrow';
import {bbox, centroid, distance} from '../src/turf';

const count = 100_000;
const coordinates = new Float64Array(count * 2);
for (let i = 0; i < count; i++) {
  coordinates[2 * i] = i % 180;
  coordinates[2 * i + 1] = i % 90;
}
const points: GeoArrowColumn = {
  encoding: 'geoarrow.point',
  dimension: 'xy',
  coordinateLayout: 'interleaved',
  chunks: [
    {
      kind: 'fixed-size-list',
      size: 2,
      length: count,
      child: {kind: 'primitive', length: count * 2, values: coordinates}
    }
  ]
};

export function turfBench(suite: Bench): Bench {
  return suite
    .group('GeoArrow Turf (100k points)')
    .add('bbox', () => bbox(points))
    .add('centroid', () => centroid(points))
    .add('distance', () => distance(points, points));
}
