// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) 2016, Thomas Knudsen / SDFE (PROJ)
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Exact rotation matrix adapted from PROJ 9.5.1 src/transformations/helmert.cpp. See ../../PROJ-LICENSE.txt. Modified into prepared, typed, allocation-free point operations. Existing small-angle Helmert equations remain the proj4js adaptation in datum.ts.
import type {ProjectionPoint} from './types';

type Operation = (point: ProjectionPoint) => void;
export function createExactHelmert(
  translation: readonly number[],
  rotation: readonly number[],
  scalePPM: number,
  coordinateFrame: boolean
): {forward: Operation; inverse: Operation; coefficients: readonly number[]} {
  const radians = Math.PI / (180 * 3600);
  const [rx, ry, rz] = rotation.map(angle => angle * radians);
  const cx = Math.cos(rx),
    sx = Math.sin(rx),
    cy = Math.cos(ry),
    sy = Math.sin(ry),
    cz = Math.cos(rz),
    sz = Math.sin(rz);
  // Coordinate-frame convention. Position-vector convention transposes the
  // whole matrix; simply negating Euler angles is not equivalent for finite rotations.
  let r01 = cx * sz + sx * sy * cz,
    r02 = sx * sz - cx * sy * cz,
    r10 = -cy * sz,
    r12 = sx * cz + cx * sy * sz,
    r20 = sy,
    r21 = -sx * cy;
  const r00 = cy * cz,
    r11 = cx * cz - sx * sy * sz,
    r22 = cx * cy;
  if (!coordinateFrame) {
    [r01, r10] = [r10, r01];
    [r02, r20] = [r20, r02];
    [r12, r21] = [r21, r12];
  }
  const scale = 1 + scalePPM / 1e6;
  const [dx, dy, dz] = translation;
  return {
    coefficients: [r00, r01, r02, r10, r11, r12, r20, r21, r22, dx, dy, dz, scale],
    forward(point) {
      const {x, y, z} = point;
      point.x = scale * (r00 * x + r01 * y + r02 * z) + dx;
      point.y = scale * (r10 * x + r11 * y + r12 * z) + dy;
      point.z = scale * (r20 * x + r21 * y + r22 * z) + dz;
    },
    inverse(point) {
      const x = (point.x - dx) / scale,
        y = (point.y - dy) / scale,
        z = (point.z - dz) / scale;
      point.x = r00 * x + r10 * y + r20 * z;
      point.y = r01 * x + r11 * y + r21 * z;
      point.z = r02 * x + r12 * y + r22 * z;
    }
  };
}
