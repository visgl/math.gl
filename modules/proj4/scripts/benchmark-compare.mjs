// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Paired, alternating before/after measurements without changing the working tree.
import {bundleRuntime} from './benchmark-runtime.mjs';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {tmpdir, cpus} from 'node:os';
import {parseArgs} from 'node:util';
import {codeFingerprint, benchmarkFingerprint} from './benchmark-metadata.mjs';
import {loadBenchmark} from './load-benchmark.mjs';
const {values} = parseArgs({
  options: {
    'baseline-ref': {type: 'string', default: 'origin/master'},
    points: {type: 'string', default: '50000'},
    samples: {type: 'string', default: '11'},
    'min-sample-ms': {type: 'string', default: '12'},
    output: {type: 'string'},
    scenarios: {type: 'string'},
    clock: {type: 'string', default: 'wall'}
  }
});
const root = fileURLToPath(new URL('../../../', import.meta.url));
const baselineCommit = execFileSync(
  'git',
  ['rev-parse', '--verify', values['baseline-ref'] + '^{commit}'],
  {cwd: root, encoding: 'utf8'}
).trim();
const directory = mkdtempSync(join(tmpdir(), 'math-gl-projection-compare-'));
const {
  prepareWorkload,
  measureWorkload,
  summarize,
  validateOptions,
  backends,
  SCENARIOS,
  benchmarkGrid
} = await loadBenchmark();
if (!['wall', 'thread-cpu'].includes(values.clock)) throw new Error('Unknown clock');
const now =
  values.clock === 'thread-cpu'
    ? () => {
        const t = process.threadCpuUsage();
        return (t.user + t.system) / 1000;
      }
    : () => performance.now();
const settings = {
  now,
  points: Number(values.points),
  samples: Number(values.samples),
  minSampleMs: Number(values['min-sample-ms'])
};
validateOptions({...settings, precision: 'Float64', dimension: 2, direction: 'project'}, settings);
const scenarios = values.scenarios
  ? SCENARIOS.filter(row => values.scenarios.split(',').includes(row.name))
  : SCENARIOS;
if (
  !scenarios.length ||
  (values.scenarios &&
    values.scenarios.split(',').some(name => !SCENARIOS.some(row => row.name === name)))
)
  throw new Error('Unknown scenario');
const results = [],
  construction = [];
try {
  const engines = [];
  for (const baseline of [true, false]) {
    const outfile = join(directory, baseline ? 'baseline.mjs' : 'candidate.mjs');
    await bundleRuntime(
      root,
      'modules/proj4/src/lib/typescript-proj4-projection.ts',
      outfile,
      baseline ? baselineCommit : undefined
    );
    const {Projection} = await import(pathToFileURL(outfile).href);
    Projection.registerDatumGrid('benchmark-grid', benchmarkGrid());
    engines.push({
      prepare: scenario => () =>
        new Projection({from: scenario.from || 'WGS84', to: scenario.to, enforceAxis: true})
    });
  }
  for (const scenario of scenarios) {
    const factories = engines.map(engine => engine.prepare(scenario));
    factories.forEach(create => {
      for (let i = 0; i < 20; i++) create();
    });
    const times = [[], []];
    for (let sample = 0; sample < settings.samples; sample++)
      for (let j = 0; j < 2; j++) {
        const index = (sample + j) % 2,
          start = now();
        for (let i = 0; i < 100; i++) factories[index]();
        times[index].push((now() - start) * 10);
      }
    construction.push({
      name: scenario.name,
      baselineMicroseconds: summarize(times[0]).milliseconds,
      candidateMicroseconds: summarize(times[1]).milliseconds,
      samplesMicroseconds: times
    });
    for (const precision of ['Float64', 'Float32'])
      for (const dimension of [2, 4])
        for (const direction of ['project', 'unproject']) {
          const options = {...settings, precision, dimension, direction, distribution: 'regional'};
          const workloads = engines.map(typescript =>
            prepareWorkload({typescript, proj4: backends.proj4}, scenario, options)
          );
          const source = workloads[0].source;
          const runners = [
            workloads[0].runners[0],
            workloads[1].runners[0],
            workloads[0].runners[1],
            workloads[1].runners[1]
          ];
          // Both versions have independently passed all-coordinate validation against proj4js.
          const row = measureWorkload({source, runners, factories: []}, options, settings);
          results.push({
            name: scenario.name,
            ...options,
            ...row,
            flatSpeedup: row.measurements[0].milliseconds / row.measurements[1].milliseconds,
            scalarSpeedup: row.measurements[2].milliseconds / row.measurements[3].milliseconds
          });
        }
  }
} finally {
  rmSync(directory, {recursive: true, force: true});
}
const report = {
  schemaVersion: 2,
  metadata: {
    baselineCommit,
    candidateSourceSHA256: codeFingerprint(),
    workloadSHA256: benchmarkFingerprint(),
    node: process.version,
    v8: process.versions.v8,
    cpu: cpus()[0]?.model,
    platform: process.platform,
    arch: process.arch,
    date: new Date().toISOString(),
    clock: values.clock,
    ...settings
  },
  methodology:
    'Same source bundler and dependencies; baseline runtime sources read from Git. Shared seeded workload, all-coordinate proj4js validation, adaptive samples and rotated runner order. Measurement order: baseline flat, candidate flat, baseline scalar, candidate scalar. Constructor order alternates separately. Speedups are local observations; p10/p90 ranges describe sample variation.',
  construction,
  results
};
console.table(
  results
    .filter(r => r.precision === 'Float64')
    .map(r => ({
      name: r.name,
      dimension: r.dimension,
      direction: r.direction,
      flat: +r.flatSpeedup.toFixed(2),
      scalar: +r.scalarSpeedup.toFixed(2)
    }))
);
console.table(
  construction.map(row => ({
    name: row.name,
    speedup: +(row.baselineMicroseconds / row.candidateMicroseconds).toFixed(2)
  }))
);
if (values.output) writeFileSync(values.output, JSON.stringify(report, null, 2) + '\n');
