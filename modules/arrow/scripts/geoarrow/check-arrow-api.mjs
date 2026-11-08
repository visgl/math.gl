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

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const require = createRequire(import.meta.url);
const directory = mkdtempSync(join(tmpdir(), 'mathgl-geoarrow-'));
try {
  for (const name of ['apache-arrow', 'apache-arrow-18', 'apache-arrow-19', 'apache-arrow-20', 'apache-arrow-current']) {
    const entry = require.resolve(name);
    const version = JSON.parse(readFileSync(resolve(entry, '../package.json'), 'utf8')).version;
    const output = join(directory, `geoarrow-${version}.cjs`);
    const result = await build({
      entryPoints: [join(root, 'modules/arrow/scripts/geoarrow/arrow-conformance.mjs')],
      outfile: output,
      bundle: true, platform: 'node', format: 'cjs', metafile: true,
      alias: {'apache-arrow': entry, '@math.gl/arrow': join(root, 'modules/arrow/src/arrow/index.ts')},
      logLevel: 'silent'
    });
    assert.ok(Object.keys(result.metafile.inputs).every(path => !path.includes('@loaders.gl')));
    // Browser resolution must remain usable without Node globals or polyfills.
    const browserBundle = await build({
      entryPoints: [join(root, 'modules/arrow/src/geoarrow/index.ts')],
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
  for (const name of ['core', 'geometry', 'arrow']) {
    const destination = join(consumer, 'node_modules/@math.gl', name);
    mkdirSync(destination, {recursive: true});
    cpSync(join(root, 'modules', name, 'dist'), join(destination, 'dist'), {recursive: true});
    cpSync(join(root, 'modules', name, 'package.json'), join(destination, 'package.json'));
  }
  const file = join(consumer, 'check.mjs');
  writeFileSync(file, `
    import assert from 'node:assert/strict';
    import {createRequire} from 'node:module';
    import {parseWKT} from '@math.gl/arrow/wkb';
    import {GeoArrowBuilder, getGeoArrowBounds} from '@math.gl/arrow/geoarrow-utils';
    const require = createRequire(import.meta.url);
    assert.throws(() => require.resolve('apache-arrow'), {code:'MODULE_NOT_FOUND'});
    const column = GeoArrowBuilder.build([{type:'Point',coordinates:[1,2]}], {encoding:'geoarrow.point',dimension:'xy'});
    assert.equal(parseWKT('POINT (1 2)').type, 'Point');
    assert.equal(require('@math.gl/arrow/wkb').parseWKT('POINT (1 2)').type, 'Point');
    assert.deepEqual(getGeoArrowBounds(column), [1,2,1,2]);
    assert.deepEqual(require('@math.gl/arrow/geoarrow-utils').getGeoArrowBounds(column), [1,2,1,2]);
    await assert.rejects(import('@math.gl/arrow/geoarrow'), {code:'ERR_MODULE_NOT_FOUND'});
  `);
  execFileSync(process.execPath, [file], {env:{...process.env,NODE_PATH:''},stdio:'inherit'});
  console.log('GeoArrow descriptor ESM/CommonJS consumers work with Arrow absent');
} finally {
  rmSync(directory, {recursive:true,force:true});
}
