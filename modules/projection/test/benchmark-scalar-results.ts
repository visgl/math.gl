// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original reusable-output workload with no per-record views or result arrays.
import type {ProjectionOutput} from '@math.gl/projection/core';
import type {PipelineEpochs} from '@math.gl/projection/pipeline';
import type {BenchmarkOptions} from './live-bench-types';

type Operation = (point: number[], output: ProjectionOutput, epoch?: number) => ProjectionOutput;
export function scalarResultRunner(
  operation: Operation,
  options: BenchmarkOptions,
  typed: boolean,
  epochs?: PipelineEpochs
) {
  const input = Array<number>(options.dimension).fill(0);
  const output = typed
    ? options.precision === 'Float32'
      ? new Float32Array(options.dimension)
      : new Float64Array(options.dimension)
    : Array<number>(options.dimension).fill(0);
  return (buffer: Float32Array | Float64Array) => {
    for (
      let offset = 0, record = 0;
      offset < buffer.length;
      offset += options.dimension, record++
    ) {
      for (let axis = 0; axis < options.dimension; axis++) input[axis] = buffer[offset + axis];
      if (
        operation(input, output, typeof epochs === 'number' ? epochs : epochs?.[record]) !== output
      )
        throw new Error('Reusable scalar must return its output');
      for (let axis = 0; axis < options.dimension; axis++) buffer[offset + axis] = output[axis];
    }
  };
}
