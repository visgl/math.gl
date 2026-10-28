// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_TERRAIN_PALETTE,calibrateTerrainPalette,terrainImageryWeight,textureReveal} from './terrain-material.js';

test('calibration uses land samples without contaminating the palette with sea or white ice',()=>{
  const pixels=new Uint8ClampedArray([
    40,90,30,255, 160,110,60,255, 200,180,130,255,
    10,50,140,255, 250,250,250,255, 255,0,0,0
  ]);
  const output=new Float32Array(9);
  assert.equal(calibrateTerrainPalette(pixels,output),output);
  for(let i=0;i<9;i++) assert.ok(Math.abs(output[i]-pixels[Math.floor(i/3)*4+i%3]/255)<1e-6);
  assert.deepEqual(Array.from(calibrateTerrainPalette(new Uint8Array())),Array.from(new Float32Array(DEFAULT_TERRAIN_PALETTE)));
});
test('image reveal starts from the current synthetic palette and settles smoothly',()=>{
  assert.equal(textureReveal(100,Infinity),0);
  assert.equal(textureReveal(100,100),0);
  assert.equal(textureReveal(850,100),.5);
  assert.equal(textureReveal(1600,100),1);
  assert.equal(textureReveal(2000,100),1);
});
test('coverage handoffs meet the imagery endpoint with a smooth fade in color and lighting',()=>{
  assert.equal(terrainImageryWeight(-540),1);
  assert.equal(terrainImageryWeight(-530),.5);
  assert.equal(terrainImageryWeight(-520),0);
  assert.equal(terrainImageryWeight(-430),0);
  assert.equal(terrainImageryWeight(-30),0);
  assert.equal(terrainImageryWeight(-15),.5);
  assert.equal(terrainImageryWeight(0),1);
  assert.equal(terrainImageryWeight(300),1);
  assert.equal(terrainImageryWeight(NaN),0);
  assert.ok(1-terrainImageryWeight(-.001)<1e-8);
  assert.ok(terrainImageryWeight(-29.999)<1e-8);
});
