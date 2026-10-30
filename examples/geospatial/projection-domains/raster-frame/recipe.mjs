// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Matrix3} from '@math.gl/core';
import {createSpatialReference} from '@math.gl/geospatial/crs';

/** Example-owned composition, not a CF/OME/GDAL parser. Affine coefficients map
 * column,row into declared stored CRS components. axisOrder then selects XY.
 * Area registration puts sample centers at i+.5; point registration at i.
 */
export function createRasterFrame({size,affine,registration,axisOrder=[0,1],spatialReference={}}={}) {
  if(!Array.isArray(size)||size.length!==2||!size.every(n=>Number.isSafeInteger(n)&&n>0)||
    !Array.isArray(affine)||affine.length!==6||!affine.every(Number.isFinite)||
    !['area','point'].includes(registration)||!Array.isArray(axisOrder)||axisOrder.length!==2||
    ![[0,1],[1,0]].some(order=>order.every((v,i)=>v===axisOrder[i])))throw new RangeError('Invalid raster frame');
  const [a,b,c,d,tx,ty]=affine,scale=Math.max(Math.abs(a),Math.abs(b),Math.abs(c),Math.abs(d));
  if(!scale||Math.abs(a/scale*d/scale-b/scale*c/scale)<1e-12)throw new RangeError('Singular or ill-conditioned raster frame');
  const matrix=new Matrix3([a,b,0,c,d,0,tx,ty,1]),inverse=matrix.clone().invert();
  const reference=createSpatialReference(spatialReference),offset=registration==='area'?.5:0;
  const pair=p=>{if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite))throw new RangeError('Expected finite pair');return p;};
  const gridToCoordinate=p=>{
    const q=matrix.transform([...pair(p),1]);
    const result=axisOrder.map(i=>q[i]);if(!result.every(Number.isFinite))throw new RangeError('Raster frame overflow');return result;
  };
  const coordinateToGrid=p=>{
    pair(p);const q=[];axisOrder.forEach((axis,i)=>q[axis]=p[i]);const result=inverse.transform([...q,1]).slice(0,2);
    if(!result.every(Number.isFinite))throw new RangeError('Raster frame inverse overflow');return result;
  };
  const rectangle=(w,s,e,n)=>[[w,s],[e,s],[e,n],[w,n],[w,s]].map(gridToCoordinate);
  const sampleToCoordinate=p=>gridToCoordinate(pair(p).map(v=>v+offset));
  const coordinateToSample=p=>coordinateToGrid(p).map(v=>v-offset);
  return Object.freeze({size:Object.freeze([...size]),affine:Object.freeze([...affine]),registration,
    axisOrder:Object.freeze([...axisOrder]),spatialReference:reference,
    gridToCoordinate,coordinateToGrid,sampleToCoordinate,coordinateToSample,
    sampleBounds:rectangle(offset,offset,size[0]-1+offset,size[1]-1+offset),
    // Point nodes do not establish a cell-coverage extent. An application may
    // declare one separately, but must not silently add half a pixel here.
    coverage:registration==='area'?rectangle(0,0,size[0],size[1]):null});
}

export const rasterFrameFixtures=Object.freeze([
 {id:'north-up',name:'North-up / unequal pixels',size:[4,3],affine:[2,0,0,-3,500000,4650000],registration:'area',axisOrder:[0,1]},
 {id:'point',name:'Point samples / no inferred coverage',size:[4,3],affine:[2,0,0,-3,500000,4650000],registration:'point',axisOrder:[0,1]},
 {id:'rotated',name:'Rotated and skewed grid',size:[4,3],affine:[2,1,.5,-3,500000,4650000],registration:'area',axisOrder:[0,1]},
 {id:'axes',name:'Stored northing,easting axes',size:[4,3],affine:[0,2,-3,0,4650000,500000],registration:'area',axisOrder:[1,0]}
]);
