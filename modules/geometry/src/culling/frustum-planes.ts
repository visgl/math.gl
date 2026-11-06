// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {getProjectionDepthRange, type ProjectionDepthOptions} from '@math.gl/core';
import {Plane} from './lib/plane';

/** Inward planes: left, right, bottom, top, near, far. An infinite far plane is omitted. */
export function extractFrustumPlanes(
  matrix: ArrayLike<number>,
  options: ProjectionDepthOptions = {}
): Plane[] {
  if (matrix.length !== 16 || Array.from(matrix).some(x => !Number.isFinite(x)))
    throw new RangeError('Expected a finite view-projection matrix');
  const [near, far] = getProjectionDepthRange(options);
  const low = Math.min(near, far),
    high = Math.max(near, far);
  const row = (i: number) => [matrix[i], matrix[i + 4], matrix[i + 8], matrix[i + 12]];
  const x = row(0),
    y = row(1),
    z = row(2),
    w = row(3);
  const combine = (a: number[], b: number[], factor: number) => a.map((v, i) => v + factor * b[i]);
  const lo = combine(z, w, -low),
    hi = w.map((v, i) => high * v - z[i]);
  const coefficients = [
    combine(w, x, 1),
    combine(w, x, -1),
    combine(w, y, 1),
    combine(w, y, -1),
    ...(options.reversedDepth ? [hi, lo] : [lo, hi])
  ];
  const planes: Plane[] = [];
  for (const [a, b, c, d] of coefficients) {
    const length = Math.hypot(a, b, c);
    if (length === 0) {
      if (d < 0) throw new RangeError('Empty clipping volume');
    } else planes.push(new Plane([a / length, b / length, c / length], d / length));
  }
  if (planes.length < 4) throw new RangeError('Degenerate clipping volume');
  return planes;
}
