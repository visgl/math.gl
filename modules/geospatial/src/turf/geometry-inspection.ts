// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WellKnownGeometry} from '@math.gl/core/arrow';

/** Distinguishes a coordinate from the NaN tuple used for a WKB empty Point. */
function hasPosition(position: readonly number[]): boolean {
  return position.length > 0 && !position.every(Number.isNaN);
}

/** Counts stored vertices, including ring closure coordinates, through collections. */
export function vertexCount(g: WellKnownGeometry): number {
  switch (g.type) {
    case 'Point':
      return Number(hasPosition(g.coordinates));
    case 'MultiPoint':
      return g.coordinates.reduce((sum, p) => sum + Number(hasPosition(p)), 0);
    case 'LineString':
      return g.coordinates.length;
    case 'Polygon':
    case 'MultiLineString':
      return g.coordinates.reduce((sum, path) => sum + path.length, 0);
    case 'MultiPolygon':
      return g.coordinates.reduce(
        (sum, polygon) => sum + polygon.reduce((count, ring) => count + ring.length, 0),
        0
      );
    case 'GeometryCollection':
      return g.geometries.reduce((sum, child) => sum + vertexCount(child), 0);
  }
}

/** Counts top-level members of a nonempty geometry. */
export function memberCount(g: WellKnownGeometry): number {
  if (!vertexCount(g)) return 0;
  switch (g.type) {
    case 'GeometryCollection':
      return g.geometries.length;
    case 'MultiPoint':
    case 'MultiLineString':
    case 'MultiPolygon':
      return g.coordinates.length;
    default:
      return 1;
  }
}

/** Extracts one top-level member using SQL one-based indexing. */
export function geometryMember(g: WellKnownGeometry, position: number): WellKnownGeometry | null {
  if (!Number.isInteger(position)) throw new Error('ST_GeometryN requires an integer position');
  if (!vertexCount(g)) return null;
  const index = position - 1;
  switch (g.type) {
    case 'GeometryCollection':
      return g.geometries[index] ?? null;
    case 'MultiPoint':
      return g.coordinates[index] ? {type: 'Point', coordinates: g.coordinates[index]!} : null;
    case 'MultiLineString':
      return g.coordinates[index] ? {type: 'LineString', coordinates: g.coordinates[index]!} : null;
    case 'MultiPolygon':
      return g.coordinates[index] ? {type: 'Polygon', coordinates: g.coordinates[index]!} : null;
    default:
      return position === 1 ? g : null;
  }
}
