// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {getRes0Cells, cellToBoundary} from 'h3-js';
import {h3Face, projectH3} from './h3-net.js';
const unit = (lon, lat) => [
  Math.cos((lat * Math.PI) / 180) * Math.cos((lon * Math.PI) / 180),
  Math.cos((lat * Math.PI) / 180) * Math.sin((lon * Math.PI) / 180),
  Math.sin((lat * Math.PI) / 180)
];
const interpolate = (a, b, t) => {
  const p = unit(...a).map((v, i) => v * (1 - t) + unit(...b)[i] * t),
    n = Math.hypot(...p);
  return [(Math.atan2(p[1], p[0]) * 180) / Math.PI, (Math.asin(p[2] / n) * 180) / Math.PI];
};
/** Split actual H3 base-cell edges at face changes; never draw across a net cut. */
export function getH3GridPaths() {
  const paths = [];
  for (const cell of getRes0Cells()) {
    const ring = cellToBoundary(cell, true);
    for (let edge = 0; edge < ring.length - 1; edge++) {
      const a = ring[edge],
        b = ring[edge + 1];
      let previous = a,
        face = h3Face(...a),
        path = [projectH3(...a, face)];
      for (let i = 1; i <= 12; i++) {
        const p = interpolate(a, b, i / 12),
          next = h3Face(...p);
        if (next !== face) {
          let lo = 0,
            hi = 1;
          for (let k = 0; k < 30; k++) {
            const mid = (lo + hi) / 2;
            if (h3Face(...interpolate(previous, p, mid)) === face) lo = mid;
            else hi = mid;
          }
          const cut = interpolate(previous, p, (lo + hi) / 2);
          path.push(projectH3(...cut, face));
          paths.push(path);
          path = [projectH3(...cut, next)];
          face = next;
        }
        path.push(projectH3(...p, face));
        previous = p;
      }
      paths.push(path);
    }
  }
  return paths;
}
