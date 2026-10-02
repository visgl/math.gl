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
const esm = await import('@math.gl/proj4');
const cjs = require('@math.gl/proj4');
for (const {ProjectionEngine, mercator} of [esm, cjs]) {
  const projection = new ProjectionEngine({to: 'EPSG:3857', projections: [mercator]});
  assert.deepEqual(projection.project([0, 0]), [0, 0]);
}

for (const {ProjectionEngine, universalTransverseMercator} of [esm, cjs]) {
  const projection = new ProjectionEngine({
    to: 'EPSG:32631',
    projections: [universalTransverseMercator]
  });
  assert(Math.abs(projection.project([3, 0])[0] - 500000) < 1e-8);
}

const cases = [
  {plugin: null, to: null, kernels: [], projections: []},
  {plugin: 'equalEarth', to: '+proj=eqearth', kernels: ['eqearth'], projections: ['eqearth']},
  {plugin: 'eckertVI', to: '+proj=eck6', kernels: ['eck6', 'sinu'], projections: ['eck6']},
  {
    plugin: 'obliqueTransformation,mollweide',
    expression: 'obliqueTransformation(mollweide)',
    to: '+proj=ob_tran +o_lat_p=45 +o_lon_p=0',
    kernels: ['moll'],
    projections: ['moll', 'ob-tran']
  },
  {plugin: 'mercator', to: 'EPSG:3857', kernels: [], projections: ['mercator']},
  {
    plugin: 'universalTransverseMercator',
    to: 'EPSG:32631',
    kernels: ['tmerc', 'etmerc'],
    projections: ['utm', 'transverse-mercator']
  },
  {
    plugin: 'lambertConformalConic',
    to: '+proj=lcc +lat_1=30 +lat_2=60',
    kernels: ['lcc'],
    projections: ['lcc']
  }
];
for (const fixture of cases) {
  const contents = fixture.plugin
    ? 'import {ProjectionEngine, ' +
      fixture.plugin +
      "} from '@math.gl/proj4'; export const projection = new ProjectionEngine({to: " +
      JSON.stringify(fixture.to) +
      ', projections: [' +
      (fixture.expression || fixture.plugin) +
      ']});'
    : "export {ProjectionEngine} from '@math.gl/proj4';";
  const result = await build({
    stdin: {contents, resolveDir: packageRoot},
    bundle: true,
    tsconfigRaw: {},
    format: 'esm',
    platform: 'browser',
    minify: true,
    metafile: true,
    write: false
  });
  assert(
    !Object.keys(result.metafile.inputs).some(path => /node_modules\/proj4\//.test(path)),
    'TypeScript entry point must not import proj4js'
  );
  const included = Object.values(result.metafile.outputs).flatMap(output =>
    Object.entries(output.inputs)
      .filter(([, input]) => input.bytesInOutput > 0)
      .map(([path]) => path)
  );
  for (const directory of ['kernels', 'projections']) {
    const names = included
      .filter(path => path.includes('/experimental/' + directory + '/'))
      .map(path => path.slice(path.lastIndexOf('/') + 1).replace(/\.js$/, ''));
    assert.deepEqual(
      names.sort(),
      [...fixture[directory]].sort(),
      'Unexpected bundled ' + directory + ' for ' + fixture.plugin
    );
  }
}

// CRS readers are optional even though their symbols share the public barrel.
for (const parser of [null, 'wktCRSParser', 'projJSONCRSParser']) {
  const contents = parser
    ? `import {ProjectionEngine, ${parser}} from '@math.gl/proj4'; export const create = to => new ProjectionEngine({to, parsers: [${parser}]});`
    : "export {ProjectionEngine} from '@math.gl/proj4';";
  const result = await build({
    stdin: {contents, resolveDir: packageRoot},
    bundle: true,
    tsconfigRaw: {},
    format: 'esm',
    platform: 'browser',
    minify: true,
    metafile: true,
    write: false
  });
  const emitted = Object.values(result.metafile.outputs).flatMap(output =>
    Object.entries(output.inputs)
      .filter(([, input]) => input.bytesInOutput > 0)
      .map(([path]) => path)
  );
  assert.equal(
    emitted.some(path => path.endsWith('/experimental/crs/wkt.js')),
    parser === 'wktCRSParser'
  );
  assert.equal(
    emitted.some(path => path.endsWith('/experimental/crs/projjson.js')),
    parser === 'projJSONCRSParser'
  );
  assert(!emitted.some(path => /node_modules\/proj4\//.test(path)));
}
for (const {ProjectionEngine, geocentric, wktCRSParser} of [esm, cjs]) {
  assert.deepEqual(
    new ProjectionEngine({to: 'EPSG:4978', projections: [geocentric]}).project([0, 0]),
    [6378137, 0, 0]
  );
  const source =
    'GEOGCS["WGS84",DATUM["WGS_1984",SPHEROID["WGS84",6378137,298.257223563]],UNIT["degree",0.017453292519943295]]';
  assert.deepEqual(
    new ProjectionEngine({from: source, parsers: [wktCRSParser]}).project([0, 0]),
    [0, 0]
  );
}

// Prepared grids are injected; core/projection bundles must not retain grid readers or interpolation.
for (const reader of [
  null,
  'parseNTv2Grid',
  'loadGeoTIFFGrid',
  'parseGTXGrid',
  'createVerticalGrid',
  'createGeoidGrid',
  'loadVerticalGeoTIFFGrid'
]) {
  const contents = reader
    ? 'export {' + reader + "} from '@math.gl/proj4';"
    : "export {ProjectionEngine} from '@math.gl/proj4';";
  const result = await build({
    stdin: {contents, resolveDir: packageRoot},
    bundle: true,
    tsconfigRaw: {},
    format: 'esm',
    platform: 'browser',
    minify: true,
    metafile: true,
    write: false
  });
  const emitted = Object.values(result.metafile.outputs).flatMap(output =>
    Object.entries(output.inputs)
      .filter(([, input]) => input.bytesInOutput > 0)
      .map(([path]) => path)
  );
  assert.equal(
    emitted.some(path => path.endsWith('/grids/ntv2.js')),
    reader === 'parseNTv2Grid'
  );
  assert.equal(
    emitted.some(path => path.endsWith('/grids/geotiff.js')),
    reader === 'loadGeoTIFFGrid'
  );
  assert.equal(
    emitted.some(path => path.endsWith('/grids/grid.js')),
    reader === 'parseNTv2Grid' || reader === 'loadGeoTIFFGrid'
  );
  assert.equal(
    emitted.some(path => path.endsWith('/grids/gtx.js')),
    reader === 'parseGTXGrid'
  );
  assert.equal(
    emitted.some(path => path.endsWith('/grids/vertical.js')),
    ['parseGTXGrid', 'createVerticalGrid', 'createGeoidGrid', 'loadVerticalGeoTIFFGrid'].includes(
      reader
    )
  );
  assert.equal(
    emitted.some(path => path.endsWith('/grids/vertical-geotiff.js')),
    reader === 'loadVerticalGeoTIFFGrid'
  );
  assert(!emitted.some(path => /node_modules\/(proj4|geotiff)\//.test(path)));
  assert(!emitted.some(path => path.includes('/geoid/')));
}
for (const {ProjectionEngine, loadGeoTIFFGrid} of [esm, cjs]) {
  const grid = await loadGeoTIFFGrid({
    getImageCount: async () => 1,
    getImage: async () => ({
      getWidth: () => 2,
      getHeight: () => 2,
      getBoundingBox: () => [-1, -1, 1, 1],
      fileDirectory: {ModelPixelScale: [1, 1, 0]},
      readRasters: async () => [new Float32Array(4).fill(1), new Float32Array(4).fill(-2)]
    })
  });
  const projection = new ProjectionEngine({
    from: '+proj=longlat +nadgrids=local',
    datumGrids: {local: grid}
  });
  const point = [-0.5, 0.5, 123];
  const projected = projection.project(point);
  assert(Math.abs(projected[0] - (point[0] - 2 / 3600)) < 1e-12);
  assert(Math.abs(projected[1] - (point[1] + 1 / 3600)) < 1e-12);
  projection.unproject(projected).forEach((value, i) => assert(Math.abs(value - point[i]) < 1e-10));
}

// Selecting the default convenience wrapper must also exclude the classic runtime.
const defaultBundle = await build({
  stdin: {contents: "export {Proj4Projection} from '@math.gl/proj4';", resolveDir: packageRoot},
  bundle: true,
  tsconfigRaw: {},
  format: 'esm',
  platform: 'browser',
  minify: true,
  metafile: true,
  write: false
});
assert(
  !Object.keys(defaultBundle.metafile.inputs).some(path => /node_modules\/proj4\//.test(path))
);

// Optional pipelines must not retain projection kernels, readers or the CRS engine.
for (const entry of [
  "export {ProjectionPipeline} from '@math.gl/proj4/pipeline';",
  "export {ProjectionEngine} from '@math.gl/proj4/core';"
]) {
  const result = await build({
    stdin: {contents: entry, resolveDir: packageRoot},
    bundle: true,
    format: 'esm',
    platform: 'browser',
    minify: true,
    metafile: true,
    write: false,
    tsconfigRaw: {}
  });
  const retained = Object.values(result.metafile.outputs).flatMap(output =>
    Object.entries(output.inputs)
      .filter(([, input]) => input.bytesInOutput > 0)
      .map(([path]) => path)
  );
  assert(!retained.some(path => /node_modules\/proj4\//.test(path)));
  assert(!retained.some(path => /experimental\/(projections|kernels|grids)\//.test(path)));
  assert(!retained.some(path => /experimental\/crs\/(wkt|projjson)\.js$/.test(path)));
  assert(
    !retained.some(path =>
      entry.includes('/core')
        ? path.endsWith('/projection-pipeline.js')
        : path.endsWith('/typescript-projection.js')
    )
  );
}
