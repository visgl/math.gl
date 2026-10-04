// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original paired layout timing and sampled allocation diagnostics; no speed gates.
import assert from 'node:assert/strict';
import {readFileSync, mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir, cpus} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {Session} from 'node:inspector/promises';
import {createHash} from 'node:crypto';
import {bundleRuntime} from './benchmark-runtime.mjs';
import {codeFingerprint} from './benchmark-metadata.mjs';
const {values} = parseArgs({
  options: {
    points: {type: 'string', default: '1000'},
    samples: {type: 'string', default: '7'},
    'min-sample-ms': {type: 'string', default: '4'},
    allocations: {type: 'boolean', default: false},
    output: {type: 'string'}
  }
});
const points = Number(values.points),
  samples = Number(values.samples),
  minimum = Number(values['min-sample-ms']);
assert(Number.isSafeInteger(points) && points > 0 && points <= 1000000);
assert(Number.isSafeInteger(samples) && samples >= 3 && samples <= 101);
assert(Number.isFinite(minimum) && minimum >= 0 && minimum <= 1000);
const now = () => {
  const time = process.threadCpuUsage();
  return (time.user + time.system) / 1000;
};
assert(process.threadCpuUsage, 'Requires Node 24.14 or later');
const root = fileURLToPath(new URL('../../../', import.meta.url));
const directory = mkdtempSync(join(tmpdir(), 'math-gl-bulk-layouts-'));
const rows = [],
  allocations = [];
let qualification;
const horizontal = readFileSync(
  new URL('../test/fixtures/real-grids/BETA2007.gsb', import.meta.url)
);
try {
  const outfile = join(directory, 'workload.mjs');
  await bundleRuntime(root, 'modules/projection/test/bulk-benchmark-workload.ts', outfile);
  const workload = await import(pathToFileURL(outfile).href);
  qualification = workload.qualifyBulkLayouts();
  const jobs = workload.bulkBenchmarkJobs(new Uint8Array(horizontal).buffer, points);
  // Exercise heterogeneous call shapes before both timings and heap sampling.
  for (let warm = 0; warm < 3; warm++)
    for (const job of jobs) for (const runner of job.runners) runner.validate();
  for (const job of jobs) {
    const measurements = job.runners.map(() => []);
    let iterations = 1;
    for (;;) {
      const start = now();
      for (let i = 0; i < iterations; i++) job.runners[0].run();
      if (now() - start >= minimum || iterations >= 32768) break;
      iterations *= 2;
    }
    for (let sample = 0; sample < samples; sample++)
      for (let order = 0; order < job.runners.length; order++) {
        const index = (sample + order) % job.runners.length,
          start = now();
        for (let i = 0; i < iterations; i++) job.runners[index].run();
        measurements[index].push((now() - start) / iterations);
      }
    const {runners, ...profile} = job;
    runners.forEach((runner, index) => {
      const sorted = measurements[index].slice().sort((a, b) => a - b),
        median = sorted[Math.floor(sorted.length / 2)];
      rows.push({
        ...profile,
        implementation: runner.implementation,
        iterations,
        medianCpuMs: median,
        p10CpuMs: sorted[Math.floor((samples - 1) * 0.1)],
        p90CpuMs: sorted[Math.floor((samples - 1) * 0.9)],
        millionPointsPerCpuSecond: points / median / 1000,
        spreadRatio: sorted.at(-1) / sorted[0],
        rawCpuMs: measurements[index]
      });
    });
  }
  if (values.allocations) {
    const profiler = new Session();
    profiler.connect();
    try {
      for (const job of jobs)
        for (const runner of job.runners) {
          await profiler.post('HeapProfiler.startSampling', {
            samplingInterval: 4096,
            includeObjectsCollectedByMajorGC: true,
            includeObjectsCollectedByMinorGC: true
          });
          for (let i = 0; i < 20; i++) runner.run();
          const {profile} = await profiler.post('HeapProfiler.stopSampling');
          const sum = node =>
            node.selfSize + node.children.reduce((total, child) => total + sum(child), 0);
          const {runners, ...layout} = job;
          allocations.push({
            ...layout,
            implementation: runner.implementation,
            sampleCount: profile.samples.length,
            sampledEstimatedBytesPerPoint: sum(profile.head) / (points * 20)
          });
        }
    } finally {
      profiler.disconnect();
    }
  }
} finally {
  rmSync(directory, {recursive: true, force: true});
}
const report = {
  schemaVersion: 1,
  metadata: {
    date: new Date().toISOString(),
    node: process.version,
    v8: process.versions.v8,
    cpu: cpus()[0]?.model,
    platform: process.platform,
    arch: process.arch,
    clock: 'thread-cpu',
    points,
    samples,
    minSampleMs: minimum,
    sourceSHA256: codeFingerprint(),
    workloadSHA256: createHash('sha256')
      .update(readFileSync(new URL('../test/bulk-benchmark-workload.ts', import.meta.url)))
      .digest('hex'),
    gridSHA256: createHash('sha256').update(horizontal).digest('hex')
  },
  qualification,
  methodology:
    'Prepared reusable XYZM storage, five independently qualified mixed pipelines, both directions/precisions and interleaved/column layouts. All gather, transform, scatter and chunk-call costs are timed; generation/setup are excluded. Exact rounded equality precedes timing. Reusable scalar and reusable compact-flat comparators allocate their scratch once. Three rounds of all heterogeneous workloads precede rotated CPU samples. Heap estimates are sampled in a separate pass after all timings; zero is not proof of zero allocation. CPU time is diagnostic, not wall-clock throughput. No universal speed or allocation claims.',
  rows,
  allocations
};
console.table(
  rows
    .filter(row => row.precision === 'Float64Array' && row.direction === 'project')
    .map(({scenario, layout, implementation, millionPointsPerCpuSecond, spreadRatio}) => ({
      scenario,
      layout,
      implementation,
      millionPointsPerCpuSecond,
      spreadRatio
    }))
);
if (values.output) writeFileSync(values.output, JSON.stringify(report, null, 2) + '\n');
