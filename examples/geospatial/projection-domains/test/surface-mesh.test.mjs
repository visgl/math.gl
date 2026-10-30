// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prepareSurfacePatch,evaluateSurfacePatch,pickSurfacePatch} from '../surface-mesh/recipe.mjs';
const mesh=prepareSurfacePatch();
test('every refined attribute reconstructs directly from original source vertices',()=>{
 const view=new DataView(mesh.attributes.buffer);
 for(let i=0;i<mesh.flat.length/3;i++){
  const u=mesh.sourcePositions[2*i],v=mesh.sourcePositions[2*i+1];
  assert.ok(Math.abs(view.getFloat64(i*16,true)-(10+5*u+2*v))<1e-10);
  assert.equal(view.getUint32(i*16+8,true),7);

 }
 for(let t=0;t<mesh.indices.length/3;t++) {
  const original=Array.from(mesh.source.indices.slice(mesh.sourceTriangles[t]*3,mesh.sourceTriangles[t]*3+3));
  for(const vertex of mesh.indices.slice(t*3,t*3+3))for(let k=0;k<3;k++)if(mesh.provenance.sourceVertexWeights[vertex*3+k]>0)assert.ok(original.includes(mesh.provenance.sourceVertexIndices[vertex*3+k]));
 }
 assert.deepEqual(structuredClone(mesh.provenance),mesh.provenance);
});
test('posed normals and picking follow actual triangles; artificial edges never extrude',()=>{
 for(const t of [0,0.19,0.5,0.87,1]){
  const frame=evaluateSurfacePatch(mesh,t,0.04);
  assert.equal(frame.walls.length,frame.boundary.filter(e=>e.kind==='source').length);
  assert.ok(frame.boundary.some(e=>e.kind==='coverage'));assert.ok(frame.boundary.some(e=>e.kind==='join'));
  for(let i=0;i<frame.normals.length;i+=3)assert.ok(Math.abs(Math.hypot(...frame.normals.slice(i,i+3))-1)<1e-12);
  const hit=pickSurfacePatch(mesh,frame,[0,0,2],[0,0,-1]);assert.ok(hit);
  assert.ok(Math.hypot(...hit.sourcePosition)<1e-10);
  assert.ok(Math.abs(hit.contributors.reduce((s,[,w])=>s+w,0)-1)<1e-12);
  assert.equal(pickSurfacePatch(mesh,frame,[10,10,2],[0,0,-1]),null);
 }
 assert.throws(()=>evaluateSurfacePatch(mesh,NaN));assert.throws(()=>pickSurfacePatch(mesh,evaluateSurfacePatch(mesh,0),[0,0,0],[0,0,0]));
});
