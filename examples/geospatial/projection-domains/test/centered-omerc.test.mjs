// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCenteredObliqueMercator,prepareCenteredFrame} from '../centered-omerc/recipe.mjs';
test('center, orientation and backend invalidate the complete prepared operation',()=>{
 const first=prepareCenteredFrame();assert.equal(first.reused,false);
 const same=prepareCenteredFrame(undefined,first);assert.equal(same.reused,true);assert.equal(same.patch,first.patch);assert.equal(same.descriptor,first.descriptor);
 for(const options of [{center:[170,-17]},{alpha:40},{backend:'math.gl'}]){
 const next=prepareCenteredFrame(options,first);assert.equal(next.reused,false);assert.notEqual(next.cacheKey,first.cacheKey);
 }
});
test('both engines retain the descriptor interface across the Fiji geographic seam',()=>{
 for(const backend of ['proj4js','math.gl']){
 const frame=createCenteredObliqueMercator({backend});
 for(const lon of [179,180,181,190]){
 const p=[lon,-17,123],q=frame.descriptor.converter.WGS84.from(p),r=frame.descriptor.converter.WGS84.to(q);
 assert(Math.abs((r[0]-lon+540)%360-180)<1e-7);assert(Math.abs(r[1]+17)<1e-7);assert.equal(r[2],123);
 }
 assert(frame.patch.every(p=>p.every(Number.isFinite)));assert.equal(frame.descriptor.projectionDomain,undefined);
 assert.equal(frame.descriptor.getRenderingScale([0,0,0]),null);
 }
 for(const options of [{center:[0,90]},{alpha:90},{backend:'unknown'}])assert.throws(()=>createCenteredObliqueMercator(options),/Unsupported/);
});

test('both engines match independent offline PROJ coordinates',()=>{
 const reference=JSON.parse(readFileSync(new URL('../centered-omerc/reference.json',import.meta.url),'utf8'));
 for(const item of reference.cases)for(const backend of ['math.gl','proj4js']){
 const frame=createCenteredObliqueMercator({...item,backend});
 item.points.forEach((p,i)=>{const q=frame.descriptor.converter.WGS84.from(p);assert(Math.hypot(...q.map((v,k)=>v-item.projected[i][k]))<.002, `${backend}: ${p}`);});
 }
});

test('UI extremes and equatorial zero-orientation operations remain qualified',()=>{
 for(const backend of ['math.gl','proj4js'])for(const center of [[-180,-60],[180,60],[0,0]])for(const alpha of [-80,0,80]){
 const frame=createCenteredObliqueMercator({backend,center,alpha});assert(frame.graticule.length>0);
 }
});
