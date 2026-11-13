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
import {gridDomain, indexMesh, measureCoverage, measureProbes} from '../../examples/geospatial/terrain-sampling/src/qualification/diagnostics.mjs';

const tmp = mkdtempSync(join(tmpdir(), 'terrain-implementation-'));
try {
  const output = join(tmp, 'api.mjs');
  await bundleRuntime(fileURLToPath(new URL('../../', import.meta.url)), './modules/geospatial/src/terrain/index.ts', output);
  const {HeightField, createValidDomainTerrainMesh} = await import(pathToFileURL(output));
  for (const maxError of [10, 20, 40]) {
    const fixture = JSON.parse(gunzipSync(readFileSync(new URL(`../../examples/geospatial/terrain-sampling/src/qualification/artifacts/sierra-${maxError}.json.gz`, import.meta.url))));
    const field = new HeightField({...fixture, heights: Float64Array.from(fixture.heights, h => h ?? NaN)});
    const mesh = createValidDomainTerrainMesh(field, {maxError});

    const index = indexMesh(mesh);
    const coverage = measureCoverage(index, {...fixture, contains: gridDomain(fixture, 'triangles')});
    assert.equal(coverage.missingArea, 0);
    assert.equal(coverage.excessArea, 0);
    assert.equal(coverage.overlapArea, 0);
    const nodes = fixture.heights.flatMap((z, i) => z === null ? [] : [[i % field.width, Math.floor(i / field.width), z]]);
    const error = measureProbes(index, nodes);
    assert.equal(error.uncovered, 0);
    assert.ok(error.maxError <= maxError + 1e-8);
    assert.ok(mesh.indices.length / 3 < 119560);
    console.log({maxError, triangles: mesh.indices.length / 3, error: error.maxError, coverage});
  }
} finally {
  rmSync(tmp, {recursive: true, force: true});
}
