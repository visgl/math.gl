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

for (const {TypeScriptProjection, universalTransverseMercator} of [esm, cjs]) {
  const projection = new TypeScriptProjection({
    to: 'EPSG:32631',
    projections: [universalTransverseMercator]
  });
  assert(Math.abs(projection.project([3, 0])[0] - 500000) < 1e-8);
}

const cases = [
  {plugin: null, to: null, kernels: [], projections: []},
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
    ? 'import {TypeScriptProjection, ' +
      fixture.plugin +
      "} from '@math.gl/proj4/experimental'; export const projection = new TypeScriptProjection({to: " +
      JSON.stringify(fixture.to) +
      ', projections: [' +
      fixture.plugin +
      ']});'
    : "export {TypeScriptProjection} from '@math.gl/proj4/experimental';";
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
    'Experimental entry point must not import proj4js'
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
    ? `import {TypeScriptProjection, ${parser}} from '@math.gl/proj4/experimental'; export const create = to => new TypeScriptProjection({to, parsers: [${parser}]});`
    : "export {TypeScriptProjection} from '@math.gl/proj4/experimental';";
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
for (const {TypeScriptProjection, geocentric, wktCRSParser} of [esm, cjs]) {
  assert.deepEqual(
    new TypeScriptProjection({to: 'EPSG:4978', projections: [geocentric]}).project([0, 0]),
    [6378137, 0, 0]
  );
  const source = 'GEOGCS["WGS84",DATUM["WGS_1984",SPHEROID["WGS84",6378137,298.257223563]],UNIT["degree",0.017453292519943295]]';
  assert.deepEqual(
    new TypeScriptProjection({from: source, parsers: [wktCRSParser]}).project([0, 0]),
    [0, 0]
  );
}
