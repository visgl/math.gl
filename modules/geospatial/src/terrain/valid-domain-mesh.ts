// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import triangulate from 'cdt2d';
import type {HeightField} from './height-field';
import {createTerrainMesh} from './mesh';
import type {TerrainMeshOptions} from './mesh-data';

export type ValidDomainMeshOptions = TerrainMeshOptions & {
  maxError: number;
  maxSamples?: number;
  maxTriangles?: number;
  maxSampleTests?: number;
};

export type ValidDomainTerrainMesh = {
  positions: Float64Array;
  gridCoordinates: Float64Array;
  indices: Uint32Array;
  origin: readonly [number, number, number];
  width: number;
  height: number;
  heightReference: string;
  maxSampleError: number;
  certifiedSamples: number;
};

export type Edge = [number, number];
type Triangle = [number, number, number];

function capacity(value: number): number {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error('Invalid mesh work limit');
  return value;
}

/** Adaptively mesh precisely the union of valid regular triangles. */
export function createValidDomainTerrainMesh(
  field: HeightField,
  options: ValidDomainMeshOptions
): ValidDomainTerrainMesh {
  return meshValidDomain(field, options);
}

export type DomainConstraints = (
  points: [number, number][],
  heights: number[],
  edges: Edge[],
  selected: Int32Array,
  originZ: number
) => {edges: Edge[]; excluded: Set<number>; fixedSamples: Set<number>};

