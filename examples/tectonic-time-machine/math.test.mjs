// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  IDENTITY,
  unitVector,
  slerp,
  rotationBetween,
  rotateToLonLat,
  historicalRotation,
  futureRotation,
  futureRotations,
  timeLabel
} from './math.js';
const near = (a, b, epsilon = 1e-9) => assert(Math.abs(a - b) < epsilon, `${a} != ${b}`);
test('rigid spherical rotations preserve known axis fixtures and distances', () => {
  const out = new Float64Array(6);
  const axis = [Math.SQRT1_2, 0, 0, Math.SQRT1_2];
  rotateToLonLat(axis, unitVector(0, 0), 0, out, 2);
  near(out[2], 90);
  near(out[3], 0);
  near(out[0], 0);
  const q = rotationBetween([20, -30], [-80, 40]);
  rotateToLonLat(q, unitVector(20, -30), 0, out, 0);
  near(out[0], -80);
  near(out[1], 40);
  const opposite = rotationBetween([0, 0], [180, 0]);
  rotateToLonLat(opposite, unitVector(0, 0), 0, out, 0);
  near(Math.abs(out[0]), 180);
  near(out[1], 0);
});
test('shortest interpolation crosses the dateline rather than reversing around Earth', () => {
  const a = [Math.cos((170 * Math.PI) / 360), 0, 0, Math.sin((170 * Math.PI) / 360)],
    b = [Math.cos((-170 * Math.PI) / 360), 0, 0, Math.sin((-170 * Math.PI) / 360)];
  const q = new Float64Array(4),
    out = new Float64Array(2);
  slerp(a, b, 0.5, q);
  near(Math.hypot(...q), 1);
  rotateToLonLat(q, unitVector(0, 0), 0, out, 0);
  near(Math.abs(out[0]), 180);
  slerp(
    a,
    a.map(n => -n),
    0.3,
    q
  );
  near(Math.abs(q[0]), Math.abs(a[0]));
});
test('first historical interval moves continuously from present and absent poles are omitted', () => {
  const q = new Float64Array(4),
    ten = [Math.cos(Math.PI / 18), 0, 0, Math.sin(Math.PI / 18)];
  const table = {
    0: {701: IDENTITY},
    10: {701: ten},
    20: {701: IDENTITY}
  };
  assert(historicalRotation(table, 701, 5, q));
  const out = new Float64Array(2);
  rotateToLonLat(q, unitVector(0, 0), 0, out, 0);
  near(out[0], 10);
  assert(!historicalRotation(table, 701, 15, q));
  assert(!historicalRotation(table, 999, 5, q));
  assert(historicalRotation({0: {0: IDENTITY}, 10: {0: IDENTITY}}, 0, 5, q));
});
test('future scenarios are continuous at present, unit rotations, and held after assembly', () => {
  const q = new Float64Array(4);
  for (const scenario of ['atlantic', 'polar'])
    for (const target of Object.values(futureRotations(scenario))) {
      futureRotation(target, 0, q);
      assert.deepEqual([...q], IDENTITY);
      futureRotation(target, 250, q);
      for (let i = 0; i < 4; i++) near(q[i], target[i]);
      futureRotation(target, 300, q);
      for (let i = 0; i < 4; i++) near(q[i], target[i]);
      futureRotation(target, 100, q);
      near(Math.hypot(...q), 1);
    }
});
test('timeline distinguishes past, present and future', () => {
  assert.equal(timeLabel(-500), '500 Ma ago');
  assert.equal(timeLabel(0), 'Present day');
  assert.equal(timeLabel(250), '+250 million years');
});

