// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const require = createRequire(import.meta.url);
const directory = mkdtempSync(join(tmpdir(), 'mathgl-arrow-'));
try {
  const probes = [];
  for (const packageName of ['apache-arrow', 'apache-arrow-18', 'apache-arrow-19', 'apache-arrow-20', 'apache-arrow-current']) {
    const entry = require.resolve(packageName);
    const version = JSON.parse(readFileSync(resolve(entry, '../package.json'), 'utf8')).version;
    const output = join(directory, `arrow-${version}.cjs`);
    const result = await build({
      entryPoints: [join(root, 'modules/arrow/scripts/arrow-conformance.mjs')],
      outfile: output,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      alias: {'apache-arrow': entry},
      metafile: true,
      logLevel: 'silent'
    });
    assert.ok(Object.keys(result.metafile.inputs).every(path => !path.includes('@loaders.gl') && !path.includes('/loaders.gl/')), 'Arrow utilities must not import loaders.gl');
    // Browser resolution must remain usable without Node globals or polyfills.
    const browserBundle = await build({
      entryPoints: [join(root, 'modules/arrow/src/arrow/index.ts')],
      bundle: true,
      platform: 'browser',
      format: 'esm',
      write: false,
      metafile: true,
      alias: {'apache-arrow': packageName},
      logLevel: 'silent'
    });
    assert.doesNotMatch(browserBundle.outputFiles[0].text, /\bBuffer\b/, 'Browser output must not use Node Buffer');
    assert.ok(Object.keys(browserBundle.metafile.inputs).every(path =>
      !/(?:^|\/)node_modules\/(?:buffer|process|stream-browserify|path-browserify|util)\//.test(path)
    ), 'Browser output must not include Node polyfill packages');
    const probe = require(output);
    probes.push({probe, bytes: probe.checkArrowConformance()});
    console.log(`Arrow ${version}: views, schemas, copying, hydration and IPC passed`);
  }
  for (const producer of probes) {
    for (const consumer of probes) consumer.probe.checkArrowIPC(producer.bytes);
  }
  console.log(`${probes.length ** 2} cross-version IPC combinations passed`);

  // Published independent subpaths must work with Apache Arrow absent.
  const consumerRoot = join(directory, 'consumer');
  for (const name of ['core', 'geometry', 'arrow']) {
    const destination = join(consumerRoot, 'node_modules/@math.gl', name);
    mkdirSync(destination, {recursive: true});
    cpSync(join(root, 'modules', name, 'dist'), join(destination, 'dist'), {recursive: true});
    cpSync(join(root, 'modules', name, 'package.json'), join(destination, 'package.json'));
  }
  const packageRoot = join(consumerRoot, 'node_modules/@math.gl/arrow');
  const source = `
    import assert from 'node:assert/strict';
    import {createRequire} from 'node:module';
    import {Vector3} from '@math.gl/core';
    import {parseUTF8Number} from '@math.gl/arrow/utf8';
    const require = createRequire(import.meta.url);
    assert.throws(() => require.resolve('apache-arrow'), {code: 'MODULE_NOT_FOUND'});
    assert.equal(new Vector3(1, 2, 3).length, 3);
    assert.equal(require('@math.gl/arrow/utf8').parseUTF8Number(new Uint8Array([49]), 0, 1), 1);
    assert.equal(parseUTF8Number(new Uint8Array([49]), 0, 1), 1);
    assert.equal(new (require('@math.gl/core').Vector3)(1, 2, 3).length, 3);
    await assert.rejects(import('@math.gl/arrow'), {code: 'ERR_MODULE_NOT_FOUND'});
    assert.throws(() => require('@math.gl/arrow'), {code: 'MODULE_NOT_FOUND'});
  `;
  const consumer = join(consumerRoot, 'consumer.mjs');
  writeFileSync(consumer, source);
  execFileSync(process.execPath, [consumer], {env: {...process.env, NODE_PATH: ''}, stdio: 'inherit'});
  const metadata = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
  assert.equal(metadata.peerDependencies['apache-arrow'], '>=17.0.0');
  assert.equal(metadata.peerDependenciesMeta['apache-arrow'].optional, true);
  assert.equal(metadata.dependencies?.['apache-arrow'], undefined);
  console.log('Core and Arrow-independent subpaths work with Arrow absent');
} finally {
  rmSync(directory, {recursive: true, force: true});
}
