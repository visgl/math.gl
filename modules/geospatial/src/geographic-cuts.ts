// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original curve-aware latitude-domain facade; underlying solvers retain GeographicLib SPDX/MIT notices.
import {Context, createEdges, cut, same, worldAt, chartPoint} from './geographic-seams/edge';
import {clipLatitudeEdge} from './geographic-seams/latitude';
import {cutOptions, type GeographicClipOptions} from './geographic-seams/cut-options';
import {clipLatitudePolygon} from './geographic-seams/polygon';
import {
  GeographicSeamError,
  type GeographicEdgeSource,
  type GeographicSeamPolyline,
  type GeographicPolygonRing
} from './geographic-seams/types';
export {GeographicSeamError} from './geographic-seams/types';
export type {
  GeographicPolygonRing,
  GeographicEdgeSource,
  GeographicSeamPolyline
} from './geographic-seams/types';
export type {LatitudeRange} from './geographic-seams/latitude';
export type {GeographicClipOptions} from './geographic-seams/cut-options';
export type GeographicCutEdge =
  | {kind: 'source'; source: GeographicEdgeSource}
  | {kind: 'parallel'; latitude: number}
  | {kind: 'meridian'; longitude: number}
  | {kind: 'pole'; latitude: number};
export type GeographicCutRing = {positions: Float64Array; edges: GeographicCutEdge[]};
export type GeographicCutPolygon = {rings: GeographicCutRing[]};
/** Exact curve roots in a declared longitude chart and closed latitude band. */
export function clipGeographicPolyline(
  input: ArrayLike<number>,
  options: GeographicClipOptions & {longitudeTurns?: readonly number[]}
): GeographicSeamPolyline[] {
  const config = cutOptions(options),
    range = config.range,
    context = new Context(config.options),
    points = context.read(input);
  const turns = options.longitudeTurns
    ? Array.from(options.longitudeTurns)
    : new Array(Math.max(0, points.length - 1)).fill(0);
  if (turns.length !== Math.max(0, points.length - 1))
    throw new GeographicSeamError('input', 'Expected one turn count per line edge');
  if (!points.length) return [];
  if (points.length === 1) {
    const p = points[0];
    if (p[1] < range[0] || p[1] > range[1]) return [];
    const world = worldAt(p[0], context);
    return [{positions: new Float64Array(chartPoint(p, world, context)), edges: [], world}];
  }
  const parts: {points: number[][]; edges: GeographicEdgeSource[]; world: number}[] = [];
  let cursor = points[0];
  for (let i = 1; i < points.length; i++) {
    const originals = createEdges(
      cursor,
      points[i],
      points[i - 1],
      i - 1,
      0,
      turns[i - 1],
      context
    );
    for (const original of originals) {
      if (!original.source) continue;
      for (const retained of clipLatitudeEdge(original, range, context))
        for (const {edge, world} of cut(retained, context)) {
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
    cursor = originals[originals.length - 1].b;
  }
  return parts.map(p => ({
    positions: new Float64Array(p.points.flat()),
    edges: p.edges,
    world: p.world
  }));
}
/** Simple outer+holes profile, using true curve roots and parallel/meridian connectors. */
export function clipGeographicPolygon(
  inputs: readonly GeographicPolygonRing[],
  options: GeographicClipOptions
): GeographicCutPolygon[] {
  const config = cutOptions(options),
    range = config.range,
    size = options.size ?? 2;
  return clipLatitudePolygon(inputs, config.options, range).map(p => ({
    rings: p.rings.map(r => ({
      positions: r.positions,
      edges: r.edges.map((source, i): GeographicCutEdge => {
        if (source) return {kind: 'source', source};
        const a = r.positions.subarray(i * size, (i + 1) * size),
          b = r.positions.subarray((i + 1) * size, (i + 2) * size);
        if (a[1] === b[1] && Math.abs(a[1]) === 90) return {kind: 'pole', latitude: a[1]};
        if (a[1] === b[1] && range.includes(a[1])) return {kind: 'parallel', latitude: a[1]};
        if (a[0] === b[0]) return {kind: 'meridian', longitude: a[0]};
        throw new GeographicSeamError('precision', 'Unclassified generated cut boundary');
      })
    }))
  }));
}

export {subdivideGeographicCutRing} from './geographic-seams/subdivide-cut';
export type {
  SubdivideGeographicCutRingOptions,
  SubdividedGeographicCutRing
} from './geographic-seams/subdivide-cut';
