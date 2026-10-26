// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Geometry} from '@math.gl/geometry';
import type {HeightField} from './height-field';

export type HeightFieldGeometryOptions = {
  id?: string;
  /** World-space XYZ origin subtracted before storing positions. Defaults to [grid origin X, Y, 0]. */
  origin?: readonly [number, number, number];
  precision?: 'float32' | 'float64';
};

/** Z-up regular terrain mesh. Triangles and triangle sampling use the same cell diagonal. */
export class HeightFieldGeometry extends Geometry {
  readonly origin: readonly [number, number, number];

  constructor(field: HeightField, options: HeightFieldGeometryOptions = {}) {
    const origin = options.origin ?? [field.origin[0], field.origin[1], 0];
    if (origin.length !== 3 || !origin.every(Number.isFinite))
      throw new Error('Mesh origin must be a finite XYZ triple');
    const precision = options.precision ?? 'float32';
    if (precision !== 'float32' && precision !== 'float64')
      throw new Error('Unknown terrain mesh precision');
    const count = field.width * field.height;
    const positions =
      precision === 'float64' ? new Float64Array(count * 3) : new Float32Array(count * 3);
    const normals = new Float32Array(count * 3);
    const accumulatedNormals = new Float64Array(count * 3);
    const uv = new Float32Array(count * 2);
    const valid = new Uint8Array(count);
    const indices =
      count > 0xffff
        ? new Uint32Array((field.width - 1) * (field.height - 1) * 6)
        : new Uint16Array((field.width - 1) * (field.height - 1) * 6);
    const shift = field.registration === 'cell' ? 0.5 : 0;
    for (let row = 0; row < field.height; row++) {
      for (let column = 0; column < field.width; column++) {
        const i = row * field.width + column;
        const height = field.getHeight(column, row);
        valid[i] = height === undefined ? 0 : 1;
        positions[3 * i] =
          field.origin[0] -
          origin[0] +
          (column + shift) * field.columnStep[0] +
          (row + shift) * field.rowStep[0];
        positions[3 * i + 1] =
          field.origin[1] -
          origin[1] +
          (column + shift) * field.columnStep[1] +
          (row + shift) * field.rowStep[1];
        positions[3 * i + 2] = height === undefined ? 0 : height - origin[2];
        uv[2 * i] =
          (column + shift) / (field.registration === 'cell' ? field.width : field.width - 1);
        uv[2 * i + 1] =
          (row + shift) / (field.registration === 'cell' ? field.height : field.height - 1);
      }
    }
    if (!positions.every(Number.isFinite))
      throw new Error('Terrain mesh positions overflow the selected precision');
    const reverse =
      field.columnStep[0] * field.rowStep[1] - field.columnStep[1] * field.rowStep[0] < 0;
    let indexCount = 0;
    const addTriangle = (a: number, b: number, c: number) => {
      if (!valid[a] || !valid[b] || !valid[c]) return;
      if (reverse) [b, c] = [c, b];
      indices[indexCount++] = a;
      indices[indexCount++] = b;
      indices[indexCount++] = c;
      const abx = positions[3 * b] - positions[3 * a];
      const aby = positions[3 * b + 1] - positions[3 * a + 1];
      const abz = positions[3 * b + 2] - positions[3 * a + 2];
      const acx = positions[3 * c] - positions[3 * a];
      const acy = positions[3 * c + 1] - positions[3 * a + 1];
      const acz = positions[3 * c + 2] - positions[3 * a + 2];
      const nx = aby * acz - abz * acy;
      const ny = abz * acx - abx * acz;
      const nz = abx * acy - aby * acx;
      if (!Number.isFinite(nx) || !Number.isFinite(ny) || !Number.isFinite(nz) || nz <= 0) {
        throw new Error(
          'Terrain triangle degenerates or overflows at the selected precision; use a local origin'
        );
      }
      for (const i of [a, b, c]) {
        accumulatedNormals[3 * i] += nx;
        accumulatedNormals[3 * i + 1] += ny;
        accumulatedNormals[3 * i + 2] += nz;
      }
    };
    for (let row = 0; row < field.height - 1; row++) {
      for (let column = 0; column < field.width - 1; column++) {
        const a = row * field.width + column;
        const b = a + 1;
        const c = a + field.width;
        const d = c + 1;
        if (field.diagonal === '00-11') {
          addTriangle(a, b, d);
          addTriangle(a, d, c);
        } else {
          addTriangle(a, b, c);
          addTriangle(b, d, c);
        }
      }
    }
    for (let i = 0; i < count; i++) {
      const nx = accumulatedNormals[3 * i];
      const ny = accumulatedNormals[3 * i + 1];
      const nz = accumulatedNormals[3 * i + 2];
      const length = Math.hypot(nx, ny, nz);
      if (!Number.isFinite(length)) throw new Error('Terrain normal accumulation overflow');
      normals[3 * i] = length ? nx / length : 0;
      normals[3 * i + 1] = length ? ny / length : 0;
      normals[3 * i + 2] = length ? nz / length : 1;
    }
    super({
      id: options.id,
      topology: 'triangle-list',
      indices: indexCount === indices.length ? indices : indices.slice(0, indexCount),
      attributes: {
        POSITION: {size: 3, value: positions},
        NORMAL: {size: 3, value: normals},
        TEXCOORD_0: {size: 2, value: uv}
      }
    });
    this.origin = Object.freeze([...origin] as [number, number, number]);
  }
}
