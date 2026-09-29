// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Audit fixture coordinates adapted from proj4js 2.22.0 test/proj4.test.mjs (MIT).
// Copyright (c) 2014, proj4js authors; license in modules/proj4/PROJ4-LICENSE.md.
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
const {values} = parseArgs({
  options: {grids: {type: 'string'}, 'geotiff-module': {type: 'string'}, output: {type: 'string'}}
});
assert(
  values.grids && values['geotiff-module'],
  'Supply --grids /path/to/upstream/test --geotiff-module /path/to/geotiff/dist-module/geotiff.js'
);
const root = fileURLToPath(new URL('../../../', import.meta.url));
const require = createRequire(root + '/package.json'),
  proj4 = require('proj4');
const n = await import(root + '/modules/proj4/dist/experimental/index.js');
const {fromArrayBuffer} = await import(pathToFileURL(values['geotiff-module']).href);
const directory = values.grids,
  rows = [],
  files = [];
function buffer(name) {
  const data = fs.readFileSync(directory + '/' + name);
  files.push({name, size: data.length, sha256: createHash('sha256').update(data).digest('hex')});
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
}
const plugins = Object.values(n).filter(
  v => v && typeof v === 'object' && typeof v.create === 'function'
);
function test(name, p, r, input, expected, inverse, tolerance) {
  let value, error;
  try {
    value = (inverse ? p.unproject : p.project)(input);
  } catch (e) {
    error = e.message;
  }
  let ref, refError;
  try {
    ref = (inverse ? r.inverse : r.forward)(input.slice());
  } catch (e) {
    refError = e.message;
  }
  const delta = (a, b) =>
    a && b ? Math.max(...a.slice(0, 2).map((x, i) => Math.abs(x - b[i]))) : null;
  const actualDelta = delta(value, expected),
    referenceDelta = delta(ref, expected);
  rows.push({
    name,
    input,
    expected,
    inverse,
    tolerance,
    value,
    error,
    ref,
    refError,
    actualDelta,
    referenceDelta,
    pass: actualDelta !== null && actualDelta <= tolerance,
    referencePass: referenceDelta !== null && referenceDelta <= tolerance
  });
}
const beta = buffer('BETA2007.gsb');
proj4.nadgrid('audit-beta', beta);
const betaGrid = n.parseNTv2Grid(beta);
const betaFrom =
  '+proj=tmerc +lat_0=0 +lon_0=6 +k=1 +x_0=2500000 +y_0=0 +ellps=bessel +nadgrids=audit-beta +units=m';
for (const [to, expected, tolerance] of [
  ['WGS84', [6.850861772, 51.170707759], 1e-7],
  ['EPSG:3857', [762634.443931574, 6651545.68026527], 0.01],
  [
    '+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m',
    [349757.381712518, 5671004.06504954],
    0.01
  ]
]) {
  const p = new n.TypeScriptProjection({
      from: betaFrom,
      to,
      projections: plugins,
      datumGrids: {'audit-beta': betaGrid}
    }),
    r = proj4(betaFrom, to);
  test('BETA2007 ' + to, p, r, [2559552, 5670982], expected, false, tolerance);
  test('BETA2007 ' + to, p, r, expected, [2559552, 5670982], true, 0.01);
}
const points = [
  [-44.382211538462, 40.3768, -44.380749, 40.377457],
  [-87.617788, 59.623262, -87.617659, 59.623441],
  [-44.5, 40.5, -44.498553, 40.500632],
  [-60, 50, -59.999192, 50.000058],
  [0, 0, 0, 0]
];
for (const compact of [false, true]) {
  const data = buffer(
    compact ? 'ntv2_0_downsampled_no_error_columns.gsb' : 'ntv2_0_downsampled.gsb'
  );
  const options = {includeErrorFields: !compact};
  proj4.nadgrid('audit-ntv2', data, options);
  const grid = n.parseNTv2Grid(data, options),
    from = '+proj=longlat +ellps=clrk66 +nadgrids=@ignorable,audit-ntv2,null';
  const p = new n.TypeScriptProjection({from, datumGrids: {'audit-ntv2': grid}}),
    r = proj4(from, 'WGS84');
  for (const point of points)
    test('NTv2 ' + compact, p, r, point.slice(0, 2), point.slice(2), false, 1e-6);
  for (const point of points.slice(2, 4))
    test('NTv2 ' + compact, p, r, point.slice(2), point.slice(0, 2), true, 1e-6);
}
const tiff = await fromArrayBuffer(buffer('ca_nrc_NA83SCRS.tif'));
await proj4.nadgrid('audit-tiff', tiff).ready;
const grid = await n.loadGeoTIFFGrid(tiff);
const to =
  '+proj=tmerc +lat_0=0 +lon_0=-73.5 +k=0.9999 +x_0=304800 +y_0=0 +ellps=GRS80 +nadgrids=audit-tiff +units=m';
const p = new n.TypeScriptProjection({to, projections: plugins, datumGrids: {'audit-tiff': grid}}),
  r = proj4('WGS84', to);
for (const point of [
  [-70.37, 53.354, 513165.91761279816, 5917993.370260495],
  [-72.54931, 46.69361, 377510.4532706324, 5173107.843165382],
  [-80, 44.92, -208368.553747228, 4996155.4666270735]
]) {
  test('GeoTIFF', p, r, point.slice(0, 2), point.slice(2), false, 1e-6);
  test('GeoTIFF', p, r, point.slice(2), point.slice(0, 2), true, 1e-6);
}
if (values.output) fs.writeFileSync(values.output, JSON.stringify({files, rows}, null, 2));
console.table(
  rows.map(({name, inverse, pass, referencePass, actualDelta, referenceDelta, error}) => ({
    name,
    inverse,
    pass,
    referencePass,
    actualDelta,
    referenceDelta,
    error
  }))
);
