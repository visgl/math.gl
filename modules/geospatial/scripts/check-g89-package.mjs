// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';import {gzipSync} from 'node:zlib';import {transform} from 'esbuild';
import {bundleRuntime} from '../projection/scripts/benchmark-runtime.mjs';
const root=fileURLToPath(new URL('../../../',import.meta.url)),require=createRequire(import.meta.url);
for(const load of [p=>import(p),p=>require(p)]){
 const {EllipsoidGeodesicExact:E,GeodesicPolygonExact:P}=await load('@math.gl/geospatial/geodesic-exact');
 const {TriaxialEllipsoid:T}=await load('@math.gl/geospatial/triaxial');
 const e=new E({semiMajorAxis:1,semiMinorAxis:2});assert(Math.abs(e.direct(0,0,90,1).lon2-180/Math.PI)<2e-10);
 const area=new P({semiMajorAxis:1,semiMinorAxis:2}).addPoint(0,0).addPoint(0,10).addPoint(90,0).compute().area;assert(area>0&&Number.isFinite(area));
 const t=new T({radii:[3,2,1]}),p=t.toCartesian(0,0),v=t.directionToCartesian(p,0);
 assert(t.line(p,v).position(1).position.every(Number.isFinite));
}
const dir=mkdtempSync(join(tmpdir(),'mathgl-g89-package-'));
try{
 const scope=join(dir,'node_modules/@math.gl');mkdirSync(scope,{recursive:true});
 for(const name of ['core','geometry','geospatial','web-mercator'])symlinkSync(join(root,'modules',name),join(scope,name));
 writeFileSync(join(dir,'package.json'),'{"type":"module"}');
 for(const ext of ['ts','cts'])writeFileSync(join(dir,'consumer.'+ext),readFileSync(join(root,'test/types/geodesic-exact/index.'+ext)));
 writeFileSync(join(dir,'tsconfig.json'),JSON.stringify({compilerOptions:{target:'es2020',module:'NodeNext',moduleResolution:'NodeNext',strict:true,noEmit:true,skipLibCheck:false,types:[]},include:['consumer.ts','consumer.cts']}));
 execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--project',join(dir,'tsconfig.json')],{stdio:'inherit'});
 const rows=[];
 // New-feature ceilings established separately. Existing selective/bundle gates are unchanged.
 for(const [entry,symbol,minified,gzip] of [['geodesic-exact','EllipsoidGeodesicExact',35000,14000],['triaxial','TriaxialEllipsoid',12000,4500]]){
  const source=join(dir,entry+'.ts'),out=join(dir,entry+'.mjs');writeFileSync(source,`export {${symbol}} from '@math.gl/geospatial/${entry}';`);
  const result=await bundleRuntime(root,relative(root,source),out);const{code}=await transform(readFileSync(out,'utf8'),{minify:true,target:'es2020',legalComments:'none'});
  const size={minified:Buffer.byteLength(code),gzip:gzipSync(code,{level:9}).length};assert(size.minified<=minified&&size.gzip<=gzip,entry+' feature budget exceeded');
  const inputs=Object.entries(Object.values(result.metafile.outputs)[0].inputs).filter(([,v])=>v.bytesInOutput>0).map(([p])=>p);
  assert(inputs.every(p=>!p.includes('/src/projection/')&&!p.includes('/src/discontinuous/')&&!p.includes('polygon-clipping')));
  if(entry==='triaxial')assert(inputs.every(p=>!p.includes('/vendor/')),'Triaxial import unexpectedly retains the series solver');
  rows.push({entry,...size,ceilings:{minified,gzip}});
 }
 console.log(JSON.stringify({exports:'ESM/CJS/strict types passed',rows},null,2));
}finally{rmSync(dir,{recursive:true,force:true});}
