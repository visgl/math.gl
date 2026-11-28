// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Checks the built `@math.gl/earth/ocean` entry: ESM and CommonJS imports, strict public
// types for both module systems, a dependency boundary and a byte budget.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const require = createRequire(import.meta.url);
const toolsRequire = createRequire(require.resolve('@vis.gl/dev-tools'));
const {build} = toolsRequire('esbuild');

for (const load of [specifier => import(specifier), specifier => require(specifier)]) {
  const ocean = await load('@math.gl/earth/ocean');
  assert.equal(ocean.getSoundSpeedMackenzie(35, 25, 1000).toFixed(7), '1550.7440275');
  assert.equal(ocean.getReferenceSalinity(35), 35.16504);
  assert.throws(() => ocean.getSeawaterDensity(35, 10, Number.NaN), RangeError);
}

const directory = mkdtempSync(join(tmpdir(), 'mathgl-ocean-package-'));
try {
  const scope = join(directory, 'node_modules/@math.gl');
  mkdirSync(scope, {recursive: true});
  symlinkSync(join(root, 'modules/earth'), join(scope, 'earth'));
  symlinkSync(join(root, 'modules/core'), join(scope, 'core'));
  writeFileSync(join(directory, 'package.json'), '{"type":"module"}');
  for (const extension of ['ts', 'cts']) {
    writeFileSync(join(directory, `consumer.${extension}`), readFileSync(join(root, `test/types/ocean/index.${extension}`)));
  }
  writeFileSync(
    join(directory, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'es2020',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        strict: true,
        noEmit: true,
        skipLibCheck: false,
        types: []
      },
      include: ['consumer.ts', 'consumer.cts']
    })
  );
  execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '--project', join(directory, 'tsconfig.json')], {
    stdio: 'inherit'
  });

  const budgets = [
    // The full subpath: Gibbs function, 75-term polynomial, the classic equations, tide
    // prediction and the CTD functions (19 730 bytes measured with the CTD functions).
    {source: "export * from '@math.gl/earth/ocean';", bytes: 21800},
    // A classic equation alone must not pull in the TEOS-10 tables.
    {source: "export {getSoundSpeedMackenzie} from '@math.gl/earth/ocean';", bytes: 600, forbidden: /gibbs-function|specific-volume/},
    {source: "export {getSoundAbsorptionFrancoisGarrison} from '@math.gl/earth/ocean';", bytes: 1000, forbidden: /gibbs-function|specific-volume/},
    // Density and sound speed need the 75-term polynomial, not the Gibbs function.
    {source: "export {getSeawaterSoundSpeed} from '@math.gl/earth/ocean';", bytes: 4000, forbidden: /gibbs-function/},
    // Tide prediction is independent of the seawater state.
    {source: "export {getTideHeight} from '@math.gl/earth/ocean';", bytes: 4600, forbidden: /gibbs-function|specific-volume|seawater-state|sound-/},
    // PSS-78 conductivity conversion is pure rational algebra and needs neither TEOS-10 table.
    {source: "export {getPracticalSalinityFromConductivity} from '@math.gl/earth/ocean';", bytes: 1900, forbidden: /gibbs-function|specific-volume/},
    // Control: Conservative Temperature must keep the Gibbs function, so the boundary checks can fail.
    {source: "export {getConservativeTemperature} from '@math.gl/earth/ocean';", bytes: 9000, required: /gibbs-function/}
  ];
  const report = [];
  for (const {source, bytes, forbidden, required} of budgets) {
    const result = await build({
      stdin: {contents: source, resolveDir: root, loader: 'js'},
      bundle: true,
      minify: true,
      write: false,
      format: 'esm',
      platform: 'browser',
      metafile: true
    });
    const code = result.outputFiles[0].contents;
    // Count only the files that reach the output; esbuild also lists files it tree-shakes away.
    const [output] = Object.values(result.metafile.outputs);
    const inputs = Object.entries(output.inputs)
      .filter(([input, {bytesInOutput}]) => input !== '<stdin>' && bytesInOutput > 0)
      .map(([input]) => input);
    assert.ok(inputs.every(input => input.includes('modules/earth/dist/ocean/')), `${source}: imports outside the ocean entry: ${inputs}`);
    if (forbidden) {
      assert.ok(!inputs.some(input => forbidden.test(input)), `${source}: retained ${inputs.filter(input => forbidden.test(input))}`);
    }
    if (required) {
      assert.ok(inputs.some(input => required.test(input)), `${source}: expected ${required} in the bundle`);
    }
    assert.ok(code.byteLength <= bytes, `${source}: ${code.byteLength} bytes exceeds ${bytes}`);
    report.push({source, bytes: code.byteLength, gzip: gzipSync(code, {level: 9}).length});
  }
  console.log(JSON.stringify({exports: 'ESM/CJS and strict public types passed', budgets: report}, null, 1));
} finally {
  rmSync(directory, {recursive: true, force: true});
}
