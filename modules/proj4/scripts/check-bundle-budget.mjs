// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {build} from 'esbuild';

const fixtures = {
  core: "export {TypeScriptProjection} from '@math.gl/proj4';",
  mercator:
    "import {TypeScriptProjection, mercator} from '@math.gl/proj4'; export const create = () => new TypeScriptProjection({to: 'EPSG:3857', projections: [mercator]});",
  utm: "import {TypeScriptProjection, universalTransverseMercator} from '@math.gl/proj4'; export const create = () => new TypeScriptProjection({to: 'EPSG:32631', projections: [universalTransverseMercator]});",
  mercatorWithWKT:
    "import {TypeScriptProjection, mercator, wktCRSParser} from '@math.gl/proj4'; export const create = to => new TypeScriptProjection({to, projections: [mercator], parsers: [wktCRSParser]});",
  mercatorWithPROJJSON:
    "import {TypeScriptProjection, mercator, projJSONCRSParser} from '@math.gl/proj4'; export const create = to => new TypeScriptProjection({to, projections: [mercator], parsers: [projJSONCRSParser]});",
  mercatorWithNTv2:
    "import {TypeScriptProjection, mercator} from '@math.gl/proj4'; export {parseNTv2Grid} from '@math.gl/proj4'; export const create = (from, datumGrids) => new TypeScriptProjection({from, to: 'EPSG:3857', projections: [mercator], datumGrids});",
  mercatorWithGeoTIFFAdapter:
    "import {TypeScriptProjection, mercator} from '@math.gl/proj4'; export {loadGeoTIFFGrid} from '@math.gl/proj4'; export const create = (from, datumGrids) => new TypeScriptProjection({from, to: 'EPSG:3857', projections: [mercator], datumGrids});",
  typescriptWrapper: "export {Projection} from '@math.gl/proj4';",
  allNativeExports: "export * from '@math.gl/proj4';",
  proj4Wrapper: "export {Proj4Projection} from '@math.gl/proj4/classic';"
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
