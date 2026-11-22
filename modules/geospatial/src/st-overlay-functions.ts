// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GeoArrowBuilder,
  makeArrowVectorFromGeoArrowColumn,
  type WellKnownGeometry
} from '@math.gl/core/arrow';
import polygonClipping from 'polygon-clipping';
import {
  EXTENSION_METADATA,
  pointCoordinates,
  pointKinds,
  polygonKinds,
  spatialFunction,
  type NativeSpatialResult
} from './spatial-sql';

/** Declares a fixed native polygon layout, including for empty or all-null batches. */
function nativePolygonResult(encoding: NativeSpatialResult['encoding']): NativeSpatialResult {
  const options = {encoding, dimension: 'xy', coordinateLayout: 'interleaved'} as const;
  /** Packs the output rings into GeoArrow list offsets and interleaved XY coordinates. */
  const build: NativeSpatialResult['build'] = rows =>
    makeArrowVectorFromGeoArrowColumn(GeoArrowBuilder.build(rows, options));
  return {encoding, type: build([]).type, build};
}

/** Eight unit directions per quadrant with exact cardinal axes. */
const unitCircle = /* @__PURE__ */ Array.from({length: 32}, (_, index) => {
  const angle = ((index % 8) * Math.PI) / 16;
  const x = Math.cos(angle);
  const y = Math.sin(angle);
  switch (index >>> 3) {
    case 0:
      return [x, y];
    case 1:
      return [-y, x];
    case 2:
      return [-x, -y];
    default:
      return [y, -x];
  }
});

/** Returns a circle approximation with PostGIS's default eight segments per quadrant. */
function bufferPoint(point: WellKnownGeometry, radius: number): WellKnownGeometry {
  if (!Number.isFinite(radius)) throw new Error('ST_Buffer requires a finite radius');
  const location = pointCoordinates(point);
  if (!location || radius <= 0) return {type: 'Polygon', coordinates: []};
  const ring = unitCircle.map(([x, y]) => [location[0]! + radius * x!, location[1]! + radius * y!]);
  if (ring.some(point => !point.every(Number.isFinite))) {
    throw new Error('ST_Buffer produced a nonfinite coordinate');
  }
  ring.push(ring[0]!);
  return {type: 'Polygon', coordinates: [ring]};
}

/** Buffers a planar point into a native GeoArrow Polygon. */
export const ST_BUFFER = /* @__PURE__ */ spatialFunction(
  'ST_Buffer',
  [pointKinds],
  /* @__PURE__ */ nativePolygonResult('geoarrow.polygon'),
  ([geometry], radius) => bufferPoint(geometry!, radius!),
  1
);

/** Converts native polygon rings to the existing polygon overlay kernel's input. */
function polygonSet(geometry: WellKnownGeometry): polygonClipping.MultiPolygon {
  const polygons =
    geometry.type === 'Polygon'
      ? [geometry.coordinates]
      : geometry.type === 'MultiPolygon'
        ? geometry.coordinates
        : [];
  return polygons
    .filter(polygon => polygon[0]?.length)
    .map(polygon =>
      polygon
        .filter(ring => ring.length)
        .map(ring =>
          ring.map(([x, y]) => {
            if (!Number.isFinite(x) || !Number.isFinite(y))
              throw new Error('Polygon overlay requires finite coordinates');
            return [x!, y!];
          })
        )
    );
}

/** Creates a row-preserving areal overlay with the first geometry's metadata. */
function polygonOverlay(name: string, operation: typeof polygonClipping.intersection) {
  const spatial = spatialFunction(
    name,
    [polygonKinds, polygonKinds],
    nativePolygonResult('geoarrow.multipolygon'),
    ([left, right]): WellKnownGeometry => {
      const a = polygonSet(left!);
      const b = polygonSet(right!);
      return {type: 'MultiPolygon', coordinates: operation(a, b)};
    }
  );
  return {
    ...spatial,
    /** Preserves the first input's metadata. Overlay does not assign a missing CRS. */
    resolvePrototype(fields: Parameters<NonNullable<typeof spatial.resolvePrototype>>[0]) {
      const result = spatial.resolvePrototype!(fields);
      if (!fields[0]?.metadata.has(EXTENSION_METADATA)) {
        result?.result.metadata.delete(EXTENSION_METADATA);
      }
      return result;
    }
  };
}

/** Returns the shared polygon area as a native GeoArrow MultiPolygon. */
export const ST_INTERSECTION = /* @__PURE__ */ polygonOverlay(
  'ST_Intersection',
  polygonClipping.intersection
);
/** Returns the portion of the first polygonal geometry outside the second. */
export const ST_DIFFERENCE = /* @__PURE__ */ polygonOverlay(
  'ST_Difference',
  polygonClipping.difference
);

/** Returns the combined polygon area as a native GeoArrow MultiPolygon. */
export const ST_UNION = /* @__PURE__ */ polygonOverlay('ST_Union', polygonClipping.union);

/** Returns the area covered by exactly one input as a native GeoArrow MultiPolygon. */
export const ST_SYMDIFFERENCE = /* @__PURE__ */ polygonOverlay(
  'ST_SymDifference',
  polygonClipping.xor
);
