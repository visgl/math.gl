// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile, mkdtemp, mkdir, rm, symlink, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {build} from 'esbuild';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../../../', import.meta.url));
const fixture = JSON.parse(await readFile(join(root, 'modules/geospatial/test/ellipsoid/geodesic-path-reference.json'), 'utf8'));
const generator = await readFile(join(root, 'modules/geospatial/scripts/generate-geodesic-path-reference.py'));
assert.equal(createHash('sha256').update(generator).digest('hex'), fixture.generatorSHA256);
assert.equal(fixture.cases.length, 180);

for (const format of ['esm', 'cjs']) {
  const load = format === 'esm' ? name => import(name) : name => require(name);
  const {GeodesicPath, EllipsoidGeodesic} = await load('@math.gl/geospatial');
  const {subdivideGeodesicPolyline} = await load('@math.gl/geospatial');
  const {subdividePolyline} = await load('@math.gl/geometry');
  const packageRoot = await load('@math.gl/geospatial');
  assert.equal(typeof packageRoot.GeodesicPath, 'function');
  assert.equal(typeof packageRoot.subdivideGeodesicPolyline, 'function');
  const geodesic = new EllipsoidGeodesic({semiMajorAxis: 10, semiMinorAxis: 10});
  const path = new GeodesicPath([170, 0, 10], [-170, 0, 30], {geodesic});
  assert.deepEqual(path.sample(0.5), [180, 0, 20]);
  const result = subdivideGeodesicPolyline([170, 0, -170, 0], {
    geodesic, transform: point => point, tolerance: 1, maxSurfaceDistance: 1
  });
  assert.deepEqual(Array.from(result.sourcePositions), [170, 0, 175, 0, 180, 0, 185, 0, 190, 0]);
  assert.deepEqual(Array.from(result.segmentFractions), [0, 0.25, 0.5, 0.75, 1]);
  assert.equal(subdividePolyline([0, 0, 1, 0], {
    transform: point => point, tolerance: 1,
    createEdgeSampler: (start, end) => new GeodesicPath(start, end, {geodesic})
  }).segmentIndices.length, 2);
}

const temporary = await mkdtemp(join(tmpdir(), 'mathgl-geodesic-path-package-'));
try {
  const scope = join(temporary, 'node_modules/@math.gl');
  await mkdir(scope, {recursive: true});
  for (const name of ['geospatial', 'geometry', 'core', 'web-mercator']) {
    await symlink(join(root, 'modules', name), join(scope, name));
  }
  await writeFile(join(temporary, 'package.json'), '{"type":"module"}');
  await writeFile(join(temporary, 'consumer.ts'), await readFile(join(root, 'test/types/geodesic-path/index.ts')));
  await writeFile(join(temporary, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {target: 'es2020', module: 'NodeNext', moduleResolution: 'NodeNext', strict: true, noEmit: true, skipLibCheck: false, types: []},
    include: ['consumer.ts']
  }));
  execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '--project', join(temporary, 'tsconfig.json')], {stdio: 'inherit'});
} finally {
  await rm(temporary, {recursive: true, force: true});
}

for (const [name, entry, expression] of [
  ['generic', 'modules/geometry/src/polygon/index.ts', 'subdividePolyline([], {transform: p => p, tolerance: 1})'],
  ['ellipsoid', 'modules/geospatial/src/entries/ellipsoid.ts', 'Ellipsoid.WGS84.cartographicToCartesian([0, 0, 0])'],
  ['path', 'modules/geospatial/src/entries/ellipsoid.ts', 'new GeodesicPath([0, 0], [1, 1]).sample(0.5)'],
  ['adaptive', 'modules/geospatial/src/globe.ts', 'subdivideGeodesicPolyline([], {transform: p => p, tolerance: 1})']
]) {
  const symbol = name === 'generic' ? 'subdividePolyline' : name === 'ellipsoid' ? 'Ellipsoid' : name === 'path' ? 'GeodesicPath' : 'subdivideGeodesicPolyline';
  const result = await build({
    absWorkingDir: root, bundle: true, write: false, minify: true, format: 'esm', metafile: true,
    stdin: {contents: `import {${symbol}} from './${entry}'; globalThis.result = ${expression};`, resolveDir: root, loader: 'ts'}
  });
  const runtime = Object.values(result.metafile.outputs).flatMap(output => Object.entries(output.inputs).filter(([, info]) => info.bytesInOutput > 0).map(([path]) => path));
  assert(runtime.every(path => !path.includes('/src/projection/') && !path.includes('/src/discontinuous/')), name + ': unrelated engine payload');
  if (name === 'generic') assert(runtime.every(path => !path.includes('modules/geospatial/')), 'Generic geometry acquired geodesic dependencies');
  if (name === 'ellipsoid') assert(runtime.every(path => !path.includes('geographiclib-geodesic')), 'Ellipsoid-only consumers acquired a geodesic solver');
  const bytes = result.outputFiles[0].contents;
  console.log(`${name}: ${bytes.length} minified / ${gzipSync(bytes).length} gzip bytes; selective boundary passed`);
}
console.log('Geodesic C4 fixture provenance, ESM/CJS entrypoints, strict public types and selective boundaries passed.');
