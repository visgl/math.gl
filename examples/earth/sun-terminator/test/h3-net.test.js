// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {latLngToCell, getIcosahedronFaces} from 'h3-js';
import centers from '../assets/h3-face-centers.json' with {type: 'json'};
import {H3_FACES, h3Face, projectH3, unprojectH3, buildH3Mesh} from '../h3-net.js';
import {getH3GridPaths} from '../h3-grid.js';
import {getCutViewports} from '../cut-maps.js';
import {OrthographicView} from '@deck.gl/core';
test('unfolding uses the actual H3 face orientations', () => {
  assert.equal(H3_FACES.length, 20);
  centers.forEach(([lat, lon], index) => {
    const latitude = (lat * 180) / Math.PI,
      longitude = (lon * 180) / Math.PI;
    assert.equal(h3Face(longitude, latitude), index);
    assert.ok(getIcosahedronFaces(latLngToCell(latitude, longitude, 3)).includes(index));
    assert.equal(H3_FACES[index].neighbors.length, 3);
  });
});
test('geographic positions round-trip through the net without face ambiguity', () => {
  for (let lat = -80; lat <= 80; lat += 20)
    for (let lon = -175; lon < 180; lon += 20) {
      const p = projectH3(lon, lat),
        q = unprojectH3(p);
      assert.ok(Math.abs(q[0] - lon) < 1e-7 && Math.abs(q[1] - lat) < 1e-7);
    }
});
test('net contains twenty distinct triangular pieces and produces per-face sampling viewports', () => {
  const viewport = new OrthographicView({flipY: false}).makeViewport({
    width: 1100,
    height: 800,
    viewState: {target: [0, 0, 0], zoom: 1.5}
  });
  const views = getCutViewports('h3', viewport);
  assert.equal(views.length, 20);
  assert.equal(new Set(views.map(v => v.id)).size, 20);
  for (const face of H3_FACES) {
    const centroid = [0, 1].map(i => face.flat.reduce((sum, p) => sum + p[i], 0) / 3);
    const geo = unprojectH3(centroid);
    assert.equal(h3Face(...geo), face.index);
  }
  const mesh = buildH3Mesh();
  assert.ok(mesh.vertexCount > 10000 && mesh.positions.every(Number.isFinite));
});
test('H3 base-cell outlines split at every face cut', () => {
  const paths = getH3GridPaths();
  assert.ok(paths.length > 100);
  assert.ok(paths.every(path => path.every(p => p.part === path[0].part)));
});
