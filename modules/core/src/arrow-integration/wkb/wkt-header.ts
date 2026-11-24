// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WellKnownDimension, WellKnownGeometry} from './types';

/** Geometry type and declared dimensions in a WKT or EWKT header. */
export type WKTHeader = Readonly<{
  /** Root geometry type in GeoJSON spelling. */
  geometryType: WellKnownGeometry['type'];
  /** Declared coordinate dimension, defaulting to XY. */
  dimension: WellKnownDimension;
  /** Optional EWKT spatial reference identifier. */
  srid?: number;
}>;

/** Supported WKT geometry tokens and their GeoJSON spelling. */
const GEOMETRY_TYPES: Readonly<Record<string, WellKnownGeometry['type']>> = {
  POINT: 'Point',
  LINESTRING: 'LineString',
  POLYGON: 'Polygon',
  MULTIPOINT: 'MultiPoint',
  MULTILINESTRING: 'MultiLineString',
  MULTIPOLYGON: 'MultiPolygon',
  GEOMETRYCOLLECTION: 'GeometryCollection'
};

/** Recognizes the header without scanning or tokenizing coordinates. */
const WKT_HEADER = /^\s*(?:SRID\s*=\s*(\d+)\s*;\s*)?([a-z]+)(?:\s+(ZM|Z|M)\b)?\s*(?=\(|EMPTY\b)/i;

/** Reads a WKT header without validating the coordinate payload or inferring dimensions. */
export function inspectWKTHeader(text: string): WKTHeader | null {
  const match = WKT_HEADER.exec(text);
  if (!match) return null;
  const geometryType = GEOMETRY_TYPES[match[2]!.toUpperCase()];
  if (!geometryType) return null;
  const srid = match[1] === undefined ? undefined : Number(match[1]);
  if (srid !== undefined && !Number.isSafeInteger(srid)) return null;
  const token = match[3]?.toUpperCase();
  const dimension = token === 'ZM' ? 'xyzm' : token === 'Z' ? 'xyz' : token === 'M' ? 'xym' : 'xy';
  return srid === undefined ? {geometryType, dimension} : {geometryType, dimension, srid};
}
