// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createCharts} from '../warp/fixtures.mjs';
import {prepareInverseAsync} from '../warp/async.mjs';
import {capability,createBackend} from './backends.mjs';
import {prepareForward} from './forward.mjs';
/** Data-only job specification is the rebuild boundary. No result cache is used:
 * engine, source, center, target, direction or tolerance changes always rebuild. */
export async function prepareJob(spec,{signal,proj}={}) {
  const {source='antarctica',target='world',engine='native',mode='inverse',tolerance=1,center=[0,-90],pixelsPerUnit=1}=spec;
  if(!['inverse','forward'].includes(mode))throw new RangeError('Unknown preparation mode');
  const reason=capability(engine,source,target,mode);if(reason)throw new RangeError(reason);
  const charts=createCharts(source,target,{center}),meshes=[],start=performance.now();
  for(const chart of charts) {
    if(signal?.aborted)throw signal.reason;
    const backend=await createBackend(engine,chart,target,center,proj);
    try {
      meshes.push(mode==='inverse'
        ? await prepareInverseAsync(chart,backend.evaluate,{tolerance,batchSize:1024,signal})
        : prepareForward(chart,backend.forward,{tolerance,pixelsPerUnit}));
    } finally {await backend.dispose();}
  }
  if(signal?.aborted)throw signal.reason;
  const domains=charts.flatMap(c=>c.domain.polygons.map(p=>({chart:c.id,ring:p.outer})));
  const bytes=meshes.reduce((n,m)=>n+m.positions.byteLength+m.uv.byteLength+m.indices.byteLength+m.sourceRows.byteLength,0);
  return {meshes,domains,diagnostics:{milliseconds:performance.now()-start,bytes,triangles:meshes.reduce((n,m)=>n+m.indices.length/3,0),
    samples:meshes.reduce((n,m)=>n+(m.diagnostics.samples||0),0),batches:meshes.reduce((n,m)=>n+(m.diagnostics.batches||0),0),omittedTriangles:0}};
}
