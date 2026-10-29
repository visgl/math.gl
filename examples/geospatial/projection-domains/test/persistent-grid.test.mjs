// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';import assert from 'node:assert/strict';
import {createPersistentGrid,updatePersistentUV} from '../lab/persistent-grid.mjs';
import {createCharts} from '../warp/fixtures.mjs';import {createBackend} from '../lab/backends.mjs';
test('persistent patch changes UVs while preserving geometry across engines and centers',async()=>{
  const grid=createPersistentGrid(),before=grid.positions.slice(),indices=grid.indices.slice();let previous;
  for(const engine of ['native','proj4','d3'])for(const center of [[0,-90],[20,-85]]) {
    const backend=await createBackend(engine,createCharts('antarctica','orthographic',{center})[0],'orthographic',center);
    try{const result=await updatePersistentUV(grid,backend.evaluate,{center});assert(result.diagnostics.maximumError<=2);if(previous)assert.notDeepEqual(result.uv,previous);previous=result.uv;}
    finally{await backend.dispose();}
  }
  assert.deepEqual(grid.positions,before);assert.deepEqual(grid.indices,indices);
});
test('changed domains, coverage, error and cancellation reject updates',async()=>{
  const grid=createPersistentGrid(),evaluate=async points=>Float64Array.from(points,v=>128+v*50);
  await assert.rejects(updatePersistentUV(grid,evaluate,{target:'interrupted'}),/rebuild/);
  await assert.rejects(updatePersistentUV(grid,evaluate,{center:[0,-50]}),/rebuild/);
  await assert.rejects(updatePersistentUV(grid,async p=>new Float64Array(p.length).fill(300)),/coverage/);
  await assert.rejects(updatePersistentUV(grid,async p=>Float64Array.from(p,v=>128+Math.sin(v*100)*20),{tolerance:.001}),/texture error/);
  const controller=new AbortController();await assert.rejects(updatePersistentUV(grid,async p=>{controller.abort(new Error('Superseded'));return evaluate(p);},{signal:controller.signal}),/Superseded/);
});
