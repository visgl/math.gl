// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {build} from 'esbuild';
const root=fileURLToPath(new URL('../../../',import.meta.url)),require=createRequire(import.meta.url);
for(const load of[p=>import(p),p=>require(p)]){
 const {cutSphericalPolygon,MapEngine}=await load('@math.gl/geospatial/discontinuous');
 const ring=[[-135,0],[-45,0],[45,0],[135,0]];
 assert(cutSphericalPolygon([ring],{interior:'left'}).length>=4);
 assert(new MapEngine({version:1,id:'test',definition:{type:'goode'}}).projectGlobalPolygon([ring],{interior:'left',tolerance:.01}).length>0);
}
const dir=mkdtempSync(join(tmpdir(),'mathgl-global-cuts-package-'));
try{
 const scope=join(dir,'node_modules/@math.gl');mkdirSync(scope,{recursive:true});for(const name of['core','geometry','geospatial','web-mercator'])symlinkSync(join(root,'modules',name),join(scope,name));
 writeFileSync(join(dir,'package.json'),'{"type":"module"}');
 for(const ext of['ts','cts'])writeFileSync(join(dir,'consumer.'+ext),readFileSync(join(root,'test/types/global-cuts/index.'+ext)));
 writeFileSync(join(dir,'tsconfig.json'),JSON.stringify({compilerOptions:{target:'es2020',module:'NodeNext',moduleResolution:'NodeNext',strict:true,noEmit:true,skipLibCheck:false,types:[]},include:['consumer.ts','consumer.cts']}));
 execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--project',join(dir,'tsconfig.json')],{stdio:'inherit'});
 const result=await build({stdin:{contents:"export {cutSphericalPolygon} from '@math.gl/geospatial/discontinuous';",resolveDir:root,loader:'ts'},bundle:true,minify:true,write:false,format:'esm',platform:'browser',metafile:true});
 const code=result.outputFiles[0].contents, bytes=code.byteLength,gzip=gzipSync(code,{level:9}).length;
 // A new optional feature ceiling, not an increase to any existing entry budget.
 assert(bytes<=60000&&gzip<=20000,'Global cuts feature ceiling exceeded');
 const retained=Object.entries(Object.values(result.metafile.outputs)[0].inputs).filter(([,v])=>v.bytesInOutput>0).map(([p])=>p);
 assert(retained.every(p=>!p.includes('vendor/geographiclib')&&!p.includes('/src/projection/')&&!p.includes('world-kernels')),'Cut-only import retained unrelated engines');
 console.log(JSON.stringify({exports:'ESM/CJS and public types passed',bytes,gzip}));
}finally{rmSync(dir,{recursive:true,force:true});}
