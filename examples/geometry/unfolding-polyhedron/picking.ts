// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {type Polyhedron} from './polyhedra';

/** Pick the visible triangle in orthographic clip coordinates. Interpolate the
 * original Cartesian surface, just like the texture shader, then recover lon/lat.
 * Longitude itself must not be interpolated across the date line.
 */
export function pickSurface(
  mesh: Polyhedron,
  positions: number[][][],
  x: number,
  y: number
): {face: number; longitude: number; latitude: number} | null {
  let closest = Infinity;
  let hit: ReturnType<typeof pickSurface> = null;
  mesh.faces.forEach((ids, face) => {
    const points = positions[face];
    if (!points) return;
    for (let j = 1; j < ids.length - 1; j++) {
      const a = points[0],
        b = points[j],
        c = points[j + 1];
      const determinant = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
      if (Math.abs(determinant) < 1e-14) continue;
      const u = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / determinant;
      const v = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / determinant;
      const w = 1 - u - v;
      if (Math.min(u, v, w) < -1e-10) continue;
      const depth = u * a[2] + v * b[2] + w * c[2];
      if (depth < -1 || depth > 1 || depth >= closest) continue;
      const source = [0, 0, 0];
      [0, j, j + 1].forEach((k, index) => {
        const weight = [u, v, w][index];
        for (let axis = 0; axis < 3; axis++) source[axis] += weight * mesh.vertices[ids[k]][axis];
      });
      const length = Math.hypot(...source);
      if (length < 1e-14) continue;
      closest = depth;
      hit = {
        face,
        longitude:
          Math.hypot(source[0], source[1]) / length < 1e-7
            ? 0
            : (Math.atan2(source[1], source[0]) * 180) / Math.PI,
        latitude: (Math.atan2(source[2], Math.hypot(source[0], source[1])) * 180) / Math.PI
      };
    }
  });
  return hit;
}
