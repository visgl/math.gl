// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {HeightField, createTerrainRegionalWatersheds} from '@math.gl/geospatial/terrain';

const fixture = JSON.parse(
  readFileSync(
    new URL(
      '../examples/geospatial/terrain-sampling/src/assets/sierra-watershed.json',
      import.meta.url
    )
  )
);
const samples = Float64Array.from(fixture.heights, value => value ?? NaN);
const size = 8;
const tiles = [];
for (let row = 0; row < fixture.height; row += size) {
  for (let column = 0; column < fixture.width; column += size) {
    tiles.push({
      column,
      row,
      field: new HeightField({
        width: size,
        height: size,
        registration: 'cell',
        origin: [column, row],
        heights: samples,
        offset: row * fixture.width + column,
        stride: fixture.width
      })
    });
  }
}
const outlet = samples.findIndex(Number.isFinite);
assert(outlet >= 0);
const options = {width: fixture.width, height: fixture.height, origin: [0, 0], outlets: [outlet]};
const reference = createTerrainRegionalWatersheds(tiles, options);
const results = [];
for (const [width, height] of [
  [fixture.width, fixture.height],
  [128, 128],
  [256, 256],
  [512, 512],
  [1024, 1024]
]) {
  const times = [];
  /** Translate fixture indices to the larger row stride and preserve negative sentinels. */
  const mapIndex = index =>
    index < 0 ? index : Math.floor(index / fixture.width) * width + (index % fixture.width);
  let result;
  for (let i = 0; i < 15; i++) {
    const start = performance.now();
    result = createTerrainRegionalWatersheds(tiles, {
      ...options,
      width,
      height,
      outlets: [mapIndex(outlet)]
    });
    if (i >= 5) times.push(performance.now() - start);
  }
  for (let i = 0; i < samples.length; i++) {
    const column = i % fixture.width;
    const row = Math.floor(i / fixture.width);
    const index = mapIndex(i);
    assert.equal(result.field.getHeight(column, row), reference.field.getHeight(column, row));
    assert.equal(result.receiver[index], mapIndex(reference.receiver[i]));
    assert.equal(result.terminal[index], mapIndex(reference.terminal[i]));
    assert.equal(result.contributingCells[index], reference.contributingCells[i]);
    assert.equal(result.coverage[index], reference.coverage[i]);
  }
  const buffers = [
    ...Object.values(result.field.copyData()),
    result.coverage,
    result.touchesUnknown,
    result.receiver,
    result.terminal,
    result.contributingCells
  ];
  times.sort((a, b) => a - b);
  results.push({
    width,
    height,
    cells: width * height,
    residentCells: samples.length,
    retainedBufferBytes: buffers.reduce((bytes, buffer) => bytes + buffer.byteLength, 0),
    medianMs: (times[4] + times[5]) / 2
  });
}
console.log(JSON.stringify({node: process.version, platform: process.platform, results}, null, 2));
