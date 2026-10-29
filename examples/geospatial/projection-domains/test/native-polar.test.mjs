// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {nativePolarFixture,nativePolarImage} from '../lab/native-polar.mjs';
import {createSource,createCharts} from '../warp/fixtures.mjs';
import {prepareInverse,inspectWarp} from '../warp/prepare.mjs';
test('native polar tiles share coordinates and samples, retain nodata and match the source grid',()=>{
  const [a,b]=nativePolarFixture.tiles,bytes=nativePolarFixture.tiles.map(t=>Buffer.from(t.rgbaBase64,'base64'));
  nativePolarFixture.tiles.forEach((t,i)=>assert.equal(createHash('sha256').update(bytes[i]).digest('hex'),t.sha256));
  for(let y=0;y<65;y++){
    assert.equal(a.affine[0]+32*a.affine[1],b.affine[0]);
    assert.deepEqual(bytes[0].subarray((y*33+32)*4,(y*33+33)*4),bytes[1].subarray(y*33*4,(y*33+1)*4));
  }
  const image=nativePolarImage(),source=createSource('antarctica');
  assert.deepEqual(source.pixelToCoordinate([0,0]),[a.affine[0],a.affine[3]]);
  assert.equal(image.data[(128*256+128)*4+3],0);assert.equal(image.data[3],255);
  const chart=createCharts('antarctica','world')[0],mesh=prepareInverse(chart,{tolerance:1});
  assert(inspectWarp(mesh,chart).maximumError<1.5);
  let valid=0,nodata=0;
  for(let i=0;i<mesh.uv.length;i+=2){const x=Math.min(255,Math.max(0,Math.floor(mesh.uv[i]*256))),y=Math.min(255,Math.max(0,Math.floor(mesh.uv[i+1]*256)));if(image.data[(y*256+x)*4+3])valid++;else nodata++;}
  assert(valid>0&&nodata>0);
});
