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
    write('modules/geospatial/package.json', JSON.stringify({exports: {'.': {import: './dist/index.js'}}}));
    write('modules/geospatial/src/index.ts', 'export const publicValue = 12;');
    write('modules/geospatial/src/geographic-seams.ts', "export {value} from './geographic-seams/edge.js';");
    write('modules/geospatial/src/geographic-seams/edge.ts', 'export const value = 42;');
    write('modules/geospatial/src/geographic-seams/index.ts', 'export const value = -1;');
    write('modules/geospatial/src/directory-only/index.ts', 'export const other = 7;');
    write('benchmark/entry.ts', "export {value} from '@math.gl/geospatial/geographic-seams'; export {other} from '@math.gl/geospatial/directory-only'; export {publicValue} from '@math.gl/geospatial';");
    git('init', '--quiet');
    git('add', '.');
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', 'commit', '--quiet', '-m', 'fixture');
    const ref = git('rev-parse', 'HEAD');
    // The historical bundle must ignore later working-tree changes.
    write('modules/geospatial/src/geographic-seams/edge.ts', 'export const value = 99;');
    for (const baseline of [undefined, ref]) {
      const outfile = join(root, baseline ? 'historical.mjs' : 'current.mjs');
      await bundleRuntime(root, 'benchmark/entry.ts', outfile, baseline);
      const result = await import(pathToFileURL(outfile).href);
      assert.equal(result.value, baseline ? 42 : 99);
      assert.equal(result.other, 7);
      assert.equal(result.publicValue, 12);
    }
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
});
