// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {unitVector} from './math.js';
import {containsPlace,createPlaceTracker,easeCamera,cinematicShot} from './journeys.js';
import {createJourneyTrail} from './journey-trail.js';
import {createFutureComparison,majorFutureBlocks} from './future-comparison.js';
function feature(rings) {
  const count=rings.reduce((n,ring)=>n+ring.length/2,0),xyz=new Float64Array(count*3),holes=[];
  let index=0;
  for(const ring of rings){if(index)holes.push(index*2);for(let i=0;i<ring.length;i+=2){unitVector(ring[i],ring[i+1],xyz.subarray(index*3,index*3+3));index++;}}
  return {xyz,holes,pid:1,beginAge:120,endAge:0,region:'Africa'};
}
const outer=[-10,-10,10,-10,10,10,-10,10,-10,-10];
test('plate assignment respects holes, dateline crossing and unassigned ocean',()=>{
  const f=feature([outer,[-2,-2,2,-2,2,2,-2,2,-2,-2]]);
  assert.equal(containsPlace(f,{lon:5,lat:0}),true);
  assert.equal(containsPlace(f,{lon:0,lat:0}),false);
  assert.equal(containsPlace(f,{lon:100,lat:0}),false);
  assert.equal(containsPlace(f,{lon:NaN,lat:0}),false);
  const seam=feature([[170,-10,-170,-10,-170,10,170,10,170,-10]]);
  assert.equal(containsPlace(seam,{lon:179,lat:0}),true);
  assert.equal(containsPlace(seam,{lon:-179,lat:0}),true);
  assert.equal(containsPlace(seam,{lon:0,lat:0}),false);
});
test('place tracking uses source rotations, never invents missing samples, and reuses state',()=>{
  const tracker=createPlaceTracker(),rotations={};
  for(let age=0;age<=100;age+=10){const angle=age*Math.PI/180/2;rotations[age]={1:[Math.cos(angle),0,0,Math.sin(angle)]};}
  tracker.setModel({features:[feature([outer])],rotations,source:{maxAge:100}});
  tracker.setPlace({name:'Test place',lon:0,lat:0});
  const state=tracker.update(-80,'atlantic');
  assert.equal(state.available,true);assert.ok(Math.abs(state.lon-80)<1e-10);assert.ok(state.count>1);
  const saved=Array.from(state.trail),again=tracker.update(-80,'atlantic');
  assert.equal(again,state);assert.deepEqual(Array.from(again.trail),saved);
  assert.equal(tracker.update(-101,'atlantic').available,false);
  const ninety=rotations[90];delete rotations[90];assert.equal(tracker.update(-80,'atlantic').count,1,'trail stops before a missing rotation interval');
  rotations[90]=ninety;assert.ok(tracker.update(-80,'atlantic').count>1,'paused trails extend when missing samples arrive');
  delete rotations[100];assert.equal(tracker.update(-100,'atlantic').available,false);
  tracker.setPlace({name:'Ocean',lon:100,lat:0});assert.equal(tracker.update(0,'atlantic').available,false);
  tracker.setModel(null);assert.equal(tracker.update(0,'atlantic').available,false);
});
test('camera easing crosses the dateline on the short arc and remains bounded',()=>{
  const camera={longitude:179,latitude:0};
  easeCamera(camera,-179,90,16);
  assert.ok(camera.longitude>179);assert.ok(camera.latitude>0&&camera.latitude<70);
  for(let i=0;i<500;i++)easeCamera(camera,-179,90,16);
  assert.ok(Math.abs(camera.longitude+179)<.002);assert.ok(camera.latitude<=70);
  assert.equal(cinematicShot(-4500).name,'Moon formation');
  assert.equal(cinematicShot(-700).name,'Snowball Earth');
  assert.equal(cinematicShot(-200),null);
});
test('alternative future outlines respect scenario changes, forced seeks, and source geometry',()=>{
  const f=feature([outer]),before=Array.from(f.xyz),compare=createFutureComparison();
  compare.setModel({features:[f]});
  assert.deepEqual(compare.update(-10,'atlantic',0,0,{globe:1},{},{},0),[]);
  const snapshot=(time,scenario,now,force=false)=>JSON.stringify(compare.update(time,scenario,0,0,{globe:1},{},{},now,force).map(path=>Array.from(path.positions)));
  const a=snapshot(100,'atlantic',0);
  assert.notEqual(snapshot(250,'atlantic',1,true),a,'paused seeks rebuild immediately');
  assert.notEqual(snapshot(100,'polar',2),a,'the unselected scenario changes');
  assert.equal(snapshot(100,'atlantic',3),a,'returning to the same age and scenario is repeatable');
  assert.deepEqual(Array.from(f.xyz),before);
  compare.setModel(null);assert.deepEqual(compare.update(100,'atlantic',0,0,{globe:1},{},{},4),[]);
});


