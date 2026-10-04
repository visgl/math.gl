// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original end-to-end layout benchmarks with reusable comparison storage.
import {ProjectionPipeline} from '@math.gl/projection/pipeline';
import {ProjectionBuffer} from '../src/bulk';
import {
  PIPELINE_SCENARIOS,
  qualifyBenchmarkPipeline,
  pipelineBenchmarkSource
} from './pipeline-benchmark-workload';
export {qualifyBulkLayouts} from './bulk-workload';

export function bulkBenchmarkJobs(horizontal: ArrayBuffer, points: number) {
  const jobs = [];
  for (const id of [
    'Mercator',
    'Mercator to UTM',
    'Horizontal grid to UTM',
    'Height stack and datum',
    'Mixed epochs with height stack and UTM'
  ]) {
    const scenario = PIPELINE_SCENARIOS.find(row => row.id === id)!;
    const projection = qualifyBenchmarkPipeline({ProjectionPipeline}, scenario, horizontal);
    for (const Type of [Float64Array, Float32Array])
      for (const inverse of [false, true])
        for (const columns of [false, true]) {
          const {source, epochs} = pipelineBenchmarkSource(scenario, {
            points,
            dimension: 4,
            precision: Type === Float64Array ? 'Float64' : 'Float32',
            direction: inverse ? 'unproject' : 'project'
          });
          if (inverse) projection.projectFlatSync(source, 4, epochs);
          const scalar = inverse ? projection.unprojectToSync : projection.projectToSync;
          const flat = inverse ? projection.unprojectFlatSync : projection.projectFlatSync;
          const expected = source.slice();
          flat(expected, 4, epochs);
          const inputStride = columns ? 2 : 6,
            outputStride = columns ? 3 : 7;
          const input = Array.from({length: columns ? 4 : 1}, () => new Type(points * inputStride));
          for (let row = 0; row < points; row++)
            for (let j = 0; j < 4; j++)
              input[columns ? j : 0][row * inputStride + (columns ? 0 : j)] = source[row * 4 + j];
          const names = [
            'ProjectionBuffer',
            'reusable scalar',
            'gather/flat/scatter',
            'ProjectionBuffer chunks'
          ];
          const runners = names.map((_, mode) => {
            const output = Array.from({length: columns ? 4 : 1}, () =>
              new Type(points * outputStride).fill(88)
            );
            const buffers = new ProjectionBuffer({
              projection,
              dimension: 4,
              inputStride,
              outputStride
            });
            const point = new Float64Array(4),
              result = new Float64Array(4),
              compact = new Type(points * 4);
            const operation = columns
              ? inverse
                ? buffers.unprojectColumnsTo.bind(buffers)
                : buffers.projectColumnsTo.bind(buffers)
              : inverse
                ? buffers.unprojectFlatTo.bind(buffers)
                : buffers.projectFlatTo.bind(buffers);
            const read = (row: number, j: number) =>
              input[columns ? j : 0][row * inputStride + (columns ? 0 : j)];
            const write = (row: number, j: number, value: number) => {
              output[columns ? j : 0][row * outputStride + (columns ? 0 : j)] = value;
            };
            const run = () => {
              if (mode === 0 || mode === 3) {
                const chunk = mode === 3 ? Math.min(points, 256) : points;
                for (let start = 0; start < points; start += chunk) {
                  const count = Math.min(chunk, points - start);
                  // Branch outside records so no per-point wrapper, array or closure is created.
                  if (columns)
                    (operation as typeof buffers.projectColumnsTo)(
                      input,
                      output,
                      count,
                      start,
                      epochs
                    );
                  else
                    (operation as typeof buffers.projectFlatTo)(
                      input[0],
                      output[0],
                      count,
                      start,
                      epochs
                    );
                }
              } else if (mode === 1) {
                for (let row = 0; row < points; row++) {
                  for (let j = 0; j < 4; j++) point[j] = read(row, j);
                  scalar(point, result, typeof epochs === 'number' ? epochs : epochs?.[row]);
                  for (let j = 0; j < 4; j++) write(row, j, result[j]);
                }
              } else {
                for (let row = 0; row < points; row++)
                  for (let j = 0; j < 4; j++) compact[row * 4 + j] = read(row, j);
                flat(compact, 4, epochs);
                for (let row = 0; row < points; row++)
                  for (let j = 0; j < 4; j++) write(row, j, compact[row * 4 + j]);
              }
            };
            const validate = () => {
              run();
              for (let row = 0; row < points; row++)
                for (let j = 0; j < 4; j++) {
                  const actual = output[columns ? j : 0][row * outputStride + (columns ? 0 : j)];
                  if (actual !== expected[row * 4 + j])
                    throw new Error('Layout benchmark mismatch ' + id);
                }
            };
            return {implementation: names[mode], run, validate};
          });
          jobs.push({
            scenario: id,
            precision: Type.name,
            direction: inverse ? 'unproject' : 'project',
            layout: columns ? 'columns' : 'interleaved',
            runners
          });
        }
  }
  return jobs;
}
