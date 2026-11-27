// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {HeightField} from './height-field';

/** Height-only triangle interpolation: zero-weight vertices are not support. */
export function sampleTerrainTriangleHeight(
  field: HeightField,
  x: number,
  y: number
): number | undefined {
  if (Number.isInteger(x) && Number.isInteger(y)) return field.getHeight(x, y);
  const column = Math.min(Math.floor(x), field.width - 2);
  const row = Math.min(Math.floor(y), field.height - 2);
  const u = x - column,
    v = y - row;
  let a: number, b: number, c: number, d: number;
  if (field.diagonal === '00-11') {
    if (v <= u) {
      a = 1 - u;
      b = u - v;
      c = 0;
      d = v;
    } else {
      a = 1 - v;
      b = 0;
      c = v - u;
      d = u;
    }
  } else if (u + v <= 1) {
    a = 1 - u - v;
    b = u;
    c = v;
    d = 0;
  } else {
    a = 0;
    b = 1 - v;
    c = 1 - u;
    d = u + v - 1;
  }
  const za = a ? field.getHeight(column, row) : 0;
  const zb = b ? field.getHeight(column + 1, row) : 0;
  const zc = c ? field.getHeight(column, row + 1) : 0;
  const zd = d ? field.getHeight(column + 1, row + 1) : 0;
  if (za === undefined || zb === undefined || zc === undefined || zd === undefined)
    return undefined;
  const height = a * za + b * zb + c * zc + d * zd;
  if (!Number.isFinite(height)) throw new Error('Terrain triangle numeric sampling failure');
  return height;
}
