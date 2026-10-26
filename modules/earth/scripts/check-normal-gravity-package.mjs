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
 const {NormalGravity}=await load('@math.gl/earth/normal-gravity');
 assert(Math.abs(NormalGravity.WGS84().surfaceGravity(0)-9.780325335903891)<2e-12);
 const p=new NormalGravity({semiMajorAxis:2,flattening:0,gravitationalParameter:8,angularVelocity:0}).evaluateCartesian(3,4,0);
 assert.equal(p.potential,1.6);
}
const dir=mkdtempSync(join(tmpdir(),'mathgl-normal-gravity-package-'));
try{
 const scope=join(dir,'node_modules/@math.gl');mkdirSync(scope,{recursive:true});symlinkSync(join(root,'modules/earth'),join(scope,'earth'));
 writeFileSync(join(dir,'package.json'),'{"type":"module"}');
 for(const ext of['ts','cts'])writeFileSync(join(dir,'consumer.'+ext),readFileSync(join(root,'test/types/normal-gravity/index.'+ext)));
 writeFileSync(join(dir,'tsconfig.json'),JSON.stringify({compilerOptions:{target:'es2020',module:'NodeNext',moduleResolution:'NodeNext',strict:true,noEmit:true,skipLibCheck:false,types:[]},include:['consumer.ts','consumer.cts']}));
 execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--project',join(dir,'tsconfig.json')],{stdio:'inherit'});
 const bundle=await build({stdin:{contents:"export {NormalGravity} from '@math.gl/earth/normal-gravity';",resolveDir:root,loader:'ts'},bundle:true,minify:true,write:false,format:'esm',platform:'browser',metafile:true});
 const code=bundle.outputFiles[0].contents,bytes=code.byteLength,gzip=gzipSync(code,{level:9}).length;
 // New standalone feature ceiling; existing package budgets are unchanged.
 assert(bytes<=8000&&gzip<=3000,'Normal-gravity feature ceiling exceeded');
 const sources=Object.keys(bundle.metafile.inputs).filter(p=>p!=='<stdin>');assert.equal(sources.length,1);assert(sources.every(p=>p.endsWith('/normal-gravity.js')),'Normal gravity retained unrelated model/data payload');
 console.log(JSON.stringify({exports:'ESM/CJS and strict public types passed',bytes,gzip}));
}finally{rmSync(dir,{recursive:true,force:true});}
