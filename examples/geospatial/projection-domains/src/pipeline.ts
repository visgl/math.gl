// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {GeoArrowBuilder, tessellateGeoArrowStream} from '@math.gl/geospatial/geoarrow';
import type {GeoArrowColumn} from '@math.gl/geospatial/geoarrow';
import {createProjection} from './projections.ts';
import type {ProjectionName} from './projections.ts';

/** The small domain outline is materialized; feature buffers stream directly from GeoArrow. */
export function createDomain(name: ProjectionName) {
  const rings: [number, number][][] = [];
  let ring: [number, number][] = [];
  const stream = createProjection(name).stream({
    point(x, y) {ring.push([x, y]);},
    lineStart() {ring = [];},
    lineEnd() {
      if (ring.length < 3) return;
      const first = ring[0], last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) ring.push([...first]);
      rings.push(ring);
    }, polygonStart() {}, polygonEnd() {}
  });
  stream.sphere!();
  const column = GeoArrowBuilder.build([{type: 'Polygon', coordinates: rings}], {encoding: 'geoarrow.polygon', dimension: 'xy'});
  return {mesh: tessellateGeoArrowStream(column), rings};
}
export function projectGeometry({column, name}: {column: GeoArrowColumn; name: ProjectionName}) {
  const projection = createProjection(name);
  return {features: tessellateGeoArrowStream(column, {createStream: sink => projection.stream(sink)}), domain: createDomain(name)};
}
