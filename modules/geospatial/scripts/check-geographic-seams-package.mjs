// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original public export/type/provenance/selective-size guard for C5/C6.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile,mkdtemp,mkdir,rm,symlink,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {build} from 'esbuild';
const require=createRequire(import.meta.url);
const root=fileURLToPath(new URL('../../../',import.meta.url));
const hash=async path=>createHash('sha256').update(await readFile(join(root,path))).digest('hex');
const reference=JSON.parse(await readFile(join(root,'modules/geospatial/test/ellipsoid/geographic-seam-reference.json'),'utf8'));
assert.equal(reference.provenance.generatorSHA256,await hash('modules/geospatial/scripts/generate-geographic-seam-reference.py'));
assert.equal(reference.provenance.driverSHA256,await hash('modules/geospatial/projection/scripts/geographiclib-g56-oracle.cpp'));
assert.equal(reference.provenance.geodesicDriverSHA256,await hash('modules/geospatial/projection/scripts/geographiclib-p0-oracle.cpp'));
assert.equal(reference.provenance.projReferenceSHA256,await hash('modules/geospatial/test/ellipsoid/geodesic-path-reference.json'));
assert.equal(reference.rhumb.length,100);assert.equal(reference.geodesic.length,180);
for(const format of ['esm','cjs']) {
  const load=format==='esm'?name=>import(name):name=>require(name);
  const {RhumbPath,EllipsoidRhumb}=await load('@math.gl/geospatial/ellipsoid');
  const {splitGeographicPolygon,splitGeographicPolyline,subdivideRhumbPolyline}=await load('@math.gl/geospatial/globe');
  const full=await load('@math.gl/geospatial');
  for(const name of ['RhumbPath','splitGeographicPolygon','splitGeographicPolyline','subdivideRhumbPolyline']) assert.equal(typeof full[name],'function');
  const rhumb=new EllipsoidRhumb({semiMajorAxis:1,semiMinorAxis:1});
  assert(Math.abs(new RhumbPath([-180,30],[180,30],{rhumb,longitudeMode:'unrolled'}).sample(.5)[0])<2e-12);
  assert.equal(splitGeographicPolyline([170,0,-170,0],{edgeModel:'rhumb',rhumb}).length,2);
  const polygon=splitGeographicPolygon([{positions:[170,-20,190,-20,190,20,170,20]},
    {positions:[175,-5,185,-5,185,5,175,5]}],{edgeModel:'linear'});
  assert.equal(polygon.length,2);assert(polygon.every(p=>p.rings.length===1));
  assert(subdivideRhumbPolyline([-180,30,180,30],{rhumb,longitudeMode:'unrolled',transform:p=>p,tolerance:1,maxSurfaceDistance:1}).segmentIndices.length>4);
}
const temporary=await mkdtemp(join(tmpdir(),'mathgl-seams-package-'));
try {
  const scope=join(temporary,'node_modules/@math.gl');await mkdir(scope,{recursive:true});
  for(const name of ['geospatial','geometry','core','web-mercator']) await symlink(join(root,'modules',name),join(scope,name));
  await writeFile(join(temporary,'package.json'),'{"type":"module"}');
  await writeFile(join(temporary,'consumer.ts'),await readFile(join(root,'test/types/geographic-seams/index.ts')));
  await writeFile(join(temporary,'tsconfig.json'),JSON.stringify({compilerOptions:{target:'es2020',module:'NodeNext',moduleResolution:'NodeNext',strict:true,noEmit:true,skipLibCheck:false,types:[]},include:['consumer.ts']}));
  execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--project',join(temporary,'tsconfig.json')],{stdio:'inherit'});
} finally {await rm(temporary,{recursive:true,force:true});}
const measured={};
for(const [name,entry,symbol,expression,budget] of [
  ['generic','modules/geometry/src/polygon/index.ts','subdividePolyline','subdividePolyline([], {transform:p=>p,tolerance:1})',null],
  ['ellipsoid','modules/geospatial/src/entries/ellipsoid.ts','Ellipsoid','Ellipsoid.WGS84.cartographicToCartesian([0,0,0])',null],
  ['geodesic','modules/geospatial/src/entries/ellipsoid.ts','GeodesicPath','new GeodesicPath([0,0],[1,1]).sample(.5)',null],
  ['rhumb','modules/geospatial/src/entries/ellipsoid.ts','RhumbPath','new RhumbPath([0,0],[1,1]).sample(.5)',[32000,12000]],
  ['adaptive-rhumb','modules/geospatial/src/globe.ts','subdivideRhumbPolyline','subdivideRhumbPolyline([], {transform:p=>p,tolerance:1})',[40000,15000]],
  ['seam-line','modules/geospatial/src/globe.ts','splitGeographicPolyline',"splitGeographicPolyline([], {edgeModel:'linear'})",[56000,20000]],
  ['seam-polygon','modules/geospatial/src/globe.ts','splitGeographicPolygon',"splitGeographicPolygon([], {edgeModel:'linear'})",[68000,24000]]
]) {
  const result=await build({absWorkingDir:root,bundle:true,write:false,minify:true,format:'esm',metafile:true,
    stdin:{contents:`import {${symbol}} from './${entry}'; globalThis.result=${expression};`,resolveDir:root,loader:'ts'}});
  const runtime=Object.values(result.metafile.outputs).flatMap(output=>Object.entries(output.inputs).filter(([,info])=>info.bytesInOutput>0).map(([path])=>path));
  assert(runtime.every(path=>!path.includes('/src/projection/')&&!path.includes('/src/discontinuous/')&&!path.includes('polygon-clipping')),name+': unrelated engine dependency');
  if(name==='generic') assert(runtime.every(path=>!path.includes('modules/geospatial/')),name+': geographic dependency');
  if(['generic','ellipsoid','rhumb','adaptive-rhumb'].includes(name))
    assert(runtime.every(path=>!path.includes('geographiclib-geodesic')),name+': unnecessary geodesic solver');
  if(['generic','ellipsoid','geodesic'].includes(name))
    assert(runtime.every(path=>!path.includes('/geographic-seams')&&!path.includes('/rhumb-path')&&!path.includes('/ellipsoid-rhumb')),name+': existing selective payload changed');
  const bytes=result.outputFiles[0].contents;measured[name]={minified:bytes.length,gzip:gzipSync(bytes).length};
  if(budget) assert(bytes.length<=budget[0]&&gzipSync(bytes).length<=budget[1],name+': new API bundle budget exceeded');
}
console.log(JSON.stringify({exports:'ESM/CJS/types/provenance pass',selectiveBundles:measured},null,2));
