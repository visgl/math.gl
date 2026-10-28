// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {RhumbPath, EllipsoidRhumb} from '@math.gl/geospatial';
import type {RhumbPathOptions} from '@math.gl/geospatial';
import {
  subdivideRhumbPolyline,
  splitGeographicPolyline,
  splitGeographicPolygon,
  GeographicSeamError
} from '@math.gl/geospatial';
import type {
  GeographicSeamOptions,
  GeographicPolygonRing,
  GeographicSeamPolygon,
  GeographicEdgeSource
} from '@math.gl/geospatial';
import {RhumbPath as RootPath, splitGeographicPolygon as rootSplit} from '@math.gl/geospatial';
const options: RhumbPathOptions = {
  rhumb: new EllipsoidRhumb({semiMajorAxis: 1, semiMinorAxis: 1}),
  longitudeMode: 'unrolled'
};
const path = new RhumbPath([0, 30] as const, new Float64Array([360, 30]), options);
const floating: Float32Array = path.sample(0.5, new Float32Array(2));
const ordinary: number[] = path.sampleByDistance(path.length / 2);
const seams: GeographicSeamOptions = {
  edgeModel: 'rhumb',
  rhumb: options.rhumb,
  size: 2,
  seamLongitude: 180,
  maxWork: 100000
};
const rings: GeographicPolygonRing[] = [{positions: [170, -10, 190, -10, 190, 10, 170, 10]}];
const polygons: GeographicSeamPolygon[] = splitGeographicPolygon(rings, seams);
const parts = splitGeographicPolyline([0, 30, 0, 30], {...seams, longitudeTurns: [1]});
const source: GeographicEdgeSource | null | undefined = parts[0]?.edges[0];
const sampled = subdivideRhumbPolyline([-180, 30, 180, 30], {
  rhumb: options.rhumb,
  longitudeMode: 'unrolled',
  transform: p => p,
  tolerance: 0.1,
  maxSurfaceDistance: 1
});
const error = new GeographicSeamError('limit', 'budget');
void [floating, ordinary, polygons, source, sampled, error, RootPath, rootSplit];
// @ts-expect-error an explicit model is required
splitGeographicPolyline([0, 0, 1, 1], {});
// @ts-expect-error model names are checked
splitGeographicPolygon(rings, {edgeModel: 'great-circle'});
// @ts-expect-error pole names are checked
splitGeographicPolygon([{positions: [], pole: 'west'}], seams);
// @ts-expect-error coordinates are numeric
new RhumbPath(['x', 'y'], [0, 0]);
// @ts-expect-error result storage is writable
path.sample(0.5, [0, 0] as readonly number[]);
