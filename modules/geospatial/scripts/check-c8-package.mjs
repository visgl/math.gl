// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original public C8 contract and selective graph guard; existing package/bundle thresholds remain unchanged.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdtempSync,mkdirSync,readFileSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {join,relative} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {gzipSync} from 'node:zlib';
import {transform} from 'esbuild';
import {bundleRuntime} from '../projection/scripts/benchmark-runtime.mjs';
const root=fileURLToPath(new URL('../../../',import.meta.url)),require=createRequire(import.meta.url);
const base='b9db6472e72b22ffb52b1c37c97745e68478728a';
for(const format of ['esm','cjs']){
 const load=format==='esm'?p=>import(p):p=>require(p);
 const api=await load('@math.gl/geospatial/ellipsoid'),full=await load('@math.gl/geospatial');
 assert.equal(typeof full.LocalReferenceFrame,'function');assert.equal(typeof full.EllipsoidTangentPlane,'function');
 const e=new api.Ellipsoid(10,10,10),frame=new api.LocalReferenceFrame([10,0,0],{ellipsoid:e});
 assert.deepEqual(Array.from(frame.localToFixedVector([1,2,3])),[3,1,2]);
 const copy=frame.localToFixedMatrix;copy.fill(0);assert.deepEqual(Array.from(frame.localToFixedPoint([1,2,3])),[13,1,2]);
 const plane=new api.EllipsoidTangentPlane([10,0,0],e);
 assert.equal(plane.projectPointOntoEllipsoid([10+2**-49,0],'normal'),undefined);
 assert(Math.abs(plane.projectPointOntoEllipsoid([8,0],'normal')[0]-6)<1e-12);
}
const directory=mkdtempSync(join(tmpdir(),'mathgl-c8-package-'));
try {
 const scope=join(directory,'node_modules/@math.gl');mkdirSync(scope,{recursive:true});
 for(const name of ['core','geospatial','geometry','web-mercator'])symlinkSync(join(root,'modules',name),join(scope,name));
 writeFileSync(join(directory,'package.json'),'{"type":"module"}');
 writeFileSync(join(directory,'consumer.ts'),readFileSync(join(root,'test/types/local-frames/index.ts')));
 writeFileSync(join(directory,'tsconfig.json'),JSON.stringify({compilerOptions:{target:'es2020',module:'NodeNext',moduleResolution:'NodeNext',strict:true,noEmit:true,skipLibCheck:false,types:[]},include:['consumer.ts']}));
 execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--project',join(directory,'tsconfig.json')],{stdio:'inherit'});
 const rows=[];
 for(const symbol of ['LocalReferenceFrame','EllipsoidTangentPlane','Ellipsoid','EllipsoidGeodesic','GeodesicPath']) {
  const entry=join(directory,symbol+'.ts');writeFileSync(entry,`export {${symbol}} from '@math.gl/geospatial/ellipsoid';`);
  const sizes=[],graphs=[];
  for(const [index,ref] of [base,undefined].entries()) {
   const file=join(directory,symbol+'-'+index+'.mjs');
   const build=await bundleRuntime(root,relative(root,entry),file,ref);
   const {code}=await transform(readFileSync(file,'utf8'),{minify:true,target:'es2020',legalComments:'none'});
   sizes.push({minified:Buffer.byteLength(code),gzip:gzipSync(code,{level:9}).length});
   const sources=Object.entries(Object.values(build.metafile.outputs)[0].inputs).filter(([,v])=>v.bytesInOutput>0).map(([p])=>p);
   graphs.push(sources.flatMap(path=>{
    const normalized=path.replaceAll('\\','/'),match=normalized.match(/(?:^|\/)modules\/(?:core|geometry|geospatial|web-mercator)\/src\/.+/);
    return match?[match[0].replace(/^\//,'')]:[];
   }).filter(path=>!path.endsWith('/ellipsoid-helpers/tangent-plane-numerics.ts')).sort());
   if(index===1) {
    assert(sources.every(p=>!p.includes('/src/projection/')&&!p.includes('/src/discontinuous/')&&!p.includes('polygon-clipping')),symbol+': unrelated engine');
    if(['LocalReferenceFrame','EllipsoidTangentPlane','Ellipsoid'].includes(symbol))assert(sources.every(p=>!p.includes('/vendor/')),'Unexpected vendor solver');
   }
  }
  assert.deepEqual(graphs[1],graphs[0],symbol+': historical/current package sideEffects contracts or retained dependencies differ');
  // Reviewed numerical-fix allowance for C8 only, established before measurement.
  // Existing selective Ellipsoid/geodesic limits and the standalone numeric leaf are unchanged.
  const allowance=['LocalReferenceFrame','EllipsoidTangentPlane'].includes(symbol)?[2000,1000]:[0,32];
  assert(sizes[1].minified<=sizes[0].minified+allowance[0]&&sizes[1].gzip<=sizes[0].gzip+allowance[1],symbol+': C8 selective bundle allowance exceeded');
  rows.push({symbol,baseline:sizes[0],candidate:sizes[1],allowance:{minified:allowance[0],gzip:allowance[1]}});
 }
 console.log(JSON.stringify({baselineCommit:base,exports:'ESM/CJS/types/ownership pass',selectiveBundles:rows},null,2));
}finally{rmSync(directory,{recursive:true,force:true});}
