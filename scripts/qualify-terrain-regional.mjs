// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {Session} from 'node:inspector';
import {performance} from 'node:perf_hooks';
import {fileURLToPath} from 'node:url';
import {HeightField,createTerrainMesh,createMartiniTerrainMesh,createDelatinTerrainMesh,createTerrainGradientGrid} from '../modules/geospatial/dist/terrain/index.js';
const names=['sierra','pacific','sierra-nodata'],backends=['regular','martini','delatin'];
const folder=new URL('../modules/geospatial/test/terrain/fixtures/',import.meta.url);
if(!process.argv.includes('--case')){
 const results=[];
 for(const name of names)for(const backend of backends){const run=spawnSync(process.execPath,[fileURLToPath(import.meta.url),'--case',name,backend],{encoding:'utf8'});if(run.status!==0)throw new Error(run.stderr);results.push(JSON.parse(run.stdout));}
 console.log(JSON.stringify({runtime:process.version,platform:`${process.platform}/${process.arch}`,results,scope:'Separate processes per case. RSS is OS-reported process high-water memory, including runtime; sampled JS allocations exclude ArrayBuffer storage. Output bytes are exact retained mesh buffers. Warm timing is not a regional-scale throughput claim. Metric frame is EPSG:3857, not ground-distance corrected.'},null,2));
}else{
 const [name,backend]=process.argv.slice(-2),fixture=JSON.parse(readFileSync(new URL(`${name}-reference.json`,folder),'utf8'));
 const sourceName=name.split('-')[0],raw=readFileSync(new URL(`${sourceName}.tif`,folder));
 if(createHash('sha256').update(raw).digest('hex')!==fixture.sha256)throw new Error('DEM source hash mismatch');
 const heights=Float64Array.from(fixture.heights,x=>x??NaN);
 let field=new HeightField({...fixture,heights}),crop=null;
 if(backend!=='regular'){
  outer:for(let y=0;y+9<=fixture.height;y++)for(let x=0;x+9<=fixture.width;x++){
   const h=Float64Array.from({length:81},(_,i)=>heights[(y+Math.floor(i/9))*fixture.width+x+i%9]);
   if(h.every(Number.isFinite)){field=new HeightField({width:9,height:9,heights:h});crop={x,y,width:9,height:9};break outer;}
  }
  if(!crop){console.log(JSON.stringify({name,backend,status:'unsupported-input',reason:'No complete 9x9 crop; adaptive builders require complete grids. No nodata filling performed.',source:fixture.source,sha256:fixture.sha256}));process.exit(0);}
 }
 const create={regular:createTerrainMesh,martini:createMartiniTerrainMesh,delatin:createDelatinTerrainMesh}[backend];
 for(let i=0;i<3;i++)create(field,{maxError:5});
 const session=new Session();session.connect();const post=(method,params={})=>new Promise((resolve,reject)=>session.post(method,params,(error,result)=>error?reject(error):resolve(result)));
 const times=[];let mesh;
 for(let i=0;i<21;i++){const start=performance.now();mesh=create(field,{maxError:5});times.push(performance.now()-start);}
 await post('HeapProfiler.startSampling',{samplingInterval:512,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true});
 const before=process.memoryUsage();
 for(let i=0;i<21;i++)mesh=create(field,{maxError:5});
 const {profile}=await post('HeapProfiler.stopSampling');session.disconnect();times.sort((a,b)=>a-b);
 const sum=node=>node.selfSize+node.children.reduce((n,c)=>n+sum(c),0);
 const after=process.memoryUsage(),grid=createTerrainGradientGrid(field);
 console.log(JSON.stringify({name,backend,source:fixture.source,sha256:fixture.sha256,gdalVersion:fixture.gdalVersion,crop,width:field.width,height:field.height,validSamples:field.validCount,validDerivatives:grid.statuses.filter(s=>s===0).length,triangles:mesh.indices.length/3,maxNodalError:mesh.error?.maxSampleError??0,outputBytes:mesh.positions.byteLength+mesh.indices.byteLength+mesh.gridCoordinates.byteLength,p50Milliseconds:times[10],p95Milliseconds:times[19],sampledJSAllocationBytes:sum(profile.head),sampledAllocationEvents:profile.samples.length,arrayBufferBytesBefore:before.arrayBuffers,arrayBufferBytesAfter:after.arrayBuffers,peakRSSKiB:process.resourceUsage().maxRSS}));
}
