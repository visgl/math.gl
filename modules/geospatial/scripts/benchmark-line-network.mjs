// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {bundleRuntime} from './projection/benchmark-runtime.mjs';

// Times buildLineNetwork on a jittered synthetic street grid in Node.
// Usage: node modules/geospatial/scripts/benchmark-line-network.mjs [--segments 1000000] [--samples 5]
const {values} = parseArgs({
  options: {segments: {type: 'string', default: '1000000'}, samples: {type: 'string', default: '5'}}
});
const segments = Number(values.segments);
const samples = Number(values.samples);
assert(Number.isInteger(segments) && segments >= 4);
assert(Number.isInteger(samples) && samples >= 1);
const root = fileURLToPath(new URL('../../../', import.meta.url));
const directory = mkdtempSync(join(tmpdir(), 'mathgl-line-network-benchmark-'));
try {
  const outfile = join(directory, 'entry.mjs');
  await bundleRuntime(root, 'modules/geospatial/test/line-network/line-network-benchmark-entry.ts', outfile, undefined, 'node');
  const {LINE_NETWORK_BENCHMARK_CASES, makeBenchmarkGrid, timeLineNetworkBuild} = await import(pathToFileURL(outfile).href);
  const lines = makeBenchmarkGrid(segments);
  const segmentCount = lines.pathIndices.value.length - 1;
  console.log(`grid: ${segmentCount} segments, ${samples} samples, median build time`);
  for (const {name, options} of LINE_NETWORK_BENCHMARK_CASES) {
    // One warm-up build before the timed samples.
    timeLineNetworkBuild(lines, options, 1);
    const {times, nodeCount, edgeCount} = timeLineNetworkBuild(lines, options, samples);
    const sorted = [...times].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    console.log(`${name}: ${median.toFixed(0)} ms (min ${sorted[0].toFixed(0)}, max ${sorted.at(-1).toFixed(0)}); ${nodeCount} nodes, ${edgeCount} edges`);
  }
} finally {
  rmSync(directory, {recursive: true, force: true});
}
