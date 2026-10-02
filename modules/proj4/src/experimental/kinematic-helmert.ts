// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original epoch propagation follows PROJ's kinematic Helmert contract.
// Exact matrix/convention transpose adapted from PROJ 9.5.1 helmert.cpp,
// Copyright (c) 2016, Thomas Knudsen / SDFE. See ../../PROJ-LICENSE.txt.
// Small-angle equations follow the attributed proj4js adaptation in datum.ts.
import type {ProjectionPoint} from './types';
import type {PipelineHelmertRates} from './projection-pipeline';

/** Own coefficient snapshots; no arrays/objects are allocated inside point operations. */
export function createKinematicHelmert(
  translation: readonly number[],
  rotation: readonly number[],
  scalePPM: number,
  rates: PipelineHelmertRates,
  referenceEpoch: number,
  coordinateFrame: boolean,
  exact: boolean
): {
  forward: (point: ProjectionPoint, epoch?: number) => void;
  inverse: (point: ProjectionPoint, epoch?: number) => void;
} {
  const base = [...translation, ...rotation, scalePPM];
  const velocity = [
    ...(rates.translation || [0, 0, 0]),
    ...(rates.rotation || [0, 0, 0]),
    rates.scalePPM || 0
  ];
  const arcsecond = Math.PI / (180 * 3600);
  let preparedEpoch: number | undefined;
  let dx = 0,
    dy = 0,
    dz = 0,
    scale = 1;
  let r00 = 1,
    r01 = 0,
    r02 = 0,
    r10 = 0,
    r11 = 1,
    r12 = 0,
    r20 = 0,
    r21 = 0,
    r22 = 1;
  function prepare(epoch: number | undefined): void {
    if (typeof epoch !== 'number' || !Number.isFinite(epoch))
      throw new Error('Kinematic Helmert requires a finite coordinate epoch');
    if (epoch === preparedEpoch) return;
    const elapsed = epoch - referenceEpoch;
    const x = base[0] + velocity[0] * elapsed,
      y = base[1] + velocity[1] * elapsed,
      z = base[2] + velocity[2] * elapsed,
      rx = (base[3] + velocity[3] * elapsed) * arcsecond,
      ry = (base[4] + velocity[4] * elapsed) * arcsecond,
      rz = (base[5] + velocity[5] * elapsed) * arcsecond,
      nextScale = 1 + (base[6] + velocity[6] * elapsed) / 1e6;
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(z) ||
      !Number.isFinite(rx) ||
      !Number.isFinite(ry) ||
      !Number.isFinite(rz) ||
      !Number.isFinite(nextScale) ||
      nextScale <= 0
    )
      throw new Error('Invalid epoch-adjusted Helmert parameters or scale');
    if (exact) {
      const cx = Math.cos(rx),
        sx = Math.sin(rx),
        cy = Math.cos(ry),
        sy = Math.sin(ry),
        cz = Math.cos(rz),
        sz = Math.sin(rz);
      r00 = cy * cz;
      r01 = cx * sz + sx * sy * cz;
      r02 = sx * sz - cx * sy * cz;
      r10 = -cy * sz;
      r11 = cx * cz - sx * sy * sz;
      r12 = sx * cz + cx * sy * sz;
      r20 = sy;
      r21 = -sx * cy;
      r22 = cx * cy;
      if (!coordinateFrame) {
        // Transpose the full matrix without destructuring's temporary arrays.
        let saved = r01;
        r01 = r10;
        r10 = saved;
        saved = r02;
        r02 = r20;
        r20 = saved;
        saved = r12;
        r12 = r21;
        r21 = saved;
      }
    } else {
      const sign = coordinateFrame ? -1 : 1;
      r01 = -sign * rz;
      r02 = sign * ry;
      r10 = sign * rz;
      r12 = -sign * rx;
      r20 = -sign * ry;
      r21 = sign * rx;
    }
    dx = x;
    dy = y;
    dz = z;
    scale = nextScale;
    preparedEpoch = epoch;
  }
  return {
    forward(point, epoch) {
      prepare(epoch);
      const {x, y, z} = point;
      point.x = scale * (r00 * x + r01 * y + r02 * z) + dx;
      point.y = scale * (r10 * x + r11 * y + r12 * z) + dy;
      point.z = scale * (r20 * x + r21 * y + r22 * z) + dz;
    },
    inverse(point, epoch) {
      prepare(epoch);
      const x = (point.x - dx) / scale,
        y = (point.y - dy) / scale,
        z = (point.z - dz) / scale;
      point.x = r00 * x + r10 * y + r20 * z;
      point.y = r01 * x + r11 * y + r21 * z;
      point.z = r02 * x + r12 * y + r22 * z;
    }
  };
}