test('map comparison invalidates cached outlines on a paused seek and clips the seam',()=>{
  const compare=createFutureComparison();compare.setModel({features:[feature([outer])]});
  const weights={eqc:1},engines={eqc:{projectFlatSync:coordinates=>coordinates}},scales={eqc:.01};
  const snapshot=(time,force)=>JSON.stringify(compare.update(time,'atlantic',170,0,weights,engines,scales,1,force).map(path=>Array.from(path.positions)));
  const before=snapshot(100,false);
  assert.notEqual(snapshot(250,true),before);
});


test('future comparison selects major source blocks without interior-fragment clutter',()=>{
  const mainland=feature([outer]),island=feature([[0,0,1,0,1,1,0,1,0,0]]);
  const other=feature([outer]);other.region='Europe';
  assert.deepEqual(majorFutureBlocks([island,mainland,other]),[mainland,other]);
});


test('overlapping source plates remain unassigned instead of choosing an arbitrary plate',()=>{
  const a=feature([outer]),b=feature([outer]);b.pid=2;
  const tracker=createPlaceTracker();tracker.setModel({features:[a,b],rotations:{0:{1:[1,0,0,0],2:[1,0,0,0]}},source:{maxAge:100}});
  tracker.setPlace({name:'Ambiguous',lon:0,lat:0});
  const result=tracker.update(0,'atlantic');assert.equal(result.available,false);assert.match(result.message,/Ambiguous/);
});


test('a place is not reconstructed before its template lifetime even when rotations exist',()=>{
  const f=feature([outer]);f.beginAge=50;
  const tracker=createPlaceTracker();tracker.setModel({features:[f],rotations:{60:{1:[.99,0,0,.1]}},source:{maxAge:100}});
  tracker.setPlace({name:'Young template',lon:0,lat:0});assert.equal(tracker.update(-60,'atlantic').available,false);
});


test('map trails retain both sides of a seam and globe trails stay continuous',()=>{
  const build=createJourneyTrail(),trail=new Float64Array([179,0,-179,0,-177,0]),before=Array.from(trail),journey={trail,count:3};
  const engines={eqc:{projectFlatSync:coordinates=>coordinates}},scales={eqc:.01};
  const map=build(journey,0,0,{eqc:1},engines,scales);
  assert.equal(map.length,2);
  assert.ok(map.some(path=>path.coordinates[0]>0));assert.ok(map.some(path=>path.coordinates[0]<0));
  assert.ok(map.reduce((count,path)=>count+path.count,0)>=5,'all three samples plus seam endpoints remain visible');
  const firstBuffer=map[0].coordinates;
  const centered=build(journey,180,0,{eqc:1},engines,scales);
  assert.equal(centered.length,1);assert.equal(centered[0].count,3);assert.equal(centered[0].coordinates,firstBuffer);
  assert.ok(Math.abs(centered[0].coordinates[0]+1)<1e-9);assert.ok(Math.abs(centered[0].coordinates[4]-3)<1e-9);
  const globe=build(journey,0,0,{globe:1},{},{});
  assert.equal(globe.length,1);assert.equal(globe[0].count,3);assert.ok(globe[0].positions.every(Number.isFinite));
  assert.deepEqual(Array.from(trail),before);
});