import {makeMesh, blendWeights, transformMesh, worldToGeographic} from './geometry.js';
test('geographic cell triangulation preserves holes and area before spherical morphs', () => {
  const mesh = makeMesh([
    {
      positions: [0, 0, 10, 0, 10, 10, 0, 10, 0, 0, 2, 2, 2, 4, 4, 4, 4, 2, 2, 2],
      holeIndices: [10],
      color: [20, 30, 40]
    }
  ]);
  let area = 0;
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const a = mesh.indices[i] * 2,
      b = mesh.indices[i + 1] * 2,
      c = mesh.indices[i + 2] * 2,
      p = mesh.coordinates;
    area +=
      Math.abs((p[b] - p[a]) * (p[c + 1] - p[a + 1]) - (p[c] - p[a]) * (p[b + 1] - p[a + 1])) / 2;
  }
  near(area, 96);
  transformMesh(mesh, {globe: 1}, {}, {}, 15);
  for (let i = 0; i < mesh.positions.length; i += 3)
    near(Math.hypot(mesh.positions[i], mesh.positions[i + 1], mesh.positions[i + 2]), 1);
});
test('morph endpoints remain exact, and both views read moving coordinates during transitions', () => {
  const mesh = {
    coordinates: new Float64Array([0, 0]),
    projected: new Float64Array(2),
    positions: new Float64Array(3)
  };
  const engines = {
    map: {
      projectFlatSync(p) {
        p[0] /= 180;
        p[1] /= 90;
      }
    }
  };
  const scales = {map: 1};
  near(transformMesh(mesh, {globe: 1}, engines, scales, 0)[2], 1);
  assert.deepEqual([...transformMesh(mesh, {map: 1}, engines, scales, 0)], [0, 0, 0]);
  const weights = blendWeights({globe: 1}, 'map', 0.5);
  const first = [...transformMesh(mesh, weights, engines, scales, 0)];
  near(first[2], 0.5);
  mesh.coordinates[0] = 90;
  const next = transformMesh(mesh, weights, engines, scales, 0);
  near(next[0], 0.75);
  near(next[2], 0);
  assert.deepEqual(blendWeights(weights, 'globe', 0), weights);
  assert.deepEqual(blendWeights(weights, 'globe', 1), {globe: 1});
});

test('terrain reference vectors undo plate motion and meridian shifts, including the dateline', () => {
  const rotation = [Math.SQRT1_2, 0, 0, Math.SQRT1_2];
  for (const longitude of [0, 120, -180]) {
    const mesh = makeMesh([
      {
        positions: [
          88 - longitude,
          -2,
          92 - longitude,
          -2,
          92 - longitude,
          2,
          88 - longitude,
          2,
          88 - longitude,
          -2
        ],
        color: [10, 20, 30],
        rotation,
        longitude
      }
    ]);
    assert(mesh.indices.length);
    for (let i = 0, j = 0; i < mesh.coordinates.length; i += 2, j += 3) {
      const expected = unitVector(mesh.coordinates[i] + longitude - 90, mesh.coordinates[i + 1]);
      for (let k = 0; k < 3; k++) near(mesh.reference[j + k], expected[k], 1e-6);
    }
    transformMesh(mesh, {globe: 1}, {}, {}, 37);
    for (let j = 0; j < mesh.normals.length; j += 3)
      near(Math.hypot(...mesh.normals.subarray(j, j + 3)), 1, 1e-6);
  }
});

test('hover labels recover globe and map coordinates and reject points outside the surface', () => {
  const out = new Float64Array(2);
  assert(worldToGeographic(0, 0, 'globe', null, null, 37, 120, out));
  near(out[0], 120);
  near(out[1], 37);
  assert(worldToGeographic(1, 0, 'globe', null, null, 0, 120, out));
  near(out[0], -150);
  near(out[1], 0);
  assert(!worldToGeographic(1.1, 0, 'globe', null, null, 0, 0, out));
  const engine = {
    unprojectFlatSync(p) {
      return p;
    },
    projectFlatSync(p) {
      return p;
    }
  };
  assert(worldToGeographic(40, -20, 'eqc', engine, 2, 0, -30, out));
  near(out[0], -10);
  near(out[1], -10);
  assert(!worldToGeographic(362, 0, 'eqc', engine, 2, 0, 0, out));
  assert(!worldToGeographic(0, 172, 'merc', engine, 2, 0, 0, out));
});

