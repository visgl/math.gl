// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileCopyrightText: Copyright (c) 2016, Thomas Knudsen / SDFE (PROJ)
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// SPDX-FileComment: Original epoch propagation follows PROJ's kinematic Helmert contract. Exact matrix/convention transpose adapted from PROJ 9.5.1 helmert.cpp. See ../../PROJ-LICENSE.txt. Small-angle equations follow the attributed proj4js adaptation in datum.ts. See ../../PROJ4-LICENSE.md for the small-angle adaptation license.
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
  // Updating captured numeric bindings can box each changed coefficient. Keep
  // mutable coefficients and the last epoch in owned typed storage instead.
  // Row-major rotation [0..8], translation [9..11], scale [12], epoch [13].
  const coefficients = new Float64Array(14);
  coefficients[0] = coefficients[4] = coefficients[8] = coefficients[12] = 1;
  coefficients[13] = NaN;
  function prepare(epoch: number | undefined): void {
    if (typeof epoch !== 'number' || !Number.isFinite(epoch))
      throw new Error('Kinematic Helmert requires a finite coordinate epoch');
    if (epoch === coefficients[13]) return;
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
      coefficients[0] = cy * cz;
      coefficients[1] = cx * sz + sx * sy * cz;
      coefficients[2] = sx * sz - cx * sy * cz;
      coefficients[3] = -cy * sz;
      coefficients[4] = cx * cz - sx * sy * sz;
      coefficients[5] = sx * cz + cx * sy * sz;
      coefficients[6] = sy;
      coefficients[7] = -sx * cy;
      coefficients[8] = cx * cy;
      if (!coordinateFrame) {
        // Transpose the full matrix without destructuring's temporary arrays.
        let saved = coefficients[1];
        coefficients[1] = coefficients[3];
        coefficients[3] = saved;
        saved = coefficients[2];
        coefficients[2] = coefficients[6];
        coefficients[6] = saved;
        saved = coefficients[5];
        coefficients[5] = coefficients[7];
        coefficients[7] = saved;
      }
    } else {
      const sign = coordinateFrame ? -1 : 1;
      coefficients[1] = -sign * rz;
      coefficients[2] = sign * ry;
      coefficients[3] = sign * rz;
      coefficients[5] = -sign * rx;
      coefficients[6] = -sign * ry;
      coefficients[7] = sign * rx;
    }
    coefficients[9] = x;
    coefficients[10] = y;
    coefficients[11] = z;
    coefficients[12] = nextScale;
    coefficients[13] = epoch;
  }
  return {
    forward(point, epoch) {
      prepare(epoch);
      const {x, y, z} = point;
      point.x =
        coefficients[12] * (coefficients[0] * x + coefficients[1] * y + coefficients[2] * z) +
        coefficients[9];
      point.y =
        coefficients[12] * (coefficients[3] * x + coefficients[4] * y + coefficients[5] * z) +
        coefficients[10];
      point.z =
        coefficients[12] * (coefficients[6] * x + coefficients[7] * y + coefficients[8] * z) +
        coefficients[11];
    },
    inverse(point, epoch) {
      prepare(epoch);
      const x = (point.x - coefficients[9]) / coefficients[12],
        y = (point.y - coefficients[10]) / coefficients[12],
        z = (point.z - coefficients[11]) / coefficients[12];
      point.x = coefficients[0] * x + coefficients[3] * y + coefficients[6] * z;
      point.y = coefficients[1] * x + coefficients[4] * y + coefficients[7] * z;
      point.z = coefficients[2] * x + coefficients[5] * y + coefficients[8] * z;
    }
  };
}
