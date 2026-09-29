// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original fixture verification tooling for the proj4js-inspired API.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const root = fileURLToPath(new URL('../test/fixtures/', import.meta.url));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = async name => JSON.parse(await readFile(join(root, name), 'utf8'));
assert(
  process.argv.slice(2).every(arg => arg === '--download-grids'),
  'Unknown argument'
);
const projections = await json('native-proj-cases.json');
const grids = await json('real-grid-cases.json');
const inventory = await json('parity-inventory.json');
for (const grid of grids.grids) {
  const path = join(root, 'real-grids', grid.file);
  if (process.argv.includes('--download-grids')) {
    const response = await fetch(grid.source);
    assert(response.ok, 'Grid download failed: ' + grid.file);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(sha(bytes), grid.sha256, 'Downloaded grid hash mismatch: ' + grid.file);
    await mkdir(join(root, 'real-grids'), {recursive: true});
    await writeFile(path, bytes);
  }
  assert.equal(sha(await readFile(path)), grid.sha256, 'Grid hash mismatch: ' + grid.file);
  assert.equal(grid.regions.length, grid.imageCount);
}
for (const [name, inputs] of [
  ['native-proj', projections.cases],
  ['real-grid', grids.grids]
]) {
  const reference = await json(name + '-reference.json');
  assert.equal(reference.pyproj, '3.7.2');
  assert.equal(reference.proj, '9.5.1');
  assert.equal(reference.source, name + '-cases.json');
  assert.equal(
    reference.sourceSHA256,
    sha(await readFile(join(root, reference.source))),
    'Stale inputs: regenerate ' + name
  );
  assert.equal(
    reference.generatorSHA256,
    sha(await readFile(new URL('./generate-native-reference.py', import.meta.url))),
    'Stale generator: regenerate ' + name
  );
  assert.deepEqual(
    reference.cases.map(row => row.id),
    inputs.map(row => row.id)
  );
  assert.equal(new Set(inputs.map(row => row.id)).size, inputs.length);
  for (const [index, row] of reference.cases.entries()) {
    assert.deepEqual(
      row.results.map(result => result.input),
      inputs[index].points
    );
    assert(row.results.length > 0);
    for (const result of row.results) {
      for (const coordinate of [result.input, result.forward, result.inverse]) {
        assert(coordinate.length >= 2 && coordinate.every(Number.isFinite));
      }
    }
  }
}
assert.deepEqual(
  [...new Set(projections.cases.map(row => /\+proj=(\w+)/.exec(row.definition)[1]))].sort(),
  inventory.projections
    .map(row => row.id)
    .filter(name => name !== 'gauss')
    .sort()
);
for (const row of projections.cases) {
  assert(row.oracleNotes, 'Document oracle semantics: ' + row.id);
  assert(row.forwardTolerance > 0 && row.inverseTolerance > 0);
  if (row.oracle !== row.definition) assert(!row.oracleNotes.startsWith('Identical'));
}
console.log('Independent PROJ references, all named projections, and pinned grid hashes verified.');
