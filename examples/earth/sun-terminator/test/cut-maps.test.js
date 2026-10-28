// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {projectCutMap, unprojectCutMap, buildCutMesh} from '../cut-maps.js';
import {_GlobeView as GlobeView, OrthographicView} from '@deck.gl/core';
import {transferCamera, geographicCenter} from '../camera.js';

test('Albers USA places the contiguous states, Alaska and Hawaii in distinct insets', () => {
  for (const [point, part] of [
    [[-96, 38], 0],
    [[-150, 64], 1],
    [[-157, 21], 2]
  ]) {
    const projected = projectCutMap('albers-usa', ...point);
    assert.equal(projected.part, part);
    const inverse = unprojectCutMap('albers-usa', projected);
    assert.ok(inverse.every((v, i) => Math.abs(v - point[i]) < 1e-8));
    const source = new GlobeView().makeViewport({
      width: 1000,
      height: 800,
      viewState: {longitude: point[0], latitude: point[1], zoom: 3}
    });
    const view = new OrthographicView({flipY: false});
    const {camera, clamped} = transferCamera('globe', source, 'albers-usa', view);
    assert.equal(clamped, false);
    const viewport = view.makeViewport({width: 1000, height: 800, viewState: camera});
    assert.ok(
      geographicCenter('albers-usa', viewport).every((v, i) => Math.abs(v - point[i]) < 1e-8)
    );
  }
});

test('Albers USA mesh has no geographic texture bridges across inset boundaries', () => {
  const mesh = buildCutMesh('albers-usa');
  const seen = new Set();
  for (let i = 0; i < mesh.vertexCount; i += 3) {
    let x = 0,
      y = 0,
      lon = 0,
      lat = 0;
    for (let j = 0; j < 3; j++) {
      x += mesh.positions[(i + j) * 3] / 3;
      y += mesh.positions[(i + j) * 3 + 1] / 3;
      lon += (mesh.texCoords[(i + j) * 2] * 360 - 180) / 3;
      lat += (90 - mesh.texCoords[(i + j) * 2 + 1] * 180) / 3;
    }
    const p = projectCutMap('albers-usa', lon, lat);
    assert.ok(p && Math.hypot(p[0] - x, p[1] - y) < 0.05, 'a triangle must stay within one region');
    seen.add(p.part);
  }
  assert.deepEqual([...seen].sort(), [0, 1, 2]);
});

test('interrupted Mollweide separates both banks of its internal cuts', () => {
  const left = projectCutMap('imoll', -100, 60, -101);
  const right = projectCutMap('imoll', -100, 60, -99);
  assert.ok(Math.abs(left[0] - right[0]) > 20);
  for (const point of [
    [-140, 50],
    [-60, -35],
    [30, 30],
    [130, -40]
  ]) {
    const p = projectCutMap('imoll', ...point);
    const inverse = unprojectCutMap('imoll', p);
    assert.ok(inverse.every((v, i) => Math.abs(v - point[i]) < 0.0001));
  }
});
