// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Shared original workload for Node, browser qualification and the live website.
import {
  BENCHMARK_SEED,
  IMPLEMENTATIONS,
  MIN_SAMPLE_MS,
  SAMPLE_COUNT,
  SCENARIOS
} from './live-bench-types';
import type {
  BenchmarkMeasurement,
  BenchmarkOptions,
  BenchmarkRow,
  BenchmarkScenario
} from './live-bench-types';

type Buffer = Float32Array | Float64Array;
type Converter = {
  project(point: number[]): number[];
  unproject(point: number[]): number[];
  projectFlat?(buffer: Buffer, dimension: number): Buffer;
  unprojectFlat?(buffer: Buffer, dimension: number): Buffer;
};
export type BenchmarkBackend = {prepare(scenario: BenchmarkScenario): () => Converter};
export type BenchmarkBackends = {typescript: BenchmarkBackend; proj4: BenchmarkBackend};
export type SamplingOptions = {samples?: number; minSampleMs?: number; now?: () => number};

export function validateOptions(options: BenchmarkOptions, sampling: SamplingOptions = {}) {
  if (
    !Number.isSafeInteger(options.points) ||
    options.points < 10 ||
    options.points > 1000000 ||
    !['Float32', 'Float64'].includes(options.precision) ||
    ![2, 3, 4].includes(options.dimension) ||
    !['project', 'unproject'].includes(options.direction) ||
    !['regional', 'clustered'].includes(options.distribution || 'regional') ||
    !Number.isSafeInteger(sampling.samples ?? SAMPLE_COUNT) ||
    (sampling.samples ?? SAMPLE_COUNT) < 3 ||
    (sampling.samples ?? SAMPLE_COUNT) > 31 ||
    !Number.isFinite(sampling.minSampleMs ?? MIN_SAMPLE_MS) ||
    (sampling.minSampleMs ?? MIN_SAMPLE_MS) < 0 ||
    (sampling.minSampleMs ?? MIN_SAMPLE_MS) > 100
  )
    throw new Error('Invalid benchmark options');
}

export function summarize(samples: number[], iterations = 1): BenchmarkMeasurement {
  const sorted = [...samples].sort((a, b) => a - b);
  const quantile = (fraction: number) => {
    const index = (sorted.length - 1) * fraction,
      low = Math.floor(index);
    return sorted[low] + (sorted[Math.ceil(index)] - sorted[low]) * (index - low);
  };
  return {
    milliseconds: quantile(0.5) / iterations,
    p10: quantile(0.1) / iterations,
    p90: quantile(0.9) / iterations,
    aggregateMilliseconds: quantile(0.5),
    samples
  };
}

/** Seeded coordinates cover each projection's useful region, away from singular boundaries. */
export function geographicPoints(scenario: BenchmarkScenario, options: BenchmarkOptions): Buffer {
  const ArrayType = options.precision === 'Float32' ? Float32Array : Float64Array;
  const result = new ArrayType(options.points * options.dimension);
  const [west, south, east, north] = scenario.bounds || [
    scenario.longitude - 4,
    scenario.latitude - 4,
    scenario.longitude + 4,
    Math.min(85, scenario.latitude + 4)
  ];
  let seed = BENCHMARK_SEED;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < options.points; i++) {
    let u = random(),
      v = random();
    if (options.distribution === 'clustered') {
      // Four repeatable dense regions, with independent small within-cluster jitter.
      u = 0.2 + (i % 2) * 0.5 + u * 0.1;
      v = 0.2 + (Math.floor(i / 2) % 2) * 0.5 + v * 0.1;
    }
    const offset = i * options.dimension;
    result[offset] = west + (east - west) * u;
    result[offset + 1] = south + (north - south) * v;
    const height = random() * 5000 - 200;
    if (options.dimension > 2) result[offset + 2] = height;
    if (options.dimension > 3) result[offset + 3] = i + 0.25;
  }
  return result;
}

export function scalarRunner(operation: (point: number[]) => number[], dimension: number) {
  const input = Array<number>(dimension).fill(0);
  return (buffer: Buffer) => {
    for (let offset = 0; offset < buffer.length; offset += dimension) {
      for (let axis = 0; axis < dimension; axis++) input[axis] = buffer[offset + axis];
      const output = operation(input);
      for (let axis = 0; axis < dimension; axis++) buffer[offset + axis] = output[axis];
    }
  };
}

export function prepareWorkload(
  backends: BenchmarkBackends,
  scenario: BenchmarkScenario,
  options: BenchmarkOptions
) {
  validateOptions(options);
  const {dimension, direction, precision} = options;
  const factories = [backends.typescript.prepare(scenario), backends.proj4.prepare(scenario)];
  const converters = factories.map(create => create());
  const source = geographicPoints(scenario, options);
  // Geographic samples are first encoded in the actual source CRS (including its axes).
  if (scenario.from && !scenario.grid) {
    const inputCRS = backends.proj4.prepare({...scenario, from: 'WGS84', to: scenario.from})();
    scalarRunner(inputCRS.project, dimension)(source);
  }
  if (direction === 'unproject') scalarRunner(converters[1].project, dimension)(source);
  const flat = converters[0][direction === 'project' ? 'projectFlat' : 'unprojectFlat'];
  if (!flat) throw new Error('TypeScript benchmark backend requires a flat transform');
  const runners = [
    (buffer: Buffer) => flat.call(converters[0], buffer, dimension),
    scalarRunner(converters[0][direction], dimension),
    scalarRunner(converters[1][direction], dimension)
  ];
  const reference = source.slice();
  runners[2](reference);
  const buffer = source.slice();
  for (const [index, run] of runners.entries()) {
    buffer.set(source);
    run(buffer);
    for (let i = 0; i < buffer.length; i++) {
      const tolerance = Math.max(
        i % dimension === 2
          ? 1e-4
          : direction === 'project'
            ? (scenario.forwardTolerance ?? 2e-5)
            : (scenario.inverseTolerance ?? 1e-8),
        precision === 'Float32' ? Math.abs(reference[i]) * 2e-7 : 0
      );
      if (
        !Number.isFinite(reference[i]) ||
        !Number.isFinite(buffer[i]) ||
        Math.abs(buffer[i] - reference[i]) > tolerance
      )
        throw new Error(
          `${scenario.name}: ${IMPLEMENTATIONS[index]} failed coordinate validation at ${i}: ${buffer[i]} vs ${reference[i]}`
        );
    }
  }
  return {source, runners, factories};
}

