// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {ElasticSection} from './data';
import type {Position} from '../math';

type Cell = {x: number; y: number; p: Position[]; bounds: number[]};
/** Bilinear forward interpolation and cell-local inversion. No interpolation
 * across missing nodes or section cuts; inverse candidates are residual checked. */
export class ElasticGrid {
  private cells: Cell[] = [];
  constructor(
    readonly section: ElasticSection,
    private scale: number
  ) {
    if (!Number.isFinite(scale) || scale <= 0)
      throw new Error('Elastic output scale is not representable');
    const {rows, columns, values} = section;
    if (
      !Number.isInteger(rows) ||
      !Number.isInteger(columns) ||
      rows < 2 ||
      columns < 2 ||
      rows * columns > 1_000_000 ||
      values.length !== rows * columns * 2 ||
      values.some(v => v !== null && !Number.isFinite(v))
    )
      throw new Error('Invalid Elastic grid');
    for (let i = 0; i < values.length; i += 2)
      if ((values[i] === null) !== (values[i + 1] === null))
        throw new Error('Incomplete Elastic node');
    for (let y = 0; y < rows - 1; y++)
      for (let x = 0; x < columns - 1; x++) {
        const indices = [
          y * columns + x,
          y * columns + x + 1,
          (y + 1) * columns + x,
          (y + 1) * columns + x + 1
        ];
        if (indices.some(i => values[2 * i] === null)) continue;
        const p = indices.map(
          i => [values[2 * i]! * scale, values[2 * i + 1]! * scale] as Position
        );
        if (!p.flat().every(Number.isFinite))
          throw new Error('Elastic output coordinates are not representable');
        this.cells.push({
          x,
          y,
          p,
          bounds: [
            Math.min(...p.map(v => v[0])),
            Math.min(...p.map(v => v[1])),
            Math.max(...p.map(v => v[0])),
            Math.max(...p.map(v => v[1]))
          ]
        });
      }
    if (!this.cells.length) throw new Error('Elastic section has no defined cells');
  }
  project([lon, lat]: readonly number[]): Position | null {
    const {rows, columns, values} = this.section;
    const x = ((lon + 180) / 360) * (columns - 1),
      y = ((lat + 90) / 180) * (rows - 1);
    if (x < -1e-9 || x > columns - 1 + 1e-9 || y < -1e-9 || y > rows - 1 + 1e-9) return null;
    const i = Math.max(0, Math.min(columns - 2, Math.floor(x))),
      j = Math.max(0, Math.min(rows - 2, Math.floor(y)));
    const u = x - i,
      v = y - j;
    const indices = [
      j * columns + i,
      j * columns + i + 1,
      (j + 1) * columns + i,
      (j + 1) * columns + i + 1
    ];
    const weights = [(1 - u) * (1 - v), u * (1 - v), (1 - u) * v, u * v];
    const result: Position = [0, 0];
    for (let k = 0; k < 4; k++) {
      if (Math.abs(weights[k]) < 1e-14) continue;
      if (values[indices[k] * 2] === null) return null;
      for (let axis = 0; axis < 2; axis++)
        result[axis] += weights[k] * values[indices[k] * 2 + axis]! * this.scale;
    }
    return result;
  }
  /** Every interpolation node needed for this geographic rectangle is defined. */
  covers([w, s, e, n]: readonly number[]): boolean {
    const {rows, columns, values} = this.section;
    const left = Math.max(0, Math.floor(((w + 180) / 360) * (columns - 1))),
      right = Math.min(columns - 1, Math.ceil(((e + 180) / 360) * (columns - 1)));
    const bottom = Math.max(0, Math.floor(((s + 90) / 180) * (rows - 1))),
      top = Math.min(rows - 1, Math.ceil(((n + 90) / 180) * (rows - 1)));
    for (let y = bottom; y <= top; y++)
      for (let x = left; x <= right; x++) if (values[2 * (y * columns + x)] === null) return false;
    return true;
  }
  inverse(target: readonly number[]): Position[] {
    const results: Position[] = [];
    const epsilon = Math.max(this.scale * 1e-5, Math.hypot(...target) * 1e-10);
    for (const {x, y, p, bounds: b} of this.cells) {
      if (
        target[0] < b[0] - epsilon ||
        target[0] > b[2] + epsilon ||
        target[1] < b[1] - epsilon ||
        target[1] > b[3] + epsilon
      )
        continue;
      for (const [u, v] of invertCell(p, target)) {
        const point: Position = [
          -180 + (360 * (x + u)) / (this.section.columns - 1),
          -90 + (180 * (y + v)) / (this.section.rows - 1)
        ];
        if (!results.some(r => Math.hypot(r[0] - point[0], r[1] - point[1]) < 1e-7))
          results.push(point);
      }
    }
    return results;
  }
}

const cross2 = (a: readonly number[], b: readonly number[]) => a[0] * b[1] - a[1] * b[0];
/** Eliminate either parameter to solve the bilinear patch's quadratic. Solving
 * both directions also handles affine cells and a vanishing elimination axis.
 * Normalize locally so output radius does not change inverse conditioning. */
function invertCell(p: Position[], target: readonly number[]): Position[] {
  const scale = Math.max(...p.slice(1).flatMap(q => q.map((v, i) => Math.abs(v - p[0][i]))));
  if (!(scale > 0)) return [];
  const b = p[1].map((v, i) => (v - p[0][i]) / scale),
    c = p[2].map((v, i) => (v - p[0][i]) / scale);
  const d = p[3].map((v, i) => (v - p[0][i]) / scale - b[i] - c[i]);
  const h = target.map((v, i) => (v - p[0][i]) / scale);
  const roots = (a: number, b: number, c: number) => {
    if (Math.abs(a) < 1e-14) return Math.abs(b) < 1e-14 ? [] : [-c / b];
    const discriminant = b * b - 4 * a * c;
    if (discriminant < -1e-14) return [];
    const q = -0.5 * (b + (b < 0 ? -1 : 1) * Math.sqrt(Math.max(0, discriminant)));
    return q === 0 ? [-b / (2 * a)] : [q / a, c / q];
  };
  const output: Position[] = [];
  for (const swap of [false, true]) {
    const first = swap ? c : b,
      second = swap ? b : c;
    for (const u of roots(
      -cross2(first, d),
      cross2(h, d) - cross2(first, second),
      cross2(h, second)
    )) {
      const denominator = second.map((v, i) => v + d[i] * u),
        numerator = h.map((v, i) => v - first[i] * u);
      const axis = Math.abs(denominator[0]) > Math.abs(denominator[1]) ? 0 : 1;
      if (Math.abs(denominator[axis]) < 1e-14) continue;
      const v = numerator[axis] / denominator[axis];
      const xy: Position = swap ? [v, u] : [u, v];
      if (!xy.every(v => Number.isFinite(v) && v >= -1e-9 && v <= 1 + 1e-9)) continue;
      const [x, y] = xy.map(v => Math.max(0, Math.min(1, v)));
      if (Math.hypot(...h.map((v, i) => b[i] * x + c[i] * y + d[i] * x * y - v)) > 1e-9) continue;
      if (!output.some(p => Math.hypot(p[0] - x, p[1] - y) < 1e-8)) output.push([x, y]);
    }
  }
  return output;
}
