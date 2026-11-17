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

const root = fileURLToPath(new URL('../../../../../', import.meta.url));
const require = createRequire(import.meta.url);
const directory = mkdtempSync(join(tmpdir(), 'mathgl-geoarrow-'));
try {
  for (const name of ['apache-arrow', 'apache-arrow-18', 'apache-arrow-19', 'apache-arrow-20', 'apache-arrow-current']) {
    const entry = require.resolve(name);
    const version = JSON.parse(readFileSync(resolve(entry, '../package.json'), 'utf8')).version;
    const output = join(directory, `geoarrow-${version}.cjs`);
    const result = await build({
      entryPoints: [join(root, 'modules/core/scripts/arrow/geoarrow/arrow-conformance.mjs')],
      outfile: output,
      bundle: true, platform: 'node', format: 'cjs', metafile: true,
      alias: {'apache-arrow': entry, '@math.gl/core/arrow': join(root, 'modules/core/src/arrow.ts')},
      logLevel: 'silent'
    });
    assert.ok(Object.keys(result.metafile.inputs).every(path => !path.includes('@loaders.gl')));
    // Browser resolution must remain usable without Node globals or polyfills.
    const browserBundle = await build({
      entryPoints: [join(root, 'modules/core/src/arrow-integration/geoarrow/index.ts')],
      bundle: true,
      platform: 'browser',
      format: 'esm',
      write: false,
      metafile: true,
      alias: {'apache-arrow': name},
      logLevel: 'silent'
    });
    assert.doesNotMatch(browserBundle.outputFiles[0].text, /\bBuffer\b/, 'Browser output must not use Node Buffer');
    assert.ok(Object.keys(browserBundle.metafile.inputs).every(path =>
      !/(?:^|\/)node_modules\/(?:buffer|process|stream-browserify|path-browserify|util)\//.test(path)
    ), 'Browser output must not include Node polyfill packages');
    require(output).checkGeoArrowConformance();
    console.log(`GeoArrow adapter: Arrow ${version} passed`);
  }
  const consumer = join(directory, 'consumer');
  for (const name of ['core', 'tasks']) {
    const destination = join(consumer, 'node_modules/@math.gl', name);
    mkdirSync(destination, {recursive: true});
    cpSync(join(root, 'modules', name, 'dist'), join(destination, 'dist'), {recursive: true});
    cpSync(join(root, 'modules', name, 'package.json'), join(destination, 'package.json'));
  }
  const file = join(consumer, 'check.mjs');
  writeFileSync(file, `
    import assert from 'node:assert/strict';
    import {createRequire} from 'node:module';
    const require = createRequire(import.meta.url);
    assert.throws(() => require.resolve('apache-arrow'), {code:'MODULE_NOT_FOUND'});
    for (const subpath of ['', '/matrix', '/color', '/utf8']) {
      await import('@math.gl/core' + subpath);
      require('@math.gl/core' + subpath);
    }
    await assert.rejects(import('@math.gl/core/arrow'), {code:'ERR_MODULE_NOT_FOUND'});
    assert.throws(() => require('@math.gl/core/arrow'), {code:'MODULE_NOT_FOUND'});
  `);
  execFileSync(process.execPath, [file], {env:{...process.env,NODE_PATH:''},stdio:'inherit'});
  const typeConsumer = join(consumer, 'check.mts');
  writeFileSync(typeConsumer, [
    "import {Vector3} from '@math.gl/core/matrix';",
    "import {compileResolvedScale, createColorLUTSampler} from '@math.gl/core/color';",
    "import {parseUTF8Number} from '@math.gl/core/utf8';",
    'void [new Vector3(), compileResolvedScale, createColorLUTSampler, parseUTF8Number];'
  ].join('\n'));
  execFileSync(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), typeConsumer, '--noEmit', '--module', 'nodenext', '--moduleResolution', 'nodenext', '--target', 'esnext', '--lib', 'esnext,dom', '--strict'], {cwd: consumer, stdio: 'inherit'});
  console.log('Core root/matrix/color/utf8 ESM/CommonJS consumers work with Arrow absent');
} finally {
  rmSync(directory, {recursive:true,force:true});
}
