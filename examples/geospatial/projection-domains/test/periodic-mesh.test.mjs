// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {createPeriodicEdgeCache,preparePeriodicCell} from '../warp/periodic-mesh.mjs';
import {createSource,createCharts,rectangle} from '../warp/fixtures.mjs';
const wrap=x=>((x+180)%360+360)%360-180;
const regions=[rectangle(-180,-90,180,90).slice(0,-1)];
test('adjacent seam-crossing cells share reversed samples and clipped UV boundaries',()=>{
  const edges=createPeriodicEdgeCache({transform:([x,y])=>[wrap(x),y],period:360,maxSourceStep:2,tolerance:.001});
  const a=edges.edge([170,0],[190,0]),b=edges.edge([190,0],[170,0]);
  assert.deepEqual(a.source,b.source.toReversed());assert.deepEqual(a.target,b.target.toReversed());assert.equal(edges.size,1);
  const options={edges,period:360,regions,sourceBounds:[170,-10,190,10],sourceRow:7};
  const meshes=[rectangle(170,-10,190,0),rectangle(170,0,190,10)].map(r=>preparePeriodicCell(r.slice(0,-1),options).meshes[0]);
  function boundary(m){const values=[];for(let i=0;i<m.positions.length;i+=2)if(Math.abs(m.positions[i+1])<1e-12)values.push([m.positions[i],m.uv[i],m.uv[i+1]]);return [...new Set(values.map(p=>JSON.stringify(p)))].sort();}
  assert.deepEqual(boundary(meshes[0]),boundary(meshes[1]));
  for(const m of meshes){
    assert(m.sourceRows.every(v=>v===7));assert(m.positions.every(Number.isFinite));
    for(let i=0;i<m.positions.length;i+=2){assert(Math.abs(wrap(170+m.uv[i]*20)-wrap(m.positions[i]))<1e-10);assert(Math.abs(-10+m.uv[i+1]*20-m.positions[i+1])<1e-10);}
    assert(m.periodicCopies.some(v=>v!==0));
  }
});
test('pole-containing boundary requires explicit inverse charts instead of a folded fan',()=>{
  const source=createSource('antarctica');
  const edges=createPeriodicEdgeCache({transform:p=>source.pixelToGeographic(p),period:360,maxSourceStep:8,tolerance:.01});
  const options={edges,period:360,regions,sourceBounds:[0,0,256,256]};
  const corners=rectangle(0,0,256,256).slice(0,-1);
  assert.throws(()=>preparePeriodicCell(corners,options),/inverse charts/);
  const r=preparePeriodicCell(corners,{...options,inverseCharts:createCharts('antarctica','world'),inverseOptions:{tolerance:2}});
  assert.equal(r.mode,'inverse-charts');assert.equal(Math.abs(r.winding),1);
  assert(r.meshes[0].indices.length>0);assert(r.meshes[0].positions.every(Number.isFinite));
  assert(r.meshes[0].uv.every(v=>v>=-1e-12&&v<=1+1e-12));
});
test('policy mismatch and unresolved cells fail before publishing',()=>{
  const edges=createPeriodicEdgeCache({transform:p=>p,period:360,maxSourceStep:2});
  assert.throws(()=>preparePeriodicCell([[0,0],[1,0],[0,1]],{edges,period:180,regions,sourceBounds:[0,0,1,1]}),/Invalid/);
  assert.throws(()=>createPeriodicEdgeCache({axis:1}),/horizontal/);
});
test('rotated Fiji cells reuse the same nonlinear shared edge in both orientations',()=>{
  const source=createSource('fiji'),edges=createPeriodicEdgeCache({transform:p=>source.pixelToGeographic(p),period:360,maxSourceStep:4,tolerance:.001});
  const options={edges,period:360,regions,sourceBounds:[0,0,256,256]};
  const meshes=[rectangle(0,0,256,128),rectangle(0,128,256,256)].map(r=>preparePeriodicCell(r.slice(0,-1),options).meshes[0]);
  const boundary=m=>[...new Set(Array.from({length:m.uv.length/2},(_,i)=>i).filter(i=>Math.abs(m.uv[i*2+1]-.5)<1e-12).map(i=>JSON.stringify([m.positions[i*2],m.positions[i*2+1],m.uv[i*2]].map(v=>Number(v.toFixed(8))))))].sort();
  assert.deepEqual(boundary(meshes[0]),boundary(meshes[1]));assert(boundary(meshes[0]).length>20);
});
