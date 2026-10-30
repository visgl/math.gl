// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {TriangleMesh} from '../polygon/subdivide-triangle-mesh';

export type SurfaceTransitionQualification = {
  /** A fixed indexed disk stays a graph over XY throughout linear vertex interpolation. */
  scope: 'convex-xy-disk-linear';
  minimumProjectedDoubleArea: number;
  boundary: Uint32Array;
};

/** Qualify a conservative subset of 3D mesh morphs, without time sampling.
 * Input is an oriented, connected triangulated disk. Both endpoints share indices.
 * Every triangle must retain positive XY orientation and the boundary must stay
 * convex throughout linear vertex motion. Quadratic extrema test the full [0,1].
 * This excludes holes, folded surfaces, most global globe meshes and curved vertex
 * trajectories. It qualifies the piecewise-linear mesh, not its underlying smooth
 * projection or a camera's approximation error. Floating-point margins reject
 * near-degeneracy; this is not a formal interval-arithmetic certificate.
 */
export function qualifySurfaceTransition(
  mesh: TriangleMesh,
  targetPositions: ArrayLike<number>,
  options: {minimumDoubleArea?: number; maxChecks?: number} = {}
): SurfaceTransitionQualification {
  const from = Array.from(mesh.positions),
    to = Array.from(targetPositions),
    indices = Array.from(mesh.indices),
    count = from.length / 3,
    maxChecks = options.maxChecks ?? 1000000;
  if (
    !from.length ||
    from.length % 3 ||
    to.length !== from.length ||
    !indices.length ||
    indices.length % 3 ||
    !from.every(Number.isFinite) ||
    !to.every(Number.isFinite) ||
    !indices.every(i => Number.isSafeInteger(i) && i >= 0 && i < count) ||
    !Number.isSafeInteger(maxChecks) ||
    maxChecks < 0
  )
    throw new RangeError('Invalid surface transition mesh or budget');
  let scale = 0;
  for (const positions of [from, to])
    for (let i = 0; i < indices.length; i += 3)
      for (let j = 0; j < 3; j++) {
        const a = indices[i + j] * 3,
          b = indices[i + ((j + 1) % 3)] * 3;
        scale = Math.max(
          scale,
          Math.hypot(positions[b] - positions[a], positions[b + 1] - positions[a + 1])
        );
      }
  const margin = options.minimumDoubleArea ?? scale * scale * 1e-12;
  if (!Number.isFinite(margin) || margin <= 0)
    throw new RangeError('Expected positive finite area margin');
  let checks = 0;
  const tick = () => {
    if (++checks > maxChecks) throw new RangeError('Surface qualification exceeded maxChecks');
  };
  const edges = new Map<string, {a: number; b: number; faces: number}>(),
    used = new Set(indices);
  let minimum = Infinity;
  const orientation = (a: number, b: number, c: number, t: number) => {
    // Interpolate relative edges, avoiding cancellation from translating a patch
    // across large world-coordinate origins before subtracting vertex positions.
    const edge = (v: number, k: number) =>
      (from[3 * v + k] - from[3 * a + k]) * (1 - t) + (to[3 * v + k] - to[3 * a + k]) * t;
    return edge(b, 0) * edge(c, 1) - edge(b, 1) * edge(c, 0);
  };
  const minimumOrientation = (a: number, b: number, c: number) => {
    tick();
    return quadraticMinimum(t => orientation(a, b, c, t));
  };
  for (let i = 0; i < indices.length; i += 3) {
    const tri = indices.slice(i, i + 3);
    const area = minimumOrientation(tri[0], tri[1], tri[2]);
    if (area < margin) throw new RangeError('Triangle collapses or reverses during transition');
    minimum = Math.min(minimum, area);
    for (let j = 0; j < 3; j++) {
      const a = tri[j],
        b = tri[(j + 1) % 3],
        key = a < b ? `${a}:${b}` : `${b}:${a}`,
        edge = edges.get(key);
      if (edge) {
        if (edge.faces !== 1 || edge.a !== b || edge.b !== a)
          throw new RangeError('Expected oriented manifold edges');
        edge.faces++;
      } else edges.set(key, {a, b, faces: 1});
    }
  }
  const next = new Map<number, number>();
  for (const edge of edges.values())
    if (edge.faces === 1) {
      if (next.has(edge.a)) throw new RangeError('Nonmanifold boundary');
      next.set(edge.a, edge.b);
    }
  if (!next.size || used.size !== count || used.size - edges.size + indices.length / 3 !== 1)
    throw new RangeError('Expected a triangulated disk without unused vertices');
  const start = next.keys().next().value!,
    boundary: number[] = [];
  const visitedBoundary = new Set<number>();
  let v = start;
  do {
    if (visitedBoundary.has(v) || !next.has(v)) throw new RangeError('Expected one boundary cycle');
    visitedBoundary.add(v);
    boundary.push(v);
    v = next.get(v)!;
  } while (v !== start);
  if (boundary.length !== next.size) throw new RangeError('Multiple boundary cycles');
  // Every boundary vertex stays left of each directed support edge. This allows
  // collinear refinement vertices while rejecting a nonconvex or crossing outline.
  for (let i = 0; i < boundary.length; i++) {
    const a = boundary[i],
      b = boundary[(i + 1) % boundary.length];
    // Distinct boundary vertices rule out multiple winding of a convex outline
    // (a locally positive double-cover fan would otherwise pass support tests).
    for (let j = i + 1; j < boundary.length; j++) {
      tick();
      const c = boundary[j];
      const separation = quadraticMinimum(t => {
        const dx = (from[3 * c] - from[3 * a]) * (1 - t) + (to[3 * c] - to[3 * a]) * t,
          dy = (from[3 * c + 1] - from[3 * a + 1]) * (1 - t) + (to[3 * c + 1] - to[3 * a + 1]) * t;
        return dx * dx + dy * dy;
      });
      if (separation < margin) throw new RangeError('Boundary vertices meet during transition');
    }
    for (const c of boundary)
      if (c !== a && c !== b && minimumOrientation(a, b, c) < -margin * 1e-3)
        throw new RangeError('Boundary is not convex throughout transition');
  }
  // Euler characteristic plus one boundary is insufficient if a closed component
  // is present. Explicitly require connectivity of the vertex graph.
  const neighbors = Array.from({length: count}, () => [] as number[]);
  for (const {a, b} of edges.values()) {
    neighbors[a].push(b);
    neighbors[b].push(a);
  }
  const seen = new Set<number>([start]),
    queue = [start];
  for (let i = 0; i < queue.length; i++)
    for (const n of neighbors[queue[i]])
      if (!seen.has(n)) {
        seen.add(n);
        queue.push(n);
      }
  if (seen.size !== count) throw new RangeError('Disconnected surface mesh');
  return {
    scope: 'convex-xy-disk-linear',
    minimumProjectedDoubleArea: minimum,
    boundary: new Uint32Array(boundary)
  };
}

function quadraticMinimum(value: (t: number) => number): number {
  const f = value(0),
    g = value(1),
    h = value(0.5),
    a = 2 * (f + g - 2 * h),
    b = g - f - a;
  const t = a > 0 ? -b / (2 * a) : -1;
  const result = Math.min(f, g, t > 0 && t < 1 ? value(t) : Infinity);
  if (!Number.isFinite(result)) throw new RangeError('Nonfinite surface orientation');
  return result;
}
