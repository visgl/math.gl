// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, mkdirSync, readdirSync, symlinkSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {build} from 'esbuild';
import * as tasks from '@math.gl/core/tasks';
const require = createRequire(import.meta.url);
const expected = ['TaskRunner', 'initializeTaskWorker'];
for (const api of [tasks, require('@math.gl/core/tasks')]) {
  assert.deepEqual(Object.keys(api).sort(), expected);
  const runner = new api.TaskRunner();
  try {
    const input = new Float64Array([1, 2]);
    const output = await runner.runTask(
      {id: 'scale', process: ({values}) => ({values: values.map(x => x * 2)})},
      {values: input}
    );
    assert.deepEqual(output.values, new Float64Array([2, 4]));
    assert.equal(input.byteLength, 16);
  } finally {
    await runner.close();
  }
}

// Test the published package boundary, not just workspace resolution. Old deep
// paths must stay blocked even if internal implementation files ship in the tarball.
const root = process.cwd();
const temporary = mkdtempSync(join(tmpdir(), 'math-gl-task-package-'));
try {
  const modules = join(temporary, 'node_modules');
  mkdirSync(join(modules, '@math.gl'), {recursive: true});
  for (const name of readdirSync(join(root, 'node_modules'))) {
    if (name !== '@math.gl') symlinkSync(join(root, 'node_modules', name), join(modules, name));
  }
  for (const name of readdirSync(join(root, 'node_modules/@math.gl'))) {
    if (!['core', 'geospatial'].includes(name))
      symlinkSync(join(root, 'node_modules/@math.gl', name), join(modules, '@math.gl', name));
  }
  for (const name of ['core', 'geospatial']) {
    const [{filename}] = JSON.parse(
      execFileSync(
        'npm',
        [
          'pack',
          '--ignore-scripts',
          '--json',
          '--cache',
          join(temporary, 'npm-cache'),
          '--pack-destination',
          temporary
        ],
        {
          cwd: join(root, 'modules', name),
          encoding: 'utf8'
        }
      )
    );
    const destination = join(modules, '@math.gl', name);
    mkdirSync(destination);
    execFileSync('tar', [
      '-xzf',
      join(temporary, filename),
      '-C',
      destination,
      '--strip-components=1'
    ]);
  }
  const probe = join(temporary, 'probe.mjs');
  writeFileSync(
    probe,
    `
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import * as tasks from '@math.gl/core/tasks';
import * as geospatial from '@math.gl/geospatial/tasks';
const require = createRequire(import.meta.url);
for (const api of [tasks, require('@math.gl/core/tasks')]) assert.deepEqual(Object.keys(api).sort(), ${JSON.stringify(expected)});
for (const api of [geospatial, require('@math.gl/geospatial/tasks')]) assert.deepEqual(Object.keys(api).sort(), ['PrepareMapTask', 'ProjectCoordinatesTask']);
for (const path of ['@math.gl/core/worker-utils', '@math.gl/core/tasks/run-task', '@math.gl/core/dist/worker-utils/index.js', '@math.gl/core/src/worker-utils/index.ts', '@math.gl/geospatial/workers', '@math.gl/geospatial/workers/operations', '@math.gl/geospatial/dist/workers/index.js']) {
  await assert.rejects(import(path), {code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'});
  assert.throws(() => require(path), {code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'});
}
for (const [api, provided] of [[tasks, geospatial], [require('@math.gl/core/tasks'), require('@math.gl/geospatial/tasks')]]) {
  const runner = new api.TaskRunner();
  try {
    const {coordinates} = await runner.runTask(provided.ProjectCoordinatesTask, {coordinates: new Float64Array([10, 20]), projection: {from: 'EPSG:4326', to: 'EPSG:3857'}});
    assert(Math.abs(coordinates[0] - 1113194.9079) < 0.001);
    const {map} = await runner.runTask(provided.PrepareMapTask, {description: {version: 1, id: 'world', definition: {type: 'mercator'}}});
    assert(map);
  } finally {await runner.close();}
}
`
  );
  execFileSync(process.execPath, [probe], {cwd: temporary, stdio: 'inherit'});
} finally {
  rmSync(temporary, {recursive: true, force: true});
}

// Importing the initializer in a classic worker must not evaluate unused URLs.
const classicWorkerBundle = await build({
  stdin: {
    contents:
      "import {initializeTaskWorker} from '@math.gl/core/tasks'; globalThis.initializeTask = initializeTaskWorker;",
    resolveDir: resolve('.'),
    sourcefile: 'classic-task-worker.js'
  },
  bundle: true,
  platform: 'browser',
  format: 'iife',
  write: false,
  logLevel: 'silent'
});
const classicWorkerGlobal = {URL};
runInNewContext(classicWorkerBundle.outputFiles[0].text, classicWorkerGlobal);
assert.equal(typeof classicWorkerGlobal.initializeTask, 'function');
console.log(
  'Packed ESM/CommonJS task exports, removed import paths, provided workers, and classic-worker imports passed.'
);
