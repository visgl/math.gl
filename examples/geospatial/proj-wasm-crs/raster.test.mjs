// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {runRasterExample} from './raster-example.mjs';
test('real proj-wasm drives adaptive EPSG:3031 raster preparation',{timeout:120000},async()=>{
  const result=await runRasterExample();
  assert(result.transferred);assert(result.workerParity);
  assert(result.triangles>100);assert(result.batches>1);assert(result.samples>result.vertices);
  assert(result.maximumDifference<1e-8);assert(result.probeError<=4);
});
