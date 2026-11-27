// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {HeightField} from './height-field';

type Interval = readonly [number, number];
type XY = readonly [number, number];
type Plane = readonly [Interval, Interval, Interval];
type Triangle = readonly [XY, XY, XY];

export type TerrainContinuousMesh = {
  /** Packed XY in fractional sample indices. This is the authoritative horizontal geometry. */
  gridCoordinates: ArrayLike<number>;
  /** Packed XYZ. Only Z is read. */
  positions: ArrayLike<number>;
  indices: ArrayLike<number>;
  origin: readonly [number, number, number];
  heightReference: string;
};

export type TerrainContinuousError = {
  /** Upper bound on absolute vertical error over the common domain, or null if no box survived. */
  upperBound: number | null;
  lowerBound: number;
  witness: XY | null;
  boxes: number;
  /** True when the upper and lower bounds differ by at most the requested gap. */
  converged: boolean;
};

const exact = (x: number): Interval => [x, x];
function outward(lo: number, hi: number): Interval {
  if (!Number.isFinite(lo) || !Number.isFinite(hi))
    throw new Error('Continuous error arithmetic overflow');
  // One full relative epsilon bounds rounding of a binary64 operation, including at binade
  // boundaries. The smallest subnormal covers underflow and zero.
  const result: Interval = [
    lo - Math.max(Number.MIN_VALUE, Math.abs(lo) * Number.EPSILON),
    hi + Math.max(Number.MIN_VALUE, Math.abs(hi) * Number.EPSILON)
  ];
  if (!result.every(Number.isFinite)) throw new Error('Continuous error arithmetic overflow');
  return result;
}
const add = (a: Interval, b: Interval): Interval => outward(a[0] + b[0], a[1] + b[1]);
const sub = (a: Interval, b: Interval): Interval => outward(a[0] - b[1], a[1] - b[0]);
function mul(a: Interval, b: Interval): Interval {
  const values = [a[0] * b[0], a[0] * b[1], a[1] * b[0], a[1] * b[1]];
  return outward(Math.min(...values), Math.max(...values));
}
function div(a: Interval, b: Interval): Interval {
  if (b[0] <= 0 && b[1] >= 0) throw new Error('Degenerate or numerically unresolved mesh triangle');
  return mul(a, outward(1 / b[1], 1 / b[0]));
}
const magnitude = (a: Interval) => Math.max(-a[0], a[1]);
const minimumMagnitude = (a: Interval) => Math.max(0, a[0], -a[1]);
const evaluate = (p: Plane, x: Interval, y: Interval) => add(p[0], add(mul(p[1], x), mul(p[2], y)));

function edge(a: XY, b: XY, column: number, row: number): Plane {
  const dx = sub(exact(b[0]), exact(a[0]));
  const dy = sub(exact(b[1]), exact(a[1]));
  return [
    sub(mul(dx, sub(exact(row), exact(a[1]))), mul(dy, sub(exact(column), exact(a[0])))),
    [-dy[1], -dy[0]],
    dx
  ];
}

function polygon(triangle: Triangle, column: number, row: number): Plane[] {
  const [a, b, c] = triangle;
  const first = edge(a, b, a[0], a[1]);
  const orientation = evaluate(first, sub(exact(c[0]), exact(a[0])), sub(exact(c[1]), exact(a[1])));
  if (orientation[0] <= 0 && orientation[1] >= 0)
    throw new Error('Degenerate or numerically unresolved mesh triangle');
  const sides = [edge(a, b, column, row), edge(b, c, column, row), edge(c, a, column, row)];
  return orientation[0] > 0
    ? sides
    : sides.map(p => p.map(([lo, hi]) => [-hi, -lo]) as unknown as Plane);
}

/**
 * Bound vertical error everywhere the supplied mesh and raster reference overlap.
 * Overlapping mesh faces are checked independently. Uncovered reference area is outside
 * this measurement. Bilinear cells require four valid heights; triangle mode follows
 * the field diagonal and admits each valid half cell independently.
 */
