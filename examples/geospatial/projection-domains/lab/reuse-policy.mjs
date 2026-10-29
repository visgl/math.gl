// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {updatePersistentUV,RebuildRequiredError} from './persistent-grid.mjs';

/** Only explicit policy invalidation triggers rebuilding. Backend failures and
 * cancellation propagate; a failed fallback never publishes a partial result. */
export async function updateOrRebuild(grid,evaluate,rebuild,options={}) {
  try{return {mode:'reuse',result:await updatePersistentUV(grid,evaluate,options)};}
  catch(error){
    if(options.signal?.aborted)throw options.signal.reason;
    if(!(error instanceof RebuildRequiredError))throw error;
    const result=await rebuild({reason:error.reason,signal:options.signal});
    if(options.signal?.aborted)throw options.signal.reason;
    return {mode:'rebuild',reason:error.reason,result};
  }
}
