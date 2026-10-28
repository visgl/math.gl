// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createMorphMesh, getMorphProgress, createEndpoint} from '../morph.js';
import {interruptedPoint} from '../cuts.js';
import {cutPart} from '../cut-maps.js';
import {MapView} from '@deck.gl/core';

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

test('queued animation timestamps never extrapolate beyond either morph endpoint', () => {
  assert.equal(getMorphProgress(-1000), 0);
  assert.equal(getMorphProgress(-100), 0);
  assert.equal(getMorphProgress(0), 0);
  assert.equal(getMorphProgress(1500), 1);
  assert.equal(getMorphProgress(2000), 1);
  let previous = 0;
  for (let elapsed = -300; elapsed <= 1800; elapsed += 10) {
    const progress = getMorphProgress(elapsed);
    assert.ok(progress >= previous && progress >= 0 && progress <= 1);
    previous = progress;
  }
});

test('map morph endpoints include antimeridian imagery and repeated visible worlds', () => {
  const make = zoom =>
    new MapView().makeViewport({
      width: 1000,
      height: 800,
      viewState: {longitude: 170, latitude: 0, zoom}
    });
  const endpoint = createEndpoint('map', make(3));
  const a = endpoint(179, 0, 179),
    b = endpoint(-179, 0, -179);
  assert.ok(
    Math.abs(a.position[0] - b.position[0]) < 30,
    'both banks must meet in the visible wrapped world'
  );
  assert.equal(b.cutPosition[0], 181);
  assert.equal(a.part, b.part, 'the visible world stays one rigid piece across the antimeridian');
  const leftBank = endpoint(-10, 0, -9),
    rightBank = endpoint(-10, 0, -11);
  assert.notEqual(leftBank.seam, rightBank.seam);
  assert.ok(Math.abs(rightBank.position[0] - leftBank.position[0] - endpoint.worldWidth) < 1e-6);
  const overview = createEndpoint('map', make(0));
  assert.ok(overview.wrapCopies.includes(-1) && overview.wrapCopies.includes(1));
  const mesh = createMorphMesh(overview, overview, {maxDepth: 0});
  let left = Infinity,
    right = -Infinity;
  for (let i = 0; i < mesh.positions.length; i += 3) {
    left = Math.min(left, mesh.positions[i]);
    right = Math.max(right, mesh.positions[i]);
  }
  assert.ok(left < -500 && right > 500, 'repeated imagery must cover the entire viewport');
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const xs = [0, 1, 2].map(j => mesh.positions[mesh.indices[i + j] * 3]);
    assert.ok(Math.max(...xs) - Math.min(...xs) < 30, 'no triangle may span the wrap cut');
  }
});
