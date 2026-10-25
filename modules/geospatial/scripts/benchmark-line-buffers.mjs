// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Session} from 'node:inspector/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir,cpus} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {bundleRuntime} from '../projection/scripts/benchmark-runtime.mjs';
const {values}=parseArgs({options:{output:{type:'string'},allocations:{type:'boolean',default:false},points:{type:'string',default:'512'},samples:{type:'string',default:'9'}}});
const points=Number(values.points),samples=Number(values.samples);
assert(Number.isInteger(points)&&points>=16&&points<=100000);
assert(Number.isInteger(samples)&&samples>=3&&samples<=31);
assert(!values.allocations||points<=4096,'Allocation profiling is capped at 4096 points per batch');
const root=fileURLToPath(new URL('../../../',import.meta.url)),dir=mkdtempSync(join(tmpdir(),'mathgl-line-benchmark-'));
function summarize(raw){
 const sorted=[...raw].sort((a,b)=>a-b),q=p=>{const i=(sorted.length-1)*p,j=Math.floor(i);return sorted[j]+(sorted[Math.ceil(i)]-sorted[j])*(i-j);};
 const medianNanoseconds=q(.5),p10=q(.1),p90=q(.9),spread=(p90-p10)/medianNanoseconds;
 return {medianNanoseconds,p10,p90,spread,unstable:spread>.2,raw};
}
try{
 const out=join(dir,'entry.mjs');await bundleRuntime(root,'modules/geospatial/test/line-buffer-benchmark-entry.ts',out);
 const {prepare}=await import(pathToFileURL(out).href),jobs=prepare(points),rows=[];
 for(const job of jobs){
  assert(job.qualify(),'Packed/scalar fields differ before timing');
  for(const name of ['scalar','packed']){const start=performance.now();do{job[name]();}while(performance.now()-start<200);}
  const raw={scalar:[],packed:[]};
  for(let sample=0;sample<samples;sample++)for(const name of sample%2?['packed','scalar']:['scalar','packed']){
   let iterations=1,ms;
   for(;;){const start=performance.now();for(let i=0;i<iterations;i++)job[name]();ms=performance.now()-start;if(ms>=30||iterations>=4096)break;iterations*=2;}
   raw[name].push(ms/iterations/points*1e6);
  }
  const scalar=summarize(raw.scalar),packed=summarize(raw.packed);
  rows.push({operation:job.name,scalar,packed,allocation:[],packedOverScalar:packed.medianNanoseconds/scalar.medianNanoseconds});
 }
 if(values.allocations){
  const session=new Session();session.connect();
  try{for(let j=0;j<jobs.length;j++)for(const name of ['scalar','packed']){
   const iterations=Math.max(1,Math.min(5,Math.floor(10240/points)));
   await session.post('HeapProfiler.startSampling',{samplingInterval:4096,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true});
   let profile;try{for(let i=0;i<iterations;i++)jobs[j][name]();}finally{({profile}=await session.post('HeapProfiler.stopSampling'));}
   const sum=n=>n.selfSize+n.children.reduce((v,c)=>v+sum(c),0);
   rows[j].allocation.push({implementation:name,points:iterations*points,samples:profile.samples.length,sampledEstimatedBytesPerPoint:sum(profile.head)/(iterations*points)});
  }}finally{session.disconnect();}
 }
 const report={node:process.version,platform:process.platform,architecture:process.arch,cpu:cpus()[0]?.model,sourceSHA256:createHash('sha256').update(readFileSync(out)).digest('hex'),points,samples,methodology:'Equal-output scalar-to-packed and prepared-buffer workloads. Preparation/reusable outputs excluded; 200ms warmup per implementation, rotating sample order, 30ms minimum samples. Spread above 0.2 is marked unstable; ratios do not establish portable speedups. All timing precedes V8 allocation profiling (4096-byte sampling). Internal kernel temporaries may allocate; staging/commit costs included.',rows};
 if(values.output)writeFileSync(values.output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{rmSync(dir,{recursive:true,force:true});}
