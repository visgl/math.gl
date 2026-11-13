// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {HeightField} from './height-field';

type Point = readonly [number, number];
type Edge = {a: number; b: number; weight: number};

/** Horizontal triangle geometry in the field's fractional sample coordinates. */
export type TerrainCoverageMesh = {
  gridCoordinates: ArrayLike<number>;
  indices: ArrayLike<number>;
};

export type TerrainMeshCoverage = {
  status: 'certified' | 'mismatch' | 'budget-exhausted';
  /** Nonzero boundary intervals of mesh multiplicity minus reference multiplicity. */
  unmatchedSegments: number;
  witness: {start: Point; end: Point; multiplicityJump: number} | null;
  /** Candidate triangles plus reference half cells examined. */
  trianglesVisited: number;
  /** Edges remaining after cancellation of equal endpoints. */
  residualEdges: number;
};

function gcd(a: bigint, b: bigint): bigint {
  if (a < 0n) a = -a;
  if (b < 0n) b = -b;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

/**
 * Certify that mesh multiplicity is one on the valid raster domain and zero outside,
 * almost everywhere in XY. Coincident and subdivided edges are allowed.
 * The reference is either independently valid triangles or four-corner-valid cells.
 * An explicit reference mesh must tile the intended domain once.
 * The result says nothing about heights or zero-area boundary features.
 * Exact arithmetic applies to the supplied binary64 coordinates, without snapping.
 */
export function certifyTerrainMeshCoverage(
  field: HeightField,
  mesh: TerrainCoverageMesh,
  options: {reference?: 'triangle' | 'bilinear' | TerrainCoverageMesh; maxTriangles?: number} = {}
): TerrainMeshCoverage {
  const {reference = 'triangle', maxTriangles = 2_000_000} = options;
  const referenceMesh = typeof reference === 'object' ? reference : null;
  const validShape = (input: TerrainCoverageMesh) =>
    input.indices.length % 3 === 0 && input.gridCoordinates.length % 2 === 0;
  if (
    !Number.isSafeInteger(maxTriangles) ||
    maxTriangles < 1 ||
    (!referenceMesh && reference !== 'triangle' && reference !== 'bilinear') ||
    !validShape(mesh) ||
    (referenceMesh && !validShape(referenceMesh))
  )
    throw new Error('Invalid terrain coverage input');

  const trianglesVisited =
    mesh.indices.length / 3 +
    (referenceMesh ? referenceMesh.indices.length / 3 : 2 * (field.width - 1) * (field.height - 1));
  if (trianglesVisited > maxTriangles) {
    return {
      status: 'budget-exhausted',
      unmatchedSegments: 0,
      witness: null,
      trianglesVisited: 0,
      residualEdges: 0
    };
  }

  // Every finite binary64 value is an integer multiple of 2^-1074.
  const bits = new DataView(new ArrayBuffer(8));
  function exact(value: number): bigint {
    bits.setFloat64(0, value);
    const raw = bits.getBigUint64(0);
    const exponent = Number((raw >> 52n) & 2047n);
    const fraction = raw & ((1n << 52n) - 1n);
    const integer = exponent === 0 ? fraction : ((1n << 52n) | fraction) << BigInt(exponent - 1);
    return value < 0 ? -integer : integer;
  }

  const vertices: Point[] = [];
  const vertexIds = new Map<string, number>();
  const edges = new Map<string, Edge>();
  function vertex(x: number, y: number): number {
    if (!Number.isFinite(x) || !Number.isFinite(y))
      throw new Error('Nonfinite coverage coordinate');
    const key = `${x},${y}`;
    const previous = vertexIds.get(key);
    if (previous !== undefined) return previous;
    const id = vertices.length;
    vertices.push([x, y]);
    vertexIds.set(key, id);
    return id;
  }
  function edge(a: number, b: number, weight: number): void {
    if (a > b) {
      [a, b] = [b, a];
      weight = -weight;
    }
    const key = `${a},${b}`;
    const sum = (edges.get(key)?.weight ?? 0) + weight;
    if (sum === 0) edges.delete(key);
    else edges.set(key, {a, b, weight: sum});
  }
  function triangle(a: number, b: number, c: number, weight: number): void {
    edge(a, b, weight);
    edge(b, c, weight);
    edge(c, a, weight);
  }
  function addMesh({indices, gridCoordinates}: TerrainCoverageMesh, weight: number): void {
    for (let i = 0; i < indices.length; i += 3) {
      const ids = [indices[i], indices[i + 1], indices[i + 2]].map(id => {
        if (!Number.isSafeInteger(id) || id < 0 || id >= gridCoordinates.length / 2)
          throw new Error('Invalid coverage vertex index');
        return vertex(gridCoordinates[id * 2], gridCoordinates[id * 2 + 1]);
      });
      const [a, b, c] = ids.map(id => vertices[id]);
      const left = (b[0] - a[0]) * (c[1] - a[1]);
      const right = (b[1] - a[1]) * (c[0] - a[0]);
      const det = left - right;
      const limit = 8 * Number.EPSILON * (Math.abs(left) + Math.abs(right)) + 8 * Number.MIN_VALUE;
      let sign = Math.sign(det);
      if (!Number.isFinite(det) || Math.abs(det) <= limit) {
        const [ax, ay] = a.map(exact),
          [bx, by] = b.map(exact),
          [cx, cy] = c.map(exact);
        const determinant = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
        sign = determinant > 0n ? 1 : determinant < 0n ? -1 : 0;
      }
      if (!sign) throw new Error('Degenerate coverage triangle');
      triangle(ids[0], ids[1], ids[2], weight * sign);
    }
  }
  addMesh(mesh, 1);
  if (referenceMesh) addMesh(referenceMesh, -1);
  else
    for (let y = 0; y < field.height - 1; y++) {
      for (let x = 0; x < field.width - 1; x++) {
        const valid = [
          field.getHeight(x, y),
          field.getHeight(x + 1, y),
          field.getHeight(x, y + 1),
          field.getHeight(x + 1, y + 1)
        ].map(z => z !== undefined);
        if (reference === 'bilinear' && !valid.every(Boolean)) continue;
        const corners: Point[] = [
          [x, y],
          [x + 1, y],
          [x, y + 1],
          [x + 1, y + 1]
        ];
        const faces =
          field.diagonal === '00-11'
            ? [
                [0, 1, 3],
                [0, 3, 2]
              ]
            : [
                [0, 1, 2],
                [1, 3, 2]
              ];
        for (const [a, b, c] of faces) {
          if (!valid[a] || !valid[b] || !valid[c]) continue;
          triangle(vertex(...corners[a]), vertex(...corners[b]), vertex(...corners[c]), -1);
        }
      }
    }

  // A compactly supported triangle multiplicity is uniquely determined by its oriented
  // boundary. Group collinear residual edges to cancel differently subdivided boundaries.
  const lines = new Map<string, Map<number, {point: Point; delta: number}>>();
  for (const {a, b, weight} of edges.values()) {
    const p = vertices[a],
      q = vertices[b];
    const [x, y] = p.map(exact),
      [u, v] = q.map(exact);
    const divisor = gcd(u - x, v - y);
    let dx = (u - x) / divisor,
      dy = (v - y) / divisor;
    if (dx < 0n || (dx === 0n && dy < 0n)) [dx, dy] = [-dx, -dy];
    const key = `${dx},${dy},${dx * y - dy * x}`;
    let events = lines.get(key);
    if (!events) lines.set(key, (events = new Map()));
    const axis = dx === 0n ? 1 : 0;
    const delta = weight;
    events.set(p[axis], {point: p, delta: (events.get(p[axis])?.delta ?? 0) + delta});
    events.set(q[axis], {point: q, delta: (events.get(q[axis])?.delta ?? 0) - delta});
  }
  let unmatchedSegments = 0;
  let witness: TerrainMeshCoverage['witness'] = null;
  for (const events of lines.values()) {
    const sorted = [...events].sort(([a], [b]) => a - b);
    let jump = 0;
    for (let i = 0; i + 1 < sorted.length; i++) {
      jump += sorted[i][1].delta;
      if (!jump) continue;
      unmatchedSegments++;
      witness ??= {start: sorted[i][1].point, end: sorted[i + 1][1].point, multiplicityJump: jump};
    }
  }
  return {
    status: unmatchedSegments ? 'mismatch' : 'certified',
    unmatchedSegments,
    witness,
    trianglesVisited,
    residualEdges: edges.size
  };
}
