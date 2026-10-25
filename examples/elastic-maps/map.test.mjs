// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMapData} from './map.js';
for(const preset of ['I','II','III'])test(`Elastic ${preset}: prepared coastline geometry and fitted picking`,()=>{
  const data=createMapData(preset);
  assert.equal(createMapData(preset),data);
  assert(data.coast.length>100);
  assert(data.polygon.length>1);
  for(const line of [...data.coast,...data.grid]){
    assert.equal(line.coordinates.length,line.sourceCoordinates.length);
    assert(line.coordinates.flat().every(Number.isFinite));
  }
  const viewport=data.map.fit({width:720,height:480,padding:20});
  for(const city of data.cities){
    const candidates=data.map.pick(viewport,viewport.project(city.position));
    assert(candidates.some(p=>p.regionId===city.regionId));
  }
  assert.deepEqual(data.map.pick(viewport,[-1000,-1000]),[]);
});
