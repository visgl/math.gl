// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {angle, coordinates, geographic, unit, type Position, type Vector} from './math';

/** Preserve the source minor arc, including each owning chart's longitude side. */
export function sourceArc(a: Position, b: Position) {
  const va = geographic(a),
    vb = geographic(b),
    length = angle(va, vb);
  const poleA = Math.abs(a[1]) === 90,
    poleB = Math.abs(b[1]) === 90;
  const start: Position = poleA && !poleB ? [b[0], a[1]] : [...a],
    end: Position = poleB && !poleA ? [a[0], b[1]] : [...b];
  return (t: number): Position => {
    if (t === 0) return [...start];
    if (t === 1) return [...end];
    if (length < 1e-14) return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
    const p = coordinates(
      unit(
        va.map(
          (v, k) =>
            (Math.sin((1 - t) * length) * v + Math.sin(t * length) * vb[k]) / Math.sin(length)
        ) as Vector
      )
    );
    const reference = start[0] + t * (end[0] - start[0]);
    p[0] += 360 * Math.round((reference - p[0]) / 360);
    return p;
  };
}
