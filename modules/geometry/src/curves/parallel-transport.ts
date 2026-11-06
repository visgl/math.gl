// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {CurvePoint} from './curve';

export type CurveFrames = {tangents: Float64Array; normals: Float64Array; binormals: Float64Array};
type V = number[];
const sub = (a: V, b: V) => a.map((x, i) => x - b[i]);
const dot = (a: V, b: V) => a.reduce((sum, x, i) => sum + x * b[i], 0);
const cross = (a: V, b: V): V => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];
const unit = (a: V) => {
  const length = Math.hypot(...a);
  if (!length) throw new RangeError('Cannot construct a frame for a stationary path');
  return a.map(x => x / length);
};
function rotate(v: V, axis: V, angle: number): V {
  const c = Math.cos(angle),
    s = Math.sin(angle),
    d = dot(axis, v),
    k = cross(axis, v);
  return v.map((x, i) => x * c + k[i] * s + axis[i] * d * (1 - c));
}
/** Frames on a 3D polyline; repeated points inherit a neighboring direction. Closed paths repeat the first point. */
export function computeParallelTransportFrames(
  points: readonly CurvePoint[],
  options: {closed?: boolean; initialNormal?: CurvePoint} = {}
): CurveFrames {
  if (
    points.length < 2 ||
    points.some(p => p.length !== 3 || Array.from(p).some(x => !Number.isFinite(x)))
  )
    throw new RangeError('Expected at least two finite 3D points');
  const data = points.map(p => Array.from(p)),
    n = data.length,
    closed = options.closed ?? false;
  if (closed && (n < 4 || Math.hypot(...sub(data[0], data[n - 1])) !== 0))
    throw new RangeError('A closed path must repeat its first point');
  const tangent: V[] = [];
  for (let i = 0; i < n; i++) {
    let d: V | undefined;
    for (let j = i + 1; j < n; j++) {
      const candidate = sub(data[j], data[i]);
      if (Math.hypot(...candidate)) {
        d = candidate;
        break;
      }
    }
    if (!d)
      for (let j = i - 1; j >= 0; j--) {
        const candidate = sub(data[i], data[j]);
        if (Math.hypot(...candidate)) {
          d = candidate;
          break;
        }
      }
    tangent.push(unit(d ?? [0, 0, 0]));
  }
  if (closed) tangent[n - 1] = [...tangent[0]];
  const t = tangent[0];
  let initial = options.initialNormal ? Array.from(options.initialNormal) : [0, 0, 0];
  if (options.initialNormal && (initial.length !== 3 || initial.some(x => !Number.isFinite(x))))
    throw new RangeError('Invalid initial normal');
  // Select an axis by absolute alignment (including negative tangent components).
  if (!options.initialNormal) {
    initial = [0, 0, 0];
    initial[t.map(Math.abs).indexOf(Math.min(...t.map(Math.abs)))] = 1;
  }
  const normals: V[] = [unit(initial.map((x, i) => x - dot(initial, t) * t[i]))];
  for (let i = 1; i < n; i++) {
    const axis = cross(tangent[i - 1], tangent[i]),
      length = Math.hypot(...axis),
      cosine = Math.max(-1, Math.min(1, dot(tangent[i - 1], tangent[i])));
    let normal = normals[i - 1];
    if (length > 1e-12)
      normal = rotate(
        normal,
        axis.map(x => x / length),
        Math.atan2(length, cosine)
      );
    // At an exact reversal the previous normal defines the deterministic 180-degree axis.
    normals.push(unit(normal.map((x, j) => x - dot(normal, tangent[i]) * tangent[i][j])));
  }
  if (closed) {
    const mismatch = Math.atan2(
      dot(tangent[0], cross(normals[n - 1], normals[0])),
      dot(normals[n - 1], normals[0])
    );
    const lengths = [0];
    for (let i = 1; i < n; i++)
      lengths.push(lengths[i - 1] + Math.hypot(...sub(data[i], data[i - 1])));
    for (let i = 1; i < n; i++)
      normals[i] = rotate(normals[i], tangent[i], (mismatch * lengths[i]) / lengths[n - 1]);
  }
  return {
    tangents: new Float64Array(tangent.flat()),
    normals: new Float64Array(normals.flat()),
    binormals: new Float64Array(normals.flatMap((normal, i) => cross(tangent[i], normal)))
  };
}
