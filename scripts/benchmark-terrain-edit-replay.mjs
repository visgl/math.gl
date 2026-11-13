// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {HeightField, updateTerrainMeshRegions} from '../modules/geospatial/dist/terrain/index.js';

const quantile = (values, p) => [...values].sort((a,b)=>a-b)[Math.ceil(values.length*p)-1];
function replay(width, radius) {
  const options = {cellsPerRegion: 32};
  const heights = Float64Array.from({length: width * width}, (_, i) =>
    Math.sin((i % width) / 13) * 40 + Math.cos(Math.floor(i / width) / 17) * 25
  );
  const field = () => new HeightField({width, height: width, heights});
  let state = updateTerrainMeshRegions(null, field(), [], options);
  const times = [], fullTimes = [];
  let rebuilt = 0, outputBytes = 0, fullOutputBytes = 0;
  for (let k = 0; k < 9; k++) {
    const minColumn = (k * 41 + 31) % (width - radius), minRow = (k * 67 + 31) % (width - radius);
    const dirty = {minColumn,minRow,maxColumn:minColumn+radius-1,maxRow:minRow+radius-1};
    for (let y = minRow; y <= dirty.maxRow; y++)
      for (let x = minColumn; x <= dirty.maxColumn; x++) heights[y*width+x] += 1;
    const next = field();
    let start = performance.now();
    const updated = updateTerrainMeshRegions(state, next, [dirty], options);
    const elapsed = performance.now() - start;
    start = performance.now();
    const full = updateTerrainMeshRegions(null, next, [], options);
    const fullElapsed = performance.now() - start;
    for (let i = 0; i < full.regions.length; i++) {
      const a = updated.regions[i].data, b = full.regions[i].data;
      assert.deepEqual(a.positions,b.positions);
      assert.deepEqual(a.indices,b.indices);
      assert.deepEqual(a.gridCoordinates,b.gridCoordinates);
      if (k && a !== state.regions[i].data) {
        rebuilt++;
        outputBytes += a.positions.byteLength + a.indices.byteLength + a.gridCoordinates.byteLength;
      }
      if (k) fullOutputBytes += b.positions.byteLength + b.indices.byteLength + b.gridCoordinates.byteLength;
    }
    if (k) {times.push(elapsed); fullTimes.push(fullElapsed);}
    state = updated;
  }
  return {width, dirtySamples:radius*radius, steps:times.length, regions:state.regions.length, rebuilt,
    outputBytes, fullOutputBytes,
    incrementalMs:{p50:quantile(times,.5),p95:quantile(times,.95)},
    fullMs:{p50:quantile(fullTimes,.5),p95:quantile(fullTimes,.95)}};
}
const results = [];
for (const width of [129,257,513]) for (const radius of [1,17]) results.push(replay(width,radius));
console.log(JSON.stringify({runtime:process.version, platform:`${process.platform}/${process.arch}`,
  processPeakRssKiB:process.resourceUsage().maxRSS,
  scope:'Synthetic terrain; one warm-up per case. Timings exclude field construction and verification. Output bytes measure new mesh buffers; peak RSS is process-wide.', results},null,2));
