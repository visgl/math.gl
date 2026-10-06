// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync, realpathSync} = require('node:fs');
const {tmpdir} = require('node:os');
const {join} = require('node:path');
const resolveDependency = require('./resolve-math-gl-dependency.cjs');
function fixture(t) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'math-gl-dependency-')));
  t.after(() => rmSync(root, {recursive: true, force: true}));
  return root;
}
function workspace(root, name) {
  const target = join(root, 'modules', name);
  mkdirSync(target, {recursive: true});
  writeFileSync(join(target, 'package.json'), JSON.stringify({
    name: `@math.gl/${name}`, version: '5.0.0-alpha.12',
    exports: {'.': {require: './dist/index.cjs', import: './dist/index.js'}}
  }));
  const modules = join(root, 'node_modules', '@math.gl');
  mkdirSync(modules, {recursive: true});
  symlinkSync(target, join(modules, name), 'junction');
  return target;
}
test('workspace imports retain source aliases without any built dist files', t => {
  const root = fixture(t), modules = join(root, 'modules');
  const context = join(root, 'node_modules', '@loaders.gl', 'gis', 'dist');
  mkdirSync(context, {recursive: true});
  for (const name of ['wkb', 'crs', 'types']) {
    workspace(root, name);
    assert.equal(resolveDependency(`@math.gl/${name}`, context, modules), `@math.gl/${name}`);
  }
  assert.equal(resolveDependency('@math.gl/crs/wkt', context, modules), '@math.gl/crs/wkt');
});
test('installed dependencies keep math.gl 4.x even when a 5.x workspace exists', t => {
  const root = fixture(t), modules = join(root, 'modules');
  const target = workspace(root, 'core');
  mkdirSync(join(target, 'dist'));
  writeFileSync(join(target, 'dist', 'index.cjs'), 'module.exports = {};');
  const packageRoot = join(root, 'node_modules', '@deck.gl', 'core');
  const context = join(packageRoot, 'dist');
  const installed = join(packageRoot, 'node_modules', '@math.gl', 'core');
  mkdirSync(context, {recursive: true});
  mkdirSync(join(installed, 'dist'), {recursive: true});
  writeFileSync(join(installed, 'package.json'), JSON.stringify({name: '@math.gl/core', version: '4.1.0',
    exports: {'.': {require: './dist/index.cjs', import: './dist/index.js'}}}));
  for (const ext of ['cjs', 'js']) writeFileSync(join(installed, 'dist', `index.${ext}`), '');
  assert.equal(resolveDependency('@math.gl/core', context, modules), join(installed, 'dist', 'index.js'));
  // Existing workspace dist must not change the source-based website behavior.
  assert.equal(resolveDependency('@math.gl/core', root, modules), '@math.gl/core');
});
test('missing packages are reported instead of silently falling back to workspace aliases', t => {
  const root = fixture(t);
  assert.throws(() => resolveDependency('@math.gl/missing', root, join(root, 'modules')), {code: 'MODULE_NOT_FOUND'});
});
