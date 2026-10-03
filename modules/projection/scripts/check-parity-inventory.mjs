// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {readFile, readdir, access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {transform} from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const upstream = dirname(require.resolve('proj4/package.json'));
const inventory = JSON.parse(
  await readFile(join(root, 'test/fixtures/parity-inventory.json'), 'utf8')
);
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const installed = JSON.parse(await readFile(join(upstream, 'package.json'), 'utf8'));
assert.equal(
  manifest.devDependencies.proj4,
  inventory.upstream.version,
  'Update the inventory when changing the reference version'
);
assert.equal(installed.version, inventory.upstream.version);
const sha = source => createHash('sha256').update(source).digest('hex');
for (const [file, hash] of Object.entries(inventory.upstream.files)) {
  assert.equal(
    sha(await readFile(join(upstream, file))),
    hash,
    'Upstream feature source changed: ' + file
  );
}
const modules = (await readdir(join(upstream, 'lib/projections')))
  .filter(file => file.endsWith('.js'))
  .map(file => file.slice(0, -3))
  .sort();
assert.deepEqual(
  inventory.projections.map(entry => entry.id).sort(),
  modules,
  'Every upstream projection/helper must be inventoried'
);

// Load authored fixture metadata without requiring a build or a TypeScript loader.
const compiled = await transform(
  await readFile(join(root, 'test/fixtures/common-projections.ts'), 'utf8'),
  {loader: 'ts', format: 'esm'}
);
const {commonProjectionCases} = await import(
  'data:text/javascript;base64,' + Buffer.from(compiled.code).toString('base64')
);
const catalogueCompiled = await transform(
  await readFile(join(root, 'test/fixtures/catalogue-projections.ts'), 'utf8'),
  {loader: 'ts', format: 'esm'}
);
const {catalogueProjectionCases} = await import(
  'data:text/javascript;base64,' + Buffer.from(catalogueCompiled.code).toString('base64')
);
const allCases = [...commonProjectionCases, ...catalogueProjectionCases];
const fixtureIds = new Set(['foundation', ...allCases.map(fixture => fixture.id)]);
assert.equal(fixtureIds.size, allCases.length + 1, 'Fixture IDs must be unique');
const gapIds = new Set(inventory.gaps.map(gap => gap.id));
assert.equal(gapIds.size, inventory.gaps.length, 'Gap IDs must be unique');
for (const entry of [...inventory.projections, ...inventory.features]) {
  assert(['partial', 'verified', 'unsupported', 'out-of-scope'].includes(entry.status));
  if (entry.status === 'partial' || entry.status === 'unsupported')
    assert(entry.gapIds.length > 0, 'Missing gap: ' + entry.id);
  if (entry.status === 'partial' || entry.status === 'verified')
    assert(entry.tests.length > 0, 'Missing test: ' + entry.id);
  for (const gap of entry.gapIds) assert(gapIds.has(gap), 'Unknown gap: ' + gap);
  for (const file of entry.tests) await access(join(root, file));
  for (const fixture of entry.fixtureIds || [])
    assert(fixtureIds.has(fixture), 'Unknown fixture: ' + fixture);
}
const includedSource = await readFile(join(upstream, 'lib/includedProjections.js'), 'utf8');
const defaultModules = new Set([
  'longlat',
  'merc',
  ...Array.from(includedSource.matchAll(/from '\.\/projections\/(\w+)'/g), match => match[1])
]);
for (const projection of inventory.projections) {
  const source = await readFile(join(upstream, 'lib/projections', projection.id + '.js'), 'utf8');
  assert.equal(
    sha(source),
    projection.upstreamSHA256,
    'Projection source changed: ' + projection.id
  );
  const aliases = Array.from(
    (source.match(/export var names = (\[[\s\S]*?\]);/)?.[1] || '').matchAll(/'([^']+)'/g),
    match => match[1]
  );
  assert.deepEqual(
    projection.upstreamAliases,
    aliases,
    'Alias inventory mismatch: ' + projection.id
  );
  assert.equal(
    projection.defaultBundle,
    defaultModules.has(projection.id),
    'Bundle inventory mismatch: ' + projection.id
  );
}
for (const exception of inventory.exceptions) await access(join(root, exception.test));

const tagged = await transform(
  await readFile(join(root, 'test/fixtures/upstream-2.22.0.ts'), 'utf8'),
  {loader: 'ts', format: 'esm'}
);
const {upstreamFixtures, upstreamFixtureSource} = await import(
  'data:text/javascript;base64,' + Buffer.from(tagged.code).toString('base64')
);
assert.equal(upstreamFixtureSource.version, inventory.upstream.version);
assert.equal(new Set(upstreamFixtures.map(fixture => fixture.id)).size, upstreamFixtures.length);
for (const fixture of upstreamFixtures) {
  assert(fixture.sourceLine > 0);
  assert(fixture.xyToleranceMeters > 0 && fixture.llToleranceDegrees > 0);
  assert(fixture.ll.every(Number.isFinite) && fixture.xy.every(Number.isFinite));
  if (fixture.gapId) assert(gapIds.has(fixture.gapId), 'Unknown upstream fixture gap');
}