test('Equal Earth hover outside its outline returns no coordinate instead of a runtime error', async () => {
  const {ProjectionTransform, equalEarth} = await import('@math.gl/projection');
  const radius = 6371008.8;
  const engine = new ProjectionTransform({
    from: `+proj=longlat +R=${radius}`,
    to: `+proj=eqearth +R=${radius} +units=m`,
    projections: [equalEarth]
  });
  const out = new Float64Array(2);
  assert.throws(() => engine.unprojectSync([0, 2e7]), /outside projection domain/);
  assert.equal(worldToGeographic(0, 2e7, 'eqearth', engine, 1, 0, 0, out), false);
  // This inverse wraps to a finite longitude, but the point is still outside the map.
  assert.equal(worldToGeographic(2e7, 0, 'eqearth', engine, 1, 0, 0, out), false);
  // A failed inverse must not poison the reused buffer or projection's scratch state.
  const projected = engine.projectSync([42, 25]);
  assert(worldToGeographic(...projected, 'eqearth', engine, 1, 0, 0, out));
  near(out[0], 42, 1e-7);
  near(out[1], 25, 1e-7);
  assert.equal(worldToGeographic(NaN, 0, 'eqearth', engine, 1, 0, 0, out), false);
  const broken = {
    unprojectFlatSync() {
      throw new Error('Plugin not loaded');
    }
  };
  assert.throws(
    () => worldToGeographic(0, 0, 'eqearth', broken, 1, 0, 0, out),
    /Plugin not loaded/
  );
});

import {LANDMASS_CHAPTERS, chapterOpacity, timelineMilestones} from './timeline.js';
test('landmass titles fade with geological time, and future names follow the selected scenario', () => {
  for (const chapter of LANDMASS_CHAPTERS) {
    const [start, formed, held, end] = chapter.fade;
    const scenario = chapter.scenario || 'atlantic';
    near(chapterOpacity(chapter, start, scenario), 0);
    near(chapterOpacity(chapter, (start + formed) / 2, scenario), 0.5);
    near(chapterOpacity(chapter, chapter.time, scenario), 1);
    near(chapterOpacity(chapter, held, scenario), 1);
    near(chapterOpacity(chapter, (held + end) / 2, scenario), 0.5);
    near(chapterOpacity(chapter, end, scenario), 0);
    near(chapterOpacity(chapter, NaN, scenario), 0);
  }
  near(
    chapterOpacity(
      LANDMASS_CHAPTERS.find(c => c.scenario === 'atlantic'),
      250,
      'polar'
    ),
    0
  );
  near(
    chapterOpacity(
      LANDMASS_CHAPTERS.find(c => c.scenario === 'polar'),
      250,
      'atlantic'
    ),
    0
  );
  assert.equal(timelineMilestones('atlantic').at(-1).name, 'Atlantic assembly');
  assert.equal(timelineMilestones('polar').at(-1).name, 'Polar assembly');
  for (let time = -500; time <= 300; time++) {
    assert(LANDMASS_CHAPTERS.filter(c => chapterOpacity(c, time, 'atlantic') > 0).length <= 1);
  }
});

