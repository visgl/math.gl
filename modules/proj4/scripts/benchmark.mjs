// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Run after building proj4. Same cases, seeded inputs and sampling as the live page.
import {codeFingerprint, benchmarkFingerprint} from './benchmark-metadata.mjs';
import {loadBenchmark} from './load-benchmark.mjs';
import {writeFileSync} from 'node:fs';
import {cpus} from 'node:os';
import {Session} from 'node:inspector/promises';
import {parseArgs} from 'node:util';
const {values} = parseArgs({
  options: {
    points: {type: 'string', default: '50000'},
    samples: {type: 'string', default: '7'},
    'min-sample-ms': {type: 'string', default: '12'},
    distribution: {type: 'string', default: 'regional'},
    output: {type: 'string'},
    allocations: {type: 'boolean', default: false}
  }
});
const harness = await loadBenchmark();
const {measure, prepareWorkload, backends, SCENARIOS, IMPLEMENTATIONS, validateOptions} = harness;
const settings = {
  points: Number(values.points),
  samples: Number(values.samples),
  minSampleMs: Number(values['min-sample-ms']),
  distribution: values.distribution
};
validateOptions({...settings, precision: 'Float64', dimension: 2, direction: 'project'}, settings);
const warm = measure(backends, settings);
const allocations = [];
if (values.allocations) {
  const session = new Session();
  session.connect();
  try {
    for (const scenario of SCENARIOS)
      for (const dimension of [2, 4]) {
        const options = {...settings, precision: 'Float64', dimension, direction: 'project'};
        const {source, runners} = prepareWorkload(backends, scenario, options);
        const buffer = source.slice();
        for (const [index, run] of runners.entries()) {
          await session.post('HeapProfiler.startSampling', {
            samplingInterval: 4096,
            includeObjectsCollectedByMajorGC: true,
            includeObjectsCollectedByMinorGC: true
          });
          for (let i = 0; i < 10; i++) {
            buffer.set(source);
            run(buffer);
          }
          const {profile} = await session.post('HeapProfiler.stopSampling');
          const sum = node =>
            node.selfSize + node.children.reduce((total, child) => total + sum(child), 0);
          allocations.push({
            case: scenario.name,
            dimension,
            implementation: IMPLEMENTATIONS[index],
            points: settings.points * 10,
            sampledEstimatedBytesPerPoint: sum(profile.head) / (settings.points * 10),
            sampleCount: profile.samples.length
          });
        }
      }
  } finally {
    session.disconnect();
  }
}
const report = {
  schemaVersion: 2,
  metadata: {
    sourceSHA256: codeFingerprint(),
    workloadSHA256: benchmarkFingerprint(),
    date: new Date().toISOString(),
    node: process.version,
    v8: process.versions.v8,
    platform: process.platform,
    arch: process.arch,
    cpu: cpus()[0]?.model,
    implementations: IMPLEMENTATIONS,
    ...settings
  },
  methodology:
    'Shared seeded regional/clustered coordinates; both precisions, XY/XYZ/XYZM and both directions. Prepared converters; every output checked before timing. Adaptive independent buffer copies reach a minimum aggregate duration, bounded to one million points/256 buffers. Resets and setup excluded; rotated execution order. Per-buffer median and p10/p90 are normalized by iterations; raw samples are aggregate milliseconds. Variation is descriptive, not a confidence interval. Allocation sampling is separate and includes collected objects; not exact counts. No timing CI thresholds.',
  ...warm,
  allocations
};
console.table(
  warm.rows
    .filter(
      row => row.precision === 'Float64' && row.dimension === 2 && row.direction === 'project'
    )
    .map(row => ({
      case: row.name,
      ...Object.fromEntries(
        row.measurements.map((m, i) => [
          IMPLEMENTATIONS[i],
          m.milliseconds > 0 ? +(settings.points / m.milliseconds / 1000).toFixed(2) : null
        ])
      ),
      iterations: row.iterations,
      timingLimited: row.timingLimited
    }))
);
if (values.allocations) console.table(allocations);
if (values.output) writeFileSync(values.output, JSON.stringify(report, null, 2) + '\n');
