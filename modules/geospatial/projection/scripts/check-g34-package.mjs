// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original export/type/selective graph qualification for the optional G3–G4 APIs.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {readFileSync, mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import ts from 'typescript';
const root = fileURLToPath(new URL('../../../../', import.meta.url));
const manifest = JSON.parse(readFileSync(join(root, 'modules/geospatial/package.json')));
const entry = manifest.exports['./ellipsoid'];
const esm = await import(new URL('../../dist/entries/ellipsoid.js', import.meta.url));
const cjs = createRequire(import.meta.url)(
  new URL('../../dist/entries/ellipsoid.cjs', import.meta.url).pathname
);
for (const api of [esm, cjs]) {
  const m = new api.EllipsoidMetrics({semiMajorAxis: 1, semiMinorAxis: 1});
  assert(Math.abs(m.surfaceArea - 4 * Math.PI) < 1e-13);
  const p = new api.GeodesicPolygon({semiMajorAxis: 1, semiMinorAxis: 1});
  assert(
    Math.abs(p.addPoint(0, 0).addPoint(0, 90).addPoint(90, 0).compute().area - Math.PI / 2) < 1e-14
  );
}
assert(entry.types.endsWith('/ellipsoid.d.ts'));
const measured = {};
for (const symbol of ['Ellipsoid', 'EllipsoidMetrics', 'EllipsoidGeodesic', 'GeodesicPolygon']) {
  const result = await build({
    stdin: {contents: `export {${symbol}} from '@math.gl/geospatial/ellipsoid';`, resolveDir: root},
    bundle: true,
    platform: 'browser',
    format: 'esm',
    target: 'es2020',
    minify: true,
    write: false,
    metafile: true
  });
  const paths = Object.entries(Object.values(result.metafile.outputs)[0].inputs)
    .filter(([, v]) => v.bytesInOutput > 0)
    .map(([p]) => p);
  if (symbol === 'Ellipsoid')
    assert(!paths.some(p => /ellipsoid-metrics|geodesic-polygon/.test(p)));
  if (symbol === 'EllipsoidMetrics')
    assert(!paths.some(p => /geographiclib-geodesic|geodesic-polygon/.test(p)));
  if (symbol === 'EllipsoidGeodesic')
    assert(!paths.some(p => /ellipsoid-metrics|geodesic-polygon/.test(p)));
  assert(!paths.some(p => /geospatial\/src\/projection/.test(p)));
  const bytes = result.outputFiles[0].contents;
  measured[symbol] = {minified: bytes.length, gzip: gzipSync(bytes, {level: 9}).length};
}
const temp = mkdtempSync(join(root, '.g34-types-'));
try {
  const file = join(temp, 'types.ts');
  writeFileSync(
    file,
    `import {EllipsoidMetrics, GeodesicPolygon, EllipsoidGeodesic, type AuxiliaryLatitude, type GeodesicPolygonResult} from '@math.gl/geospatial/ellipsoid';
const axes={semiMajorAxis:1,semiMinorAxis:1};
const kind:AuxiliaryLatitude='isometric';
const lat:number=new EllipsoidMetrics(axes).latitudeFromAuxiliary(Infinity,kind);
const result:GeodesicPolygonResult=new GeodesicPolygon(axes).addPoint(lat,0).testEdge(10,1);
const area:number|undefined=new EllipsoidGeodesic(axes).inverse(0,0,1,1,{area:true}).S12;
void [area,result];`
  );
  const program = ts.createProgram([file], {
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    target: ts.ScriptTarget.ES2020,
    strict: true,
    skipLibCheck: true,
    noEmit: true
  });
  const errors = ts.getPreEmitDiagnostics(program);
  assert.equal(
    errors.length,
    0,
    ts.formatDiagnosticsWithColorAndContext(errors, {
      getCanonicalFileName: x => x,
      getCurrentDirectory: () => root,
      getNewLine: () => '\n'
    })
  );
} finally {
  rmSync(temp, {recursive: true, force: true});
}
for (const name of ['LICENSE', 'GEOGRAPHICLIB-LICENSE.txt'])
  assert(
    readFileSync(join(root, 'modules/geospatial', name), 'utf8').includes(
      '2010-2023, Charles Karney'
    )
  );
console.log(
  JSON.stringify({exports: 'ESM/CJS/types/licenses pass', selectiveBundles: measured}, null, 2)
);
