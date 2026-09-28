// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Run after `ocular-build proj4` to verify published entry points and tree shaking.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

const packageRoot = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const esm = await import('@math.gl/proj4/experimental');
const cjs = require('@math.gl/proj4/experimental');
for (const {TypeScriptProjection, mercator} of [esm, cjs]) {
  const projection = new TypeScriptProjection({to: 'EPSG:3857', projections: [mercator]});
  assert.deepEqual(projection.project([0, 0]), [0, 0]);
}

for (const useMercator of [false, true]) {
  const result = await build({
    stdin: {
      contents: useMercator
        ? "import {TypeScriptProjection, mercator} from '@math.gl/proj4/experimental'; export const projection = new TypeScriptProjection({to: 'EPSG:3857', projections: [mercator]});"
        : "export {TypeScriptProjection} from '@math.gl/proj4/experimental';",
      resolveDir: packageRoot
    },
    bundle: true,
    // Resolve the published package exports, bypassing monorepo source aliases.
    tsconfigRaw: {},
    format: 'esm',
    platform: 'browser',
    minify: true,
    metafile: true,
    write: false
  });
  assert(
    !Object.keys(result.metafile.inputs).some(path => /node_modules\/proj4\//.test(path)),
    'Experimental entry point must not import proj4js'
  );
  const included = Object.values(result.metafile.outputs).flatMap(output =>
    Object.entries(output.inputs)
      .filter(([, input]) => input.bytesInOutput > 0)
      .map(([path]) => path)
  );
  assert(
    !included.some(path => path.includes('equidistant-cylindrical')),
    'Unused eqc plugin must be removed'
  );
  assert.equal(
    included.some(path => path.endsWith('/projections/mercator.js')),
    useMercator,
    'Mercator must only be included when imported and used'
  );
}
