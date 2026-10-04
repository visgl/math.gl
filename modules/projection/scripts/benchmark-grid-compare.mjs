// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Paired reader preparation and retained-memory measurements, separate from point throughput.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {Session} from 'node:inspector/promises';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {cpus, tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {bundleRuntime} from './benchmark-runtime.mjs';
import {codeFingerprint, benchmarkFingerprint} from './benchmark-metadata.mjs';

const {values} = parseArgs({
  options: {
    'baseline-ref': {type: 'string', default: 'origin/master'},
    sizes: {type: 'string', default: '65,257,1025'},
    samples: {type: 'string', default: '11'},
    clock: {type: 'string', default: 'wall'},
    memory: {type: 'boolean', default: false},
    coordinates: {type: 'boolean', default: false},
    allocations: {type: 'boolean', default: false},
    points: {type: 'string', default: '10000'},
    output: {type: 'string'}
  }
});
const points = Number(values.points);
assert(
  Number.isSafeInteger(points) && points >= 1 && points <= 1000000,
  'Points must be 1..1000000'
);
assert(!values.allocations || values.coordinates, 'Allocation sampling requires --coordinates');
const sizes = values.sizes.split(',').map(Number),
  samples = Number(values.samples);
assert(
  sizes.length > 0 && sizes.every(n => Number.isSafeInteger(n) && n >= 2 && n <= 2049),
  'Sizes must be 2..2049'
);
assert(Number.isSafeInteger(samples) && samples >= 3 && samples <= 31, 'Samples must be 3..31');
assert(['wall', 'thread-cpu'].includes(values.clock), 'Unknown clock');
assert(
  values.clock !== 'thread-cpu' || process.threadCpuUsage,
  'thread-cpu requires Node 24.14 or later'
);
assert(!values.memory || globalThis.gc, 'Memory measurement requires node --expose-gc');
const now =
  values.clock === 'thread-cpu'
    ? () => {
        const time = process.threadCpuUsage();
        return (time.user + time.system) / 1000;
      }
    : () => performance.now();
const root = fileURLToPath(new URL('../../../', import.meta.url));
const baselineCommit = execFileSync(
  'git',
  ['rev-parse', '--verify', values['baseline-ref'] + '^{commit}'],
  {cwd: root, encoding: 'utf8'}
).trim();
const directory = mkdtempSync(join(tmpdir(), 'math-gl-grid-compare-'));
const median = numbers => [...numbers].sort((a, b) => a - b)[Math.floor(numbers.length / 2)];
const summary = numbers => {
  const sorted = [...numbers].sort((a, b) => a - b);
  return {
    median: median(numbers),
    p10: sorted[Math.floor((sorted.length - 1) * 0.1)],
    p90: sorted[Math.ceil((sorted.length - 1) * 0.9)],
    samples: numbers
  };
};
const radians = Math.PI / 180;
// Cross terms make a row/column transposition observable, including edges.
const field = (x, y) => [2 + x / 8 + (x * y) / 32, 1 - y / 4 + (x * y) / 64];
function qualify(grid) {
  for (const [x, y] of [
    [0, 0],
    [16, 16],
    [0, 16],
    [16, 0],
    [3.25, 9.75],
    [14.75, 0.25]
  ]) {
    const input = [-x * radians, y * radians],
      delta = field(x, y);
    const expected = [
      input[0] - (delta[0] * radians) / 3600,
      input[1] + (delta[1] * radians) / 3600
    ];
    const forward = grid.shift(...input, false);
    assert(
      forward && forward.every((v, i) => Math.abs(v - expected[i]) <= 5e-12),
      'Analytic forward mismatch'
    );
    const inverse = grid.shift(...forward, true);
    assert(
      inverse && inverse.every((v, i) => Math.abs(v - input[i]) <= 1e-11),
      'Analytic inverse mismatch'
    );
  }
}
function collect() {
  globalThis.gc?.();
  globalThis.gc?.();
}
function memorySample(outfile, format, size) {
  // A fresh process prevents an earlier timed grid's lifetime from contaminating the delta.
  const source = `import assert from 'node:assert/strict';
    const engine = await import(${JSON.stringify(pathToFileURL(outfile).href)});
    const radians = Math.PI / 180, field = ${field.toString()};
    const qualify = ${qualify.toString()};
    const fixture = {size: ${size}, step: 16 / (${size} - 1), shift: field};
    const bytes = engine.makeNTv2([fixture]);
    const image = await engine.makeGeoTIFF([fixture]).getImage(0);
    const tiff = {getImageCount: async () => 1, getImage: async () => image};
    const read = ${JSON.stringify(format)} === 'NTv2' ? () => engine.parseNTv2Grid(bytes) : () => engine.loadGeoTIFFGrid(tiff);
    globalThis.gc(); globalThis.gc();
    const before = process.memoryUsage();
    const grid = await read();
    globalThis.gc(); globalThis.gc();
    const after = process.memoryUsage();
    qualify(grid);
    process.stdout.write(JSON.stringify({heap: after.heapUsed - before.heapUsed, buffers: after.arrayBuffers - before.arrayBuffers}));`;
  const result = JSON.parse(
    execFileSync(process.execPath, ['--expose-gc', '--input-type=module', '-e', source], {
      encoding: 'utf8',
      timeout: 120000
    })
  );
  return result.heap + result.buffers; // external already includes arrayBuffers; do not count it twice.
}
const rows = [],
  coordinateRows = [],
  allocationJobs = [],
  allocations = [];
