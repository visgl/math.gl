// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, realpathSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {bundleRuntime} from './benchmark-runtime.mjs';

test('package aliases resolve public and private sources in current and historical bundles', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'mathgl-historical-runtime-')));
  const write = (path, contents) => {
    const file = join(root, path);
    mkdirSync(dirname(file), {recursive: true});
    writeFileSync(file, contents);
  };
  const git = (...args) => execFileSync('git', args, {cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}).trim();
  try {
    write('modules/geospatial/src/projection/index.ts', 'export {};');
    const exports = {'.': {import: './dist/index.js'}, './projection/grids/gtx': {import: './dist/grid.js'}};
    write('modules/geospatial/package.json', JSON.stringify({exports}));
    write('modules/geospatial/src/grid.ts', 'export const grid = 13;');
    write('modules/geospatial/src/index.ts', 'export const publicValue = 12; export const frame = 14;');
    write('modules/geospatial/src/geographic-seams.ts', "export {value} from './geographic-seams/edge.js';");
    write('modules/geospatial/src/geographic-seams/edge.ts', 'export const value = 42;');
    write('modules/geospatial/src/geographic-seams/index.ts', 'export const value = -1;');
    write('modules/geospatial/src/directory-only/index.ts', 'export const other = 7;');
    write('modules/geospatial/node_modules/fixture-dependency/package.json', JSON.stringify({main: 'index.js'}));
    write('modules/geospatial/node_modules/fixture-dependency/index.js', 'export const dependency = 8;');
    write('modules/geospatial/src/removed-directory/inner.ts', 'export const inner = 9;');
    write('modules/geospatial/src/removed-directory/index.ts', "import {dependency} from 'fixture-dependency'; import {inner} from './inner'; export const removed = dependency + inner;");
    git('init', '--quiet');
    git('add', '.');
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', 'commit', '--quiet', '-m', 'fixture');
    const ref = git('rev-parse', 'HEAD');
    write('modules/geospatial/package.json', JSON.stringify({exports: {
      '.': exports['.'],
      './projection-grids-gtx': exports['./projection/grids/gtx'],
      './coordinates': {import: './dist/coordinates.js'}
    }}));
    write('modules/geospatial/src/coordinates.ts', 'export const frame = 15;');
    write('modules/geospatial/src/grid.ts', 'export const grid = 16;');
    write('benchmark/entry.ts', [
      "export {value} from '@math.gl/geospatial/geographic-seams';",
      "export {other} from '@math.gl/geospatial/directory-only';",
      "export {publicValue} from '@math.gl/geospatial';",
      "export {removed} from '@math.gl/geospatial/removed-directory';",
      "export {grid} from '@math.gl/geospatial/projection-grids-gtx';",
      "export {frame} from '@math.gl/geospatial/coordinates';"
    ].join('\n'));
    // The historical bundle must ignore later working-tree changes.
    write('modules/geospatial/src/geographic-seams/edge.ts', 'export const value = 99;');
    for (const baseline of [undefined, ref]) {
      if (baseline) rmSync(join(root, 'modules/geospatial/src/removed-directory'), {recursive: true});
      const outfile = join(root, baseline ? 'historical.mjs' : 'current.mjs');
      await bundleRuntime(root, 'benchmark/entry.ts', outfile, baseline);
      const result = await import(pathToFileURL(outfile).href);
      assert.equal(result.value, baseline ? 42 : 99);
      assert.equal(result.other, 7);
      assert.equal(result.publicValue, 12);
      assert.equal(result.removed, 17);
      assert.equal(result.grid, baseline ? 13 : 16);
      assert.equal(result.frame, baseline ? 14 : 15);
    }

    // Before consolidation, the same flattened imports resolve from the standalone package.
    rmSync(join(root, 'modules/geospatial/src/projection/index.ts'));
    write('modules/projection/package.json', JSON.stringify({
      exports: {
        './core': {import: './dist/core.js'},
        './parsers/wkt': {import: './dist/wkt.js'}
      }
    }));
    write('modules/projection/src/core.ts', 'export const core = 18;');
    write('modules/projection/src/wkt.ts', 'export const wkt = 19;');
    git('add', '-A', '--', 'modules');
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', 'commit', '--quiet', '-m', 'standalone projection fixture');
    write('benchmark/entry.ts', [
      "export {core} from '@math.gl/geospatial/projection-core';",
      "export {wkt} from '@math.gl/geospatial/projection-parsers-wkt';"
    ].join('\n'));
    const standalone = join(root, 'standalone.mjs');
    await bundleRuntime(root, 'benchmark/entry.ts', standalone, git('rev-parse', 'HEAD'));
    const result = await import(pathToFileURL(standalone).href);
    assert.equal(result.core, 18);
    assert.equal(result.wkt, 19);
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
});
