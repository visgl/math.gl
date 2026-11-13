// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
  createGlobeMesh,
  getExaggeration,
  elevationColor
} from '../../../../../examples/geospatial/bathymetry/src/mesh.js';

test('exaggeration smoothly decreases to true scale', () => {
  assert.equal(getExaggeration(0), 100);
  assert.equal(getExaggeration(4), 1);
  assert.equal(getExaggeration(8), 1);
  assert.equal(getExaggeration(-1), 100);
  for (let z = 0; z < 4; z += 0.1) assert.ok(getExaggeration(z) >= getExaggeration(z + 0.1));
  assert.equal(getExaggeration(2, 1), 1);
  assert.ok(elevationColor(-6000).every((v, k) => v < elevationColor(-2000)[k]));
});
test('global artifact hash, seam and negative relief', () => {
  const bytes = readFileSync(
    new URL('../../../../../examples/geospatial/bathymetry/assets/etopo1.bin', import.meta.url)
  );
  const provenance = JSON.parse(
    readFileSync(
      new URL(
        '../../../../../examples/geospatial/bathymetry/assets/provenance.json',
        import.meta.url
      )
    )
  );
  assert.equal(createHash('sha256').update(bytes).digest('hex'), provenance.sha256);
  assert.equal(bytes.length, 721 * 361 * 2);
  const heights = Int16Array.from({length: bytes.length / 2}, (_, i) => bytes.readInt16LE(i * 2));
  assert.ok(heights.some(h => h < -8000));
  assert.ok(heights.some(h => h > 5000));
  const mesh = createGlobeMesh(heights, 100);
  assert.ok(mesh.indices.value instanceof Uint32Array);
  assert.ok(mesh.indices.value.some(i => i > 65535));
  const p = mesh.attributes.POSITION.value;
  for (let y = 0; y < 361; y++)
    assert.deepEqual(
      p.slice(y * 721 * 3, y * 721 * 3 + 3),
      p.slice((y * 721 + 720) * 3, (y * 721 + 720) * 3 + 3)
    );
  assert.ok(p.every(Number.isFinite));
});
test('triangle winding points outward and negative heights reduce radius', () => {
  const mesh = createGlobeMesh(new Int16Array(45).fill(-4000), 100, 9, 5);
  const p = mesh.attributes.POSITION.value,
    n = mesh.attributes.NORMAL.value;
  for (let i = 9; i < 36; i++) {
    assert.ok(Math.hypot(...p.slice(i * 3, i * 3 + 3)) < 180);
    assert.ok(p[i * 3] * n[i * 3] + p[i * 3 + 1] * n[i * 3 + 1] + p[i * 3 + 2] * n[i * 3 + 2] > 0);
  }
});

test('flat morph preserves signed relief and unfolds the longitude seam', () => {
  const heights = new Int16Array(45).fill(-4000);
  const globe = createGlobeMesh(heights, 10, 9, 5);
  const flat = createGlobeMesh(heights, 10, 9, 5, globe, {morph: 1});
  const p = flat.attributes.POSITION.value;
  assert.equal(p[0], -180);
  assert.equal(p[8 * 3], 180);
  assert.ok(p[1] > -180, 'Negative relief is below the map plane');
  assert.equal(p[2], -90);
  const mercator = createGlobeMesh(heights, 10, 9, 5, globe, {morph: 1, projection: 'mercator'});
  assert.ok(mercator.attributes.POSITION.value.every(Number.isFinite));
  assert.deepEqual(flat.attributes.COLOR_0.value, globe.attributes.COLOR_0.value);
});

test('refinement cutout is reversible and exact boundary positions are shared', () => {
  const heights = new Int16Array(721 * 361).fill(-4000);
  const base = createGlobeMesh(heights, 100);
  const cutout = createGlobeMesh(heights, 100, 721, 361, base, {cutout: [0, 0, 20, 20]});
  assert.ok(cutout.indices.value.length < base.indices.value.length);
  const restored = createGlobeMesh(heights, 100, 721, 361, cutout);
  assert.deepEqual(restored.indices.value, base.indices.value);
});

test('refined boundaries lie on the coarse edge in globe, intermediate and flat views', async () => {
  const {sampleCoarsePosition} = await import(
    '../../../../../examples/geospatial/bathymetry/src/refinement.js'
  );
  const heights = new Int16Array(721 * 361).fill(-4000);
  const fineHeights = new Int16Array(81 * 81).fill(-6000);
  for (const morph of [0, 0.5, 1]) {
    const coarse = createGlobeMesh(heights, 100, 721, 361, undefined, {morph});
    const fine = createGlobeMesh(fineHeights, 100, 81, 81, undefined, {
      bounds: [0, 0, 20, 20],
      morph,
      boundary: (lon, lat) => sampleCoarsePosition(coarse, lon, lat)
    });
    for (let row = 0; row < 81; row++)
      for (let col = 0; col < 81; col++) {
        if (row !== 0 && col !== 0 && row !== 80 && col !== 80) continue;
        const expected = Float32Array.from(sampleCoarsePosition(coarse, col / 4, row / 4));
        assert.deepEqual(
          fine.attributes.POSITION.value.slice((row * 81 + col) * 3, (row * 81 + col) * 3 + 3),
          expected
        );
      }
  }
});
