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

test('runtime rotation decoder rejects incomplete or invalid scientific data', async () => {
  const {validateRotations} = await import('./data.js');
  const raw = Object.fromEntries(
    Array.from({length: 51}, (_, i) => [`${i * 10}.0`, {701: [1, 0, 0, 0]}])
  );
  assert.equal(Object.keys(validateRotations(raw, [701])).length, 51);
  assert.throws(() => validateRotations({...raw, '500.0': undefined}, [701]));
  assert.throws(() => validateRotations({...raw, '10.0': {701: [2, 0, 0, 0]}}, [701]));
  assert.throws(() => validateRotations({...raw, '10.0': {701: [NaN, 0, 0, 0]}}, [701]));
  assert.throws(() => validateRotations(raw, [999]));
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
  near(chapterOpacity(LANDMASS_CHAPTERS[4], 250, 'polar'), 0);
  near(chapterOpacity(LANDMASS_CHAPTERS[5], 250, 'atlantic'), 0);
  assert.equal(timelineMilestones('atlantic').at(-1).name, 'Atlantic assembly');
  assert.equal(timelineMilestones('polar').at(-1).name, 'Polar assembly');
  for (let time = -500; time <= 300; time++) {
    assert(LANDMASS_CHAPTERS.filter(c => chapterOpacity(c, time, 'atlantic') > 0).length <= 1);
  }
});
