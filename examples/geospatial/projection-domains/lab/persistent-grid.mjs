// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export class RebuildRequiredError extends RangeError {
  constructor(reason,message){super(message);this.name='RebuildRequiredError';this.reason=reason;}
}

/** Fixed interior target patch for the qualified Antarctic orthographic demo.
 * Coverage/domain changes outside this policy require a fresh mesh. */
export function createPersistentGrid() {
  const cells=32,positions=new Float64Array((cells+1)**2*2),indices=[];
  for(let y=0;y<=cells;y++)for(let x=0;x<=cells;x++)positions.set([-.25+x*.5/cells,-.25+y*.5/cells],(y*(cells+1)+x)*2);
  for(let y=0;y<cells;y++)for(let x=0;x<cells;x++){const a=y*(cells+1)+x,b=a+1,c=a+cells+1,d=c+1;indices.push(a,b,d,a,d,c);}
  return {positions,indices:new Uint32Array(indices)};
}

/** Projection-engine agnostic async batches. Results are published only after
 * coverage and independent midpoint/centroid interpolation checks pass. */
export async function updatePersistentUV(grid,evaluate,{source='antarctica',target='orthographic',center=[0,-85],tolerance=2,signal}={}) {
  if(source!=='antarctica'||target!=='orthographic'||center.length!==2||!center.every(Number.isFinite)||center[1]<-90||center[1]>-85)
    throw new RebuildRequiredError('domain-policy','Persistent patch requires rebuild: unsupported source/domain/center');
  if(!Number.isFinite(tolerance)||tolerance<=0)throw new RangeError('Invalid texture tolerance');
  const started=performance.now(),points=Array.from(grid.positions),probes=[];
  for(let i=0;i<grid.indices.length;i+=3) {
    const ids=Array.from(grid.indices.slice(i,i+3));
    for(const weights of [[1/3,1/3,1/3],[.5,.5,0],[0,.5,.5],[.5,0,.5]]) {
      points.push(...[0,1].map(c=>ids.reduce((sum,id,k)=>sum+grid.positions[id*2+c]*weights[k],0)));
      probes.push({ids,weights});
    }
  }
  const samples=new Float64Array(points.length);let batches=0;
  for(let start=0;start<points.length;start+=2048){if(signal?.aborted)throw signal.reason;const batch=new Float64Array(points.slice(start,start+2048)),length=batch.length,result=await evaluate(batch,{signal});
    if(signal?.aborted)throw signal.reason;if(!(result instanceof Float64Array)||result.length!==length||!result.every(Number.isFinite))throw new RangeError('Invalid persistent sample batch');samples.set(result,start);batches++;}
  if(samples.some(v=>v<0||v>256))throw new RebuildRequiredError('source-coverage','Persistent patch requires rebuild: source coverage changed');
  let maximumError=0;
  for(let j=0;j<probes.length;j++){const {ids,weights}=probes[j],offset=grid.positions.length+j*2;
    const error=Math.hypot(...[0,1].map(c=>samples[offset+c]-ids.reduce((sum,id,k)=>sum+samples[id*2+c]*weights[k],0)));maximumError=Math.max(maximumError,error);}
  if(maximumError>tolerance)throw new RebuildRequiredError('texture-error','Persistent patch requires rebuild: texture error exceeded');
  const uv=Float32Array.from(samples.subarray(0,grid.positions.length),v=>v/256);
  return {uv,diagnostics:{preparationMs:performance.now()-started,uvBytes:uv.byteLength,maximumError,batches,vertices:uv.length/2}};
}
