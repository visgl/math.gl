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
import * as tasks from '@math.gl/tasks';
const require = createRequire(import.meta.url);
const expected = ['TaskRunner', 'createTypedTaskDispatcher', 'initializeTaskWorker', 'preloadTasks'];
for (const api of [tasks, require('@math.gl/tasks')]) {
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
    if (!['tasks', 'geospatial'].includes(name))
      symlinkSync(join(root, 'node_modules/@math.gl', name), join(modules, '@math.gl', name));
  }
  for (const name of ['tasks', 'geospatial']) {
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
  const worker = join(temporary, 'task-worker.cjs');
  writeFileSync(worker, `
const {initializeTaskWorker} = require('@math.gl/tasks');
initializeTaskWorker({
  id: 'packed-cjs-worker',
  process: ({values}) => ({values: values.map(value => value * 2)}),
  async *processInBatches(inputs) {
    for await (const {values} of inputs) yield {values: values.map(value => value * 3)};
  }
});
`);
  const probe = join(temporary, 'probe.mjs');
  writeFileSync(
    probe,
    `
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import * as tasks from '@math.gl/tasks';
import * as geospatial from '@math.gl/geospatial/tasks';
const require = createRequire(import.meta.url);
for (const api of [tasks, require('@math.gl/tasks')]) assert.deepEqual(Object.keys(api).sort(), ${JSON.stringify(expected)});
for (const api of [geospatial, require('@math.gl/geospatial/tasks')]) assert.deepEqual(Object.keys(api).sort(), ['CertifyTerrainCoverageTask', 'PrepareMapTask', 'ProjectCoordinatesTask']);
for (const api of [tasks, require('@math.gl/tasks')]) {
  const runner = new api.TaskRunner();
  const task = {
    id: 'packed-cjs-worker',
    process: input => input,
    async *processInBatches(inputs) {yield* inputs;},
    worker: {url: new URL('./task-worker.cjs', import.meta.url), capabilities: {atomic: true, streaming: true}}
  };
  try {
    assert.deepEqual(await runner.runTask(task, {values: [1, 2]}, {execution: 'worker'}), {values: [2, 4]});
    const batches = [];
    for await (const batch of runner.runTaskInBatches(task, [{values: [3]}], {execution: 'worker'})) batches.push(batch);
    assert.deepEqual(batches, [{values: [9]}]);
  } finally {await runner.close();}
}
for (const path of ['@math.gl/tasks/worker-utils', '@math.gl/tasks/tasks/run-task', '@math.gl/tasks/dist/worker-utils/index.js', '@math.gl/tasks/src/worker-utils/index.ts', '@math.gl/core/tasks', '@math.gl/geospatial/workers', '@math.gl/geospatial/workers/operations', '@math.gl/geospatial/dist/workers/index.js']) {
  await assert.rejects(import(path), {code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'});
  assert.throws(() => require(path), {code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'});
}
for (const [api, provided] of [[tasks, geospatial], [require('@math.gl/tasks'), require('@math.gl/geospatial/tasks')]]) {
  await api.preloadTasks([provided.ProjectCoordinatesTask, provided.PrepareMapTask]);
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
      "import {initializeTaskWorker} from '@math.gl/tasks'; globalThis.initializeTask = initializeTaskWorker;",
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
