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
 const {clipGeographicPolygon,clipGeographicPolyline,subdivideGeographicCutRing}=await load('@math.gl/geospatial');
 const input=[{positions:[-40,-40,40,-40,40,40,-40,40]}],options={edgeModel:'geodesic',latitudeRange:[0,30]};
 const polygons=clipGeographicPolygon(input,options);assert.equal(polygons.length,1);
 assert(clipGeographicPolyline([0,-20,10,20],options).length>0);
 const p=subdivideGeographicCutRing(input,polygons[0].rings[0],{...options,transform:p=>p,tolerance:.01});
 assert.equal(p.edges.length,p.positions.length/2-1);
}
const dir=mkdtempSync(join(tmpdir(),'mathgl-geographic-cuts-package-'));
try{
 const scope=join(dir,'node_modules/@math.gl');mkdirSync(scope,{recursive:true});for(const name of['core','geometry','geospatial','web-mercator'])symlinkSync(join(root,'modules',name),join(scope,name));
 writeFileSync(join(dir,'package.json'),'{"type":"module"}');
 for(const ext of['ts','cts'])writeFileSync(join(dir,'consumer.'+ext),readFileSync(join(root,'test/types/geographic-cuts/index.'+ext)));
 writeFileSync(join(dir,'tsconfig.json'),JSON.stringify({compilerOptions:{target:'es2020',module:'NodeNext',moduleResolution:'NodeNext',strict:true,noEmit:true,skipLibCheck:false,types:[]},include:['consumer.ts','consumer.cts']}));
 execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--project',join(dir,'tsconfig.json')],{stdio:'inherit'});
 const result=await build({stdin:{contents:"export {clipGeographicPolygon,subdivideGeographicCutRing} from '@math.gl/geospatial';",resolveDir:root,loader:'ts'},bundle:true,minify:true,write:false,format:'esm',platform:'browser',metafile:true});
 const code=result.outputFiles[0].contents, bytes=code.byteLength,gzip=gzipSync(code,{level:9}).length;
 // A new optional feature ceiling, not an increase to any existing entry budget.
 assert(bytes<=80000&&gzip<=29000,'Latitude cuts feature ceiling exceeded');
 const retained=Object.entries(Object.values(result.metafile.outputs)[0].inputs).filter(([,v])=>v.bytesInOutput>0).map(([p])=>p);
 assert(retained.every(p=>!p.includes('/src/projection/')&&!p.includes('/src/discontinuous/')&&!p.includes('polygon-clipping')),'Cut-only import retained unrelated engines');
 console.log(JSON.stringify({exports:'ESM/CJS and public types passed',bytes,gzip}));
}finally{rmSync(dir,{recursive:true,force:true});}
