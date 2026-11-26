// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import * as typescript from './benchmark-typescript';
import * as proj4 from './benchmark-proj4';
export const backends = {typescript, proj4};
export {
  validateOptions,
  summarize,
  geographicPoints,
  scalarRunner,
  prepareWorkload,
  measureWorkload,
  runBenchmark,
  measure
} from './benchmark-workload';
export type {BenchmarkBackend, BenchmarkBackends, SamplingOptions} from './benchmark-workload';
export {
  IMPLEMENTATIONS,
  SAMPLE_COUNT,
  BENCHMARK_SEED,
  MIN_SAMPLE_MS,
  SCENARIOS
} from './live-bench-types';
export type {
  BenchmarkOptions,
  BenchmarkMeasurement,
  BenchmarkRow,
  BenchmarkScenario
} from './live-bench-types';
export {benchmarkGrid} from './benchmark-grid';

export {scalarResultRunner} from './benchmark-scalar-results';
