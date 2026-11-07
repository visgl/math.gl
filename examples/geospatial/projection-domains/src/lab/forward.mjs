// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {subdivideTriangleMesh,clipTriangleMesh,interpolatePackedAttributes} from '@math.gl/geometry';
import {seedDomain} from '../warp/prepare.mjs';
/** Qualified continuous source-grid counterpart, using the existing public utility.
 * The pixel grid is affine in the source CRS; target errors use a declared display scale. */
export function prepareForward(chart,forward,{tolerance=1,pixelsPerUnit=1,displayScale=[pixelsPerUnit,pixelsPerUnit]}={}) {
  if(displayScale.length!==2||!displayScale.every(v=>Number.isFinite(v)&&v>0))throw new RangeError('Invalid display scale');
  const {width,height}=chart;
  const source={positions:new Float64Array([0,0,width,0,width,height,0,height]),indices:new Uint32Array([0,1,2,0,2,3])};
  const refined=subdivideTriangleMesh(source,{transform:forward,tolerance,errorMetric:({exact,interpolated})=>Math.hypot(...exact.map((v,i)=>(v-interpolated[i])*displayScale[i])),maxDepth:14,maxVertices:100000,maxTriangles:150000});
  const seed=seedDomain(chart.domain),regions=[];
  for(let i=0;i<seed.indices.length;i+=3)regions.push(Array.from(seed.indices.slice(i,i+3),j=>Array.from(seed.positions.slice(j*2,j*2+2))));
  const clipped=clipTriangleMesh(refined,{regions,maxVertices:600000,maxTriangles:300000,maxIntersections:2000000});
  const attrs=interpolatePackedAttributes(new Uint8Array(refined.sourcePositions.buffer),clipped,
    {byteStride:16,attributes:[{type:'float64',size:2,byteOffset:0,interpolation:'linear'}]});
  return {chart:chart.id,positions:clipped.positions,uv:Float64Array.from(new Float64Array(attrs.buffer),(x,i)=>x/(i%2?height:width)),indices:clipped.indices,
    sourceRows:new Uint32Array(clipped.indices.length/3).fill(chart.row),
    diagnostics:{outputTriangles:clipped.indices.length/3,vertices:clipped.positions.length/2,omittedTriangles:0}};
}
