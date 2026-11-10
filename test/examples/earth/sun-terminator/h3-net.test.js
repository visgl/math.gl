// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {latLngToCell, getIcosahedronFaces} from 'h3-js';
import {MapEngine} from '@math.gl/geospatial/projection';
import centers from '../../../../examples/earth/sun-terminator/assets/h3-face-centers.json' with {
  type: 'json'
};
import {getH3GridPaths} from '../../../../examples/earth/sun-terminator/src/h3-grid.ts';
import {getCutViewports} from '../../../../examples/earth/sun-terminator/src/view-adapter.ts';
import {OrthographicView} from '@deck.gl/core';
const map = new MapEngine({version: 1, id: 'h3', radius: 63.78137, definition: {type: 'h3'}});

test('shared H3 map uses the actual H3 face orientations', () => {
  assert.equal(map.regions.length, 20);
  centers.forEach(([lat, lon], index) => {
    const latitude = (lat * 180) / Math.PI,
      longitude = (lon * 180) / Math.PI;
    assert.equal(map.projectPoint([longitude, latitude]).regionId, 'face-' + index);
    assert.ok(getIcosahedronFaces(latLngToCell(latitude, longitude, 3)).includes(index));
  });
});
test('geographic positions round-trip through the shared net without face ambiguity', () => {
  for (let lat = -80; lat <= 80; lat += 20)
    for (let lon = -175; lon < 180; lon += 20) {
      const point = map.projectPoint([lon, lat]);
      const inverse = map.unprojectPoint(point.position, point.regionId)[0].position;
      assert.ok(Math.abs(inverse[0] - lon) < 1e-7 && Math.abs(inverse[1] - lat) < 1e-7);
    }
});
test('shared net produces twenty sampling views and a finite chart-local surface', () => {
  const viewport = new OrthographicView({flipY: false}).makeViewport({
    width: 1100,
    height: 800,
    viewState: {target: [0, 0, 0], zoom: 1.5}
  });
  const views = getCutViewports('h3', viewport);
  assert.equal(views.length, 20);
  assert.equal(new Set(views.map(v => v.id)).size, 20);
  const mesh = map.prepareSurface();
  assert.ok(mesh.vertexCount > 10000 && mesh.positions.every(Number.isFinite));
  for (let i = 0; i < mesh.indices.length; i += 3) {
    assert.equal(mesh.partIds[mesh.indices[i]], mesh.partIds[mesh.indices[i + 1]]);
    assert.equal(mesh.partIds[mesh.indices[i]], mesh.partIds[mesh.indices[i + 2]]);
  }
});
test('shared line clipping splits H3 base-cell outlines at every face cut', () => {
  const paths = getH3GridPaths();
  assert.ok(paths.length > 100);
  assert.ok(paths.every(path => path.every(p => p.part === path[0].part)));
});
