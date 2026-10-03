// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Paired pipeline measurements; no runtime mutation, implicit downloads or speed gates.
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {Session} from 'node:inspector/promises';
import {cpus, tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {bundleRuntime} from './benchmark-runtime.mjs';
import {codeFingerprint, benchmarkFingerprint} from './benchmark-metadata.mjs';

const {values} = parseArgs({
  options: {
    'baseline-ref': {type: 'string', default: 'origin/master'},
    points: {type: 'string', default: '20000'},
    samples: {type: 'string', default: '11'},
    'min-sample-ms': {type: 'string', default: '12'},
    clock: {type: 'string', default: 'wall'},
    scenarios: {type: 'string'},
    allocations: {type: 'boolean', default: false},
    'reusable-results': {type: 'boolean', default: false},
    output: {type: 'string'}
  }
});
if (!['wall', 'thread-cpu'].includes(values.clock)) throw new Error('Unknown clock');
if (values.clock === 'thread-cpu' && !process.threadCpuUsage)
  throw new Error('thread-cpu requires Node 24.14 or later');
const now =
  values.clock === 'thread-cpu'
    ? () => {
        const t = process.threadCpuUsage();
        return (t.user + t.system) / 1000;
      }
    : () => performance.now();
const settings = {
  points: Number(values.points),
  samples: Number(values.samples),
  minSampleMs: Number(values['min-sample-ms'])
};
const root = fileURLToPath(new URL('../../../', import.meta.url));
const baselineCommit = execFileSync(
  'git',
  ['rev-parse', '--verify', values['baseline-ref'] + '^{commit}'],
  {cwd: root, encoding: 'utf8'}
).trim();
const horizontalBytes = readFileSync(
  new URL('../test/fixtures/real-grids/BETA2007.gsb', import.meta.url)
);
const horizontal = new Uint8Array(horizontalBytes).buffer;
const directory = mkdtempSync(join(tmpdir(), 'math-gl-pipeline-compare-'));
const rows = [],
  allocations = [];
let classicVersion, seed, candidateSourceSHA256, workloadSHA256;
try {
  const engines = [];
  for (const baseline of [true, false]) {
    const outfile = join(directory, baseline ? 'baseline.mjs' : 'candidate.mjs');
    await bundleRuntime(
      root,
      'modules/projection/test/pipeline-benchmark-entry.ts',
      outfile,
      baseline ? baselineCommit : undefined
    );
    engines.push(await import(pathToFileURL(outfile).href));
  }
  const harness = engines[1];
  classicVersion = harness.proj4Metadata.version;
  seed = harness.BENCHMARK_SEED;
  candidateSourceSHA256 = codeFingerprint();
  workloadSHA256 = benchmarkFingerprint();
  harness.validateOptions(
    {...settings, precision: 'Float64', dimension: 4, direction: 'project'},
    settings
  );
  const requested = values.scenarios?.split(',');
  const scenarios = requested
    ? harness.PIPELINE_SCENARIOS.filter(row => requested.includes(row.id))
    : harness.PIPELINE_SCENARIOS;
  if (
    !scenarios.length ||
    requested?.some(id => !harness.PIPELINE_SCENARIOS.some(row => row.id === id))
  )
    throw new Error('Unknown pipeline scenario');
  const allocationJobs = [];
  const profiler = values.allocations ? new Session() : undefined;
  try {
    for (const scenario of scenarios) {
      // Independently generated PROJ anchors qualify both runtimes before timing.
      const pipelines = engines.map(engine =>
        engine.qualifyBenchmarkPipeline(engine, scenario, horizontal)
      );
      const classic = scenario.classic
        ? harness.proj4(scenario.classic.from, scenario.classic.to)
        : undefined;
      for (const precision of ['Float64', 'Float32'])
        for (const dimension of [3, 4])
          for (const direction of ['project', 'unproject']) {
            const options = {...settings, precision, dimension, direction};
            const {source, epochs} = harness.pipelineBenchmarkSource(scenario, options);
            if (direction === 'unproject')
              harness.pipelineScalarRunner(
                pipelines[0],
                {...options, direction: 'project'},
                epochs
              )(source);
            const scalar = pipelines.map(pipeline =>
              harness.pipelineScalarRunner(pipeline, options, epochs)
            );
            const flat = pipelines.map(pipeline => buffer => {
              const operation =
                direction === 'project' ? pipeline.projectFlatSync : pipeline.unprojectFlatSync;
              if (operation(buffer, dimension, epochs) !== buffer)
                throw new Error('Pipeline must return its input buffer');
            });
            const runners = [flat[0], flat[1], scalar[0], scalar[1]];
            const implementations = [
              'baseline flat',
              'math.gl flat',
              'baseline scalar',
              'math.gl scalar'
            ];
            if (values['reusable-results']) {
              const operation = direction === 'project' ? pipelines[1].projectToSync : pipelines[1].unprojectToSync;
              if (!operation) throw new Error('Candidate requires reusable scalar result APIs');
              for (const typed of [false, true]) {
                runners.push(harness.scalarResultRunner(operation, options, typed, epochs));
                implementations.push(typed ? 'math.gl scalar typed output' : 'math.gl scalar array output');
              }
            }
            const expected = source.slice();
            scalar[0](expected);
            const savedEpochs = typeof epochs === 'number' || !epochs ? epochs : epochs.slice();
            for (const run of runners)
              harness.validatePipelineRunner(source, expected, run, dimension);
            if (classic) {
              const run = harness.scalarRunner(
                point => classic[direction === 'project' ? 'forward' : 'inverse'](point, true),
                dimension
              );
              harness.validatePipelineRunner(source, expected, run, dimension, 1e-4);
              runners.push(run);
              implementations.push('proj4js ' + classicVersion);
            }
            const result = harness.measureWorkload({source, runners, factories: []}, options, {
              ...settings,
              now
            });
            if (typeof epochs !== 'number' && epochs?.some((value, i) => value !== savedEpochs[i]))
              throw new Error('Pipeline modified the epoch buffer');
            const ratio = (a, b) => (b > 0 && a > 0 ? a / b : null);
            rows.push({
              id: scenario.id,
              fixture: scenario.fixture,
              epochMode: scenario.epoch || 'static',
              precision,
              dimension,
              direction,
              implementations,
              ...result,
              flatSpeedup: ratio(
                result.measurements[0].milliseconds,
                result.measurements[1].milliseconds
              ),
              scalarSpeedup: ratio(
                result.measurements[2].milliseconds,
                result.measurements[3].milliseconds
              ),
              arrayOutputSpeedup: values['reusable-results'] ? ratio(result.measurements[3].milliseconds, result.measurements[4].milliseconds) : undefined,
              typedOutputSpeedup: values['reusable-results'] ? ratio(result.measurements[3].milliseconds, result.measurements[5].milliseconds) : undefined
            });
            if (profiler && precision === 'Float64' && dimension === 4 && direction === 'project')
              allocationJobs.push({id: scenario.id, source, runners, implementations});
          }
    }
    // Profiling can change V8 optimization state. Finish ALL timing before
    // connecting the inspector and running any allocation samples.
    profiler?.connect();
    for (const {id, source, runners, implementations} of allocationJobs) {
      const buffer = source.slice();
      for (const [index, run] of runners.entries()) {
        await profiler.post('HeapProfiler.startSampling', {
          samplingInterval: 4096,
          includeObjectsCollectedByMajorGC: true,
          includeObjectsCollectedByMinorGC: true
        });
        let profile;
        try {
          for (let i = 0; i < 10; i++) {
            buffer.set(source);
            run(buffer);
          }
        } finally {
          ({profile} = await profiler.post('HeapProfiler.stopSampling'));
        }
        const sum = node =>
          node.selfSize + node.children.reduce((total, child) => total + sum(child), 0);
        allocations.push({
          id,
          implementation: implementations[index],
          points: settings.points * 10,
          sampledEstimatedBytesPerPoint: sum(profile.head) / (settings.points * 10),
          sampleCount: profile.samples.length
        });
      }
    }
  } finally {
    profiler?.disconnect();
  }
} finally {
  rmSync(directory, {recursive: true, force: true});
}
const report = {
  schemaVersion: 2,
  metadata: {
    baselineCommit,
    candidateSourceSHA256,
    workloadSHA256,
    horizontalGridSHA256: createHash('sha256').update(horizontalBytes).digest('hex'),
    date: new Date().toISOString(),
    node: process.version,
    v8: process.versions.v8,
    cpu: cpus()[0]?.model,
    platform: process.platform,
    arch: process.arch,
    clock: values.clock,
    proj4js: classicVersion,
    reusableResults: values['reusable-results'],
    seed,
    ...settings
  },
  methodology:
    'Identical source bundler and installed dependencies; historical runtime sources read from Git. Independent PROJ anchors and all-coordinate baseline/candidate validation precede timing. Seeded bounded jitter, both precisions, XYZ/XYZM, both directions, static/batch/mixed epochs. Direct proj4js only for equivalent supported CRS pairs, at an absolute 1e-4 output-unit tolerance; it does not implement typed pipelines or kinematic epochs. Optional reusable-result rows compare current array/typed outputs with the current owned-array scalar API, reusing both input and result without per-record subarrays. Prepared instances, independent copies, resets outside timing, adaptive samples and rotated execution order. Median/p10/p90 are per-buffer; raw samples are aggregate milliseconds. Thread CPU time is diagnostic, not elapsed throughput. Allocation estimates are sampled after all timing in a separate untimed run; zero is not proof of zero allocation. No speed thresholds.',
  rows,
  allocations
};
console.table(
  rows
    .filter(row => row.precision === 'Float64' && row.direction === 'project')
    .map(row => ({
      case: row.id,
      dimension: row.dimension,
      flat: row.flatSpeedup?.toFixed(2),
      scalar: row.scalarSpeedup?.toFixed(2),
      iterations: row.iterations,
      unstable: row.unstable
    }))
);
if (values.allocations) console.table(allocations);
if (values.output) writeFileSync(values.output, JSON.stringify(report, null, 2) + '\n');
