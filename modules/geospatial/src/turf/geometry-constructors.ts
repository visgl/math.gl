// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WellKnownGeometry} from '@math.gl/core/arrow';

/** Collects two atomic geometries into their multi-type, retaining nesting for mixed or multipart inputs. */
export function collectPair(a: WellKnownGeometry, b: WellKnownGeometry): WellKnownGeometry {
  if (a.type === 'Point' && b.type === 'Point')
    return {type: 'MultiPoint', coordinates: [a.coordinates, b.coordinates]};
  if (a.type === 'LineString' && b.type === 'LineString')
    return {type: 'MultiLineString', coordinates: [a.coordinates, b.coordinates]};
  if (a.type === 'Polygon' && b.type === 'Polygon')
    return {type: 'MultiPolygon', coordinates: [a.coordinates, b.coordinates]};
  return {type: 'GeometryCollection', geometries: [a, b]};
}

/** Appends vertices in argument order, coalescing a shared endpoint at a LineString junction. */
export function makeLine(parts: readonly WellKnownGeometry[]): WellKnownGeometry {
  const coordinates: (readonly number[])[] = [];
  for (const part of parts) {
    if (part.type === 'Point') {
      if (part.coordinates.length) coordinates.push(part.coordinates);
    } else if (part.type === 'MultiPoint') {
      for (const point of part.coordinates)
        if (point.length && !point.every(Number.isNaN)) coordinates.push(point);
    } else if (part.type === 'LineString') {
      const previous = coordinates[coordinates.length - 1];
      const first = part.coordinates[0];
      const shared = previous && first && previous[0] === first[0] && previous[1] === first[1];
      for (let i = shared ? 1 : 0; i < part.coordinates.length; i++)
        coordinates.push(part.coordinates[i]!);
    }
  }
  return {type: 'LineString', coordinates};
}
