// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadPaleoTerrain, terrainBracket, validateTerrainManifest} from './paleodem.js';

const manifest = JSON.parse(await readFile(new URL('./test-data/paleodem-manifest.json', import.meta.url)));
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

test('terrain brackets retain source ages, exact endpoints and interpolation direction', () => {
  assert.deepEqual(terrainBracket(-302), {younger: 300, older: 305, blend: .4});
  assert.deepEqual(terrainBracket(-540), {younger: 540, older: 540, blend: 0});
  assert.deepEqual(terrainBracket(0), {younger: 0, older: 0, blend: 0});
  for (const time of [-541, 1, NaN, Infinity]) assert.equal(terrainBracket(time), null);
});

test('manifest preserves both grid shapes and rejects convention/provenance changes', () => {
  assert.equal(validateTerrainManifest(manifest), manifest);
  assert.deepEqual([...new Set(manifest.rowGroups.map(g => g.width))].sort(), [360, 361]);
  for (const change of [m => {m.license = 'MIT';}, m => {m.rowGroups[0].ageMa = 1;},
    m => {m.rowGroups[30].bbox[1] = -90;}, m => {m.files[0].bytes++;}]) {
    const copy = structuredClone(manifest);change(copy);
    assert.throws(() => validateTerrainManifest(copy));
  }
});

test('decode selects elevation only, publishes complete frames and reprioritizes a seek', async () => {
  const abort = new AbortController(), requests = [], gates = [];
  const terrain = await loadPaleoTerrain({signal: abort.signal,
    fetchFile: async () => Response.json(manifest),
    async *readBatches(_url, options) {
      requests.push(options);
      await new Promise(resolve => gates.push(resolve));
      options.signal.throwIfAborted();
      const length = manifest.rowGroups[options.rowGroups[0]].rows;
      for (const count of [length - 1, 1]) yield {data: {
        getChild(name) {assert.equal(name, 'elevation_m');return {length: count, get: () => 250};}
      }};
    }
  });
  assert.equal(terrain.get(-300), null);
  assert.deepEqual(requests[0].columns, ['elevation_m']);
  assert.deepEqual(requests[0].rowGroups, [60]);
  assert.equal(terrain.get(-10), null); // Seek while the first decode is pending.
  gates.shift()();await tick();
  assert.deepEqual(requests[1].rowGroups, [2]);
  gates.shift()();await tick();
  const pose = terrain.get(-10);
  assert.equal(pose.a, pose.b);
  assert.equal(pose.a.elevation.length, manifest.rowGroups[2].rows);
  assert.equal(pose.a.elevation.at(-1), 250);
  assert.equal(terrain.get(-9), null); // Never relabel the 10 Ma grid as another age.
  abort.abort();gates.shift()?.();await tick();
});

test('truncated grids are not exposed and a failure leaves the fallback available', async () => {
  const controller = new AbortController();let error;
  const terrain = await loadPaleoTerrain({signal: controller.signal,
    fetchFile: async () => Response.json(manifest), onUpdate: value => {error = value;},
    async *readBatches() {yield {data: {getChild: () => ({length: 1, get: () => 10})}};}
  });
  assert.equal(terrain.get(-540), null);await tick();
  assert.equal(terrain.failed, true);
  assert.match(error.message, /Incomplete/);
  assert.equal(terrain.get(-540), null);
  controller.abort();
});
