// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
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
  for (const name of ['core', 'geometry', 'web-mercator']) {
    symlinkSync(join(root, 'modules', name), join(directory, 'node_modules/@math.gl', name), 'dir');
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
    const esm = `import {HeightField} from '@math.gl/geospatial/terrain';\nimport {${symbol} as create} from '@math.gl/geospatial/terrain';\n${body}`;
    const cjs = `const {HeightField} = require('@math.gl/geospatial/terrain');\nconst {${symbol}: create} = require('@math.gl/geospatial/terrain');\n${body}`;
    for (const [ext, contents] of [['mjs', esm], ['cjs', cjs], ['ts', esm]]) {
      const path = join(directory, `consumer.${ext}`);
      writeFileSync(path, contents);
      if (ext === 'ts') execFileSync(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '--noEmit', '--strict', '--skipLibCheck', '--module', 'nodenext', '--target', 'es2020', path], {stdio: 'inherit', cwd: directory});
      else execFileSync(process.execPath, [path], {stdio: 'pipe'});
    }
    // Both backends are named exports of the terrain root.

  }
  // Analysis APIs share the terrain root; tree-shaking is checked separately.
  for (const [entry, symbol, expression] of [
    ['derivatives', 'createTerrainGradientGrid', 'create(field).gradients.length === 18'],
    ['slope-aspect', 'getTerrainSlopeAspect', 'create(1, 0).slope === Math.PI / 4'],
    ['profile', 'sampleTerrainProfile', 'create((x: number, y: number) => field.sample(x, y), [0, 0, 2, 0], {spacing: 1}).heights.length === 3'],
    ['contours', 'createTerrainContours', 'create(field, [0]).segments.length === 0'],
    ['contour-paths', 'stitchTerrainContours', "create({positions:new Float64Array(),gridCoordinates:new Float64Array(),segments:new Uint32Array(),levelIndices:new Uint32Array(),levels:new Float64Array(),origin:[0,0,0],heightReference:'unknown'}).offsets.length === 1"],
    ['contour-simplify', 'simplifyTerrainContourPaths', "create({positions:new Float64Array(),gridCoordinates:new Float64Array(),indices:new Uint32Array(),offsets:Uint32Array.from([0]),closed:new Uint8Array(),levelIndices:new Uint32Array(),levels:new Float64Array(),origin:[0,0,0],heightReference:'unknown'},{maxError:0}).indices.length === 0"],
    ['vertex-tiles', 'reconcileTerrainVertexTiles', 'create([{column:0,row:0,heights:new Float64Array(9)}],{width:3,height:3}).tiles.length === 1'],
    ['mesh-stitch', 'stitchTerrainMeshEdges', "create({positions:Float64Array.from([0,0,0,1,0,0,0,1,0,1,1,0]),indices:Uint32Array.from([0,1,3,0,3,2]),gridCoordinates:Uint32Array.from([0,0,1,0,0,1,1,1]),width:2,height:2,origin:[0,0,0],heightReference:'unknown'},'maxColumn',{positions:Float64Array.from([1,0,0,2,0,0,1,1,0,2,1,0]),indices:Uint32Array.from([0,1,3,0,3,2]),gridCoordinates:Uint32Array.from([0,0,1,0,0,1,1,1]),width:2,height:2,origin:[0,0,0],heightReference:'unknown'},'minColumn').seamA.length === 2"],
    ['profile-measure', 'measureTerrainProfile', 'create({positions:new Float64Array(2),distances:new Float64Array(1),heights:new Float64Array(1),statuses:new Uint8Array(1),length:0}).complete']
  ]) {
    const imports = `import {HeightField} from '@math.gl/geospatial/terrain';\nimport {${symbol} as create} from '@math.gl/geospatial/terrain';`;
    const assertion = `const field = new HeightField({width:3,height:3,heights:new Float64Array(9)}); if (!(${expression})) throw new Error('Invalid analysis result');`;
    const source = imports + '\n' + assertion;
    const path = join(directory, 'analysis.ts'); writeFileSync(path, source);
    execFileSync(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '--noEmit', '--strict', '--skipLibCheck', '--module', 'nodenext', '--target', 'es2020', path], {stdio: 'inherit', cwd: directory});
    writeFileSync(join(directory, 'analysis.mjs'), source.replaceAll(': number', ''));
    execFileSync(process.execPath, [join(directory, 'analysis.mjs')]);
    const cjs = `const {HeightField} = require('@math.gl/geospatial/terrain'); const {${symbol}: create} = require('@math.gl/geospatial/terrain');` + assertion.replaceAll(': number', '');
    writeFileSync(join(directory, 'analysis.cjs'), cjs); execFileSync(process.execPath, [join(directory, 'analysis.cjs')]);
  }
  const skirtSource = `import {createTerrainSkirt} from '@math.gl/geospatial/terrain';
const result = createTerrainSkirt({positions:new Float64Array([0,0,1,1,0,1,0,1,1]),indices:new Uint16Array([0,1,2])},{height:1});
if (result.indices.length !== 21 || result.triangleValidity[1] !== 0) throw new Error('Invalid terrain skirt result');`;
  const skirtPath = join(directory, 'skirt.ts'); writeFileSync(skirtPath, skirtSource);
  execFileSync(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '--noEmit', '--strict', '--skipLibCheck', '--module', 'nodenext', '--target', 'es2020', skirtPath], {stdio:'inherit', cwd:directory});
  writeFileSync(join(directory, 'skirt.mjs'), skirtSource); execFileSync(process.execPath, [join(directory, 'skirt.mjs')]);
  writeFileSync(join(directory, 'skirt.cjs'), skirtSource.replace("import {createTerrainSkirt} from '@math.gl/geospatial/terrain';", "const {createTerrainSkirt} = require('@math.gl/geospatial/terrain');"));
  execFileSync(process.execPath, [join(directory, 'skirt.cjs')]);
  console.log('Isolated terrain ESM/CommonJS execution, strict declarations and root exports passed.');
} finally {
  rmSync(directory, {recursive: true, force: true});
}
