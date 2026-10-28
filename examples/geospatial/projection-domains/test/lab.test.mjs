// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareJob} from '../lab/job.mjs';
import {capability} from '../lab/backends.mjs';
function area(mesh){let area=0;for(let i=0;i<mesh.indices.length;i+=3){const [a,b,c]=Array.from(mesh.indices.slice(i,i+3),j=>mesh.positions.slice(j*2,j*2+2));area+=Math.abs((b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]))/2;}return area;}
for(const engine of ['native','proj4','d3'])for(const mode of ['inverse','forward'])test(`${engine}/${mode}: rotated Fiji and full-world coverage`,async()=>{
  for(const [source,expectedArea] of [['fiji',2800],['world',64800]]) {
    const result=await prepareJob({source,target:'world',engine,mode,tolerance:1});
    assert(Math.abs(result.meshes.reduce((n,m)=>n+area(m),0)-expectedArea)<1e-7);
    assert(result.meshes.every(m=>m.positions.every(Number.isFinite)&&m.uv.every(x=>x>=-1e-8&&x<=1+1e-8)));
    assert.equal(result.diagnostics.omittedTriangles,0);
  }
});
test('center changes rebuild domain and mesh; unsupported paths fail explicitly',async()=>{
  const a=await prepareJob({source:'antarctica',target:'orthographic',center:[0,-90],tolerance:2});
  const b=await prepareJob({source:'antarctica',target:'orthographic',center:[20,-75],tolerance:2});
  assert.notDeepEqual(a.domains,b.domains);assert.notDeepEqual(a.meshes[0].positions,b.meshes[0].positions);
  assert(capability('native','antarctica','world','forward'));
  assert(capability('d3','antarctica','interrupted'));
  await assert.rejects(prepareJob({source:'antarctica',target:'world',mode:'forward'}),/continuous patch/);
  await assert.rejects(prepareJob({engine:'missing'}),/Unknown/);
});