function coordinateCase(grids, inverse, tuple) {
  const source = new Float64Array(points * 2),
    expected = new Float64Array(points * 2);
  for (let record = 0; record < points; record++) {
    const x = (0.25 + ((record % 113) * 15.5) / 113) * -radians;
    const y = (0.25 + ((record % 127) * 15.5) / 127) * radians;
    const point = inverse ? grids[0].shift(x, y, false) : [x, y];
    source.set(point, record * 2);
    expected.set(grids[0].shift(point[0], point[1], inverse), record * 2);
  }
  const outputs = grids.map(() => new Float64Array(source.length));
  const runners = grids.map((grid, index) => {
    const point = {x: NaN, y: NaN},
      output = outputs[index];
    const shift = grid.shift.bind(grid),
      mutable = grid.shiftInPlace.bind(grid);
    return () => {
      for (let offset = 0; offset < source.length; offset += 2) {
        if (tuple) {
          const result = shift(source[offset], source[offset + 1], inverse);
          if (!result) throw new Error('Benchmark coordinate not covered');
          output[offset] = result[0];
          output[offset + 1] = result[1];
        } else {
          point.x = source[offset];
          point.y = source[offset + 1];
          if (!mutable(point, inverse)) throw new Error('Benchmark coordinate not covered');
          output[offset] = point.x;
          output[offset + 1] = point.y;
        }
      }
    };
  });
  for (const [index, run] of runners.entries()) {
    run();
    assert.deepEqual(outputs[index], expected, 'Grid coordinate arithmetic differs');
    for (let warmup = 0; warmup < 20; warmup++) run();
  }
  return {runners, outputs, expected};
}
try {
  const engines = [],
    outfiles = [];
  for (const baseline of [true, false]) {
    const outfile = join(directory, baseline ? 'baseline.mjs' : 'candidate.mjs');
    await bundleRuntime(
      root,
      'modules/projection/test/benchmark-grid-entry.ts',
      outfile,
      baseline ? baselineCommit : undefined
    );
    engines.push(await import(pathToFileURL(outfile).href));
    outfiles.push(outfile);
  }
  for (const size of sizes) {
    const fixture = {size, step: 16 / (size - 1), shift: field};
    const bytes = engines[1].makeNTv2([fixture]);
    // Already decoded raster bands: network, TIFF parsing and fixture generation are outside timing.
    const image = await engines[1].makeGeoTIFF([fixture]).getImage(0);
    const tiff = {getImageCount: async () => 1, getImage: async () => image};
    for (const format of ['NTv2', 'GeoTIFF adapter']) {
      const readers = engines.map(engine =>
        format === 'NTv2' ? () => engine.parseNTv2Grid(bytes) : () => engine.loadGeoTIFFGrid(tiff)
      );
      for (const read of readers) {
        for (let warmup = 0; warmup < 3; warmup++) qualify(await read());
      }
      const milliseconds = [[], []],
        memory = [[], []];
      for (let sample = 0; sample < samples; sample++) {
        for (let offset = 0; offset < 2; offset++) {
          const index = (sample + offset) % 2;
          collect(); // Untimed. Allocations and collection during preparation remain part of its cost.
          const start = now();
          const grid = await readers[index]();
          milliseconds[index].push(now() - start);
          qualify(grid);
        }
      }
      if (values.memory) {
        for (let sample = 0; sample < 3; sample++)
          for (let offset = 0; offset < 2; offset++) {
            const index = (sample + offset) % 2;
            memory[index].push(memorySample(outfiles[index], format, size));
          }
      }
      if (values.coordinates) {
        const grids = await Promise.all(readers.map(read => read()));
        grids.forEach(qualify);
        for (const inverse of [false, true])
          for (const tuple of [false, true]) {
            const {runners, outputs, expected} = coordinateCase(grids, inverse, tuple);
            const measured = [[], []];
            for (let sample = 0; sample < samples; sample++)
              for (let offset = 0; offset < 2; offset++) {
                const index = (sample + offset) % 2;
                const start = now();
                runners[index]();
                measured[index].push(now() - start);
              }
            outputs.forEach(output => assert.deepEqual(output, expected));
            const id = {
              format,
              size: [size, size],
              direction: inverse ? 'inverse' : 'forward',
              mode: tuple ? 'owned tuple' : 'mutable output'
            };
            coordinateRows.push({
              ...id,
              points,
              baseline: summary(measured[0]),
              candidate: summary(measured[1]),
              speedup: median(measured[0]) / median(measured[1]),
              unstable: measured.some(numbers => {
                const data = summary(numbers);
                return data.p90 - data.p10 > data.median * 0.25;
              })
            });
            if (values.allocations) allocationJobs.push({id, runners});
          }
      }
      rows.push({
        format,
        size: [size, size],
        nodes: size * size,
        baseline: {
          milliseconds: summary(milliseconds[0]),
          retainedBytes: values.memory ? summary(memory[0]) : undefined
        },
        candidate: {
          milliseconds: summary(milliseconds[1]),
          retainedBytes: values.memory ? summary(memory[1]) : undefined
        },
        preparationSpeedup: median(milliseconds[0]) / median(milliseconds[1]),
        retainedMemoryRatio: values.memory ? median(memory[0]) / median(memory[1]) : undefined
      });
    }
  }
  // Inspector sampling starts only after every preparation/coordinate timing.
  if (values.allocations) {
    const profiler = new Session();
    profiler.connect();
    try {
      for (const {id, runners} of allocationJobs)
        for (const [index, run] of runners.entries()) {
          await profiler.post('HeapProfiler.startSampling', {
            samplingInterval: 4096,
            includeObjectsCollectedByMajorGC: true,
            includeObjectsCollectedByMinorGC: true
          });
          let profile;
          try {
            for (let iteration = 0; iteration < 10; iteration++) run();
          } finally {
            ({profile} = await profiler.post('HeapProfiler.stopSampling'));
          }
          const sum = node =>
            node.selfSize + node.children.reduce((total, child) => total + sum(child), 0);
          allocations.push({
            ...id,
            implementation: index === 0 ? 'baseline' : 'candidate',
            points: points * 10,
            sampledEstimatedBytesPerPoint: sum(profile.head) / (points * 10),
            sampleCount: profile.samples.length
          });
        }
    } finally {
      profiler.disconnect();
    }
  }
  const report = {
    schemaVersion: 1,
    metadata: {
      baselineCommit,
      candidateSourceSHA256: codeFingerprint(),
      workloadSHA256: benchmarkFingerprint(),
      date: new Date().toISOString(),
      node: process.version,
      v8: process.versions.v8,
      cpu: cpus()[0]?.model,
      platform: process.platform,
      arch: process.arch,
      clock: values.clock,
      samples,
      memory: values.memory,
      coordinates: values.coordinates,
      points: values.coordinates ? points : undefined,
      allocations: values.allocations
    },
    methodology:
      'Authored bilinear cross-term fields; the same NTv2 bytes and decoded GeoTIFF bands feed both historical/current source bundles. Input generation, network, TIFF decoding, bundling and untimed full GC are excluded. Three warmups, rotated baseline/candidate order and analytic forward/inverse checks before and after timing. Preparation includes allocation and any GC triggered by it. Memory is a separate three-sample experiment, each in a fresh process: the difference in heapUsed + arrayBuffers after full GC while holding one prepared grid, excluding input bytes/bands. Small-grid deltas are noisy; retained bytes are engine-specific estimates, not peak memory or allocated bytes. Thread CPU time is diagnostic, not elapsed throughput. Optional coordinate rows use prepared grids, matched owned tuples/mutable outputs, 20 warmups and rotated execution order, with exact all-coordinate baseline/candidate checks plus the analytic anchors. Separate sampled allocations run after all timing; zero is not an allocation proof. No CI speed or memory thresholds.',
    rows,
    ...(values.coordinates ? {coordinateRows} : {}),
    ...(values.allocations ? {allocations} : {})
  };
  console.table(
    rows.map(row => ({
      format: row.format,
      size: row.size[0],
      speedup: row.preparationSpeedup.toFixed(2),
      baselineMs: row.baseline.milliseconds.median.toFixed(2),
      candidateMs: row.candidate.milliseconds.median.toFixed(2),
      memoryRatio: row.retainedMemoryRatio?.toFixed(2)
    }))
  );
  if (values.coordinates)
    console.table(
      coordinateRows.map(row => ({
        format: row.format,
        mode: row.mode,
        direction: row.direction,
        speedup: row.speedup.toFixed(2),
        unstable: row.unstable
      }))
    );
  if (values.allocations) console.table(allocations);
  if (values.output) writeFileSync(values.output, JSON.stringify(report, null, 2) + '\n');
} finally {
  rmSync(directory, {recursive: true, force: true});
}
