// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {gringortenRaw} from './gringorten-kernel';

/** Gilbert's two-world transform followed by an orthographic hemisphere. */
export function gilbertRaw(lambda: number, phi: number): number[] {
  const y = Math.tan(phi / 2);
  return [Math.sqrt(Math.max(0, 1 - y * y)) * Math.sin(lambda / 2), y];
}
gilbertRaw.invert = (x: number, y: number): number[] => [
  2 * Math.asin(Math.max(-1, Math.min(1, x / Math.sqrt(Math.max(0, 1 - y * y))))),
  2 * Math.atan(y)
];

/** Place the two Gringorten hemisphere squares side by side. */
export function rectangularGringortenRaw(lambda: number, phi: number): number[] {
  const side = lambda > 0 ? 1 : -1;
  const point = gringortenRaw(lambda - (side * Math.PI) / 2, phi);
  return [point[0] + side, point[1]];
}
rectangularGringortenRaw.invert = (x: number, y: number): number[] => {
  const side = x > 0 ? 1 : -1;
  const point = gringortenRaw.invert(x - side, y);
  let lambda = point[0] + (side * Math.PI) / 2;
  if (lambda > Math.PI) lambda -= 2 * Math.PI;
  if (lambda < -Math.PI) lambda += 2 * Math.PI;
  return [lambda, point[1]];
};
