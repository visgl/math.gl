// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {runTask,WorkerPool} from '@math.gl/core/tasks';
import {createCharts} from '../projection-domains/warp/fixtures.mjs';
import {inspectWarp} from '../projection-domains/warp/prepare.mjs';
import {prepareInverseAsync} from '../projection-domains/warp/async.mjs';
import {createRasterBatchEvaluator} from './raster.mjs';
/** Same real WASM path is exercised in Node and the browser build. */
export async function runRasterExample() {
  const proj=await import('proj-wasm');await proj.init({workers:1});
  let backend;
  const worker=new URL('./raster-worker.mjs',import.meta.url).href;
  const loadWorker=()=>new Worker(new URL('./raster-worker.mjs',import.meta.url),{type:'module'});
  const pool=new WorkerPool({name:'raster-consumer',url:worker,workerType:'module',loadWorker,maxConcurrency:1});
  try {
    const chart=createCharts('antarctica','world')[0];
    backend=await createRasterBatchEvaluator(proj,chart);
    let maximumDifference=0;
    const actual=await prepareInverseAsync(chart,async (points,options)=>{
      const result=await backend.evaluate(points,options);
      for(let i=0;i<points.length;i+=2){const native=chart.inverse(points.slice(i,i+2));
        maximumDifference=Math.max(maximumDifference,Math.hypot(result[i]-native[0],result[i+1]-native[1]));}
      return result;
    },{tolerance:4,batchSize:512});
    const probeError=inspectWarp(actual,chart).maximumError;
    const checksum=actual.positions.reduce((s,x)=>s+x,0)+actual.uv.reduce((s,x)=>s+x,0);
    const consumed=await runTask({id:'raster-consumer',name:'Raster buffers',module:'example',version:'1',options:{},worker,loadWorker},actual,
      {execution:'worker',workerPool:pool,inputOwnership:'transfer'});
    return {...actual.diagnostics,maximumDifference,probeError,
      transferred:actual.positions.byteLength===0 && actual.uv.byteLength===0 && actual.indices.byteLength===0,
      workerParity:consumed.checksum===checksum && consumed.rowIdentity && consumed.chart===chart.id};
  } finally {try {await backend?.dispose();}finally{try{await pool.destroy();}finally{await proj.shutdown();}}}
}
