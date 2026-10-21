// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileCopyrightText: Copyright (c) 2016, Thomas Knudsen / SDFE (PROJ)
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// SPDX-FileComment: Original numeric-buffer traversal around kinematic-helmert.ts's existing attributed equations and prepared coefficients. Exact matrix application follows the PROJ adaptation; small-angle matrix application follows the proj4js adaptation. See ../../PROJ-LICENSE.txt and ../../PROJ4-LICENSE.md. No model data is included.
import type {NumericFlatOperation} from './numeric-flat';

/** Borrow the stage's owned coefficients, with exactly the scalar epoch preparation. */
export function createKinematicHelmertFlat(
  coefficients: Float64Array,
  prepare: (epoch: number | undefined) => void,
  inverse: boolean
): NumericFlatOperation {
  return (coordinates, dimension, epochs) => {
    const float32 = coordinates instanceof Float32Array;
    const epochBuffer = typeof epochs === 'number' ? undefined : epochs;
    const batchEpoch = typeof epochs === 'number' ? epochs : undefined;
    // Call-local numeric bindings do not escape into a mutable closure or point.
    let a = 0,
      b = 0,
      c = 0,
      d = 0,
      e = 0,
      f = 0,
      g = 0,
      h = 0,
      j = 0;
    let dx = 0,
      dy = 0,
      dz = 0,
      scale = 1;
    for (let offset = 0, record = 0; offset < coordinates.length; offset += dimension, record++) {
      let x = coordinates[offset],
        y = coordinates[offset + 1],
        z = coordinates[offset + 2];
      const epoch = epochBuffer ? epochBuffer[record] : batchEpoch;
      if (epochBuffer && !Number.isFinite(epoch))
        throw new Error('Coordinate epoch must be a finite decimal year');
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z))
        throw new Error('Pipeline coordinate must be finite');
      if (epochBuffer || offset === 0) {
        // Preserve precedence and empty-buffer behavior: first validate XYZ, then
        // prepare the epoch-adjusted parameters. A constant batch prepares once.
        prepare(epoch);
        a = coefficients[0];
        b = coefficients[1];
        c = coefficients[2];
        d = coefficients[3];
        e = coefficients[4];
        f = coefficients[5];
        g = coefficients[6];
        h = coefficients[7];
        j = coefficients[8];
        dx = coefficients[9];
        dy = coefficients[10];
        dz = coefficients[11];
        scale = coefficients[12];
      }
      let outX: number, outY: number, outZ: number;
      if (inverse) {
        x = (x - dx) / scale;
        y = (y - dy) / scale;
        z = (z - dz) / scale;
        outX = a * x + d * y + g * z;
        outY = b * x + e * y + h * z;
        outZ = c * x + f * y + j * z;
      } else {
        outX = scale * (a * x + b * y + c * z) + dx;
        outY = scale * (d * x + e * y + f * z) + dy;
        outZ = scale * (g * x + h * y + j * z) + dz;
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
