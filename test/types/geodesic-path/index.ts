// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GeodesicPath, EllipsoidGeodesic} from '@math.gl/geospatial/ellipsoid';
import type {GeodesicPathOptions} from '@math.gl/geospatial/ellipsoid';
import {subdivideGeodesicPolyline} from '@math.gl/geospatial/globe';
import type {SubdivideGeodesicPolylineOptions} from '@math.gl/geospatial/globe';
import {
  GeodesicPath as RootPath,
  subdivideGeodesicPolyline as rootSubdivide
} from '@math.gl/geospatial';
import {subdividePolyline} from '@math.gl/geometry/polygon';
import type {PolylineEdgeSampler} from '@math.gl/geometry/polygon';

const options: GeodesicPathOptions = {
  geodesic: new EllipsoidGeodesic({semiMajorAxis: 10, semiMinorAxis: 10})
};
const path = new GeodesicPath([0, 0] as const, new Float64Array([1, 1]), options);
const output: Float64Array = path.sample(0.5, new Float64Array(2));
const ordinary: number[] = path.sampleByDistance(path.length / 2);
const sampler: PolylineEdgeSampler = path;
const subdivision: SubdivideGeodesicPolylineOptions = {
  transform: p => p,
  tolerance: 1,
  maxSurfaceDistance: 100,
  targetSize: 2,
  ...options
};
const result = subdivideGeodesicPolyline([0, 0, 1, 1], subdivision);
subdividePolyline([0, 0, 1, 1], {
  transform: p => p,
  tolerance: 1,
  createEdgeSampler: () => sampler
});
void [output, ordinary, result, RootPath, rootSubdivide];
// @ts-expect-error array input is numeric
new GeodesicPath(['x', 'y'], [0, 0]);
const readonlyOutput: readonly number[] = [0, 0];
// @ts-expect-error caller result storage must be writable
path.sample(0.5, readonlyOutput);
// @ts-expect-error metric is mandatory for a custom source curve
const invalid: PolylineEdgeSampler = {sample: fraction => [fraction, 0]};
// @ts-expect-error source-edge factory is controlled by the geodesic adapter
subdivideGeodesicPolyline([0, 0, 1, 1], {...subdivision, createEdgeSampler: () => sampler});
void invalid;
