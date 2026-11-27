// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  NO_PREDECESSOR,
  type LineNetworkAdjacency,
  type LineNetworkLines
} from '@math.gl/geospatial/line-network';

/** About 1 m of latitude in degrees. */
export const ONE_METRE = 1 / 111_195;

/** Flat lines from one array of longitude, latitude pairs for each path. Rows are path indices. */
export function makeLines(...paths: number[][]): LineNetworkLines {
  const pathIndices = new Uint32Array(paths.length + 1);
  for (let i = 0; i < paths.length; i++) pathIndices[i + 1] = pathIndices[i] + paths[i].length / 2;
  return {
    positions: {value: Float64Array.from(paths.flat()), size: 2},
    pathIndices: {value: pathIndices, size: 1},
    pathRows: Uint32Array.from(paths.map((_, i) => i))
  };
}

/** Seeded xorshift32 generator of numbers in [0, 1]. */
export function makeRandom(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0xffffffff;
  };
}

/**
 * A square grid of `side` x `side` junctions, one 2-vertex path for each block face:
 * `2 * side * (side - 1)` segments. Spacing is in degrees. A seeded jitter (below the snap
 * tolerance) moves each endpoint copy, so the builder must snap and cannot rely on equality.
 */
export function makeGridLines({
  side,
  spacing = 0.001,
  origin = [-74.0, 40.7],
  jitterDegrees = 0,
  seed = 1
}: {
  side: number;
  spacing?: number;
  origin?: [number, number];
  jitterDegrees?: number;
  seed?: number;
}): LineNetworkLines {
  const segmentCount = 2 * side * (side - 1);
  const positions = new Float64Array(segmentCount * 4);
  const pathIndices = new Uint32Array(segmentCount + 1);
  const random = makeRandom(seed);
  const jitter = () => (jitterDegrees ? (random() - 0.5) * 2 * jitterDegrees : 0);
  let s = 0;
  const add = (i0: number, j0: number, i1: number, j1: number) => {
    positions[4 * s] = origin[0] + i0 * spacing + jitter();
    positions[4 * s + 1] = origin[1] + j0 * spacing + jitter();
    positions[4 * s + 2] = origin[0] + i1 * spacing + jitter();
    positions[4 * s + 3] = origin[1] + j1 * spacing + jitter();
    pathIndices[s] = 2 * s;
    s++;
  };
  for (let j = 0; j < side; j++) {
    for (let i = 0; i < side; i++) {
      if (i + 1 < side) add(i, j, i + 1, j);
      if (j + 1 < side) add(i, j, i, j + 1);
    }
  }
  pathIndices[segmentCount] = 2 * segmentCount;
  return {positions: {value: positions, size: 2}, pathIndices: {value: pathIndices, size: 1}};
}

/** Side length of the smallest grid with at least `segments` segments. */
export function getGridSideForSegments(segments: number): number {
  return Math.ceil((1 + Math.sqrt(1 + 2 * segments)) / 2);
}

/** Shortest paths from one source. */
export type ShortestPaths = {
  /** Float32 distance of each node; +Infinity when unreachable. */
  distances: Float32Array;
  /** Previous node on a shortest path; NO_PREDECESSOR for the source and unreachable nodes. */
  predecessors: Uint32Array;
};

/**
 * Test oracle: Dijkstra with float32 sums (the rounding of the luma.gl GPU search), on a binary
 * heap of typed arrays with lazy deletion.
 */
export function dijkstra(
  adjacency: LineNetworkAdjacency,
  edgeWeight: Float32Array,
  source: number
): ShortestPaths {
  const nodeCount = adjacency.offsets.length - 1;
  const distances = new Float32Array(nodeCount).fill(Infinity);
  const predecessors = new Uint32Array(nodeCount).fill(NO_PREDECESSOR);
  const done = new Uint8Array(nodeCount);
  const capacity = adjacency.neighbors.length + 1;
  const heapKey = new Float64Array(capacity);
  const heapNode = new Uint32Array(capacity);
  let size = 0;

  const push = (key: number, node: number) => {
    let i = size++;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heapKey[parent] <= key) break;
      heapKey[i] = heapKey[parent];
      heapNode[i] = heapNode[parent];
      i = parent;
    }
    heapKey[i] = key;
    heapNode[i] = node;
  };
  const pop = (): number => {
    const top = heapNode[0];
    const key = heapKey[--size];
    const node = heapNode[size];
    let i = 0;
    for (;;) {
      let child = 2 * i + 1;
      if (child >= size) break;
      if (child + 1 < size && heapKey[child + 1] < heapKey[child]) child++;
      if (heapKey[child] >= key) break;
      heapKey[i] = heapKey[child];
      heapNode[i] = heapNode[child];
      i = child;
    }
    heapKey[i] = key;
    heapNode[i] = node;
    return top;
  };

  distances[source] = 0;
  push(0, source);
  while (size > 0) {
    const u = pop();
    if (done[u]) continue;
    done[u] = 1;
    const du = distances[u];
    for (let slot = adjacency.offsets[u]; slot < adjacency.offsets[u + 1]; slot++) {
      const v = adjacency.neighbors[slot];
      const candidate = Math.fround(du + edgeWeight[adjacency.edges[slot]]);
      if (candidate < distances[v]) {
        distances[v] = candidate;
        predecessors[v] = u;
        push(candidate, v);
      }
    }
  }
  return {distances, predecessors};
}
