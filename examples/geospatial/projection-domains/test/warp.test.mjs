// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCharts,createSource,rectangle} from '../warp/fixtures.mjs';
import {prepareInverse,inspectWarp,seedDomain} from '../warp/prepare.mjs';
import {runWarpSync,WarpError} from '../warp/refine.mjs';
const reference=JSON.parse(readFileSync(new URL('../warp/reference.json',import.meta.url)));

function barycentric(p,a,b,c) {
  const cross=(a,b)=>a[0]*b[1]-a[1]*b[0],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
  const d=cross(sub(b,a),sub(c,a));if(Math.abs(d)<1e-15)return null;
  const v=cross(sub(p,a),sub(c,a))/d,w=cross(sub(b,a),sub(p,a))/d,u=1-v-w;
  return Math.min(u,v,w)>=-1e-8 ? [u,v,w] : null;
}
function sample(mesh,p,boundaryTolerance=0) {
  let nearest=null,distance=boundaryTolerance;
  for(let i=0;i<mesh.indices.length;i+=3) {
    const ids=mesh.indices.slice(i,i+3),v=Array.from(ids,j=>Array.from(mesh.positions.slice(j*2,j*2+2)));
    if(boundaryTolerance)for(let e=0;e<3;e++){
      const a=v[e],b=v[(e+1)%3],dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;
      const t=length?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length)):0;
      const d=Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);
      if(d<=distance){distance=d;nearest=[0,1].map(k=>(mesh.uv[ids[e]*2+k]*(1-t)+mesh.uv[ids[(e+1)%3]*2+k]*t)*256);}
    }
    const w=barycentric(p,...v);if(w)return [0,1].map(k=>Array.from(ids).reduce((s,id,j)=>s+w[j]*mesh.uv[id*2+k]*256,0));
  }
  return nearest;
}
for(const fixture of reference.cases) test(`${fixture.id}: independent ${fixture.crs} reference`,()=>{
  const source=createSource(fixture.id);
  for(const p of fixture.points) {
    const actual=source.pixelToGeographic(p.pixel);
    assert(Math.abs(((actual[0]-p.geographic[0]+540)%360)-180)<1e-8);
    assert(Math.abs(actual[1]-p.geographic[1])<1e-8);
    const inverse=source.geographicToPixel(p.geographic);
    assert(Math.hypot(...inverse.map((x,i)=>x-p.pixel[i]))<1e-7);
  }
});
for(const [source,target] of [['antarctica','world'],['rotated-polar','world'],['fiji','world'],['utm60','world'],['world','world'],['antarctica','interrupted'],['antarctica','orthographic'],['antarctica','perspective']]) {
  test(`${source} to ${target}: coverage, chart identity and independent texture probes`,()=>{
    const charts=createCharts(source,target),meshes=charts.map(c=>prepareInverse(c,{tolerance:1}));
    const points=reference.cases.find(c=>c.id===source)?.points || Array.from({length:81},(_,i)=>({pixel:[(i%9+.5)/9*256,(Math.floor(i/9)+.5)/9*256]}));
    for(const [i,m] of meshes.entries()) {
      assert.equal(m.diagnostics.omittedTriangles,0);
      assert.equal(m.chart,charts[i].id);
      assert(m.sourceRows.every(r=>r===charts[i].row));
      assert(m.uv.every(x=>x>=-1e-8&&x<=1+1e-8));
      assert(inspectWarp(m,charts[i]).maximumError<=1,'post-clipping error exceeds one texel');
    }
    let visible=0;
    for(const point of points) {
      const geographic=point.geographic || createSource(source).pixelToGeographic(point.pixel);
      // Independent spherical visibility test, including finite-height perspective.
      if(target==='orthographic'||target==='perspective') {
        const d=Math.PI/180, cosine=Math.sin(-50*d)*Math.sin(geographic[1]*d)+Math.cos(-50*d)*Math.cos(geographic[1]*d)*Math.cos(geographic[0]*d);
        if(cosine<(target==='orthographic'?0:.5)+1e-5)continue;
      }
      let found=false;
      for(const [i,chart] of charts.entries()) {
        let p;try{p=chart.fromGeographic(geographic);}catch{continue;}
        const uv=sample(meshes[i],p,chart.boundaryTolerance);
        if(uv && Math.hypot(uv[0]-point.pixel[0],uv[1]-point.pixel[1])<=1.2){found=true;break;}
      }
      assert(found,`uncovered/wrong source pixel ${point.pixel}`);visible++;
    }
    assert(visible>20);
  });
}

test('domain holes remain empty and source rows survive image clipping',()=>{
  const chart={id:'hole',width:256,height:256,row:42,domain:{polygons:[{outer:rectangle(0,0,256,256),holes:[rectangle(64,64,192,192)]}]},inverse:p=>p};
  const mesh=prepareInverse(chart);
  assert.equal(sample(mesh,[128,128]),null);
  assert.deepEqual(sample(mesh,[32,32]),[32,32]);
  let area=0;for(let i=0;i<mesh.indices.length;i+=3){const [a,b,c]=Array.from(mesh.indices.slice(i,i+3),j=>mesh.positions.slice(j*2,j*2+2));area+=Math.abs((b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]))/2;}
  assert.equal(area,256*256-128*128);
  assert(mesh.sourceRows.every(r=>r===42));
});
test('invalid chart samples, unsupported combinations and budgets fail without partial output',()=>{
  const mesh=seedDomain({polygons:[{outer:rectangle(0,0,1,1)}]});
  for(const f of [()=>null,()=>[NaN,0],()=>[0]])assert.throws(()=>runWarpSync(mesh,f),WarpError);
  for(const options of [{tolerance:0},{maxDepth:-1},{maxVertices:1},{maxTriangles:1},{maxSamples:1},{maxDepth:0,tolerance:.0001}])
    assert.throws(()=>runWarpSync(mesh,p=>[p[0]*p[0],p[1]],options),WarpError);
  assert.throws(()=>createCharts('world','interrupted'),/polar source/);
  assert.throws(()=>createSource('unknown'));
});
test('adaptive shared-edge refinement remains conforming',()=>{
  const input={positions:new Float64Array([0,0,1,0,1,1,0,1]),indices:new Uint32Array([0,1,2,0,2,3])};
  const m=runWarpSync(input,p=>[p[0],p[1]+Math.max(0,p[0]-p[1])**3],{tolerance:.01});
  const p=m.sourcePositions;
  for(let i=0;i<m.indices.length;i+=3)for(let e=0;e<3;e++) {
    const a=m.indices[i+e],b=m.indices[i+(e+1)%3],dx=p[b*2]-p[a*2],dy=p[b*2+1]-p[a*2+1];
    for(let j=0;j<p.length/2;j++)if(j!==a&&j!==b){const x=p[j*2]-p[a*2],y=p[j*2+1]-p[a*2+1],t=(x*dx+y*dy)/(dx*dx+dy*dy);
      assert(!(t>1e-9&&t<1-1e-9&&Math.abs(x*dy-y*dx)<1e-12),'T-junction');}
  }
});
