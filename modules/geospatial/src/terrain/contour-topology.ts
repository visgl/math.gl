// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {simplifyTerrainContourPaths} from './contour-simplify';
import type {TerrainContourPaths, TerrainContourPathLimits} from './contour-path-data';

// Exact dyadic arithmetic makes orientation independent of coordinate scale.
const bits = new DataView(new ArrayBuffer(8));
function integer(x: number): bigint {
  bits.setFloat64(0, x);
  const high = bits.getUint32(0),
    low = bits.getUint32(4);
  const exponent = (high >>> 20) & 2047;
  const mantissa = (BigInt(high & 0xfffff) << 32n) | BigInt(low);
  const value = exponent ? ((1n << 52n) | mantissa) << BigInt(exponent - 1) : mantissa;
  return high >>> 31 ? -value : value;
}
type Point = {x: bigint; y: bigint};
const orientation = (a: Point, b: Point, c: Point) =>
  (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
const sign = (v: bigint) => (v < 0n ? -1 : v > 0n ? 1 : 0);
const between = (a: bigint, b: bigint, p: bigint) => p >= (a < b ? a : b) && p <= (a > b ? a : b);
const on = (a: Point, b: Point, p: Point) =>
  orientation(a, b, p) === 0n && between(a.x, b.x, p.x) && between(a.y, b.y, p.y);
function intersects(a: Point, b: Point, c: Point, d: Point): boolean {
  return (
    on(a, b, c) ||
    on(a, b, d) ||
    on(c, d, a) ||
    on(c, d, b) ||
    (sign(orientation(a, b, c)) * sign(orientation(a, b, d)) < 0 &&
      sign(orientation(c, d, a)) * sign(orientation(c, d, b)) < 0)
  );
}

/** Conservative topology-safe RDP. Rejects invalid input embeddings and falls back
 * to the original geometry if any proposed shortcut crosses/touches another edge
 * or sweeps another vertex. Shared IDs and caller-protected IDs remain anchors.
 * All paths and levels participate in XY topology; no polygon classification is inferred.
 */
export function simplifyTerrainContourPathsTopology(
  paths: TerrainContourPaths,
  options: TerrainContourPathLimits & {
    maxError: number;
    maxDistanceTests?: number;
    maxTopologyTests?: number;
    protectedVertexIndices?: Uint32Array;
  }
) {
  const candidate = simplifyTerrainContourPaths(paths, options);
  const budget = options.maxTopologyTests ?? 1_000_000;
  if (!Number.isSafeInteger(budget) || budget < 0)
    throw new Error('Invalid contour topology budget');
  let topologyTests = 0;
  const charge = () => {
    if (++topologyTests > budget) throw new Error('Contour topology work budget exceeded');
  };
  const points: Point[] = new Array(paths.positions.length / 3);
  for (const i of new Set(paths.indices))
    points[i] = {x: integer(paths.positions[3 * i]), y: integer(paths.positions[3 * i + 1])};
  const edges: {a: number; b: number; p: number; i: number}[] = [];
  for (let p = 0; p < paths.closed.length; p++)
    for (let i = paths.offsets[p]; i + 1 < paths.offsets[p + 1]; i++)
      edges.push({a: paths.indices[i], b: paths.indices[i + 1], p, i});
  for (let i = 0; i < edges.length; i++)
    for (let j = i + 1; j < edges.length; j++) {
      charge();
      const a = edges[i],
        b = edges[j];
      const common = [a.a, a.b].filter(v => v === b.a || v === b.b);
      if (common.length === 1) {
        const v = common[0],
          x = a.a === v ? a.b : a.a,
          y = b.a === v ? b.b : b.a;
        if (on(points[v], points[x], points[y]) || on(points[v], points[y], points[x]))
          throw new Error('Overlapping contour edges');
      } else if (intersects(points[a.a], points[a.b], points[b.a], points[b.b]))
        throw new Error('Contour input has crossings or unshared touches');
    }
  let rejected = false;
  for (let p = 0; p < paths.closed.length; p++) {
    let start = paths.offsets[p];
    for (let k = candidate.offsets[p] + 1; k < candidate.offsets[p + 1]; k++) {
      const endId = candidate.sourceVertexIndices[candidate.indices[k]];
      let end = start + 1;
      while (paths.indices[end] !== endId) end++;
      if (end > start + 1) {
        const a = paths.indices[start],
          b = paths.indices[end];
        const pa = points[a],
          pb = points[b];
        const axis = pa.x !== pb.x ? 'x' : 'y';
        const direction = sign(pb[axis] - pa[axis]);
        let straight = true;
        for (let i = start + 1; i <= end; i++) {
          charge();
          const q = points[paths.indices[i]],
            prior = points[paths.indices[i - 1]];
          if (!on(pa, pb, q) || sign(q[axis] - prior[axis]) !== direction) straight = false;
        }
        const interior = new Set(Array.from(paths.indices.subarray(start + 1, end)));
        for (const edge of edges) {
          if (edge.p === p && edge.i >= start && edge.i < end) {
            if (straight) continue;
            charge();
            // The swept chain plus chord must be simple. Endpoint edges may meet
            // the chord only at their endpoint; interior edges must not touch it.
            const others = [edge.a, edge.b].filter(v => v !== a && v !== b);
            if (
              others.some(v => on(points[a], points[b], points[v])) ||
              (others.length === 2 &&
                intersects(points[a], points[b], points[edge.a], points[edge.b]))
            )
              rejected = true;
            continue;
          }
          charge();
          // Endpoint contacts at existing shared IDs are allowed; any extra contact is not.
          const others = [edge.a, edge.b].filter(v => v !== a && v !== b);
          if (
            others.some(v => on(points[a], points[b], points[v])) ||
            (others.length === 2 &&
              intersects(points[a], points[b], points[edge.a], points[edge.b]))
          )
            rejected = true;
        }
        for (const vertex of new Set(paths.indices)) {
          if (vertex === a || vertex === b || interior.has(vertex)) continue;
          let inside = false;
          for (let i = start, j = end; i <= end; j = i++) {
            charge();
            const u = points[paths.indices[i]],
              v = points[paths.indices[j]],
              q = points[vertex];
            if (on(u, v, q)) {
              rejected = true;
              break;
            }
            if (u.y > q.y !== v.y > q.y && orientation(u, v, q) > 0n === v.y > u.y)
              inside = !inside;
          }
          if (inside) rejected = true;
        }
      }
      start = end;
    }
  }
  const outputEdges: {a: number; b: number}[] = [];
  for (let p = 0; p < candidate.closed.length; p++)
    for (let i = candidate.offsets[p]; i + 1 < candidate.offsets[p + 1]; i++)
      outputEdges.push({
        a: candidate.sourceVertexIndices[candidate.indices[i]],
        b: candidate.sourceVertexIndices[candidate.indices[i + 1]]
      });
  for (let i = 0; i < outputEdges.length; i++)
    for (let j = i + 1; j < outputEdges.length; j++) {
      charge();
      const a = outputEdges[i],
        b = outputEdges[j];
      const common = [a.a, a.b].filter(v => v === b.a || v === b.b);
      if (common.length === 1) {
        const v = common[0],
          x = a.a === v ? a.b : a.a,
          y = b.a === v ? b.b : b.a;
        if (on(points[v], points[x], points[y]) || on(points[v], points[y], points[x]))
          rejected = true;
      } else if (intersects(points[a.a], points[a.b], points[b.a], points[b.b])) rejected = true;
    }
  if (!rejected) return {...candidate, topologyTests, rejected: false};
  return {
    ...paths,
    positions: paths.positions.slice(),
    gridCoordinates: paths.gridCoordinates.slice(),
    indices: paths.indices.slice(),
    offsets: paths.offsets.slice(),
    levelIndices: paths.levelIndices.slice(),
    closed: paths.closed.slice(),
    levels: paths.levels.slice(),
    origin: Object.freeze([...paths.origin] as [number, number, number]),
    sourceVertexIndices: Uint32Array.from({length: points.length}, (_, i) => i),
    maxDeviation: 0,
    requestedMaxError: options.maxError,
    distanceTests: candidate.distanceTests,
    topologyTests,
    rejected: true
  };
}
