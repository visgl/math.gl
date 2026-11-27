// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {mkdtempSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {gunzipSync} from 'node:zlib';
import {bundleRuntime} from '../../modules/geospatial/scripts/projection/benchmark-runtime.mjs';

const tmp = mkdtempSync(join(tmpdir(), 'terrain-coverage-'));
try {
  const output = join(tmp, 'api.mjs');
  await bundleRuntime(fileURLToPath(new URL('../../', import.meta.url)), './modules/geospatial/src/terrain/index.ts', output);
  const api = await import(pathToFileURL(output));
  const {HeightField, certifyTerrainMeshCoverage: certify, createTerrainMesh} = api;
  const field = new HeightField({width: 2, height: 2, heights: new Float64Array(4)});
  const base = createTerrainMesh(field);
  assert.equal(certify(field, base).status, 'certified');
  assert.equal(certify(field, base, {maxTriangles: 1}).status, 'budget-exhausted');
  assert.equal(certify(field, {...base, indices: [0,1,2,0,1,2]}).status, 'mismatch');
  const split = {gridCoordinates: [0,0,1,0,0,1,1,1,0.5,0], indices: [0,4,2,4,1,2,1,3,2]};
  assert.equal(certify(field, split).status, 'certified');
  assert.equal(certify(field, base, {reference: split}).status, 'certified');
  split.gridCoordinates[9] = Number.MIN_VALUE;
  assert.equal(certify(field, split).status, 'mismatch');

  for (const name of ['pacific', 'sierra']) for (const tolerance of [10, 20, 40]) {
    const fixture = JSON.parse(gunzipSync(readFileSync(new URL(
      `../../examples/geospatial/terrain-sampling/src/qualification/artifacts/${name}-${tolerance}.json.gz`, import.meta.url
    ))));
    const dem = new HeightField({...fixture, heights: Float64Array.from(fixture.heights, h => h ?? NaN)});
    const mesh = name === 'pacific' ? api.createBreaklineTerrainMesh(dem, {
      maxError: tolerance, breaklines: fixture.segments, breaklinesOverrideSamples: true
    }) : api.createValidDomainTerrainMesh(dem, {maxError: tolerance});
    const result = certify(dem, mesh);
    assert.equal(result.status, 'certified', JSON.stringify(result));
    assert.equal(certify(dem, {...mesh, indices: mesh.indices.slice(3)}).status, 'mismatch');
    const fourCorners = certify(dem, mesh, {reference: 'bilinear'});
    assert.equal(fourCorners.status, name === 'sierra' ? 'mismatch' : 'certified');
    console.log({name, tolerance, result, fourCorners});
  }
} finally {
  rmSync(tmp, {recursive: true, force: true});
}
