// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {createRequire} from 'node:module';

const root = new URL('../', import.meta.url);
const require = createRequire(import.meta.url);
const expected = ['core', 'dggs', 'earth', 'geometry', 'geospatial', 'web-mercator'];
const modules = readdirSync(new URL('modules/', root)).filter(name =>
  existsSync(new URL(`modules/${name}/package.json`, root))
);
assert.deepEqual(modules.sort(), expected, 'Only the six consolidated workspace packages may remain');
const packageNames = new Set(expected.map(name => '@math.gl/' + name));
let entrypoints = 0;
for (const name of expected) {
  const directory = new URL(`modules/${name}/`, root);
  const manifest = JSON.parse(readFileSync(new URL('package.json', directory), 'utf8'));
  for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    for (const dependency of Object.keys(manifest[field] || {})) {
      if (!dependency.startsWith('@math.gl/')) continue;
      assert(packageNames.has(dependency), `${manifest.name}: invalid package dependency ${dependency}`);
      assert.notEqual(dependency, manifest.name, 'Subpaths must not create self-dependencies');
    }
  }
  if (['core', 'earth'].includes(name)) {
    for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
      assert(Object.keys(manifest[field] || {}).every(dependency => dependency.startsWith('@math.gl/')),
        manifest.name + ': vendored implementations must not introduce external runtime dependencies');
    }
  }
  for (const [subpath, entry] of Object.entries(manifest.exports)) {
    const targets = typeof entry === 'string' ? [entry] : Object.values(entry);
    for (const target of targets) {
      assert(existsSync(new URL(target, directory)), `Missing published target: ${manifest.name}${subpath.slice(1)} ${target}`);
    }
    if (typeof entry === 'string') continue;
    const specifier = manifest.name + (subpath === '.' ? '' : subpath.slice(1));
    await import(specifier);
    require(specifier);
    entrypoints++;
  }
}
for (const packageName of ['@math.gl/core', '@math.gl/geometry', '@math.gl/geospatial', '@math.gl/earth']) {
  console.log(`${packageName}: implementation owned by the grouped package`);
}
assert.equal('subdivideGlobeMesh' in await import('@math.gl/geometry/polygon'), false);
assert.equal(typeof (await import('@math.gl/geospatial/globe')).subdivideGlobeMesh, 'function');
console.log(`${entrypoints} ESM/CommonJS entrypoints and all published assets/declarations passed across the six packages.`);