import {DATA_SOURCES, rotationBracket, clampTime, sourceFor} from './sources.js';
import {createRotationCache, polygonFeature, loadModel} from './data.js';
import {rotationGroups} from './parquet-stream.js';
import {maintainHistory, waitForRetry} from './history-stream.js';
test('source ranges include Rodinia and restrict Nuna to the 1.8 Ga source', () => {
  assert.equal(sourceFor('CAO2024').license, 'CC-BY-4.0');
  assert.equal(sourceFor('MULLER2022').license, 'CC-BY-4.0');
  assert.throws(() => sourceFor('unknown'), /Unknown/);
  assert.throws(() => sourceFor('toString'), /Unknown/);
  assert.deepEqual(rotationBracket(-1800, 1800), [1800, 1800]);
  assert.deepEqual(rotationBracket(-1000, 1000), [1000, 1000]);
  assert.deepEqual(rotationBracket(-929.5, 1800), [920, 930]);
  assert.deepEqual(rotationBracket(250, 1800), [0, 0]);
  assert.throws(() => rotationBracket(-1001, 1000), /range/);
  assert.equal(clampTime(-1600, 1000), -1000);
  assert(timelineMilestones('atlantic', 1800).some(c => c.name === 'Nuna'));
  assert(!timelineMilestones('atlantic', 1000).some(c => c.name === 'Nuna'));
});
const pole = [Math.SQRT1_2, 0, 0, Math.SQRT1_2];
test('historical interpolation reaches deep-time endpoints without the previous 500 Ma clamp', () => {
  const q = new Float64Array(4),
    pole = [Math.SQRT1_2, 0, 0, Math.SQRT1_2];
  const table = {1790: {701: pole}, 1800: {701: pole}};
  assert(historicalRotation(table, 701, 1795, q, 1800));
  assert(historicalRotation(table, 701, 1800, q, 1800));
  near(q[0], pole[0]);
  assert(historicalRotation({1600: {701: pole}}, 701, 1600, q, 1800));
  assert(historicalRotation({0: {701: IDENTITY}}, 701, 0, q, 1800));
});
test('background Parquet loading reports interruptions and retries remaining history at the latest time', async () => {
  let current = -930,
    loaded = 11;
  const requests = [],
    statuses = [];
  const model = {
    get loadedSamples() {
      return loaded;
    },
    totalSamples: 181,
    async ensureHistory(time, {onStatus}) {
      requests.push(time);
      onStatus();
      if (requests.length === 1) throw new Error('Service unavailable');
      loaded = 181;
    }
  };
  await maintainHistory(model, () => current, {
    signal: new AbortController().signal,
    onStatus: value => statuses.push(value),
    async wait(delay, signal) {
      assert.equal(delay, 30000);
      signal.throwIfAborted();
      assert.equal(loaded, 11);
      assert(statuses.at(-1).includes('Service unavailable'));
      assert(statuses.at(-1).includes('retrying in 30s'));
      current = -1700;
    }
  });
  assert.deepEqual(requests, [-930, -1700]);
  assert.equal(statuses.at(-1), 'All 181 historical samples loaded');
});
test('source cancellation clears the idle preload retry timer', async () => {
  const controller = new AbortController();
  const statuses = [];
  let attempts = 0;
  const model = {
    loadedSamples: 11,
    totalSamples: 181,
    async ensureHistory() {
      attempts++;
      throw new Error('Service unavailable');
    }
  };
  const running = maintainHistory(model, () => -930, {
    signal: controller.signal,
    onStatus: value => statuses.push(value)
  });
  const rejection = assert.rejects(running, /abort/i);
  await new Promise(resolve => setImmediate(resolve));
  assert(statuses.at(-1).includes('retrying in 30s'));
  controller.abort();
  await rejection;
  assert.equal(attempts, 1);
  await waitForRetry(0, new AbortController().signal);
});

