// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original export/type/selective graph qualification for the optional G6 global APIs.
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
for (const api of [esm,cjs]) {
  const g=new api.GeodesicIntersections({semiMajorAxis:1,semiMinorAxis:1.01});
  const a={latitude:0,longitude:0,azimuth:90};
  assert(g.closest(a,a).complete);
  assert.equal(g.closest(a,a).intersection.coincidence,1);
  assert(g.next(0,0,90,90).complete);
  assert.equal(g.segments([0,-20],[0,20],[20,30],[30,30]).status,'disjoint');
  assert.equal(typeof api.GeodesicPath,'function');
}
assert(entry.types.endsWith('/ellipsoid.d.ts'));
const measured = {};
for (const symbol of ['Ellipsoid', 'EllipsoidGeodesic', 'GeodesicIntersections']) {
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
  if(symbol!=='GeodesicIntersections') assert(!paths.some(p=>/intersection-bounds|geodesic-intersections/.test(p)));
  assert(!paths.some(p => /geospatial\/src\/projection/.test(p)));
  const bytes = result.outputFiles[0].contents;
  measured[symbol] = {minified: bytes.length, gzip: gzipSync(bytes, {level: 9}).length};
}
const temp = mkdtempSync(join(root, '.g6-types-'));
try {
  const file = join(temp, 'types.ts');
  writeFileSync(
    file,
    `import {GeodesicIntersections,GeodesicPath,type GeodesicIntersectionPath,type IntersectionPoint} from '@math.gl/geospatial/ellipsoid';
const axes={semiMajorAxis:1,semiMinorAxis:1.01};
const g=new GeodesicIntersections(axes);
const a:GeodesicIntersectionPath={latitude:0,longitude:0,azimuth:90};
const p:IntersectionPoint|undefined=g.closest(a,a).intersection;
const q:IntersectionPoint|undefined=g.next(0,0,90,90).intersection;
const direction:1|-1|undefined=p?.coincidence;
const sampled=new GeodesicPath([0,0],[1,1]).sample(.5);
void [p,q,direction,sampled];`
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
      'geodesic intersection search, capture bounds and conjugates'
    )
  );
console.log(
  JSON.stringify({exports: 'ESM/CJS/types/licenses pass', selectiveBundles: measured}, null, 2)
);
