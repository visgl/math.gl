// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WellKnownGeometry} from '@math.gl/core/arrow';
import triangulate from 'cdt2d';
import {orient2d} from 'robust-predicates';
import {visitPaths} from './spatial-planar';

/** Finite planar coordinate used by the triangulator. */
type Site = [number, number];

/** Collects distinct XY sites in lexicographic order. */
function collectSites(geometry: WellKnownGeometry): Site[] {
  const sites: Site[] = [];
  visitPaths(geometry, path => {
    for (const [x, y] of path) {
      if (Number.isFinite(x) && Number.isFinite(y)) sites.push([x!, y!]);
    }
  });
  sites.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return sites.filter((p, i) => !i || p[0] !== sites[i - 1]![0] || p[1] !== sites[i - 1]![1]);
}

/** Builds one monotone chain, dropping intermediate collinear points. */
function buildChain(sites: readonly Site[]): Site[] {
  const chain: Site[] = [];
  for (const point of sites) {
    while (chain.length > 1) {
      const a = chain[chain.length - 2]!;
      const b = chain[chain.length - 1]!;
      if (orient2d(...a, ...b, ...point) < 0) break;
      chain.pop();
    }
    chain.push(point);
  }
  return chain;
}

/** Wraps sorted distinct sites, retaining degenerate point and line results. */
function hullFromSites(sites: Site[]): WellKnownGeometry {
  if (!sites.length) return {type: 'GeometryCollection', geometries: []};
  if (sites.length === 1) return {type: 'Point', coordinates: sites[0]!};
  const lower = buildChain(sites);
  const upper = buildChain([...sites].reverse());
  const ring = [...lower.slice(0, -1), ...upper.slice(0, -1)];
  return ring.length === 2
    ? {type: 'LineString', coordinates: ring}
    : {type: 'Polygon', coordinates: [[...ring, ring[0]!]]};
}

/** Computes the smallest convex geometry enclosing the input vertices. */
export function convexHull(geometry: WellKnownGeometry): WellKnownGeometry {
  return hullFromSites(collectSites(geometry));
}

/** Directed triangle edge and its adjacent triangle, if present. */
type Edge = {
  /** Start site index in counterclockwise ring order. */
  start: number;
  /** End site index in counterclockwise ring order. */
  end: number;
  /** Triangle on the other side of the edge. */
  neighbor?: Triangle;
  /** Euclidean edge length in coordinate units. */
  length: number;
};

/** A Delaunay triangle with mutable membership in the retained mesh. */
type Triangle = {
  /** Three directed edges in counterclockwise order. */
  edges: Edge[];
  /** Whether the triangle has been eroded. */
  removed: boolean;
};

/** Candidate for removing a boundary triangle across its current exterior edge. */
type Candidate = {
  /** Triangle considered for erosion. */
  triangle: Triangle;
  /** Exterior edge replaced by the other two sides. */
  edge: Edge;
};

/** Pushes a candidate into a longest-edge-first binary heap. */
function pushCandidate(heap: Candidate[], candidate: Candidate): void {
  let index = heap.length;
  heap.push(candidate);
  while (index > 0) {
    const parent = (index - 1) >>> 1;
    if (heap[parent]!.edge.length >= candidate.edge.length) break;
    heap[index] = heap[parent]!;
    index = parent;
  }
  heap[index] = candidate;
}

/** Removes the longest-edge candidate and restores heap order. */
function popCandidate(heap: Candidate[]): Candidate {
  const first = heap[0]!;
  const last = heap.pop()!;
  if (!heap.length) return first;
  let index = 0;
  while (index * 2 + 1 < heap.length) {
    const left = index * 2 + 1;
    const right = left + 1;
    const child =
      right < heap.length && heap[right]!.edge.length > heap[left]!.edge.length ? right : left;
    if (heap[child]!.edge.length <= last.edge.length) break;
    heap[index] = heap[child]!;
    index = child;
  }
  heap[index] = last;
  return first;
}

