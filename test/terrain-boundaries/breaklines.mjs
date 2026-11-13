// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {readFileSync, mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {gunzipSync} from 'node:zlib';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {bundleRuntime} from '../../modules/geospatial/scripts/projection/benchmark-runtime.mjs';
import {indexMesh, measureBoundaries, measureProbes} from '../../examples/geospatial/terrain-sampling/src/qualification/diagnostics.mjs';

const tmp = mkdtempSync(join(tmpdir(), 'terrain-implementation-'));
try {
  const output = join(tmp, 'api.mjs');
  await bundleRuntime(fileURLToPath(new URL('../../', import.meta.url)), './modules/geospatial/src/terrain/index.ts', output);
  const {HeightField, createBreaklineTerrainMesh} = await import(pathToFileURL(output));
  for (const [name, maxError] of [['pacific', 10], ['pacific', 20], ['pacific', 40], ['step', 0.25], ['step', 0.5], ['step', 1], ['step', 2]]) {
    const fixture = JSON.parse(gunzipSync(readFileSync(new URL(
      `../../examples/geospatial/terrain-sampling/src/qualification/artifacts/${name}-${maxError}.json.gz`, import.meta.url
    ))));
    const field = new HeightField({...fixture, heights: Float64Array.from(fixture.heights)});
    const mesh = createBreaklineTerrainMesh(field, {
      maxError, breaklines: fixture.segments, breaklinesOverrideSamples: true
    });
    const index = indexMesh(mesh);
    const boundary = measureBoundaries(index, fixture.segments);
    assert.equal(boundary.crossingTriangles.length, 0);
    assert.ok(boundary.uncoveredLength < 1e-8);
    assert.ok(boundary.maxHeightError < 1e-8);
    const nodes = fixture.heights.flatMap((z, i) =>
      fixture.mask[i] ? [[i % field.width, Math.floor(i / field.width), z]] : []);
    const error = measureProbes(index, nodes);
    assert.equal(error.uncovered, 0);
    assert.ok(error.maxError <= maxError + 1e-8);
    console.log({name, maxError, triangles: mesh.indices.length / 3, error: error.maxError, overridden: mesh.overriddenSamples});
  }
} finally {
  rmSync(tmp, {recursive: true, force: true});
}
