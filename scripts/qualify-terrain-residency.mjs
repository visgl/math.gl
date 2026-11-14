// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {createTerrainMixedVertexTileHalos, updateTerrainMixedVertexTileHalos} from '../modules/geospatial/dist/terrain/index.js';

const folder = new URL('../modules/geospatial/test/terrain/fixtures/', import.meta.url);
const key = t => `${t.spacing}/${t.column}/${t.row}`;
const p95 = times => [...times].sort((a, b) => a - b)[Math.ceil(times.length * .95) - 1];
for (const name of ['pacific', 'sierra-nodata']) {
  const dem = JSON.parse(readFileSync(new URL(`${name}-streaming.json`, folder)));
  const raw = readFileSync(new URL(`${name.split('-')[0]}.tif`, folder));
  assert.equal(createHash('sha256').update(raw).digest('hex'), dem.sha256);
  const tile = (column, row, spacing) => {
    const width = 33;
    const heights = Float64Array.from({length: width * width}, (_, i) =>
      dem.heights[(row + Math.floor(i / width) * spacing) * dem.width + column + (i % width) * spacing] ?? NaN
    );
    return {column, row, spacing, field: {
      width, height: width, heights, registration: 'vertex', heightReference: dem.heightReference,
      origin: [column, row], columnStep: [spacing, 0], rowStep: [0, spacing]
    }};
  };
  const coarse = [tile(0, 0, 4), tile(128, 0, 4), tile(0, 128, 4), tile(128, 128, 4)];
  const fine = Array.from({length: 16}, (_, i) => tile(64 + (i % 4) * 32, 64 + Math.floor(i / 4) * 32, 1));
  const anchor = coarse[0];
  let resident = coarse.slice();
  let state = updateTerrainMixedVertexTileHalos(null, resident);
  const times = [], fullTimes = [];
  let rebuiltBytes = 0, fullBytes = 0, negativeSamples = 0, nodataSamples = 0;
  const bytes = t => t.field.heights.byteLength + t.field.validity.byteLength + t.statuses.byteLength;
  for (const incoming of [...fine, ...fine.slice().reverse(), anchor, anchor]) {
    resident = resident.includes(incoming) ? resident.filter(t => t !== incoming) : [...resident, incoming];
    const prior = new Map(state.tiles.map(t => [key(t), t]));
    let start = performance.now();
    state = updateTerrainMixedVertexTileHalos(state, resident);
    times.push(performance.now() - start);
    start = performance.now();
    const full = createTerrainMixedVertexTileHalos(resident.slice().reverse());
    fullTimes.push(performance.now() - start);
    assert.deepEqual(state.tiles, full.tiles);
    for (const t of state.tiles) {
      if (state.rebuilt.includes(key(t))) rebuiltBytes += bytes(t);
      else assert.equal(t, prior.get(key(t)));
      fullBytes += bytes(t);
      negativeSamples += t.field.heights.reduce((n, z, i) => n + Number(t.field.validity[i] && z < 0), 0);
      nodataSamples += t.statuses.reduce((n, status) => n + Number(status === 1), 0);
    }
  }
  if (name === 'pacific') assert.ok(negativeSamples > 0, 'Pacific replay must include valid bathymetry');
  if (name === 'sierra-nodata') assert.ok(nodataSamples > 0, 'Sierra replay must include resident nodata');
  console.log(JSON.stringify({name, source: dem.source, sha256: dem.sha256, steps: times.length,
    incrementalP95Ms: p95(times), fullP95Ms: p95(fullTimes), rebuiltBytes, fullBytes,
    negativeSamples, nodataSamples, peakProcessRssKiB: process.resourceUsage().maxRSS}));
}
