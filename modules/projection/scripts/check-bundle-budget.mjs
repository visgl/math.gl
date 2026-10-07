// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {build} from 'esbuild';

const fixtures = {
  temporalModel: "export * from '@math.gl/projection/temporal';",
  projectionBulk: "export * from '@math.gl/projection/bulk';",
  projectionAnalysis: "export * from '@math.gl/projection/analysis';",
  core: "export {ProjectionTransform} from '@math.gl/projection/core';",
  rootEngine: "export {ProjectionTransform} from '@math.gl/projection';",
  coreWithDatumCatalog:
    "import {ProjectionTransform} from '@math.gl/projection/core'; import {datumCatalog} from '@math.gl/projection/datums'; export const create = from => new ProjectionTransform({from, datumCatalogs: [datumCatalog]});",
  mercatorWithDatumCatalog:
    "import {ProjectionTransform} from '@math.gl/projection/core'; import {mercator} from '@math.gl/projection/projections/merc'; import {datumCatalog} from '@math.gl/projection/datums'; export const create = from => new ProjectionTransform({from, to: 'EPSG:3857', projections: [mercator], datumCatalogs: [datumCatalog]});",
  mercator:
    "import {ProjectionTransform, mercator} from '@math.gl/projection'; export const create = () => new ProjectionTransform({to: 'EPSG:3857', projections: [mercator]});",
  utm: "import {ProjectionTransform, universalTransverseMercator} from '@math.gl/projection'; export const create = () => new ProjectionTransform({to: 'EPSG:32631', projections: [universalTransverseMercator]});",
  mercatorWithWKT:
    "import {ProjectionTransform, mercator, wktCRSParser} from '@math.gl/projection'; export const create = to => new ProjectionTransform({to, projections: [mercator], parsers: [wktCRSParser]});",
  mercatorWithPROJJSON:
    "import {ProjectionTransform, mercator, projJSONCRSParser} from '@math.gl/projection'; export const create = to => new ProjectionTransform({to, projections: [mercator], parsers: [projJSONCRSParser]});",
  mercatorWithNTv2:
    "import {ProjectionTransform, mercator} from '@math.gl/projection'; export {parseNTv2Grid} from '@math.gl/projection'; export const create = (from, datumGrids) => new ProjectionTransform({from, to: 'EPSG:3857', projections: [mercator], datumGrids});",
  mercatorWithGeoTIFFAdapter:
    "import {ProjectionTransform, mercator} from '@math.gl/projection'; export {loadGeoTIFFGrid} from '@math.gl/projection'; export const create = (from, datumGrids) => new ProjectionTransform({from, to: 'EPSG:3857', projections: [mercator], datumGrids});",
  mercatorWithGTX:
    "import {ProjectionTransform, mercator} from '@math.gl/projection'; export {parseGTXGrid} from '@math.gl/projection/grids/gtx'; export const create = (from, verticalGrids) => new ProjectionTransform({from, to: 'EPSG:3857', projections: [mercator], verticalGrids});",
  mercatorWithVerticalGeoTIFF:
    "import {ProjectionTransform, mercator} from '@math.gl/projection'; export {loadVerticalGeoTIFFGrid} from '@math.gl/projection/grids/vertical-geotiff'; export const create = (from, verticalGrids) => new ProjectionTransform({from, to: 'EPSG:3857', projections: [mercator], verticalGrids});",
  deformationModel:
    "export {createDeformationModel} from '@math.gl/projection/deformation'; export {createVelocityGrid} from '@math.gl/projection/grids/velocity';",
  deformationWithGeoTIFF:
    "export {createDeformationModel} from '@math.gl/projection/deformation'; export {loadVelocityGeoTIFFGrid} from '@math.gl/projection/grids/velocity-geotiff';",
  operationCatalog: "export {OperationCatalog} from '@math.gl/projection/operations';",
  operationPipeline: "export {ProjectionPipeline} from '@math.gl/projection/pipeline';",
  typescriptWrapper: "export {Projection} from '@math.gl/projection';",
  allNativeExports: "export * from '@math.gl/projection';"
};
const budgets = process.argv.includes('--measure')
  ? null
  : JSON.parse(
      readFileSync(new URL('../test/fixtures/bundle-budgets.json', import.meta.url), 'utf8')
    );
const measurements = {};
for (const [name, contents] of Object.entries(fixtures)) {
  const result = await build({
    stdin: {
      contents,
      resolveDir: fileURLToPath(new URL('../', import.meta.url))
    },
    bundle: true,
    tsconfigRaw: {},
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    minify: true,
    write: false,
    metafile: true
  });
  const retained = Object.entries(Object.values(result.metafile.outputs)[0].inputs)
    .filter(([, input]) => input.bytesInOutput > 0)
    .map(([path]) => path);
  const expectsCatalog = [
    'coreWithDatumCatalog',
    'mercatorWithDatumCatalog',
    'typescriptWrapper',
    'allNativeExports'
  ].includes(name);
  assert.equal(
    retained.some(path => path.endsWith('/crs/datum-table.js')),
    expectsCatalog,
    name + ' regional datum catalogue retention'
  );
  if (name === 'core')
    assert(!Object.keys(result.metafile.inputs).some(path => path.endsWith('/crs/datum-table.js')));
  const bytes = result.outputFiles[0].contents;
  measurements[name] = {
    minified: bytes.length,
    gzip: gzipSync(bytes, {level: 9}).length
  };
  if (budgets)
    for (const metric of ['minified', 'gzip']) {
      assert(
        measurements[name][metric] <= budgets.limits[name][metric],
        `${name} ${metric}: ${measurements[name][metric]} exceeds budget ${budgets.limits[name][metric]}`
      );
    }
}
console.log(JSON.stringify(measurements, null, 2));
