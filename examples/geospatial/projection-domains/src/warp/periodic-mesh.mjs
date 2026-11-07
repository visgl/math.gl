// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {clipTriangleMesh,interpolatePackedAttributes} from '@math.gl/geometry';
import {unwrapPeriodicPath} from './unwrap-path.mjs';
import {prepareInverse} from './prepare.mjs';

/** One cache per immutable transform/policy and source-coordinate system. Adjacent
 * cells must name shared edges with exactly the same endpoints. */
export function createPeriodicEdgeCache(options) {
  if(options.axis!==undefined&&options.axis!==0)throw new RangeError('Cell recipe requires horizontal periodicity');
  options={...options};
  const cache=new Map();
  return {period:options.period,get size(){return cache.size;},edge(a,b){
    const reverse=JSON.stringify(a)>JSON.stringify(b),points=reverse?[b,a]:[a,b],key=JSON.stringify(points);
    if(!cache.has(key))cache.set(key,unwrapPeriodicPath(points,options));
    const prepared=cache.get(key),pairs=values=>Array.from({length:values.length/2},(_,i)=>values.slice(i*2,i*2+2));
    const source=pairs(prepared.sourcePositions),target=pairs(prepared.positions);
    if(reverse){source.reverse();target.reverse();}
    return {source,target};
  }};
}

/** Qualified star-shaped lifted cells, not arbitrary polygon repair. A winding source
 * boundary must use explicit inverse charts, whose topology is already declared.
 * Caller partitions large/nonconvex cells before invoking this recipe. */
export function preparePeriodicCell(corners,{edges,period,minimum=-period/2,regions,sourceBounds,sourceRow=0,inverseCharts,inverseOptions}={}) {
  if(!edges||edges.period!==period||!Number.isFinite(period)||period<=0||!Array.isArray(corners)||corners.length<3||corners.some(p=>p.length!==2||!p.every(Number.isFinite))||
    !Array.isArray(sourceBounds)||sourceBounds.length!==4||!sourceBounds.every(Number.isFinite)||sourceBounds[2]<=sourceBounds[0]||sourceBounds[3]<=sourceBounds[1]||
    !Number.isSafeInteger(sourceRow)||sourceRow<0||sourceRow>0xffffffff)throw new RangeError('Invalid periodic cell');
  const source=[],target=[];
  let first,last;
  for(let i=0;i<corners.length;i++){
    const edge=edges.edge(corners[i],corners[(i+1)%corners.length]);
    const shift=last?period*Math.round((last[0]-edge.target[0][0])/period):0;
    const lifted=edge.target.map(([x,y])=>[x+shift,y]);
    first??=lifted[0];last=lifted.at(-1);
    source.push(...edge.source.slice(0,-1));target.push(...lifted.slice(0,-1));
  }
  const winding=Math.round((last[0]-first[0])/period);
  if(winding){
    if(!inverseCharts?.length)throw new RangeError('Winding boundary requires explicit inverse charts');
    return {mode:'inverse-charts',reason:'nonzero boundary winding',winding,meshes:inverseCharts.map(c=>prepareInverse(c,inverseOptions))};
  }
  // A center fan preserves every shared boundary sample, including collinear
  // points that a generic polygon triangulator can remove independently.
  const center=[0,1].map(k=>target.reduce((n,p)=>n+p[k],0)/target.length);
  const sourceCenter=[0,1].map(k=>source.reduce((n,p)=>n+p[k],0)/source.length);
  const signs=target.map((a,i)=>{const b=target[(i+1)%target.length];return (a[0]-center[0])*(b[1]-center[1])-(a[1]-center[1])*(b[0]-center[0]);});
  if(signs.some(v=>!Number.isFinite(v)||v===0)||!(signs.every(v=>v>0)||signs.every(v=>v<0)))throw new RangeError('Cell requires explicit chart decomposition');
  const angle=target.reduce((sum,a,i)=>{const b=target[(i+1)%target.length],u=a.map((v,k)=>v-center[k]),v=b.map((x,k)=>x-center[k]);return sum+Math.atan2(u[0]*v[1]-u[1]*v[0],u[0]*v[0]+u[1]*v[1]);},0);
  if(Math.abs(Math.abs(angle)-2*Math.PI)>1e-7)throw new RangeError('Self-overlapping cell requires explicit chart decomposition');
  const positions=new Float64Array([...target.flat(),...center]),pixels=new Float64Array([...source.flat(),...sourceCenter]),indices=[];
  for(let i=0;i<target.length;i++)indices.push(i,(i+1)%target.length,target.length);
  const clipped=clipTriangleMesh({positions,indices:new Uint32Array(indices)},{regions,periodic:{axis:0,minimum,period}});
  const bytes=interpolatePackedAttributes(new Uint8Array(pixels.buffer),clipped,{byteStride:16,attributes:[{type:'float64',size:2,byteOffset:0,interpolation:'linear'}]});
  const values=new Float64Array(bytes.buffer),[w,s,e,n]=sourceBounds;
  const uv=Float64Array.from(values,(v,i)=>(v-(i%2?s:w))/(i%2?n-s:e-w));
  return {mode:'forward-cell',winding,meshes:[{positions:clipped.positions,indices:clipped.indices,uv,periodicCopies:clipped.periodicCopies,sourceRows:new Uint32Array(clipped.indices.length/3).fill(sourceRow)}]};
}
