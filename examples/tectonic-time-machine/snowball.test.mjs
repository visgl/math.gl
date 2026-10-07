// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import test from 'node:test';
import {snowballCoverage, timelineMilestones} from './timeline.js';

test('ice covers both Cryogenian events but not the intervening warmer interval', () => {
  assert.equal(snowballCoverage(-700), 1);
  assert.equal(snowballCoverage(-640), 1);
  for (const time of [-930, -720, -655, -630, 0, 250, NaN]) assert.equal(snowballCoverage(time), 0);
  assert(snowballCoverage(-716) > 0 && snowballCoverage(-716) < 1);
  assert(snowballCoverage(-636) > 0 && snowballCoverage(-636) < 1);
});
test('chapter markers are ordered and respect the source age limit', () => {
  const chapters = timelineMilestones('atlantic', 1000);
  assert(chapters.some(c => c.name.includes('Sturtian')));
  assert(chapters.some(c => c.name.includes('Marinoan')));
  for (let i = 1; i < chapters.length; i++) assert(chapters[i].time >= chapters[i - 1].time);
  assert(!timelineMilestones('atlantic', 500).some(c => c.name.includes('Snowball')));
});

import {makeMesh, binaryMesh, transformMesh} from './geometry.js';
test('ice latitude follows geographic positions independently of camera tilt', () => {
  const mesh = makeMesh([{positions: [-10, 50, 10, 50, 10, 60, -10, 60, -10, 50], color: [20, 40, 60]}]);
  const ice = Array.from(binaryMesh(mesh).attributes.getIceLatitude.value);
  transformMesh(mesh, {globe: 1}, {}, {}, 0);
  const normals = Array.from(mesh.normals);
  transformMesh(mesh, {globe: 1}, {}, {}, 70);
  assert.notDeepEqual(Array.from(mesh.normals), normals);
  assert.deepEqual(Array.from(binaryMesh(mesh).attributes.getIceLatitude.value), ice);
  for (let i = 0; i < ice.length; i++) assert(Math.abs(ice[i] - Math.sin(mesh.coordinates[i * 2 + 1] * Math.PI / 180)) < 1e-6);
});

test('ocean ice and continent geographic coordinates agree during longitude rotation', () => {
  const positions = [-10, 50, 10, 50, 10, 60, -10, 60, -10, 50];
  const ocean = makeMesh([{positions, color: [20, 40, 60]}]);
  const storage = ocean.geographic;
  const baseline = Array.from(ocean.reference);
  transformMesh(ocean, {globe: 1}, {}, {}, 15, true, 90);
  assert.notDeepEqual(Array.from(ocean.reference), baseline);
  for (let i = 0; i < ocean.reference.length; i += 3) {
    assert(Math.abs(ocean.reference[i] + baseline[i + 1]) < 1e-6);
    assert(Math.abs(ocean.reference[i + 1] - baseline[i]) < 1e-6);
    assert.equal(ocean.reference[i + 2], baseline[i + 2]);
  }
  assert.deepEqual(ocean.reference, ocean.geographic);
  const turned = Array.from(ocean.geographic);
  transformMesh(ocean, {globe: 1}, {}, {}, 70, true, 90);
  assert.strictEqual(ocean.geographic, storage);
  assert.deepEqual(Array.from(ocean.geographic), turned);
  transformMesh(ocean, {globe: 1}, {}, {}, 70, true, 0);
  assert.deepEqual(Array.from(ocean.reference), baseline);

  // A camera-centered land mesh restores true longitude before computing its ice edge.
  const land = makeMesh([{positions, longitude: 90, color: [20, 40, 60]}]);
  for (let i = 0; i < land.geographic.length; i += 3) {
    assert(Math.abs(land.geographic[i] + baseline[i + 1]) < 1e-6);
    assert(Math.abs(land.geographic[i + 1] - baseline[i]) < 1e-6);
    assert.equal(land.geographic[i + 2], baseline[i + 2]);
  }
});

test('land relief retains plate coordinates while the ice edge uses reconstructed coordinates', () => {
  const positions = [80, 50, 100, 50, 100, 60, 80, 60, 80, 50];
  const q = [Math.SQRT1_2, 0, 0, Math.SQRT1_2];
  const land = makeMesh([{positions, rotation: q, color: [20, 40, 60]}]);
  for (let i = 0; i < land.reference.length; i += 3) {
    assert(Math.abs(land.reference[i] - land.geographic[i + 1]) < 1e-6);
    assert(Math.abs(land.reference[i + 1] + land.geographic[i]) < 1e-6);
    assert.equal(land.reference[i + 2], land.geographic[i + 2]);
  }
  const before = Array.from(land.reference);
  transformMesh(land, {eqc: 1}, {eqc: {projectFlatSync() {}}}, {eqc: 1}, 70);
  assert.deepEqual(Array.from(land.reference), before);
});

import {glaciationPlaybackSpeed} from './timeline.js';
test('playback slows before both ice edges and resumes within events and the warmer interval', () => {
  for (const time of [-719, -716, -664, -659, -652, -649, -638, -634])
    assert.equal(glaciationPlaybackSpeed(time, 40), 0.75);
  for (const time of [-930, -700, -655, -640, -600, 0])
    assert.equal(glaciationPlaybackSpeed(time, 20), 20);
  assert.equal(glaciationPlaybackSpeed(-716, 20, false), 20);
  assert.equal(glaciationPlaybackSpeed(-716, 0.5), 0.5);
});
