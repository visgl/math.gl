// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {earcut, clipTriangleMesh, interpolatePackedAttributes} from '@math.gl/geometry';
import {createCRSProjectionDomain} from '@math.gl/geospatial/crs';
import {runWarpSync, WarpError} from './refine.mjs';

/** Domain topology is supplied, never inferred from renderingBounds. */
export function seedDomain(domain) {
  const {polygons} = createCRSProjectionDomain(domain);
  const positions=[],indices=[];
  for (const polygon of polygons) {
    const flat=[],holes=[],offset=positions.length/2;
    for (const [i,ring] of [polygon.outer,...(polygon.holes || [])].entries()) {
      if(i) holes.push(flat.length/2);
      for(const p of ring.slice(0,-1)) flat.push(...p);
    }
    indices.push(...earcut(flat,holes,2).map(i=>i+offset)); positions.push(...flat);
  }
  return {positions:new Float64Array(positions),indices:new Uint32Array(indices)};
}

/** Inverse refinement measures error in source texels; target geometry is planar.
 * The chart owns the inverse branch. Pixels are affine in the raster's native CRS.
 * Image-footprint clipping interpolates target positions using math.gl provenance. */
export function finishInverse(refined, {width,height,row,id}) {
  const clipped=clipTriangleMesh(refined,{regions:[[[0,0],[width,0],[width,height],[0,height]]],
    maxVertices:600000,maxTriangles:300000,maxIntersections:600000});
  const attributes=interpolatePackedAttributes(new Uint8Array(refined.sourcePositions.buffer),clipped,
    {byteStride:16,attributes:[{type:'float64',size:2,byteOffset:0,interpolation:'linear'}]});
  return {positions:new Float64Array(attributes.buffer), uv:Float64Array.from(clipped.positions,(v,i)=>v/(i%2 ? height : width)),
    indices:clipped.indices, sourceRows:new Uint32Array(clipped.indices.length/3).fill(row), chart:id,
    diagnostics:{...refined.diagnostics,outputTriangles:clipped.indices.length/3}};
}
export function prepareInverse(chart, options={}) {
  if (![chart.width,chart.height].every(x=>Number.isSafeInteger(x)&&x>0) || !Number.isSafeInteger(chart.row) || chart.row<0 || chart.row>0xffffffff)
    throw new WarpError('input','Invalid source raster metadata');
  return finishInverse(runWarpSync(seedDomain(chart.domain),chart.inverse,{clipBounds:[0,0,chart.width,chart.height],...options}),chart);
}

/** Independent, post-clipping texture probes. Different weights from refinement;
 * finite sample evidence only, not a guarantee between probes. */
export function inspectWarp(mesh, chart) {
  let maximumError=0;
  for(let i=0;i<mesh.indices.length;i+=3) {
    const ids=mesh.indices.slice(i,i+3);
    for(const w of [[.2,.3,.5],[.6,.1,.3],[.1,.7,.2]]) {
      const p=[0,0],uv=[0,0];
      ids.forEach((id,j)=>{for(let k=0;k<2;k++){p[k]+=mesh.positions[id*2+k]*w[j];uv[k]+=mesh.uv[id*2+k]*w[j];}});
      const exact=chart.inverse(p);
      if(!exact || !exact.every(Number.isFinite)) throw new WarpError('domain','Invalid verification sample');
      maximumError=Math.max(maximumError,Math.hypot(exact[0]-uv[0]*chart.width,exact[1]-uv[1]*chart.height));
    }
  }
  return {maximumError,triangles:mesh.indices.length/3};
}
