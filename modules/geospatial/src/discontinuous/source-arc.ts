// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {angle, coordinates, geographic, unit, type Position, type Vector} from './math';

/** Preserve the source minor arc, including each owning chart's longitude side. */
export function sourceArc(a: Position, b: Position) {
  const va = geographic(a),
    vb = geographic(b),
    length = angle(va, vb);
  return (t: number): Position => {
    if (t === 0) return [...a];
    if (t === 1) return [...b];
    if (length < 1e-14) return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
    const p = coordinates(
      unit(
        va.map(
          (v, k) =>
            (Math.sin((1 - t) * length) * v + Math.sin(t * length) * vb[k]) / Math.sin(length)
        ) as Vector
      )
    );
    const reference = a[0] + t * (b[0] - a[0]);
    p[0] += 360 * Math.round((reference - p[0]) / 360);
    return p;
  };
}
