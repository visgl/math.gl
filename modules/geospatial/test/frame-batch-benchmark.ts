// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Vector3} from '@math.gl/core';
import {LocalReferenceFrame} from '@math.gl/geospatial';
import reference from './c8-reference.json';
export {qualifyFrameBatches} from './frame-batch-qualification';
export function prepareFrameBatches(points: number, packed: boolean) {
  const r = reference.frames[37],
    frame = new LocalReferenceFrame(r.origin);
  const scalar = [
    'localToFixedPoint',
    'fixedToLocalPoint',
    'localToFixedVector',
    'fixedToLocalVector'
  ] as const;
  const flat = [
    'localToFixedPointsFlat',
    'fixedToLocalPointsFlat',
    'localToFixedVectorsFlat',
    'fixedToLocalVectorsFlat'
  ] as const;
  return scalar.map((method, index) => {
    const inverse = index % 2 === 1,
      position = index < 2;
    const input = new Float64Array(points * 3),
      output = new Float64Array(input.length);
    const v = new Vector3(),
      p = new Vector3();
    for (let i = 0; i < points; i++)
      for (let j = 0; j < 3; j++)
        input[3 * i + j] =
          (r.local[j] * ((i % 17) - 8)) / 8 + (inverse && position ? r.origin[j] : 0);
    const expected = Float64Array.from(input, (_, i) => {
      const j = i % 3,
        offset = i - j;
      return [0, 1, 2].reduce(
        (sum, k) =>
          sum +
          (inverse ? r.basis[3 * j + k] : r.basis[3 * k + j]) *
            (input[offset + k] - (inverse && position ? r.origin[k] : 0)),
        !inverse && position ? r.origin[j] : 0
      );
    });
    const run = packed
      ? () => {
          frame[flat[index]](input, output);
        }
      : () => {
          for (let i = 0; i < input.length; i += 3) {
            v.set(input[i], input[i + 1], input[i + 2]);
            frame[method](v, p);
            output[i] = p[0];
            output[i + 1] = p[1];
            output[i + 2] = p[2];
          }
        };
    const validate = () => {
      run();
      let usage = 0;
      for (let i = 0; i < output.length; i++)
        usage = Math.max(usage, Math.abs(output[i] - expected[i]) / r.radii[0] / 2e-12);
      if (!(usage <= 1)) throw new Error(method + ' failed independent output budget');
      return usage;
    };
    return {id: method, run, validate, checksum: () => output.reduce((sum, x) => sum + x, 0)};
  });
}