export function boundTerrainMeshError(
  field: HeightField,
  mesh: TerrainContinuousMesh,
  options: {
    reference?: 'triangle' | 'bilinear';
    gap?: number;
    maxBoxes?: number;
    maxDepth?: number;
  } = {}
): TerrainContinuousError {
  const {reference = 'triangle', gap = 0.05, maxBoxes = 2_000_000, maxDepth = 12} = options;
  const {gridCoordinates: xy, positions, indices, origin} = mesh;
  if (
    !['triangle', 'bilinear'].includes(reference) ||
    !Number.isFinite(gap) ||
    gap < 0 ||
    !Number.isSafeInteger(maxBoxes) ||
    maxBoxes < 1 ||
    !Number.isSafeInteger(maxDepth) ||
    maxDepth < 0 ||
    maxDepth > 24
  )
    throw new Error('Invalid continuous error options');
  if (
    mesh.heightReference !== field.heightReference ||
    !Number.isFinite(origin[2]) ||
    positions.length % 3 ||
    xy.length !== (positions.length / 3) * 2 ||
    indices.length % 3
  )
    throw new Error('Invalid continuous error mesh buffers or height reference');

  let upperBound: number | null = null;
  let lowerBound = 0;
  let witness: XY | null = null;
  let boxes = 0;

  for (let i = 0; i < indices.length; i += 3) {
    const ids = [indices[i], indices[i + 1], indices[i + 2]];
    if (ids.some(id => !Number.isSafeInteger(id) || id < 0 || id >= xy.length / 2)) {
      throw new Error('Invalid continuous error index');
    }
    const triangle: Triangle = [
      [xy[2 * ids[0]], xy[2 * ids[0] + 1]],
      [xy[2 * ids[1]], xy[2 * ids[1] + 1]],
      [xy[2 * ids[2]], xy[2 * ids[2] + 1]]
    ];
    const [a, b, c] = triangle;
    const [za, zb, zc] = ids.map(id => exact(positions[3 * id + 2]));
    if (
      triangle.some(([x, y]) => !Number.isFinite(x) || !Number.isFinite(y)) ||
      [za, zb, zc].some(z => !Number.isFinite(z[0]))
    )
      throw new Error('Nonfinite continuous error vertex');
    // A face identical to a reference half cell has zero difference on its
    // entire footprint, including shared boundaries with neighboring cells.
    if (
      reference === 'triangle' &&
      origin[2] === 0 &&
      matchesReferenceHalf(field, triangle, [za[0], zb[0], zc[0]])
    ) {
      if (++boxes > maxBoxes) throw new Error('Continuous error box limit exceeded');
      upperBound ??= 0;
      witness ??= a;
      continue;
    }
    const dx = sub(exact(b[0]), exact(a[0])),
      dy = sub(exact(b[1]), exact(a[1]));
    const ex = sub(exact(c[0]), exact(a[0])),
      ey = sub(exact(c[1]), exact(a[1]));
    const det = sub(mul(dx, ey), mul(dy, ex));
    const dz = sub(zb, za),
      ez = sub(zc, za);
    const sx = div(sub(mul(dz, ey), mul(ez, dy)), det);
    const sy = div(sub(mul(dx, ez), mul(ex, dz)), det);

    for (
      let row = Math.max(0, Math.ceil(Math.min(a[1], b[1], c[1])) - 1);
      row <= Math.min(field.height - 2, Math.floor(Math.max(a[1], b[1], c[1])));
      row++
    ) {
      for (
        let column = Math.max(0, Math.ceil(Math.min(a[0], b[0], c[0])) - 1);
        column <= Math.min(field.width - 2, Math.floor(Math.max(a[0], b[0], c[0])));
        column++
      ) {
        if (++boxes > maxBoxes) throw new Error('Continuous error box limit exceeded');
        const vertices: XY[] = [
          [0, 0],
          [1, 0],
          [0, 1],
          [1, 1]
        ];
        const h = vertices.map(([x, y]) => field.getHeight(column + x, row + y));
        const sides = polygon(triangle, column, row);
        const base = add(
          za,
          add(mul(sx, sub(exact(column), exact(a[0]))), mul(sy, sub(exact(row), exact(a[1]))))
        );

        function visit(
          constraints: Plane[],
          p: Plane,
          mixed: Interval,
          x: Interval,
          y: Interval,
          depth: number
        ): void {
          if (++boxes > maxBoxes) throw new Error('Continuous error box limit exceeded');
          if (constraints.some(side => evaluate(side, x, y)[1] < 0)) return;
          const error = (u: Interval, v: Interval) => add(evaluate(p, u, v), mul(mixed, mul(u, v)));
          const centerX = (x[0] + x[1]) / 2;
          const centerY = (y[0] + y[1]) / 2;
          const u = exact(centerX),
            v = exact(centerY);
          if (constraints.every(side => evaluate(side, u, v)[0] >= 0)) {
            const lower = minimumMagnitude(error(u, v));
            if (!witness || lower > lowerBound) {
              lowerBound = lower;
              witness = [column + centerX, row + centerY];
            }
          }
          // A bilinear polynomial reaches its box extrema at corners.
          const upper = Math.max(
            ...x.flatMap(u => y.map(v => magnitude(error(exact(u), exact(v)))))
          );
          if (upper <= lowerBound + gap || depth === maxDepth) {
            upperBound = Math.max(upperBound ?? 0, upper);
            return;
          }
          if (x[1] - x[0] >= y[1] - y[0]) {
            visit(constraints, p, mixed, [x[0], centerX], y, depth + 1);
            visit(constraints, p, mixed, [centerX, x[1]], y, depth + 1);
          } else {
            visit(constraints, p, mixed, x, [y[0], centerY], depth + 1);
            visit(constraints, p, mixed, x, [centerY, y[1]], depth + 1);
          }
        }

        const compare = (
          constant: Interval,
          x: Interval,
          y: Interval,
          mixed: Interval,
          constraints: Plane[]
        ) =>
          visit(
            constraints,
            [sub(base, sub(constant, exact(origin[2]))), sub(sx, x), sub(sy, y)],
            [-mixed[1], -mixed[0]],
            [0, 1],
            [0, 1],
            0
          );

        if (reference === 'bilinear') {
          const [h00, h10, h01, h11] = h;
          if (h00 === undefined || h10 === undefined || h01 === undefined || h11 === undefined)
            continue;
          const x = sub(exact(h10), exact(h00)),
            y = sub(exact(h01), exact(h00));
          compare(exact(h00), x, y, sub(sub(exact(h11), exact(h01)), x), sides);
        } else {
          const halves =
            field.diagonal === '00-11'
              ? [
                  [0, 1, 3],
                  [0, 3, 2]
                ]
              : [
                  [0, 1, 2],
                  [1, 3, 2]
                ];
          for (const [j, k, l] of halves) {
            const z0 = h[j],
              z1 = h[k],
              z2 = h[l];
            if (z0 === undefined || z1 === undefined || z2 === undefined) continue;
            const p = vertices[j],
              q = vertices[k],
              r = vertices[l];
            const x = sub(
              mul(sub(exact(z1), exact(z0)), exact(r[1] - p[1])),
              mul(sub(exact(z2), exact(z0)), exact(q[1] - p[1]))
            );
            const y = sub(
              mul(exact(q[0] - p[0]), sub(exact(z2), exact(z0))),
              mul(exact(r[0] - p[0]), sub(exact(z1), exact(z0)))
            );
            compare(sub(exact(z0), add(mul(x, exact(p[0])), mul(y, exact(p[1])))), x, y, exact(0), [
              ...sides,
              ...polygon([p, q, r], 0, 0)
            ]);
          }
        }
      }
    }
  }
  return {
    upperBound,
    lowerBound,
    witness,
    boxes,
    converged: upperBound !== null && upperBound - lowerBound <= gap
  };
}

function matchesReferenceHalf(field: HeightField, triangle: Triangle, heights: number[]): boolean {
  const column = Math.min(...triangle.map(p => p[0]));
  const row = Math.min(...triangle.map(p => p[1]));
  if (
    !Number.isInteger(column) ||
    !Number.isInteger(row) ||
    column < 0 ||
    row < 0 ||
    column >= field.width - 1 ||
    row >= field.height - 1
  )
    return false;
  const corners = new Set<number>();
  for (let i = 0; i < 3; i++) {
    const [x, y] = triangle[i];
    const u = x - column,
      v = y - row;
    if ((u !== 0 && u !== 1) || (v !== 0 && v !== 1) || field.getHeight(x, y) !== heights[i])
      return false;
    corners.add(u + 2 * v);
  }
  return (
    corners.size === 3 &&
    (field.diagonal === '00-11'
      ? corners.has(0) && corners.has(3)
      : corners.has(1) && corners.has(2))
  );
}
