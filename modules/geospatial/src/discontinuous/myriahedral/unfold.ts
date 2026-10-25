// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import {HingeTree, type HingePanel} from '@math.gl/geometry';
import {
  center,
  cross,
  dot,
  edgeKey,
  faceNormal,
  normalize,
  subtract,
  type Polyhedron,
  type Vec3
} from './mesh';

export type MeshEdge = {a: number; b: number; faces: number[]; weight: number; hinge: boolean};
/** Kruskal maximum spanning tree, with stable input-index tie breaking. */
export function maximumSpanningTree(
  count: number,
  edges: {faces: number[]; weight: number}[]
): number[] {
  const roots = Array.from({length: count}, (_, i) => i),
    ranks = new Uint32Array(count);
  const find = (i: number): number => {
    while (roots[i] !== i) {
      roots[i] = roots[roots[i]];
      i = roots[i];
    }
    return i;
  };
  const order = edges
    .map((edge, i) => {
      if (
        edge.faces.length !== 2 ||
        edge.faces.some(f => !Number.isInteger(f) || f < 0 || f >= count) ||
        !Number.isFinite(edge.weight)
      )
        throw new Error('Invalid dual edge');
      return i;
    })
    .sort((a, b) => edges[b].weight - edges[a].weight || a - b);
  const selected: number[] = [];
  for (const i of order) {
    let a = find(edges[i].faces[0]),
      b = find(edges[i].faces[1]);
    if (a === b) continue;
    if (ranks[a] < ranks[b]) [a, b] = [b, a];
    roots[b] = a;
    if (ranks[a] === ranks[b]) ranks[a]++;
    selected.push(i);
    if (selected.length === count - 1) break;
  }
  if (selected.length !== count - 1) throw new Error('Disconnected face graph');
  return selected;
}

/** Internal layout builder for closed, consistently wound convex meshes.
 * Each panel uses the original solid coordinate frame, so rest transforms are identity.
 */
export function createLayout(
  mesh: Polyhedron,
  seed = 1,
  options: {
    weight?: (edge: MeshEdge, legacyWeight: number) => number;
    joins?: number[][];
  } = {}
) {
  const normals = mesh.faces.map(f => faceNormal(mesh, f));
  const map = new Map<string, MeshEdge>();
  mesh.faces.forEach((face, i) =>
    face.forEach((a, j) => {
      const b = face[(j + 1) % face.length],
        key = edgeKey(a, b);
      if (!map.has(key))
        map.set(key, {a: Math.min(a, b), b: Math.max(a, b), faces: [], weight: 0, hinge: false});
      map.get(key)!.faces.push(i);
    })
  );
  const edges = [...map.values()];
  for (const edge of edges) {
    if (edge.faces.length !== 2) throw new Error('Expected a closed two-manifold mesh');
    // Favor shorter joins, with seeded variation to explore different unfoldings.
    // This is a layout heuristic, not an overlap-minimizing objective.
    let hash =
      Math.imul(edge.a + 1, 73856093) ^ Math.imul(edge.b + 1, 19349663) ^ Math.imul(seed, 83492791);
    hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
    hash ^= hash >>> 16;
    edge.weight =
      -Math.hypot(...subtract(mesh.vertices[edge.a], mesh.vertices[edge.b])) +
      (0.25 * (hash >>> 0)) / 4294967296;
  }
  for (const edge of edges) if (options.weight) edge.weight = options.weight(edge, edge.weight);
  const allowed = options.joins && new Set(options.joins.map(([a, b]) => edgeKey(a, b)));
  const candidates = allowed
    ? edges.filter(e => allowed.has(edgeKey(e.faces[0], e.faces[1])))
    : edges;
  if (allowed && candidates.length !== allowed.size)
    throw new Error('Preset contains a non-adjacent join');
  const selected = maximumSpanningTree(mesh.faces.length, candidates);
  const adjacency: {face: number; edge: MeshEdge}[][] = mesh.faces.map(() => []);
  for (const i of selected) {
    const edge = candidates[i];
    edge.hinge = true;
    const [a, b] = edge.faces;
    adjacency[a].push({face: b, edge});
    adjacency[b].push({face: a, edge});
  }
  const panels: HingePanel[] = mesh.faces.map(() => ({parent: -1}));
  const targetAngles = new Float64Array(panels.length);
  const order = [0],
    seen = new Set([0]);
  for (let i = 0; i < order.length; i++) {
    const parent = order[i];
    for (const {face, edge} of adjacency[parent]) {
      if (seen.has(face)) continue;
      seen.add(face);
      order.push(face);
      const axis = normalize(subtract(mesh.vertices[edge.b], mesh.vertices[edge.a]));
      panels[face] = {parent, pivot: mesh.vertices[edge.a], axis};
      targetAngles[face] = Math.atan2(
        dot(axis, cross(normals[face], normals[parent])),
        dot(normals[face], normals[parent])
      );
    }
  }
  const origin = center(mesh.faces[0].map(i => mesh.vertices[i]));
  const x = normalize(subtract(mesh.vertices[mesh.faces[0][1]], mesh.vertices[mesh.faces[0][0]]));
  const z = normals[0],
    y = cross(z, x);
  const rootTransform = new Matrix4([
    x[0],
    y[0],
    z[0],
    0,
    x[1],
    y[1],
    z[1],
    0,
    x[2],
    y[2],
    z[2],
    0,
    -dot(x, origin),
    -dot(y, origin),
    -dot(z, origin),
    1
  ]);
  const layout = restoreLayout({
    mesh,
    edges,
    panels,
    targetAngles,
    rootTransform: Array.from(rootTransform),
    overlaps: 0
  });
  layout.overlaps = countOverlaps(layout.evaluate(1));
  return layout;
}

