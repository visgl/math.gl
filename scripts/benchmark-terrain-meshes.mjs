// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {readFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {HeightField, createTerrainMesh, createMartiniTerrainMesh, createDelatinTerrainMesh, measureTerrainMeshError} from '@math.gl/geospatial/terrain';

const reference = JSON.parse(readFileSync(new URL('../modules/geospatial/test/terrain/fixtures/n43-reference.json', import.meta.url)));
const results = [];
for (const [fixture, x0, y0] of [['central', 5, 5], ['western-relief', 1, 2], ['eastern-shelf', 22, 4]]) {
const heights = Float64Array.from({length: 81}, (_, i) => reference.heights[(y0 + Math.floor(i / 9)) * 33 + x0 + i % 9] ?? NaN);
if (!heights.every(Number.isFinite)) throw new Error('Benchmark requires complete elevations');
const field = new HeightField({width: 9, height: 9, heights});
for (const [algorithm, create] of [['regular', createTerrainMesh], ['martini', createMartiniTerrainMesh], ['delatin', createDelatinTerrainMesh]]) {
  for (const maxError of algorithm === 'regular' ? [0] : [0, 1, 5]) {
    for (let i = 0; i < 5; i++) create(field, {maxError});
    const times = [];
    let mesh;
    for (let i = 0; i < 25; i++) {
      const start = performance.now();
      mesh = create(field, {maxError});
      times.push(performance.now() - start);
    }
    times.sort((a, b) => a - b);
    results.push({fixture, algorithm, requestedNodalError: maxError, p50Milliseconds: times[12], p95Milliseconds: times[23], triangles: mesh.indices.length / 3, outputBytes: mesh.positions.byteLength + mesh.indices.byteLength + mesh.gridCoordinates.byteLength, ...measureTerrainMeshError(field, mesh)});
  }
}
}
console.log(JSON.stringify({runtime: process.version, platform: process.platform, architecture: process.arch, source: reference.source, sha256: reference.sha256, interpretation: 'three complete 9x9 crops; samples interpreted as vertices', repetitions: 25, warmups: 5, note: 'Output bytes exclude temporary allocations; nodal errors do not certify continuous surface error. Small-crop timings are not regional throughput estimates.', results}, null, 2));
