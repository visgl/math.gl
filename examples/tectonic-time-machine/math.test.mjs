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
  const table = {0: {701: IDENTITY}, 10: {701: ten}, 20: {701: IDENTITY}};
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
    const mesh = makeMesh([{
      positions: [88 - longitude, -2, 92 - longitude, -2, 92 - longitude, 2, 88 - longitude, 2, 88 - longitude, -2],
      color: [10, 20, 30], rotation, longitude
    }]);
    assert(mesh.indices.length);
    for (let i = 0, j = 0; i < mesh.coordinates.length; i += 2, j += 3) {
      const expected = unitVector(mesh.coordinates[i] + longitude - 90, mesh.coordinates[i + 1]);
      for (let k = 0; k < 3; k++) near(mesh.reference[j + k], expected[k], 1e-6);
    }
    transformMesh(mesh, {globe: 1}, {}, {}, 37);
    for (let j = 0; j < mesh.normals.length; j += 3) near(Math.hypot(...mesh.normals.subarray(j, j + 3)), 1, 1e-6);
  }
});


test('hover labels recover globe and map coordinates and reject points outside the surface', () => {
  const out = new Float64Array(2);
  assert(worldToGeographic(0, 0, 'globe', null, null, 37, 120, out));
  near(out[0], 120); near(out[1], 37);
  assert(worldToGeographic(1, 0, 'globe', null, null, 0, 120, out));
  near(out[0], -150); near(out[1], 0);
  assert(!worldToGeographic(1.1, 0, 'globe', null, null, 0, 0, out));
  const engine = {unprojectFlatSync(p) {return p;}, projectFlatSync(p) {return p;}};
  assert(worldToGeographic(40, -20, 'eqc', engine, 2, 0, -30, out));
  near(out[0], -10); near(out[1], -10);
  assert(!worldToGeographic(362, 0, 'eqc', engine, 2, 0, 0, out));
  assert(!worldToGeographic(0, 172, 'merc', engine, 2, 0, 0, out));
});


