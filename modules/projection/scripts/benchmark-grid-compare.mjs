// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Paired reader preparation and retained-memory measurements, separate from point throughput.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
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
    output: {type: 'string'}
  }
});
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
const rows = [];
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
      memory: values.memory
    },
    methodology:
      'Authored bilinear cross-term fields; the same NTv2 bytes and decoded GeoTIFF bands feed both historical/current source bundles. Input generation, network, TIFF decoding, bundling and untimed full GC are excluded. Three warmups, rotated baseline/candidate order and analytic forward/inverse checks before and after timing. Preparation includes allocation and any GC triggered by it. Memory is a separate three-sample experiment, each in a fresh process: the difference in heapUsed + arrayBuffers after full GC while holding one prepared grid, excluding input bytes/bands. Small-grid deltas are noisy; retained bytes are engine-specific estimates, not peak memory or allocated bytes. Thread CPU time is diagnostic, not elapsed throughput. No CI speed or memory thresholds.',
    rows
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
  if (values.output) writeFileSync(values.output, JSON.stringify(report, null, 2) + '\n');
} finally {
  rmSync(directory, {recursive: true, force: true});
}
