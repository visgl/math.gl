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
      smoke
  );
  writeFileSync(
    join(temporary, 'smoke.cjs'),
    "const assert = require('node:assert/strict'); const api = require('@math.gl/proj4/experimental'); const wrapper = require('@math.gl/proj4');\n" +
      smoke
  );
  run(process.execPath, ['smoke.mjs']);
  run(process.execPath, ['smoke.cjs']);
  writeFileSync(join(temporary, 'package.json'), '{"type":"module"}');
  writeFileSync(
    join(temporary, 'consumer.ts'),
    `
    import {TypeScriptProjection, mercator, type ProjectionPoint} from '@math.gl/proj4/experimental';
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
  console.log('Packed proj4 ESM, CommonJS, declarations, typed-array API and licenses passed');
} catch (error) {
  if (error.stdout) console.error(error.stdout.toString());
  if (error.stderr) console.error(error.stderr.toString());
  throw error;
} finally {
  rmSync(temporary, {recursive: true, force: true});
}
