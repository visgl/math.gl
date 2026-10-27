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
 const {createOrthographicCutAtlas,createOctahedralCutAtlas}=await load('@math.gl/geospatial');
 const {atlas,project}=createOrthographicCutAtlas({viewDirection:[1,1,1],edgeModel:'geodesic'});
 const inputs=[{positions:[-40,-40,40,-40,40,40,-40,40]}],ring=atlas.clipPolygon(inputs)[0].rings[0];
 assert(atlas.subdivideRing(inputs,ring,{transform:project,tolerance:1000}).positions.every(Number.isFinite));
 const map=createOctahedralCutAtlas({edgeModel:'linear'});assert.equal(map.atlas.clipPolygon(inputs).length,4);
}
const dir=mkdtempSync(join(tmpdir(),'mathgl-geographic-atlas-package-'));
try{
 const scope=join(dir,'node_modules/@math.gl');mkdirSync(scope,{recursive:true});for(const name of['core','geometry','geospatial','web-mercator'])symlinkSync(join(root,'modules',name),join(scope,name));
 writeFileSync(join(dir,'package.json'),'{"type":"module"}');
 for(const ext of['ts','cts'])writeFileSync(join(dir,'consumer.'+ext),readFileSync(join(root,'test/types/geographic-atlas/index.'+ext)));
 writeFileSync(join(dir,'tsconfig.json'),JSON.stringify({compilerOptions:{target:'es2020',module:'NodeNext',moduleResolution:'NodeNext',strict:true,noEmit:true,skipLibCheck:false,types:[]},include:['consumer.ts','consumer.cts']}));
 execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--project',join(dir,'tsconfig.json')],{stdio:'inherit'});
 const result=await build({stdin:{contents:"export {GeographicCutAtlas,createOrthographicCutAtlas,createOctahedralCutAtlas} from '@math.gl/geospatial';",resolveDir:root,loader:'ts'},bundle:true,minify:true,write:false,format:'esm',platform:'browser',metafile:true});
 const code=result.outputFiles[0].contents, bytes=code.byteLength,gzip=gzipSync(code,{level:9}).length;
 // A new optional feature ceiling, not an increase to any existing entry budget.
 assert(bytes<=90000&&gzip<=32000,'Geographic atlas feature ceiling exceeded');
 const retained=Object.entries(Object.values(result.metafile.outputs)[0].inputs).filter(([,v])=>v.bytesInOutput>0).map(([p])=>p);
 assert(retained.every(p=>!p.includes('/src/projection/')&&!p.includes('/src/discontinuous/')&&!p.includes('polygon-clipping')),'Cut-only import retained unrelated engines');
 console.log(JSON.stringify({exports:'ESM/CJS and public types passed',bytes,gzip}));
}finally{rmSync(dir,{recursive:true,force:true});}
