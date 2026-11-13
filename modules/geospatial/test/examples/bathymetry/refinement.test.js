// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  selectRefinement,
  decodeTerrarium,
  sampleCoarsePosition
} from '../../../../../examples/geospatial/bathymetry/src/refinement.js';

test('negative depth decoding preserves sub-meter precision', () => {
  assert.equal(decodeTerrarium(128, 0, 0), 0);
  assert.equal(decodeTerrarium(112, 96, 128), -3999.5);
});
test('zoom selects progressively finer bounded requests, including date line and polar views', () => {
  assert.equal(selectRefinement(0, 0, 1), null);
  let last = Infinity;
  for (const z of [2, 3, 4]) {
    const request = selectRefinement(-160, 12, z);
    const spacing = (request.bounds[2] - request.bounds[0]) / (request.size - 1);
    assert.ok(spacing < last);
    last = spacing;
    assert.equal(
      (request.bounds[2] - request.bounds[0]) / 0.5,
      Math.round((request.bounds[2] - request.bounds[0]) / 0.5)
    );
  }
  for (const lon of [-540, -180, 179, 540])
    for (const lat of [-90, 0, 90]) {
      const {bounds} = selectRefinement(lon, lat, 4);
      assert.ok(bounds[0] >= -180 && bounds[2] <= 180 && bounds[1] >= -80 && bounds[3] <= 80);
    }
});
test('coarse edge interpolation retains exact vertices and line segments', () => {
  const p = new Float32Array(721 * 361 * 3);
  const offset = (180 * 721 + 360) * 3;
  p.set([10, 20, 30], offset);
  p.set([20, 40, 60], offset + 3);
  const mesh = {attributes: {POSITION: {value: p}}};
  assert.deepEqual(sampleCoarsePosition(mesh, 0, 0), [10, 20, 30]);
  assert.deepEqual(sampleCoarsePosition(mesh, 0.25, 0), [15, 30, 45]);
});

test('Mercator focus roundtrips to the geographic refinement latitude', async () => {
  const {mapLatitude, geographicLatitude} = await import(
    '../../../../../examples/geospatial/bathymetry/src/refinement.js'
  );
  for (const latitude of [-80, -45, 0, 45, 80]) {
    assert.ok(
      Math.abs(geographicLatitude(mapLatitude(latitude, 'mercator'), 'mercator') - latitude) < 1e-10
    );
  }
});

test('multiple globe turns preserve the flat map focus longitude', async () => {
  const {normalizeLongitude} = await import(
    '../../../../../examples/geospatial/bathymetry/src/refinement.js'
  );
  for (const longitude of [-160, -30, 80, 100]) {
    assert.equal(normalizeLongitude(longitude + 720), longitude);
    assert.equal(normalizeLongitude(longitude - 1080), longitude);
  }
});
