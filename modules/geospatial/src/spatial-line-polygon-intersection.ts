// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WellKnownGeometry} from '@math.gl/core/arrow';
import {locatePointInPolygon, pointOnSegment, segmentsMeet} from './spatial-planar-intersects';
import {endpointContacts, parameter} from './spatial-touches';

/** One XY position. */
type Position = readonly number[];
/** One line or polygon ring. */
type Path = readonly Position[];
/** Endpoints of one segment. */
type Edge = readonly [Position, Position];

/** Tests equality of XY positions. */
function same(a: Position, b: Position): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

/** Interpolates between endpoints without perturbing original vertices. */
function interpolate(a: Position, b: Position, t: number): Position {
  if (t === 0) return a;
  if (t === 1) return b;
  return [(1 - t) * a[0]! + t * b[0]!, (1 - t) * a[1]! + t * b[1]!];
}

/** Returns the position of a proper segment crossing along the first segment. */
function crossingParameter([a, b]: Edge, [c, d]: Edge): number {
  const dx = b[0]! - a[0]!;
  const dy = b[1]! - a[1]!;
  const ux = d[0]! - c[0]!;
  const uy = d[1]! - c[1]!;
  const x = c[0]! - a[0]!;
  const y = c[1]! - a[1]!;
  const scale = Math.max(
    Math.abs(dx),
    Math.abs(dy),
    Math.abs(ux),
    Math.abs(uy),
    Math.abs(x),
    Math.abs(y)
  );
  return (
    ((x / scale) * (uy / scale) - (y / scale) * (ux / scale)) /
    ((dx / scale) * (uy / scale) - (dy / scale) * (ux / scale))
  );
}

/** Clips linear components to polygon interiors and boundaries, retaining isolated contacts. */
export function intersectLinePolygon(
  line: WellKnownGeometry,
  area: WellKnownGeometry
): WellKnownGeometry {
  if (line.type !== 'LineString' && line.type !== 'MultiLineString')
    throw new Error('Line–polygon intersection requires a linear geometry');
  if (area.type !== 'Polygon' && area.type !== 'MultiPolygon')
    throw new Error('Line–polygon intersection requires a polygonal geometry');
  const polygons = area.type === 'Polygon' ? [area.coordinates] : area.coordinates;
  const boundaries: Edge[] = [];
  for (const ring of polygons.flat()) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[(i + ring.length - 1) % ring.length]!;
      const b = ring[i]!;
      if (!same(a, b)) boundaries.push([a, b]);
    }
  }

  /** Tests membership in the closed areal geometry. */
  const covered = (point: Position): boolean =>
    polygons.some(rings => locatePointInPolygon(point, rings) >= 0);
  const lines: Position[][] = [];
  const contacts = new Map<string, Position>();
  /** Deduplicates point contacts across adjacent segments and components. */
  const addPoint = (point: Position) => contacts.set(`${point[0]}/${point[1]}`, point);
  for (const path of line.type === 'LineString' ? [line.coordinates] : line.coordinates) {
    if (!path.length) continue;
    let current: Position[] | undefined;
    if (covered(path[0]!)) addPoint(path[0]!);
    for (let index = 1; index < path.length; index++) {
      const a = path[index - 1]!;
      const b = path[index]!;
      if (same(a, b)) continue;
      const segment: Edge = [a, b];
      const cuts = new Map<number, Position>([
        [0, a],
        [1, b]
      ]);
      const overlap: [number, number][] = [];
      for (const boundary of boundaries) {
        if (!segmentsMeet(...segment, ...boundary)) continue;
        const endpoints = endpointContacts(segment, boundary);
        if (!endpoints.length) {
          const t = crossingParameter(segment, boundary);
          if (!(t >= 0 && t <= 1)) throw new Error('Unable to locate polygon boundary crossing');
          const [x, y] = interpolate(a, b, t);
          const [c, d] = boundary;
          cuts.set(t, [c[0] === d[0] ? c[0]! : x!, c[1] === d[1] ? c[1]! : y!]);
          continue;
        }
        const parameters = endpoints.map(point => parameter(point, segment));
        for (let contact = 0; contact < endpoints.length; contact++) {
          cuts.set(parameters[contact]!, endpoints[contact]!);
          addPoint(endpoints[contact]!);
        }
        if (parameters.length === 2)
          overlap.push([Math.min(...parameters), Math.max(...parameters)]);
      }

      const entries = [...cuts].sort(([x], [y]) => x - y);
      for (let i = 1; i < entries.length; i++) {
        const [from, first] = entries[i - 1]!;
        const [to, last] = entries[i]!;
        if (
          !overlap.some(([start, end]) => start <= from && to <= end) &&
          !covered(interpolate(a, b, (from + to) / 2))
        ) {
          current = undefined;
          continue;
        }
        if (same(first, last)) continue;
        if (current && same(current[current.length - 1]!, first)) current.push(last);
        else {
          current = [first, last];
          lines.push(current);
        }
      }
    }
  }
  const retainedEdges = [...lineEdges(lines)];
  const points = [...contacts.values()].filter(
    point => !retainedEdges.some(([a, b]) => pointOnSegment(point, a, b))
  );
  const parts: WellKnownGeometry[] = [];
  if (lines.length === 1) parts.push({type: 'LineString', coordinates: lines[0]!});
  else if (lines.length) parts.push({type: 'MultiLineString', coordinates: lines});
  if (points.length === 1) parts.push({type: 'Point', coordinates: points[0]!});
  else if (points.length) parts.push({type: 'MultiPoint', coordinates: points});
  return parts.length === 1 ? parts[0]! : {type: 'GeometryCollection', geometries: parts};
}

/** Iterates segments of already clipped linear components. */
function* lineEdges(paths: readonly Path[]): Generator<Edge> {
  for (const path of paths) {
    for (let i = 1; i < path.length; i++) yield [path[i - 1]!, path[i]!];
  }
}
