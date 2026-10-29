// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {FullProjectionEngine} from '@math.gl/geospatial/projection';
import {createSource} from '../warp/fixtures.mjs';
import {unwrapPeriodicPath} from '../warp/unwrap-path.mjs';
const wrap=x=>((x+180)%360+360)%360-180;
test('output unwrapping resolves a full period despite identical normalized endpoints',()=>{
  const r=unwrapPeriodicPath([[0,0],[360,0]],{transform:([x,y])=>[wrap(x),y],period:360,maxSourceStep:30});
  assert.equal(r.positions.at(-2),360);assert.equal(r.positions[0],0);
});
test('rotated Fiji and UTM 60 paths retain continuous local branches',()=>{
  for(const id of ['fiji','utm60']) {
    const source=createSource(id);
    const r=unwrapPeriodicPath([[0,128],[256,128]],{transform:p=>source.pixelToGeographic(p),period:360,maxSourceStep:8,tolerance:.01});
    for(let i=2;i<r.positions.length;i+=2)assert(Math.abs(r.positions[i]-r.positions[i-2])<20);
    for(let i=0;i<r.positions.length;i+=2){const q=source.pixelToGeographic(r.sourcePositions.slice(i,i+2));assert(Math.abs(wrap(q[0]-r.positions[i]))<1e-8);assert(Math.abs(q[1]-r.positions[i+1])<1e-8);}
  }
});
test('shifted-meridian Mercator uses its own output period',()=>{
  const engine=new FullProjectionEngine(),projection=engine.createProjection({from:'WGS84',to:'+proj=merc +lon_0=150 +datum=WGS84 +units=m'});
  const period=2*Math.PI*6378137;
  const r=unwrapPeriodicPath([[-40,0],[-20,0]],{transform:p=>projection.project(p).slice(0,2),period,maxSourceStep:1,tolerance:.01});
  assert(Math.abs((r.positions.at(-2)-r.positions[0])-period*20/360)<1e-6);
});
test('winding and unresolved singular paths are explicit',()=>{
  const r=unwrapPeriodicPath([[1,0],[0,1],[-1,0],[0,-1],[1,0]],{transform:([x,y])=>[Math.atan2(y,x)*180/Math.PI,0],period:360,maxSourceStep:.1,tolerance:.01});
  assert.equal(r.winding,1);
  assert.throws(()=>unwrapPeriodicPath([[0,0],[1,0]],{transform:([x])=>[x<.5?0:90,0],period:360,maxSourceStep:.1,maxDepth:5}),/Unresolved/);
  assert.throws(()=>unwrapPeriodicPath([[0,0],[1,0]],{transform:p=>p,period:360,maxSourceStep:.1,maxSamples:2}),/budget/);
  assert.throws(()=>unwrapPeriodicPath([[0,0],[1,0]],{transform:()=>[NaN,0],period:360,maxSourceStep:1}),/Invalid transform/);
});
