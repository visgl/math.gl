// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectDisplayError,qualifyDisplayMesh} from '../../../../../../examples/geospatial/projection-domains/src/lab/display-error.mjs';
import {prepareForward} from '../../../../../../examples/geospatial/projection-domains/src/lab/forward.mjs';
import {prepareInverse} from '../../../../../../examples/geospatial/projection-domains/src/warp/prepare.mjs';
import {createCharts} from '../../../../../../examples/geospatial/projection-domains/src/warp/fixtures.mjs';
test('both polar strategies pass the same anisotropic display and texture gates at two zooms',async()=>{
  const chart=createCharts('antarctica','orthographic')[0];
  for(const pixelsPerUnit of [[180,90],[360,180]])for(const mode of ['forward','inverse']){
    const mesh=await qualifyDisplayMesh(tolerance=>mode==='forward'?prepareForward(chart,chart.forward,{tolerance,pixelsPerUnit:Math.max(...pixelsPerUnit)}):prepareInverse(chart,{tolerance}),chart,{pixelsPerUnit,displayTolerance:1,textureTolerance:2});
    const q=mesh.diagnostics.qualification;assert(q.maximumDisplayError<=1);assert(q.maximumTextureError<=2);assert(q.samples>0);
  }
});
// The chart bends the triangle's source coordinates in Y. Barycentric interpolation
// of the projected vertices incurs a residual of x - x² at each probe.
const displayFixture = {
  mesh: {
    positions: new Float64Array([0, 0, 1, 1, 0, 1]),
    uv: new Float64Array([0, 0, 1, 0, 0, 1]),
    indices: new Uint32Array([0, 1, 2])
  },
  chart: {
    width: 1,
    height: 1,
    forward: ([x, y]) => [x, y + x * x],
    inverse: ([x, y]) => [x, y - x * x]
  }
};

test('doubling camera scale doubles display residual and preserves texture residual', () => {
  const {mesh, chart} = displayFixture;
  const a = inspectDisplayError(mesh, chart, {pixelsPerUnit: [180, 90]});
  const b = inspectDisplayError(mesh, chart, {pixelsPerUnit: [360, 180]});
  assert.equal(a.samples, 3);
  assert.equal(b.samples, a.samples);
  assert(Math.abs(a.maximumDisplayError - 18.9) < 1e-12);
  assert(Math.abs(b.maximumDisplayError - 2 * a.maximumDisplayError) < 1e-12);
  assert(Math.abs(a.maximumTextureError - 0.21) < 1e-12);
  assert.equal(a.maximumTextureError, b.maximumTextureError);
});

test('camera scaling also preserves the residual on a prepared polar mesh', () => {
  const chart = createCharts('antarctica', 'orthographic')[0];
  const mesh = prepareInverse(chart, {tolerance: 4});
  const a = inspectDisplayError(mesh, chart, {pixelsPerUnit: [180, 90]});
  const b = inspectDisplayError(mesh, chart, {pixelsPerUnit: [360, 180]});
  assert(Math.abs(b.maximumDisplayError - 2 * a.maximumDisplayError) < 1e-10);
  assert.equal(a.maximumTextureError, b.maximumTextureError);
});

test('display qualification rejects exhausted budgets and cancellation', async () => {
  const {mesh, chart} = displayFixture;
  await assert.rejects(
    qualifyDisplayMesh(() => mesh, chart, {displayTolerance: 1, maxAttempts: 1}),
    /budget/
  );
  const controller = new AbortController();
  controller.abort(new Error('cancelled'));
  await assert.rejects(
    qualifyDisplayMesh(() => mesh, chart, {signal: controller.signal}),
    /cancelled/
  );
});

import {prepareJob} from '../../../../../../examples/geospatial/projection-domains/src/lab/job.mjs';
test('common policy passes through native and external worker job specifications',async()=>{
  for(const engine of ['native','proj4','d3'])for(const mode of ['inverse','forward']){
    const result=await prepareJob({source:'antarctica',target:'orthographic',engine,mode,tolerance:1,displayPolicy:{pixelsPerUnit:[360,180],displayTolerance:1,textureTolerance:2}});
    const q=result.meshes[0].diagnostics.qualification;
    assert(q.maximumDisplayError<=1&&q.maximumTextureError<=2);
  }
});
