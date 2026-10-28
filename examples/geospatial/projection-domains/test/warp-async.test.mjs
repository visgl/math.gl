// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {runWarpSync} from '../warp/refine.mjs';
import {runWarpAsync,prepareInverseAsync} from '../warp/async.mjs';
import {prepareInverse} from '../warp/prepare.mjs';
import {createCharts} from '../warp/fixtures.mjs';
const seed={positions:new Float64Array([0,0,1,0,0,1]),indices:new Uint32Array([0,1,2])};
const transform=p=>[p[0]**2,p[1]**2];
const batch=async points=>{const out=new Float64Array(points.length);for(let i=0;i<points.length;i+=2)out.set(transform(points.slice(i,i+2)),i);return out;};
test('batch frontiers produce identical geometry and bounded calls',async()=>{
  let calls=0;const asyncResult=await runWarpAsync(seed,async p=>{assert(p.length<=14);calls++;return batch(p);},{batchSize:7,tolerance:.02});
  const sync=runWarpSync(seed,transform,{tolerance:.02});
  for(const k of ['positions','sourcePositions','indices'])assert.deepEqual(asyncResult[k],sync[k]);
  assert.equal(asyncResult.diagnostics.batches,calls);assert(calls>1);
});
test('cancellation during a batch cannot publish a completed mesh',async()=>{
  const controller=new AbortController();let calls=0;
  await assert.rejects(runWarpAsync(seed,async p=>{calls++;controller.abort(new Error('superseded'));return batch(p);},{signal:controller.signal}),/superseded/);
  assert.equal(calls,1);
});
test('batch errors, malformed output and invalid options propagate',async()=>{
  for(const fn of [async()=>new Float32Array(6),async()=>new Float64Array([NaN]),async()=>{throw new Error('backend failed');}])
    await assert.rejects(runWarpAsync(seed,fn));
  await assert.rejects(runWarpAsync(seed,batch,{batchSize:0}));
  await assert.rejects(runWarpAsync({...seed,indices:[0,1.5,2]},batch));
  await assert.rejects(prepareInverseAsync({...createCharts()[0],row:-1},batch));
  const controller=new AbortController();controller.abort(new Error('already cancelled'));
  await assert.rejects(runWarpAsync(seed,batch,{signal:controller.signal}),/already cancelled/);
});
test('native asynchronous chart evaluator matches synchronous preparation',async()=>{
  const chart=createCharts('antarctica','world')[0];
  const mesh=await prepareInverseAsync(chart,async p=>{const out=new Float64Array(p.length);for(let i=0;i<p.length;i+=2)out.set(chart.inverse(p.slice(i,i+2)),i);return out;},{tolerance:2});
  const sync=prepareInverse(chart,{tolerance:2});
  for(const k of ['positions','indices','uv','sourceRows'])assert.deepEqual(mesh[k],sync[k]);
});
