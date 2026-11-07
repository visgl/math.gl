// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {refineWarp,WarpError} from './refine.mjs';
import {seedDomain,finishInverse,validateChart} from './prepare.mjs';
const aborted=signal=>{if(signal?.aborted)throw signal.reason ?? new Error('Warp aborted');};
/** Evaluate adaptive frontiers in bounded batches. Accepted input is a snapshot;
 * cancellation is cooperative between calls, never native-call preemption. */
export async function runWarpAsync(mesh,evaluate,{signal,batchSize=1024,...options}={}) {
  if(!Number.isSafeInteger(batchSize)||batchSize<1||batchSize>65536)throw new WarpError('input','Invalid batch size');
  aborted(signal);
  const iterator=refineWarp({positions:Float64Array.from(mesh.positions),indices:Array.from(mesh.indices)},options);
  let step=iterator.next(),batches=0;
  try {
    while(!step.done) {
      aborted(signal);
      const output=new Float64Array(step.value.length);
      for(let start=0;start<output.length;start+=batchSize*2) {
        aborted(signal);
        const input=step.value.slice(start,start+batchSize*2),expectedLength=input.length;
        const result=await evaluate(input,{signal});batches++;
        aborted(signal);
        if(!(result instanceof Float64Array)||result.length!==expectedLength||!result.every(Number.isFinite))
          throw new WarpError('domain','Invalid batch result');
        output.set(result,start);
      }
      step=iterator.next(output);
    }
    aborted(signal);
    return {...step.value,diagnostics:{...step.value.diagnostics,batches}};
  } finally {iterator.return();}
}
export async function prepareInverseAsync(chart,evaluate,options={}) {
  validateChart(chart);
  return finishInverse(await runWarpAsync(seedDomain(chart.domain),evaluate,
    {clipBounds:[0,0,chart.width,chart.height],...options}),chart);
}
