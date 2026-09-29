// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {build} from 'esbuild';

const fixtures = {
  core: "export {TypeScriptProjection} from '@math.gl/proj4/experimental';",
  mercator:
    "import {TypeScriptProjection, mercator} from '@math.gl/proj4/experimental'; export const create = () => new TypeScriptProjection({to: 'EPSG:3857', projections: [mercator]});",
  utm: "import {TypeScriptProjection, universalTransverseMercator} from '@math.gl/proj4/experimental'; export const create = () => new TypeScriptProjection({to: 'EPSG:32631', projections: [universalTransverseMercator]});",
  allNativeExports: "export * from '@math.gl/proj4/experimental';",
  proj4Wrapper: "export {Proj4Projection} from '@math.gl/proj4';"
};
const budgets = process.argv.includes('--measure')
  ? null
  : JSON.parse(
      readFileSync(new URL('../test/fixtures/bundle-budgets.json', import.meta.url), 'utf8')
    );
const measurements = {};
for (const [name, contents] of Object.entries(fixtures)) {
  const result = await build({
    stdin: {contents, resolveDir: fileURLToPath(new URL('../', import.meta.url))},
    bundle: true,
    tsconfigRaw: {},
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    minify: true,
    write: false
  });
  const bytes = result.outputFiles[0].contents;
  measurements[name] = {minified: bytes.length, gzip: gzipSync(bytes, {level: 9}).length};
  if (budgets)
    for (const metric of ['minified', 'gzip']) {
      assert(
        measurements[name][metric] <= budgets.limits[name][metric],
        `${name} ${metric}: ${measurements[name][metric]} exceeds budget ${budgets.limits[name][metric]}`
      );
    }
}
console.log(JSON.stringify(measurements, null, 2));
