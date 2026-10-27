// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original export/type/selective graph qualification for the optional G5–G6 APIs.
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
const entry = manifest.exports['.'];
const esm = await import(new URL('../../dist/index.js', import.meta.url));
const cjs = createRequire(import.meta.url)(
  new URL('../../dist/index.cjs', import.meta.url).pathname
);
for (const api of [esm, cjs]) {
  const axes = {semiMajorAxis:1,semiMinorAxis:1};
  assert(Math.abs(new api.EllipsoidRhumb(axes).inverse(0,0,0,90).s12-Math.PI/2)<1e-14);
  assert(new api.RhumbPolygon(axes).addPoint(0,0).compute().number===1);
  assert(new api.GeodesicIntersections(axes).segments([0,-20],[0,20],[-20,0],[20,0]).status==='intersection');
  assert.throws(()=>new api.EllipsoidRhumb(axes).inverse(90,0,0,0),api.RhumbDomainError);
}
assert(entry.types.endsWith('/index.d.ts'));
const measured = {};
for (const symbol of ['EllipsoidRhumb', 'RhumbPolygon', 'GeodesicIntersections']) {
  const result = await build({
    stdin: {contents: `export {${symbol}} from '@math.gl/geospatial';`, resolveDir: root},
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
  if(symbol==='EllipsoidRhumb') assert(!paths.some(p=>/geographiclib-geodesic|surface-polygon|geodesic-intersections/.test(p)));

  assert(!paths.some(p => /geospatial\/src\/projection/.test(p)));
  const bytes = result.outputFiles[0].contents;
  measured[symbol] = {minified: bytes.length, gzip: gzipSync(bytes, {level: 9}).length};
}
const temp = mkdtempSync(join(root, '.g56-types-'));
try {
  const file = join(temp, 'types.ts');
  writeFileSync(
    file,
    `import {EllipsoidRhumb, RhumbPolygon, GeodesicIntersections, type RhumbResult, type SegmentIntersection} from '@math.gl/geospatial';
const axes={semiMajorAxis:1,semiMinorAxis:1};
const result:RhumbResult=new EllipsoidRhumb(axes).line(0,0,90,{area:true}).position(1);
const area:number|undefined=new RhumbPolygon(axes).addPoint(30,0).addPoint(30,0,{longitudeTurns:1}).compute().area;
const intersection:SegmentIntersection=new GeodesicIntersections(axes).segments([0,-20],[0,20],[-20,0],[20,0]);
void [result,area,intersection];`
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
      '2023, Charles Karney (geodesic intersection'
    )
  );
console.log(
  JSON.stringify({exports: 'ESM/CJS/types/licenses pass', selectiveBundles: measured}, null, 2)
);
