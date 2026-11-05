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

test('historical bundling resolves blobs before same-named directories', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'mathgl-historical-runtime-')));
  const write = (path, contents) => {
    const file = join(root, path);
    mkdirSync(dirname(file), {recursive: true});
    writeFileSync(file, contents);
  };
  const git = (...args) => execFileSync('git', args, {cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}).trim();
  try {
    write('modules/geospatial/src/projection/index.ts', 'export {};');
    write('modules/geospatial/src/geographic-seams.ts', "export {value} from './geographic-seams/edge.js';");
    write('modules/geospatial/src/geographic-seams/edge.ts', 'export const value = 42;');
    write('modules/geospatial/src/geographic-seams/index.ts', 'export const value = -1;');
    write('modules/geospatial/src/directory-only/index.ts', 'export const other = 7;');
    write('benchmark/entry.ts', "export {value} from '../modules/geospatial/src/geographic-seams'; export {other} from '../modules/geospatial/src/directory-only';");
    git('init', '--quiet');
    git('add', '.');
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', 'commit', '--quiet', '-m', 'fixture');
    const ref = git('rev-parse', 'HEAD');
    // The historical bundle must ignore later working-tree changes.
    write('modules/geospatial/src/geographic-seams/edge.ts', 'export const value = 99;');
    const outfile = join(root, 'historical.mjs');
    await bundleRuntime(root, 'benchmark/entry.ts', outfile, ref);
    const result = await import(pathToFileURL(outfile).href);
    assert.equal(result.value, 42);
    assert.equal(result.other, 7);
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
});