/** Data-only layout for worker transport; topology and geographic weights are already resolved. */
export type PreparedHingeLayout = {
  mesh: Polyhedron;
  edges: MeshEdge[];
  panels: HingePanel[];
  targetAngles: Float64Array;
  rootTransform: number[];
  overlaps: number;
};

/** Restore pose evaluation without repeating spanning-tree selection or overlap counting. */
export function restoreLayout(data: PreparedHingeLayout) {
  const {mesh, panels, targetAngles} = data;
  if (
    panels.length !== mesh.faces.length ||
    targetAngles.length !== panels.length ||
    !targetAngles.every(Number.isFinite) ||
    data.rootTransform.length !== 16 ||
    !data.rootTransform.every(Number.isFinite)
  )
    throw new Error('Invalid prepared hinge layout');
  const tree = new HingeTree(panels);
  const rootTransform = new Matrix4(data.rootTransform);
  const poses = new Float64Array(panels.length * 16),
    angles = new Float64Array(panels.length);
  const evaluate = (amount: number): Vec3[][] => {
    if (!Number.isFinite(amount) || amount < 0 || amount > 1)
      throw new RangeError('Unfold amount must be within [0, 1]');
    for (let i = 0; i < angles.length; i++) angles[i] = targetAngles[i] * amount;
    tree.evaluate(angles, poses, rootTransform);
    const matrix = new Matrix4();
    return mesh.faces.map((face, i) => {
      matrix.copy(poses.subarray(i * 16, i * 16 + 16));
      return face.map(v => Array.from(matrix.transformAsPoint(mesh.vertices[v])) as Vec3);
    });
  };
  return {...data, tree, rootTransform, evaluate};
}

/** Count positive-area overlaps of convex faces in the final XY net.
 * Sweep by X bounds, then separating axes; mere shared edges do not overlap.
 */
export function countOverlaps(faces: Vec3[][]): number {
  const bounds = faces
    .map((points, i) => ({
      i,
      minX: Math.min(...points.map(p => p[0])),
      maxX: Math.max(...points.map(p => p[0])),
      minY: Math.min(...points.map(p => p[1])),
      maxY: Math.max(...points.map(p => p[1]))
    }))
    .sort((a, b) => a.minX - b.minX);
  let count = 0;
  for (let i = 0; i < bounds.length; i++)
    for (let j = i + 1; j < bounds.length && bounds[j].minX < bounds[i].maxX - 1e-8; j++) {
      const a = bounds[i],
        b = bounds[j];
      if (b.minY >= a.maxY - 1e-8 || a.minY >= b.maxY - 1e-8) continue;
      const p = faces[a.i],
        q = faces[b.i];
      const separate = [p, q].some(poly =>
        poly.some((v, k) => {
          const next = poly[(k + 1) % poly.length],
            dx = next[0] - v[0],
            dy = next[1] - v[1],
            length = Math.hypot(dx, dy);
          const project = (point: Vec3) => (point[0] * dy - point[1] * dx) / length;
          const pp = p.map(project),
            qq = q.map(project);
          return (
            Math.max(...pp) <= Math.min(...qq) + 1e-8 || Math.max(...qq) <= Math.min(...pp) + 1e-8
          );
        })
      );
      if (!separate) count++;
    }
  return count;
}
