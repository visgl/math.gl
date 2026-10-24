// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original geographic edge-model seam adapters; existing solver attributions are retained.
import {Context, createEdges, cut, same, worldAt, chartPoint} from './geographic-seams/edge';
import type {
  GeographicSeamOptions,
  GeographicSeamPolyline,
  GeographicEdgeSource
} from './geographic-seams/types';
import {GeographicSeamError} from './geographic-seams/types';
export {splitGeographicPolygon} from './geographic-seams/polygon';
export {GeographicSeamError} from './geographic-seams/types';
export type {
  GeographicSeamOptions,
  GeographicEdgeSource,
  GeographicSeamRing,
  GeographicSeamPolyline,
  GeographicPolygonRing,
  GeographicSeamPolygon
} from './geographic-seams/types';

/** Split declared linear/geodesic/rhumb edges at a configurable longitude seam.
 * Attributes interpolate by source-edge fraction. Each part retains its original
 * world index and original-edge source intervals. Pole passages split the line.
 */
export function splitGeographicPolyline(
  input: ArrayLike<number>,
  options: GeographicSeamOptions & {
    longitudeTurns?: readonly number[];
  }
): GeographicSeamPolyline[] {
  const context = new Context(options),
    points = context.read(input);
  const turns = options.longitudeTurns
    ? Array.from(options.longitudeTurns)
    : new Array(Math.max(0, points.length - 1)).fill(0);
  if (turns.length !== Math.max(0, points.length - 1))
    throw new GeographicSeamError('input', 'Expected one turn count per line edge');
  if (!points.length) return [];
  if (points.length === 1) {
    context.addVertices(1);
    const world = worldAt(points[0][0], context),
      p = chartPoint(points[0], world, context);
    return [{positions: new Float64Array(p), edges: [], world}];
  }
  const parts: {points: number[][]; edges: GeographicEdgeSource[]; world: number}[] = [];
  let cursor = points[0];
  for (let i = 1; i < points.length; i++) {
    const edges = createEdges(
      cursor,
      points[i],
      points[i - 1],
      i - 1,
      0,
      turns[i - 1],
      context,
      false
    );
    for (const original of edges) {
      if (!original.source) continue; // Pole aliases are separate line endpoints.
      for (const {edge, world} of cut(original, context)) {
        const previous = parts[parts.length - 1];
        if (
          previous &&
          previous.world === world &&
          same(previous.points[previous.points.length - 1], edge.a)
        ) {
          previous.points.push(edge.b);
          previous.edges.push(edge.source);
        } else parts.push({points: [edge.a, edge.b], edges: [edge.source], world});
      }
    }
    cursor = edges[edges.length - 1].b;
  }
  return parts.map(part => ({
    positions: new Float64Array(part.points.flat()),
    edges: part.edges,
    world: part.world
  }));
}
