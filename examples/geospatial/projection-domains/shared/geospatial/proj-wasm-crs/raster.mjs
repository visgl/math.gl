// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createProjWasmBatchProcessor} from './batch.mjs';
/** Reuses one real PROJ operation for every adaptive frontier. The caller owns the
 * proj-wasm pool. Native charts supply target inverse/branch ownership; PROJ performs
 * WGS84 -> source-CRS conversion, including ellipsoidal EPSG:3031. This is an explicit
 * hybrid pipeline, not a claim that a PROJ point converter supplies chart clipping. */
export async function createRasterBatchEvaluator(proj,chart) {
  const processor=await createProjWasmBatchProcessor(proj,{sourceCRS:'EPSG:4326',targetCRS:chart.source.definition});
  return {
    async evaluate(points,options={}) {
      const positions=new Float64Array(points.length/2*3);
      for(let i=0;i<points.length;i+=2) {
        const p=chart.toGeographic([points[i],points[i+1]]);
        positions.set([p[0],p[1],0],i/2*3);
      }
      const result=await processor.transform({positions,sourceRowIndices:new Uint32Array(points.length/2).fill(chart.row)},options);
      const output=new Float64Array(points.length);
      for(let i=0;i<output.length;i+=2)output.set(chart.source.coordinateToPixel(result.positions.slice(i/2*3,i/2*3+2)),i);
      return output;
    },
    dispose:()=>processor.dispose()
  };
}
