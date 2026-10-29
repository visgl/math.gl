// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectDisplayError,qualifyDisplayMesh} from '../lab/display-error.mjs';
import {prepareForward} from '../lab/forward.mjs';
import {prepareInverse} from '../warp/prepare.mjs';
import {createCharts} from '../warp/fixtures.mjs';
test('both polar strategies pass the same anisotropic display and texture gates at two zooms',async()=>{
  const chart=createCharts('antarctica','orthographic')[0];
  for(const pixelsPerUnit of [[180,90],[360,180]])for(const mode of ['forward','inverse']){
    const mesh=await qualifyDisplayMesh(tolerance=>mode==='forward'?prepareForward(chart,chart.forward,{tolerance,pixelsPerUnit:Math.max(...pixelsPerUnit)}):prepareInverse(chart,{tolerance}),chart,{pixelsPerUnit,displayTolerance:1,textureTolerance:2});
    const q=mesh.diagnostics.qualification;assert(q.maximumDisplayError<=1);assert(q.maximumTextureError<=2);assert(q.samples>0);
  }
});
test('display residual responds to camera scaling and qualification rejects exhausted budgets',async()=>{
  const chart=createCharts('antarctica','orthographic')[0],mesh=prepareInverse(chart,{tolerance:4});
  const a=inspectDisplayError(mesh,chart,{pixelsPerUnit:[180,90]}),b=inspectDisplayError(mesh,chart,{pixelsPerUnit:[360,180]});
  assert(Math.abs(b.maximumDisplayError-2*a.maximumDisplayError)<1e-10);
  assert.equal(a.maximumTextureError,b.maximumTextureError);
  await assert.rejects(qualifyDisplayMesh(()=>mesh,chart,{displayTolerance:1e-10,maxAttempts:1}),/budget/);
  const controller=new AbortController();controller.abort(new Error('cancelled'));
  await assert.rejects(qualifyDisplayMesh(()=>mesh,chart,{signal:controller.signal}),/cancelled/);
});

import {prepareJob} from '../lab/job.mjs';
test('common policy passes through native and external worker job specifications',async()=>{
  for(const engine of ['native','proj4','d3'])for(const mode of ['inverse','forward']){
    const result=await prepareJob({source:'antarctica',target:'orthographic',engine,mode,tolerance:1,displayPolicy:{pixelsPerUnit:[360,180],displayTolerance:1,textureTolerance:2}});
    const q=result.meshes[0].diagnostics.qualification;
    assert(q.maximumDisplayError<=1&&q.maximumTextureError<=2);
  }
});
