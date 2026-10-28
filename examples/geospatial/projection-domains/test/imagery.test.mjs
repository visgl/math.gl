// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {resampleImagery} from '../lab/imagery.mjs';
const width=360,height=180,data=new Uint8ClampedArray(width*height*4);
for(let y=0;y<height;y++)for(let x=0;x<width;x++)data.set([127+100*Math.sin((x+.5-180)*Math.PI/180),179.5-y,100,255],(y*width+x)*4);
const image={width,height,data};
const pixel=(r,x,y)=>Array.from(r.data.slice((y*r.width+x)*4,(y*r.width+x)*4+4));
test('Earth resampling follows source UV orientation, polar CRS and Fiji rotation',async()=>{
  const world=await resampleImagery(image,'world');
  assert(pixel(world,128,0)[1]<2);assert(pixel(world,128,255)[1]>178);
  const polar=await resampleImagery(image,'antarctica');
  assert(pixel(polar,128,128)[1]<1);assert(pixel(polar,128,255)[1]>30);
  const fiji=await resampleImagery(image,'fiji');
  const center=pixel(fiji,128,128);assert(Math.abs(center[0]-127)<2);assert(Math.abs(center[1]-75)<2);
  // Increasing source x in the rotated grid increases geographic latitude.
  assert(pixel(fiji,200,128)[1]>pixel(fiji,50,128)[1]);
  for(const raster of [world,polar,fiji])for(let i=3;i<raster.data.length;i+=4)assert.equal(raster.data[i],255);
});
test('resampling cooperatively aborts between row batches',async()=>{
  const controller=new AbortController();let yields=0;
  await assert.rejects(resampleImagery(image,'antarctica',{signal:controller.signal,yieldFrame:async()=>{if(++yields===2)controller.abort(new Error('Superseded texture'));}}),/Superseded texture/);
});
