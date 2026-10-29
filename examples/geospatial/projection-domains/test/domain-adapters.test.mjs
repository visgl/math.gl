// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {createInterruptedSinusoidalMap} from '@math.gl/geospatial/discontinuous';
import {createHorizonDomain,createMapChartDomains} from '../warp/domain-adapters.mjs';
test('horizon domains track parameters and tighten sampled chord error',()=>{
  for(const kind of ['orthographic','perspective']) {
    const a=createHorizonDomain({kind,center:[20,-75],tolerance:.01,maxAngularStep:30});
    const b=createHorizonDomain({kind,center:[20,-75],tolerance:.00001,maxAngularStep:30});
    assert(b.domain.polygons[0].outer.length>a.domain.polygons[0].outer.length);
    assert.notEqual(a.identity,createHorizonDomain({kind,center:[25,-75]}).identity);
    for(const p of b.domain.polygons[0].outer){const ll=b.projection.unproject(p),q=b.projection.project(ll);assert(Math.hypot(q[0]-p[0],q[1]-p[1])<1e-6);}
  }
  assert.throws(()=>createHorizonDomain({tolerance:1e-10,maxAngularStep:45,maxDepth:0}),/budget/);
  assert.throws(()=>createHorizonDomain({center:[0,91]}),/policy/);
});
test('native interrupted domains retain chart identity and inverse branches',()=>{
  const map=createInterruptedSinusoidalMap(),charts=createMapChartDomains(map,{tolerance:.001,maxAngularStep:4});
  assert.equal(charts.length,map.regions.length);
  for(const region of map.regions){const c=charts.find(c=>c.id===region.id),p=c.project(region.interior);assert(p);assert(c.unproject(p.position).length);assert.equal(c.domain.polygons.length,1);}
});

test('exact north and south polar centers have finite closed perspective horizons',()=>{
  for(const kind of ['orthographic','perspective'])for(const latitude of [-90,90]) {
    const result=createHorizonDomain({kind,center:[37,latitude]});
    const ring=result.domain.polygons[0].outer;
    assert(ring.length>20);assert(ring.length<65536);assert.deepEqual(ring[0],ring.at(-1));
    for(const p of ring){assert(p.every(Number.isFinite));const q=result.projection.project(result.projection.unproject(p));assert(Math.hypot(q[0]-p[0],q[1]-p[1])<1e-6);}
  }
  assert(createHorizonDomain({kind:'perspective'}).domain.polygons[0].outer.length>20);
});

// PROJ reference coordinates are generated offline, not through the engine under test.
import {readFileSync} from 'node:fs';
test('parameterized perspective limbs agree with independent PROJ boundaries',()=>{
  const corpus=JSON.parse(readFileSync(new URL('../qualification/horizons.json',import.meta.url)));
  for(const fixture of corpus.cases){
    const result=createHorizonDomain({kind:'perspective',...fixture,tolerance:1e-5,maxAngularStep:3});
    const ring=result.domain.polygons[0].outer;
    for(const {geographic,target} of fixture.points){
      const actual=result.projection.project(geographic);
      assert(Math.hypot(actual[0]-target[0],actual[1]-target[1])<1e-9);
      // Every 3-degree oracle bearing is an initial vertex of the adaptive ring.
      assert(Math.min(...ring.map(p=>Math.hypot(p[0]-target[0],p[1]-target[1])))<1e-9);
    }
    for(const key of ['height','tilt','azimuth'])assert.notEqual(result.identity,
      createHorizonDomain({kind:'perspective',...fixture,[key]:fixture[key]+.01,tolerance:1e-5,maxAngularStep:3}).identity);
  }
  for(const options of [{height:0},{height:11},{height:1,tilt:60},{tilt:NaN},{azimuth:Infinity}])
    assert.throws(()=>createHorizonDomain({kind:'perspective',...options}),/perspective/);
});
