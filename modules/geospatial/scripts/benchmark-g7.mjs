// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original equal-accuracy, rotated-order G7/C8 baseline; native compilation/downloads are never part of CI.
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
const {values}=parseArgs({options:{'baseline-ref':{type:'string',default:'origin/master'},points:{type:'string',default:'1000'},samples:{type:'string',default:'7'},'min-sample-ms':{type:'string',default:'4'},allocations:{type:'boolean',default:false},native:{type:'string'},output:{type:'string'}}});
const points=Number(values.points),samples=Number(values.samples),minimum=Number(values['min-sample-ms']);
assert(Number.isSafeInteger(points)&&points>=10&&points<=1000000,'Invalid points');
assert(Number.isSafeInteger(samples)&&samples>=3&&samples<=31,'Invalid samples');
assert(Number.isFinite(minimum)&&minimum>=0&&minimum<=100,'Invalid sample window');
const root=fileURLToPath(new URL('../../../',import.meta.url));
const baselineCommit=execFileSync('git',['rev-parse','--verify',values['baseline-ref']+'^{commit}'],{cwd:root,encoding:'utf8'}).trim();
const directory=mkdtempSync(join(tmpdir(),'mathgl-g7-'));
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
function summarize(raw) {
 const sorted=raw.map(r=>r.milliseconds/r.iterations/points).sort((a,b)=>a-b);
 const quantile=q=>{const i=(sorted.length-1)*q,j=Math.floor(i);return sorted[j]+(sorted[Math.ceil(i)]-sorted[j])*(i-j);};
 const median=quantile(.5),p10=quantile(.1),p90=quantile(.9);
 return {medianNanoseconds:median*1e6,p10Nanoseconds:p10*1e6,p90Nanoseconds:p90*1e6,spread:(p90-p10)/Math.max(median,Number.MIN_VALUE),unstable:(p90-p10)/Math.max(median,Number.MIN_VALUE)>.2,timingLimited:minimum===0||raw.some(r=>r.milliseconds<minimum),raw};
}
function measure(job) {
 let iterations=1,milliseconds;
 for(;;) {
  const start=performance.now();for(let i=0;i<iterations;i++)job.run(points);milliseconds=performance.now()-start;
  if(milliseconds>=minimum||iterations>=65536)break;
  iterations*=2;
 }
 const checksum=job.checksum();assert(Number.isFinite(checksum),'Nonfinite benchmark checksum');
 return {milliseconds,iterations,checksum};
}
try {
 const entry='modules/geospatial/test/g7-benchmark-entry.ts';
 const engines=[],bundles=[];
 for(const [index,ref] of [baselineCommit,undefined].entries()) {
  const file=join(directory,index?'candidate.mjs':'baseline.mjs');await bundleRuntime(root,entry,file,ref);
  engines.push(await import(pathToFileURL(file).href));bundles.push(hash(file));
 }
 const qualification=engines.map((engine,index)=>{
  const rows=engine.qualifyC8(Boolean(index));
  assert(rows.every(r=>r.passed),'C8 accuracy failed before timing '+(index?'candidate':'ordinary baseline'));
  return {profile:index?'complete candidate':'ordinary baseline (fixed edge cases excluded)',rows:rows.length,maxBudgetUsage:Math.max(...rows.map(r=>r.budgetUsage))};
 });
 const jobs=engines.map(e=>e.prepareJobs());assert.deepEqual(jobs[0].map(j=>j.id),jobs[1].map(j=>j.id));
 for(const [index,list] of jobs.entries())for(const job of list){assert(job.errors.every(v=>Number.isFinite(v)&&v<=1),job.id+' native accuracy failed at revision '+index);for(let i=0;i<3;i++)job.run(points);assert(Number.isFinite(job.checksum()),'Warmup checksum');}
 let native;
 if(values.native) {
  native=JSON.parse(execFileSync(values.native,['--metadata'],{encoding:'utf8'}));
  assert.equal(native.version,'2.7');assert.equal(native.precisionBits,53);
  assert.equal(native.driverSHA256,hash(join(root,'modules/geospatial/scripts/geographiclib-g7-benchmark.cpp')),'Native binary differs from reviewed driver');
  const qualification=[];
  for(const op of engines[1].nativeOperations) {
   const cases=engines[1].inputs(op);
   const input=cases.length+'\n'+cases.map(r=>[...r.axes,...r.input].join(' ')).join('\n')+'\n';
   const output=execFileSync(values.native,['--evaluate',op],{input,encoding:'utf8',timeout:60000}).trim();
   const actual=output.split(/\r?\n/).map(line=>line.trim().split(/\s+/).map(Number));
   const errors=engines[1].nativeOutputErrors(op,actual);
   assert(errors.every(error=>Number.isFinite(error)&&error<=1),'Actual native executable failed stored output budgets: '+op);
   qualification.push({operation:op,rows:errors.length,maxBudgetUsage:Math.max(...errors)});
  }
  native={...native,binarySHA256:hash(values.native),compilerFlags:'-std=c++17 -O2; GEOGRAPHICLIB_PRECISION=2; no LTO',qualification};
 }
 const rows=[];
 for(let i=0;i<jobs[0].length;i++) {
  const job=jobs[1][i];
  const run=[()=>measure(jobs[0][i]),()=>measure(job)];
  if(native&&job.nativeOp) {
   const cases=engines[1].inputs(job.nativeOp);
   const input=cases.length+'\n'+cases.map(r=>[...r.axes,...r.input].join(' ')).join('\n')+'\n';
   run.push(()=>{
    const result=JSON.parse(execFileSync(values.native,['--measure',job.nativeOp,String(points),String(minimum)],{input,encoding:'utf8',timeout:60000}));
    assert(result.milliseconds>=0&&Number.isSafeInteger(result.iterations)&&result.iterations>0&&Number.isFinite(result.checksum),'Invalid native sample');return result;
   });
  }
  const raw=run.map(()=>[]);
  for(let sample=0;sample<samples;sample++)for(let offset=0;offset<run.length;offset++){const k=(sample+offset)%run.length;raw[k].push(run[k]());}
  const measurements=raw.map((r,k)=>({implementation:['math.gl baseline','math.gl candidate','GeographicLib C++ 2.7'][k],...summarize(r)}));
  rows.push({id:job.id,phase:job.phase,accuracy:{nativeMaxBudgetUsage:Math.max(0,...job.errors),c8Profiles:qualification},measurements,
    candidateOverBaseline:measurements[1].medianNanoseconds/measurements[0].medianNanoseconds,
    ...(measurements[2]?{candidateOverNative:measurements[1].medianNanoseconds/measurements[2].medianNanoseconds}:{})});
 }
 const allocations=[];
 if(values.allocations) {
  const session=new Session();session.connect();
  try {
   for(const [index,list] of jobs.entries())for(const job of list) {
    await session.post('HeapProfiler.startSampling',{samplingInterval:4096,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true});
    let profile;try{for(let i=0;i<5;i++)job.run(points);}finally{({profile}=await session.post('HeapProfiler.stopSampling'));}
    const sum=n=>n.selfSize+n.children.reduce((t,c)=>t+sum(c),0);
    allocations.push({id:job.id,implementation:index?'candidate':'baseline',sampleCount:profile.samples.length,points:points*5,sampledEstimatedBytesPerOperation:sum(profile.head)/(points*5)});
   }
  }finally{session.disconnect();}
 }
 const report={schemaVersion:1,metadata:{date:new Date().toISOString(),baselineCommit,candidateCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),bundleSHA256:{baseline:bundles[0],candidate:bundles[1]},workloadSHA256:hash(join(root,entry)),nativeReference:engines[1].nativeProvenance,native,node:process.version,v8:process.versions.v8,cpu:cpus()[0]?.model,platform:process.platform,architecture:process.arch,points,samples,minSampleMs:minimum},
  methodology:'Initial Node baseline, not a speed gate or universal performance claim. Current identical workload resolves historical/candidate source and export maps. Full C8 candidate and ordinary overlapping baseline profiles gate before timing; fixed edge cases are not timed against baseline failures. Native G7 outputs gate field-by-field against pinned stored controls at existing accuracy budgets. Solver setup consumes normalized area without retaining all constructed instances (JIT escape analysis may apply). Public direct calls (including line setup), and reused lines are separate jobs. All non-area geodesic outputs are requested on both sides; rhumb comparator is C++ Exact. Inputs, reusable buffers, solver/line preparation and correctness checks are outside operation timing. Warmup is three batches. Samples rotate baseline/candidate/native order; native process startup, I/O and preparation are excluded by its internal steady clock. Native processes warm one batch per sample; JS shares a process, so cross-language ratios remain diagnostic. Output dispatch/stores and public JS object costs are included. Heap sampling runs after all timings, includes runtime overhead and may miss allocations; zero samples do not establish zero allocation. No native heap claim. No browser throughput or new bulk-API claim.',qualification,rows,allocations};
 if(values.output)writeFileSync(values.output,JSON.stringify(report,null,2)+'\n');
 console.table(rows.map(r=>({operation:r.id,phase:r.phase,candidateNanoseconds:r.measurements[1].medianNanoseconds,candidateOverBaseline:r.candidateOverBaseline,candidateOverNative:r.candidateOverNative})));
}finally{rmSync(directory,{recursive:true,force:true});}
