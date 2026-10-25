// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original equal-accuracy packed/scalar measurements; no speed threshold or zero-allocation inference.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {Session} from 'node:inspector/promises';
import {cpus,tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {bundleRuntime} from '../projection/scripts/benchmark-runtime.mjs';
const {values}=parseArgs({options:{'baseline-ref':{type:'string',default:'origin/master'},points:{type:'string',default:'4096'},samples:{type:'string',default:'11'},'min-cpu-ms':{type:'string',default:'8'},allocations:{type:'boolean'},output:{type:'string'}}});
const points=Number(values.points),samples=Number(values.samples),minimum=Number(values['min-cpu-ms']);
assert(Number.isSafeInteger(points)&&points>=16&&points<=1000000);
assert(Number.isSafeInteger(samples)&&samples>=3&&samples<=31);
assert(Number.isFinite(minimum)&&minimum>0&&minimum<=100);
const root=fileURLToPath(new URL('../../../',import.meta.url));
const base=execFileSync('git',['rev-parse',values['baseline-ref']+'^{commit}'],{cwd:root,encoding:'utf8'}).trim();
const entry='modules/geospatial/test/frame-batch-benchmark.ts',directory=mkdtempSync(join(tmpdir(),'mathgl-frame-bench-'));
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
function stats(raw,key){const sorted=raw.map(r=>r[key]*1e6/r.batches/points).sort((a,b)=>a-b);const q=f=>{const p=(sorted.length-1)*f,i=Math.floor(p);return sorted[i]+(sorted[Math.ceil(p)]-sorted[i])*(p-i);};const median=q(.5),spread=(q(.9)-q(.1))/median;return {medianNanoseconds:median,p10Nanoseconds:q(.1),p90Nanoseconds:q(.9),spread,unstable:spread>.2};}
function measure(job){let batches=1,cpuMs,wallMs;for(;;){const cpu=process.cpuUsage(),start=performance.now();for(let i=0;i<batches;i++)job.run();wallMs=performance.now()-start;const use=process.cpuUsage(cpu);cpuMs=(use.user+use.system)/1000;if(cpuMs>=minimum||batches>=65536)break;batches*=2;}const checksum=job.checksum();assert(Number.isFinite(checksum));return {batches,cpuMs,wallMs,checksum};}
try{
 const modules=[],bundles=[];
 for(const [index,ref]of[base,undefined].entries()){const file=join(directory,index?'candidate.mjs':'baseline.mjs');await bundleRuntime(root,entry,file,ref);modules.push(await import(pathToFileURL(file).href));bundles.push(hash(file));}
 const controls=modules[1].qualifyFrameBatches();assert(controls.every(r=>r.passed),'Independent batch controls failed');
 const implementations=['historical scalar / reused vectors','candidate scalar / reused vectors','candidate packed / reused output'];
 const jobs=[modules[0].prepareFrameBatches(points,false),modules[1].prepareFrameBatches(points,false),modules[1].prepareFrameBatches(points,true)];
 const usage=jobs.map(list=>list.map(job=>job.validate()));
 for(const list of jobs)for(const job of list)for(let i=0;i<100;i++)job.run();
 const rows=[];
 for(let j=0;j<jobs[0].length;j++){
  const raw=jobs.map(()=>[]);
  for(let sample=0;sample<samples;sample++)for(let k=0;k<3;k++){const i=(sample+k)%3;raw[i].push(measure(jobs[i][j]));}
  const measurements=raw.map((r,i)=>({implementation:implementations[i],maxBudgetUsage:usage[i][j],cpu:stats(r,'cpuMs'),wall:stats(r,'wallMs'),timingLimited:r.some(x=>x.cpuMs<minimum),raw:r}));
  rows.push({operation:jobs[0][j].id,measurements,packedOverCandidateScalarCPU:measurements[2].cpu.medianNanoseconds/measurements[1].cpu.medianNanoseconds,packedOverCandidateScalarWall:measurements[2].wall.medianNanoseconds/measurements[1].wall.medianNanoseconds});
 }
 const allocations=[];
 if(values.allocations){const session=new Session();session.connect();try{for(let i=0;i<3;i++)for(const job of jobs[i]){await session.post('HeapProfiler.startSampling',{samplingInterval:4096,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true});let profile;try{for(let k=0;k<10;k++)job.run();}finally{({profile}=await session.post('HeapProfiler.stopSampling'));}const sum=n=>n.selfSize+n.children.reduce((s,c)=>s+sum(c),0);allocations.push({operation:job.id,implementation:implementations[i],sampleCount:profile.samples.length,sampledEstimatedBytesPerPoint:sum(profile.head)/(points*10)});}}finally{session.disconnect();}}
 const report={metadata:{date:new Date().toISOString(),baselineCommit:base,candidateCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),bundleSHA256:bundles,workloadSHA256:hash(join(root,entry)),node:process.version,v8:process.versions.v8,cpu:cpus()[0]?.model,platform:process.platform,architecture:process.arch,points,samples,minCPUms:minimum},methodology:'Identical XYZ inputs, retained outputs and independent Decimal geometry at existing 2e-12 axis-normalized budgets. Setup and validation excluded; scalar source/result vectors reused and packed output reused. Warmup 100 batches; order rotates. Adaptive windows use process user+system CPU time to prevent scheduler pauses from shortening work; CPU includes runtime/GC/background threads and is diagnostic, not wall throughput. Wall time, raw samples and >20% spread flags retained. Allocation estimates follow all timing and cannot prove zero allocation. Informational only: no new speed gate, browser/native-bulk claim, or universal performance claim.',qualification:{rows:controls.length,maxBudgetUsage:Math.max(...controls.map(r=>r.budgetUsage))},rows,allocations};
 if(values.output)writeFileSync(values.output,JSON.stringify(report,null,2)+'\n');
 console.table(rows.map(r=>({operation:r.operation,packedOverScalarCPU:r.packedOverCandidateScalarCPU,packedOverScalarWall:r.packedOverCandidateScalarWall})));
}finally{rmSync(directory,{recursive:true,force:true});}
