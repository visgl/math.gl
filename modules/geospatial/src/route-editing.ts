// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getGeoArrowFieldInfo, type WellKnownGeometry} from '@math.gl/core/arrow';
import {
  mergePolylinePaths,
  segmentizePolylinePaths,
  type PolylineSegmentFactory
} from '@math.gl/geometry/polygon';
import type {ScalarFunction} from '@math.gl/sql/arrow';
import {lineIntersectionResult} from './spatial-line-intersection-result';
import {lineKinds, nativeGeometryResult, spatialFunction} from './spatial-sql';

/** Wraps exact XY endpoint merging in a SQL line result. */
export function mergeRoute(geometry: WellKnownGeometry): WellKnownGeometry {
  if (geometry.type === 'LineString') return geometry;
  if (geometry.type !== 'MultiLineString') throw new Error('ST_LineMerge requires linear geometry');
  const merged = mergePolylinePaths(geometry.coordinates);
  return merged.length === 1
    ? {type: 'LineString', coordinates: merged[0]!}
    : {type: 'MultiLineString', coordinates: merged};
}

/** Per-row bound on inserted coordinates, independent of the existing vertex count. */
const MAX_ADDED_VERTICES = 1_000_000;

/** Preserves the SQL line family while using the coordinate-space kernel. */
function segmentizeRoute(
  geometry: WellKnownGeometry,
  step: number,
  name: string,
  segmentFor: PolylineSegmentFactory | undefined
): WellKnownGeometry {
  if (!Number.isFinite(step) || step <= 0)
    throw new Error(name + ' requires a finite positive maximum segment length');
  if (geometry.type === 'LineString') {
    const [coordinates] = segmentizePolylinePaths(
      [geometry.coordinates],
      step,
      MAX_ADDED_VERTICES,
      segmentFor
    );
    return {type: 'LineString', coordinates: coordinates!};
  }
  if (geometry.type === 'MultiLineString') {
    return {
      type: 'MultiLineString',
      coordinates: segmentizePolylinePaths(
        geometry.coordinates,
        step,
        MAX_ADDED_VERTICES,
        segmentFor
      )
    };
  }
  throw new Error(name + ' requires linear geometry');
}

/** Chooses fixed native line storage where the input guarantees the result family. */
export function routeEditingFunction(
  name: string,
  preservesLineKind: boolean,
  evaluate: (geometry: WellKnownGeometry, ...numbers: number[]) => WellKnownGeometry,
  numericArguments = 0,
  validateCRS?: (crs: unknown, name: string) => void
): ScalarFunction {
  return {
    kind: 'scalar',
    name,
    prototypes: [],
    /** Binds a stable native output for specialized, WKB, and mixed inputs. */
    resolvePrototype(fields) {
      const encoding = fields[0] && getGeoArrowFieldInfo(fields[0])?.encoding;
      const output =
        encoding === 'geoarrow.linestring' ||
        (preservesLineKind && encoding === 'geoarrow.multilinestring')
          ? nativeGeometryResult(encoding)
          : lineIntersectionResult();
      return spatialFunction(
        name,
        [lineKinds],
        output,
        ([geometry], ...numbers) => evaluate(geometry!, ...numbers),
        numericArguments,
        false,
        false,
        validateCRS
      ).resolvePrototype!(fields);
    }
  };
}

/** Binds segmentization with a planar or ellipsoidal metric. */
export function segmentizeFunction(
  name: string,
  segmentFor?: PolylineSegmentFactory,
  validateCRS?: (crs: unknown, name: string) => void
): ScalarFunction {
  return routeEditingFunction(
    name,
    true,
    (geometry, step) => segmentizeRoute(geometry, step!, name, segmentFor),
    1,
    validateCRS
  );
}
