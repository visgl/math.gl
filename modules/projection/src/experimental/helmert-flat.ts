// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// SPDX-FileCopyrightText: Copyright (c) 2016, Thomas Knudsen / SDFE (PROJ)
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original whole-buffer dispatch. Small-angle equations follow the proj4js adaptation in datum.ts; see ../../PROJ4-LICENSE.md. Exact equations follow exact-helmert.ts, adapted from PROJ 9.5.1 helmert.cpp; see ../../PROJ-LICENSE.txt. Consume its prepared matrix without recomputing rotations.
import type {NumericFlatOperation} from './numeric-flat';

/** Setup-owned coefficients: small-angle rx/ry/rz or row-major exact matrix, then dx/dy/dz/scale. */
export function createHelmertFlat(
  coefficients: readonly number[],
  inverse: boolean,
  exact: boolean
): NumericFlatOperation {
  const dx = coefficients[9],
    dy = coefficients[10],
    dz = coefficients[11],
    scale = coefficients[12];
  const a = coefficients[0],
    b = coefficients[1],
    c = coefficients[2],
    d = coefficients[3],
    e = coefficients[4],
    f = coefficients[5],
    g = coefficients[6],
    h = coefficients[7],
    j = coefficients[8];
  return (coordinates, dimension, epochs) => {
    const float32 = coordinates instanceof Float32Array;
    const epochBuffer = typeof epochs === 'number' ? undefined : epochs;
    for (let offset = 0, record = 0; offset < coordinates.length; offset += dimension, record++) {
      let x = coordinates[offset],
        y = coordinates[offset + 1],
        z = coordinates[offset + 2];
      if (epochBuffer && !Number.isFinite(epochBuffer[record]))
        throw new Error('Coordinate epoch must be a finite decimal year');
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z))
        throw new Error('Pipeline coordinate must be finite');
      if (inverse) {
        x = (x - dx) / scale;
        y = (y - dy) / scale;
        z = (z - dz) / scale;
      }
      let outX: number, outY: number, outZ: number;
      if (exact) {
        if (inverse) {
          outX = a * x + d * y + g * z;
          outY = b * x + e * y + h * z;
          outZ = c * x + f * y + j * z;
        } else {
          outX = scale * (a * x + b * y + c * z) + dx;
          outY = scale * (d * x + e * y + f * z) + dy;
          outZ = scale * (g * x + h * y + j * z) + dz;
        }
      } else if (inverse) {
        outX = x + c * y - b * z;
        outY = -c * x + y + a * z;
        outZ = b * x - a * y + z;
      } else {
        outX = scale * (x - c * y + b * z) + dx;
        outY = scale * (c * x + y - a * z) + dy;
        outZ = scale * (-b * x + a * y + z) + dz;
      }
      if (!Number.isFinite(outX) || !Number.isFinite(outY) || !Number.isFinite(outZ))
        throw new Error('Pipeline coordinate must be finite');
      if (
        float32 &&
        Math.max(Math.abs(outX), Math.abs(outY), Math.abs(outZ)) > 3.4028234663852886e38
      )
        throw new Error('Pipeline output exceeds Float32 range');
      coordinates[offset] = outX;
      coordinates[offset + 1] = outY;
      coordinates[offset + 2] = outZ;
    }
  };
}
