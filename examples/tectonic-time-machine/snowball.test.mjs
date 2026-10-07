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
