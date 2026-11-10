// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// Robert W. Gray (1995), Exact Transformation Equations for Fuller's World Map.
// Forward equations also published by Philippe Rivière under CC0 in
// d3-geo-polygon/src/grayfuller.js. Inverse solves the monotone angle sum.
import {type Position} from './math';
const root3 = Math.sqrt(3);
const height = Math.sqrt((5 + 2 * Math.sqrt(5)) / 15);
const edge = Math.sqrt(8 / (5 + Math.sqrt(5)));
const distance = Math.sqrt((3 + Math.sqrt(5)) / (5 + Math.sqrt(5)));

/** Input is gnomonic coordinates in a face frame with a vertex on +y. */
export function grayFullerForward(x: number, y: number): Position {
  x *= height;
  y *= height;
  const a = Math.atan(((2 * y) / root3 - edge / 6) / distance);
  const b = Math.atan((x - y / root3 - edge / 6) / distance);
  const c = Math.atan((-x - y / root3 - edge / 6) / distance);
  return [root3 * (b - c), 2 * a - b - c];
}
export function grayFullerInverse(x: number, y: number): Position | null {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const b = -y / 2 + x / (2 * root3),
    c = -y / 2 - x / (2 * root3);
  let low = -Math.PI / 2 - Math.min(0, b, c) + 1e-14;
  let high = Math.PI / 2 - Math.max(0, b, c) - 1e-14;
  if (low >= high) return null;
  for (let i = 0; i < 55; i++) {
    const t = (low + high) / 2;
    if (Math.tan(t) + Math.tan(t + b) + Math.tan(t + c) > -edge / (2 * distance)) high = t;
    else low = t;
  }
  const t = (low + high) / 2;
  const py = ((distance * Math.tan(t) + edge / 6) * root3) / 2;
  return [(distance * Math.tan(t + b) + py / root3 + edge / 6) / height, py / height];
}
