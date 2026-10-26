// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = mkdtempSync(join(tmpdir(), 'mathgl-terrain-package-'));
const require = createRequire(import.meta.url);
try {
  const target = join(directory, 'node_modules/@math.gl/geospatial');
  mkdirSync(target, {recursive: true});
  for (const file of ['package.json', 'dist', 'src/terrain/vendor']) {
    cpSync(join(root, 'modules/geospatial', file), join(target, file), {recursive: true});
  }
  const martini = join(directory, 'node_modules/@mapbox/martini');
  cpSync(dirname(require.resolve('@mapbox/martini')), martini, {recursive: true});
  assert(readFileSync(join(target, 'src/terrain/vendor/DELATIN-LICENSE.txt'), 'utf8').includes('Permission to use'));
  writeFileSync(join(directory, 'package.json'), '{"type":"module"}');
  const body = `
const field = new HeightField({width: 3, height: 3, heights: new Float64Array(9)});
const mesh = create(field, {maxError: 0});
if (mesh.error.maxSampleError !== 0 || mesh.indices.length !== 6) throw new Error('Invalid terrain result');
`;
  for (const [backend, symbol] of [['martini', 'createMartiniTerrainMesh'], ['delatin', 'createDelatinTerrainMesh']]) {
    const esm = `import {HeightField} from '@math.gl/geospatial/terrain';\nimport {${symbol} as create} from '@math.gl/geospatial/terrain/${backend}';\n${body}`;
    const cjs = `const {HeightField} = require('@math.gl/geospatial/terrain');\nconst {${symbol}: create} = require('@math.gl/geospatial/terrain/${backend}');\n${body}`;
    for (const [ext, contents] of [['mjs', esm], ['cjs', cjs], ['ts', esm]]) {
      const path = join(directory, `consumer.${ext}`);
      writeFileSync(path, contents);
      if (ext === 'ts') execFileSync(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '--noEmit', '--strict', '--skipLibCheck', '--module', 'nodenext', '--target', 'es2020', path], {stdio: 'inherit', cwd: directory});
      else execFileSync(process.execPath, [path], {stdio: 'pipe'});
    }
    // The next Delatin consumer runs with MARTINI and every other math.gl package absent.
    rmSync(martini, {recursive: true, force: true});
  }
  console.log('Isolated terrain ESM/CommonJS execution, strict declarations and backend independence passed.');
} finally {
  rmSync(directory, {recursive: true, force: true});
}