export function meshValidDomain(
  field: HeightField,
  options: ValidDomainMeshOptions,
  constraints?: DomainConstraints
): ValidDomainTerrainMesh {
  const {maxError} = options;
  const count = field.width * field.height;
  if (!Number.isFinite(maxError) || maxError < 0) throw new Error('Invalid maximum error');
  if (count > capacity(options.maxSamples ?? 1_100_000)) throw new Error('Sample limit exceeded');
  const maxTriangles = capacity(options.maxTriangles ?? 2_200_000);
  const maxTests = capacity(options.maxSampleTests ?? 40_000_000);
  const regular = createTerrainMesh(field, options);
  const {width, height, origin, heightReference} = regular;
  const active = new Uint8Array(count);
  const boundary = new Map<number, Edge>();
  const edgeKey = (a: number, b: number) => Math.min(a, b) * count + Math.max(a, b);
  for (let i = 0; i < regular.indices.length; i += 3) {
    for (let j = 0; j < 3; j++) {
      const a = regular.indices[i + j],
        b = regular.indices[i + ((j + 1) % 3)];
      active[a] = 1;
      const key = edgeKey(a, b);
      if (!boundary.delete(key)) boundary.set(key, [a, b]);
    }
  }
  const selected = new Int32Array(count).fill(-1);
  const points: [number, number][] = [];
  const heights: number[] = [];
  const add = (i: number): number => {
    if (selected[i] < 0) {
      selected[i] = points.length;
      points.push([i % width, Math.floor(i / width)]);
      heights.push(regular.positions[3 * i + 2]);
    }
    return selected[i];
  };
  const edges = Array.from(boundary.values(), ([a, b]): Edge => [add(a), add(b)]);
  const extra = constraints?.(points, heights, edges, selected, origin[2]);
  const inDomain = ([a, b, c]: Triangle): boolean => {
    const x = (points[a][0] + points[b][0] + points[c][0]) / 3;
    const y = (points[a][1] + points[b][1] + points[c][1]) / 3;
    const i = Math.floor(x),
      j = Math.floor(y);
    const u = x - i,
      v = y - j;
    const valid = (dx: number, dy: number) => field.getHeight(i + dx, j + dy) !== undefined;
    if (field.diagonal === '00-11') {
      return valid(0, 0) && valid(1, 1) && (u > v ? valid(1, 0) : valid(0, 1));
    }
    return valid(1, 0) && valid(0, 1) && (u + v < 1 ? valid(0, 0) : valid(1, 1));
  };
  const covered = new Uint8Array(count);
  let triangles: Triangle[] = [];
  let maxSampleError = 0;
  let certifiedSamples = 0;
  let tests = 0;
  for (let pass = 0; points.length; pass++) {
    triangles = triangulate(points, extra?.edges ?? edges, {
      exterior: Boolean(extra),
      delaunay: false
    });
    if (extra) triangles = triangles.filter(inDomain);

    if (triangles.length > maxTriangles) throw new Error('Triangle limit exceeded');
    covered.fill(0);
    const refine = new Set<number>();
    maxSampleError = 0;
    certifiedSamples = 0;
    for (const [a, b, c] of triangles) {
      const [ax, ay] = points[a],
        [bx, by] = points[b],
        [cx, cy] = points[c];
      const det = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
      if (det === 0) throw new Error('Degenerate triangulation');
      let worst = maxError;
      let candidate = -1;
      const sides = [
        [ax, ay, bx, by],
        [bx, by, cx, cy],
        [cx, cy, ax, ay]
      ];
      for (let y = Math.ceil(Math.min(ay, by, cy)); y <= Math.floor(Math.max(ay, by, cy)); y++) {
        let left = Infinity;
        let right = -Infinity;
        for (const [x0, y0, x1, y1] of sides) {
          if (y < Math.min(y0, y1) || y > Math.max(y0, y1)) continue;
          const x = y0 === y1 ? x0 : x0 + ((x1 - x0) * (y - y0)) / (y1 - y0);
          left = Math.min(left, x);
          right = Math.max(right, y0 === y1 ? Math.max(x0, x1) : x);
          if (y0 === y1) left = Math.min(left, x1);
        }
        for (let x = Math.ceil(left - 1e-10); x <= Math.floor(right + 1e-10); x++) {
          if (++tests > maxTests) throw new Error('Sample test limit exceeded');
          const i = y * width + x;
          if (!active[i] || extra?.excluded.has(i)) continue;
          const u = ((x - ax) * (cy - ay) - (y - ay) * (cx - ax)) / det;
          const v = ((bx - ax) * (y - ay) - (by - ay) * (x - ax)) / det;
          const w = 1 - u - v;
          if (Math.min(u, v, w) < -1e-12) continue;
          if (!covered[i]) certifiedSamples++;
          covered[i] = 1;
          const error =
            !extra && (selected[i] === a || selected[i] === b || selected[i] === c)
              ? 0
              : Math.abs(
                  w * heights[a] + u * heights[b] + v * heights[c] - regular.positions[3 * i + 2]
                );
          maxSampleError = Math.max(maxSampleError, error);
          if (error > worst && !extra?.fixedSamples.has(i)) {
            worst = error;
            candidate = i;
          }
        }
      }
      if (candidate >= 0) refine.add(candidate);
    }
    if (active.some((value, i) => value && !covered[i] && !extra?.excluded.has(i)))
      throw new Error('Incomplete domain triangulation');
    if (maxSampleError <= maxError) break;
    if (!Array.from(refine).some(i => selected[i] < 0))
      throw new Error('Cannot certify mesh tolerance');
    if (pass === 63) {
      for (let i = 0; i < count; i++) if (active[i] && !extra?.fixedSamples.has(i)) add(i);
    } else {
      for (const i of refine) add(i);
    }
  }
  const reverse =
    field.columnStep[0] * field.rowStep[1] - field.columnStep[1] * field.rowStep[0] < 0;
  const positions = new Float64Array(points.length * 3);
  const shift = field.registration === 'cell' ? 0.5 : 0;
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i];
    positions.set(
      [
        field.origin[0] -
          origin[0] +
          (x + shift) * field.columnStep[0] +
          (y + shift) * field.rowStep[0],
        field.origin[1] -
          origin[1] +
          (x + shift) * field.columnStep[1] +
          (y + shift) * field.rowStep[1],
        heights[i]
      ],
      i * 3
    );
  }
  const indices = new Uint32Array(triangles.length * 3);
  for (let i = 0; i < triangles.length; i++) {
    const [a, b, c] = triangles[i];
    const [ax, ay] = points[a],
      [bx, by] = points[b],
      [cx, cy] = points[c];
    const clockwise = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax) < 0;
    indices.set(reverse === clockwise ? [a, b, c] : [a, c, b], 3 * i);
  }
  return {
    positions,
    indices,
    gridCoordinates: Float64Array.from(points.flat()),
    origin,
    width,
    height,
    heightReference,
    maxSampleError,
    certifiedSamples
  };
}
