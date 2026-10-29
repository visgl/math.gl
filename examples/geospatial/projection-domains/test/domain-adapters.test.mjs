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