function batch(rows) {
  return {data:{numRows:rows.length,getChild(name) {
    return rows.every(row=>Object.hasOwn(row,name)) ? {get:index=>rows[index][name]} : null;
  }}};
}
function rotationRow(age,plateId,available=true,q=IDENTITY) {
  return {age,plateId,available,w:available?q[0]:null,x:available?q[1]:null,
    y:available?q[2]:null,z:available?q[3]:null};
}
function deferred() {
  let resolve;const promise=new Promise(value=>{resolve=value;});return {promise,resolve};
}
test('Parquet samples become playable before the stream finishes; incomplete samples stay private',async()=>{
  const first=deferred(),tail=deferred();let calls=0;
  const source={maxAge:20},signal=new AbortController().signal;
  const cache=createRotationCache([1,2],source,async function*(){
    calls++;yield batch([rotationRow(0,1)]);await first.promise;
    yield batch([rotationRow(0,2)]);await tail.promise;
    yield batch([rotationRow(10,1),rotationRow(10,2,false),rotationRow(20,1),rotationRow(20,2)]);
  });
  const history=cache.ensureHistory(0,{signal});
  const ready=cache.waitForTime(0,{signal});
  await new Promise(resolve=>setImmediate(resolve));assert.equal(cache.hasTime(0),false);
  first.resolve();await ready;
  assert.equal(cache.loadedSamples,1);assert.equal(cache.hasTime(-5),false);assert.equal(calls,1);
  const q=new Float64Array(4);
  assert(historicalRotation(cache.rotations,1,0,q,20));
  tail.resolve();await history;
  assert.equal(cache.loadedSamples,3);assert.equal(cache.hasTime(-20),true);
  // Valid stationary blocks are preserved; unavailable source rotations stay absent.
  assert(historicalRotation(cache.rotations,1,10,q,20));
  assert.equal(historicalRotation(cache.rotations,2,10,q,20),false);
});
test('Parquet validation rejects duplicates, truncated histories, and fabricated missing rotations',async()=>{
  const signal=new AbortController().signal;
  for (const [rows,pattern] of [
    [[rotationRow(0,1),rotationRow(0,1)],/Duplicate/],
    [[rotationRow(0,1)],/Incomplete/],
    [[{...rotationRow(0,1,false),w:1}],/null quaternion/],
    [[rotationRow(0,1,true,[2,0,0,0])],/Invalid rotation/],
    [[rotationRow(5,1)],/Unexpected/],
    [[rotationRow(0,999)],/Unexpected/]
  ]) {
    const cache=createRotationCache([1],{maxAge:10},async function*(){yield batch(rows);});
    await assert.rejects(cache.ensureHistory(0,{signal}),pattern);
  }
});
test('cancelled seek waiters keep the source stream alive and background retries preserve complete samples',async()=>{
  const tail=deferred(),signal=new AbortController().signal;let calls=0;
  const cache=createRotationCache([1],{maxAge:20},async function*(){
    calls++;yield batch([rotationRow(0,1)]);
    if (calls===1) {await tail.promise;throw new Error('Interrupted download');}
    yield batch([rotationRow(10,1),rotationRow(20,1)]);
  });
  const history=cache.ensureHistory(0,{signal});
  await cache.waitForTime(0,{signal});const sample=cache.rotations[0];
  const waiter=new AbortController();
  const waiting=cache.waitForTime(-20,{signal:waiter.signal,lifetimeSignal:signal});
  waiter.abort();await assert.rejects(waiting,/abort/i);
  const failure=assert.rejects(history,/Interrupted/);tail.resolve();await failure;
  assert.equal(cache.rotations[0],sample);
  await cache.ensureHistory(0,{signal});assert(cache.hasTime(-20));assert.equal(cache.rotations[0],sample);
});
function polygonBytes(rings) {
  const data=new Uint8Array(9+rings.reduce((length,ring)=>length+4+16*ring.length,0));
  const view=new DataView(data.buffer);view.setUint8(0,1);view.setUint32(1,3,true);
  view.setUint32(5,rings.length,true);let offset=9;
  for (const ring of rings) {
    view.setUint32(offset,ring.length,true);offset+=4;
    for (const [lon,lat] of ring) {view.setFloat64(offset,lon,true);view.setFloat64(offset+8,lat,true);offset+=16;}
  }
  return data;
}
const geometryRow={featureId:'original-fixture',plateId:1,name:'Test polygon',beginAge:Infinity,endAge:0,
  geometry:polygonBytes([[[0,0],[10,0],[10,10],[0,10],[0,0]],[[2,2],[2,4],[4,4],[4,2],[2,2]]])};
