// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {FullProjectionEngine} from '@math.gl/geospatial/projection';
const url=new URL('../qualification/corpus.json',import.meta.url),corpus=JSON.parse(readFileSync(url,'utf8'));
const wrap=x=>((x+180)%360+360)%360-180;
const coordinate=(f,[x,y])=>[f.affine[0]+x*f.affine[1]+y*f.affine[2],f.affine[3]+x*f.affine[4]+y*f.affine[5]];
test('portable raster corpus matches independent PROJ samples and affine footprints',()=>{
  const engine=new FullProjectionEngine();assert.equal(corpus.schemaVersion,1);
  for(const fixture of corpus.cases) {
    const projection=engine.createProjection({from:fixture.definition,to:'WGS84'});
    for(const point of fixture.points) {
      assert.deepEqual(coordinate(fixture,point.pixel),point.coordinate);
      const geographic=projection.project(point.coordinate);
      assert(Math.abs(geographic[1]-point.geographic[1])<1e-7,fixture.id);
      if(Math.abs(point.geographic[1])<89.999999)assert(Math.abs(wrap(geographic[0]-point.geographic[0]))<1e-7,fixture.id);
    }
  }
});
test('adjacent tile edge samples agree without independent edge drift',()=>{
  for(const edge of corpus.adjacency) {
    const left=corpus.cases.find(f=>f.id===edge.left),right=corpus.cases.find(f=>f.id===edge.right);
    for(const y of edge.y){assert.deepEqual(coordinate(left,[edge.leftX,y]),coordinate(right,[edge.rightX,y]));
      const a=left.points.find(p=>p.pixel[0]===edge.leftX&&p.pixel[1]===y),b=right.points.find(p=>p.pixel[0]===edge.rightX&&p.pixel[1]===y);assert.deepEqual(a.geographic,b.geographic);}
  }
});
test('real overview raster has stable bytes and explicit north-up georeferencing',()=>{
  const r=corpus.raster,bytes=readFileSync(new URL(r.path,url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),r.sha256);
  assert.deepEqual(coordinate(r,[0,0]),[-180,90]);assert.deepEqual(coordinate(r,[r.width,r.height]),[180,-90]);
  assert.match(readFileSync(new URL(r.provenance,url),'utf8'),/NASA/);
});
