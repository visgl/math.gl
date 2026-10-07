// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { interpolateField, sampleAt } from './data.js';
const manifest = JSON.parse(readFileSync(new URL('./data/manifest.json', import.meta.url)));
const packed = readFileSync(new URL('./data/alpine.bin.gz', import.meta.url));
const raw = gunzipSync(packed);
test('the bundled simulation is complete, ordered and pinned to its published source', () => {
  assert.equal(manifest.source.md5, '0b59b7c26bb8d1b1797c9414638a2f32');
  assert.equal(createHash('sha256').update(packed).digest('hex'), manifest.assetSha256);
  assert.equal(raw.byteLength, manifest.width * manifest.height * 2 * (manifest.ages.length + 1));
  assert.equal(manifest.ages.length, 120);
  assert.equal(manifest.ages[0], 119);
  assert.equal(manifest.ages.at(-1), 0);
  manifest.ages.slice(1).forEach((age, i) => assert.equal(age, manifest.ages[i] - 1));
  assert.equal(manifest.source.license, 'CC-BY-4.0');
  assert(manifest.areaKm2[95] > manifest.areaKm2.at(-1));
  assert(manifest.volumeKm3[95] > manifest.volumeKm3.at(-1));
});
test('interpolation preserves snapshots, handles endpoints and never extrapolates', () => {
  const ages = [2, 1, 0],
    data = new Uint16Array([0, 10, 20, 30, 0, 50]);
  assert.deepEqual(Array.from(interpolateField(data, 2, ages, 2)), [0, 10]);
  assert.deepEqual(Array.from(interpolateField(data, 2, ages, 1.5)), [10, 20]);
  assert.deepEqual(Array.from(interpolateField(data, 2, ages, 1)), [20, 30]);
  assert.deepEqual(Array.from(interpolateField(data, 2, ages, 0)), [0, 50]);
  assert.deepEqual(Array.from(interpolateField(data, 2, ages, -10)), [0, 50]);
  assert.deepEqual(sampleAt(ages, 10), { index: 0, fraction: 0 });
});
