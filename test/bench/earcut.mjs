// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// node test/bench/earcut.mjs /path/to/mapbox-earcut [baseline-ref]
// Uses the upstream checkout's MVT corpus; no fixture download is performed here.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync, readdirSync} from 'node:fs';
import {cpus} from 'node:os';
import {resolve, dirname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {build} from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
assert.ok(
  process.argv[2],
  'Usage: node test/bench/earcut.mjs /path/to/mapbox-earcut [baseline-ref]'
);
const upstreamPath = resolve(process.argv[2]);
const baselineRef = process.argv[3] || 'origin/master';
const upstreamCommit = '934e54d8bed85387330b7acaa5d2f5ba30a460a3';
assert.equal(
  git(upstreamPath, 'rev-parse', 'HEAD'),
  upstreamCommit,
  'Use the pinned upstream checkout'
);
assert.equal(
  git(upstreamPath, 'status', '--porcelain', '--', 'src/earcut.js', 'bench', 'test/fixtures'),
  '',
  'Upstream source and fixtures must be clean'
);
const sourcePath = 'modules/geometry/src/polygon/earcut.ts';
const baselineCommit = git(root, 'rev-parse', baselineRef);
const current = await compile(readFileSync(resolve(root, sourcePath), 'utf8'));
const baseline = await compile(git(root, 'show', `${baselineCommit}:${sourcePath}`));
const {
  default: upstream,
  flatten,
  deviation
} = await import(pathToFileURL(resolve(upstreamPath, 'src/earcut.js')));
const {readTilesFixture} = await import(
  pathToFileURL(resolve(upstreamPath, 'bench/tiles-fixture.js'))
);
const polygons = readTilesFixture();
/** Use the public balanced strategy with the same inputs as the fast strategy. */
const balanced = (vertices, holes, dim, areas, plane = 'xy') =>
  current(vertices, holes, dim, areas, plane, {triangulation: 'balanced'});
const variants = {baseline, fast: current, balanced, upstream};
let baselineDeviations = 0;

// Check exact indices, not just area: area alone can hide compensating gaps and overlaps.
for (const polygon of polygons) {
  const {vertices, holes, dimensions} = polygon;
  const expected = upstream(vertices, holes, dimensions);
  assert.deepEqual(current(vertices, holes, dimensions), expected);
  assert.equal(deviation(vertices, holes, dimensions, expected), 0);
  if (deviation(vertices, holes, dimensions, baseline(vertices, holes, dimensions)) > 1e-12)
    baselineDeviations++;
  polygon.areas = areas(vertices, holes, dimensions);
  assert.deepEqual(current(vertices, holes, dimensions, polygon.areas), expected);
  const balancedIndices = balanced(vertices, holes, dimensions);
  assert.equal(deviation(vertices, holes, dimensions, balancedIndices), 0);
  assert.deepEqual(balanced(vertices, holes, dimensions, polygon.areas), balancedIndices);
}
let fixtureCount = 0;
const fixturesPath = resolve(root, 'modules/geometry/test/polygon/data/earcut/fixtures');
for (const name of readdirSync(fixturesPath).filter(name => name.endsWith('.json'))) {
  const {vertices, holes, dimensions} = flatten(
    JSON.parse(readFileSync(resolve(fixturesPath, name)))
  );
  assert.deepEqual(
    current(vertices, holes, dimensions),
    upstream(vertices, holes, dimensions),
    name
  );
  fixtureCount++;
}
console.log(
  JSON.stringify({
    node: process.version,
    cpu: cpus()[0].model,
    baselineCommit,
    upstreamCommit,
    polygons: polygons.length,
    fixtures: fixtureCount,
    exactParity: true,
    baselineDeviations,
    portDeviations: 0,
    balancedDeviations: 0
  })
);

measure('MVT', polygons);
measure('MVT precomputed areas (math.gl only)', polygons, true);
const projected = polygons.map(polygon => {
  const vertices = new Float64Array((polygon.vertices.length / 2) * 3);
  for (let i = 0; i < polygon.vertices.length / 2; i++) {
    vertices[i * 3] = polygon.vertices[i * 2];
    vertices[i * 3 + 1] = 1e9;
    vertices[i * 3 + 2] = polygon.vertices[i * 2 + 1];
  }
  const result = {...polygon, vertices, dimensions: 3};
  assert.deepEqual(
    balanced(vertices, polygon.holes, 3, polygon.areas, 'xz'),
    balanced(polygon.vertices, polygon.holes, 2, polygon.areas)
  );
  assert.deepEqual(
    current(vertices, polygon.holes, 3, polygon.areas, 'xz'),
    upstream(polygon.vertices, polygon.holes, 2)
  );
  return result;
});
measure('MVT xz precomputed areas (math.gl only)', projected, true, 'xz');
for (const count of [256, 4096, 100000]) {
  const vertices = new Float64Array(count * 2);
  for (let i = 0; i < count; i++) {
    const angle = (i * 2 * Math.PI) / count;
    const radius = count === 100000 ? 1 : i % 2 ? 1 : 2;
    vertices[i * 2] = Math.cos(angle) * radius;
    vertices[i * 2 + 1] = Math.sin(angle) * radius;
  }
  const polygon = {vertices, holes: [], dimensions: 2, areas: areas(vertices, [], 2)};
  measure(`${count === 100000 ? 'convex' : 'star'} ${count}`, Array(20).fill(polygon));
}

/** Execute git without a shell and return trimmed textual output. */
function git(cwd, ...args) {
  return execFileSync('git', args, {cwd, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024}).trim();
}

/** Bundle the same source entry for both revisions, without needing package builds. */
async function compile(contents) {
  const {outputFiles} = await build({
    stdin: {contents, loader: 'ts', resolveDir: resolve(root, dirname(sourcePath))},
    bundle: true,
    write: false,
    platform: 'node',
    format: 'esm',
    alias: {'@math.gl/core/matrix': resolve(root, 'modules/core/src/matrix.ts')}
  });
  const module = await import(
    `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`
  );
  return module.earcut;
}

/** Calculate math.gl's signed half-areas once, outside the timed region. */
function areas(vertices, holes, dim) {
  return [0, ...holes].map((start, ring) => {
    const end = ring < holes.length ? holes[ring] * dim : vertices.length;
    let sum = 0;
    for (let i = start * dim, j = end - dim; i < end; j = i, i += dim) {
      sum += (vertices[i] - vertices[j]) * (vertices[i + 1] + vertices[j + 1]);
    }
    return sum / 2;
  });
}

/** Alternate implementations after two warmups; report five samples without timing assertions. */
function measure(name, data, precomputed = false, plane = 'xy') {
  const entries = Object.entries(variants).filter(([name]) => !precomputed || name !== 'upstream');
  const timings = Object.fromEntries(entries.map(([name]) => [name, []]));
  let checksum = 0;
  for (let round = -2; round < 5; round++) {
    const ordered = round % 2 ? [...entries].reverse() : entries;
    for (const [key, triangulate] of ordered) {
      const start = performance.now();
      for (const d of data)
        checksum += triangulate(
          d.vertices,
          d.holes,
          d.dimensions,
          precomputed ? d.areas : undefined,
          plane
        ).length;
      if (round >= 0) timings[key].push(performance.now() - start);
    }
  }
  console.log(
    JSON.stringify({
      name,
      calls: data.length,
      checksum,
      timings,
      medianMilliseconds: Object.fromEntries(
        Object.entries(timings).map(([key, values]) => [key, [...values].sort((a, b) => a - b)[2]])
      )
    })
  );
}