test('snapshot WKB keeps holes and binary view offsets and rejects malformed coordinates',()=>{
  const padded=new Uint8Array(geometryRow.geometry.length+4);padded.set(geometryRow.geometry,2);
  const feature=polygonFeature({...geometryRow,geometry:padded.subarray(2,-2)});
  assert.equal(feature.xyz.length,30);assert.deepEqual(feature.holes,[10]);
  near(Math.hypot(...feature.xyz.subarray(0,3)),1);
  assert.throws(()=>polygonFeature({...geometryRow,geometry:geometryRow.geometry.subarray(0,-1)}),/ring|Truncated/);
  assert.throws(()=>polygonFeature({...geometryRow,geometry:polygonBytes([[[0,0],[181,0],[0,10],[0,0]]])}),/coordinate/);
  assert.throws(()=>polygonFeature({...geometryRow,geometry:polygonBytes([[[0,0],[10,0],[0,10],[1,0]]])}),/Unclosed/);
});
const groupIndex=[{rowGroup:0,recordType:'geometry',minAge:null,maxAge:null},
  ...Array.from({length:18},(_,i)=>({rowGroup:i+1,recordType:'rotation',minAge:i*100,maxAge:i===17?1800:i*100+90}))];
test('window selection starts with both interpolation brackets and covers the full history once',()=>{
  assert.deepEqual(rotationGroups(groupIndex,-95,1800).slice(0,2),[1,2]);
  const order=rotationGroups(groupIndex,-930,1800);
  assert.deepEqual(order.slice(0,4),[10,9,8,7]);
  assert.equal(order.length,18);assert.equal(new Set(order).size,18);assert(!order.includes(0));
  assert.equal(rotationGroups(groupIndex,-1800,1800)[0],18);
});
test('Cao loads geometry once and returns a playable model while column-pruned Parquet history continues',async()=>{
  const tail=deferred(),calls=[],source=DATA_SOURCES.CAO2024,signal=new AbortController().signal;
  const manifest={model:source.id,version:source.version,license:'CC-BY-4.0',referenceFrame:source.referenceFrame,
    anchorPlateId:0,quaternionOrder:['w','x','y','z'],ages:{min:0,max:1800,step:10},
    polygonRows:1,plateCount:1,files:[{path:'tectonic.parquet',rowGroupIndex:groupIndex}]};
  const model=await loadModel({sourceId:source.id,time:-930,signal,
    fetchManifest:async url=>{assert.equal(url,source.manifest);return {ok:true,json:async()=>manifest};},
    readBatches:async function*(url,options){
      calls.push({url,options});
      if (options.columns.includes('geometry')) {yield batch([geometryRow]);return;}
      yield batch(Array.from({length:10},(_,i)=>rotationRow(900+i*10,1)));
      await tail.promise;
      yield batch(Array.from({length:181},(_,i)=>i*10).filter(age=>age<900 || age>990).map(age=>rotationRow(age,1)));
    }
  });
  assert(model.hasTime(-930));assert.equal(model.hasTime(-100),false);
  assert.equal(calls.length,2);assert.equal(calls[0].url,calls[1].url);
  assert.deepEqual(calls[0].options.rowGroups,[0]);assert.equal(calls[1].options.rowGroups[0],10);
  assert(!calls[1].options.columns.includes('geometry'));assert(!calls[1].options.columns.includes('name'));
  tail.resolve();await model.ensureHistory(-930,{signal});assert.equal(model.loadedSamples,181);
});

