// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original bounded damped Newton inverse with numerical displacement Jacobian; no upstream solver copied.
import type {ProjectionPoint} from './types';
export type FixedDisplacement = (point: ProjectionPoint, source: number, target: number) => void;
/** Source-sampled map inverse. Successful iterations reuse the caller's working point. */
export function inverseDisplacement(
  point: ProjectionPoint,
  x: number,
  y: number,
  z: number,
  source: number,
  target: number,
  sample: FixedDisplacement
): void {
  let px = x,
    py = y,
    pz = z;
  for (let iteration = 0; iteration < 16; iteration++) {
    point.x = px;
    point.y = py;
    point.z = pz;
    sample(point, source, target);
    const rx = px - x + point.x,
      ry = py - y + point.y,
      rz = pz - z + point.z;
    const norm = Math.hypot(rx, ry, rz);
    if (!Number.isFinite(norm)) throw new Error('Non-finite temporal inverse residual');
    if (norm <= 1e-8) {
      point.x = px;
      point.y = py;
      point.z = pz;
      return;
    }
    const epsilon =
      Math.sqrt(Number.EPSILON) * Math.max(1, Math.abs(px), Math.abs(py), Math.abs(pz));
    let j00 = 0,
      j01 = 0,
      j02 = 0,
      j10 = 0,
      j11 = 0,
      j12 = 0,
      j20 = 0,
      j21 = 0,
      j22 = 0;
    for (let axis = 0; axis < 3; axis++) {
      point.x = px + (axis === 0 ? epsilon : 0);
      point.y = py + (axis === 1 ? epsilon : 0);
      point.z = pz + (axis === 2 ? epsilon : 0);
      sample(point, source, target);
      const vx = point.x,
        vy = point.y,
        vz = point.z;
      point.x = px - (axis === 0 ? epsilon : 0);
      point.y = py - (axis === 1 ? epsilon : 0);
      point.z = pz - (axis === 2 ? epsilon : 0);
      sample(point, source, target);
      const dx = (vx - point.x) / (2 * epsilon),
        dy = (vy - point.y) / (2 * epsilon),
        dz = (vz - point.z) / (2 * epsilon);
      if (axis === 0) {
        j00 = 1 + dx;
        j10 = dy;
        j20 = dz;
      } else if (axis === 1) {
        j01 = dx;
        j11 = 1 + dy;
        j21 = dz;
      } else {
        j02 = dx;
        j12 = dy;
        j22 = 1 + dz;
      }
    }
    const c00 = j11 * j22 - j12 * j21,
      c01 = j02 * j21 - j01 * j22,
      c02 = j01 * j12 - j02 * j11;
    const c10 = j12 * j20 - j10 * j22,
      c11 = j00 * j22 - j02 * j20,
      c12 = j02 * j10 - j00 * j12;
    const c20 = j10 * j21 - j11 * j20,
      c21 = j01 * j20 - j00 * j21,
      c22 = j00 * j11 - j01 * j10;
    const determinant = j00 * c00 + j01 * c10 + j02 * c20;
    if (!Number.isFinite(determinant) || determinant === 0)
      throw new Error('Singular temporal inverse Jacobian');
    const sx = (c00 * rx + c01 * ry + c02 * rz) / determinant,
      sy = (c10 * rx + c11 * ry + c12 * rz) / determinant,
      sz = (c20 * rx + c21 * ry + c22 * rz) / determinant;
    if (!Number.isFinite(sx) || !Number.isFinite(sy) || !Number.isFinite(sz))
      throw new Error('Non-finite temporal inverse update');
    let accepted = false;
    for (let half = 0; half < 12; half++) {
      const scale = 2 ** -half,
        nx = px - scale * sx,
        ny = py - scale * sy,
        nz = pz - scale * sz;
      point.x = nx;
      point.y = ny;
      point.z = nz;
      try {
        sample(point, source, target);
        const error = Math.hypot(nx - x + point.x, ny - y + point.y, nz - z + point.z);
        if (Number.isFinite(error) && error < norm) {
          if (error <= 1e-8) {
            point.x = nx;
            point.y = ny;
            point.z = nz;
            return;
          }
          px = nx;
          py = ny;
          pz = nz;
          accepted = true;
          break;
        }
      } catch {
        /* Domain/coverage failures reject this trial; no extrapolation. */
      }
    }
    if (!accepted) throw new Error('Temporal inverse line search failed');
  }
  throw new Error('Temporal inverse did not converge');
}