/** Connects adjacent triangles and records the Delaunay edge range. */
function triangulateSites(sites: Site[]) {
  const triangles: Triangle[] = [];
  const edgeOwners = new Map<string, {edge: Edge; triangle: Triangle}>();
  let minimum = Infinity;
  let maximum = 0;
  for (const cell of triangulate(sites, [])) {
    const [a, b, c] = cell;
    const order = orient2d(...sites[a]!, ...sites[b]!, ...sites[c]!) < 0 ? [a, b, c] : [a, c, b];
    const triangle: Triangle = {edges: [], removed: false};
    for (let i = 0; i < 3; i++) {
      const start = order[i]!;
      const end = order[(i + 1) % 3]!;
      const p = sites[start]!;
      const q = sites[end]!;
      const length = Math.hypot(p[0] - q[0], p[1] - q[1]);
      const edge: Edge = {start, end, length};
      const key = start < end ? start + ':' + end : end + ':' + start;
      const owner = edgeOwners.get(key);
      if (owner) {
        owner.edge.neighbor = triangle;
        edge.neighbor = owner.triangle;
      } else {
        edgeOwners.set(key, {edge, triangle});
        minimum = Math.min(minimum, length);
        maximum = Math.max(maximum, length);
      }
      triangle.edges.push(edge);
    }
    triangles.push(triangle);
  }
  return {triangles, minimum, maximum};
}

/** Returns the edges with no retained triangle on the other side. */
function exteriorEdges(triangle: Triangle): Edge[] {
  return triangle.edges.filter(edge => !edge.neighbor || edge.neighbor.removed);
}

/** Erodes the exterior without removing a site or introducing a ring pinch. */
export function concaveHull(geometry: WellKnownGeometry, ratio: number): WellKnownGeometry {
  if (!(ratio >= 0 && ratio <= 1)) throw new Error('ST_ConcaveHull ratio must be between 0 and 1');
  const sites = collectSites(geometry);
  const convex = hullFromSites(sites);
  if (ratio === 1 || convex.type !== 'Polygon') return convex;
  const {triangles, minimum, maximum} = triangulateSites(sites);
  const limit = (1 - ratio) * minimum + ratio * maximum;
  const boundary = new Map<number, number>();
  const heap: Candidate[] = [];
  for (const triangle of triangles) {
    for (const edge of exteriorEdges(triangle)) {
      boundary.set(edge.start, edge.end);
      if (edge.length > limit) pushCandidate(heap, {triangle, edge});
    }
  }
  while (heap.length) {
    const {triangle, edge} = popCandidate(heap);
    if (triangle.removed || exteriorEdges(triangle).length !== 1) continue;
    const first = triangle.edges.find(side => side.start === edge.end)!;
    const tip = first.end;
    if (boundary.has(tip)) continue;
    // Replace start → end with start → tip → end. An interior tip keeps one simple ring.
    triangle.removed = true;
    boundary.set(edge.start, tip);
    boundary.set(tip, edge.end);
    for (const side of triangle.edges) {
      const neighbor = side.neighbor;
      if (!neighbor || neighbor.removed || side.length <= limit) continue;
      const reverse = neighbor.edges.find(candidate => candidate.neighbor === triangle)!;
      pushCandidate(heap, {triangle: neighbor, edge: reverse});
    }
  }
  const start = boundary.keys().next().value;
  if (start === undefined) return convex;
  const coordinates = [sites[start]!];
  let site = boundary.get(start)!;
  while (site !== start && coordinates.length < boundary.size) {
    coordinates.push(sites[site]!);
    site = boundary.get(site)!;
  }
  if (site !== start || coordinates.length !== boundary.size) {
    throw new Error('ST_ConcaveHull could not construct a single outer ring');
  }
  coordinates.push(sites[start]!);
  return {type: 'Polygon', coordinates: [coordinates]};
}
