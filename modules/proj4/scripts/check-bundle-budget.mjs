// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {build} from 'esbuild';

const fixtures = {
  core: "export {ProjectionEngine} from '@math.gl/proj4';",
  mercator:
    "import {ProjectionEngine, mercator} from '@math.gl/proj4'; export const create = () => new ProjectionEngine({to: 'EPSG:3857', projections: [mercator]});",
  utm: "import {ProjectionEngine, universalTransverseMercator} from '@math.gl/proj4'; export const create = () => new ProjectionEngine({to: 'EPSG:32631', projections: [universalTransverseMercator]});",
  mercatorWithWKT:
    "import {ProjectionEngine, mercator, wktCRSParser} from '@math.gl/proj4'; export const create = to => new ProjectionEngine({to, projections: [mercator], parsers: [wktCRSParser]});",
  mercatorWithPROJJSON:
    "import {ProjectionEngine, mercator, projJSONCRSParser} from '@math.gl/proj4'; export const create = to => new ProjectionEngine({to, projections: [mercator], parsers: [projJSONCRSParser]});",
  mercatorWithNTv2:
    "import {ProjectionEngine, mercator} from '@math.gl/proj4'; export {parseNTv2Grid} from '@math.gl/proj4'; export const create = (from, datumGrids) => new ProjectionEngine({from, to: 'EPSG:3857', projections: [mercator], datumGrids});",
  mercatorWithGeoTIFFAdapter:
    "import {ProjectionEngine, mercator} from '@math.gl/proj4'; export {loadGeoTIFFGrid} from '@math.gl/proj4'; export const create = (from, datumGrids) => new ProjectionEngine({from, to: 'EPSG:3857', projections: [mercator], datumGrids});",
  mercatorWithGTX:
    "import {ProjectionEngine, mercator} from '@math.gl/proj4'; export {parseGTXGrid} from '@math.gl/proj4/grids/gtx'; export const create = (from, verticalGrids) => new ProjectionEngine({from, to: 'EPSG:3857', projections: [mercator], verticalGrids});",
  mercatorWithVerticalGeoTIFF:
    "import {ProjectionEngine, mercator} from '@math.gl/proj4'; export {loadVerticalGeoTIFFGrid} from '@math.gl/proj4/grids/vertical-geotiff'; export const create = (from, verticalGrids) => new ProjectionEngine({from, to: 'EPSG:3857', projections: [mercator], verticalGrids});",
  operationPipeline: "export {ProjectionPipeline} from '@math.gl/proj4/pipeline';",
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
