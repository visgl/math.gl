// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original paired spheroid qualification; no speed thresholds or model data.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync, readdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {Session} from 'node:inspector/promises';
import {cpus, tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {bundleRuntime} from './benchmark-runtime.mjs';
const {values} = parseArgs({
  options: {
    'baseline-ref': {type: 'string', default: 'origin/master'},
    points: {type: 'string', default: '10000'},
    samples: {type: 'string', default: '7'},
    'min-sample-ms': {type: 'string', default: '4'},
    clock: {type: 'string', default: 'wall'},
    allocations: {type: 'boolean', default: false},
    output: {type: 'string'}
  }
});
assert(['wall', 'thread-cpu'].includes(values.clock), 'Unknown clock');
assert(
  values.clock !== 'thread-cpu' || process.threadCpuUsage,
  'thread-cpu requires Node 24.14 or later'
);
const now =
  values.clock === 'thread-cpu'
    ? () => {
        const t = process.threadCpuUsage();
        return (t.user + t.system) / 1000;
      }
    : () => performance.now();
const points = Number(values.points),
  settings = {
    points,
    samples: Number(values.samples),
    minSampleMs: Number(values['min-sample-ms']),
    now
  };
const options = {points, precision: 'Float64', dimension: 4, direction: 'project'};
const root = fileURLToPath(new URL('../../../', import.meta.url));
const baselineCommit = execFileSync(
  'git',
  ['rev-parse', '--verify', values['baseline-ref'] + '^{commit}'],
  {cwd: root, encoding: 'utf8'}
).trim();
function fingerprint() {
  const hash = createHash('sha256');
  function visit(path) {
    for (const entry of readdirSync(join(root, path), {withFileTypes: true}).sort((a, b) =>
      a.name.localeCompare(b.name)
    )) {
      const child = join(path, entry.name);
      if (entry.isDirectory()) visit(child);
      else hash.update(child + '\0').update(readFileSync(join(root, child)));
    }
  }
  for (const name of ['core', 'types', 'culling', 'crs', 'geospatial', 'projection'])
    visit('modules/' + name + '/src');
  return hash.digest('hex');
}
const entry = 'modules/projection/test/spheroid-benchmark-entry.ts';
const directory = mkdtempSync(join(tmpdir(), 'math-gl-spheroids-'));
const rows = [],
  jobs = [],
  allocations = [],
  construction = [];
const labels = ['geospatial scalar output', 'projection scalar output', 'projection flat'];
try {
  const engines = [];
  for (const [index, ref] of [baselineCommit, undefined].entries()) {
    const outfile = join(directory, index ? 'candidate.mjs' : 'baseline.mjs');
    await bundleRuntime(root, entry, outfile, ref);
    engines.push(await import(pathToFileURL(outfile).href));
  }
  for (const shape of engines[1].shapes) {
    const factories = engines.flatMap((engine) => engine.factories(shape));
    const samples = factories.map(() => []);
    let sink;
    for (const create of factories) sink = create();
    for (let sample = 0; sample < settings.samples; sample++) {
      for (let offset = 0; offset < factories.length; offset++) {
        const index = (sample + offset) % factories.length;
        const start = now();
        for (let i = 0; i < 20; i++) sink = factories[index]();
        samples[index].push(((now() - start) * 1000) / 20);
      }
    }
    assert(sink, 'Construction must produce a public instance');
    construction.push(
      ...samples.map((times, index) => ({
        shape: shape.id,
        implementation: index % 2 ? 'projection engine' : 'geospatial ellipsoid',
        revision: index < 2 ? 'baseline' : 'candidate',
        medianMicroseconds: [...times].sort((a, b) => a - b)[Math.floor(times.length / 2)],
        samplesMicroseconds: times,
        instancesPerAggregate: 20
      }))
    );
  }
  for (const shape of engines[1].shapes)
    for (const polar of [false, true])
      for (const inverse of [false, true]) {
        const {buffer: source, expected} = engines[1].source(shape, polar, inverse, points);
        const runs = engines.flatMap((engine) => engine.runners(shape, inverse));
        const id = {
          shape: shape.id,
          region: polar ? 'near poles' : 'regional',
          direction: inverse ? 'inverse' : 'forward'
        };
        const errors = runs.map((run, index) => {
          const output = source.slice();
          run(output);
          const maxima = [0, 0, 0];
          for (let offset = 0; offset < output.length; offset++) {
            const axis = offset % 4;
            assert(Number.isFinite(output[offset]), 'Non-finite benchmark result');
            if (axis === 3) {
              assert.equal(output[offset], expected[offset]);
              continue;
            }
            const error =
              inverse && axis === 0
                ? Math.abs(((output[offset] - expected[offset] + 540) % 360) - 180)
                : Math.abs(output[offset] - expected[offset]);
            maxima[axis] = Math.max(maxima[axis], error);
            // Baseline surface-normal asin loses near-pole latitude digits; retain the measured error.
            const tolerance =
              inverse && axis < 2 ? (index === 0 && polar && axis === 1 ? 1e-6 : 1e-9) : 1e-5;
            assert(
              error <= tolerance,
              `${JSON.stringify(id)} runner ${index} ordinate ${axis}: ${error}`
            );
          }
          return maxima;
        });
        const measured = engines[1].measureWorkload(
          {source, runners: runs, factories: []},
          options,
          settings
        );
        rows.push({
          ...id,
          ...measured,
          measurements: measured.measurements.map((m, index) => ({
            ...m,
            implementation: labels[index % 3],
            revision: index < 3 ? 'baseline' : 'candidate',
            maxAbsoluteErrors: errors[index]
          })),
          speedups: labels.map((implementation, index) => ({
            implementation,
            ratio:
              measured.measurements[index].milliseconds /
              measured.measurements[index + 3].milliseconds
          }))
        });
        if (values.allocations) jobs.push({id, source, runs});
      }
  if (values.allocations) {
    const session = new Session();
    session.connect();
    try {
      for (const {id, source, runs} of jobs)
        for (const [index, run] of runs.entries()) {
          const output = source.slice();
          await session.post('HeapProfiler.startSampling', {
            samplingInterval: 4096,
            includeObjectsCollectedByMajorGC: true,
            includeObjectsCollectedByMinorGC: true
          });
          let profile;
          try {
            for (let repeat = 0; repeat < 10; repeat++) {
              output.set(source);
              run(output);
            }
          } finally {
            ({profile} = await session.post('HeapProfiler.stopSampling'));
          }
          const sum = (node) =>
            node.selfSize + node.children.reduce((total, child) => total + sum(child), 0);
          allocations.push({
            ...id,
            implementation: labels[index % 3],
            revision: index < 3 ? 'baseline' : 'candidate',
            points: points * 10,
            sampledEstimatedBytesPerPoint: sum(profile.head) / (points * 10),
            sampleCount: profile.samples.length
          });
        }
    } finally {
      session.disconnect();
    }
  }
  const report = {
    schemaVersion: 1,
    metadata: {
      baselineCommit,
      candidateSourceSHA256: fingerprint(),
      workloadSHA256: createHash('sha256')
        .update(readFileSync(join(root, entry)))
        .digest('hex'),
      date: new Date().toISOString(),
      node: process.version,
      v8: process.versions.v8,
      cpu: cpus()[0]?.model,
      platform: process.platform,
      arch: process.arch,
      clock: values.clock,
      points,
      samples: settings.samples,
      minSampleMs: settings.minSampleMs,
      allocations: values.allocations
    },
    methodology:
      'Identical current workload and source bundler for historical/candidate runtime sources. Independently authored unit-normal support points qualify every coordinate before timing; baseline geospatial near-pole latitude uses its explicitly recorded 1e-6 degree allowance, candidate and projection use 1e-9 degrees, Cartesian/height use 1e-5 metres. Float64 XYZM; regional/near-pole, both directions, WGS84/sphere/flattened spheroid. Instances and reused scalar input/output arrays are prepared outside timing. Adaptive aggregates, rotated execution order and reset copies outside timing; retained raw samples and spread/aggregate flags. Coordinate timing excludes setup/loading, input generation and validation. Separate construction samples time complete public factories in rotated order, 20 instances per aggregate; construction includes owned snapshots and CRS parsing, excludes module loading, and is diagnostic. Separate heap samples after ALL timing include collected allocations; zero is not an allocation proof. Thread CPU is diagnostic rather than elapsed throughput. No universal accuracy or speed claim.',
    rows,
    construction,
    allocations
  };
  console.table(
    rows.flatMap((row) =>
      row.speedups.map((speedup) => ({
        shape: row.shape,
        region: row.region,
        direction: row.direction,
        ...speedup,
        unstable: row.unstable,
        timingLimited: row.timingLimited
      }))
    )
  );
  if (values.output) writeFileSync(values.output, JSON.stringify(report, null, 2) + '\n');
} finally {
  rmSync(directory, {recursive: true, force: true});
}
