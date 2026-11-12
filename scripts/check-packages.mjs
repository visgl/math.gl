// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';

const root = new URL('../', import.meta.url);
const require = createRequire(import.meta.url);
const expected = ['arrow', 'core', 'dggs', 'earth', 'expressions', 'geometry', 'geospatial', 'tasks', 'web-mercator'];
const modules = readdirSync(new URL('modules/', root)).filter(name =>
  existsSync(new URL(`modules/${name}/package.json`, root))
);
assert.deepEqual(modules.sort(), expected, 'Published workspace packages must match the supported package set');
// Verify the actual built ESM and CommonJS entrypoints with Arrow resolution disabled.
execFileSync(process.execPath, ['--input-type=module', '-e', `
  import assert from 'node:assert/strict';
  import {createRequire, registerHooks} from 'node:module';
  registerHooks({resolve(specifier, context, nextResolve) {
    if (specifier === 'apache-arrow' || specifier.startsWith('apache-arrow/')) {
      throw new Error('Unexpected Apache Arrow dependency: ' + specifier);
    }
    return nextResolve(specifier, context);
  }});
  const require = createRequire(import.meta.url);
  for (const load of [specifier => import(specifier), specifier => require(specifier)]) {
    const {compile} = await load('@math.gl/expressions');
    assert.equal(compile('value * 2')({value: 5}), 10);
    const {parseSQLQuery} = await load('@math.gl/expressions/sql');
    assert.deepEqual(parseSQLQuery('SHOW SOURCES'), {command: 'showSources'});
  }
`], {cwd: root, stdio: 'inherit'});

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
    if (specifier === '@math.gl/expressions/arrow') {
      assert.equal(typeof imported.compileArrowAggregates, 'function');
      assert.equal(typeof required.compileArrowAggregates, 'function');
      assert.equal(imported.isExpressionEvaluationError(new required.ExpressionEvaluationError('domain', 'cross-bundle')), true);
      assert.equal(required.isExpressionEvaluationError(new imported.ExpressionEvaluationError('overflow', 'cross-bundle')), true);
      assert.equal('ArrowFunctionRegistry' in imported, false);
      assert.equal('ArrowFunctionRegistry' in required, false);
    }
    if (specifier === '@math.gl/expressions/math') {
      for (const math of [imported, required]) {
        assert.equal(Object.keys(math).length, 21);
        assert.equal(math.SIN.name, 'SIN');
        assert.equal(math.ROUND.prototypes.find(p => p.arguments[0].type.toString() === 'Float64').evaluateScalar(-1.5), -2);
      }
    }
    if (specifier === '@math.gl/expressions') {
      for (const expressions of [imported, required]) {
        expressions.validateExpressionAST({type:'Identifier',name:'x'});
        assert.deepEqual(expressions.getExpressionColumns({type:'Identifier',name:'x'}), ['x']);
        assert.equal(expressions.NUMERIC_FUNCTION_DEFINITIONS.SIN.prototypes.length, 11);
      }
      assert.equal(imported.isExpressionEvaluationError(new required.ExpressionEvaluationError('domain','cross-bundle')), true);
    }
    if (specifier === '@math.gl/core') {
      assert.equal('parseSQLQuery' in imported, false);
      assert.equal('parseSQLQuery' in required, false);
    }
    if (specifier === '@math.gl/expressions/sql') {
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
console.log(`${entrypoints} ESM/CommonJS entrypoints and all published assets/declarations passed across the supported packages.`);

await import('./check-terrain-package.mjs');
await import('./check-root-exports.mjs');
await import('./qualify-terrain-dem.mjs');
