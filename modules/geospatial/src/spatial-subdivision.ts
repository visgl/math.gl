// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WellKnownGeometry} from '@math.gl/core/arrow';
import {vertexCount} from './geometry-inspection';
import {clipPolygons, type Box} from './spatial-box-clipping';
import {planarBounds} from './spatial-planar';

/** Default vertex ceiling for ST_Subdivide, including polygon closures. */
const MAX_VERTICES = 256;

/** Maximum bisection depth before reporting an unrepresentable split. */
const MAX_DEPTH = 64;

/** Individual polygon produced by rectilinear subdivision. */
type Polygon = Extract<WellKnownGeometry, {type: 'Polygon'}>;

/** Splits a rectangle at the midpoint of its wider axis. */
function splitBox(box: Box): [Box, Box] {
  const [minX, minY, maxX, maxY] = box;
  if (maxX - minX >= maxY - minY) {
    const mid = minX / 2 + maxX / 2;
    if (mid > minX && mid < maxX)
      return [
        [minX, minY, mid, maxY],
        [mid, minY, maxX, maxY]
      ];
  }
  const mid = minY / 2 + maxY / 2;
  if (mid > minY && mid < maxY)
    return [
      [minX, minY, maxX, mid],
      [minX, mid, maxX, maxY]
    ];
  throw new Error('ST_Subdivide cannot bisect the polygon at the available coordinate precision');
}

/** Emits bounded polygon parts with rectilinear cuts, retaining holes through each split. */
export function* subdividePolygons(
  geometry: WellKnownGeometry,
  signal?: AbortSignal
): Generator<Polygon> {
  if (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon') {
    throw new Error('ST_Subdivide requires a Polygon or MultiPolygon');
  }
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  for (const coordinates of polygons) {
    yield* subdividePolygon({type: 'Polygon', coordinates}, 0, signal);
  }
}

/** Recursively subdivides a single polygon until each piece fits the vertex budget. */
function* subdividePolygon(
  polygon: Polygon,
  depth: number,
  signal?: AbortSignal
): Generator<Polygon> {
  signal?.throwIfAborted();
  const count = vertexCount(polygon);
  if (!count) return;
  if (count <= MAX_VERTICES) {
    yield polygon;
    return;
  }
  if (depth >= MAX_DEPTH) throw new Error('ST_Subdivide could not reach the vertex limit');
  const bounds = planarBounds(polygon);
  if (!bounds?.every(Number.isFinite))
    throw new Error('ST_Subdivide requires finite polygon bounds');
  for (const box of splitBox(bounds as Box)) {
    for (const coordinates of clipPolygons([polygon.coordinates], box)) {
      yield* subdividePolygon({type: 'Polygon', coordinates}, depth + 1, signal);
    }
  }
}
