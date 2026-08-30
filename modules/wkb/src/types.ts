// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Semantic coordinate dimensions used by WKB and WKT. M is distinct from Z. */
export type WellKnownDimension = 'xy' | 'xyz' | 'xym' | 'xyzm';

/** Immutable, format-neutral geometry value shared by the WKB and WKT codecs. */
export type WellKnownGeometry =
  | Readonly<{type: 'Point'; coordinates: readonly number[]}>
  | Readonly<{type: 'LineString'; coordinates: readonly (readonly number[])[]}>
  | Readonly<{type: 'Polygon'; coordinates: readonly (readonly (readonly number[])[])[]}>
  | Readonly<{type: 'MultiPoint'; coordinates: readonly (readonly number[])[]}>
  | Readonly<{
      type: 'MultiLineString';
      coordinates: readonly (readonly (readonly number[])[])[];
    }>
  | Readonly<{
      type: 'MultiPolygon';
      coordinates: readonly (readonly (readonly (readonly number[])[])[])[];
    }>
  | Readonly<{type: 'GeometryCollection'; geometries: readonly WellKnownGeometry[]}>;

/** Returns the number of coordinate components in a semantic dimension. */
export function getWellKnownDimensionSize(dimension: WellKnownDimension): 2 | 3 | 4 {
  switch (dimension) {
    case 'xy':
      return 2;
    case 'xyz':
    case 'xym':
      return 3;
    case 'xyzm':
      return 4;
  }
}

/** Infers tuple width from the deepest non-empty geometry coordinate. Three values mean XYZ. */
export function inferWellKnownGeometryDimension(geometry: WellKnownGeometry): WellKnownDimension {
  const size = getGeometryDimensionSize(geometry);
  return size >= 4 ? 'xyzm' : size === 3 ? 'xyz' : 'xy';
}

function getGeometryDimensionSize(geometry: WellKnownGeometry): number {
  if (geometry.type === 'GeometryCollection') {
    return Math.max(2, ...geometry.geometries.map(getGeometryDimensionSize));
  }
  return getCoordinateDimension(geometry.coordinates);
}

function getCoordinateDimension(value: readonly unknown[]): number {
  if (value.length === 0) return 2;
  if (typeof value[0] === 'number') return value.length;
  return Math.max(2, ...value.map(child => getCoordinateDimension(child as readonly unknown[])));
}
