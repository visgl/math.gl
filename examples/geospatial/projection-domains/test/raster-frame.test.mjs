// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRasterFrame,rasterFrameFixtures} from '../raster-frame/recipe.mjs';
const near=(actual,expected)=>actual.forEach((v,i)=>assert(Math.abs(v-expected[i])<1e-8,`${actual} != ${expected}`));
test('independent affine and registration fixtures retain native sample coordinates',()=>{
 const north=createRasterFrame(rasterFrameFixtures[0]),point=createRasterFrame(rasterFrameFixtures[1]),rotated=createRasterFrame(rasterFrameFixtures[2]),axes=createRasterFrame(rasterFrameFixtures[3]);
 near(north.sampleToCoordinate([0,0]),[500001,4649998.5]);near(north.sampleToCoordinate([3,2]),[500007,4649992.5]);
 near(point.sampleToCoordinate([0,0]),[500000,4650000]);assert.equal(point.coverage,null);
 near(rotated.sampleToCoordinate([0,0]),[500001.25,4649999]);near(rotated.sampleToCoordinate([3,2]),[500008.25,4649996]);
 assert.deepEqual(axes.sampleBounds,north.sampleBounds);near(north.coverage[2],[500008,4649991]);
});
test('forward/inverse frames preserve permutations, unequal spacing and immutable inputs',()=>{
 for(const fixture of rasterFrameFixtures){const frame=createRasterFrame(fixture);
 for(const p of [[0,0],[3,2],[1.25,.75],[-.5,2.5]])near(frame.coordinateToSample(frame.sampleToCoordinate(p)),p);
 assert(Object.isFrozen(frame.affine));assert(Object.isFrozen(frame.spatialReference.coordinateOrder));}
 const fixture={...rasterFrameFixtures[0],affine:[...rasterFrameFixtures[0].affine]};const frame=createRasterFrame(fixture);fixture.affine[0]=99;near(frame.sampleToCoordinate([0,0]),[500001,4649998.5]);
});
test('native units and CRS state remain metadata, and invalid frames reject',()=>{
 const frame=createRasterFrame({...rasterFrameFixtures[0],spatialReference:{units:['US survey foot','US survey foot'],coordinateOrder:['easting','northing']}});assert.equal(frame.spatialReference.crs.state,'absent');assert.equal(frame.spatialReference.units[0],'US survey foot');near(frame.sampleToCoordinate([0,0]),[500001,4649998.5]);
 for(const options of [{affine:[1,2,2,4,0,0]},{registration:'unknown'},{size:[0,3]},{axisOrder:[0,0]},{affine:[1,0,0,1,Infinity,0]}])assert.throws(()=>createRasterFrame({...rasterFrameFixtures[0],...options}),/frame/);
});
test('multiscale geometry comes from each explicit level, not a shared scale or chunk size',()=>{
 const fine=createRasterFrame(rasterFrameFixtures[0]);
 const coarse=createRasterFrame({size:[2,1],affine:[4,0,0,-9,500000,4650000],registration:'area'});
 assert.deepEqual(coarse.coverage,fine.coverage);
 near(coarse.sampleToCoordinate([0,0]),[500002,4649995.5]);
 assert.notDeepEqual(coarse.sampleBounds,fine.sampleBounds);
});
