// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createMorphMesh} from '../morph.js';
import {interruptedPoint} from '../cuts.js';
import {cutPart} from '../cut-maps.js';

test('morph retains geographic texture coordinates and uploads both endpoints once', () => {
  const mesh = createMorphMesh(
    (x, y) => ({position: [x, y, 10], inside: true}),
    (x, y, sector) => ({
      position: interruptedPoint(x, y, sector),
      part: cutPart('isinu', x, y, sector),
      inside: true
    })
  );
  assert.ok(mesh.vertexCount > 90000);
  assert.ok(
    mesh.positions.length / 3 < mesh.vertexCount / 2,
    'continuous vertices should be shared'
  );
  assert.equal(mesh.positions.length, mesh.destination.length);
  assert.equal(mesh.texCoords.length, (mesh.positions.length / 3) * 2);
  assert.ok(mesh.lifetime.every(v => v === 1));
  for (let i = 0; i < mesh.positions.length / 3; i++) {
    assert.ok(Math.abs(mesh.positions[i * 3] - (mesh.texCoords[i * 2] * 360 - 180)) < 0.0001);
    assert.equal(mesh.positions[i * 3 + 2], 10);
    assert.equal(mesh.destination[i * 3 + 2], 0);
  }
});

test('zoomed curvature gets finer triangles than the same shape at overview scale', () => {
  const endpoint = scale => (x, y) => ({
    position: [x * scale, (y + Math.sin(x / 20)) * scale, 0],
    inside: true
  });
  const coarse = createMorphMesh(endpoint(1), endpoint(1));
  const fine = createMorphMesh(endpoint(20), endpoint(20));
  assert.ok(fine.vertexCount > coarse.vertexCount * 1.1);
});

test('out-of-domain patches keep their shape and retire instead of stretching to points', () => {
  const mesh = createMorphMesh(
    (x, y) => ({position: [x, y, 0], inside: true}),
    () => null
  );
  assert.ok(mesh.lifetime.some((v, i) => i % 2 === 1 && v === 0));
  assert.ok(mesh.positions.every((v, i) => v === mesh.destination[i]));
});

test('both banks of an internal cut share a globe location but separate on the map', () => {
  const mesh = createMorphMesh(
    (x, y) => ({position: [x, y, 1], inside: true}),
    (x, y, sector) => ({
      position: interruptedPoint(x, y, sector),
      part: cutPart('isinu', x, y, sector),
      inside: true
    })
  );
  const points = [];
  for (let i = 0; i < mesh.positions.length / 3; i++) {
    if (
      Math.abs(mesh.texCoords[i * 2] - 80 / 360) < 1e-6 &&
      Math.abs(mesh.texCoords[i * 2 + 1] - 1 / 6) < 1e-6
    ) {
      points.push(mesh.destination[i * 3]);
    }
  }
  assert.ok(Math.max(...points) - Math.min(...points) > 30);
});

test('invalid domains and seams never produce nonfinite coordinates', () => {
  const mesh = createMorphMesh(
    (x, y) => ({position: [x, y, 0], inside: true}),
    (x, y) => (x > 0 ? null : {position: [x, y, 0], inside: y > 0})
  );
  assert.ok(mesh.positions.every(Number.isFinite));
  assert.ok(mesh.destination.every(Number.isFinite));
});
