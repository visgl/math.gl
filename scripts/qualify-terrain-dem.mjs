// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {HeightField} from '../modules/geospatial/dist/terrain/index.js';
import {createTerrainGradientGrid} from '../modules/geospatial/dist/terrain/derivatives.js';
import {createTerrainSlopeAspectGrid} from '../modules/geospatial/dist/terrain/slope-aspect.js';
import {createMartiniTerrainMesh} from '../modules/geospatial/dist/terrain/martini.js';
import {createDelatinTerrainMesh} from '../modules/geospatial/dist/terrain/delatin.js';

const directory = new URL('../modules/geospatial/test/terrain/fixtures/', import.meta.url);
const fixture = JSON.parse(readFileSync(new URL('n43-reference.json', directory), 'utf8'));
assert.equal(createHash('sha256').update(readFileSync(new URL('n43.dt0', directory))).digest('hex'), fixture.sha256);
const field = new HeightField({...fixture, heights: Float64Array.from(fixture.heights, x => x ?? NaN)});
const analysis = [];
for (const [method, name] of [['horn', 'Horn'], ['zevenbergen-thorne', 'ZevenbergenThorne']]) {
  const result = createTerrainSlopeAspectGrid(createTerrainGradientGrid(field, {method}));
  let compared = 0, maxSlopeErrorDegrees = 0, maxAspectErrorDegrees = 0;
  for (let i = 0; i < fixture.heights.length; i++) {
    const expected = fixture.references[name];
    assert.equal(result.statuses[i] === 0, expected.slope[i] !== null);
    if (expected.slope[i] === null) continue;
    compared++;
    maxSlopeErrorDegrees = Math.max(maxSlopeErrorDegrees, Math.abs(result.slopes[i] * 180 / Math.PI - expected.slope[i]));
    assert.equal(result.aspectStatuses[i] === 0, expected.aspect[i] !== null);
    if (expected.aspect[i] !== null) {
      const delta = Math.abs(result.aspects[i] * 180 / Math.PI - expected.aspect[i]);
      maxAspectErrorDegrees = Math.max(maxAspectErrorDegrees, Math.min(delta, 360 - delta));
    }
  }
  assert(maxSlopeErrorDegrees < 2e-6); assert(maxAspectErrorDegrees < 4e-5);
  analysis.push({method, compared, maxSlopeErrorDegrees, maxAspectErrorDegrees});
}
const crop = new HeightField({width: 9, height: 9, heights: Float64Array.from({length: 81}, (_, i) => fixture.heights[(5 + Math.floor(i / 9)) * fixture.width + 5 + i % 9])});
const meshing = [];
for (const [backend, create] of [['martini', createMartiniTerrainMesh], ['delatin', createDelatinTerrainMesh]]) {
  for (const maxError of [0, 1, 5]) {
    const times = []; let mesh;
    for (let i = 0; i < 21; i++) {
      const start = performance.now(); mesh = create(crop, {maxError});
      if (i > 0) times.push(performance.now() - start);
    }
    times.sort((a, b) => a - b);
    meshing.push({backend, maxError, measuredNodalError: mesh.error.maxSampleError, triangles: mesh.indices.length / 3, outputBytes: mesh.positions.byteLength + mesh.indices.byteLength + mesh.gridCoordinates.byteLength, p50Milliseconds: times[9], p95Milliseconds: times[18]});
  }
}
console.log(JSON.stringify({source: fixture.source, sha256: fixture.sha256, oracle: `GDAL ${fixture.gdalVersion}`, runtime: process.version, platform: `${process.platform}/${process.arch}`, analysis, meshing, scope: 'One low-relief DEM and a 9x9 meshing crop. Warm microbenchmarks, not regional performance qualification or continuous error bounds.'}, null, 2));
