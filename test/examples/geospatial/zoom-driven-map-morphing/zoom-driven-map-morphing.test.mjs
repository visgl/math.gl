// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {
  createMorphProjection,
  createSurfaceMesh,
  getGlobeToMercatorTransition,
  getMorphScale
} from '../../../../examples/geospatial/zoom-driven-map-morphing/src/projection.mjs';

// Fixed outputs from the retired prototype guard the visual behavior during the port.
const fixtures = JSON.parse(readFileSync(new URL('./zoom-driven-map-morphing.json', import.meta.url)));
for (const {center: [longitude, latitude], progress, positions} of fixtures) {
  test(`morph at ${longitude}, ${latitude}, progress ${progress} preserves prototype positions`, () => {
    const projection = createMorphProjection({longitude, latitude, progress});
    for (const {point, expected} of positions) {
      const output = [];
      assert.equal(projection.project(point, output), output);
      for (let axis = 0; axis < 3; axis++) {
        assert.ok(Math.abs(output[axis] - expected[axis]) < 1e-7,
          `${point}, axis ${axis}: ${output[axis]} versus ${expected[axis]}`);
      }
    }
  });
}

test('zoom transition clamps and eases across the configured interval', () => {
  const interval = {startZoom: 4, endZoom: 6};
  for (const [zoom, expected] of [[0, 0], [4, 0], [4.5, 0.15625], [5, 0.5], [6, 1], [8, 1]]) {
    assert.equal(getGlobeToMercatorTransition(zoom, interval), expected);
  }
  assert.throws(() => getGlobeToMercatorTransition(NaN, interval), RangeError);
  assert.throws(() => getGlobeToMercatorTransition(5, {startZoom: 6, endZoom: 4}), RangeError);
});

test('the view center stays at the origin and longitude wraps at the opposite meridian', () => {
  for (const progress of [0, 0.25, 1]) {
    const projection = createMorphProjection({longitude: 179, latitude: 25, progress});
    for (const value of projection.project([179, 25])) assert.ok(Math.abs(value) < 1e-7);
    assert.deepEqual(projection.project([-179, 40]), projection.project([181, 40]));
    const west = projection.project([-1, 0]);
    const east = projection.project([359, 0]);
    assert.deepEqual(west, east);
    if (progress === 1) assert.ok(west[0] < 0);
  }
});

test('pure globe accepts the poles while a Mercator blend enforces its latitude cap', () => {
  const globe = createMorphProjection({longitude: 0, latitude: 90, progress: 0});
  assert.ok(globe.project([0, -90]).every(Number.isFinite));
  assert.throws(() => createMorphProjection({longitude: 0, latitude: 90, progress: 0.5}), RangeError);
  const blend = createMorphProjection({longitude: 0, latitude: 0, progress: 0.5});
  for (const point of [[0, 90], [0, -86], [NaN, 0], [0, 0, Infinity]]) {
    assert.throws(() => blend.project(point), RangeError);
  }
  for (const options of [
    {longitude: Infinity, latitude: 0, progress: 0},
    {longitude: 0, latitude: 91, progress: 0},
    {longitude: 0, latitude: 0, progress: -0.1},
    {longitude: 0, latitude: 0, progress: 1.1}
  ]) assert.throws(() => createMorphProjection(options), RangeError);
});


test('panning a pure globe preserves its screen radius at every center latitude', () => {
  for (const latitude of [-80, -60, 0, 25, 60, 80, 90]) {
    const projection = createMorphProjection({longitude: 0, latitude, progress: 0});
    const scale = getMorphScale({zoom: 2, latitude, progress: 0});
    const screenRadius = projection.project([90, 0])[0] * scale;
    assert.ok(Math.abs(screenRadius - 2048 / (2 * Math.PI)) < 1e-7);
  }
});

test('flat map keeps its longitude scale and the latitude compensation blends smoothly', () => {
  for (const latitude of [-80, 0, 25, 60, 80]) {
    const projection = createMorphProjection({longitude: 0, latitude, progress: 1});
    const flatScale = getMorphScale({zoom: 2, latitude, progress: 1});
    const screenDegree = projection.project([1, latitude])[0] * flatScale;
    assert.ok(Math.abs(screenDegree - 2048 / 360) < 1e-7);
    const globeScale = getMorphScale({zoom: 2, latitude, progress: 0});
    const halfway = getMorphScale({zoom: 2, latitude, progress: 0.5});
    assert.ok(Math.abs(halfway - (globeScale + flatScale) / 2) < 1e-12);
  }
});


test('surface triangles cover the entire longitude range without crossing texture banks', () => {
  for (const longitude of [-540, -190, -30, 0, 0.001, 179, 180, 540]) {
    const mesh = createSurfaceMesh({longitude, project: ([lon, lat]) => [lon, lat, 0]});
    let area = 0;
    for (let i = 0; i < mesh.indices.length; i += 3) {
      const [a, b, c] = mesh.indices.slice(i, i + 3);
      const x = index => mesh.positions[3 * index];
      const y = index => mesh.positions[3 * index + 1];
      area += ((x(b) - x(a)) * (y(c) - y(a)) - (x(c) - x(a)) * (y(b) - y(a))) / 2;
      const u = [a, b, c].map(index => mesh.texCoords[2 * index]);
      assert.ok(Math.min(...u) >= 0 && Math.max(...u) <= 1);
      assert.ok(Math.max(...u) - Math.min(...u) < 0.01);
    }
    assert.ok(Math.abs(area - 359.998 * 170) < 1e-6, `missing surface area at center ${longitude}`);
  }
});

test('both texture banks meet at identical projected positions throughout the morph', () => {
  for (const longitude of [-190, -30, 179, 540]) {
    for (const progress of [0, 0.5, 1]) {
      const projection = createMorphProjection({longitude, latitude: 25, progress});
      const mesh = createSurfaceMesh({longitude, project: point => projection.project(point)});
      const west = [];
      const east = [];
      for (let i = 0; i < mesh.texCoords.length / 2; i++) {
        const u = mesh.texCoords[2 * i];
        if (u === 1) west.push(Array.from(mesh.positions.slice(3 * i, 3 * i + 3)));
        if (u === 0) east.push(Array.from(mesh.positions.slice(3 * i, 3 * i + 3)));
      }
      assert.equal(west.length, 87);
      assert.deepEqual(west, east);
    }
  }
});
