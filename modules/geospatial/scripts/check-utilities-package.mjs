// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';import{execFileSync}from'node:child_process';import{createRequire}from'node:module';import{mkdtempSync,mkdirSync,readFileSync,writeFileSync,symlinkSync,rmSync}from'node:fs';import{tmpdir}from'node:os';import{join,relative}from'node:path';import{fileURLToPath}from'node:url';import{gzipSync}from'node:zlib';import{transform}from'esbuild';import{bundleRuntime}from'../projection/scripts/benchmark-runtime.mjs';
const root=fileURLToPath(new URL('../../../',import.meta.url)),require=createRequire(import.meta.url);
for(const load of[p=>import(p),p=>require(p)]){
 const c=await load('@math.gl/geospatial/coordinates'),b=await load('@math.gl/geospatial/geodesic-buffer'),t=await load('@math.gl/geospatial/triaxial');
 assert.equal(c.formatMGRS(90,0),'ZAH0000000000');assert.equal(c.parseAngle('12:30N','latitude'),12.5);
 assert.equal(new t.TriaxialEllipsoid({radii:[1,1,1]}).sampleSurface(()=>0)[2],-1);
 const line={position:distance=>({lat2:1,lon2:2,azi2:3,s12:distance,a12:4,m12:5,M12:6,M21:7})};assert.equal(new b.GeodesicLineBuffer(line,1).positions([1],new Float64Array(8))[3],1);
}
const dir=mkdtempSync(join(tmpdir(),'mathgl-utility-package-'));
try{
 const scope=join(dir,'node_modules/@math.gl');mkdirSync(scope,{recursive:true});for(const name of['core','geometry','geospatial','web-mercator'])symlinkSync(join(root,'modules',name),join(scope,name));writeFileSync(join(dir,'package.json'),'{"type":"module"}');
 for(const ext of['ts','cts'])writeFileSync(join(dir,'consumer.'+ext),readFileSync(join(root,'test/types/geographic-utilities/index.'+ext)));
 writeFileSync(join(dir,'tsconfig.json'),JSON.stringify({compilerOptions:{target:'es2020',module:'NodeNext',moduleResolution:'NodeNext',strict:true,noEmit:true,skipLibCheck:false,types:[]},include:['consumer.ts','consumer.cts']}));execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--project',join(dir,'tsconfig.json')],{stdio:'inherit'});
 const rows=[];
 // New optional-entry ceilings set separately; existing budgets are unchanged.
 for(const[entry,symbol,minified,gzip]of[['coordinates','*',60000,20000],['coordinates','parseAngle',4000,1600],['geodesic-buffer','*',8000,3000]]){
  const source=join(dir,'entry.ts'),out=join(dir,'out.mjs');writeFileSync(source,symbol==='*'?`export * from '@math.gl/geospatial/${entry}';`:`export {${symbol}} from '@math.gl/geospatial/${entry}';`);
  const result=await bundleRuntime(root,relative(root,source),out),{code}=await transform(readFileSync(out,'utf8'),{minify:true,target:'es2020',legalComments:'none'});
  const size={minified:Buffer.byteLength(code),gzip:gzipSync(code,{level:9}).length};assert(size.minified<=minified&&size.gzip<=gzip,entry+' feature budget exceeded');
  const inputs=Object.entries(Object.values(result.metafile.outputs)[0].inputs).filter(([,v])=>v.bytesInOutput>0).map(([p])=>p);
  assert(inputs.every(p=>!p.includes('vendor/geographiclib')&&!p.includes('/discontinuous/')&&!p.includes('polygon-clipping')));
  if(symbol==='parseAngle'||entry==='geodesic-buffer')assert(inputs.every(p=>!p.includes('/src/projection/')),'Selective import retains projection kernels');
  rows.push({entry,symbol,...size,ceilings:{minified,gzip}});
 }console.log(JSON.stringify({exports:'ESM/CJS and strict types passed',rows},null,2));
}finally{rmSync(dir,{recursive:true,force:true});}