/** Time independent copies so resets stay outside timing, including adaptive sampling. */
export function measureWorkload(
  workload: ReturnType<typeof prepareWorkload>,
  options: BenchmarkOptions,
  sampling: SamplingOptions = {}
) {
  validateOptions(options, sampling);
  const samples = sampling.samples ?? SAMPLE_COUNT,
    minSampleMs = sampling.minSampleMs ?? MIN_SAMPLE_MS;
  const {source, runners} = workload;
  const now = sampling.now || (() => performance.now());
  // At most one million coordinates per aggregate, and at most 256 buffers.
  const maxIterations = Math.max(1, Math.min(256, Math.floor(1000000 / options.points)));
  const buffers = [source.slice()];
  const run = (index: number) => {
    for (const buffer of buffers) buffer.set(source);
    const start = now();
    for (const buffer of buffers) runners[index](buffer);
    return now() - start;
  };
  for (let warm = 0; warm < 3; warm++) runners.forEach((_, index) => run(index));
  let fastest = 0;
  for (;;) {
    fastest = Math.min(...runners.map((_, index) => run(index)));
    if (fastest >= minSampleMs || buffers.length >= maxIterations) break;
    const count = Math.min(
      maxIterations,
      buffers.length * Math.max(2, Math.min(8, Math.ceil(minSampleMs / Math.max(fastest, 0.1))))
    );
    while (buffers.length < count) buffers.push(source.slice());
  }
  const timings = runners.map(() => [] as number[]);
  let checksum = 0;
  for (let sample = 0; sample < samples; sample++) {
    for (let offset = 0; offset < runners.length; offset++) {
      const index = (sample + offset) % runners.length;
      timings[index].push(run(index));
      for (const buffer of buffers) checksum += buffer[0] + buffer[buffer.length - 1];
    }
  }
  if (!Number.isFinite(checksum)) throw new Error('Invalid benchmark checksum');
  const measurements = timings.map(times => summarize(times, buffers.length));
  return {
    measurements,
    iterations: buffers.length,
    timingLimited:
      minSampleMs === 0 ||
      measurements.some(
        m => m.aggregateMilliseconds < minSampleMs || m.aggregateMilliseconds === 0
      ),
    unstable: measurements.some(m => m.p90 - m.p10 > m.milliseconds * 0.25),
    checksum
  };
}

export function runBenchmark(
  backends: BenchmarkBackends,
  options: BenchmarkOptions,
  onRow: (row: BenchmarkRow) => void,
  sampling: SamplingOptions = {}
) {
  validateOptions(options, sampling);
  let checksum = 0;
  for (const scenario of SCENARIOS) {
    const result = measureWorkload(prepareWorkload(backends, scenario, options), options, sampling);
    checksum += result.checksum;
    onRow({
      name: scenario.name,
      measurements: result.measurements,
      iterations: result.iterations,
      timingLimited: result.timingLimited,
      unstable: result.unstable
    });
  }
  return {checksum};
}

export function measure(
  backends: BenchmarkBackends,
  settings: {
    points: number;
    samples: number;
    minSampleMs?: number;
    distribution?: BenchmarkOptions['distribution'];
  }
) {
  validateOptions(
    {...settings, precision: 'Float64', dimension: 2, direction: 'project'},
    settings
  );
  const rows: (BenchmarkRow & BenchmarkOptions)[] = [],
    construction = [];
  for (const scenario of SCENARIOS) {
    for (const [backend, api] of Object.entries(backends)) {
      const create = api.prepare(scenario),
        times = [];
      create();
      for (let sample = 0; sample < settings.samples; sample++) {
        const start = performance.now();
        for (let i = 0; i < 20; i++) create();
        times.push(((performance.now() - start) * 1000) / 20);
      }
      construction.push({
        name: scenario.name,
        backend,
        medianMicroseconds: summarize(times).milliseconds,
        samplesMicroseconds: times
      });
    }
  }
  let checksum = 0;
  for (const precision of ['Float32', 'Float64'] as const)
    for (const dimension of [2, 3, 4] as const)
      for (const direction of ['project', 'unproject'] as const) {
        const options = {
          points: settings.points,
          precision,
          dimension,
          direction,
          distribution: settings.distribution || ('regional' as const)
        };
        checksum += runBenchmark(
          backends,
          options,
          row => rows.push({...options, ...row}),
          settings
        ).checksum;
      }
  return {rows, construction, checksum, seed: BENCHMARK_SEED};
}
