// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getGeoArrowFieldInfo, type WellKnownGeometry} from '@math.gl/core/arrow';
import type {ScalarFunction} from '@math.gl/sql/arrow';
import {lineIntersectionResult} from './spatial-line-intersection-result';
import {lineKinds, nativeGeometryResult, spatialFunction} from './spatial-sql';

/** Coordinates in the path order of one line component. */
type Path = readonly (readonly number[])[];

/** A line component incident to an endpoint, with its orientation from that endpoint. */
type IncidentPath = {
  /** Index of the original line component. */
  index: number;
  /** Whether the component starts at this endpoint. */
  forward: boolean;
};

/** Paths incident to an exact XY endpoint. A closed path contributes two incidences. */
type Endpoint = IncidentPath[];

/** An input line with its start and end junctions. */
type MergePath = {
  /** Original coordinates in input order. */
  path: Path;
  /** Junction at the first vertex. */
  start: Endpoint;
  /** Junction at the final vertex. */
  end: Endpoint;
};

/** Walks exact degree-two endpoint chains, stopping at branches and retaining loops. */
export function mergeRoute(geometry: WellKnownGeometry): WellKnownGeometry {
  if (geometry.type === 'LineString') return geometry;
  if (geometry.type !== 'MultiLineString') throw new Error('ST_LineMerge requires linear geometry');

  const columns = new Map<number, Map<number, Endpoint>>();
  /** Looks up a shared endpoint using exact XY ordinates. */
  function endpoint(coordinate: readonly number[]): Endpoint {
    const x = coordinate[0]!;
    const y = coordinate[1]!;
    if (!Number.isFinite(x) || !Number.isFinite(y))
      throw new Error('ST_LineMerge requires finite coordinates');
    let column = columns.get(x);
    if (!column) {
      column = new Map();
      columns.set(x, column);
    }
    let node = column.get(y);
    if (!node) {
      node = [];
      column.set(y, node);
    }
    return node;
  }

  const lines: MergePath[] = [];
  for (const path of geometry.coordinates) {
    if (path.length < 2) continue;
    const start = endpoint(path[0]!);
    const end = endpoint(path[path.length - 1]!);
    const index = lines.length;
    start.push({index, forward: true});
    end.push({index, forward: false});
    lines.push({path, start, end});
  }

  const used = new Uint8Array(lines.length);
  const merged: Path[] = [];
  /** Writes a chain once, using the direction favored by its original components. */
  function append(first: IncidentPath): void {
    let edge: IncidentPath | undefined = first;
    let orientation = 0;
    const path: (readonly number[])[] = [];
    while (edge && !used[edge.index]) {
      const {index, forward} = edge;
      const line = lines[index]!;
      const offset = path.length ? 1 : 0;
      used[index] = 1;
      orientation += forward ? 1 : -1;
      for (let point = offset; point < line.path.length; point++)
        path.push(line.path[forward ? point : line.path.length - point - 1]!);
      const node = forward ? line.end : line.start;
      edge = node.length === 2 ? node[used[node[0]!.index] ? 1 : 0] : undefined;
    }
    if (orientation < 0) path.reverse();
    merged.push(path);
  }

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]!;
    if (used[index]) continue;
    if (line.start.length !== 2) append({index, forward: true});
    else if (line.end.length !== 2) append({index, forward: false});
  }
  for (let index = 0; index < lines.length; index++) {
    if (!used[index]) append({index, forward: true});
  }
  return merged.length === 1
    ? {type: 'LineString', coordinates: merged[0]!}
    : {type: 'MultiLineString', coordinates: merged};
}

/** Distance and interpolation on a single planar or ellipsoidal segment. */
export type RouteSegment = {
  /** Length in the function's units. */
  length: number;
  /** Returns the position at a fraction of the segment's length. */
  interpolate: (fraction: number) => readonly number[];
};

/** Describes one segment for the densification kernel. */
type RouteSegmentFactory = (a: readonly number[], b: readonly number[]) => RouteSegment;

/** Per-row bound on inserted coordinates, independent of the existing vertex count. */
const MAX_ADDED_VERTICES = 1_000_000;

/** Adds equal-length subdivisions without moving any original vertex. */
function segmentizeRoute(
  geometry: WellKnownGeometry,
  step: number,
  name: string,
  segmentFor: RouteSegmentFactory
): WellKnownGeometry {
  if (!Number.isFinite(step) || step <= 0)
    throw new Error(name + ' requires a finite positive maximum segment length');
  let added = 0;
  /** Densifies one component, sharing the insertion limit across all parts. */
  function segmentize(path: Path): Path {
    if (path.length < 2) return path;
    const coordinates: (readonly number[])[] = [path[0]!];
    for (let vertex = 1; vertex < path.length; vertex++) {
      const a = path[vertex - 1]!;
      const b = path[vertex]!;
      const segment = segmentFor(a, b);
      if (!Number.isFinite(segment.length))
        throw new Error(name + ' requires finite segment lengths');
      const parts = Math.max(Math.ceil(segment.length / step), 1);
      added += parts - 1;
      if (added > MAX_ADDED_VERTICES)
        throw new Error(name + ' would add more than 1,000,000 vertices to one row');
      for (let part = 1; part < parts; part++) coordinates.push(segment.interpolate(part / parts));
      coordinates.push(b);
    }
    return coordinates;
  }

  if (geometry.type === 'LineString')
    return {type: 'LineString', coordinates: segmentize(geometry.coordinates)};
  if (geometry.type === 'MultiLineString')
    return {type: 'MultiLineString', coordinates: geometry.coordinates.map(segmentize)};
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
  segmentFor: RouteSegmentFactory,
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

/** Measures a planar XY segment and interpolates in coordinate space. */
export function planarRouteSegment(a: readonly number[], b: readonly number[]): RouteSegment {
  const dx = b[0]! - a[0]!;
  const dy = b[1]! - a[1]!;
  return {
    length: Math.hypot(dx, dy),
    interpolate: fraction => [a[0]! + fraction * dx, a[1]! + fraction * dy]
  };
}
