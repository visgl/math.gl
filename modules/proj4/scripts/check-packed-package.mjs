// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Exercise actual npm tarballs in a temporary consumer, with no workspace source aliases.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, symlinkSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const temporary = mkdtempSync(join(tmpdir(), 'math-gl-proj4-packed-'));
function run(command, args, cwd = temporary) {
  return execFileSync(command, args, {cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
}
try {
  for (const name of ['types', 'core', 'crs', 'proj4']) {
    const [manifest] = JSON.parse(
      run(
        'npm',
        ['pack', '--ignore-scripts', '--json', '--pack-destination', temporary],
        join(root, 'modules', name)
      )
    );
    const directory = join(temporary, 'node_modules', '@math.gl', name);
    mkdirSync(directory, {recursive: true});
    run('tar', [
      '-xzf',
      join(temporary, manifest.filename),
      '--strip-components=1',
      '-C',
      directory
    ]);
  }
  // Only the unmodified third-party dependency uses the already installed package and its dependencies.
  symlinkSync(join(root, 'node_modules', 'proj4'), join(temporary, 'node_modules', 'proj4'), 'dir');
  for (const name of ['PROJ4-LICENSE.md', 'APACHE-2.0-LICENSE.txt', 'THIRD-PARTY-NOTICES.md']) {
    assert(readFileSync(join(temporary, 'node_modules/@math.gl/proj4', name), 'utf8').length > 100);
  }
  const packageManifest = JSON.parse(
    readFileSync(join(root, 'modules/proj4/package.json'), 'utf8')
  );
  const subpaths = Object.keys(packageManifest.exports).filter(path =>
    path.startsWith('./experimental/')
  );
  // Enumerate the manifest so every newly supported subpath must work in a real tarball.
  const entrySmoke = `
    const subpaths = ${JSON.stringify(subpaths)};
    for (const subpath of subpaths) {
      const entry = await load('@math.gl/proj4' + subpath.slice(1));
      assert(Object.keys(entry).length > 0, subpath);
      for (const [name, value] of Object.entries(entry)) {
        assert(name in api, 'Unexpected public export: ' + name);
        assert.equal(typeof value, typeof api[name]);
        if (value && typeof value === 'object' && 'create' in value) assert.equal(value.name, api[name].name);
      }
    }
    const core = await load('@math.gl/proj4/experimental/core');
    const {universalTransverseMercator} = await load('@math.gl/proj4/experimental/projections/utm');
    const utm = new core.TypeScriptProjection({to: 'EPSG:32631', projections: [universalTransverseMercator]});
    assert(Math.abs(utm.project([3, 0])[0] - 500000) < 1e-7);
    const {wktCRSParser} = await load('@math.gl/proj4/experimental/parsers/wkt');
    const unsupported = 'PROJCS["Unsupported",GEOGCS["WGS84",DATUM["WGS_1984",SPHEROID["WGS84",6378137,298.257223563]],UNIT["degree",0.017453292519943295]],PROJECTION["Unimplemented"],UNIT["metre",1]]';
    assert.equal(core.checkTypeScriptCRSCompatibility(unsupported, {parsers: [wktCRSParser]}).reason, 'missing-transform-stage');
    assert.throws(() => core.normalizeCRS(unsupported, {parsers: [wktCRSParser]}), error =>
      error instanceof core.TypeScriptCRSError && error instanceof api.TypeScriptCRSError);
    assert(!(new Error('unbranded') instanceof core.TypeScriptCRSError));
    class CustomError extends core.TypeScriptCRSError {}
    assert(new CustomError('invalid-definition', 'custom') instanceof api.TypeScriptCRSError);
    assert(!(new core.TypeScriptCRSError('invalid-definition', 'base') instanceof CustomError));
    const {parseWKTCRS} = await load('@math.gl/crs/wkt');
    const {parsePROJString} = await load('@math.gl/crs/proj-string');
    const {inferCRSRepresentation} = await load('@math.gl/crs/spatial-reference');
    assert.equal(typeof parseWKTCRS, 'function');
    assert.equal(typeof parsePROJString, 'function');
    assert.equal(inferCRSRepresentation('EPSG:4326'), 'identifier');
  `;
  const smoke = `
    const projection = new api.TypeScriptProjection({to: 'EPSG:3857', projections: [api.mercator]});
    const input = new Float64Array([12, 48, 123, 7]);
    const scalar = projection.project(Array.from(input));
    assert.equal(projection.projectFlat(input, 4), input);
    assert.deepEqual(Array.from(input), scalar);
    projection.unprojectFlat(input, 4);
    assert(Math.abs(input[0] - 12) < 1e-10);
    assert(Math.abs(input[1] - 48) < 1e-10);
    assert.equal(input[2], 123);
    assert.equal(input[3], 7);
    assert(new wrapper.Proj4Projection({to: 'EPSG:3857'}).project([0,0]).every(value => Math.abs(value) < 1e-8));
  `;
  writeFileSync(
    join(temporary, 'smoke.mjs'),
    "import assert from 'node:assert/strict'; import * as api from '@math.gl/proj4/experimental'; import * as wrapper from '@math.gl/proj4';\n" +
      smoke +
      '\nconst load = specifier => import(specifier);\n' +
      entrySmoke
  );
  writeFileSync(
    join(temporary, 'smoke.cjs'),
    "const assert = require('node:assert/strict'); const api = require('@math.gl/proj4/experimental'); const wrapper = require('@math.gl/proj4');\n" +
      smoke +
      '\nconst load = specifier => Promise.resolve(require(specifier));\n(async () => {' +
      entrySmoke +
      '})().catch(error => {console.error(error); process.exitCode = 1;});'
  );
  run(process.execPath, ['smoke.mjs']);
  run(process.execPath, ['smoke.cjs']);
  writeFileSync(join(temporary, 'package.json'), '{"type":"module"}');
  writeFileSync(
    join(temporary, 'consumer.ts'),
    `
    ${subpaths.map((path, index) => 'import * as entry' + index + " from '@math.gl/proj4" + path.slice(1) + "';\nvoid entry" + index + ';').join('\n')}
    import {TypeScriptProjection, type ProjectionPoint} from '@math.gl/proj4/experimental/core';
    import {mercator} from '@math.gl/proj4/experimental/projections/merc';
    import {parseWKTCRS} from '@math.gl/crs/wkt';
    import {parsePROJString} from '@math.gl/crs/proj-string';
    import {inferCRSRepresentation} from '@math.gl/crs/spatial-reference';
    void [parseWKTCRS, parsePROJString, inferCRSRepresentation];
    const projection = new TypeScriptProjection({to: 'EPSG:3857', projections: [mercator]});
    const a: Float32Array = projection.projectFlat(new Float32Array([1, 2]));
    const b: Float64Array = projection.unprojectFlat(new Float64Array([1, 2]));
    const point: ProjectionPoint = {x: 0, y: 0, z: 0};
    // @ts-expect-error Integer buffers are not supported.
    projection.projectFlat(new Int32Array([1, 2]));
  `
  );
  writeFileSync(
    join(temporary, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        strict: true,
        skipLibCheck: false,
        noEmit: true,
        types: []
      },
      files: ['consumer.ts']
    })
  );
  run(process.execPath, [
    join(root, 'node_modules/typescript/bin/tsc'),
    '--project',
    'tsconfig.json'
  ]);
  // A CommonJS TypeScript consumer must also resolve each declaration condition.
  writeFileSync(join(temporary, 'consumer.cts'), readFileSync(join(temporary, 'consumer.ts')));
  const configPath = join(temporary, 'tsconfig.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  config.files = ['consumer.cts'];
  writeFileSync(configPath, JSON.stringify(config));
  run(process.execPath, [
    join(root, 'node_modules/typescript/bin/tsc'),
    '--project',
    'tsconfig.json'
  ]);
  console.log(
    'Packed proj4 ESM, CommonJS, all subpath declarations, typed-array API and licenses passed'
  );
} catch (error) {
  if (error.stdout) console.error(error.stdout.toString());
  if (error.stderr) console.error(error.stderr.toString());
  throw error;
} finally {
  rmSync(temporary, {recursive: true, force: true});
}