import {readFile} from 'node:fs/promises';
import {createParquetReader} from './parquet-stream.js';
test('published Parquet loader prunes columns and reuses one download for Cao-style geometry/rotation reads',async()=>{
  const data=await readFile(new URL('./test-data/streaming.parquet',import.meta.url));let downloads=0;
  const read=createParquetReader(async(url,{signal})=>{
    signal.throwIfAborted();downloads++;return new Response(data);
  });
  const signal=new AbortController().signal;
  const geometry=[];
  for await(const item of read('https://example.test/original-fixture.parquet',{
    signal,byteLength:data.byteLength,columns:['geometry','plateId'],rowGroups:[0]})) geometry.push(item);
  assert.equal(geometry.length,1);assert(geometry[0].data.getChild('geometry').get(0) instanceof Uint8Array);
  assert.equal(geometry[0].data.getChild('name'),null);
  const rotations=[];
  for await(const item of read('https://example.test/original-fixture.parquet',{
    signal,byteLength:data.byteLength,columns:['age','plateId','available','w','x','y','z'],rowGroups:[1]})) rotations.push(item);
  assert.equal(rotations[0].data.numRows,3);assert.equal(rotations[0].data.getChild('geometry'),null);
  assert.deepEqual(Array.from(rotations[0].data.getChild('age')),[0,10,20]);assert.equal(downloads,1);
  const aborted=new AbortController();aborted.abort();
  await assert.rejects(async()=>{
    for await(const item of read('https://example.test/original-fixture.parquet',{
      signal:aborted.signal,columns:['age'],rowGroups:[1]})) assert.fail('Published after abort');
  },/abort/i);
});


test('TypeScript Parquet decoder streams selected row groups and columns through byte ranges',async()=>{
  const data=await readFile(new URL('./test-data/streaming.parquet',import.meta.url));
  const requests=[];
  const read=createParquetReader(async(url,{signal,headers})=>{
    signal.throwIfAborted();
    const [,start,end]=/^bytes=(\d+)-(\d+)$/.exec(headers.Range).map(Number);
    requests.push([start,end]);
    // Simulate GitHub CORS: Content-Range is not visible to browser JavaScript.
    return new Response(data.subarray(start,end+1),{status:206});
  });
  const signal=new AbortController().signal;
  const rotations=[];
  for await(const item of read('https://example.test/streaming.parquet',{
    signal,byteLength:data.byteLength,columns:['age','plateId'],rowGroups:[1]})) rotations.push(item);
  assert.equal(rotations.length,1);
  assert.deepEqual(Array.from(rotations[0].data.getChild('age')),[0,10,20]);
  assert.equal(rotations[0].data.getChild('geometry'),null);
  assert(requests.every(([start,end])=>end-start+1<data.byteLength));
  assert(requests.reduce((bytes,[start,end])=>bytes+end-start+1,0)<data.byteLength);
  const before=requests.length;
  for await(const item of read('https://example.test/streaming.parquet',{
    signal,byteLength:data.byteLength,columns:['age','plateId'],rowGroups:[1]}))
    assert.equal(item.data.numRows,3);
  assert.equal(requests.length,before,'footer and column ranges are shared');
  const geometry=[];
  for await(const item of read('https://example.test/streaming.parquet',{
    signal,byteLength:data.byteLength,columns:['geometry'],rowGroups:[0]})) geometry.push(item);
  assert.equal(geometry[0].data.numRows,1);
  assert(geometry[0].data.getChild('geometry').get(0) instanceof Uint8Array);
});

test('snapshot byte ranges reject truncated or incorrectly addressed responses',async()=>{
  const data=await readFile(new URL('./test-data/streaming.parquet',import.meta.url));
  for (const wrongHeader of [false,true]) {
    const read=createParquetReader(async()=>new Response(new Uint8Array(wrongHeader?4:3),{
      status:206,headers:wrongHeader?{'Content-Range':`bytes 1-4/${data.byteLength}`}:{}}));
    await assert.rejects(async()=>{
      for await(const batch of read('https://example.test/bad.parquet',{
        signal:new AbortController().signal,byteLength:data.byteLength,columns:['age'],rowGroups:[1]}))
        assert.fail('Invalid range was decoded');
    },/Unexpected snapshot byte range/);
  }
});
