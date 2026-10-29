// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {createPersistentGrid} from '../lab/persistent-grid.mjs';
import {updateOrRebuild} from '../lab/reuse-policy.mjs';
import {createCharts} from '../warp/fixtures.mjs';
import {prepareInverse} from '../warp/prepare.mjs';
const evaluate=async values=>Float64Array.from(values,v=>128+v*100);
test('center and coverage invalidation rebuild with explicit reasons',async()=>{
  const grid=createPersistentGrid();let calls=0;
  const rebuild=()=>{calls++;return prepareInverse(createCharts('antarctica','orthographic',{center:[0,-70]})[0],{tolerance:2});};
  assert.equal((await updateOrRebuild(grid,evaluate,rebuild)).mode,'reuse');assert.equal(calls,0);
  const center=await updateOrRebuild(grid,evaluate,rebuild,{center:[0,-70]});
  assert.equal(center.reason,'domain-policy');assert(center.result.indices.length>0);assert.equal(calls,1);
  const coverage=await updateOrRebuild(grid,async p=>new Float64Array(p.length).fill(-1),rebuild);
  assert.equal(coverage.reason,'source-coverage');assert.equal(calls,2);
});
test('texture limits rebuild but backend failures and cancellation do not',async()=>{
  const grid=createPersistentGrid();let calls=0;const rebuild=()=>{calls++;return 'rebuilt';};
  const curved=async p=>Float64Array.from(p,(v,i)=>i%2?128+100*v:128+100*v*v);
  const result=await updateOrRebuild(grid,curved,rebuild,{tolerance:1e-8});assert.equal(result.reason,'texture-error');assert.equal(calls,1);
  await assert.rejects(updateOrRebuild(grid,async()=>{throw new Error('backend offline');},rebuild),/backend offline/);assert.equal(calls,1);
  const controller=new AbortController();
  await assert.rejects(updateOrRebuild(grid,evaluate,()=>{controller.abort(new Error('cancelled'));return 'stale';},{center:[0,-70],signal:controller.signal}),/cancelled/);
  await assert.rejects(updateOrRebuild(grid,evaluate,()=>{throw new Error('fallback failed');},{center:[0,-70]}),/fallback failed/);
});
