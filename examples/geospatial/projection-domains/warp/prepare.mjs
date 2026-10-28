// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {earcut, interpolatePackedAttributes} from '@math.gl/geometry';
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
  // Clip affine UV constraints in each triangle's barycentric parameter space.
  // UV area may be zero at a pole even when target area is positive. A planar
  // source-XY clipper would discard that valid geometry before attribute interpolation.
  const sourceVertexIndices=[],sourceVertexWeights=[],indices=[];
  for(let face=0;face<refined.indices.length;face+=3) {
    const ids=Array.from(refined.indices.slice(face,face+3));
    const value=(w,axis)=>w.reduce((sum,weight,i)=>sum+weight*refined.positions[ids[i]*2+axis],0);
    let polygon=[[1,0,0],[0,1,0],[0,0,1]];
    for(const [axis,boundary,sign] of [[0,0,1],[0,width,-1],[1,0,1],[1,height,-1]]) {
      const next=[];
      for(let i=0;i<polygon.length;i++) {
        const a=polygon[i],b=polygon[(i+1)%polygon.length];
        const da=(value(a,axis)-boundary)*sign,db=(value(b,axis)-boundary)*sign;
        if(da>=0)next.push(a);
        if((da<0)!==(db<0)){const t=da/(da-db);next.push(a.map((v,j)=>v+t*(b[j]-v)));}
      }
      polygon=next;
    }
    const start=sourceVertexWeights.length/3;
    if(start+polygon.length>600000 || indices.length/3+Math.max(0,polygon.length-2)>300000)
      throw new WarpError('limit','Raster clipping output budget exhausted');
    for(const weights of polygon){sourceVertexIndices.push(...ids);sourceVertexWeights.push(...weights);}
    for(let i=1;i+1<polygon.length;i++)indices.push(start,start+i,start+i+1);
  }
  const records=new Float64Array(refined.positions.length*2);
  for(let i=0;i<refined.positions.length/2;i++)records.set([
    refined.sourcePositions[i*2],refined.sourcePositions[i*2+1],refined.positions[i*2],refined.positions[i*2+1]],i*4);
  const provenance={sourceVertexIndices:new Uint32Array(sourceVertexIndices),sourceVertexWeights:new Float64Array(sourceVertexWeights)};
  const attributes=interpolatePackedAttributes(new Uint8Array(records.buffer),provenance,
    {byteStride:32,attributes:[{type:'float64',size:4,byteOffset:0,interpolation:'linear'}]});
  const values=new Float64Array(attributes.buffer),positions=new Float64Array(values.length/2),uv=new Float64Array(values.length/2);
  for(let i=0;i<values.length/4;i++){positions.set(values.slice(i*4,i*4+2),i*2);uv.set([values[i*4+2]/width,values[i*4+3]/height],i*2);}
  return {positions,uv,indices:new Uint32Array(indices),sourceRows:new Uint32Array(indices.length/3).fill(row),chart:id,
    diagnostics:{...refined.diagnostics,outputTriangles:indices.length/3}};
}
export function validateChart(chart) {
  if (![chart.width,chart.height].every(x=>Number.isSafeInteger(x)&&x>0) || !Number.isSafeInteger(chart.row) || chart.row<0 || chart.row>0xffffffff)
    throw new WarpError('input','Invalid source raster metadata');
}
export function prepareInverse(chart, options={}) {
  validateChart(chart);
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
