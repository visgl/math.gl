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
import {indexMesh, measureProbes} from '../../examples/geospatial/terrain-sampling/src/qualification/diagnostics.mjs';
import {bilinear, triangleHeight} from '../../examples/geospatial/terrain-sampling/src/qualification/qualify.mjs';

const tmp = mkdtempSync(join(tmpdir(), 'terrain-continuous-'));
try {
  const output = join(tmp, 'api.mjs');
  await bundleRuntime(fileURLToPath(new URL('../../', import.meta.url)), './modules/geospatial/src/terrain/index.ts', output);
  const {HeightField, createTerrainMesh, createDelatinTerrainMesh, boundTerrainMeshError} = await import(pathToFileURL(output));
  for (const name of ['pacific', 'sierra']) {
    const dem = JSON.parse(gunzipSync(readFileSync(new URL(
      `../../examples/geospatial/terrain-sampling/src/qualification/artifacts/${name}-20.json.gz`, import.meta.url
    ))));
    const width = 17, height = 17;
    const heights = Array.from({length: width * height}, (_, i) =>
      dem.heights[(88 + Math.floor(i / width)) * dem.width + 88 + i % width]);
    const fixture = {width, height, heights};
    const field = new HeightField({...fixture, heights: Float64Array.from(heights, z => z ?? NaN)});
    const mesh = name === 'pacific' ? createDelatinTerrainMesh(field, {maxError: 20}) : createTerrainMesh(field);
    const index = indexMesh(mesh);
    for (const reference of ['triangle', 'bilinear']) {
      const result = boundTerrainMeshError(field, mesh, {reference, maxDepth: 10, gap: 0.25});
      const probes = [];
      const sample = reference === 'triangle' ? triangleHeight : bilinear;
      for (let y = 0; y < height - 1; y += 1 / 16) {
        for (let x = 0; x < width - 1; x += 1 / 16) {
          const z = sample(fixture, x, y);
          if (Number.isFinite(z)) probes.push([x, y, z]);
        }
      }
      const measured = measureProbes(index, probes);
      assert.ok(measured.covered > 0);
      assert.ok(result.upperBound !== null && result.upperBound + 1e-9 >= measured.maxError);
      assert.ok(result.upperBound < measured.maxError + 40);
      if (result.witness) {
        const [x, y] = result.witness;
        const witness = measureProbes(index, [[x, y, sample(fixture, x, y)]]);
        assert.ok(witness.covered > 0 && witness.maxError + 1e-9 >= result.lowerBound);
      }
      console.log({name, reference, dense: measured.maxError, ...result});
    }
  }
} finally {
  rmSync(tmp, {recursive: true, force: true});
}
