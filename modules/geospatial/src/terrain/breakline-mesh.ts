// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {HeightField} from './height-field';
import {
  meshValidDomain,
  type Edge,
  type ValidDomainMeshOptions,
  type ValidDomainTerrainMesh
} from './valid-domain-mesh';

/** X and Y are fractional sample indices. Z is in the field's vertical reference. */
export type TerrainBreaklinePoint = readonly [number, number, number];
export type TerrainBreakline = readonly [TerrainBreaklinePoint, TerrainBreaklinePoint];

export type BreaklineMeshOptions = ValidDomainMeshOptions & {
  breaklines: readonly TerrainBreakline[];
  /** Let a line override source samples that lie exactly on it. Defaults to false. */
  breaklinesOverrideSamples?: boolean;
};

export type BreaklineTerrainMesh = ValidDomainTerrainMesh & {
  /** Packed vertex pairs, one pair per input segment in input order. */
  breaklineEdges: Uint32Array;
  overriddenSamples: number;
};

type XY = readonly [number, number];
const cross = (a: XY, b: XY, c: XY) =>
  (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const onSegment = (a: XY, b: XY, p: XY) =>
  Math.abs(cross(a, b, p)) <=
    8 *
      Number.EPSILON *
      (Math.abs((b[0] - a[0]) * (p[1] - a[1])) + Math.abs((b[1] - a[1]) * (p[0] - a[0]))) &&
  p[0] >= Math.min(a[0], b[0]) &&
  p[0] <= Math.max(a[0], b[0]) &&
  p[1] >= Math.min(a[1], b[1]) &&
  p[1] <= Math.max(a[1], b[1]);

/** Mesh a valid raster domain with noncrossing, piecewise-linear XYZ constraints. */
export function createBreaklineTerrainMesh(
  field: HeightField,
  options: BreaklineMeshOptions
): BreaklineTerrainMesh {
  const breaklineEdges: Edge[] = [];
  let overriddenSamples = 0;
  const mesh = meshValidDomain(field, options, (points, heights, boundary, selected, originZ) => {
    const ids = new Map(points.map(([x, y], i) => [`${x},${y}`, i]));
    const fixed = new Map<number, number>();
    const excluded = new Set<number>();
    const add = ([x, y, z]: TerrainBreaklinePoint): number => {
      if (
        ![x, y, z, z - originZ].every(Number.isFinite) ||
        x < 0 ||
        y < 0 ||
        x > field.width - 1 ||
        y > field.height - 1
      ) {
        throw new Error('Breakline endpoint is outside the sample rectangle or nonfinite');
      }
      const key = `${x},${y}`;
      const id = ids.get(key) ?? points.length;
      if (fixed.has(id) && fixed.get(id) !== z) throw new Error('Conflicting breakline heights');
      if (!ids.has(key)) {
        points.push([x, y]);
        ids.set(key, id);
      }
      fixed.set(id, z);
      heights[id] = z - originZ;
      if (Number.isInteger(x) && Number.isInteger(y)) selected[y * field.width + x] = id;
      return id;
    };
    if (options.breaklines.length > 2048) throw new Error('Breakline limit exceeded');
    for (const [a, b] of options.breaklines) {
      const p = add(a),
        q = add(b);
      if (p === q) throw new Error('Zero-length breakline');
      breaklineEdges.push([p, q]);
    }
    const edges: Edge[] = [];
    for (const [a, b] of boundary) {
      const split = [
        a,
        ...Array.from(fixed.keys()).filter(
          id => id !== a && id !== b && onSegment(points[a], points[b], points[id])
        ),
        b
      ];
      const [x, y] = points[a];
      split.sort(
        (i, j) =>
          Math.hypot(points[i][0] - x, points[i][1] - y) -
          Math.hypot(points[j][0] - x, points[j][1] - y)
      );
      for (let i = 1; i < split.length; i++) edges.push([split[i - 1], split[i]]);
    }
    const seen = new Set<string>();
    for (const [a, b] of breaklineEdges) {
      const key = `${Math.min(a, b)},${Math.max(a, b)}`;
      if (seen.has(key)) throw new Error('Duplicate breakline');
      seen.add(key);
      const p = points[a],
        q = points[b];
      let coincident = false;
      for (const [c, d] of edges) {
        if ((a === c && b === d) || (a === d && b === c)) {
          coincident = true;
          continue;
        }
        const r = points[c],
          s = points[d];
        const intersects =
          Math.sign(cross(p, q, r)) * Math.sign(cross(p, q, s)) < 0 &&
          Math.sign(cross(r, s, p)) * Math.sign(cross(r, s, q)) < 0;
        if (
          intersects ||
          (c !== a && c !== b && onSegment(p, q, r)) ||
          (d !== a && d !== b && onSegment(p, q, s)) ||
          (a !== c && a !== d && onSegment(r, s, p)) ||
          (b !== c && b !== d && onSegment(r, s, q))
        ) {
          throw new Error('Breaklines and domain edges must meet only at shared endpoints');
        }
      }
      if (!coincident) edges.push([a, b]);
      for (let y = Math.ceil(Math.min(p[1], q[1])); y <= Math.floor(Math.max(p[1], q[1])); y++) {
        for (let x = Math.ceil(Math.min(p[0], q[0])); x <= Math.floor(Math.max(p[0], q[0])); x++) {
          const source = field.getHeight(x, y);
          if (source === undefined || !onSegment(p, q, [x, y])) continue;
          const dx = q[0] - p[0],
            dy = q[1] - p[1];
          const f = Math.abs(dx) >= Math.abs(dy) ? (x - p[0]) / dx : (y - p[1]) / dy;
          const z = (1 - f) * heights[a] + f * heights[b] + originZ;
          if (Math.abs(source - z) <= options.maxError) continue;
          if (!options.breaklinesOverrideSamples)
            throw new Error('Breakline conflicts with source tolerance');
          excluded.add(y * field.width + x);
        }
      }
    }
    // Samples on constraints are already represented by the linear constraint.
    // Prevent refinement from introducing T-junctions through roundoff.
    overriddenSamples = excluded.size;
    return {edges, excluded};
  });
  const edges = new Set<string>();
  for (let i = 0; i < mesh.indices.length; i += 3) {
    for (let j = 0; j < 3; j++) {
      const a = mesh.indices[i + j],
        b = mesh.indices[i + ((j + 1) % 3)];
      edges.add(`${Math.min(a, b)},${Math.max(a, b)}`);
    }
  }
  if (breaklineEdges.some(([a, b]) => !edges.has(`${Math.min(a, b)},${Math.max(a, b)}`))) {
    throw new Error('Breakline was not preserved inside the valid terrain domain');
  }
  return {...mesh, breaklineEdges: Uint32Array.from(breaklineEdges.flat()), overriddenSamples};
}
