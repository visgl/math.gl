// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WellKnownGeometry} from '@math.gl/core/arrow';
import {anyOverlap, type Bounded} from './spatial-bounds-sweep';
import {locateMidpointInPolygon} from './spatial-exact-midpoint';
import {planarBounds} from './spatial-planar';
import {
  endpointContacts,
  locatePointInPolygon,
  pointOnSegment,
  segmentsMeet
} from './spatial-planar-intersects';

/** One coordinate, compared in XY. */
type Position = readonly number[];

/** A closed polygon ring, with consecutive duplicates removed. */
type Ring = readonly Position[];

/** A shell or hole and any segment interiors touched by another ring. */
type RingInfo = Bounded & {
  /** Ring index across all components. */
  id: number;
  /** Parent polygon component index. */
  component: number;
  /** Normalized ring. */
  points: Ring;
  /** Distinct positions where another ring meets this one. */
  touches?: Set<string>;
  /** Contact positions inside each segment, keyed by first vertex index. */
  cuts?: Map<number, Position[]>;
};

/** One indexed ring edge. */
type Edge = Bounded & {
  /** First endpoint. */
  a: Position;
  /** Second endpoint. */
  b: Position;
  /** Index of the first vertex in its ring. */
  index: number;
  /** Containing ring. */
  ring: RingInfo;
};

/** The rings and outer bounds of a Polygon component. */
type Component = Bounded & {
  /** Exterior ring. */
  shell: RingInfo;
  /** Interior rings. */
  holes: RingInfo[];
  /** Shell and holes for point classification. */
  paths: Ring[];
};

/** Contact points and the distinct ring IDs incident to each point. */
type Contacts = Map<string, Set<number>>;

/** Compares vertex positions without using an epsilon. */
function samePoint(a: Position, b: Position): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

/** Formats an available location as part of the diagnostic. */
function at(reason: string, point: Position): string {
  return `${reason}[${point[0]} ${point[1]}]`;
}

/** Checks basic ring structure without changing the source geometry. */
function normalizeRing(input: Ring): Ring | string {
  const points: Position[] = [];
  for (const point of input) {
    if (!Number.isFinite(point[0]) || !Number.isFinite(point[1]))
      return at('Invalid coordinate', point);
    if (!points.length || !samePoint(points[points.length - 1]!, point)) points.push(point);
  }
  if (input.length && !samePoint(input[0]!, input[input.length - 1]!))
    return at('Ring is not closed', input[0]!);
  return points.length < 4 ? 'Too few points in geometry component' : points;
}

/** Builds the ring edge entries for the intersection sweep. */
function addEdges(ring: RingInfo, edges: Edge[]): void {
  for (let index = 0; index + 1 < ring.points.length; index++) {
    const a = ring.points[index]!;
    const b = ring.points[index + 1]!;
    edges.push({
      a,
      b,
      ring,
      index,
      bounds: [
        Math.min(a[0]!, b[0]!),
        Math.min(a[1]!, b[1]!),
        Math.max(a[0]!, b[0]!),
        Math.max(a[1]!, b[1]!)
      ]
    });
  }
}

/** Records contacts that split an edge into intervals with constant inside/outside classification. */
function recordContact(edge: Edge, point: Position, key: string): void {
  edge.ring.touches ??= new Set();
  edge.ring.touches.add(key);
  if (samePoint(point, edge.a) || samePoint(point, edge.b)) return;
  edge.ring.cuts ??= new Map();
  const points = edge.ring.cuts.get(edge.index);
  if (points) points.push(point);
  else edge.ring.cuts.set(edge.index, [point]);
}

/** Checks crossing and overlapping boundaries, retaining legal single-point contacts. */
function checkBoundaries(edges: Edge[], contacts: Contacts): string | undefined {
  let reason: string | undefined;
  anyOverlap(edges, (a, b) => {
    const sameRing = a.ring === b.ring;
    const gap = Math.abs(a.index - b.index);
    const adjacent = sameRing && (gap === 1 || gap === a.ring.points.length - 2);
    if (adjacent) {
      // Adjacent segments always meet at one endpoint. Only backtracking is invalid.
      const outerA = samePoint(a.a, b.a) || samePoint(a.a, b.b) ? a.b : a.a;
      const outerB = samePoint(b.a, a.a) || samePoint(b.a, a.b) ? b.b : b.a;
      if (pointOnSegment(outerA, b.a, b.b) || pointOnSegment(outerB, a.a, a.b)) {
        reason = at('Ring self-intersection', outerA);
      }
      return reason !== undefined;
    }
    if (!segmentsMeet(a.a, a.b, b.a, b.b)) return false;
    if (sameRing) {
      reason = 'Ring self-intersection';
      return true;
    }
    const endpoints = endpointContacts([a.a, a.b], [b.a, b.b]);
    if (endpoints.length !== 1) {
      reason = endpoints.length ? at('Overlapping ring edges', endpoints[0]!) : 'Self-intersection';
      return true;
    }
    const point = endpoints[0]!;
    const position = `${point[0]}/${point[1]}`;
    recordContact(a, point, position);
    recordContact(b, point, position);
    if (a.ring.component === b.ring.component) {
      const key = `${a.ring.component}/${position}`;
      const rings = contacts.get(key);
      if (rings) {
        rings.add(a.ring.id);
        rings.add(b.ring.id);
      } else contacts.set(key, new Set([a.ring.id, b.ring.id]));
    }
    return false;
  });
  return reason;
}

