// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {HeightField, createTerrainContours, weldTerrainContourTiles, stitchTerrainContours} from '@math.gl/geospatial/terrain';

// Use the pinned redistributable DTED fixture; inputs are prepared outside timed regions.
const reference = JSON.parse(readFileSync(new URL('../modules/geospatial/test/terrain/fixtures/n43-reference.json', import.meta.url), 'utf8'));
const heights = Float64Array.from(reference.heights, value => value ?? NaN);
const levels = [200, 300, 400, 500];
const results = [17, 9, 5].map(size => {
  const step = size - 1, across = 32 / step;
  const fields = Array.from({length: across * across}, (_, i) => {
    const column = i % across, row = Math.floor(i / across);
    return {column, row, field: new HeightField({width: size, height: size,
      heights: Float64Array.from({length: size * size}, (_, j) => heights[(row * step + Math.floor(j / size)) * 33 + column * step + j % size]),
      origin: [column * step * reference.columnStep[0], row * step * reference.rowStep[1]], columnStep: reference.columnStep, rowStep: reference.rowStep})};
  });
  const samples = {contour: [], weld: [], trace: []};
  let segments = 0, paths = 0, bytes = 0;
  for (let iteration = 0; iteration < 25; iteration++) {
    let start = performance.now();
    const tiles = fields.map(({column, row, field}) => ({column, row, contours: createTerrainContours(field, levels)}));
    let elapsed = performance.now() - start;
    if (iteration >= 5) samples.contour.push(elapsed);
    start = performance.now();
    const contours = weldTerrainContourTiles(tiles, {width: size, height: size, maxPositionDifference: 1e-8});
    elapsed = performance.now() - start;
    if (iteration >= 5) samples.weld.push(elapsed);
    start = performance.now();
    const traced = stitchTerrainContours(contours);
    elapsed = performance.now() - start;
    if (iteration >= 5) samples.trace.push(elapsed);
    segments = contours.levelIndices.length;
    paths = traced.levelIndices.length;
    bytes = contours.positions.byteLength + contours.gridCoordinates.byteLength + contours.segments.byteLength + contours.levelIndices.byteLength;
  }
  const timings = Object.fromEntries(Object.entries(samples).map(([name, values]) => {
    values.sort((a, b) => a - b);
    return [name, {p50ms: values[Math.ceil(values.length * 0.5) - 1], p95ms: values[Math.ceil(values.length * 0.95) - 1]}];
  }));
  return {tileSize: size, tiles: fields.length, segments, paths, graphBytes: bytes, timings};
});
console.log(JSON.stringify({fixture: reference.source, sampleGrid: '33x33', levels, warmup: 5, iterations: 20, results}, null, 2));