test('Equal Earth hover outside its outline returns no coordinate instead of a runtime error', async () => {
  const {ProjectionEngine, equalEarth} = await import('@math.gl/projection');
  const radius = 6371008.8;
  const engine = new ProjectionEngine({
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
  near(out[0], 42, 1e-7); near(out[1], 25, 1e-7);
  assert.equal(worldToGeographic(NaN, 0, 'eqearth', engine, 1, 0, 0, out), false);
  const broken = {unprojectFlatSync() {throw new Error('Plugin not loaded');}};
  assert.throws(() => worldToGeographic(0, 0, 'eqearth', broken, 1, 0, 0, out), /Plugin not loaded/);
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
  near(chapterOpacity(LANDMASS_CHAPTERS.find(c => c.scenario === 'atlantic'), 250, 'polar'), 0);
  near(chapterOpacity(LANDMASS_CHAPTERS.find(c => c.scenario === 'polar'), 250, 'atlantic'), 0);
  assert.equal(timelineMilestones('atlantic').at(-1).name, 'Atlantic assembly');
  assert.equal(timelineMilestones('polar').at(-1).name, 'Polar assembly');
  for (let time = -500; time <= 300; time++) {
    assert(LANDMASS_CHAPTERS.filter(c => chapterOpacity(c, time, 'atlantic') > 0).length <= 1);
  }
});


import {DATA_SOURCES, rotationBracket, rotationWindow, clampTime, sourceFor} from './sources.js';
import {createRotationCache} from './data.js';
import {readZipEntry, modelXML} from './archive.js';
import {gzipSync, deflateRawSync} from 'node:zlib';
import {createHash} from 'node:crypto';
test('source ranges include Rodinia and restrict Nuna to the 1.8 Ga source', () => {
  assert.equal(sourceFor('CAO2024').license, 'CC-BY-4.0');
  assert.throws(() => sourceFor('unknown'), /Unknown/);
  assert.throws(() => sourceFor('toString'), /Unknown/);
  assert.deepEqual(rotationBracket(-1800, 1800), [1800, 1800]);
  assert.deepEqual(rotationBracket(-1000, 1000), [1000, 1000]);
  assert.deepEqual(rotationBracket(-929.5, 1800), [920, 930]);
  assert.deepEqual(rotationBracket(250, 1800), [0, 0]);
  assert.throws(() => rotationBracket(-1001, 1000), /range/);
  assert.equal(clampTime(-1600, 1000), -1000);
  assert.equal(rotationWindow(-1800, 1800).at(-1), 1800);
  assert.equal(rotationWindow(-930, 1800).length, 21);
  assert.equal(rotationWindow(-1600, 1800)[0], 1400);
  assert.equal(rotationWindow(-1600, 1800).at(-1), 1600);
  assert.equal(rotationWindow(0, 1800)[0], 0);
  assert.deepEqual(rotationBracket(-1600, 1800), [1600, 1600]);
  assert.deepEqual(rotationBracket(-1599.5, 1800), [1590, 1600]);
  assert(timelineMilestones('atlantic', 1800).some(c => c.name === 'Nuna'));
  assert(!timelineMilestones('atlantic', 1000).some(c => c.name === 'Nuna'));
  assert(timelineMilestones('atlantic', 1000).some(c => c.name === 'Rodinia'));
});
test('rotation windows publish all plate rows together, reuse cached samples, and recover from failures', async () => {
  const source = DATA_SOURCES.CAO2024, ids = Array.from({length: 257}, (_, i) => 500 + i);
  let fail = true, calls = 0;
  const cache = createRotationCache(ids, source, async function* (url, signal) {
    calls++;
    assert.equal(url.searchParams.get('model'), 'CAO2024');
    const pids = url.searchParams.get('pids').split(','), times = url.searchParams.get('times').split(',');
    assert(pids.length <= 256); assert(times.length <= 21);
    assert.equal(cache.hasTime(-930), false);
    if (fail && pids.length === 1) throw new Error('Service unavailable');
    signal.throwIfAborted();
    yield* parseRotationBatches([bytes(Object.fromEntries(times.map(t => [t, Object.fromEntries(pids.map(pid => [pid, IDENTITY]))])))]);
  });
  const signal = new AbortController().signal;
  await assert.rejects(cache.ensureTime(-930, {signal}), /Service unavailable/);
  assert.equal(cache.hasTime(-930), false);
  assert.deepEqual(cache.rotations, {});
  fail = false;
  await cache.ensureTime(-930, {signal});
  assert(cache.hasTime(-930));
  assert.equal(cache.rotations['930'].values.length, 257 * 4);
  assert.equal(cache.rotations['930'].indices.size, 257);
  const previousCalls = calls;
  await cache.ensureTime(-950, {signal});
  assert.equal(calls, previousCalls);
  assert.equal(cache.hasTime(-1600), false);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(cache.ensureTime(-1600, {signal: controller.signal}), /abort/i);
  assert.equal(cache.hasTime(-1600), false);
  const boundary = createRotationCache([701], source, async function* (url) {
    const times = url.searchParams.get('times').split(',');
    yield* parseRotationBatches([bytes(Object.fromEntries(times.map(t => [t, {701: IDENTITY}])))]);
  });
  await boundary.ensureTime(-1600, {signal});
  assert(boundary.hasTime(-1600));
  assert(boundary.hasTime(-1599.5));
});
test('historical interpolation reaches deep-time endpoints without the previous 500 Ma clamp', () => {
  const q = new Float64Array(4), pole = [Math.SQRT1_2, 0, 0, Math.SQRT1_2];
  const table = {1790: {701: pole}, 1800: {701: pole}};
  assert(historicalRotation(table, 701, 1795, q, 1800));
  assert(historicalRotation(table, 701, 1800, q, 1800));
  near(q[0], pole[0]);
  assert(historicalRotation({1600: {701: pole}}, 701, 1600, q, 1800));
  assert(historicalRotation({0: {701: IDENTITY}}, 701, 0, q, 1800));
});
function zipFixture(name, data, method = 0) {
  const file = Buffer.from(name), payload = method === 8 ? deflateRawSync(data) : data;
  const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50); local.writeUInt16LE(method, 8);
  local.writeUInt32LE(payload.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(file.length, 26);
  const central = Buffer.alloc(46); central.writeUInt32LE(0x02014b50); central.writeUInt16LE(method, 10);
  central.writeUInt32LE(payload.length, 20); central.writeUInt32LE(data.length, 24); central.writeUInt16LE(file.length, 28);
  const footer = Buffer.alloc(22); footer.writeUInt32LE(0x06054b50); footer.writeUInt16LE(1, 8); footer.writeUInt16LE(1, 10);
  footer.writeUInt32LE(central.length + file.length, 12); footer.writeUInt32LE(local.length + file.length + payload.length, 16);
  return Uint8Array.from(Buffer.concat([local, file, payload, central, file, footer])).buffer;
}
test('model archive reads only the named geometry and rejects changed revisions or malformed files', async () => {
  const name = 'ContinentalPolygons/shapes_continents.gpmlz', xml = '<original-test-geometry/>', data = gzipSync(xml);
  for (const method of [0, 8]) {
    const buffer = zipFixture(name, data, method);
    assert.deepEqual(Buffer.from(await readZipEntry(buffer, name)), data);
    const sha256 = createHash('sha256').update(new Uint8Array(buffer)).digest('hex');
    assert.equal(await modelXML(buffer, {archiveEntry: name, sha256}), xml);
    await assert.rejects(modelXML(buffer, {archiveEntry: name, sha256: 'wrong'}), /checksum/);
    await assert.rejects(readZipEntry(buffer, 'missing'), /Missing/);
  }
  await assert.rejects(readZipEntry(new ArrayBuffer(4), name), /Invalid/);
  const corrupt = zipFixture(name, data); new DataView(corrupt).setUint32(0, 0);
  await assert.rejects(readZipEntry(corrupt, name), /Invalid/);
});

import {isMobile, shouldPreloadHistory, nextRotationTime} from './sources.js';
import {parseRotationRows, parseRotationBatches, responseChunks, ROTATION_SCHEMA} from './rotation-stream.js';
const bytes = value => new TextEncoder().encode(JSON.stringify(value));
async function collect(iterable) {const result = []; for await (const item of iterable) result.push(item); return result;}
test('desktop streams all history; mobile and save-data clients keep a smaller buffer', () => {
  assert.equal(isMobile(undefined), false);
  assert.equal(shouldPreloadHistory({userAgent: 'Desktop', deviceMemory: 8}), true);
  for (const device of [
    {userAgentData: {mobile: true}}, {userAgent: 'Android'}, {userAgent: 'iPhone'},
    {platform: 'MacIntel', maxTouchPoints: 5}, {connection: {saveData: true}}
  ]) assert.equal(shouldPreloadHistory(device), false);
  assert.equal(shouldPreloadHistory({userAgent: 'Desktop', deviceMemory: 2}), true);
  assert.equal(isMobile({userAgent: 'Macintosh', platform: 'MacIntel', maxTouchPoints: 0}), false);
  assert.equal(nextRotationTime(-930, 1800), -790);
  assert.equal(nextRotationTime(-1800, 1800), -1590);
  assert.equal(nextRotationTime(-200, 1800), null);
  assert.equal(nextRotationTime(250, 1800), null);
});
test('JSON-to-Arrow uses a fixed projected schema and drops unneeded columns in every batch', async () => {
  const rows = Array.from({length: 9}, (_, i) => ({age: i * 10, plateId: 701, w: 1, x: 0, y: 0, z: 0,
    unused: {description: 'not retained', values: [1, 2, 3]}}));
  const batches = await collect(parseRotationRows([bytes(rows)], 4));
  assert.deepEqual(batches.map(b => b.data.numRows), [4, 4, 1]);
  for (const batch of batches) {
    assert.deepEqual(batch.data.schema.fields.map(f => f.name), ROTATION_SCHEMA.fields.map(f => f.name));
    assert.equal(batch.data.getChild('unused'), null);
  }
  const broken = {...rows[0]}; delete broken.x;
  await assert.rejects(collect(parseRotationRows([bytes([broken])])), /missing field/);
});
test('keyed rotation JSON survives tiny byte chunks and rejects malformed quaternions or truncation', async () => {
  const payload = bytes({'0.0': {701: [1, 0, 0, 0]}, '10.0': {701: [0, 0, 0, 1]}});
  const batches = await collect(parseRotationBatches(Array.from(payload, b => Uint8Array.of(b)), 1));
  assert.deepEqual(batches.map(b => b.data.getChild('age').get(0)), [0, 10]);
  assert.equal(batches[1].data.getChild('z').get(0), 1);
  for (const bad of [[], {0: {701: [1, 0, 0]}}, {0: {701: [1, 0, 0, 0, 0]}},
    {0: {701: [[1], 0, 0, 0]}}, {0: {701: [1, null, 0, 0]}}, {0: {701: {w: 1}}}])
    await assert.rejects(collect(parseRotationBatches([bytes(bad)])));
  await assert.rejects(collect(parseRotationBatches([payload.subarray(0, payload.length - 1)])), /Unexpected end/);
});
const pole = [Math.SQRT1_2, 0, 0, Math.SQRT1_2];
function serviceRows(url) {
  const pids = url.searchParams.get('pids').split(','), times = url.searchParams.get('times').split(',');
  return Object.fromEntries(times.map(t => [t, Object.fromEntries(pids.map(pid => [pid, pole]))]));
}
test('streamed samples unlock playback before the response finishes and interpolation reads packed arrays', async () => {
  let finish; const gate = new Promise(resolve => {finish = resolve;});
  const cache = createRotationCache([701, 702], DATA_SOURCES.CAO2024, async function* (url) {
    const rowBatches = await collect(parseRotationBatches([bytes(serviceRows(url))], 2));
    const first = rowBatches.find(b => b.data.getChild('age').get(0) === 800) || rowBatches[0];
    yield first;
    await gate;
    yield* rowBatches.filter(b => b !== first);
  });
  const signal = new AbortController().signal;
  const waiting = cache.waitForTime(-800, {signal});
  await waiting;
  assert(cache.hasTime(-800));
  assert.equal(cache.hasTime(-810), false);
  const out = new Float64Array(4);
  assert(historicalRotation(cache.rotations, 702, 800, out, 1800));
  near(out[0], pole[0]); near(out[3], pole[3]);
  assert.equal(historicalRotation(cache.rotations, 999, 800, out, 1800), false);
  finish();
  await cache.ensureTime(-805, {signal});
  assert(historicalRotation(cache.rotations, 702, 805, out, 1800));
});
test('full-history streaming deduplicates requests, covers both endpoints, and lets foreground seeks run between windows', async () => {
  const calls = []; let release; const gate = new Promise(resolve => {release = resolve;});
  const cache = createRotationCache([701], DATA_SOURCES.CAO2024, async function* (url) {
    calls.push(url.searchParams.get('times').split(',').map(Number));
    if (calls.length === 1) await gate;
    yield* parseRotationBatches([bytes(serviceRows(url))]);
  });
  const signal = new AbortController().signal;
  await cache.ensurePose(-930, {signal: new AbortController().signal, onStatus: () => {release();}});
  calls.length = 0;
  const loading = cache.ensureHistory(-930, {signal});
  assert.equal(cache.ensureHistory(-930, {signal}), loading);
  const seeking = cache.ensureTime(-1700, {signal});
  await seeking;
  assert(calls[1].includes(1700));
  await loading;
  for (let age = 0; age <= 1800; age += 10) assert(cache.hasTime(-age));
  const count = calls.length;
  await cache.ensureHistory(-930, {signal});
  assert.equal(calls.length, count);
});
test('stream failures preserve complete samples, reject missing rows, and allow retry', async () => {
  let fail = true;
  const cache = createRotationCache([701], DATA_SOURCES.CAO2024, async function* (url) {
    const raw = serviceRows(url);
    if (fail) delete raw['810'];
    yield* parseRotationBatches([bytes(raw)]);
  });
  const signal = new AbortController().signal;
  await assert.rejects(cache.ensureTime(-850, {signal}), /Missing rotations/);
  assert(cache.hasTime(-800)); assert.equal(cache.hasTime(-805), false);
  fail = false;
  await cache.ensureTime(-805, {signal}); assert(cache.hasTime(-805));
  const duplicate = createRotationCache([701], DATA_SOURCES.CAO2024, async function* () {
    yield* parseRotationRows([bytes([{age: 800, plateId: 701, w: 1, x: 0, y: 0, z: 0},
      {age: 800, plateId: 701, w: 1, x: 0, y: 0, z: 0}])]);
  });
  await assert.rejects(duplicate.ensureTime(-850, {signal}), /duplicate/);
});
test('source cancellation releases the stream reader and does not publish a partial plate set', async () => {
  let cancelled = false;
  const controller = new AbortController();
  const stream = new ReadableStream({cancel() {cancelled = true;}});
  const iterator = responseChunks(stream, controller.signal)[Symbol.asyncIterator]();
  const waiting = iterator.next();
  controller.abort();
  await assert.rejects(waiting, /abort/i);
  assert(cancelled); assert.equal(stream.locked, false);
  const cache = createRotationCache([701, 702], DATA_SOURCES.CAO2024, async function* () {
    yield* parseRotationBatches([bytes({800: {701: pole}})]);
  });
  await assert.rejects(cache.ensureTime(-850, {signal: new AbortController().signal}), /Missing rotations/);
  assert.equal(cache.hasTime(-800), false);
});

test('production cache rejects non-unit rotations and streams missing finite numbers as errors', async () => {
  for (const quaternion of [[2, 0, 0, 0], [1, 0, null, 0]]) {
    const cache = createRotationCache([701], DATA_SOURCES.CAO2024, async function* () {
      yield* parseRotationBatches([bytes({800: {701: quaternion}})]);
    });
    await assert.rejects(cache.ensurePose(-800, {signal: new AbortController().signal}));
    assert.equal(cache.hasTime(-800), false);
  }
  await assert.rejects(collect(parseRotationBatches([new TextEncoder().encode('{"800":{"701":[1e400,0,0,0]}}')])), /Invalid quaternion/);
});
test('mobile prefetch follows a window change during a download without waiting for a miss', async () => {
  let release; const gate = new Promise(resolve => {release = resolve;});
  const calls = [];
  const cache = createRotationCache([701], DATA_SOURCES.CAO2024, async function* (url) {
    calls.push(url.searchParams.get('times').split(',').map(Number));
    if (calls.length === 1) await gate;
    yield* parseRotationBatches([bytes(serviceRows(url))]);
  });
  const signal = new AbortController().signal;
  const first = cache.prefetchTime(-930, {signal});
  assert.equal(cache.prefetchTime(-790, {signal}), first);
  release();
  await first;
  assert(cache.hasTime(-430));
  assert.equal(calls.length, 3);
});
test('cancelling a foreground seek waiter preserves the useful source-lifetime stream', async () => {
  let release; const gate = new Promise(resolve => {release = resolve;});
  const cache = createRotationCache([701], DATA_SOURCES.CAO2024, async function* (url, signal) {
    await gate;
    signal.throwIfAborted();
    yield* parseRotationBatches([bytes(serviceRows(url))]);
  });
  const source = new AbortController(), seeker = new AbortController();
  const waiting = cache.waitForTime(-805, {signal: seeker.signal, lifetimeSignal: source.signal});
  seeker.abort();
  await assert.rejects(waiting, /abort/i);
  release();
  await cache.ensureTime(-805, {signal: source.signal});
  assert(cache.hasTime(-805));
});

import {rotationPlaybackBuffer} from './sources.js';
import {maintainHistory, waitForRetry} from './history-stream.js';
test('startup prepares a bounded forward buffer including the first interpolation interval', async () => {
  const cache = createRotationCache([701], DATA_SOURCES.CAO2024, async function* (url) {
    const times = url.searchParams.get('times').split(',').map(Number);
    assert(times.length <= 12);
    yield* parseRotationBatches([bytes(serviceRows(url))]);
  });
  const signal = new AbortController().signal;
  await cache.ensurePlayback(-930, {signal});
  assert(cache.hasTime(-930));
  assert(cache.hasTime(-929.99));
  assert(cache.hasTime(-830));
  assert.equal(cache.hasTime(-829.99), false);
  assert.equal(cache.loadedSamples, 11);
  const out = new Float64Array(4);
  assert(historicalRotation(cache.rotations, 701, 929.99, out, 1800));
  near(out[0], pole[0]);
  assert.deepEqual(rotationPlaybackBuffer(-1800, 1800).slice(-2), [1790, 1800]);
  assert.deepEqual(rotationPlaybackBuffer(250, 1800), [0]);
  assert.deepEqual(rotationPlaybackBuffer(-5, 1800), [0, 10]);
});
test('foreground poses complete while an unrelated background window is still blocked', {timeout: 2000}, async t => {
  let release, started;
  const gate = new Promise(resolve => {release = resolve;}), active = new Promise(resolve => {started = resolve;});
  const calls = [];
  const cache = createRotationCache([701], DATA_SOURCES.CAO2024, async function* (url) {
    const times = url.searchParams.get('times').split(',').map(Number);
    calls.push(times);
    if (times.length > 2) {started(); await gate;}
    yield* parseRotationBatches([bytes(serviceRows(url))]);
  });
  const signal = new AbortController().signal;
  const loading = cache.ensureTime(-930, {signal});
  t.after(async () => {release(); await loading;});
  await active;
  await cache.waitForTime(-1705, {signal});
  assert(cache.hasTime(-1705));
  assert.equal(cache.hasTime(-930), false);
  assert.deepEqual(calls[1], [1700, 1710]);
  await cache.waitForTime(-930, {signal});
  const foregroundSample = cache.rotations['930'];
  release(); await loading;
  assert.equal(cache.rotations['930'], foregroundSample);
});
test('identical foreground poses share one request and distant seeks replace obsolete foreground work', async () => {
  let entered; const started = new Promise(resolve => {entered = resolve;});
  let calls = 0;
  const cache = createRotationCache([701], DATA_SOURCES.CAO2024, async function* (url, signal) {
    calls++;
    if (calls === 1) {
      entered();
      await new Promise(resolve => signal.addEventListener('abort', resolve, {once: true}));
      signal.throwIfAborted();
    }
    yield* parseRotationBatches([bytes(serviceRows(url))]);
  });
  const signal = new AbortController().signal;
  const first = cache.waitForTime(-930, {signal});
  const rejected = assert.rejects(first, /Superseded seek/);
  await started;
  const second = cache.waitForTime(-1705, {signal});
  const duplicate = cache.waitForTime(-1705, {signal});
  await Promise.all([rejected, second, duplicate]);
  assert.equal(calls, 2);
  assert(cache.hasTime(-1705));
});
test('idle desktop preload reports interruptions and retries remaining history at the latest time', async () => {
  let current = -930, loaded = 11;
  const requests = [], statuses = [];
  const model = {
    get loadedSamples() {return loaded;}, totalSamples: 181,
    async ensureHistory(time, {onStatus}) {
      requests.push(time);
      onStatus();
      if (requests.length === 1) throw new Error('Service unavailable');
      loaded = 181;
    }
  };
  await maintainHistory(model, () => current, {
    signal: new AbortController().signal, onStatus: value => statuses.push(value),
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
  const model = {loadedSamples: 11, totalSamples: 181, async ensureHistory() {
    attempts++; throw new Error('Service unavailable');
  }};
  const running = maintainHistory(model, () => -930, {
    signal: controller.signal, onStatus: value => statuses.push(value)
  });
  const rejection = assert.rejects(running, /abort/i);
  await new Promise(resolve => setImmediate(resolve));
  assert(statuses.at(-1).includes('retrying in 30s'));
  controller.abort();
  await rejection;
  assert.equal(attempts, 1);
  await waitForRetry(0, new AbortController().signal);
});
