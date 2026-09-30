// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original browser benchmark; proj4js supplies the independent comparison path.
import proj4 from 'proj4';
import proj4Metadata from 'proj4/package.json';
import {Proj4Projection as TypeScriptProjection} from '@math.gl/proj4';
import {Proj4Projection as ClassicProjection} from '@math.gl/proj4/classic';

import {IMPLEMENTATIONS, SAMPLE_COUNT, SCENARIOS} from './live-bench-types';
import type {BenchmarkOptions, BenchmarkRow} from './live-bench-types';

/** Same warmed workload in every contender; construction and buffer resets are untimed. */
export function runLiveBenchmark(options: BenchmarkOptions, onRow: (row: BenchmarkRow) => void) {
  const {points, precision, dimension, direction} = options;
  if (
    !Number.isInteger(points) ||
    points < 10 ||
    points > 50000 ||
    !['Float32', 'Float64'].includes(precision) ||
    ![2, 3, 4].includes(dimension) ||
    !['project', 'unproject'].includes(direction)
  )
    throw new Error('Invalid benchmark options');
  const ArrayType = precision === 'Float32' ? Float32Array : Float64Array;
  let checksum = 0;
  for (const scenario of SCENARIOS) {
    const typescript = new TypeScriptProjection({to: scenario.to});
    const classic = new ClassicProjection({to: scenario.to});
    const direct = proj4('WGS84', scenario.to);
    const source = new ArrayType(points * dimension);
    const buffer = new ArrayType(source.length);
    for (let i = 0; i < points; i++) {
      let coordinate = [scenario.longitude + (i % 100) / 100, scenario.latitude + (i % 71) / 100];
      if (dimension > 2) coordinate.push(123);
      if (dimension > 3) coordinate.push(7);
      if (direction === 'unproject') coordinate = direct.forward(coordinate);
      source.set(coordinate, i * dimension);
    }
    const scalar = (project: (point: number[]) => number[]) => {
      const input = new Array<number>(dimension);
      return () => {
        for (let offset = 0; offset < buffer.length; offset += dimension) {
          for (let axis = 0; axis < dimension; axis++) input[axis] = buffer[offset + axis];
          const output = project(input);
          for (let axis = 0; axis < dimension; axis++) buffer[offset + axis] = output[axis];
        }
      };
    };
    const runners = [
      () =>
        typescript[direction === 'project' ? 'projectFlat' : 'unprojectFlat'](buffer, dimension),
      scalar(typescript[direction]),
      scalar(classic[direction]),
      scalar(direction === 'project' ? direct.forward : direct.inverse)
    ];
    buffer.set(source);
    runners[3]();
    const reference = buffer.slice();
    for (const [index, run] of runners.entries()) {
      buffer.set(source);
      run();
      for (let i = 0; i < buffer.length; i++) {
        const tolerance = Math.max(
          direction === 'project' ? 2e-5 : 1e-8,
          precision === 'Float32' ? Math.abs(reference[i]) * 2e-7 : 0
        );
        if (!Number.isFinite(buffer[i]) || Math.abs(buffer[i] - reference[i]) > tolerance)
          throw new Error(
            `${scenario.name}: ${IMPLEMENTATIONS[index]} failed coordinate validation`
          );
      }
      for (let warmup = 0; warmup < 3; warmup++) {
        buffer.set(source);
        run();
      }
    }
    const timings = runners.map(() => [] as number[]);
    for (let sample = 0; sample < SAMPLE_COUNT; sample++) {
      for (let offset = 0; offset < runners.length; offset++) {
        const index = (sample + offset) % runners.length;
        buffer.set(source);
        const start = performance.now();
        runners[index]();
        timings[index].push(performance.now() - start);
        checksum += buffer[0] + buffer[buffer.length - 1];
      }
    }
    onRow({
      name: scenario.name,
      measurements: timings.map(samples => ({
        milliseconds: [...samples].sort((a, b) => a - b)[Math.floor(samples.length / 2)],
        samples
      }))
    });
  }
  if (!Number.isFinite(checksum)) throw new Error('Invalid benchmark checksum');
  return {checksum, proj4Version: proj4Metadata.version};
}
