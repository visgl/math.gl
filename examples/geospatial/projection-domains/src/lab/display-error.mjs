// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
/** Independent post-clipping probes shared by both meshing strategies. Camera
 * coordinates are affine display pixels; this does not model perspective depth. */
export function inspectDisplayError(mesh,chart,{pixelsPerUnit=[180,90]}={}) {
  if(pixelsPerUnit.length!==2||!pixelsPerUnit.every(v=>Number.isFinite(v)&&v>0))throw new RangeError('Invalid display scale');
  let maximumDisplayError=0,maximumTextureError=0,samples=0;
  for(let face=0;face<mesh.indices.length;face+=3){
    const ids=mesh.indices.slice(face,face+3);
    // Deliberately distinct from the refinement midpoint/centroid probes.
    for(const weights of [[.2,.3,.5],[.6,.1,.3],[.1,.7,.2]]){
      const target=[0,0],pixel=[0,0];
      ids.forEach((id,j)=>{for(let k=0;k<2;k++){target[k]+=mesh.positions[id*2+k]*weights[j];pixel[k]+=mesh.uv[id*2+k]*weights[j]*(k?chart.height:chart.width);}});
      const exactTarget=chart.forward(pixel),exactPixel=chart.inverse(target);
      if(!exactTarget||!exactPixel||![...exactTarget,...exactPixel].every(Number.isFinite))throw new RangeError('Invalid display qualification sample');
      maximumDisplayError=Math.max(maximumDisplayError,Math.hypot(...target.map((v,k)=>(v-exactTarget[k])*pixelsPerUnit[k])));
      maximumTextureError=Math.max(maximumTextureError,Math.hypot(...pixel.map((v,k)=>v-exactPixel[k])));samples++;
    }
  }
  if(!samples)throw new RangeError('Empty display qualification mesh');
  return {maximumDisplayError,maximumTextureError,samples,pixelsPerUnit:[...pixelsPerUnit]};
}

/** Each strategy retains its own internal refinement units; publication requires
 * the same independent display and source-texel gates. Bounded retries reject. */
export async function qualifyDisplayMesh(prepare,chart,{displayTolerance=1,textureTolerance=2,pixelsPerUnit=[180,90],initialTolerance=1,maxAttempts=6,signal}={}) {
  if(![displayTolerance,textureTolerance,initialTolerance].every(v=>Number.isFinite(v)&&v>0)||!Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>10)throw new RangeError('Invalid display qualification policy');
  for(let attempt=0;attempt<maxAttempts;attempt++){
    if(signal?.aborted)throw signal.reason;
    const tolerance=initialTolerance/2**attempt,mesh=await prepare(tolerance);
    if(signal?.aborted)throw signal.reason;
    const report=inspectDisplayError(mesh,chart,{pixelsPerUnit});
    if(report.maximumDisplayError<=displayTolerance&&report.maximumTextureError<=textureTolerance)
      return {...mesh,diagnostics:{...mesh.diagnostics,qualification:{...report,attempts:attempt+1,preparationTolerance:tolerance,displayTolerance,textureTolerance}}};
  }
  throw new RangeError('Display/texture qualification budget exhausted');
}
