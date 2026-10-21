// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original whole-buffer unit/axis pipeline execution with intermediate validation.
import type {PipelineEpochs} from './projection-pipeline';
import type {ProjectionArray} from './typescript-projection';

/** Keep multiplication and division distinct, preserving each scalar step's rounding. */
export type NumericStep = readonly [kind: 0 | 1 | 2, a: number, b: number, c: number];
export type NumericFlatOperation = (
  coordinates: ProjectionArray,
  dimension: number,
  epochs?: PipelineEpochs
) => void;

/** Compile only validated unit/axis steps; all other operations retain general dispatch. */
export function createNumericFlat(steps: readonly NumericStep[]): NumericFlatOperation {
  const program = new Float64Array(steps.length * 7);
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i],
      offset = i * 7;
    program.set(step, offset);
    if (step[0] === 2) {
      for (let axis = 1; axis <= 3; axis++) {
        program[offset + axis] = Math.abs(step[axis]);
        program[offset + axis + 3] = Math.sign(step[axis]);
      }
    }
  }
  return (coordinates, dimension, epochs) => {
    const float32 = coordinates instanceof Float32Array;
    const epochBuffer = typeof epochs === 'number' ? undefined : epochs;
    for (let offset = 0, record = 0; offset < coordinates.length; offset += dimension, record++) {
      let x = coordinates[offset],
        y = coordinates[offset + 1],
        z = dimension >= 3 ? coordinates[offset + 2] : 0;
      if (epochBuffer && !Number.isFinite(epochBuffer[record]))
        throw new Error('Coordinate epoch must be a finite decimal year');
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z))
        throw new Error('Pipeline coordinate must be finite');
      for (let step = 0; step < program.length; step += 7) {
        const kind = program[step],
          a = program[step + 1],
          b = program[step + 2],
          c = program[step + 3];
        if (kind === 0) {
          x *= a;
          y *= b;
          z *= c;
        } else if (kind === 1) {
          x /= a;
          y /= b;
          z /= c;
        } else {
          const oldX = x,
            oldY = y,
            oldZ = z;
          x = program[step + 4] * (a === 1 ? oldX : a === 2 ? oldY : oldZ);
          y = program[step + 5] * (b === 1 ? oldX : b === 2 ? oldY : oldZ);
          z = program[step + 6] * (c === 1 ? oldX : c === 2 ? oldY : oldZ);
        }
        // An overflowing intermediate must fail even if a later conversion would cancel it.
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z))
          throw new Error('Pipeline coordinate must be finite');
      }
      if (float32 && Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) > 3.4028234663852886e38)
        throw new Error('Pipeline output exceeds Float32 range');
      coordinates[offset] = x;
      coordinates[offset + 1] = y;
      if (dimension >= 3) coordinates[offset + 2] = z;
    }
  };
}
