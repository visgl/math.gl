// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {visitPolylineSpan} from '@math.gl/geometry/polygon';
import type {LineNetwork, LineNetworkLines} from './build-line-network';

/** Predecessor of a source node or an unreachable node (the luma.gl shortest-path sentinel). */
export const NO_PREDECESSOR = 0xffffffff;

/** Compressed sparse row (CSR) adjacency of a line network. */
export type LineNetworkAdjacency = {
  /** True when each edge is listed only from its source node. */
  directed: boolean;
  /** First slot of each node, followed by the slot count (`nodeCount + 1` values). */
  offsets: Uint32Array;
  /** Node at the other end of the edge in each slot. */
  neighbors: Uint32Array;
  /** Edge of each slot. */
  edges: Uint32Array;
};

/** Options of `buildLineNetworkAdjacency`. */
export type LineNetworkAdjacencyOptions = {
  /** List each edge from its source only. Default: false. */
  directed?: boolean;
};

/**
 * Builds a CSR adjacency. An undirected adjacency lists each edge from both end nodes; a
 * directed adjacency lists it from its source node only. Slots of a node keep edge order.
 */
export function buildLineNetworkAdjacency(
  network: Pick<LineNetwork, 'nodeCount' | 'edgeCount' | 'edgeSource' | 'edgeTarget'>,
  options: LineNetworkAdjacencyOptions = {}
): LineNetworkAdjacency {
  const directed = options.directed ?? false;
  const {nodeCount, edgeCount, edgeSource, edgeTarget} = network;
  const offsets = new Uint32Array(nodeCount + 1);
  for (let e = 0; e < edgeCount; e++) {
    offsets[edgeSource[e] + 1]++;
    if (!directed) offsets[edgeTarget[e] + 1]++;
  }
  for (let n = 0; n < nodeCount; n++) offsets[n + 1] += offsets[n];
  const cursor = offsets.slice(0, nodeCount);
  const slotCount = directed ? edgeCount : edgeCount * 2;
  const neighbors = new Uint32Array(slotCount);
  const edges = new Uint32Array(slotCount);
  for (let e = 0; e < edgeCount; e++) {
    const s = edgeSource[e];
    const t = edgeTarget[e];
    neighbors[cursor[s]] = t;
    edges[cursor[s]++] = e;
    if (directed) continue;
    neighbors[cursor[t]] = s;
    edges[cursor[t]++] = e;
  }
  return {directed, offsets, neighbors, edges};
}

/** Optional predecessor conventions supplied by the solver. */
export type RoutePredecessorOptions = {
  /** Sentinel for unreachable nodes. Defaults to the luma.gl sentinel. */
  unreachable?: number;
  /** Selected incoming edge ID per node, in the adjacency's edge numbering. */
  predecessorEdges?: ArrayLike<number>;
};

/**
 * Walks a predecessor array from `target` back to `source`. Returns the edges in travel order,
 * an empty array when the target is the source, or null when the target is unreachable.
 * Between a node and its predecessor it takes the edge of lowest weight (lowest id on a tie),
 * which is the edge that a shortest-path search relaxes.
 */
export function getRouteEdges(
  adjacency: LineNetworkAdjacency,
  edgeWeight: ArrayLike<number> | undefined,
  predecessors: ArrayLike<number>,
  source: number,
  target: number,
  options: RoutePredecessorOptions = {}
): Uint32Array | null {
  const unreachable = options.unreachable ?? NO_PREDECESSOR;
  if (target === source) return new Uint32Array(0);
  if (predecessors[target] === unreachable) return null;
  const route: number[] = [];
  const selectedEdges = options.predecessorEdges;
  let node = target;
  while (node !== source) {
    const previous = predecessors[node];
    if (
      !Number.isInteger(previous) ||
      previous === unreachable ||
      previous < 0 ||
      previous >= predecessors.length ||
      route.length >= predecessors.length
    )
      return null;
    let best = NO_PREDECESSOR;
    // The slots of the predecessor list its out-edges in both a directed and an undirected adjacency.
    for (let slot = adjacency.offsets[previous]; slot < adjacency.offsets[previous + 1]; slot++) {
      if (adjacency.neighbors[slot] !== node) continue;
      const edge = adjacency.edges[slot];
      if (selectedEdges) {
        if (edge !== selectedEdges[node]) continue;
        best = edge;
        break;
      }
      if (
        best === NO_PREDECESSOR ||
        (edgeWeight?.[edge] ?? 1) < (edgeWeight?.[best] ?? 1) ||
        ((edgeWeight?.[edge] ?? 1) === (edgeWeight?.[best] ?? 1) && edge < best)
      ) {
        best = edge;
      }
    }
    if (best === NO_PREDECESSOR) return null;
    route.push(best);
    node = previous;
  }
  return Uint32Array.from(route.reverse());
}

/** Number of points in the geometry of an edge. The first and last can be split points. */
export function getEdgePointCount(network: LineNetwork, edge: number): number {
  return network.edgeVertexEnd[edge] - network.edgeVertexStart[edge] + 1;
}

/**
 * Writes the longitude, latitude geometry of an edge, in path direction, into `target` from
 * value index `offset`. The first and last points follow the split fractions.
 * @returns `target`, or a new array of `2 * getEdgePointCount(network, edge)` values.
 */
export function getEdgeGeometry(
  network: LineNetwork,
  lines: LineNetworkLines,
  edge: number,
  target: Float64Array = new Float64Array(2 * getEdgePointCount(network, edge)),
  offset: number = 0
): Float64Array {
  visitEdge(network, lines, edge, false, (x, y) => {
    target[offset++] = x;
    target[offset++] = y;
  });
  return target;
}

/**
 * Concatenates the geometry of route edges into one flat longitude, latitude path from `source`.
 * Each edge is reversed as needed. Where two edges meet at the same point, the point appears
 * once. A joined dangling end gives a straight step to the split point of the next edge.
 */
export function getRouteGeometry(
  network: LineNetwork,
  lines: LineNetworkLines,
  route: ArrayLike<number>,
  source: number
): Float64Array {
  let pointTotal = 0;
  for (let i = 0; i < route.length; i++) pointTotal += getEdgePointCount(network, route[i]);
  const path = new Float64Array(pointTotal * 2);
  let at = 0;
  let node = source;
  for (let i = 0; i < route.length; i++) {
    const e = route[i];
    const forward = network.edgeSource[e] === node;
    let first = true;
    visitEdge(network, lines, e, !forward, (x, y) => {
      if (!(first && at > 0 && x === path[at - 2] && y === path[at - 1])) {
        path[at++] = x;
        path[at++] = y;
      }
      first = false;
    });
    node = forward ? network.edgeTarget[e] : network.edgeSource[e];
  }
  return at === path.length ? path : path.slice(0, at);
}

/** Visits one edge span in travel order. */
function visitEdge(
  network: LineNetwork,
  lines: LineNetworkLines,
  edge: number,
  reverse: boolean,
  visit: (x: number, y: number) => void
): void {
  const {value, size} = lines.positions;
  visitPolylineSpan(
    (vertex, ordinate) => value[size * vertex + ordinate],
    network.edgeVertexStart[edge],
    network.edgeStartFraction[edge],
    network.edgeVertexEnd[edge] - 1,
    network.edgeEndFraction[edge],
    visit,
    reverse
  );
}