/** Returns whether any vertex or non-boundary edge interval has the requested location. */
function hasLocation(ring: RingInfo, target: readonly Ring[], location: -1 | 1): boolean {
  if (!ring.touches) return locatePointInPolygon(ring.points[0]!, target) === location;
  // A single point contact cannot change the side occupied by the rest of a simple ring.
  const mayCrossAtVertices = ring.touches.size > 1;
  for (let index = 0; index + 1 < ring.points.length; index++) {
    const a = ring.points[index]!;
    const b = ring.points[index + 1]!;
    const vertexLocation = locatePointInPolygon(a, target);
    if (vertexLocation === location) return true;
    if (vertexLocation !== 0 && !mayCrossAtVertices) return false;
    const cuts = ring.cuts?.get(index) ?? [];
    const axis = Math.abs(b[0]! - a[0]!) >= Math.abs(b[1]! - a[1]!) ? 0 : 1;
    cuts.sort((p, q) => (a[axis]! <= b[axis]! ? 1 : -1) * (p[axis]! - q[axis]!));
    let previous = a;
    for (const next of [...cuts, b]) {
      if (
        !samePoint(previous, next) &&
        locateMidpointInPolygon(previous, next, target) === location
      )
        return true;
      previous = next;
    }
  }
  return false;
}

/** A cycle of point contacts encloses a disconnected part of a polygon interior. */
function hasContactCycle(ringCount: number, contacts: Contacts): boolean {
  if (!contacts.size) return false;
  const parent = Int32Array.from({length: ringCount}, (_, ring) => ring);
  /** Finds and compresses the representative of a ring. */
  function find(ring: number): number {
    while (parent[ring] !== ring) ring = parent[ring] = parent[parent[ring]!]!;
    return ring;
  }
  for (const touching of contacts.values()) {
    const [first, ...others] = touching;
    for (const ring of others) {
      const a = find(first!);
      const b = find(ring);
      if (a === b) return true;
      parent[b] = a;
    }
  }
  return false;
}

/** Validates the XY topology of a Polygon or MultiPolygon. */
export function polygonValidityReason(geometry: WellKnownGeometry): string | undefined {
  if (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon')
    throw new Error('Expected polygonal geometry');
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  const edges: Edge[] = [];
  const components: Component[] = [];
  let ringCount = 0;
  for (const polygon of polygons) {
    const rings: RingInfo[] = [];
    for (const input of polygon) {
      const points = normalizeRing(input);
      if (typeof points === 'string') return points;
      const bounds = planarBounds({type: 'LineString', coordinates: points})!;
      const ring: RingInfo = {id: ringCount++, component: components.length, points, bounds};
      rings.push(ring);
      addEdges(ring, edges);
    }
    const [shell, ...holes] = rings;
    if (shell)
      components.push({shell, holes, bounds: shell.bounds, paths: rings.map(ring => ring.points)});
  }

  const contacts: Contacts = new Map();
  const boundaryReason = checkBoundaries(edges, contacts);
  if (boundaryReason) return boundaryReason;
  for (const {shell, holes} of components) {
    for (const hole of holes) {
      if (hasLocation(hole, [shell.points], -1)) return 'Hole lies outside shell';
    }
    if (anyOverlap(holes, (a, b) => hasLocation(a, [b.points], 1) || hasLocation(b, [a.points], 1)))
      return 'Holes overlap or are nested';
  }
  if (hasContactCycle(ringCount, contacts)) return 'Interior is disconnected';
  if (
    anyOverlap(
      components,
      (a, b) => hasLocation(a.shell, b.paths, 1) || hasLocation(b.shell, a.paths, 1)
    )
  )
    return 'Polygon components overlap or are nested';
  return undefined;
}
