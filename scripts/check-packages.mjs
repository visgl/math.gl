// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {createRequire} from 'node:module';

const root = new URL('../', import.meta.url);
const require = createRequire(import.meta.url);
const expected = ['arrow', 'core', 'dggs', 'earth', 'geometry', 'geospatial', 'tasks', 'web-mercator'];
const modules = readdirSync(new URL('modules/', root)).filter(name =>
  existsSync(new URL(`modules/${name}/package.json`, root))
);
assert.deepEqual(modules.sort(), expected, 'Published workspace packages must match the supported package set');
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
  if (name === 'core') {
    assert(Object.keys(manifest.dependencies || {}).every(dependency => dependency.startsWith('@math.gl/')), 'Core must not introduce external runtime dependencies');
  }
  for (const [subpath, entry] of Object.entries(manifest.exports)) {
    const targets = typeof entry === 'string' ? [entry] : Object.values(entry);
    for (const target of targets) {
      assert(existsSync(new URL(target, directory)), `Missing published target: ${manifest.name}${subpath.slice(1)} ${target}`);
    }
    if (typeof entry === 'string') continue;
    const specifier = manifest.name + (subpath === '.' ? '' : subpath.slice(1));
    const imported = await import(specifier);
    const required = require(specifier);
    if (specifier === '@math.gl/arrow/expressions') {
      assert.equal('ArrowFunctionRegistry' in imported, false);
      assert.equal('ArrowFunctionRegistry' in required, false);
    }
    if (specifier === '@math.gl/core') {
      assert.equal('parseSQLQuery' in imported, false);
      assert.equal('parseSQLQuery' in required, false);
    }
    if (specifier === '@math.gl/core/sql') {
      for (const sql of [imported, required]) {
        assert.equal(sql.parseSQLExpression('value::INTEGER').type, 'CallExpression');
        assert.deepEqual(sql.parseSQLQuery('SHOW TABLES FROM warehouse'), {command: 'showTables', from: 'warehouse'});
        assert.deepEqual(sql.parseSQLSelect('SELECT city AS name LIMIT 2'), {select: [{column: 'city', as: 'name'}], limit: 2});
        const predicate = sql.parseSQLPredicate('value >= :min', {preserveParameters: true});
        const bound = sql.bindSQLPredicate(predicate, {min: 3});
        sql.validateSQLPredicate(bound);
        assert.equal(sql.isSQLPredicate(bound), true);
        assert.deepEqual(bound, {op: '>=', args: [{property: 'value'}, 3]});
        assert.equal(sql.SQL_PREDICATE_JSON_SCHEMA.$id, 'https://math.gl/schemas/sql-predicate.schema.json');
      }
    }
    if (specifier === '@math.gl/geometry/lighting') {
      for (const lighting of [imported, required]) {
        const profile = {verticalAngles: [0, 180], horizontalAngles: [0], intensities: [2, 2], intensityScale: 3, symmetry: 'rotational'};
        assert.equal(lighting.createPhotometricSampler(profile)(90, 45), 6);
        assert.ok(Math.abs(lighting.integrateLuminousFlux(profile) - 24 * Math.PI) < 1e-10);
        const grid = lighting.resamplePhotometricProfile(profile, {verticalCount: 2, horizontalCount: 1});
        assert.deepEqual([...grid.data], [6, 6]);
      }
    }
    if (specifier === '@math.gl/geometry/color') {
      for (const colors of [imported, required]) {
        const lut = {dimension: 1, size: 2, data: Float32Array.of(0, 0, 0, 1, 1, 1), domainMinimum: [0, 0, 0], domainMaximum: [1, 1, 1]};
        assert.deepEqual(colors.createColorLUTSampler(lut)(0.25, 0.5, 0.75), [0.25, 0.5, 0.75]);
        assert.deepEqual([...colors.applyColorLUT(lut, Float32Array.of(0, 0.5, 1))], [0, 0.5, 1]);
      }
    }
    entrypoints++;
  }
}
for (const packageName of ['@math.gl/core', '@math.gl/geometry', '@math.gl/geospatial', '@math.gl/earth']) {
  console.log(`${packageName}: implementation owned by the grouped package`);
}
assert.equal('subdivideGlobeMesh' in await import('@math.gl/geometry'), false);
assert.equal(typeof (await import('@math.gl/geospatial')).subdivideGlobeMesh, 'function');
console.log(`${entrypoints} ESM/CommonJS entrypoints and all published assets/declarations passed across the eight packages.`);

await import('./check-terrain-package.mjs');
await import('./check-root-exports.mjs');
await import('./qualify-terrain-dem.mjs');
