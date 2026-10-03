// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import proj4Metadata from 'proj4/package.json';
import * as typescript from './benchmark-typescript';
import * as proj4 from './benchmark-proj4';
import {runBenchmark} from './benchmark-workload';
import {BENCHMARK_SEED} from './live-bench-types';
import type {BenchmarkOptions, BenchmarkRow} from './live-bench-types';
import type {SamplingOptions} from './benchmark-workload';

export function runLiveBenchmark(
  options: BenchmarkOptions,
  onRow: (row: BenchmarkRow) => void,
  sampling: SamplingOptions = {}
) {
  const summary = runBenchmark({typescript, proj4}, options, onRow, sampling);
  return {
    ...summary,
    proj4Version: proj4Metadata.version,
    seed: BENCHMARK_SEED,
    date: new Date().toISOString()
  };
}
