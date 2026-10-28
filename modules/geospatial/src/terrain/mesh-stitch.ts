// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TerrainMeshEdge} from './mesh-data';

/** Fractional grid coordinates permit edge insertion across arbitrary resolution ratios. */
export type TerrainSeamMesh = {
  positions: Float64Array;
  indices: Uint32Array;
  gridCoordinates: Float64Array | Uint32Array;
  width: number;
  height: number;
  origin: readonly [number, number, number];
  heightReference: string;
};
export type TerrainMeshStitchOptions = {
  /** Increasing normalized ranges along each grid side. Default [0,1]. */
  rangeA?: readonly [number, number];
  rangeB?: readonly [number, number];
  /** Absolute XY alignment tolerance; input A owns the seam profile. */
  coordinateTolerance?: number;
  maxHeightAdjustment?: number;
  maxVertices?: number;
  maxTriangles?: number;
  maxBoundaryVertices?: number;
};

/** Conform ranges of two straight grid sides. Split boundary triangles at the union
 * of edge vertices and move B's edge onto A's profile. Returns detached meshes in
 * A's origin plus identical ordered seam positions. Input sides must be complete; ranges may cover partial sides.
 * This changes the displayed surface; it does not change source DEMs or certify error.
 */
export function stitchTerrainMeshEdges(
  a: TerrainSeamMesh,
  edgeA: TerrainMeshEdge,
  b: TerrainSeamMesh,
  edgeB: TerrainMeshEdge,
  options: TerrainMeshStitchOptions = {}
): {
  a: TerrainSeamMesh;
  b: TerrainSeamMesh;
  seamA: Uint32Array;
  seamB: Uint32Array;
  maxHeightAdjustment: number;
} {
  const maxVertices = options.maxVertices ?? 2_000_000,
    maxTriangles = options.maxTriangles ?? 4_000_000,
    maxBoundary = options.maxBoundaryVertices ?? 100_000;
  const tolerance = options.coordinateTolerance ?? 1e-8,
    heightLimit = options.maxHeightAdjustment ?? 0;
  if (
    ![maxVertices, maxTriangles, maxBoundary].every(
      n => Number.isSafeInteger(n) && n >= 0 && n <= 0xfffffffe
    ) ||
    !Number.isFinite(tolerance) ||
    tolerance < 0 ||
    !Number.isFinite(heightLimit) ||
    heightLimit < 0
  )
    throw new Error('Invalid terrain stitching limits');
  const prepare = (
    mesh: TerrainSeamMesh,
    side: TerrainMeshEdge,
    range: readonly [number, number]
  ) => {
    if (
      range.length !== 2 ||
      !range.every(Number.isFinite) ||
      range[0] < 0 ||
      range[1] > 1 ||
      range[1] <= range[0]
    )
      throw new Error('Invalid stitching side range');
    if (
      !['minColumn', 'maxColumn', 'minRow', 'maxRow'].includes(side) ||
      !Number.isSafeInteger(mesh.width) ||
      !Number.isSafeInteger(mesh.height) ||
      mesh.width < 2 ||
      mesh.height < 2 ||
      !(mesh.positions instanceof Float64Array) ||
      mesh.positions.length % 3 ||
      mesh.positions.length / 3 > maxVertices ||
      !(mesh.indices instanceof Uint32Array) ||
      mesh.indices.length % 3 ||
      mesh.indices.length / 3 > maxTriangles ||
      !(
        mesh.gridCoordinates instanceof Float64Array || mesh.gridCoordinates instanceof Uint32Array
      ) ||
      mesh.gridCoordinates.length !== (mesh.positions.length / 3) * 2 ||
      mesh.origin.length !== 3 ||
      !mesh.origin.every(Number.isFinite) ||
      !mesh.positions.every(Number.isFinite) ||
      typeof mesh.heightReference !== 'string'
    )
      throw new Error('Invalid terrain stitching mesh');
    const positions = mesh.positions.slice();
    for (let i = 0; i < positions.length; i++) positions[i] += mesh.origin[i % 3] - a.origin[i % 3];
    if (!positions.every(Number.isFinite)) throw new Error('Terrain stitching coordinate overflow');
    const axis = side.endsWith('Column') ? 0 : 1,
      extent = axis ? mesh.height - 1 : mesh.width - 1,
      along = axis ? mesh.width - 1 : mesh.height - 1;
    const value = side.startsWith('min') ? 0 : extent;
    const used = new Set<number>();
    for (let i = 0; i < mesh.gridCoordinates.length; i += 2)
      if (
        !Number.isFinite(mesh.gridCoordinates[i]) ||
        !Number.isFinite(mesh.gridCoordinates[i + 1]) ||
        mesh.gridCoordinates[i] < 0 ||
        mesh.gridCoordinates[i] > mesh.width - 1 ||
        mesh.gridCoordinates[i + 1] < 0 ||
        mesh.gridCoordinates[i + 1] > mesh.height - 1
      )
        throw new Error('Invalid stitching grid coordinates');
    for (let i = 0; i < mesh.indices.length; i += 3) {
      const ids = [mesh.indices[i], mesh.indices[i + 1], mesh.indices[i + 2]];
      for (const id of ids) {
        if (id >= positions.length / 3) throw new Error('Stitching index out of range');
        if (mesh.gridCoordinates[2 * id + axis] === value) used.add(id);
      }
      const [p, q, r] = ids.map(id => id * 3);
      const area =
        (positions[q] - positions[p]) * (positions[r + 1] - positions[p + 1]) -
        (positions[q + 1] - positions[p + 1]) * (positions[r] - positions[p]);
      if (!Number.isFinite(area) || area <= 0)
        throw new Error('Stitching requires positive nondegenerate XY triangles');
    }
    if (used.size < 2 || used.size > maxBoundary)
      throw new Error('Invalid stitching boundary capacity');
    const ids = [...used].sort(
      (u, v) => mesh.gridCoordinates[2 * u + 1 - axis] - mesh.gridCoordinates[2 * v + 1 - axis]
    );
    const ts = ids.map(id => mesh.gridCoordinates[2 * id + 1 - axis] / along);
    if (ts[0] !== 0 || ts[ts.length - 1] !== 1 || ts.some((t, i) => i > 0 && t <= ts[i - 1]))
      throw new Error('Stitching requires a complete unique side');
    const pairs = new Map<string, number>();
    for (let i = 1; i < ids.length; i++) pairs.set(pair(ids[i - 1], ids[i]), 0);
    let direction = 0;
    for (let i = 0; i < mesh.indices.length; i += 3)
      for (let j = 0; j < 3; j++) {
        const u = mesh.indices[i + j],
          v = mesh.indices[i + ((j + 1) % 3)],
          key = pair(u, v);
        if (pairs.has(key)) {
          pairs.set(key, pairs.get(key)! + 1);
          const nextDirection = Math.sign(
            mesh.gridCoordinates[2 * v + 1 - axis] - mesh.gridCoordinates[2 * u + 1 - axis]
          );
          if (direction && direction !== nextDirection)
            throw new Error('Inconsistent stitching boundary orientation');
          direction = nextDirection;
        } else if (used.has(u) && used.has(v)) throw new Error('Nonconforming input boundary');
      }
    if ([...pairs.values()].some(count => count !== 1))
      throw new Error('Stitching boundary has holes or nonmanifold edges');
    return {
      mesh,
      positions,
      ids,
      ts: ts.map(t => (t - range[0]) / (range[1] - range[0])),
      axis,
      along,
      value,
      direction,
      range
    };
  };
  const pa = prepare(a, edgeA, options.rangeA ?? [0, 1]),
    pb = prepare(b, edgeB, options.rangeB ?? [0, 1]);
  if (a.heightReference !== b.heightReference)
    throw new Error('Stitching height references differ');
  const endpoint = (p: typeof pa, t: number): number[] => {
    let i = 0;
    while (i + 1 < p.ts.length - 1 && t > p.ts[i + 1]) i++;
    const f = (t - p.ts[i]) / (p.ts[i + 1] - p.ts[i]);
    return [0, 1, 2].map(k => {
      const z0 = p.positions[3 * p.ids[i] + k],
        z1 = p.positions[3 * p.ids[i + 1] + k];
      return f === 0 ? z0 : f === 1 ? z1 : z0 + (z1 - z0) * f;
    });
  };
  const first = endpoint(pa, 0),
    last = endpoint(pa, 1);
  const xyDistance = (p: number[], q: number[]) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const reversed = xyDistance(first, endpoint(pb, 0)) > tolerance;
  if (reversed) {
    pb.ids.reverse();
    pb.ts = pb.ts.reverse().map(t => 1 - t);
    pb.direction *= -1;
  }
  // Range normalization and reversal can put equivalent rational knots a few
  // ulps apart. Match B to A, retaining existing vertex IDs on each side. Never
  // merge two distinct vertices from the same boundary.
  const canonicalize = (values: number[], anchors: number[]) => {
    let cursor = 0;
    const result = values.map(t => {
      while (cursor + 1 < anchors.length && anchors[cursor + 1] <= t) cursor++;
      let nearest = anchors[cursor];
      if (cursor + 1 < anchors.length && Math.abs(anchors[cursor + 1] - t) < Math.abs(nearest - t))
        nearest = anchors[cursor + 1];
      return Math.abs(t - nearest) <= 8 * Number.EPSILON * Math.max(1, Math.abs(t)) ? nearest : t;
    });
    if (result.some((t, i) => i > 0 && t <= result[i - 1]))
      throw new Error('Stitching knots are numerically indistinguishable');
    return result;
  };
  pa.ts = canonicalize(pa.ts, [0, 1]);
  pb.ts = canonicalize(
    pb.ts,
    [...new Set([0, 1, ...pa.ts])].sort((x, y) => x - y)
  );
  if (
    xyDistance(first, endpoint(pb, 0)) > tolerance ||
    xyDistance(last, endpoint(pb, 1)) > tolerance ||
    pa.direction === pb.direction
  )
    throw new Error('Stitching sides must coincide and have opposite interiors');
  const startX = first[0],
    startY = first[1],
    dx = last[0] - startX,
    dy = last[1] - startY;
  if (!Number.isFinite(Math.hypot(dx, dy)) || Math.hypot(dx, dy) === 0)
    throw new Error('Invalid stitching side length');
  for (const p of [pa, pb])
    for (let i = 0; i < p.ids.length; i++)
      if (
        Math.hypot(
          p.positions[3 * p.ids[i]] - (startX + dx * p.ts[i]),
          p.positions[3 * p.ids[i] + 1] - (startY + dy * p.ts[i])
        ) > tolerance
      )
        throw new Error('Stitching requires straight affine sides');
  const ts = [...new Set([0, 1, ...pa.ts, ...pb.ts].filter(t => t >= 0 && t <= 1))].sort(
    (u, v) => u - v
  );
  if (ts.length > maxBoundary) throw new Error('Stitching boundary capacity exceeded');
  const xyz = new Float64Array(ts.length * 3);
  let segment = 0,
    maxHeightAdjustment = 0;
  for (let i = 0; i < ts.length; i++) {
    while (segment + 1 < pa.ts.length - 1 && ts[i] > pa.ts[segment + 1]) segment++;
    const fraction = (ts[i] - pa.ts[segment]) / (pa.ts[segment + 1] - pa.ts[segment]);
    for (let k = 0; k < 3; k++) {
      const v0 = pa.positions[3 * pa.ids[segment] + k],
        v1 = pa.positions[3 * pa.ids[segment + 1] + k];
      xyz[3 * i + k] = fraction === 0 ? v0 : fraction === 1 ? v1 : v0 + (v1 - v0) * fraction;
    }
  }
  if (!xyz.every(Number.isFinite)) throw new Error('Stitching interpolation overflow');
  // The difference of two linear profiles reaches its maximum at their union of knots.
  segment = 0;
  for (let i = 0; i < ts.length; i++) {
    while (segment + 1 < pb.ts.length - 1 && ts[i] > pb.ts[segment + 1]) segment++;
    const t = (ts[i] - pb.ts[segment]) / (pb.ts[segment + 1] - pb.ts[segment]);
    const z0 = pb.positions[3 * pb.ids[segment] + 2],
      z1 = pb.positions[3 * pb.ids[segment + 1] + 2];
    const z = t === 0 ? z0 : t === 1 ? z1 : z0 + (z1 - z0) * t;
    const adjustment = Math.abs(z - xyz[3 * i + 2]);
    if (!Number.isFinite(adjustment) || adjustment > heightLimit)
      throw new Error('Stitching height adjustment exceeds limit');
    maxHeightAdjustment = Math.max(maxHeightAdjustment, adjustment);
  }
  const rebuild = (p: typeof pa, reverse: boolean) => {
    const lookup = new Map(p.ts.map((t, i) => [t, p.ids[i]]));
    const added = ts.filter(t => !lookup.has(t)).length;
    if (p.ids.length + added > maxBoundary)
      throw new Error('Stitching output boundary capacity exceeded');
    if (
      p.positions.length / 3 + added > maxVertices ||
      p.mesh.indices.length / 3 + added > maxTriangles
    )
      throw new Error('Stitching output capacity exceeded');
    const positions = new Float64Array(p.positions.length + 3 * added),
      gridCoordinates = new Float64Array(p.mesh.gridCoordinates.length + 2 * added);
    positions.set(p.positions);
    gridCoordinates.set(p.mesh.gridCoordinates);
    const seam = new Uint32Array(ts.length);
    let next = p.positions.length / 3;
    for (let i = 0; i < ts.length; i++) {
      const existing = lookup.get(ts[i]),
        id = existing ?? next++;
      positions.set(xyz.subarray(3 * i, 3 * i + 3), 3 * id);
      if (existing === undefined) {
        gridCoordinates[2 * id + p.axis] = p.value;
        gridCoordinates[2 * id + 1 - p.axis] =
          (p.range[0] + (reverse ? 1 - ts[i] : ts[i]) * (p.range[1] - p.range[0])) * p.along;
      }
      seam[i] = id;
      lookup.set(ts[i], id);
    }
    const splits = new Map<string, number[]>();
    const allTs = [...lookup.keys()].sort((x, y) => x - y);
    let cursor = 0;
    for (let i = 1; i < p.ids.length; i++) {
      const list = [lookup.get(allTs[cursor++])!];
      while (cursor < allTs.length && allTs[cursor] <= p.ts[i])
        list.push(lookup.get(allTs[cursor++])!);
      cursor--;
      splits.set(pair(p.ids[i - 1], p.ids[i]), list);
    }
    const indices: number[] = [];
    for (let i = 0; i < p.mesh.indices.length; i += 3) {
      let split = false;
      for (let j = 0; j < 3; j++) {
        const u = p.mesh.indices[i + j],
          v = p.mesh.indices[i + ((j + 1) % 3)],
          w = p.mesh.indices[i + ((j + 2) % 3)];
        const list = splits.get(pair(u, v));
        if (!list || list.length === 2) continue;
        const ordered = list[0] === u ? list : [...list].reverse();
        for (let k = 1; k < ordered.length; k++) indices.push(ordered[k - 1], ordered[k], w);
        split = true;
        break;
      }
      if (!split) indices.push(p.mesh.indices[i], p.mesh.indices[i + 1], p.mesh.indices[i + 2]);
    }
    for (let i = 0; i < indices.length; i += 3) {
      const [u, v, w] = indices.slice(i, i + 3).map(id => id * 3);
      const area =
        (positions[v] - positions[u]) * (positions[w + 1] - positions[u + 1]) -
        (positions[v + 1] - positions[u + 1]) * (positions[w] - positions[u]);
      if (!Number.isFinite(area) || area <= 0)
        throw new Error('Stitching produced a degenerate or inverted triangle');
    }
    return {
      mesh: {
        positions,
        gridCoordinates,
        indices: Uint32Array.from(indices),
        width: p.mesh.width,
        height: p.mesh.height,
        origin: Object.freeze([...a.origin] as [number, number, number]),
        heightReference: a.heightReference
      },
      seam
    };
  };
  const ra = rebuild(pa, false),
    rb = rebuild(pb, reversed);
  return {a: ra.mesh, b: rb.mesh, seamA: ra.seam, seamB: rb.seam, maxHeightAdjustment};
}

function pair(a: number, b: number): string {
  return a < b ? `${a},${b}` : `${b},${a}`;
}
