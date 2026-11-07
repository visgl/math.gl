// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Qualified planar-edge recipe, not polygon topology repair. The caller supplies
 * a source-space sampling limit small enough to resolve the transform's branches.
 * Output references are local; closed source loops can have nonzero winding.
 */
export function unwrapPeriodicPath(points,{transform,period,axis=0,maxSourceStep,tolerance=1e-4,maxDepth=20,maxSamples=100000}={}) {
  if(typeof transform!=='function'||!Number.isFinite(period)||period<=0||![0,1].includes(axis)||
    !Number.isFinite(maxSourceStep)||maxSourceStep<=0||!Number.isFinite(tolerance)||tolerance<=0||
    !Number.isInteger(maxDepth)||maxDepth<0||maxDepth>30||!Number.isSafeInteger(maxSamples)||maxSamples<1||
    !Array.isArray(points)||points.length<2||points.some(p=>p.length!==2||!p.every(Number.isFinite)))throw new RangeError('Invalid unwrap policy or path');
  let samples=0;
  const evaluate=p=>{if(++samples>maxSamples)throw new RangeError('Unwrap sample budget exhausted');const q=Array.from(transform([...p])??[]);if(q.length!==2||!q.every(Number.isFinite))throw new RangeError('Invalid transform sample');return q;};
  const lift=(point,reference)=>{const p=[...point],copies=Math.round((reference[axis]-p[axis])/period);p[axis]+=copies*period;if(!p.every(Number.isFinite))throw new RangeError('Unwrap overflow');return p;};
  const sources=[[...points[0]]],targets=[evaluate(points[0])];
  function edge(a,b,ta,depth) {
    const mid=a.map((v,i)=>(v+b[i])/2),tm=lift(evaluate(mid),ta),tb=lift(evaluate(b),tm);
    const length=Math.hypot(...a.map((v,i)=>v-b[i]));
    const error=Math.hypot(...tm.map((v,i)=>v-(ta[i]+tb[i])/2));
    const ambiguous=Math.abs(tm[axis]-ta[axis])>=period/4||Math.abs(tb[axis]-tm[axis])>=period/4;
    if(length>maxSourceStep||error>tolerance||ambiguous) {
      if(depth>=maxDepth)throw new RangeError('Unresolved periodic edge');
      const middle=edge(a,mid,ta,depth+1);return edge(mid,b,middle,depth+1);
    }
    sources.push([...b]);targets.push(tb);return tb;
  }
  for(let i=1;i<points.length;i++)edge(points[i-1],points[i],targets.at(-1),0);
  const closed=points[0].every((v,i)=>v===points.at(-1)[i]);
  return {sourcePositions:sources.flat(),positions:targets.flat(),samples,
    winding:closed?Math.round((targets.at(-1)[axis]-targets[0][axis])/period):null};
}
